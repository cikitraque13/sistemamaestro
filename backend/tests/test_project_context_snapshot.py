"""Synthetic-only tests for the J04 project context snapshot contract."""
import json
from copy import deepcopy
from types import SimpleNamespace

import test_credit_consumption_safety as credits_fixture
credits_fixture.config_stub.OPENAI_API_KEY = None
from backend.app.ai.agents.builder_agent import _build_prompt
import test_consumption_callers as f
from pydantic import ValidationError

from backend.app.ai.schemas.builder_ai_output import BuilderAIInput
from backend.app.services.project_context_snapshot import (
    ProjectContextSnapshotError,
    build_project_context_snapshot,
)


REVISION = "2026-10-16T12:00:00+00:00"


def project_fixture():
    return {
        "project_id": "project_test",
        "user_id": "user_test",
        "updated_at": REVISION,
        "input_type": "text",
        "input_content": "synthetic project source",
        "route": "idea",
        "plan_recommendation": {
            "scores": {
                "complexity": 1,
                "economic_impact": 2,
                "urgency": 0,
                "structure_need": 1,
                "continuity_need": 1,
                "recommended_plan_id": "must-not-leak",
            }
        },
        "diagnosis": {"private_extra": "must-not-leak"},
        "analysis_consumption": {"trace": "must-not-leak"},
        "_id": "must-not-leak",
    }


class ProjectContextSnapshotTests(f.unittest.TestCase):
    def test_prompt_keeps_user_input_and_project_context_separate(self):
        payload = BuilderAIInput(
            userInput="synthetic user instruction",
            userId="synthetic-owner-id",
            contextUse="project_overview",
        )
        project_context = {
            "selector": "project_overview",
            "revision": REVISION,
            "items": [{"field": "input_content", "value": "synthetic project fact"}],
        }

        prompt = json.loads(_build_prompt(payload, project_context))

        self.assertEqual(prompt["input"]["userInput"], "synthetic user instruction")
        self.assertNotIn("userId", prompt["input"])
        self.assertNotIn("contextUse", prompt["input"])
        self.assertEqual(prompt["projectContext"], project_context)
        self.assertNotIn("instructions", prompt["input"])
        self.assertNotIn("synthetic project fact", prompt["input"]["userInput"])

    def test_project_overview_selects_only_closed_fields_with_provenance(self):
        source = project_fixture()
        before = deepcopy(source)
        result = build_project_context_snapshot(
            source,
            project_id="project_test",
            expected_revision=REVISION,
            context_use="project_overview",
        )
        self.assertEqual(source, before)
        self.assertEqual(result["projectId"], "project_test")
        self.assertEqual(result["revision"], REVISION)
        self.assertEqual([item["field"] for item in result["items"]],
                         ["input_type", "input_content", "route"])
        self.assertEqual([item["provenance"] for item in result["items"]],
                         ["user_supplied", "user_supplied", "persisted_derived"])
        self.assertTrue(all(item["revision"] == REVISION for item in result["items"]))
        serialized = str(result)
        for forbidden in ("user_test", "diagnosis", "analysis_consumption", "must-not-leak", "_id"):
            self.assertNotIn(forbidden, serialized)

    def test_recommendation_review_selects_only_valid_allowlisted_scores(self):
        result = build_project_context_snapshot(
            project_fixture(),
            project_id="project_test",
            expected_revision=REVISION,
            context_use="recommendation_review",
        )
        self.assertEqual([item["field"] for item in result["items"]], [
            "route",
            "plan_recommendation.scores.complexity",
            "plan_recommendation.scores.economic_impact",
            "plan_recommendation.scores.urgency",
            "plan_recommendation.scores.structure_need",
            "plan_recommendation.scores.continuity_need",
        ])
        self.assertTrue(all(item["provenance"] == "persisted_derived"
                            for item in result["items"]))

    def test_optional_missing_score_fields_are_omitted(self):
        source = project_fixture()
        source["plan_recommendation"] = {"scores": {"complexity": 2}}
        result = build_project_context_snapshot(
            source,
            project_id="project_test",
            expected_revision=REVISION,
            context_use="recommendation_review",
        )
        self.assertEqual([item["field"] for item in result["items"]], [
            "route", "plan_recommendation.scores.complexity"
        ])

    def test_formatting_only_has_no_project_items(self):
        result = build_project_context_snapshot(
            project_fixture(),
            project_id="project_test",
            expected_revision=REVISION,
            context_use="formatting_only",
        )
        self.assertEqual(result["items"], [])

    def test_invalid_selector_revision_identity_and_required_data_fail_closed(self):
        cases = [
            (project_fixture(), "other", REVISION, "project_overview", "invalid_project_identity"),
            (project_fixture(), "project_test", "stale", "project_overview", "stale_project_revision"),
            ({key: value for key, value in project_fixture().items() if key != "input_content"},
             "project_test", REVISION, "project_overview", "invalid_project_context_source"),
            ({**project_fixture(), "input_content": None}, "project_test", REVISION,
             "project_overview", "invalid_project_context_source"),
            ({**project_fixture(), "plan_recommendation": {"scores": {"complexity": 5}}},
             "project_test", REVISION, "recommendation_review", "invalid_project_context_source"),
        ]
        for source, project_id, revision, selector, expected_code in cases:
            with self.subTest(code=expected_code):
                with self.assertRaises(ProjectContextSnapshotError) as error:
                    build_project_context_snapshot(
                        source,
                        project_id=project_id,
                        expected_revision=revision,
                        context_use=selector,
                    )
                self.assertEqual(error.exception.code, expected_code)
        with self.assertRaises(ProjectContextSnapshotError) as error:
            build_project_context_snapshot(
                project_fixture(),
                project_id="project_test",
                expected_revision=REVISION,
                context_use="arbitrary",
            )
        self.assertEqual(error.exception.code, "invalid_project_context_selector")


class ProjectContextSnapshotRouterTests(f.ChargedCallerFixture):
    async def test_project_bound_router_passes_server_snapshot_separately(self):
        self.db.projects.documents["project_test"].update(project_fixture())
        result = await f.builder_ai.build_with_ai(
            BuilderAIInput(
                userInput="synthetic instruction",
                projectId="project_test",
                contextUse="project_overview",
            ),
            SimpleNamespace(headers={
                "Idempotency-Key": "logical-operation-1",
                "If-Match": REVISION,
            }),
        )
        self.assertEqual(result["trace"]["meta"]["identity"]["serverRevision"], REVISION)
        call_payload = self.builder.await_args.args[0]
        context = self.builder.await_args.kwargs["project_context"]
        self.assertEqual(call_payload.userInput, "synthetic instruction")
        self.assertEqual(context["selector"], "project_overview")
        self.assertEqual(context["revision"], REVISION)
        self.assertNotIn("ownerId", context)
        self.assertNotIn("user_id", str(context))
        self.assertEqual([item["field"] for item in context["items"]],
                         ["input_type", "input_content", "route"])

    async def test_foreign_or_stale_project_never_reaches_agent(self):
        self.db.projects.documents["project_test"]["user_id"] = "another_owner"
        with self.assertRaises(f.HTTPException) as error:
            await f.builder_ai.build_with_ai(
                BuilderAIInput(
                    userInput="synthetic",
                    projectId="project_test",
                    contextUse="project_overview",
                ),
                f.request(),
            )
        self.assertEqual(error.exception.status_code, 404)
        self.builder.assert_not_awaited()

        self.db.projects.documents["project_test"].update(project_fixture())
        with self.assertRaises(f.HTTPException) as error:
            await f.builder_ai.build_with_ai(
                BuilderAIInput(
                    userInput="synthetic",
                    projectId="project_test",
                    contextUse="project_overview",
                ),
                f.request(),
            )
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(error.exception.detail["code"], "stale_project_revision")
        self.builder.assert_not_awaited()

    async def test_revision_changed_before_agent_call_rejects_without_invocation(self):
        self.db.projects.documents["project_test"].update(project_fixture())
        original_find_one = self.db.projects.find_one
        calls = 0

        async def change_revision_on_pre_call_read(query, projection=None):
            nonlocal calls
            calls += 1
            if calls == 2:
                self.db.projects.documents["project_test"]["updated_at"] = (
                    "2026-10-16T12:00:01+00:00"
                )
            return await original_find_one(query, projection)

        self.db.projects.find_one = change_revision_on_pre_call_read
        with self.assertRaises(f.HTTPException) as error:
            await f.builder_ai.build_with_ai(
                BuilderAIInput(
                    userInput="synthetic",
                    projectId="project_test",
                    contextUse="project_overview",
                ),
                SimpleNamespace(headers={
                    "Idempotency-Key": "logical-operation-before-agent",
                    "If-Match": REVISION,
                }),
            )

        self.assertEqual(calls, 2)
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(error.exception.detail["code"], "stale_project_revision")
        self.builder.assert_not_awaited()

    async def test_invalid_client_selector_is_rejected_by_schema(self):
        with self.assertRaises(ValidationError):
            BuilderAIInput(userInput="synthetic", contextUse="unknown_selector")
        self.builder.assert_not_awaited()

    async def test_malformed_selected_source_never_reaches_agent(self):
        self.db.projects.documents["project_test"].update(project_fixture())
        self.db.projects.documents["project_test"]["input_content"] = None
        with self.assertRaises(f.HTTPException) as error:
            await f.builder_ai.build_with_ai(
                BuilderAIInput(
                    userInput="synthetic",
                    projectId="project_test",
                    contextUse="project_overview",
                ),
                SimpleNamespace(headers={
                    "Idempotency-Key": "logical-operation-1",
                    "If-Match": REVISION,
                }),
            )
        self.assertEqual(error.exception.status_code, 422)
        self.assertEqual(error.exception.detail["code"], "invalid_project_context_source")
        self.builder.assert_not_awaited()

        self.db.projects.documents["project_test"].update(project_fixture())
        self.db.projects.documents["project_test"]["plan_recommendation"]["scores"]["complexity"] = 8
        with self.assertRaises(f.HTTPException) as error:
            await f.builder_ai.build_with_ai(
                BuilderAIInput(
                    userInput="synthetic",
                    projectId="project_test",
                    contextUse="recommendation_review",
                ),
                SimpleNamespace(headers={
                    "Idempotency-Key": "logical-operation-2",
                    "If-Match": REVISION,
                }),
            )
        self.assertEqual(error.exception.status_code, 422)
        self.assertEqual(error.exception.detail["code"], "invalid_project_context_source")
        self.builder.assert_not_awaited()

    async def test_revision_change_during_agent_call_rejects_stale_result(self):
        self.db.projects.documents["project_test"].update(project_fixture())

        async def agent(payload, *, project_context=None):
            self.db.projects.documents["project_test"]["updated_at"] = "2026-10-16T12:00:01+00:00"
            return SimpleNamespace(model_dump=lambda: {"warnings": []})

        self.builder.side_effect = agent
        with self.assertRaises(f.HTTPException) as error:
            await f.builder_ai.build_with_ai(
                BuilderAIInput(
                    userInput="synthetic",
                    projectId="project_test",
                    contextUse="project_overview",
                ),
                SimpleNamespace(headers={
                    "Idempotency-Key": "logical-operation-1",
                    "If-Match": REVISION,
                }),
            )
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(error.exception.detail["code"], "stale_project_revision")
        self.builder.assert_awaited_once()


if __name__ == "__main__":
    f.unittest.main()
