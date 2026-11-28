"""Instruction to a saved landing preview.

Grok classifies the intent and writes the blueprint. Claude, through the
same JSON completion the builder agent uses, writes the page copy. The
visible result is a static document, not the model source.
"""
from html import escape

from backend.app.services.blueprint import BlueprintGenerationError
from backend.app.services.builder_landing_state import MAX_PREVIEW_VERSIONS, PREVIEW_SCHEMA

USER_MESSAGES = {
    "CLASSIFIER_UNAVAILABLE": "El clasificador no está disponible ahora. No se ha generado ningún resultado.",
    "blueprint_provider_unavailable": "No se ha podido preparar el plano. No se ha generado la preview.",
    "blueprint_invalid_output": "El plano no ha salido bien. No se ha guardado la preview.",
    "landing_unavailable": "No se ha podido escribir la página. No se ha guardado nada.",
    "empty_instruction": "Escribe qué quieres en la página.",
    "publish_disabled": "La publicación no está disponible.",
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
            sections.append({"title": heading, "text": body})
        if len(sections) == 6:
            break
    if not title or not subtitle or not cta or not sections:
        raise PipelineError("landing_unavailable")
    return {"title": title, "subtitle": subtitle, "cta": cta, "sections": sections}


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


def public_preview(preview: dict) -> dict:
    versions = preview.get("versions") or []
    current = versions[-1]
    return {
        "html": current["html"],
        "versions": [
            {
                "version": item["version"],
                "instruction": item["instruction"],
                "createdAt": item["createdAt"],
            }
            for item in versions
        ],
    }


def _next_preview(previous, owner_id, project_id, instruction, intent, blueprint, html, created_at):
    versions = []
    if isinstance(previous, dict) and previous.get("schema") == PREVIEW_SCHEMA:
        versions = [item for item in previous.get("versions") or [] if isinstance(item, dict)]
    number = versions[-1].get("version", len(versions)) + 1 if versions else 1
    versions.append({
        "version": number,
        "instruction": _clip(instruction, 280),
        "createdAt": created_at,
        "intentTitle": _clip((intent or {}).get("title"), 160),
        "blueprintTitle": _clip((blueprint or {}).get("title"), 160),
        "html": html,
    })
    versions = versions[-MAX_PREVIEW_VERSIONS:]
    return {
        "schema": PREVIEW_SCHEMA,
        "ownerId": owner_id,
        "projectId": project_id,
        "versions": versions,
    }


async def run_pipeline(*, project, owner_id, instruction, classify, blueprint, draft_landing, previous=None, created_at=""):
    text = " ".join(str(instruction or "").split())
    if not text:
        raise PipelineError("empty_instruction")
    project_id = project["project_id"]
    try:
        intent = await classify({
            "instruction": text,
            "input_content": project.get("input_content") or "",
            "route": project.get("route") or "",
        })
    except PipelineError:
        raise
    except Exception as exc:
        raise PipelineError("CLASSIFIER_UNAVAILABLE") from exc
    if not isinstance(intent, dict) or not str(intent.get("title") or "").strip():
        raise PipelineError("CLASSIFIER_UNAVAILABLE")
    brief = dict(project)
    brief["input_content"] = text
    try:
        plan = await blueprint(brief)
    except BlueprintGenerationError as exc:
        raise PipelineError(exc.code) from exc
    except PipelineError:
        raise
    except Exception as exc:
        raise PipelineError("blueprint_provider_unavailable") from exc
    try:
        draft = normalize_draft(await draft_landing({
            "instruction": text,
            "intent": intent,
            "blueprint": plan,
        }))
    except PipelineError:
        raise
    except Exception as exc:
        raise PipelineError("landing_unavailable") from exc
    html = render_preview_html(draft)
    preview = _next_preview(previous, owner_id, project_id, text, intent, plan, html, created_at)
    return {"preview": preview, "public": public_preview(preview)}
