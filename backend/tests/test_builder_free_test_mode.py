"""Builder test mode skips gem charges for admins only."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import sys

import test_consumption_callers as f

_config = sys.modules["backend.app.core.config"]
_config.GROK_API_KEY = ""
_config.GROK_MODEL = "grok-4.3"
_config.GROK_BASE_URL = "https://api.x.ai/v1"
_config.ANTHROPIC_API_KEY = ""
_config.ANTHROPIC_MODEL = "claude-haiku-5-5"
_config.ANTHROPIC_MAX_TOKENS = 8192
_config.ANTHROPIC_EFFORT = "medium"

from backend.app.routers import builder_preview
from backend.app.services.builder_landing_state import LandingStateError
from backend.app.services.builder_pipeline import public_preview

PREVIEW = {
    "schema": "sm.builder.preview.v1",
    "ownerId": "user_test",
    "projectId": "project_test",
    "versions": [{
        "version": 1,
        "instruction": "Clara",
        "createdAt": "2026-11-28T01:00:00+00:00",
        "html": "<h1>Clara atiende en Madrid</h1>",
    }],
}


class FreeTestModeTests(f.ChargedCallerFixture):
    def setUp(self):
        super().setUp()
        self._flag = os.environ.get("BUILDER_FREE_TEST_MODE")
        os.environ.pop("BUILDER_FREE_TEST_MODE", None)
        import backend.app.core.security as security
        self.security = security
        self._user = security.get_current_user.return_value

    def tearDown(self):
        if self._flag is None:
            os.environ.pop("BUILDER_FREE_TEST_MODE", None)
        else:
            os.environ["BUILDER_FREE_TEST_MODE"] = self._flag
        self.security.get_current_user.return_value = self._user

    def _user_as(self, role):
        self.security.get_current_user.return_value = {
            "user_id": "user_test",
            "plan": "premium",
            "role": role,
        }

    async def test_flag_defaults_off(self):
        from backend.app.services.builder_test_mode import builder_free_test_mode_enabled
        os.environ.pop("BUILDER_FREE_TEST_MODE", None)
        self.assertFalse(builder_free_test_mode_enabled())
        for value in ("", "false", "0", "no", "off"):
            os.environ["BUILDER_FREE_TEST_MODE"] = value
            self.assertFalse(builder_free_test_mode_enabled())

    async def test_admin_build_skips_the_charge_and_logs_it(self):
        os.environ["BUILDER_FREE_TEST_MODE"] = "true"
        self._user_as("admin")
        with self.assertLogs("backend.app.services.builder_test_mode", level="INFO") as logs:
            await self.call("builder", key="free-admin-build")
        self.assertEqual(self.db.users.document["credit_balance"], 100)
        self.assertEqual(self.db.ledger.documents, {})
        self.builder.assert_awaited()
        joined = "\n".join(logs.output)
        self.assertIn("builder_charge_skipped action=builder_build", joined)
        self.assertIn("user_id=user_test", joined)
        self.assertNotIn("synthetic", joined.lower())

    async def test_non_admin_build_still_charges_when_the_flag_is_on(self):
        os.environ["BUILDER_FREE_TEST_MODE"] = "true"
        self._user_as("user")
        await self.call("builder", key="free-user-build")
        self.assertLess(self.db.users.document["credit_balance"], 100)
        self.assertNotEqual(self.db.ledger.documents, {})

    async def test_admin_without_the_flag_still_charges(self):
        os.environ["BUILDER_FREE_TEST_MODE"] = "false"
        self._user_as(" Admin ")
        await self.call("builder", key="admin-flag-off")
        self.assertLess(self.db.users.document["credit_balance"], 100)

    async def test_admin_preview_persists_v1_without_a_charge(self):
        os.environ["BUILDER_FREE_TEST_MODE"] = "true"
        self._user_as("admin")
        saved = {}

        async def save(*_args, **_kwargs):
            saved["preview"] = PREVIEW
            return {"updated_at": "2026-11-28T01:00:00+00:00"}

        async def missing(*_args, **_kwargs):
            raise LandingStateError("not_found", 404)

        with patch.object(builder_preview, "providers_ready", return_value=None), \
             patch.object(builder_preview, "db", SimpleNamespace(projects=self.db.projects, builder_landing_states=object())), \
             patch.object(builder_preview, "load_generated_preview", new=missing), \
             patch.object(builder_preview, "run_pipeline", new=AsyncMock(return_value={
                 "preview": PREVIEW, "public": public_preview(PREVIEW),
             })), \
             patch.object(builder_preview, "save_generated_preview", new=save), \
             self.assertLogs("backend.app.services.builder_test_mode", level="INFO") as logs:
            result = await builder_preview.create_preview(
                builder_preview.PreviewRequest(projectId="project_test", instruction="Clara, psicóloga en Madrid"),
                f.request("preview-free-admin"),
            )
        self.assertEqual(result["html"], "<h1>Clara atiende en Madrid</h1>")
        self.assertEqual(result["versions"][0]["version"], 1)
        self.assertEqual(saved["preview"]["versions"][0]["version"], 1)
        self.assertEqual(self.db.users.document["credit_balance"], 100)
        self.assertEqual(self.db.ledger.documents, {})
        self.assertIn("builder_charge_skipped action=builder_preview", "\n".join(logs.output))
        self.assertNotIn("psicóloga", "\n".join(logs.output))

    async def test_session_is_on_only_for_an_admin(self):
        os.environ["BUILDER_ENABLED"] = "true"
        os.environ["BUILDER_FREE_TEST_MODE"] = "true"
        self._user_as("admin")
        admin = await builder_preview.builder_session(SimpleNamespace())
        self._user_as("user")
        member = await builder_preview.builder_session(SimpleNamespace())
        os.environ["BUILDER_FREE_TEST_MODE"] = "false"
        self._user_as("admin")
        closed = await builder_preview.builder_session(SimpleNamespace())
        self.assertTrue(admin["freeTestMode"])
        self.assertFalse(member["freeTestMode"])
        self.assertFalse(closed["freeTestMode"])
