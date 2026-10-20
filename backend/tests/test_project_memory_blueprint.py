"""Local-only J05 projection and blueprint integration checks."""
from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import test_consumption_callers as f
from backend.app.ai.memory.project_memory import (
    ProjectMemoryError,
    build_project_memory,
)


REVISION = "2026-10-16T12:00:00+00:00"


def project_fixture():
    return {
        "project_id": "project_test",
        "user_id": "user_test",
        "updated_at": REVISION,
        "refine_questions": [{"id": "goal", "question": "Project goal?"}],
        "refine_answers": {"goal": "synthetic"},
        "route": "idea",
        "diagnosis": {"summary": "synthetic"},
        "input_content": "synthetic project",
        "url_analysis": "synthetic URL facts",
    }


class ProjectMemoryProjectionTests(f.unittest.TestCase):
    def test_projection_preserves_exact_answers_and_internal_provenance(self):
        project = project_fixture()
        original = deepcopy(project)
        result = build_project_memory(
            project,
            owner_id="user_test",
            project_id="project_test",
            expected_revision=REVISION,
        )
        self.assertEqual(project, original)
        self.assertEqual(result, {
            "schema_version": "project_refine_memory_v1",
            "owner_id": "user_test",
            "project_id": "project_test",
            "source": "project.refine_answers",
            "provenance": "user_authored",
            "revision": REVISION,
            "answers": {"goal": "synthetic"},
        })

    def test_projection_defaults_to_empty_answers_and_zero_revision(self):
        result = build_project_memory(
            {"project_id": "project_test", "user_id": "user_test"},
            owner_id="user_test",
            project_id="project_test",
            expected_revision="0",
        )
        self.assertEqual(result["answers"], {})
        self.assertEqual(result["revision"], "0")

    def test_projection_rejects_foreign_owner_and_stale_revision(self):
        project = project_fixture()
        with self.assertRaises(ProjectMemoryError) as owner_error:
            build_project_memory(
                project,
                owner_id="another_owner",
                project_id="project_test",
                expected_revision=REVISION,
            )
        self.assertEqual(owner_error.exception.code, "project_owner_mismatch")
        with self.assertRaises(ProjectMemoryError) as revision_error:
            build_project_memory(
                project,
                owner_id="user_test",
                project_id="project_test",
                expected_revision="2026-10-16T11:00:00+00:00",
            )
        self.assertEqual(revision_error.exception.code, "stale_project_revision")


class ProjectMemoryBlueprintTests(f.ChargedCallerFixture):
    async def test_owner_isolation_precedes_blueprint_reservation(self):
        self.db.projects.documents["project_test"].update(project_fixture())
        self.db.projects.documents["project_test"]["user_id"] = "another_owner"
        with patch.object(f.projects, "run_economic_operation", new_callable=AsyncMock) as economic:
            with self.assertRaises(f.HTTPException) as error:
                await self.call("blueprint")
        self.assertEqual(error.exception.status_code, 404)
        economic.assert_not_awaited()
        self.blueprint.assert_not_awaited()

    async def test_stale_revision_precedes_reservation_and_projection(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        with patch.object(f.projects, "run_economic_operation", new_callable=AsyncMock) as economic:
            with patch.object(f.projects, "build_project_memory", wraps=build_project_memory) as memory:
                with self.assertRaises(f.HTTPException) as error:
                    await f.projects.create_blueprint(
                        "project_test",
                        SimpleNamespace(headers={
                            "Idempotency-Key": "memory-stale-before-reserve",
                            "If-Match": "2026-10-16T11:00:00+00:00",
                        }),
                    )
        self.assertEqual(error.exception.detail["code"], "stale_project_revision")
        economic.assert_not_awaited()
        memory.assert_not_called()
        self.blueprint.assert_not_awaited()

    async def test_blueprint_rejects_stale_revision_after_authorized_refine(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        original_find_one = self.db.projects.find_one
        calls = 0
        updated_revision = None

        async def reread_with_current_answers(query, projection=None):
            nonlocal calls, updated_revision
            calls += 1
            if calls == 2:
                # A real refine uses owner/revision CAS and advances updated_at.
                updated = await f.projects.refine_project(
                    "project_test",
                    SimpleNamespace(answers={"goal": "recovered"}),
                    SimpleNamespace(headers={"If-Match": REVISION}),
                )
                updated_revision = updated["updated_at"]
            return await original_find_one(query, projection)

        self.db.projects.find_one = reread_with_current_answers
        with self.assertRaises(f.HTTPException) as error:
            await f.projects.create_blueprint(
                "project_test",
                SimpleNamespace(headers={
                    "Idempotency-Key": "memory-reread-stale-after-refine",
                    "If-Match": REVISION,
                }),
            )
        self.assertGreaterEqual(calls, 2)
        self.assertIsNotNone(updated_revision)
        self.assertNotEqual(updated_revision, REVISION)
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(error.exception.detail["code"], "stale_project_revision")
        self.assertEqual(
            self.db.projects.documents["project_test"]["refine_answers"],
            {"goal": "recovered"},
        )
        self.assertEqual(
            self.db.projects.documents["project_test"]["updated_at"],
            updated_revision,
        )
        self.blueprint.assert_not_awaited()
        self.assertEqual(self.db.users.document["credit_balance"], 100)
        self.assertEqual(self.entry()["operation_status"], "compensated")

    async def test_refine_uses_owner_cas_and_preserves_omitted_answers(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        project.pop("updated_at")
        original_update = self.db.projects.find_one_and_update
        cas_queries = []

        async def record_cas(query, update, **kwargs):
            cas_queries.append(deepcopy(query))
            return await original_update(query, update, **kwargs)

        self.db.projects.find_one_and_update = record_cas
        first = await f.projects.refine_project(
            "project_test",
            SimpleNamespace(answers={"goal": "first"}),
            SimpleNamespace(headers={"If-Match": "0"}),
        )
        first_revision = first["updated_at"]
        self.assertEqual(first["refine_answers"], {"goal": "first"})

        second = await f.projects.refine_project(
            "project_test",
            SimpleNamespace(answers={"goal": "second"}),
            SimpleNamespace(headers={"If-Match": first_revision}),
        )
        self.assertEqual(second["refine_answers"], {"goal": "second"})
        self.assertGreater(second["updated_at"], first_revision)
        self.assertEqual(cas_queries, [
            {
                "project_id": "project_test",
                "user_id": "user_test",
                "updated_at": {"$exists": False},
            },
            {
                "project_id": "project_test",
                "user_id": "user_test",
                "updated_at": first_revision,
            },
        ])

    async def test_plan_recommendation_receives_merged_answer_state(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        with patch.object(
            f.projects,
            "build_plan_recommendation",
            wraps=f.projects.build_plan_recommendation,
        ) as recommendation:
            await f.projects.refine_project(
                "project_test",
                SimpleNamespace(answers={"goal": "updated"}),
                SimpleNamespace(headers={"If-Match": REVISION}),
            )
        self.assertEqual(
            recommendation.call_args.kwargs["refine_answers"],
            {"goal": "updated"},
        )

    async def test_refine_rejects_unknown_new_answer_without_mutation(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        before = deepcopy(project)
        with self.assertRaises(f.HTTPException) as error:
            await f.projects.refine_project(
                "project_test",
                SimpleNamespace(answers={"made_up": "synthetic"}),
                SimpleNamespace(headers={"If-Match": REVISION}),
            )
        self.assertEqual(error.exception.status_code, 422)
        self.assertEqual(error.exception.detail["code"], "unauthorized_refine_answer_id")
        self.assertEqual(project, before)

    async def test_refine_blocks_unmapped_legacy_without_mutation(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        project["refine_answers"]["legacy_id"] = "preserved"
        before = deepcopy(project)
        with self.assertRaises(f.HTTPException) as error:
            await f.projects.refine_project(
                "project_test",
                SimpleNamespace(answers={"goal": "updated"}),
                SimpleNamespace(headers={"If-Match": REVISION}),
            )
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(error.exception.detail, {
            "code": "memory_review_legacy_unmapped", "question_ids": ["legacy_id"],
        })
        self.assertEqual(project, before)

    async def test_refine_round_trips_oversized_legacy_value_unchanged(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        legacy_key = "legacy/" + ("k" * f.projects.MAX_REFINE_ANSWER_KEY_CHARS)
        legacy_value = "v" * (f.projects.MAX_REFINE_ANSWER_VALUE_CHARS + 1)
        project["refine_answers"][legacy_key] = legacy_value
        before = deepcopy(project)
        with self.assertRaises(f.HTTPException) as error:
            await f.projects.refine_project(
                "project_test",
                SimpleNamespace(answers={"goal": "updated", legacy_key: legacy_value}),
                SimpleNamespace(headers={"If-Match": REVISION}),
            )
        self.assertEqual(error.exception.detail["code"], "memory_review_legacy_unmapped")
        self.assertEqual(project, before)

    async def test_refine_rejects_altered_legacy_answer_without_mutation(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        before = deepcopy(project)
        with self.assertRaises(f.HTTPException) as error:
            await f.projects.refine_project(
                "project_test",
                SimpleNamespace(answers={"goal": "updated", "opaque/key": "changed"}),
                SimpleNamespace(headers={"If-Match": REVISION}),
            )
        self.assertEqual(error.exception.detail["code"], "unauthorized_refine_answer_id")
        self.assertEqual(project, before)

    async def test_refine_rejects_duplicate_question_ids_without_mutation(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        project["refine_questions"] = [
            {"id": "goal", "question": "First?"},
            {"id": "goal", "question": "Second?"},
        ]
        before = deepcopy(project)
        with self.assertRaises(f.HTTPException) as error:
            await f.projects.refine_project(
                "project_test",
                SimpleNamespace(answers={"goal": "updated"}),
                SimpleNamespace(headers={"If-Match": REVISION}),
            )
        self.assertEqual(error.exception.detail["code"], "duplicate_refine_question_id")
        self.assertEqual(project, before)

    async def test_refine_rejects_invalid_question_ids_without_mutation(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        project["refine_questions"] = [{"question": "No stable id"}]
        before = deepcopy(project)
        with self.assertRaises(f.HTTPException) as error:
            await f.projects.refine_project(
                "project_test",
                SimpleNamespace(answers={"goal": "updated"}),
                SimpleNamespace(headers={"If-Match": REVISION}),
            )
        self.assertEqual(error.exception.detail["code"], "invalid_refine_questions")
        self.assertEqual(project, before)

    async def test_refine_enforces_key_and_value_boundaries(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        max_key = "k" * f.projects.MAX_REFINE_ANSWER_KEY_CHARS
        max_value = "v" * f.projects.MAX_REFINE_ANSWER_VALUE_CHARS
        project["refine_questions"] = [{"id": max_key, "question": "Boundary?"}]
        project["refine_answers"] = {}
        result = await f.projects.refine_project(
            "project_test",
            SimpleNamespace(answers={max_key: max_value}),
            SimpleNamespace(headers={"If-Match": REVISION}),
        )
        self.assertEqual(len(result["refine_answers"][max_key]), f.projects.MAX_REFINE_ANSWER_VALUE_CHARS)

        for key, value in (
            ("k" * (f.projects.MAX_REFINE_ANSWER_KEY_CHARS + 1), "x"),
            ("goal", "v" * (f.projects.MAX_REFINE_ANSWER_VALUE_CHARS + 1)),
        ):
            with self.subTest(key_length=len(key), value_length=len(value)):
                current = self.db.projects.documents["project_test"]
                before = deepcopy(current)
                with self.assertRaises(f.HTTPException) as error:
                    await f.projects.refine_project(
                        "project_test",
                        SimpleNamespace(answers={key: value}),
                        SimpleNamespace(headers={"If-Match": current["updated_at"]}),
                    )
                self.assertEqual(error.exception.detail["code"], "invalid_refine_answer_entry")
                self.assertEqual(current, before)

    async def test_refine_foreign_owner_is_not_found_without_mutation(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        project["user_id"] = "another_owner"
        before = deepcopy(project)
        with self.assertRaises(f.HTTPException) as error:
            await f.projects.refine_project(
                "project_test",
                SimpleNamespace(answers={"goal": "updated"}),
                SimpleNamespace(headers={"If-Match": REVISION}),
            )
        self.assertEqual(error.exception.status_code, 404)
        self.assertEqual(project, before)

    async def test_refine_stale_revision_rejects_without_mutation(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        before = deepcopy(project)
        with self.assertRaises(f.HTTPException) as error:
            await f.projects.refine_project(
                "project_test",
                SimpleNamespace(answers={"goal": "updated"}),
                SimpleNamespace(headers={"If-Match": "2026-10-16T11:00:00+00:00"}),
            )
        self.assertEqual(error.exception.detail["code"], "stale_project_revision")
        self.assertEqual(project, before)

    async def test_refine_lost_cas_race_rejects_without_overwriting_winner(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        before = deepcopy(project)

        async def lose_cas(*args, **kwargs):
            winner = deepcopy(before)
            winner["refine_answers"] = {"goal": "concurrent winner"}
            winner["updated_at"] = "2026-10-16T12:00:00.000001+00:00"
            self.db.projects.documents["project_test"] = winner
            return None

        self.db.projects.find_one_and_update = lose_cas
        with self.assertRaises(f.HTTPException) as error:
            await f.projects.refine_project(
                "project_test",
                SimpleNamespace(answers={"goal": "loser"}),
                SimpleNamespace(headers={"If-Match": REVISION}),
            )
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(error.exception.detail["code"], "stale_project_revision")
        self.assertEqual(
            self.db.projects.documents["project_test"]["refine_answers"],
            {"goal": "concurrent winner"},
        )

    async def test_blueprint_provider_contract_remains_exact_and_metadata_free(self):
        project = self.db.projects.documents["project_test"]
        project.update(project_fixture())
        await f.projects.create_blueprint(
            "project_test",
            SimpleNamespace(headers={
                "Idempotency-Key": "memory-provider-contract",
                "If-Match": REVISION,
            }),
        )
        provider_context = self.blueprint.await_args.args[0]
        self.assertEqual(set(provider_context), {
            "route", "diagnosis", "input_content", "refine_answers", "url_analysis",
        })
        self.assertEqual(provider_context, {
            "route": "idea",
            "diagnosis": {"summary": "synthetic"},
            "input_content": "synthetic project",
            "refine_answers": {"goal": "synthetic"},
            "url_analysis": "synthetic URL facts",
        })
        for metadata in ("schema_version", "owner_id", "project_id", "provenance", REVISION):
            self.assertNotIn(metadata, repr(provider_context))

