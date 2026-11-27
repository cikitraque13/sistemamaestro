import json
import logging
from typing import Dict

from backend.app.core.config import GROK_API_KEY, GROK_BASE_URL, GROK_MODEL

logger = logging.getLogger(__name__)

ALLOWED_GROK_MODELS = {"grok-4.3", "grok-4.7"}
PROVIDER_UNAVAILABLE = "blueprint_provider_unavailable"
INVALID_OUTPUT = "blueprint_invalid_output"


class BlueprintGenerationError(Exception):
    """The provider did not return a usable blueprint. Callers must not persist or charge."""

    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


def _has_minimum_blueprint(value) -> bool:
    if not isinstance(value, dict):
        return False
    title = value.get("title")
    summary = value.get("summary")
    priorities = value.get("priorities")
    if not isinstance(title, str) or not title.strip():
        return False
    if not isinstance(summary, str) or not summary.strip():
        return False
    if not isinstance(priorities, list) or not priorities:
        return False
    return all(isinstance(item, str) and item.strip() for item in priorities)


def _strip_fences(response_text: str) -> str:
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]
    return response_text.strip()


async def generate_blueprint(project: Dict) -> Dict:
    if not (GROK_API_KEY or "").strip() or GROK_MODEL not in ALLOWED_GROK_MODELS:
        raise BlueprintGenerationError(PROVIDER_UNAVAILABLE)

    from backend.app.ai.providers.grok_client import GrokChatClient

    client_ai = GrokChatClient(api_key=GROK_API_KEY, timeout=60, max_retries=0, base_url=GROK_BASE_URL)

    route_names = {
        "improve": "Mejorar algo existente",
        "sell": "Vender y cobrar",
        "automate": "Automatizar operación",
        "idea": "Idea a proyecto"
    }

    system_prompt = """Eres el arquitecto de Sistema Maestro. Genera un Blueprint (plan de acción) en JSON exacto:
{
    "title": "Título del blueprint",
    "summary": "Resumen ejecutivo del plan",
    "priorities": ["Prioridad 1", "Prioridad 2", "Prioridad 3"],
    "architecture": {
        "components": ["Componente 1", "Componente 2"],
        "tech_stack": ["Tecnología 1", "Tecnología 2"]
    },
    "monetization": "Estrategia de monetización recomendada",
    "deployment_steps": ["Paso 1", "Paso 2", "Paso 3", "Paso 4"],
    "timeline_estimate": "Estimación temporal",
    "key_metrics": ["Métrica 1 a seguir", "Métrica 2 a seguir"]
}

Sé específico y práctico. Evita generalidades."""

    context = f"""
Ruta: {route_names.get(project.get('route', ''), 'General')}
Entrada original: {project.get('input_content', '')}
Diagnóstico: {project.get('diagnosis', {})}
Respuestas de afinado: {project.get('refine_answers', {})}
Análisis de URL: {project.get('url_analysis', 'N/A')}
"""

    try:
        try:
            response = await client_ai.chat.completions.create(
                model=GROK_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": context}
                ],
                temperature=0.7,
                max_tokens=2000,
                response_format={"type": "json_object"},
                reasoning_effort="low",
            )
        except Exception as exc:
            logger.error("Blueprint provider unavailable: %s", type(exc).__name__)
            raise BlueprintGenerationError(PROVIDER_UNAVAILABLE) from exc

        try:
            response_text = _strip_fences((response.choices[0].message.content or "").strip())
            parsed = json.loads(response_text)
        except (AttributeError, IndexError, TypeError, KeyError, json.JSONDecodeError) as exc:
            logger.error("Blueprint invalid output: %s", type(exc).__name__)
            raise BlueprintGenerationError(INVALID_OUTPUT) from exc

        if not _has_minimum_blueprint(parsed):
            logger.error("Blueprint invalid output: missing minimum keys")
            raise BlueprintGenerationError(INVALID_OUTPUT)
        return parsed
    finally:
        try:
            await client_ai.close()
        except Exception:
            logger.exception("blueprint_client_close_failed")
