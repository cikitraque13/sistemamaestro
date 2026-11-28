"""Agent loop, tool schema, cache, thinking bound, and the generic-copy bar."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")

import asyncio
import json
import logging

import pytest

from backend.app.services.builder_claude_loop import (
    CACHE_MIN_INPUT_TOKENS,
    TOKEN_USD_PER_MILLION,
    build_copy_request,
    cache_min_tokens,
    cached_prefix_tokens,
    executor_cost_usd,
    run_copy_tool_loop,
    stable_context,
    thinking_config,
)
from backend.app.services.builder_copy_rubric import critique_copy
from backend.app.services.builder_copy_tools import INPUT_SCHEMA, tool_definition, validate_tool_input
from backend.app.services.builder_evaluation import EVAL_PASS_THRESHOLD, deterministic_scores
from backend.app.services.builder_executor import iter_executor
from backend.app.services.builder_executor_providers import judge_request_body
from backend.app.services.builder_pipeline import PipelineError, run_pipeline
from backend.app.services.builder_system_prompt import PROMPT_VERSION, SECTION_ROLES, SYSTEM_PROMPT

CLARA = "Clara, psicóloga en Madrid. Quiere una web para pedir cita."
PROJECT = {
    "project_id": "proj_clara",
    "user_id": "alice",
    "input_content": CLARA,
    "route": "idea",
    "diagnosis": {"summary": "Clara necesita una página de cita, no una plantilla."},
}
PLAN = {
    "title": "Consulta de Clara",
    "summary": "Una landing de primera visita",
    "priorities": ["La consulta", "Cómo trabaja", "Pedir cita"],
}
CONTEXT = {
    "instruction": CLARA,
    "intent": {"title": "Clara, psicóloga", "goal": "Conseguir citas en Madrid"},
    "plan": PLAN,
    "project": PROJECT,
}


def _good():
    return {
        "title": "Clara atiende en Madrid",
        "subtitle": "Psicóloga. Primera visita con un siguiente paso claro.",
        "cta": "Pedir cita con Clara",
        "sections": [
            {"title": "La consulta", "text": "Clara explica la primera visita en Madrid.", "role": "oferta"},
            {"title": "La duda", "text": "La primera sesión no es un compromiso eterno.", "role": "objecion"},
            {"title": "Pedir cita", "text": "Escribes a Clara y acordáis el día.", "role": "paso"},
        ],
    }


def _generic():
    return {
        "title": "Convierte dudas en decisiones claras",
        "subtitle": "Plantilla.",
        "cta": "Agendar consulta",
        "sections": [{"title": "Servicio", "text": "Texto de plantilla.", "role": "oferta"}],
    }


async def _classify(_data):
    return {"title": "Clara, psicóloga", "goal": "Conseguir citas en Madrid"}


async def _blueprint(_project):
    return PLAN


def test_prompt_version_and_banned_phrase_fail_closed():
    assert PROMPT_VERSION == "builder-copy-v1"
    assert len(SYSTEM_PROMPT) >= 2000
    assert PROMPT_VERSION in SYSTEM_PROMPT
    assert critique_copy(_generic(), CONTEXT)["ok"] is False
    scored = deterministic_scores(_generic(), CONTEXT)
    assert scored["total"] < EVAL_PASS_THRESHOLD
    assert critique_copy(_good(), CONTEXT)["ok"] is True
    assert deterministic_scores(_good(), CONTEXT)["total"] >= EVAL_PASS_THRESHOLD


def test_tool_schema_is_closed_and_repairs_invented_fields():
    schema = INPUT_SCHEMA
    assert schema["additionalProperties"] is False
    assert schema["required"] == ["title", "subtitle", "cta", "sections"]
    role = schema["properties"]["sections"]["items"]["properties"]["role"]
    assert role["enum"] == list(SECTION_ROLES)
    assert schema["properties"]["sections"]["items"]["additionalProperties"] is False
    tool = tool_definition()
    assert tool["strict"] is True
    assert tool["cache_control"] == {"type": "ephemeral"}
    payload = {**_good(), "html": "<script>alert(1)</script>", "publisher": True}
    cleaned, errors = validate_tool_input(payload)
    assert cleaned["title"].startswith("Clara")
    assert "html" not in cleaned
    assert errors == ["invented:html,publisher"]
    rejected, problems = validate_tool_input({**_good(), "sections": [{**_good()["sections"][0], "role": "magic"}]})
    assert rejected is None
    assert any(item.startswith("enum:") for item in problems)


@pytest.mark.parametrize("model", ["claude-haiku-5-5", "claude-sonnet-5-5"])
def test_request_caches_the_stable_prefix_and_does_not_send_a_thinking_budget(model):
    brief = {
        "instruction": CLARA,
        "intentTitle": "Clara",
        "preferences": {"tone": "sobrio", "style": "calido"},
        "revisionNotes": "Falta el oficio.",
        "promptVersion": PROMPT_VERSION,
    }
    request = build_copy_request(
        model=model, brief=brief,
        messages=[{"role": "user", "content": "Escribe la landing."}],
        max_tokens=4096, effort="high",
    )
    encoded = json.dumps(request)
    assert request["model"] == model
    assert "budget_tokens" not in encoded
    assert request["thinking"] == {"type": "adaptive", "display": "summarized"}
    assert request["thinking"]["type"] != "disabled"
    assert request["tool_choice"] == {"type": "auto"}
    assert request["max_tokens"] == 4096
    assert request["output_config"] == {"effort": "high"}
    assert request["system"][0]["cache_control"]["type"] == "ephemeral"
    assert request["system"][1]["cache_control"]["type"] == "ephemeral"
    assert "sobrio" in request["system"][1]["text"]
    assert "Falta el oficio" not in request["system"][1]["text"]
    assert "Falta el oficio" in request["messages"][0]["content"]
    assert "revisionNotes" not in stable_context(brief)
    assert cached_prefix_tokens(brief) >= cache_min_tokens(model)
    assert cache_min_tokens(model) == CACHE_MIN_INPUT_TOKENS[model] == 512
    try:
        thinking_config("claude-opus-secret")
    except PipelineError as exc:
        assert exc.code == "landing_unavailable"
    else:
        raise AssertionError("an unpriced model must not be called")


def test_sonnet_worst_case_and_typical_use_the_production_card():
    brief = {"instruction": CLARA, "promptVersion": PROMPT_VERSION}
    prefix = cached_prefix_tokens(brief)
    card = TOKEN_USD_PER_MILLION["claude-sonnet-5-5"]
    assert card == {"input": 2.0, "output": 10.0, "cache_read": 0.10, "cache_write_5m": 2.50}
    common = {
        "output_tokens_per_call": 4096,
        "prefix_tokens": prefix,
        "uncached_tokens_per_call": 200,
    }
    worst = executor_cost_usd("claude-sonnet-5-5", iterations=3, tool_turns_per_iteration=3, **common)
    typical = executor_cost_usd("claude-sonnet-5-5", iterations=1, tool_turns_per_iteration=1, **common)
    haiku = executor_cost_usd("claude-haiku-5-5", iterations=3, tool_turns_per_iteration=3, **common)
    assert worst["calls"] == 9
    assert typical["calls"] == 1
    assert abs(worst["output_usd"] - (9 * 4096 * 10 / 1_000_000)) < 1e-9
    assert abs(typical["output_usd"] - (4096 * 10 / 1_000_000)) < 1e-9
    assert worst["cache_write_usd"] == prefix * 2.50 / 1_000_000
    assert worst["cache_read_usd"] == 8 * prefix * 0.10 / 1_000_000
    assert typical["cache_read_usd"] == 0
    assert worst["total_usd"] > typical["total_usd"] > 0
    assert worst["total_usd"] > haiku["total_usd"]


def test_tool_loop_repairs_then_rejects_a_bad_enum_without_leaking_the_value(caplog):
    script = [
        {"content": [{"type": "tool_use", "id": "t1", "name": "submit_landing_copy", "input": {**_good(), "html": "<b>"}}],
         "usage": {"cache_creation_input_tokens": 40, "cache_read_input_tokens": 0}},
    ]

    async def complete(messages):
        if len(script) == 1 and len(messages) == 1:
            return script.pop(0)
        raise AssertionError("a repaired payload must not call the model again")

    with caplog.at_level(logging.INFO):
        draft = asyncio.run(run_copy_tool_loop({"instruction": CLARA}, complete))
    assert "html" not in draft
    assert "cache_read_input_tokens=0" in caplog.text
    assert "cache_creation_input_tokens=40" in caplog.text
    assert "psicóloga" not in caplog.text

    calls = {"n": 0}

    async def repair(messages):
        calls["n"] += 1
        if calls["n"] == 1:
            bad = {**_good(), "sections": [{**_good()["sections"][0], "role": "invented-role"}]}
            return {"content": [{"type": "tool_use", "id": "t2", "name": "submit_landing_copy", "input": bad}], "usage": {}}
        result = messages[-1]["content"][0]["content"]
        assert "invented-role" not in result
        assert "enum:" in result
        return {"content": [{"type": "tool_use", "id": "t3", "name": "submit_landing_copy", "input": _good()}], "usage": {"cache_read_input_tokens": 40, "cache_creation_input_tokens": 0}}

    fixed = asyncio.run(run_copy_tool_loop({"instruction": CLARA}, repair))
    assert fixed["sections"][0]["role"] == "oferta"
    assert calls["n"] == 2


def test_provider_error_is_not_retried():
    calls = {"n": 0}

    async def complete(_messages):
        calls["n"] += 1
        raise TimeoutError("anthropic timed out")

    try:
        asyncio.run(run_copy_tool_loop({"instruction": CLARA}, complete))
    except PipelineError as exc:
        assert exc.code == "landing_unavailable"
    else:
        raise AssertionError("timeout must fail the build")
    assert calls["n"] == 1


def test_judge_body_includes_section_text():
    body = judge_request_body(_good(), CLARA)
    assert body["sections"][0]["text"].startswith("Clara explica") or "primera visita" in body["sections"][0]["text"]
    assert "text" in body["sections"][1]


def test_generic_copy_is_rejected_even_when_the_judge_would_accept_it():
    calls = {"n": 0}

    async def judge(_draft, _instruction):
        calls["n"] += 1
        return {"ok": True, "summary": "Aceptada.", "scores": {"visual_hierarchy": 5, "selling_microcopy": 5, "objections": 5, "specificity": 5}, "total": 20}

    async def run():
        try:
            await run_pipeline(
                project=PROJECT, owner_id="alice", instruction=CLARA,
                classify=_classify, blueprint=_blueprint, draft_landing=lambda _data: _generic(), judge=judge,
            )
        except PipelineError as exc:
            return exc
        return None

    error = asyncio.run(run())
    assert error.code == "landing_rejected"
    assert calls["n"] == 0


def test_a_low_score_does_not_complete_and_a_passing_score_is_stored():
    async def low(_draft, instruction):
        assert "primera visita" in _draft["sections"][0]["text"]
        assert "Clara" in instruction
        return {"ok": True, "summary": "Baja.", "scores": {"visual_hierarchy": 2, "selling_microcopy": 2, "objections": 2, "specificity": 2}, "total": 8}

    async def fail():
        events = []
        try:
            async for event in iter_executor(
                project=PROJECT, owner_id="alice", instruction=CLARA,
                classify=_classify, blueprint=_blueprint, draft_landing=lambda _data: _good(), judge=low,
                max_iterations=1,
            ):
                events.append(event)
        except PipelineError as exc:
            return exc, events
        return None, events

    error, events = asyncio.run(fail())
    assert error.code == "landing_rejected"
    assert not any(event.get("phase") == "completado" for event in events)

    async def high(draft, _instruction):
        assert draft["sections"][2]["text"]
        return {"ok": True, "summary": "La página habla de Clara.", "scores": {"visual_hierarchy": 5, "selling_microcopy": 4, "objections": 4, "specificity": 5}, "total": 18}

    async def ok():
        return await run_pipeline(
            project=PROJECT, owner_id="alice", instruction=CLARA,
            classify=_classify, blueprint=_blueprint, draft_landing=lambda _data: _good(), judge=high,
        )

    result = asyncio.run(ok())
    version = result["preview"]["versions"][-1]
    assert version["promptVersion"] == PROMPT_VERSION
    assert result["preview"]["promptVersion"] == PROMPT_VERSION
    assert version["evaluation"]["passed"] is True
    assert version["evaluation"]["total"] >= EVAL_PASS_THRESHOLD
    assert version["evaluation"]["threshold"] == EVAL_PASS_THRESHOLD
    assert "Clara" in version["html"]


def test_timeout_and_provider_failure_do_not_emit_completed():
    clock = {"now": 0}

    async def slow(_data):
        clock["now"] = 50
        return _good()

    async def run_timeout():
        events = []
        try:
            async for event in iter_executor(
                project=PROJECT, owner_id="alice", instruction=CLARA,
                classify=_classify, blueprint=_blueprint, draft_landing=slow, judge=lambda *_args: {"ok": True, "summary": "No"},
                now=lambda: clock["now"], timeout_seconds=10,
            ):
                events.append(event)
        except PipelineError as exc:
            return exc, events
        return None, events

    error, events = asyncio.run(run_timeout())
    assert error.code == "executor_timeout"
    assert not any(event.get("phase") == "completado" for event in events)

    calls = {"n": 0}

    async def boom(_data):
        calls["n"] += 1
        raise PipelineError("landing_unavailable")

    async def run_boom():
        try:
            await run_pipeline(
                project=PROJECT, owner_id="alice", instruction=CLARA,
                classify=_classify, blueprint=_blueprint, draft_landing=boom,
            )
        except PipelineError as exc:
            return exc
        return None

    failed = asyncio.run(run_boom())
    assert failed.code == "landing_unavailable"
    assert calls["n"] == 1
