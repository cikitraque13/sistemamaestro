"""Real builder steps, streamed as events.

Grok classifies, plans and judges the full page. Claude writes the copy with
tools. Each attempt critiques the text against the versioned system prompt
before the judge scores it. A provider error or the time budget stops the
loop. Iterations stay inside this one call, so the gem charge is still one.

There is no backend that configures a chat agent on the page, so the last
step says so.
"""
import logging
import os
import time

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

def executor_max_iterations() -> int:
    raw = (os.environ.get("BUILDER_EXECUTOR_MAX_ITERATIONS") or "").strip()
    try:
        value = int(raw) if raw else 3
    except ValueError:
        value = 3
    return min(max(value, 1), 3)


def executor_timeout_seconds() -> int:
    raw = (os.environ.get("BUILDER_EXECUTOR_TIMEOUT_SECONDS") or "").strip()
    try:
        value = int(raw) if raw else 110
    except ValueError:
        value = 110
    return min(max(value, 15), 140)
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


_BUDGET_CODES = {"usage_limit", "usage_limit_month", "usage_limit_request", "input_too_long", "voice_limit"}


def _failure_text(exc, fallback: str) -> str:
    if getattr(exc, "code", "") in _BUDGET_CODES:
        return exc.message
    return fallback


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


def _critique_context(*, text, intent, plan, project):
    return {"instruction": text, "intent": intent, "plan": plan, "project": project}


async def _produce_draft(*, text, intent, plan, diagnosis, draft_landing, draft_section, project, memory=None, revision_notes="", writer_model=""):
    payload = {
        "instruction": text,
        "intent": intent,
        "blueprint": plan,
        "diagnosis": diagnosis,
        "preferences": memory or {},
        "revisionNotes": revision_notes,
        "project": project,
    }
    if writer_model:
        payload["writerModel"] = writer_model
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
        from backend.app.ai.guards.llm_budget import LlmBudgetError

        if isinstance(exc, LlmBudgetError):
            raise
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


async def iter_executor(*, project, owner_id, instruction, classify, blueprint, draft_landing, previous=None, created_at="", judge=None, draft_section=None, memory=None, now=None, timeout_seconds=None, max_iterations=None, writer_model=""):
    from backend.app.ai.guards.llm_budget import (
        LlmBudgetError,
        decide_writer_escalation,
        default_writer_model,
        llm_scope,
        mark_escalation,
        max_judge_calls_per_web,
        max_regenerations_per_web,
    )
    from backend.app.services.builder_copy_rubric import critique_copy
    from backend.app.services.builder_evaluation import evaluation_from_verdict
    from backend.app.services.builder_memory import infer_preference

    text = " ".join(str(instruction or "").split())
    if not text:
        raise PipelineError("empty_instruction")
    clock = now or time.monotonic
    budget = executor_timeout_seconds() if timeout_seconds is None else timeout_seconds
    attempts = executor_max_iterations() if max_iterations is None else max_iterations
    attempts = min(attempts, 1 + max_regenerations_per_web())
    # The first draft is the cheap writer. A low score may escalate once.
    # writer_model from pace is ignored until that escalation.
    active_writer = default_writer_model()
    if writer_model == active_writer:
        active_writer = writer_model
    judge_calls = 0
    judge_cap = max_judge_calls_per_web()
    project_id = str((project or {}).get("project_id") or "")
    scope = llm_scope(user_id=str(owner_id or ""), project_id=project_id, feature="builder")
    scope.__enter__()
    try:
        async for event in _iter_scoped(
            text=text, clock=clock, budget=budget, attempts=attempts, active_writer=active_writer,
            judge_calls=judge_calls, judge_cap=judge_cap, project_id=project_id,
            project=project, owner_id=owner_id, classify=classify, blueprint=blueprint,
            draft_landing=draft_landing, previous=previous, created_at=created_at, judge=judge,
            draft_section=draft_section, memory=memory, critique_copy=critique_copy,
            evaluation_from_verdict=evaluation_from_verdict, infer_preference=infer_preference,
            decide_writer_escalation=decide_writer_escalation, mark_escalation=mark_escalation,
            LlmBudgetError=LlmBudgetError,
        ):
            yield event
    finally:
        scope.__exit__(None, None, None)


async def _iter_scoped(*, text, clock, budget, attempts, active_writer, judge_calls, judge_cap, project_id, project, owner_id, classify, blueprint, draft_landing, previous, created_at, judge, draft_section, memory, critique_copy, evaluation_from_verdict, infer_preference, decide_writer_escalation, mark_escalation, LlmBudgetError):
    started = clock()
    phase = "iterando" if previous else "construyendo"
    yield {"type": "state", "phase": phase, "message": STATE_MESSAGES[phase]}

    yield _step("entender", "in_progress")
    try:
        intent = await _maybe_await(classify({
            "instruction": text,
            "input_content": project.get("input_content") or "",
            "route": project.get("route") or "",
        }))
    except PipelineError as exc:
        yield _step("entender", "error", _failure_text(exc, "No se ha podido leer el negocio."))
        raise
    except LlmBudgetError as exc:
        yield _step("entender", "error", exc.message)
        raise PipelineError(exc.code) from None
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
    except LlmBudgetError as exc:
        yield _step("estructura", "error", exc.message)
        raise PipelineError(exc.code) from None
    except PipelineError as exc:
        yield _step("estructura", "error", _failure_text(exc, "No se ha podido preparar la estructura."))
        raise
    except Exception as exc:
        yield _step("estructura", "error", "No se ha podido preparar la estructura.")
        raise PipelineError("blueprint_provider_unavailable") from exc
    slots = section_slots(plan if isinstance(plan, dict) else {})
    yield _step("estructura", "done", "Secciones: " + ", ".join(slots))

    diagnosis = _diagnosis(project)
    context = _critique_context(text=text, intent=intent, plan=plan, project=project)
    revision_notes = ""
    for attempt in range(1, attempts + 1):
        if clock() - started >= budget:
            yield _step("textos", "error", "La generación ha tardado demasiado.")
            raise PipelineError("executor_timeout")
        if attempt > 1:
            yield {"type": "state", "phase": "iterando", "message": STATE_MESSAGES["iterando"]}
        yield _step("textos", "in_progress")
        try:
            draft, section_events = await _produce_draft(
                text=text, intent=intent, plan=plan, diagnosis=diagnosis,
                draft_landing=draft_landing, draft_section=draft_section,
                project=project, memory=memory,                 revision_notes=revision_notes,
                writer_model=active_writer,
            )
        except PipelineError as exc:
            yield _step("textos", "error", _failure_text(exc, "No se ha podido escribir el texto."))
            raise
        except LlmBudgetError as exc:
            yield _step("textos", "error", exc.message)
            raise PipelineError(exc.code) from None
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
        if clock() - started >= budget:
            yield _step("revision", "error", "La generación ha tardado demasiado.")
            raise PipelineError("executor_timeout")
        critique = critique_copy(draft, context)
        if not critique["ok"]:
            _log("rubric")
            revision_notes = critique["summary"]
            if attempt >= attempts:
                yield _step("revision", "error", "La página no encaja con lo pedido.")
                raise PipelineError("landing_rejected")
            yield _step("revision", "error", "La página no encaja con lo pedido. Se reintenta.")
            continue
        if judge is not None and judge_calls >= judge_cap:
            yield _step("revision", "error", PipelineError("usage_limit").message)
            raise PipelineError("usage_limit")
        try:
            verdict = await _call_judge(judge, draft, text)
        except PipelineError:
            yield _step("revision", "error", "No se ha podido revisar la página.")
            raise
        except LlmBudgetError as exc:
            yield _step("revision", "error", exc.message)
            raise PipelineError(exc.code) from None
        if judge is not None:
            judge_calls += 1
        if not isinstance(verdict, dict) or "ok" not in verdict:
            _log("schema")
            yield _step("revision", "error", "No se ha podido revisar la página.")
            raise PipelineError("judge_unavailable")
        evaluation = evaluation_from_verdict(verdict, draft, context)
        if evaluation["passed"]:
            summary = _clip(verdict.get("summary") or draft["title"], 160)
            summary = f"{summary} {AGENT_HONESTY}"
            yield _step("revision", "done", summary)
            preview = _next_preview(
                previous, owner_id, project["project_id"], text, intent, plan, html, created_at,
                evaluation=evaluation, preference=infer_preference(draft),
            )
            public = public_preview(preview)
            yield {"type": "state", "phase": "completado", "message": summary}
            yield {"type": "result", "preview": preview, "public": public, "summary": summary, "evaluation": evaluation}
            return
        _log("rubric")
        revision_notes = _clip(verdict.get("summary") or "La evaluación no llega al mínimo.", 160)
        choice = decide_writer_escalation(score=evaluation["total"], project_id=project_id)
        if choice == "stop":
            yield _step("revision", "error", PipelineError("usage_limit").message)
            raise PipelineError("usage_limit")
        if choice == "escalate" and attempt < attempts:
            from backend.app.ai.guards.llm_budget import escalation_model

            active_writer = escalation_model()
            mark_escalation(project_id)
        if attempt >= attempts:
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
        from backend.app.ai.guards.llm_budget import LlmBudgetError

        if isinstance(exc, LlmBudgetError):
            raise
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
