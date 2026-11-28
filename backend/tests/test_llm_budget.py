"""Cost guard: estimate, breaker, caps, escalation, usage, and voice duration."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")

import asyncio
import logging
from datetime import datetime, timedelta, timezone

import pytest

from backend.app.ai.guards import llm_budget
from backend.app.ai.guards.llm_budget import (
    HAIKU_MODEL,
    PUBLIC_MESSAGES,
    SONNET_MODEL,
    BudgetDecision,
    aggregate_usage,
    authorize_voice,
    cap_output_tokens,
    compact_messages,
    decide_call,
    decide_writer_escalation,
    escalations_used,
    estimate_cost_usd,
    record_call,
    record_template,
    reset_budget_state,
    usage_events,
    usage_from_grok_payload,
    voice_cost_usd,
)
from backend.app.ai.providers.grok_client import GrokChatClient
from backend.app.services.builder_executor import iter_executor
from backend.app.services.builder_pipeline import PipelineError

NOW = datetime(2026, 11, 28, 9, 0, tzinfo=timezone.utc)


@pytest.fixture(autouse=True)
def _clean_budget():
    reset_budget_state()
    yield
    reset_budget_state()


def test_price_table_matches_the_founder_defaults():
    assert estimate_cost_usd(SONNET_MODEL, 1_000_000, 0) == 2.0
    assert estimate_cost_usd(SONNET_MODEL, 0, 1_000_000) == 10.0
    assert estimate_cost_usd(HAIKU_MODEL, 1_000_000, 0) == 0.5
    assert estimate_cost_usd(HAIKU_MODEL, 100_000, 0) == pytest.approx(0.01)
    assert estimate_cost_usd(HAIKU_MODEL, 100_001, 1_000_000) == pytest.approx(0.50 * 100_001 / 1_000_000 + 2.5)
    short = estimate_cost_usd("grok-4.3", 200_000, 1_000_000)
    long = estimate_cost_usd("grok-4.3", 200_001, 1_000_000)
    assert short == pytest.approx(200_000 * 1.25 / 1_000_000 + 2.5)
    assert long == pytest.approx(short * 2, rel=0.01) or long > short * 1.9
    assert voice_cost_usd(60) == pytest.approx(0.08)
    assert voice_cost_usd(300) == pytest.approx(0.40)
    assert estimate_cost_usd("claude-opus-4-6", 10, 10) is None


def test_breaker_downgrades_sonnet_and_rejects_above_the_second_threshold(caplog, monkeypatch):
    monkeypatch.setenv("AI_MAX_INPUT_TOKENS", "2000000")
    monkeypatch.setenv("AI_REQUEST_DOWNGRADE_USD", "0.08")
    monkeypatch.setenv("AI_REQUEST_REJECT_USD", "0.50")
    cheap = decide_call(
        provider="anthropic", model=SONNET_MODEL, input_tokens=1000, max_output_tokens_requested=200,
        feature="builder", user_id="u", project_id="web", now=NOW,
    )
    assert cheap.action == "allow"
    assert cheap.model == SONNET_MODEL

    with caplog.at_level(logging.WARNING):
        downgraded = decide_call(
            provider="anthropic", model=SONNET_MODEL, input_tokens=100_000, max_output_tokens_requested=1000,
            feature="builder", user_id="u", project_id="web", now=NOW,
        )
    assert downgraded.action == "downgrade"
    assert downgraded.model == HAIKU_MODEL
    assert "llm_breaker_trip" in caplog.text
    assert "action=downgrade" in caplog.text

    rejected = decide_call(
        provider="anthropic", model=SONNET_MODEL, input_tokens=1_000_000, max_output_tokens_requested=8000,
        feature="builder", user_id="u", project_id="web", now=NOW,
    )
    assert rejected.action == "reject"
    assert rejected.code == "usage_limit_request"


def test_daily_and_monthly_caps_reset(monkeypatch):
    monkeypatch.setenv("AI_DAILY_HARD_USD", "1")
    monkeypatch.setenv("AI_MONTHLY_HARD_USD", "1.5")
    monkeypatch.setenv("AI_DAILY_SOFT_USD", "100")
    monkeypatch.setenv("AI_MONTHLY_SOFT_USD", "100")
    monkeypatch.setenv("AI_REQUEST_REJECT_USD", "100")
    monkeypatch.setenv("AI_WEB_REJECT_USD", "100")

    async def spend(amount, moment):
        decision = BudgetDecision(
            action="allow", code="ok", model=HAIKU_MODEL, provider="anthropic", feature="chat",
            user_id="lucas", project_id="proj", max_output_tokens=10, input_tokens=10,
            estimated_cost_usd=amount, reason="ok",
        )
        await record_call(decision, input_tokens=0, output_tokens=0, now=moment)

    asyncio.run(spend(1.0, NOW))
    blocked = decide_call(
        provider="anthropic", model=HAIKU_MODEL, input_tokens=1000, max_output_tokens_requested=100,
        feature="chat", user_id="lucas", now=NOW,
    )
    assert blocked.action == "reject"
    assert blocked.code == "usage_limit"
    assert PUBLIC_MESSAGES[blocked.code] == "Has alcanzado el límite de uso de hoy"

    next_day = NOW + timedelta(days=1)
    opened = decide_call(
        provider="anthropic", model=HAIKU_MODEL, input_tokens=1000, max_output_tokens_requested=100,
        feature="chat", user_id="lucas", now=next_day,
    )
    assert opened.action == "allow"

    asyncio.run(spend(0.6, next_day))
    assert llm_budget.user_spend("lucas", next_day)[1] == pytest.approx(1.6)
    month_blocked = decide_call(
        provider="anthropic", model=HAIKU_MODEL, input_tokens=1000, max_output_tokens_requested=100,
        feature="chat", user_id="lucas", now=next_day,
    )
    assert month_blocked.action == "reject"
    assert month_blocked.code == "usage_limit_month"

    next_month = datetime(2026, 12, 1, 9, 0, tzinfo=timezone.utc)
    fresh = decide_call(
        provider="anthropic", model=HAIKU_MODEL, input_tokens=100, max_output_tokens_requested=20,
        feature="chat", user_id="lucas", now=next_month,
    )
    assert fresh.action == "allow"


def test_plan_multiplier_raises_the_hard_cap(monkeypatch):
    monkeypatch.setenv("AI_DAILY_HARD_USD", "1")
    monkeypatch.setenv("AI_DAILY_SOFT_USD", "100")
    monkeypatch.setenv("AI_MONTHLY_HARD_USD", "100")
    monkeypatch.setenv("AI_REQUEST_REJECT_USD", "100")

    async def spend():
        decision = BudgetDecision(
            action="allow", code="ok", model=HAIKU_MODEL, provider="anthropic", feature="chat",
            user_id="owner", project_id="", max_output_tokens=10, input_tokens=10,
            estimated_cost_usd=1.2, reason="ok",
        )
        await record_call(decision, input_tokens=0, output_tokens=0, now=NOW)

    asyncio.run(spend())
    free = decide_call(
        provider="anthropic", model=HAIKU_MODEL, input_tokens=100, max_output_tokens_requested=20,
        feature="chat", user_id="owner", plan="free", now=NOW,
    )
    paid = decide_call(
        provider="anthropic", model=HAIKU_MODEL, input_tokens=100, max_output_tokens_requested=20,
        feature="chat", user_id="owner", plan="premium", now=NOW,
    )
    assert free.action == "reject"
    assert paid.action == "allow"


def test_writer_escalates_once_when_the_score_is_below_the_threshold():
    seen = []

    async def classify(_data):
        return {"title": "Clara, psicóloga", "goal": "Citas en Madrid"}

    async def blueprint(_project):
        return {"title": "Consulta de Clara", "summary": "Primera visita", "priorities": ["La consulta", "Pedir cita"]}

    async def draft(data):
        seen.append(data.get("writerModel"))
        return {
            "title": "Clara atiende en Madrid",
            "subtitle": "Psicóloga. Primera visita con un siguiente paso claro.",
            "cta": "Pedir cita con Clara",
            "sections": [
                {"title": "La consulta", "text": "Clara escucha y propone el siguiente paso para la primera visita."},
                {"title": "Pedir cita", "text": "Clara reserva la primera visita en Madrid."},
            ],
        }

    async def judge(_draft, _instruction):
        return {
            "ok": True,
            "summary": "Baja.",
            "scores": {"visual_hierarchy": 2, "selling_microcopy": 2, "objections": 2, "specificity": 2},
            "total": 8,
        }

    async def run():
        try:
            async for _event in iter_executor(
                project={
                    "project_id": "proj_cost_escalation",
                    "user_id": "alice",
                    "input_content": "Clara, psicóloga en Madrid. Quiere una web para pedir cita.",
                    "route": "idea",
                    "diagnosis": {"summary": "Clara necesita una página de cita."},
                },
                owner_id="alice",
                instruction="Clara, psicóloga en Madrid. Quiere una web para pedir cita.",
                classify=classify,
                blueprint=blueprint,
                draft_landing=draft,
                judge=judge,
                max_iterations=3,
                writer_model=SONNET_MODEL,
            ):
                pass
        except PipelineError as exc:
            return exc
        return None

    error = asyncio.run(run())
    assert error is not None
    assert error.code == "landing_rejected"
    assert seen[0] == HAIKU_MODEL
    assert seen[1] == SONNET_MODEL
    assert seen[2] == SONNET_MODEL
    assert escalations_used("proj_cost_escalation") == 1
    assert decide_writer_escalation(score=8, project_id="proj_cost_escalation") == "stay"
    assert decide_writer_escalation(score=12, project_id="fresh_web") == "stay"
    assert decide_writer_escalation(score=11, project_id="fresh_web") == "escalate"


def test_usage_event_keeps_provider_tokens_and_templates_are_free():
    parsed = usage_from_grok_payload({
        "usage": {
            "prompt_tokens": 11,
            "completion_tokens": 4,
            "prompt_tokens_details": {"cached_tokens": 2},
        }
    })
    assert parsed == {"input_tokens": 11, "output_tokens": 4, "cached_tokens": 2}

    class Response:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "choices": [{"finish_reason": "stop", "message": {"content": "hola"}}],
                "usage": {
                    "prompt_tokens": 11,
                    "completion_tokens": 4,
                    "prompt_tokens_details": {"cached_tokens": 2},
                },
            }

    class Http:
        async def post(self, *args, **kwargs):
            return Response()

        async def aclose(self):
            return None

    async def call():
        client = GrokChatClient(api_key="not-a-real-key", timeout=1)
        client._http = Http()
        with llm_budget.llm_scope(feature="classifier", user_id="u1", project_id="p1"):
            result = await client.chat.completions.create(
                model="grok-4.3",
                messages=[{"role": "user", "content": "hola"}],
                max_tokens=32,
            )
        return result

    result = asyncio.run(call())
    assert result.usage.input_tokens == 11
    assert result.usage.output_tokens == 4
    assert result.usage.cached_tokens == 2
    event = usage_events()[-1]
    assert event["feature"] == "classifier"
    assert event["user_id"] == "u1"
    assert event["project_id"] == "p1"
    assert event["provider"] == "xai"
    assert event["input_tokens"] == 11
    assert event["output_tokens"] == 4
    assert event["cached_tokens"] == 2
    assert event["estimated_cost_usd"] > 0
    assert event["breaker_action"] == "allow"

    template = record_template(user_id="u1", project_id="p1", now=NOW)
    assert template["feature"] == "whatsapp_reminder"
    assert template["input_tokens"] == 0
    assert template["output_tokens"] == 0
    assert template["cached_tokens"] == 0
    assert template["estimated_cost_usd"] == 0
    summary = aggregate_usage()
    assert summary["by_feature"]["whatsapp_reminder"]["calls"] == 1
    assert summary["by_feature"]["classifier"]["input_tokens"] == 11


def test_voice_session_stops_at_five_minutes_for_the_demo_and_ten_for_embed():
    base = datetime(2026, 11, 28, 12, 0, tzinfo=timezone.utc)
    for step in range(5):
        grant = authorize_voice(
            surface="demo", subject="visitor", token_seconds=60, now=base + timedelta(seconds=60 * step),
        )
        assert grant["allowed"] is True
    blocked = authorize_voice(surface="demo", subject="visitor", token_seconds=60, now=base + timedelta(seconds=300))
    assert blocked["allowed"] is False
    assert blocked["message"] == "La sesión de voz ha alcanzado su límite."
    assert "grok" not in blocked["message"].lower()
    resumed = authorize_voice(
        surface="demo", subject="visitor", token_seconds=60, now=base + timedelta(seconds=300 + 120),
    )
    assert resumed["allowed"] is True

    for step in range(10):
        grant = authorize_voice(
            surface="embed", subject="agent-1", token_seconds=60, user_id="owner",
            now=base + timedelta(seconds=60 * step),
        )
        assert grant["allowed"] is True
    stopped = authorize_voice(
        surface="embed", subject="agent-1", token_seconds=60, user_id="owner",
        now=base + timedelta(seconds=600),
    )
    assert stopped["allowed"] is False


def test_input_is_compacted_and_output_is_capped(monkeypatch):
    _copied, tokens, rejected = compact_messages(
        [{"role": "user", "content": "hola " * 50_000}],
        max_tokens=100,
    )
    assert rejected is False
    assert tokens <= 100
    _huge, _tokens, still_over = compact_messages(
        [{"role": "user", "content": "x" * 10_000}],
        max_tokens=1,
    )
    assert still_over is True
    monkeypatch.setenv("AI_MAX_OUTPUT_TOKENS", "128")
    assert cap_output_tokens(8000) == 128
    assert cap_output_tokens(None) == 128


def test_public_limit_messages_do_not_name_a_model():
    for message in PUBLIC_MESSAGES.values():
        lowered = message.lower()
        assert "haiku" not in lowered
        assert "sonnet" not in lowered
        assert "claude" not in lowered
        assert "grok" not in lowered
        assert "gpt" not in lowered
