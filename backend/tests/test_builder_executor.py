"""Streamed executor steps for a fictitious Clara landing. Providers are stand-ins."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")

import asyncio
import logging

from backend.app.services.builder_executor import STEPS, encode_sse, iter_executor, with_heartbeats
from backend.app.services.builder_executor_providers import orchestrator_name, writer_name, writer_payload
from backend.app.services.builder_pipeline import PipelineError, landing_brief, run_pipeline

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


def _header():
    return {
        "title": "Clara atiende en Madrid",
        "subtitle": "Psicóloga. Primera visita con un siguiente paso claro.",
        "cta": "Pedir cita con Clara",
    }


async def _section(data):
    assert data["diagnosis"]["summary"].startswith("Clara")
    assert "Pedir cita" in data["blueprint"]["priorities"]
    if data["slot"] == "header":
        await asyncio.sleep(0.05)
        return _header()
    return {"title": data["slot"], "text": f"Clara explica {data['slot'].lower()} sin usar una plantilla."}


async def _classify(_data):
    return {"title": "Clara, psicóloga", "goal": "Conseguir citas en Madrid"}


async def _blueprint(project):
    assert "cita" in project["diagnosis"]["summary"]
    return PLAN


def test_brief_includes_priorities_and_diagnosis():
    brief = landing_brief({
        "instruction": CLARA,
        "intent": {"title": "Clara, psicóloga", "goal": "Citas"},
        "blueprint": PLAN,
        "diagnosis": PROJECT["diagnosis"],
        "slot": "La consulta",
    })
    assert brief["priorities"] == PLAN["priorities"]
    assert "plantilla" in brief["diagnosis"]
    assert brief["blueprintSummary"] == PLAN["summary"]
    assert "La consulta" == brief["slot"]
    encoded = writer_payload({
        "instruction": CLARA, "intent": {"title": "Clara"}, "blueprint": PLAN, "diagnosis": PROJECT["diagnosis"],
    })
    assert "priorities" in encoded
    assert "diagnosis" in encoded


def test_provider_defaults_are_grok_then_claude(monkeypatch):
    monkeypatch.delenv("BUILDER_EXECUTOR_ORCHESTRATOR", raising=False)
    monkeypatch.delenv("BUILDER_EXECUTOR_WRITER", raising=False)
    assert orchestrator_name() == "grok"
    assert writer_name() == "anthropic"


def test_clara_stream_emits_real_steps_sections_and_a_heartbeat():
    async def judge(draft, instruction):
        assert "Clara" in instruction
        assert "Clara" in draft["title"]
        return {"ok": True, "summary": "La página habla de Clara y de pedir cita."}

    async def run():
        events = []
        async for event in with_heartbeats(iter_executor(
            project=PROJECT, owner_id="alice", instruction=CLARA,
            classify=_classify, blueprint=_blueprint, draft_landing=None,
            draft_section=_section, judge=judge,
        ), interval=0.01):
            events.append(event)
        return events

    events = asyncio.run(run())
    labels = [event.get("label") for event in events if event.get("type") == "step" and event.get("status") == "done"]
    assert labels == [label for _step_id, label in STEPS]
    sections = [event for event in events if event.get("type") == "section"]
    assert sections
    assert any("Clara" in event.get("html", "") for event in sections)
    assert all("Convierte dudas en decisiones claras" not in event.get("html", "") for event in sections)
    assert any(event.get("type") == "heartbeat" for event in events)
    result = next(event for event in events if event.get("type") == "result")
    assert "Pedir cita con Clara" in result["public"]["html"]
    assert "no se ha fingido" in result["summary"]
    assert "agente de chat" in result["summary"]
    states = [event.get("phase") for event in events if event.get("type") == "state"]
    assert states[0] == "construyendo"
    assert states[-1] == "completado"


def test_judge_retries_once_then_accepts_and_logs_only_the_category(caplog):
    calls = {"n": 0}

    async def judge(draft, _instruction):
        calls["n"] += 1
        if calls["n"] == 1:
            return {"ok": False, "summary": "No encaja."}
        return {"ok": True, "summary": "Ahora sí habla de Clara."}

    async def run():
        with caplog.at_level(logging.WARNING):
            return await run_pipeline(
                project=PROJECT, owner_id="alice", instruction=CLARA,
                classify=_classify, blueprint=_blueprint,
                draft_landing=lambda _data: {
                    "title": "Clara atiende en Madrid",
                    "subtitle": "Primera visita.",
                    "cta": "Pedir cita con Clara",
                    "sections": [{"title": "La consulta", "text": "Clara escucha y propone el siguiente paso."}],
                },
                judge=judge,
            )

    result = asyncio.run(run())
    assert calls["n"] == 2
    assert "Clara atiende en Madrid" in result["public"]["html"]
    assert "category=rubric" in caplog.text
    assert "psicóloga" not in caplog.text
    assert "synthetic" not in caplog.text.lower()


def test_rejected_page_is_not_returned():
    async def judge(_draft, _instruction):
        return {"ok": False, "summary": "Sigue siendo genérica."}

    async def run():
        try:
            await run_pipeline(
                project=PROJECT, owner_id="alice", instruction=CLARA,
                classify=_classify, blueprint=_blueprint,
                draft_landing=lambda _data: {
                    "title": "Convierte dudas en decisiones claras",
                    "subtitle": "Plantilla.",
                    "cta": "Agendar consulta",
                    "sections": [{"title": "Servicio", "text": "Texto de plantilla."}],
                },
                judge=judge,
            )
        except PipelineError as exc:
            return exc
        return None

    error = asyncio.run(run())
    assert error.code == "landing_rejected"
    assert "no se ha sustituido" in error.message.lower() or "No se ha sustituido" in error.message


def test_sse_heartbeat_is_a_comment():
    assert encode_sse({"type": "heartbeat"}) == ": heartbeat\n\n"
    encoded = encode_sse({"type": "step", "id": "entender", "label": "Entendiendo tu negocio", "status": "done"})
    assert encoded.startswith("event: step\n")
    assert "Entendiendo tu negocio" in encoded
