"""Closed Builder door: 503, no generation, no credit reservation."""
import os
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import test_consumption_callers as f
from backend.app.core.builder_access import CLOSED_DETAIL, builder_enabled
from backend.app.routers.public import get_public_config


class BuilderClosedTests(f.ChargedCallerFixture):
    def setUp(self):
        super().setUp()
        self._prior_flag = os.environ.get("BUILDER_ENABLED")
        os.environ["BUILDER_ENABLED"] = "false"
        import backend.app.core.security as security
        security.get_current_user.return_value = {
            "user_id": "user_test",
            "plan": "premium",
            "role": "user",
        }

    def tearDown(self):
        if self._prior_flag is None:
            os.environ.pop("BUILDER_ENABLED", None)
        else:
            os.environ["BUILDER_ENABLED"] = self._prior_flag

    async def test_builder_and_blueprint_return_503_without_touching_credits(self):
        for kind in ("builder", "blueprint"):
            with self.subTest(kind=kind):
                with self.assertRaises(f.HTTPException) as error:
                    await self.call(kind, key=f"closed-{kind}")
                self.assertEqual(error.exception.status_code, 503)
                self.assertEqual(error.exception.detail["code"], "builder_under_construction")
                self.assertIn("construcción", error.exception.detail["message"])
                self.assertIn("créditos", error.exception.detail["message"])

        self.builder.assert_not_awaited()
        self.blueprint.assert_not_awaited()
        self.assertEqual(self.db.ledger.documents, {})
        self.assertNotIn("credit_pending_consumption", self.db.users.document)
        self.assertEqual(self.db.users.document["credit_balance"], 100)

    async def test_closed_door_runs_before_economic_operation(self):
        with patch.object(f.builder_ai, "run_economic_operation", new=AsyncMock()) as economic, \
             patch.object(f.projects, "run_economic_operation", new=AsyncMock()) as project_economic:
            with self.assertRaises(f.HTTPException):
                await self.call("builder", key="closed-before-charge")
            with self.assertRaises(f.HTTPException):
                await self.call("blueprint", key="closed-blueprint-before-charge")
        economic.assert_not_awaited()
        project_economic.assert_not_awaited()
        self.assertEqual(self.db.users.document["credit_balance"], 100)

    async def test_existing_admin_role_still_reaches_the_builder(self):
        import backend.app.core.security as security

        security.get_current_user.return_value = {
            "user_id": "user_test",
            "plan": "premium",
            "role": " Admin ",
        }
        result = await self.call("builder", key="admin-bypass")
        self.assertNotEqual(result, CLOSED_DETAIL)
        self.builder.assert_awaited()
        self.assertLess(self.db.users.document["credit_balance"], 100)
        self.assertNotEqual(self.db.ledger.documents, {})


def test_flag_defaults_off_and_accepts_only_explicit_true(monkeypatch):
    monkeypatch.delenv("BUILDER_ENABLED", raising=False)
    assert builder_enabled() is False
    for value in ("", "false", "0", "no", "off", "maybe"):
        monkeypatch.setenv("BUILDER_ENABLED", value)
        assert builder_enabled() is False
    monkeypatch.setenv("BUILDER_ENABLED", "true")
    assert builder_enabled() is True


def test_public_config_reports_the_same_flag(monkeypatch):
    monkeypatch.setenv("BUILDER_ENABLED", "false")
    for name in (
        "ADVISOR_FLOW_ENABLED",
        "REACT_APP_ADVISOR_FLOW_ENABLED",
        "VITE_ADVISOR_FLOW_ENABLED",
        "ADVISOR_BOOKING_URL",
        "REACT_APP_ADVISOR_BOOKING_URL",
        "VITE_ADVISOR_BOOKING_URL",
        "ADVISOR_PHOTO_URL",
        "REACT_APP_ADVISOR_PHOTO_URL",
        "VITE_ADVISOR_PHOTO_URL",
    ):
        monkeypatch.delenv(name, raising=False)
    import asyncio
    closed = asyncio.run(get_public_config())
    assert closed["builder_enabled"] is False
    assert closed["advisor_flow_enabled"] is False
    assert closed["advisor_booking_url"] == ""
    assert closed["advisor_photo_url"] == ""
    assert "google_client_id" in closed
    monkeypatch.setenv("BUILDER_ENABLED", "true")
    monkeypatch.setenv("ADVISOR_FLOW_ENABLED", "true")
    monkeypatch.setenv("ADVISOR_BOOKING_URL", "https://booking.example.test/30")
    opened = asyncio.run(get_public_config())
    assert opened["builder_enabled"] is True
    assert opened["advisor_flow_enabled"] is True
    assert opened["advisor_booking_url"] == "https://booking.example.test/30"
