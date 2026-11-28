"""Real builder steps, streamed as events.

Grok classifies, plans and judges. Claude writes the visible copy. There is
no backend that configures a chat agent on the page, so the last step says so.
"""
import logging

from backend.app.services.blueprint import BlueprintGenerationError
from backend.app.services.builder_pipeline import (
    PipelineError,
    _clip,
    _next_preview,
    normalize_draft,
    public_preview,
    render_partial_html,
    render_preview_html,
    section_slots,
    structural_judge,
)

logger = logging.getLogger(__name__)

MAX_DRAFT_ATTEMPTS = 2
AGENT_HONESTY = (
    "No hay un servicio para configurar un agente de chat en la web; no se ha fingido."
)

STEPS = (
    ("entender", "Entendiendo tu negocio"),
    ("estructura", "Estructura de secciones"),
    ("textos", "Textos"),
    ("diseno", "Diseño"),
    ("revision", "Revisión final"),
)

STATE_MESSAGES = {
    "idle": "El ejecutor está listo.",
    "construyendo": "Construyendo tu página.",
    "iterando": "Iterando sobre la versión guardada.",
    "error": "No se ha podido preparar la página.",
    "completado": "Página guardada.",
}


def _log(category):
    logger.warning("executor_rejected category=%s", category)


def _step(step_id, status, summary=""):
    label = dict(STEPS)[step_id]
    event = {"type": "step", "id": step_id, "label": label, "status": status}
    if summary:
        event["summary"] = _clip(summary, 240)
    return event


def _diagnosis(project):
    value = project.get("diagnosis")
    return value if isinstance(value, dict) else {}


async def _maybe_await(value):
    if hasattr(value, "__await__"):
        return await value
    return value


async def _produce_draft(*, text, intent, plan, diagnosis, draft_landing, draft_section):
    payload = {
        "instruction": text,
        "intent": intent,
        "blueprint": plan,
        "diagnosis": diagnosis,
    }
    sections = []
    if draft_section is not None:
        header = await _maybe_await(draft_section({**payload, "slot": "header", "prior": []}))
        if not isinstance(header, dict):
            raise PipelineError("landing_unavailable")
        title = _clip(header.get("title"), 160)
        subtitle = _clip(header.get("subtitle"), 400)
        cta = _clip(header.get("cta"), 80)
        events = []
        for slot in section_slots(plan):
            piece = await _maybe_await(draft_section({
                **payload, "slot": slot, "prior": [item["title"] for item in sections],
            }))
            if not isinstance(piece, dict):
                raise PipelineError("landing_unavailable")
            section = {"title": _clip(piece.get("title") or slot, 120), "text": _clip(piece.get("text"), 800)}
            if not section["title"] or not section["text"]:
                raise PipelineError("landing_unavailable")
            sections.append(section)
            events.append({
                "type": "section",
                "index": len(sections) - 1,
                "title": section["title"],
                "text": section["text"],
                "html": render_partial_html(title=title, subtitle=subtitle, cta=cta, sections=sections),
            })
        draft = normalize_draft({
            "title": title, "subtitle": subtitle, "cta": cta, "sections": sections,
        })
        return draft, events

    try:
        raw = await _maybe_await(draft_landing(payload))
        draft = normalize_draft(raw)
    except PipelineError:
        raise
    except Exception as exc:
        raise PipelineError("landing_unavailable") from exc
    events = []
    built = []
    for section in draft["sections"]:
        built.append(section)
        events.append({
            "type": "section",
            "index": len(built) - 1,
            "title": section["title"],
            "text": section["text"],
            "html": render_partial_html(
                title=draft["title"], subtitle=draft["subtitle"], cta=draft["cta"], sections=built,
            ),
        })
    return draft, events


async def iter_executor(*, project, owner_id, instruction, classify, blueprint, draft_landing, previous=None, created_at="", judge=None, draft_section=None):
    text = " ".join(str(instruction or "").split())
    if not text:
        raise PipelineError("empty_instruction")
    phase = "iterando" if previous else "construyendo"
    yield {"type": "state", "phase": phase, "message": STATE_MESSAGES[phase]}

    yield _step("entender", "in_progress")
    try:
        intent = await _maybe_await(classify({
            "instruction": text,
            "input_content": project.get("input_content") or "",
            "route": project.get("route") or "",
        }))
    except PipelineError:
        yield _step("entender", "error", "No se ha podido leer el negocio.")
        raise
    except Exception as exc:
        yield _step("entender", "error", "No se ha podido leer el negocio.")
        raise PipelineError("CLASSIFIER_UNAVAILABLE") from exc
    if not isinstance(intent, dict) or not str(intent.get("title") or "").strip():
        yield _step("entender", "error", "No se ha podido leer el negocio.")
        raise PipelineError("CLASSIFIER_UNAVAILABLE")
    yield _step("entender", "done", _clip(intent.get("title"), 160))

    yield _step("estructura", "in_progress")
    brief = dict(project)
    brief["input_content"] = text
    try:
        plan = await _maybe_await(blueprint(brief))
    except BlueprintGenerationError as exc:
        yield _step("estructura", "error", "No se ha podido preparar la estructura.")
        raise PipelineError(exc.code) from exc
    except PipelineError:
        yield _step("estructura", "error", "No se ha podido preparar la estructura.")
        raise
    except Exception as exc:
        yield _step("estructura", "error", "No se ha podido preparar la estructura.")
        raise PipelineError("blueprint_provider_unavailable") from exc
    slots = section_slots(plan if isinstance(plan, dict) else {})
    yield _step("estructura", "done", "Secciones: " + ", ".join(slots))

    diagnosis = _diagnosis(project)
    draft = None
    section_events = []
    for attempt in range(1, MAX_DRAFT_ATTEMPTS + 1):
        if attempt > 1:
            yield {"type": "state", "phase": "iterando", "message": STATE_MESSAGES["iterando"]}
        yield _step("textos", "in_progress")
        try:
            draft, section_events = await _produce_draft(
                text=text, intent=intent, plan=plan, diagnosis=diagnosis,
                draft_landing=draft_landing, draft_section=draft_section,
            )
        except PipelineError:
            yield _step("textos", "error", "No se ha podido escribir el texto.")
            raise
        for event in section_events:
            yield event
        yield _step("textos", "done", f"{len(draft['sections'])} secciones escritas.")

        yield _step("diseno", "in_progress")
        html = render_preview_html(draft)
        yield {
            "type": "section",
            "index": len(draft["sections"]),
            "title": draft["title"],
            "text": draft["subtitle"],
            "html": html,
        }
        yield _step(
            "diseno", "done",
            f"La página muestra {len(draft['sections'])} secciones. "
            "No hay un generador de componentes de aplicación aparte de esta landing.",
        )

        yield _step("revision", "in_progress")
        try:
            verdict = await _call_judge(judge, draft, text)
        except PipelineError:
            yield _step("revision", "error", "No se ha podido revisar la página.")
            raise
        if not isinstance(verdict, dict) or "ok" not in verdict:
            _log("schema")
            yield _step("revision", "error", "No se ha podido revisar la página.")
            raise PipelineError("judge_unavailable")
        if verdict.get("ok") is True:
            summary = _clip(verdict.get("summary") or draft["title"], 160)
            summary = f"{summary} {AGENT_HONESTY}"
            yield _step("revision", "done", summary)
            preview = _next_preview(previous, owner_id, project["project_id"], text, intent, plan, html, created_at)
            public = public_preview(preview)
            yield {"type": "state", "phase": "completado", "message": summary}
            yield {"type": "result", "preview": preview, "public": public, "summary": summary}
            return
        _log("rubric")
        if attempt >= MAX_DRAFT_ATTEMPTS:
            yield _step("revision", "error", "La página no encaja con lo pedido.")
            raise PipelineError("landing_rejected")
        yield _step("revision", "error", "La página no encaja con lo pedido. Se reintenta.")

    raise PipelineError("landing_rejected")


async def _call_judge(judge, draft, instruction):
    if judge is None:
        return structural_judge(draft, instruction)
    try:
        verdict = await _maybe_await(judge(draft, instruction))
    except PipelineError:
        raise
    except Exception as exc:
        _log("provider")
        raise PipelineError("judge_unavailable") from exc
    return verdict


def encode_sse(event) -> str:
    if event.get("type") == "heartbeat":
        return ": heartbeat\n\n"
    import json
    name = event.get("type") or "message"
    payload = {key: value for key, value in event.items() if key != "type"}
    return f"event: {name}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def with_heartbeats(events, interval=10):
    """Yield events as they happen, and a heartbeat when a step stays quiet."""
    import asyncio
    queue = asyncio.Queue()

    async def pump():
        try:
            async for event in events:
                await queue.put(event)
        except PipelineError as exc:
            await queue.put({"type": "error", "message": exc.message})
        except Exception:
            _log("provider")
            await queue.put({"type": "error", "message": PipelineError("landing_unavailable").message})
        finally:
            await queue.put(None)

    task = asyncio.create_task(pump())
    try:
        while True:
            try:
                item = await asyncio.wait_for(queue.get(), timeout=interval)
            except asyncio.TimeoutError:
                yield {"type": "heartbeat"}
                continue
            if item is None:
                break
            yield item
    finally:
        if not task.done():
            task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
