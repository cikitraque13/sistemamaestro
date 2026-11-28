"""Pace selects an allowlisted Claude writer and nothing in the ledger."""

import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")

import asyncio
from pathlib import Path

import pytest

from backend.app.ai.providers.model_pricing import ANTHROPIC_RATES
from backend.app.services.builder_pace import PACE_WRITER_MODELS, PaceError, writer_model_for_pace


def test_rapido_and_profundo_map_to_the_allowlisted_models():
    assert writer_model_for_pace("rapido", configured="claude-sonnet-5-5") == "claude-haiku-5-5"
    assert writer_model_for_pace("profundo", configured="claude-haiku-5-5") == "claude-sonnet-5-5"
    assert writer_model_for_pace(None, configured="claude-haiku-5-5") == "claude-haiku-5-5"
    assert writer_model_for_pace("", configured="claude-sonnet-5-5") == "claude-sonnet-5-5"


def test_unknown_pace_and_unpriced_configured_model_are_refused():
    with pytest.raises(PaceError):
        writer_model_for_pace("opus", configured="claude-haiku-5-5")
    with pytest.raises(PaceError):
        writer_model_for_pace(None, configured="claude-opus-4-6")


def test_pace_models_stay_inside_the_configured_allowlist():
    source = Path("backend/app/core/config.py").read_text()
    for model in PACE_WRITER_MODELS.values():
        assert model in ANTHROPIC_RATES
        assert model in source
    assert "claude-opus" not in PACE_WRITER_MODELS.values()


def test_pace_module_does_not_touch_the_ledger():
    text = Path("backend/app/services/builder_pace.py").read_text()
    assert "consumption_engine" not in text
    assert "services.credits" not in text
    assert "tier_amounts" not in text
    assert "grok" not in text.lower()
    assert "x.ai" not in text


def test_draft_page_forwards_the_pace_model_and_leaves_grok_alone(monkeypatch):
    from backend.app.services import builder_executor_providers as providers

    seen = {}

    async def fake_write(brief, model=None):
        seen["model"] = model
        seen["brief"] = brief
        return {"title": "T", "subtitle": "S", "cta": "C", "sections": [{"title": "A", "text": "B"}]}

    monkeypatch.setattr(
        "backend.app.services.builder_claude_loop.write_landing_with_tools",
        fake_write,
    )
    monkeypatch.setenv("BUILDER_EXECUTOR_WRITER", "anthropic")
    asyncio.run(providers.draft_page({
        "instruction": "Clara",
        "writerModel": "claude-sonnet-5-5",
    }))
    assert seen["model"] == "claude-sonnet-5-5"
    assert "writerModel" not in seen["brief"]

    grok_called = {}

    async def fake_grok(payload, *, kind):
        grok_called["kind"] = kind
        grok_called["payload"] = payload
        return {"title": "T", "subtitle": "S", "cta": "C", "sections": [{"title": "A", "text": "B"}]}

    monkeypatch.setattr(providers, "_draft_grok", fake_grok)
    monkeypatch.setenv("BUILDER_EXECUTOR_WRITER", "grok")
    asyncio.run(providers.draft_page({
        "instruction": "Clara",
        "writerModel": "claude-haiku-5-5",
    }))
    assert grok_called["kind"] == "page"
    assert "claude" not in grok_called["payload"]
