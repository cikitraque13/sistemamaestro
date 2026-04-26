"""
ai_analysis_normalization.py

Capa de saneo semántico y normalización final del payload de análisis.

Responsabilidades:
- normalizar texto para comparación
- deduplicar y filtrar redundancias
- normalizar bloques del diagnosis
- garantizar el contrato final:
  - route
  - diagnosis
  - refine_questions

No contiene:
- llamadas a proveedor
- prompting
- trace o envelope
- fallback
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any, Dict, List, Optional

from backend.app.services.ai_analysis_common import (
    ALLOWED_CONTINUITY_PATHS,
    ALLOWED_DIMENSION_STATUS,
    ALLOWED_PRIORITY_LEVELS,
    CANONICAL_DIMENSIONS,
    ensure_string,
    normalize_route,
)

COMPARISON_STOPWORDS = {
    "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o", "u",
    "a", "ante", "bajo", "con", "contra", "desde", "durante", "en", "entre",
    "hacia", "hasta", "para", "por", "segun", "sin", "sobre", "tras",
    "que", "como", "del", "al", "se", "su", "sus", "es", "son", "ha", "han",
    "muy", "mas", "menos", "ya", "hoy", "real", "principal", "importante",
    "caso", "lectura", "sistema", "proyecto", "negocio", "usuario", "usuarios",
    "web", "pagina", "sitio", "propuesta", "valor", "conversion", "captacion",
    "claridad", "estructura", "continuidad", "mejora", "oportunidad",
}


def normalize_text_key(value: Any) -> str:
    """
    Normaliza texto a una clave comparable, sin acentos ni ruido.
    """
    if not isinstance(value, str):
        return ""

    text = value.strip().lower()
    if not text:
        return ""

    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-z0-9áéíóúñü\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def comparison_tokens(value: Any) -> set[str]:
    """
    Genera tokens relevantes para comparación semántica ligera.
    """
    normalized = normalize_text_key(value)
    if not normalized:
        return set()

    return {
        token
        for token in normalized.split()
        if len(token) > 2 and token not in COMPARISON_STOPWORDS
    }


def are_too_similar(a: Any, b: Any) -> bool:
    """
    Detecta similitud excesiva entre dos textos para reducir repeticiones.
    """
    text_a = normalize_text_key(a)
    text_b = normalize_text_key(b)

    if not text_a or not text_b:
        return False

    if text_a == text_b:
        return True

    if len(text_a) > 36 and len(text_b) > 36:
        if text_a in text_b or text_b in text_a:
            return True

    tokens_a = comparison_tokens(a)
    tokens_b = comparison_tokens(b)

    if not tokens_a or not tokens_b:
        return False

    intersection = tokens_a & tokens_b
    union = tokens_a | tokens_b
    if not union:
        return False

    score = len(intersection) / len(union)
    return score >= 0.72


def ensure_string_list(value: Any, fallback: Optional[List[str]] = None) -> List[str]:
    """
    Limpia listas de strings manteniendo solo entradas válidas.
    """
    if not isinstance(value, list):
        return fallback or []

    cleaned: List[str] = []
    for item in value:
        if isinstance(item, str):
            stripped = item.strip()
            if stripped:
                cleaned.append(stripped)

    return cleaned if cleaned else (fallback or [])


def dedupe_string_list(items: List[str], max_items: Optional[int] = None) -> List[str]:
    """
    Deduplica strings usando similitud semántica ligera.
    """
    deduped: List[str] = []

    for item in items:
        if any(are_too_similar(item, existing) for existing in deduped):
            continue
        deduped.append(item)
        if max_items and len(deduped) >= max_items:
            break

    return deduped


def filter_redundant_strings(items: List[str], avoid: List[str]) -> List[str]:
    """
    Filtra strings redundantes contra una lista de ideas ya usadas.
    """
    filtered: List[str] = []

    for item in items:
        if any(are_too_similar(item, blocked) for blocked in avoid if blocked):
            continue
        if any(are_too_similar(item, existing) for existing in filtered):
            continue
        filtered.append(item)

    return filtered


def pick_distinct(candidates: List[Any], avoid: List[str], fallback: str) -> str:
    """
    Elige el primer candidato suficientemente distinto del resto.
    """
    for candidate in candidates:
        value = ensure_string(candidate, "")
        if not value:
            continue

        if all(not are_too_similar(value, blocked) for blocked in avoid if blocked):
            return value

    return fallback


def normalize_dimension_review(items: Any) -> List[Dict[str, str]]:
    """
    Garantiza las 5 dimensiones canónicas con estructura estable.
    """
    raw_items = items if isinstance(items, list) else []
    allowed_ids = {d["id"] for d in CANONICAL_DIMENSIONS}
    by_id: Dict[str, Dict[str, str]] = {}

    for item in raw_items:
        if not isinstance(item, dict):
            continue

        raw_id = str(item.get("id", "")).strip().lower()
        raw_label = ensure_string(item.get("label"), "")
        raw_status = str(item.get("status", "")).strip().lower()
        raw_priority = str(item.get("priority", "")).strip().lower()
        reading = ensure_string(item.get("reading"), "Lectura pendiente de concretar.")

        if raw_id not in allowed_ids:
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


def find_dimension_reading(items: List[Dict[str, str]], *dimension_ids: str) -> str:
    """
    Devuelve la primera lectura disponible para una o varias dimensiones.
    """
    for item in items:
        if item.get("id") in dimension_ids:
            reading = ensure_string(item.get("reading"), "")
            if reading:
                return reading
    return ""


def normalize_priority_actions(items: Any) -> List[Dict[str, str]]:
    """
    Normaliza hasta 3 acciones prioritarias.
    """
    raw_items = items if isinstance(items, list) else []
    normalized: List[Dict[str, str]] = []

    for index, item in enumerate(raw_items[:3], start=1):
        if not isinstance(item, dict):
            continue

        title = ensure_string(item.get("title"), f"Acción prioritaria {index}")
        why_it_matters = ensure_string(
            item.get("why_it_matters"),
            "Esta acción ayuda a reducir fricción y avanzar con más criterio.",
        )
        intensity = str(item.get("intensity", "")).strip().lower()
        if intensity not in ALLOWED_PRIORITY_LEVELS:
            intensity = "medium"

        normalized.append(
            {
                "id": ensure_string(item.get("id"), f"action_{index}"),
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


def normalize_immediate_action(item: Any) -> Dict[str, str]:
    """
    Normaliza la acción inmediata final.
    """
    if isinstance(item, dict):
        return {
            "title": ensure_string(item.get("title"), "Definir la siguiente acción principal"),
            "description": ensure_string(
                item.get("description"),
                "Selecciona una acción breve, concreta y aplicable para reducir fricción desde ya.",
            ),
        }

    return {
        "title": "Definir la siguiente acción principal",
        "description": "Selecciona una acción breve, concreta y aplicable para reducir fricción desde ya.",
    }


def normalize_continuity_recommendation(item: Any) -> Dict[str, str]:
    """
    Normaliza la recomendación de continuidad con vía principal única.
    """
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
        "reason": ensure_string(
            item.get("reason"),
            "La recomendación de continuidad aún debe precisarse mejor.",
        ),
        "cta_label": ensure_string(item.get("cta_label"), default_cta),
    }


def normalize_refine_questions(items: Any) -> List[Dict[str, str]]:
    """
    Normaliza hasta 3 refine questions.
    """
    raw_items = items if isinstance(items, list) else []
    normalized: List[Dict[str, str]] = []

    for index, item in enumerate(raw_items[:3], start=1):
        if not isinstance(item, dict):
            continue

        question = ensure_string(item.get("question"), "")
        if not question:
            continue

        normalized.append(
            {
                "id": ensure_string(item.get("id"), f"q{index}"),
                "question": question,
            }
        )

    return normalized


def normalize_analysis_result(parsed: Dict[str, Any]) -> Dict[str, Any]:
    """
    Garantiza el contrato final que consume projects.py:
    - route
    - diagnosis
    - refine_questions
    """
    diagnosis_raw = parsed.get("diagnosis", {})
    if not isinstance(diagnosis_raw, dict):
        diagnosis_raw = {}

    summary = ensure_string(
        diagnosis_raw.get("summary"),
        "Sin resumen disponible.",
    )

    strengths = dedupe_string_list(
        ensure_string_list(diagnosis_raw.get("strengths"), []),
        max_items=3,
    )
    weaknesses = dedupe_string_list(
        ensure_string_list(diagnosis_raw.get("weaknesses"), []),
        max_items=4,
    )
    quick_wins = dedupe_string_list(
        ensure_string_list(diagnosis_raw.get("quick_wins"), []),
        max_items=4,
    )

    dimension_review = normalize_dimension_review(diagnosis_raw.get("dimension_review"))
    priority_actions = normalize_priority_actions(diagnosis_raw.get("priority_actions"))
    immediate_action = normalize_immediate_action(diagnosis_raw.get("immediate_action"))
    continuity_recommendation = normalize_continuity_recommendation(
        diagnosis_raw.get("continuity_recommendation")
    )

    executive_summary_raw = diagnosis_raw.get("executive_summary", {})
    if not isinstance(executive_summary_raw, dict):
        executive_summary_raw = {}

    core_diagnosis_raw = diagnosis_raw.get("core_diagnosis", {})
    if not isinstance(core_diagnosis_raw, dict):
        core_diagnosis_raw = {}

    understanding = pick_distinct(
        [
            diagnosis_raw.get("understanding"),
            executive_summary_raw.get("understanding"),
            summary,
            find_dimension_reading(dimension_review, "clarity", "proposal"),
        ],
        [],
        "Se ha generado una lectura inicial del caso, pendiente de mayor especificidad.",
    )

    main_tension = pick_distinct(
        [
            executive_summary_raw.get("main_tension"),
            find_dimension_reading(dimension_review, "clarity", "proposal"),
            weaknesses[0] if weaknesses else "",
            summary,
        ],
        [understanding],
        "La principal tensión todavía no está descrita con la suficiente precisión.",
    )

    commercial_importance = pick_distinct(
        [
            executive_summary_raw.get("commercial_importance"),
            find_dimension_reading(dimension_review, "conversion", "continuity"),
            "La fricción detectada afecta captación, conversión, monetización o continuidad del caso.",
        ],
        [understanding, main_tension],
        "La fricción detectada afecta captación, conversión, monetización o continuidad del caso.",
    )

    main_finding = pick_distinct(
        [
            core_diagnosis_raw.get("main_finding"),
            diagnosis_raw.get("main_finding"),
            find_dimension_reading(dimension_review, "conversion", "structure", "proposal"),
            weaknesses[0] if weaknesses else "",
            summary,
        ],
        [understanding, main_tension],
        "Sin hallazgo principal disponible.",
    )

    main_weakness = pick_distinct(
        [
            core_diagnosis_raw.get("main_weakness"),
            weaknesses[0] if weaknesses else "",
            weaknesses[1] if len(weaknesses) > 1 else "",
            find_dimension_reading(dimension_review, "structure", "conversion", "continuity"),
        ],
        [understanding, main_tension, main_finding],
        "Sin debilidad principal disponible.",
    )

    main_leverage = pick_distinct(
        [
            core_diagnosis_raw.get("main_leverage"),
            diagnosis_raw.get("opportunity"),
            quick_wins[0] if quick_wins else "",
            priority_actions[0]["title"] if priority_actions else "",
            immediate_action.get("title"),
        ],
        [understanding, main_tension, main_finding, main_weakness],
        "Sin palanca principal disponible.",
    )

    bottom_line = pick_distinct(
        [
            executive_summary_raw.get("bottom_line"),
            quick_wins[0] if quick_wins else "",
            immediate_action.get("title"),
            main_leverage,
        ],
        [understanding, main_tension, main_finding, main_weakness],
        "Hace falta priorizar la siguiente acción con más claridad.",
    )

    diagnosis = {
        "summary": summary,
        "understanding": understanding,
        "main_finding": main_finding,
        "opportunity": main_leverage,
        "strengths": filter_redundant_strings(strengths, [understanding, main_finding]),
        "weaknesses": filter_redundant_strings(
            weaknesses,
            [main_tension, main_finding, main_weakness],
        ),
        "quick_wins": filter_redundant_strings(
            quick_wins,
            [main_leverage, bottom_line, immediate_action.get("title", "")],
        ),
        "executive_summary": {
            "understanding": understanding,
            "main_tension": main_tension,
            "commercial_importance": commercial_importance,
            "bottom_line": bottom_line,
        },
        "core_diagnosis": {
            "main_finding": main_finding,
            "main_weakness": main_weakness,
            "main_leverage": main_leverage,
        },
        "dimension_review": dimension_review,
        "priority_actions": priority_actions,
        "immediate_action": immediate_action,
        "continuity_recommendation": continuity_recommendation,
    }

    return {
        "route": normalize_route(parsed.get("route")),
        "diagnosis": diagnosis,
        "refine_questions": normalize_refine_questions(parsed.get("refine_questions")),
    }