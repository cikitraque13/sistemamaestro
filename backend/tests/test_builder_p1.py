"""Offline checks for the J06 classifier and oversized builder input."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")

import asyncio
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

import test_consumption_callers as f
from backend.app.ai.agents.intent_clarification import ClassifierUnavailable, classify_intent
from backend.app.ai.schemas.intent_clarification import IntentOperation
from backend.app.core import config
from backend.app.services.intent_clarification import IntentError

INFERENCE = {
    "title": "Propuesta",
    "goal": "Aclarar el alcance",
    "scope": ["Una página"],
    "assumptions": [],
    "success_criteria": ["Confirmación"],
    "questions": [],
    "blocker_ids": [],
}


class FakeGrok:
    def __init__(self, content=None, error=None, finish_reason="stop"):
        self.content = content
        self.error = error
        self.finish_reason = finish_reason
        self.calls = []
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self.create))

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def create(self, **kwargs):
        self.calls.append(kwargs)
        if self.error is not None:
            raise self.error
        return SimpleNamespace(
            choices=[SimpleNamespace(
                finish_reason=self.finish_reason,
                message=SimpleNamespace(content=self.content),
            )]
        )


def _pin_grok(api_key):
    previous = (config.GROK_API_KEY, config.GROK_MODEL, config.GROK_BASE_URL)
    config.GROK_API_KEY = api_key
    config.GROK_MODEL = "grok-4.3"
    config.GROK_BASE_URL = "https://api.x.ai/v1"
    return previous


def _restore_grok(previous):
    config.GROK_API_KEY, config.GROK_MODEL, config.GROK_BASE_URL = previous


def test_classifier_without_key_does_not_call_grok_or_invent_a_result():
    previous = _pin_grok("")
    try:
        with patch("backend.app.ai.providers.grok_client.GrokChatClient") as client:
            with pytest.raises(ClassifierUnavailable):
                asyncio.run(classify_intent({"sources": {"request.text": "Page"}}))
        client.assert_not_called()
    finally:
        _restore_grok(previous)


def test_classifier_uses_configured_grok_model():
    previous = _pin_grok("synthetic-grok-key")
    client = FakeGrok(content=json.dumps(INFERENCE))
    try:
        with patch("backend.app.ai.providers.grok_client.GrokChatClient", return_value=client) as constructor:
            result = asyncio.run(classify_intent({"sources": {"request.text": "Page"}}))
        assert result == INFERENCE
        assert constructor.call_args.kwargs["base_url"] == "https://api.x.ai/v1"
        assert constructor.call_args.kwargs["api_key"] == "synthetic-grok-key"
        assert client.calls[0]["model"] == "grok-4.3"
        assert client.calls[0]["model"] == config.GROK_MODEL
    finally:
        _restore_grok(previous)


def test_classifier_provider_failure_is_unavailable(caplog):
    previous = _pin_grok("synthetic-grok-key")
    client = FakeGrok(error=TimeoutError("synthetic timeout"))
    try:
        with caplog.at_level("WARNING"):
            with patch("backend.app.ai.providers.grok_client.GrokChatClient", return_value=client):
                with pytest.raises(ClassifierUnavailable):
                    asyncio.run(classify_intent({"sources": {"request.text": "Clara, psicóloga en Madrid"}}))
        assert len(client.calls) == 2
        assert "category=timeout" in caplog.text
        assert "synthetic-grok-key" not in caplog.text
        assert "psicóloga" not in caplog.text
        assert "synthetic timeout" not in caplog.text
    finally:
        _restore_grok(previous)


def test_classifier_keeps_json_when_finish_reason_is_not_stop():
    previous = _pin_grok("synthetic-grok-key")
    client = FakeGrok(content=json.dumps(INFERENCE), finish_reason="length")
    try:
        with patch("backend.app.ai.providers.grok_client.GrokChatClient", return_value=client):
            result = asyncio.run(classify_intent({"instruction": "Clara, psicóloga en Madrid"}))
        assert result["title"] == INFERENCE["title"]
        assert len(client.calls) == 1
        assert client.calls[0]["max_tokens"] == 4096
    finally:
        _restore_grok(previous)


def test_classifier_fills_defaults_and_drops_illegal_paths():
    previous = _pin_grok("synthetic-grok-key")
    messy = """Nota del modelo:
```json
{"goal":"Primera visita","questions":[{"question_id":"who","question":"¿Para quién?","depends_on":["project.secret","request.text"]}],"blocker_ids":["missing","who"]}
```
"""
    client = FakeGrok(content=messy, finish_reason="length")
    try:
        with patch("backend.app.ai.providers.grok_client.GrokChatClient", return_value=client):
            result = asyncio.run(classify_intent({"instruction": "Clara, psicóloga en Madrid"}))
        assert result["title"] == "Clara, psicóloga en Madrid"
        assert result["goal"] == "Primera visita"
        assert result["scope"] == []
        assert result["questions"][0]["depends_on"] == ["request.text"]
        assert result["blocker_ids"] == ["who"]
        assert len(client.calls) == 1
    finally:
        _restore_grok(previous)


def test_cost_ceiling_still_allows_priced_grok_models():
    from backend.app.ai.agents.intent_clarification import MAX_COST_USD, MAX_INPUT_TOKENS, MAX_OUTPUT_TOKENS
    from backend.app.ai.providers.model_pricing import GROK_RATES, worst_case_usd

    assert MAX_OUTPUT_TOKENS == 4096
    for rate in GROK_RATES.values():
        ceiling = worst_case_usd(
            rate["input_usd_per_million"], rate["output_usd_per_million"],
            MAX_INPUT_TOKENS, MAX_OUTPUT_TOKENS,
        )
        assert ceiling <= MAX_COST_USD


class ClassifierRouteTests(f.ChargedCallerFixture):
    async def test_classifier_unavailable_is_spanish_503_without_charge(self):
        operation = IntentOperation(
            kind="intent", projectId="p", operation_id=str(uuid4()),
            operation_type="CREATE_INTENT", text="Page",
        )
        with patch.object(
            f.builder_ai, "apply_intent",
            new=AsyncMock(side_effect=IntentError("CLASSIFIER_UNAVAILABLE")),
        ):
            with self.assertRaises(f.HTTPException) as error:
                await f.builder_ai.build_with_ai(operation, SimpleNamespace(headers={"If-Match": "0"}))
        detail = error.exception.detail
        self.assertEqual(error.exception.status_code, 503)
        self.assertEqual(detail["code"], "CLASSIFIER_UNAVAILABLE")
        self.assertIn("no está disponible", detail["message"])
        self.assertIn("No se ha generado ningún resultado", detail["message"])
        self.assertEqual(self.db.ledger.documents, {})
        self.assertEqual(self.db.users.document["credit_balance"], 100)


class OversizedBuilderInputTests(f.ChargedCallerFixture):
    async def test_long_text_is_413_and_reserves_nothing(self):
        with self.assertRaises(f.HTTPException) as error:
            await self.call("builder", key="too-long-text", text="x" * 10000)
        detail = error.exception.detail
        self.assertEqual(error.exception.status_code, 413)
        self.assertNotEqual(error.exception.status_code, 402)
        self.assertEqual(detail["code"], "input_too_large")
        self.assertIn("demasiado largo", detail["message"])
        self.assertIn("No se ha cobrado nada", detail["message"])
        self.assertEqual(self.db.ledger.documents, {})
        self.assertNotIn("credit_pending_consumption", self.db.users.document)
        self.assertEqual(self.db.users.document["credit_balance"], 100)
        self.builder.assert_not_awaited()

    async def test_long_build_state_is_the_same_non_payment_error(self):
        payload = f.BuilderAIInput(userInput="corto", currentBuildState={"note": "x" * 40000})
        self.assertGreaterEqual(len(str(payload.currentBuildState)) // 4, 10000)
        with self.assertRaises(f.HTTPException) as error:
            await f.builder_ai.build_with_ai(payload, f.request("too-long-state"))
        self.assertEqual(error.exception.status_code, 413)
        self.assertEqual(error.exception.detail["code"], "input_too_large")
        self.assertEqual(self.db.ledger.documents, {})
        self.builder.assert_not_awaited()

    def test_cost_guard_block_is_not_payment_required(self):
        with self.assertRaises(f.HTTPException) as error:
            f.builder_ai.enforce_builder_ai_guards({
                "policy": {"allowed": True},
                "security": {"action": "allow"},
                "cost": {"action": "require_explicit_approval"},
            })
        self.assertEqual(error.exception.status_code, 413)
        self.assertEqual(error.exception.detail["code"], "input_too_large")
