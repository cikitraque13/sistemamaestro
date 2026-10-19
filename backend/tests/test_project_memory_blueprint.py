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
        "refine_answers": {"goal": "synthetic", "opaque/key": "value"},
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
            "answers": {"goal": "synthetic", "opaque/key": "value"},
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

    async def test_refine_uses_owner_cas_and_replaces_the_whole_answer_map(self):
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
            SimpleNamespace(answers={"old": "synthetic"}),
            SimpleNamespace(headers={"If-Match": "0"}),
        )
        first_revision = first["updated_at"]
        self.assertEqual(first["refine_answers"], {"old": "synthetic"})

        second = await f.projects.refine_project(
            "project_test",
            SimpleNamespace(answers={"new": "synthetic"}),
            SimpleNamespace(headers={"If-Match": first_revision}),
        )
        self.assertEqual(second["refine_answers"], {"new": "synthetic"})
        self.assertNotIn("old", second["refine_answers"])
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
            "refine_answers": {"goal": "synthetic", "opaque/key": "value"},
            "url_analysis": "synthetic URL facts",
        })
        for metadata in ("schema_version", "owner_id", "project_id", "provenance", REVISION):
            self.assertNotIn(metadata, repr(provider_context))

