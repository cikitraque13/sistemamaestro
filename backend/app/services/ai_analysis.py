import json
import logging
from typing import Any, Dict, List, Optional

import openai

from backend.app.core.config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

CANONICAL_DIMENSIONS = [
    {"id": "clarity", "label": "Claridad"},
    {"id": "proposal", "label": "Propuesta"},
    {"id": "conversion", "label": "Conversión"},
    {"id": "structure", "label": "Estructura"},
    {"id": "continuity", "label": "Continuidad"},
]

ALLOWED_DIMENSION_STATUS = {"strong", "improvable", "priority"}
ALLOWED_PRIORITY_LEVELS = {"high", "medium", "low"}
ALLOWED_CONTINUITY_PATHS = {"stay", "blueprint", "sistema", "premium"}


def _clean_json_text(text: str) -> str:
    cleaned = (text or "").strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]

    return cleaned.strip()


def _parse_ai_json(text: str) -> Dict[str, Any]:
    cleaned = _clean_json_text(text)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.error("AI raw response was not valid JSON: %s", cleaned[:3000])
        raise


def _ensure_string(value: Any, fallback: str) -> str:
    if isinstance(value, str):
        stripped = value.strip()
        if stripped:
            return stripped
    return fallback


def _ensure_string_list(value: Any, fallback: Optional[List[str]] = None) -> List[str]:
    if not isinstance(value, list):
        return fallback or []

    cleaned: List[str] = []
    for item in value:
        if isinstance(item, str):
            stripped = item.strip()
            if stripped:
                cleaned.append(stripped)

    return cleaned if cleaned else (fallback or [])


def _normalize_dimension_review(items: Any) -> List[Dict[str, str]]:
    raw_items = items if isinstance(items, list) else []
    by_id: Dict[str, Dict[str, str]] = {}

    for item in raw_items:
        if not isinstance(item, dict):
            continue

        raw_id = str(item.get("id", "")).strip().lower()
        raw_label = _ensure_string(item.get("label"), "")
        raw_status = str(item.get("status", "")).strip().lower()
        raw_priority = str(item.get("priority", "")).strip().lower()
        reading = _ensure_string(item.get("reading"), "Lectura pendiente de concretar.")

        if raw_id not in {d["id"] for d in CANONICAL_DIMENSIONS}:
            continue

        by_id[raw_id] = {
            "id": raw_id,
            "label": raw_label or next(d["label"] for d in CANONICAL_DIMENSIONS if d["id"] == raw_id),
            "status": raw_status if raw_status in ALLOWED_DIMENSION_STATUS else "improvable",
            "reading": reading,
            "priority": raw_priority if raw_priority in ALLOWED_PRIORITY_LEVELS else "medium",
        }

    normalized: List[Dict[str, str]] = []
    for dimension in CANONICAL_DIMENSIONS:
        normalized.append(
            by_id.get(
                dimension["id"],
                {
                    "id": dimension["id"],
                    "label": dimension["label"],
                    "status": "improvable",
                    "reading": "Lectura pendiente de concretar.",
                    "priority": "medium",
                },
            )
        )

    return normalized


def _normalize_priority_actions(items: Any) -> List[Dict[str, str]]:
    raw_items = items if isinstance(items, list) else []
    normalized: List[Dict[str, str]] = []

    for index, item in enumerate(raw_items[:3], start=1):
        if not isinstance(item, dict):
            continue

        title = _ensure_string(item.get("title"), f"Acción prioritaria {index}")
        why_it_matters = _ensure_string(
            item.get("why_it_matters"),
            "Esta acción ayuda a reducir fricción y avanzar con más criterio.",
        )
        intensity = str(item.get("intensity", "")).strip().lower()
        if intensity not in ALLOWED_PRIORITY_LEVELS:
            intensity = "medium"

        normalized.append(
            {
                "id": _ensure_string(item.get("id"), f"action_{index}"),
                "title": title,
                "why_it_matters": why_it_matters,
                "intensity": intensity,
            }
        )

    if normalized:
        return normalized

    return [
        {
            "id": "action_1",
            "title": "Ordenar la siguiente acción principal",
            "why_it_matters": "El caso necesita una primera prioridad clara antes de ampliar alcance.",
            "intensity": "medium",
        }
    ]


def _normalize_immediate_action(item: Any) -> Dict[str, str]:
    if isinstance(item, dict):
        return {
            "title": _ensure_string(item.get("title"), "Definir la siguiente acción principal"),
            "description": _ensure_string(
                item.get("description"),
                "Selecciona una acción breve, concreta y aplicable para reducir fricción desde ya.",
            ),
        }

    return {
        "title": "Definir la siguiente acción principal",
        "description": "Selecciona una acción breve, concreta y aplicable para reducir fricción desde ya.",
    }


def _normalize_continuity_recommendation(item: Any) -> Dict[str, str]:
    if not isinstance(item, dict):
        return {
            "recommended_path": "stay",
            "reason": "El caso necesita primero una lectura ordenada antes de ampliar intensidad.",
            "cta_label": "Seguir analizando",
        }

    recommended_path = str(item.get("recommended_path", "")).strip().lower()
    if recommended_path not in ALLOWED_CONTINUITY_PATHS:
        recommended_path = "stay"

    default_cta = {
        "stay": "Seguir analizando",
        "blueprint": "Entrar en Pro",
        "sistema": "Entrar en Growth",
        "premium": "Acceder a AI Master 199",
    }[recommended_path]

    return {
        "recommended_path": recommended_path,
        "reason": _ensure_string(
            item.get("reason"),
            "La recomendación de continuidad aún debe precisarse mejor.",
        ),
        "cta_label": _ensure_string(item.get("cta_label"), default_cta),
    }


def _normalize_refine_questions(items: Any) -> List[Dict[str, str]]:
    raw_items = items if isinstance(items, list) else []
    normalized: List[Dict[str, str]] = []

    for index, item in enumerate(raw_items[:3], start=1):
        if not isinstance(item, dict):
            continue

        question = _ensure_string(item.get("question"), "")
        if not question:
            continue

        normalized.append(
            {
                "id": _ensure_string(item.get("id"), f"q{index}"),
                "question": question,
            }
        )

    return normalized


def _build_fallback_analysis(configured: bool = True) -> Dict[str, Any]:
    summary = (
        "No se pudo completar el análisis automático en este momento."
        if configured
        else "Sistema de análisis no configurado. Contacta al administrador."
    )

    diagnosis = {
        "summary": summary,
        "understanding": summary,
        "main_finding": "No se ha podido identificar el hallazgo principal automáticamente.",
        "opportunity": "Conviene reintentar el análisis o revisar la configuración.",
        "strengths": [],
        "weaknesses": [],
        "quick_wins": ["Intenta de nuevo en unos minutos"] if configured else [],
        "executive_summary": {
            "understanding": summary,
            "main_tension": "La lectura automática no ha podido completarse.",
            "commercial_importance": "Sin una lectura válida no conviene forzar una decisión más intensa.",
            "bottom_line": "Reintenta el análisis antes de escalar a continuidad.",
        },
        "core_diagnosis": {
            "main_finding": "Análisis automático no disponible.",
            "main_weakness": "No se ha podido producir una lectura fiable del caso.",
            "main_leverage": "Volver a lanzar el análisis con el sistema operativo correctamente configurado.",
        },
        "dimension_review": _normalize_dimension_review([]),
        "priority_actions": _normalize_priority_actions([]),
        "immediate_action": {
            "title": "Reintentar el análisis",
            "description": "Lanza de nuevo el caso cuando el sistema esté disponible o correctamente configurado.",
        },
        "continuity_recommendation": {
            "recommended_path": "stay",
            "reason": "Antes de proponer continuidad hace falta una lectura válida del caso.",
            "cta_label": "Volver a analizar",
        },
    }

    return {
        "route": "idea",
        "diagnosis": diagnosis,
        "refine_questions": [],
    }


def _normalize_analysis_payload(parsed: Dict[str, Any]) -> Dict[str, Any]:
    diagnosis_raw = parsed.get("diagnosis", {})
    if not isinstance(diagnosis_raw, dict):
        diagnosis_raw = {}

    summary = _ensure_string(
        diagnosis_raw.get("summary"),
        "Sin resumen disponible.",
    )

    strengths = _ensure_string_list(diagnosis_raw.get("strengths"), [])
    weaknesses = _ensure_string_list(diagnosis_raw.get("weaknesses"), [])
    quick_wins = _ensure_string_list(diagnosis_raw.get("quick_wins"), [])

    executive_summary_raw = diagnosis_raw.get("executive_summary", {})
    if not isinstance(executive_summary_raw, dict):
        executive_summary_raw = {}

    executive_summary = {
        "understanding": _ensure_string(
            executive_summary_raw.get("understanding"),
            diagnosis_raw.get("understanding") or summary,
        ),
        "main_tension": _ensure_string(
            executive_summary_raw.get("main_tension"),
            weaknesses[0] if weaknesses else "No se ha precisado aún la tensión principal.",
        ),
        "commercial_importance": _ensure_string(
            executive_summary_raw.get("commercial_importance"),
            "La lectura debe conectar con captación, conversión, monetización o continuidad.",
        ),
        "bottom_line": _ensure_string(
            executive_summary_raw.get("bottom_line"),
            quick_wins[0] if quick_wins else "Hace falta priorizar la siguiente acción con más claridad.",
        ),
    }

    core_diagnosis_raw = diagnosis_raw.get("core_diagnosis", {})
    if not isinstance(core_diagnosis_raw, dict):
        core_diagnosis_raw = {}

    core_diagnosis = {
        "main_finding": _ensure_string(
            core_diagnosis_raw.get("main_finding"),
            diagnosis_raw.get("main_finding") or weaknesses[0] if weaknesses else "Sin hallazgo principal disponible.",
        ),
        "main_weakness": _ensure_string(
            core_diagnosis_raw.get("main_weakness"),
            weaknesses[0] if weaknesses else "Sin debilidad principal disponible.",
        ),
        "main_leverage": _ensure_string(
            core_diagnosis_raw.get("main_leverage"),
            diagnosis_raw.get("opportunity") or quick_wins[0] if quick_wins else "Sin palanca principal disponible.",
        ),
    }

    dimension_review = _normalize_dimension_review(diagnosis_raw.get("dimension_review"))
    priority_actions = _normalize_priority_actions(diagnosis_raw.get("priority_actions"))
    immediate_action = _normalize_immediate_action(diagnosis_raw.get("immediate_action"))
    continuity_recommendation = _normalize_continuity_recommendation(
        diagnosis_raw.get("continuity_recommendation")
    )

    diagnosis = {
        "summary": summary,
        "understanding": _ensure_string(
            diagnosis_raw.get("understanding"),
            executive_summary["understanding"],
        ),
        "main_finding": _ensure_string(
            diagnosis_raw.get("main_finding"),
            core_diagnosis["main_finding"],
        ),
        "opportunity": _ensure_string(
            diagnosis_raw.get("opportunity"),
            core_diagnosis["main_leverage"],
        ),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "quick_wins": quick_wins,
        "executive_summary": executive_summary,
        "core_diagnosis": core_diagnosis,
        "dimension_review": dimension_review,
        "priority_actions": priority_actions,
        "immediate_action": immediate_action,
        "continuity_recommendation": continuity_recommendation,
    }

    return {
        "route": _ensure_string(parsed.get("route"), "idea"),
        "diagnosis": diagnosis,
        "refine_questions": _normalize_refine_questions(parsed.get("refine_questions")),
    }


async def analyze_with_ai(
    input_type: str,
    input_content: str,
    url_analysis: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    if not OPENAI_API_KEY:
        return _build_fallback_analysis(configured=False)

    client_ai = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

    system_prompt = """Eres el motor de análisis de Sistema Maestro, una plataforma de transformación digital.

Piensas internamente con cuatro lentes:
1. CRO / conversión
2. Monetización / growth
3. Product strategy / priorización
4. IA aplicada / automatización

Tu trabajo es detectar cuellos de botella que afecten claridad, captación, conversión, confianza, monetización o escalabilidad.

Debes devolver SOLO un JSON válido con esta estructura exacta:
{
  "route": "improve|sell|automate|idea",
  "diagnosis": {
    "summary": "Resumen corto",
    "understanding": "Qué se ha entendido del caso",
    "main_finding": "Hallazgo principal",
    "opportunity": "Palanca principal de mejora u oportunidad",
    "strengths": ["Fortaleza 1", "Fortaleza 2"],
    "weaknesses": ["Debilidad 1", "Debilidad 2"],
    "quick_wins": ["Acción rápida 1", "Acción rápida 2"],
    "executive_summary": {
      "understanding": "Comprensión del caso",
      "main_tension": "Tensión principal",
      "commercial_importance": "Por qué importa comercialmente",
      "bottom_line": "Conclusión ejecutiva"
    },
    "core_diagnosis": {
      "main_finding": "Hallazgo central",
      "main_weakness": "Debilidad principal",
      "main_leverage": "Palanca principal"
    },
    "dimension_review": [
      {
        "id": "clarity",
        "label": "Claridad",
        "status": "strong|improvable|priority",
        "reading": "Lectura breve",
        "priority": "high|medium|low"
      },
      {
        "id": "proposal",
        "label": "Propuesta",
        "status": "strong|improvable|priority",
        "reading": "Lectura breve",
        "priority": "high|medium|low"
      },
      {
        "id": "conversion",
        "label": "Conversión",
        "status": "strong|improvable|priority",
        "reading": "Lectura breve",
        "priority": "high|medium|low"
      },
      {
        "id": "structure",
        "label": "Estructura",
        "status": "strong|improvable|priority",
        "reading": "Lectura breve",
        "priority": "high|medium|low"
      },
      {
        "id": "continuity",
        "label": "Continuidad",
        "status": "strong|improvable|priority",
        "reading": "Lectura breve",
        "priority": "high|medium|low"
      }
    ],
    "priority_actions": [
      {
        "id": "action_1",
        "title": "Acción prioritaria",
        "why_it_matters": "Por qué importa",
        "intensity": "high|medium|low"
      }
    ],
    "immediate_action": {
      "title": "Siguiente acción inmediata",
      "description": "Qué debería hacer ahora"
    },
    "continuity_recommendation": {
      "recommended_path": "stay|blueprint|sistema|premium",
      "reason": "Motivo de continuidad",
      "cta_label": "CTA recomendado"
    }
  },
  "refine_questions": [
    {"id": "q1", "question": "Pregunta 1"},
    {"id": "q2", "question": "Pregunta 2"},
    {"id": "q3", "question": "Pregunta 3"}
  ]
}

Reglas:
- Responde SOLO con JSON válido, sin markdown
- Selecciona la ruta más adecuada automáticamente
- Sé directo, profesional y específico
- El diagnóstico debe sentirse personalizado, no genérico
- El resumen debe identificar el cuello de botella principal y por qué importa comercialmente
- No prometas resultados garantizados ni cifras inventadas
- strengths = activos reales ya aprovechables
- weaknesses = fricciones concretas que hoy limitan captación, conversión, autoridad o monetización
- quick_wins = acciones concretas, de alto impacto y relativamente rápidas
- dimension_review debe incluir SIEMPRE las 5 dimensiones canónicas
- priority_actions = máximo 3 acciones
- refine_questions = máximo 3 preguntas
- Si es una URL, analiza el contenido real proporcionado y no inventes elementos no visibles
- continuity_recommendation debe recomendar solo una vía principal"""

    if input_type == "url" and url_analysis and url_analysis.get("content"):
        content = url_analysis["content"]

        user_prompt = f"""Analiza esta web existente desde estas perspectivas:
- claridad de propuesta de valor
- captación y CTA
- conversión y fricción
- confianza y autoridad
- monetización visible
- estructura comercial
- SEO visible y señales técnicas detectables
- oportunidades de automatización o IA si aplica

URL: {content['url']}
Dominio: {content['domain']}

TÍTULO: {content['title']}

META DESCRIPCIÓN: {content['meta_description']}

ENCABEZADOS H1: {', '.join(content['h1']) if content['h1'] else 'No encontrados'}

ENCABEZADOS H2: {', '.join(content['h2']) if content['h2'] else 'No encontrados'}

TEXTO PRINCIPAL:
{chr(10).join(content['main_text'][:3]) if content['main_text'] else 'No extraído'}

CTAs ENCONTRADOS: {', '.join(content['ctas']) if content['ctas'] else 'No encontrados'}

FORMULARIOS: {content['forms_count']}

NAVEGACIÓN: {', '.join(content['navigation']) if content['navigation'] else 'No encontrada'}

Proporciona un diagnóstico comercial y estratégico basado SOLO en este contenido real."""
    else:
        user_prompt = f"""El usuario describe una idea, necesidad o problema digital.

Analiza el caso con enfoque en:
- claridad del negocio o propuesta
- captación y conversión
- monetización
- cuellos de botella
- estructura y priorización
- oportunidades rápidas de mejora
- posibles palancas de automatización o IA

Entrada del usuario:
{input_content}

Devuelve un diagnóstico específico, útil y accionable, evitando generalidades."""

    try:
        response = await client_ai.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=2600,
        )

        response_text = response.choices[0].message.content or "{}"
        parsed = _parse_ai_json(response_text)

        return _normalize_analysis_payload(parsed)

    except Exception:
        logger.exception("AI analysis error")
        return _build_fallback_analysis(configured=True)
