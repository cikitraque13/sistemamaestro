"""Focused J05-V3 tests using a fake provider and local project stubs only."""
import json
from copy import deepcopy
from types import SimpleNamespace
from unittest import IsolatedAsyncioTestCase, TestCase
from unittest.mock import AsyncMock, patch

import test_consumption_callers as f
from backend.app.services import project_memory_conflicts as memory_review


REVISION = "2026-10-16T12:00:00+00:00"


def project_fixture():
    return {
        "project_id": "project_test",
        "user_id": "user_test",
        "updated_at": REVISION,
        "refine_questions": [
            {"id": "q_goal", "question": "What will the project do?"},
            {"id": "q_audience", "question": "Who is the audience?"},
        ],
        "refine_answers": {"q_goal": "synthetic goal", "q_audience": "synthetic audience"},
    }


def provider_result(groups=None):
    return json.dumps({
        "reviewed_labels": ["answer_1", "answer_2"],
        "groups": groups or [],
    })


class ClassifierValidationTests(TestCase):
    def test_rejects_missing_duplicate_unknown_overlapping_and_extra_fields(self):
        labels = ["answer_1", "answer_2", "answer_3"]
        invalid = [
            {"reviewed_labels": ["answer_1"], "groups": []},
            {"reviewed_labels": labels + ["answer_1"], "groups": []},
            {"reviewed_labels": labels, "groups": [{
                "kind": "conflict", "labels": ["answer_1", "unknown"],
                "reason_code": "same_scope_incompatible",
            }]},
            {"reviewed_labels": labels, "groups": [
                {"kind": "conflict", "labels": ["answer_1", "answer_2"],
                 "reason_code": "same_scope_incompatible"},
                {"kind": "uncertain", "labels": ["answer_2", "answer_3"],
                 "reason_code": "scope_or_time_unclear"},
            ]},
            {"reviewed_labels": labels, "groups": [], "extra": True},
            {"reviewed_labels": labels, "groups": [{
                "kind": "conflict", "labels": ["answer_1", "answer_2"],
                "reason_code": "scope_or_time_unclear",
            }]},
        ]
        for result in invalid:
            with self.subTest(result=result):
                with self.assertRaises(memory_review.MemoryReviewError) as error:
                    memory_review._validate_result(json.dumps(result), labels)
                self.assertEqual(error.exception.code, "memory_review_invalid_result")

    def test_rejects_unmapped_history_without_mutating_project(self):
        project = project_fixture()
        project["refine_answers"]["legacy_key"] = "keep byte-for-byte"
        before = deepcopy(project)
        with self.assertRaises(memory_review.MemoryReviewError) as error:
            memory_review._review_items(project)
        self.assertEqual(error.exception.code, "memory_review_legacy_unmapped")
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(error.exception.question_ids, ("legacy_key",))
        self.assertEqual(project, before)

    def test_rate_record_enforces_fixed_model_budget(self):
        self.assertEqual(memory_review.MODEL_RATE_RECORD["model"], memory_review.MODEL)
        self.assertLess(memory_review._max_cost(), memory_review.MAX_ATTEMPT_COST_USD)

    def test_semantic_edge_case_fixtures_document_classifier_limits(self):
        """Synthetic classifier outputs exercise fail-closed behavior, not accuracy.

        These examples document likely false-positive and false-negative patterns.
        They are protocol fixtures, not measurements of model precision/recall and
        do not imply perfect semantic conflict detection.
        """
        examples = (
            # A classifier may overread an implicit scope difference.
            ("implicit_scope_false_positive", "uncertain", ["answer_1", "answer_2"],
             "scope_or_time_unclear"),
            # Negation can be misread when each answer has different context.
            ("negation_false_positive", "uncertain", ["answer_1", "answer_2"],
             "scope_or_time_unclear"),
            # Synonyms may be judged inconsistent despite equivalent intent.
            ("synonyms_false_positive", "uncertain", ["answer_1", "answer_2"],
             "scope_or_time_unclear"),
            # A subtle contradiction can be missed; an empty group list is accepted.
            ("subtle_contradiction_false_negative", None, [], None),
            # An unstated assumption can likewise escape classification.
            ("unstated_assumption_false_negative", None, [], None),
        )
        labels = ["answer_1", "answer_2"]
        for name, kind, group_labels, reason in examples:
            with self.subTest(example=name):
                groups = [] if kind is None else [{
                    "kind": kind,
                    "labels": group_labels,
                    "reason_code": reason,
                }]
                simulated = json.dumps({"reviewed_labels": labels, "groups": groups})
                parsed = memory_review._validate_result(simulated, labels)
                if kind is None:
                    # No group means no signal for the caller to block on; the
                    # application has no independent semantic detector here.
                    self.assertEqual(parsed, ())
                else:
                    # Any conflict/uncertainty is a fail-closed signal upstream.
                    self.assertEqual(parsed[0]["kind"], kind)
                    self.assertEqual(set(parsed[0]["labels"]), set(group_labels))


class ClassifierCallTests(IsolatedAsyncioTestCase):
    def fake_client(self, content):
        client = SimpleNamespace(
            chat=SimpleNamespace(completions=SimpleNamespace(
                create=AsyncMock(return_value=SimpleNamespace(
                    choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
                )),
            )),
            close=AsyncMock(),
        )
        return client

    async def test_maps_opaque_labels_and_sends_no_identifiers_or_metadata(self):
        client = self.fake_client(provider_result([{
            "kind": "conflict", "labels": ["answer_1", "answer_2"],
            "reason_code": "same_scope_incompatible",
        }]))
        with patch.object(memory_review, "_provider_key", return_value="synthetic-key"):
            with patch.object(memory_review, "AsyncOpenAI", return_value=client) as constructor:
                result = await memory_review.review_project_memory(project_fixture())
        self.assertEqual(result.groups, ({
            "kind": "conflict", "question_ids": ["q_audience", "q_goal"],
        },))
        kwargs = constructor.call_args.kwargs
        self.assertEqual(kwargs["timeout"], 5)
        self.assertEqual(kwargs["max_retries"], 0)
        call = client.chat.completions.create.call_args.kwargs
        self.assertEqual(call["model"], memory_review.MODEL)
        self.assertEqual(call["max_tokens"], 512)
        provider_text = json.dumps(call["messages"], ensure_ascii=False)
        for forbidden in ("project_test", "user_test", "q_goal", "q_audience", REVISION, result.digest):
            self.assertNotIn(forbidden, provider_text)
        self.assertIn("synthetic goal", provider_text)
        self.assertIn("synthetic audience", provider_text)
        client.close.assert_awaited_once()

    async def test_token_overflow_and_unavailable_rate_fail_before_provider(self):
        client_factory = patch.object(memory_review, "AsyncOpenAI")
        with patch.object(memory_review, "_provider_key", return_value="synthetic-key"):
            with client_factory as client:
                oversized = project_fixture()
                oversized["refine_answers"]["q_goal"] = "x " * 20_000
                with self.assertRaises(memory_review.MemoryReviewError) as error:
                    await memory_review.review_project_memory(oversized)
                self.assertEqual(error.exception.code, "memory_review_limit_exceeded")
                client.assert_not_called()

        broken_rate = {"model": "different-model", "source": "", "verified_on": ""}
        with patch.object(memory_review, "MODEL_RATE_RECORD", broken_rate):
            with patch.object(memory_review, "_provider_key", return_value="synthetic-key"):
                with client_factory as client:
                    with self.assertRaises(memory_review.MemoryReviewError) as error:
                        await memory_review.review_project_memory(project_fixture())
                    self.assertEqual(error.exception.code, "memory_review_limit_exceeded")
                    client.assert_not_called()

    async def test_invalid_provider_response_fails_closed_and_closes_client(self):
        client = self.fake_client('{"reviewed_labels":[],"groups":[]}')
        with patch.object(memory_review, "_provider_key", return_value="synthetic-key"):
            with patch.object(memory_review, "AsyncOpenAI", return_value=client):
                with self.assertRaises(memory_review.MemoryReviewError) as error:
                    await memory_review.review_project_memory(project_fixture())
        self.assertEqual(error.exception.code, "memory_review_invalid_result")
        client.close.assert_awaited_once()

    async def test_provider_timeout_fails_closed_without_retry(self):
        client = self.fake_client(None)
        client.chat.completions.create.side_effect = TimeoutError()
        with patch.object(memory_review, "_provider_key", return_value="synthetic-key"):
            with patch.object(memory_review, "AsyncOpenAI", return_value=client) as constructor:
                with self.assertRaises(memory_review.MemoryReviewError) as error:
                    await memory_review.review_project_memory(project_fixture())
        self.assertEqual(error.exception.code, "memory_review_unavailable")
        self.assertEqual(constructor.call_args.kwargs["max_retries"], 0)
        client.close.assert_awaited_once()


class RefineAtomicityTests(f.ChargedCallerFixture):
    async def test_conflict_groups_return_all_ids_and_do_not_write(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        before = deepcopy(project)
        review = SimpleNamespace(groups=(
            {"kind": "conflict", "question_ids": ["q_goal", "q_audience"]},
        ))
        with patch.object(f.projects, "review_project_memory", new_callable=AsyncMock, return_value=review) as classifier:
            with self.assertRaises(f.HTTPException) as error:
                await f.projects.refine_project(
                    "project_test",
                    SimpleNamespace(answers={"q_goal": "new", "q_audience": "new"}),
                    SimpleNamespace(headers={"If-Match": REVISION}),
                )
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(error.exception.detail, {
            "code": "project_memory_conflict", "groups": list(review.groups),
        })
        classifier.assert_awaited_once()
        self.assertEqual(project, before)

    async def test_joint_correction_is_one_atomic_write(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        review = SimpleNamespace(groups=())
        original = self.db.projects.find_one_and_update
        updates = []

        async def record_update(query, update, **kwargs):
            updates.append(deepcopy(update))
            return await original(query, update, **kwargs)

        self.db.projects.find_one_and_update = record_update
        with patch.object(f.projects, "review_project_memory", new_callable=AsyncMock, return_value=review) as classifier:
            result = await f.projects.refine_project(
                "project_test",
                SimpleNamespace(answers={"q_goal": "corrected goal", "q_audience": "corrected audience"}),
                SimpleNamespace(headers={"If-Match": REVISION}),
            )
        self.assertEqual(result["refine_answers"], {
            "q_goal": "corrected goal", "q_audience": "corrected audience",
        })
        self.assertEqual(len(updates), 1)
        classifier.assert_awaited_once()

    async def test_stale_revision_rejects_before_classifier(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        with patch.object(f.projects, "review_project_memory", new_callable=AsyncMock) as classifier:
            with self.assertRaises(f.HTTPException) as error:
                await f.projects.refine_project(
                    "project_test", SimpleNamespace(answers={}),
                    SimpleNamespace(headers={"If-Match": "2026-10-16T11:00:00+00:00"}),
                )
        self.assertEqual(error.exception.detail["code"], "stale_project_revision")
        classifier.assert_not_awaited()


class BlueprintGateTests(f.ChargedCallerFixture):
    async def test_conflict_blocks_economic_reservation(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        review = SimpleNamespace(groups=(
            {"kind": "uncertain", "question_ids": ["q_goal", "q_audience"]},
        ))
        with patch.object(f.projects, "review_project_memory", new_callable=AsyncMock, return_value=review):
            with patch.object(f.projects, "run_economic_operation", new_callable=AsyncMock) as economic:
                with self.assertRaises(f.HTTPException) as error:
                    await f.projects.create_blueprint(
                        "project_test",
                        SimpleNamespace(headers={
                            "Idempotency-Key": "memory-conflict-no-charge",
                            "If-Match": REVISION,
                        }),
                    )
        self.assertEqual(error.exception.detail["code"], "project_memory_uncertain")
        economic.assert_not_awaited()
        self.blueprint.assert_not_awaited()

    async def test_stale_after_reservation_prevents_blueprint_call(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        digest = memory_review.input_digest(project)
        review = SimpleNamespace(groups=(), digest=digest)

        async def mutate_then_run(*, user, consumption_payload, inputs, work):
            self.db.projects.documents["project_test"]["updated_at"] = "2026-10-16T12:00:00.000001+00:00"
            return await work({"trace": {"operation_id": consumption_payload.meta.trace_id}})

        with patch.object(f.projects, "review_project_memory", new_callable=AsyncMock, return_value=review):
            with patch.object(f.projects, "run_economic_operation", side_effect=mutate_then_run):
                with self.assertRaises(f.HTTPException) as error:
                    await f.projects.create_blueprint(
                        "project_test",
                        SimpleNamespace(headers={
                            "Idempotency-Key": "memory-stale-after-reservation",
                            "If-Match": REVISION,
                        }),
                    )
        self.assertEqual(error.exception.detail["code"], "stale_project_revision")
        self.blueprint.assert_not_awaited()

    async def test_stale_during_provider_discards_result(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        digest = memory_review.input_digest(project)
        review = SimpleNamespace(groups=(), digest=digest)

        async def provider(_context):
            self.db.projects.documents["project_test"]["updated_at"] = "2026-10-16T12:00:00.000001+00:00"
            return {"synthetic": "discard"}

        self.blueprint.side_effect = provider
        with patch.object(f.projects, "review_project_memory", new_callable=AsyncMock, return_value=review):
            with self.assertRaises(f.HTTPException) as error:
                await f.projects.create_blueprint(
                    "project_test",
                    SimpleNamespace(headers={
                        "Idempotency-Key": "memory-stale-during-provider",
                        "If-Match": REVISION,
                    }),
                )
        self.assertEqual(error.exception.detail["code"], "stale_project_revision")
        self.assertNotIn("blueprint", self.db.projects.documents["project_test"])
        self.assertEqual(self.entry()["operation_status"], "compensated")

