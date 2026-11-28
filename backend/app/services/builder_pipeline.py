"""Instruction to a saved landing preview.

Grok classifies the intent and writes the blueprint. Claude, through the
same JSON completion the builder agent uses, writes the page copy. The
visible result is a static document, not the model source.
"""
from html import escape

from backend.app.services.builder_landing_state import MAX_PREVIEW_VERSIONS, PREVIEW_SCHEMA

USER_MESSAGES = {
    "CLASSIFIER_UNAVAILABLE": "El clasificador no está disponible ahora. No se ha generado ningún resultado.",
    "blueprint_provider_unavailable": "No se ha podido preparar el plano. No se ha generado la preview.",
    "blueprint_invalid_output": "El plano no ha salido bien. No se ha guardado la preview.",
    "landing_unavailable": "No se ha podido escribir la página. No se ha guardado nada.",
    "landing_rejected": "La revisión no ha aceptado la página. No se ha sustituido la versión guardada.",
    "judge_unavailable": "La revisión no está disponible ahora. No se ha sustituido la versión guardada.",
    "empty_instruction": "Escribe qué quieres en la página.",
    "publish_disabled": "La publicación no está disponible.",
    "executor_timeout": "La generación ha tardado demasiado. No se ha guardado la página.",
}
GENERIC_MESSAGE = "No se ha podido preparar la preview. No se ha publicado nada."


class PipelineError(Exception):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code

    @property
    def message(self) -> str:
        return USER_MESSAGES.get(self.code, GENERIC_MESSAGE)


def _clip(value, limit):
    text = " ".join(str(value or "").split())
    return text[:limit]


def normalize_draft(raw):
    if not isinstance(raw, dict):
        raise PipelineError("landing_unavailable")
    title = _clip(raw.get("title"), 160)
    subtitle = _clip(raw.get("subtitle"), 400)
    cta = _clip(raw.get("cta"), 80)
    sections = []
    for item in raw.get("sections") or []:
        if not isinstance(item, dict):
            continue
        heading = _clip(item.get("title"), 120)
        body = _clip(item.get("text"), 800)
        if heading and body:
            section = {"title": heading, "text": body}
            role = item.get("role")
            if role in {"oferta", "prueba", "objecion", "paso", "cierre"}:
                section["role"] = role
            sections.append(section)
        if len(sections) == 6:
            break
    if not title or not subtitle or not cta or not sections:
        raise PipelineError("landing_unavailable")
    return {"title": title, "subtitle": subtitle, "cta": cta, "sections": sections}


def landing_brief(data) -> dict:
    """Facts the writer must see. Values are data, not extra instructions."""
    blueprint = data.get("blueprint") if isinstance(data.get("blueprint"), dict) else {}
    diagnosis = data.get("diagnosis") if isinstance(data.get("diagnosis"), dict) else {}
    intent = data.get("intent") if isinstance(data.get("intent"), dict) else {}
    priorities = []
    for item in blueprint.get("priorities") or []:
        text = _clip(item, 120)
        if text and text not in priorities:
            priorities.append(text)
        if len(priorities) == 6:
            break
    brief = {
        "instruction": _clip(data.get("instruction"), 2000),
        "intentTitle": _clip(intent.get("title"), 160),
        "intentGoal": _clip(intent.get("goal"), 400),
        "blueprintTitle": _clip(blueprint.get("title"), 160),
        "blueprintSummary": _clip(blueprint.get("summary"), 500),
        "priorities": priorities,
        "diagnosis": _clip(diagnosis.get("summary"), 500),
        "slot": _clip(data.get("slot"), 80),
    }
    preferences = data.get("preferences")
    if isinstance(preferences, dict) and preferences:
        brief["preferences"] = {
            "tone": preferences.get("tone"),
            "style": preferences.get("style"),
            "structure": preferences.get("structure") if isinstance(preferences.get("structure"), list) else [],
            "kept": preferences.get("kept") if isinstance(preferences.get("kept"), int) else 0,
            "reverted": preferences.get("reverted") if isinstance(preferences.get("reverted"), int) else 0,
        }
    notes = _clip(data.get("revisionNotes"), 240)
    if notes:
        brief["revisionNotes"] = notes
    from backend.app.services.builder_system_prompt import PROMPT_VERSION
    brief["promptVersion"] = PROMPT_VERSION
    return brief


def section_slots(plan) -> list:
    slots = []
    if isinstance(plan, dict):
        for item in plan.get("priorities") or []:
            text = _clip(item, 80)
            if text and text not in slots:
                slots.append(text)
            if len(slots) == 4:
                break
    return slots or ["Presentación", "Servicio", "Siguiente paso"]


def render_partial_html(*, title, subtitle, cta, sections) -> str:
    ready = [item for item in sections or [] if isinstance(item, dict) and item.get("title") and item.get("text")]
    if not ready:
        ready = [{"title": "En curso", "text": "El texto de esta sección aparece en cuanto está listo."}]
    return render_preview_html({
        "title": _clip(title, 160) or "Tu página",
        "subtitle": _clip(subtitle, 400) or "Estamos escribiendo esta versión.",
        "cta": _clip(cta, 80) or "Continuar",
        "sections": ready,
    })


def structural_judge(draft, _instruction) -> dict:
    title = _clip((draft or {}).get("title"), 160)
    if "convierte dudas en decisiones claras" in title.lower():
        return {"ok": False, "summary": "El texto sigue siendo la plantilla genérica."}
    return {"ok": True, "summary": title or "Página revisada."}


def render_preview_html(draft) -> str:
    page = normalize_draft(draft)
    parts = []
    for section in page["sections"]:
        parts.append(
            "<section><h2>" + escape(section["title"]) + "</h2><p>"
            + escape(section["text"]) + "</p></section>"
        )
    return (
        "<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\">"
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
        "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'\">"
        "<title>" + escape(page["title"]) + "</title>"
        "<style>body{margin:0;background:#090b12;color:#f5f5f7;font:18px/1.6 system-ui,sans-serif}"
        "main{max-width:960px;margin:auto;padding:48px 24px}h1{font-size:clamp(36px,6vw,68px);line-height:1.05;letter-spacing:-.04em}"
        "p{color:#c9ccd5}a{display:inline-block;margin-top:24px;background:#fbbf24;color:#17120a;padding:14px 22px;border-radius:14px;font-weight:700;text-decoration:none}"
        "section{margin-top:28px;padding-top:20px;border-top:1px solid #303541}</style></head><body><main><header><h1>"
        + escape(page["title"]) + "</h1><p>" + escape(page["subtitle"]) + "</p><a href=\"#contenido\">"
        + escape(page["cta"]) + "</a></header><div id=\"contenido\">" + "".join(parts) + "</div></main></body></html>"
    )


def _public_evaluation(version):
    """Score already stored on the version. Nothing here is recomputed."""
    from backend.app.services.builder_evaluation import (
        EVAL_CRITERIA,
        EVAL_CRITERION_MAX,
        EVAL_PASS_THRESHOLD,
    )

    raw = version.get("evaluation") if isinstance(version, dict) else None
    if not isinstance(raw, dict):
        return None
    total = raw.get("total")
    if isinstance(total, bool) or not isinstance(total, int):
        return None
    scores = raw.get("scores")
    public_scores = None
    if isinstance(scores, dict):
        cleaned = {}
        complete = True
        for key in EVAL_CRITERIA:
            value = scores.get(key)
            if isinstance(value, bool) or not isinstance(value, int):
                complete = False
                break
            cleaned[key] = value
        if complete and sum(cleaned.values()) == total:
            public_scores = cleaned
    payload = {
        "total": total,
        "threshold": EVAL_PASS_THRESHOLD,
        "max": len(EVAL_CRITERIA) * EVAL_CRITERION_MAX,
        "passed": raw.get("passed") is True and total >= EVAL_PASS_THRESHOLD,
    }
    if public_scores is not None:
        payload["scores"] = public_scores
    return payload


def public_preview(preview: dict) -> dict:
    versions = preview.get("versions") or []
    current = versions[-1]
    public_versions = []
    for item in versions:
        public = {
            "version": item["version"],
            "instruction": item["instruction"],
            "createdAt": item["createdAt"],
        }
        evaluation = _public_evaluation(item)
        if evaluation:
            public["evaluation"] = evaluation
        public_versions.append(public)
    result = {"html": current["html"], "versions": public_versions}
    current_evaluation = _public_evaluation(current)
    if current_evaluation:
        result["evaluation"] = current_evaluation
    return result


def _next_preview(previous, owner_id, project_id, instruction, intent, blueprint, html, created_at, evaluation=None, preference=None):
    from backend.app.services.builder_system_prompt import PROMPT_VERSION

    versions = []
    if isinstance(previous, dict) and previous.get("schema") == PREVIEW_SCHEMA:
        versions = [item for item in previous.get("versions") or [] if isinstance(item, dict)]
    number = versions[-1].get("version", len(versions)) + 1 if versions else 1
    version = {
        "version": number,
        "instruction": _clip(instruction, 280),
        "createdAt": created_at,
        "intentTitle": _clip((intent or {}).get("title"), 160),
        "blueprintTitle": _clip((blueprint or {}).get("title"), 160),
        "html": html,
        "promptVersion": PROMPT_VERSION,
    }
    if isinstance(evaluation, dict):
        version["evaluation"] = evaluation
    if isinstance(preference, dict):
        version["preference"] = preference
    versions.append(version)
    versions = versions[-MAX_PREVIEW_VERSIONS:]
    return {
        "schema": PREVIEW_SCHEMA,
        "ownerId": owner_id,
        "projectId": project_id,
        "promptVersion": PROMPT_VERSION,
        "versions": versions,
    }


async def run_pipeline(*, project, owner_id, instruction, classify, blueprint, draft_landing, previous=None, created_at="", judge=None, draft_section=None, memory=None, writer_model=""):
    from backend.app.services.builder_executor import iter_executor

    preview = None
    public = None
    async for event in iter_executor(
        project=project, owner_id=owner_id, instruction=instruction, classify=classify,
        blueprint=blueprint, draft_landing=draft_landing, draft_section=draft_section,
        judge=judge, previous=previous, created_at=created_at, memory=memory,
        writer_model=writer_model,
    ):
        if event.get("type") == "result":
            preview = event["preview"]
            public = event["public"]
    if preview is None or public is None:
        raise PipelineError("landing_unavailable")
    return {"preview": preview, "public": public}
