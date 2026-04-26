"""
ai_analysis_decision_trace.py

Trazabilidad interna v1 para la microfase algorítmica de decisión
del adaptador AI analysis.

Responsabilidades:
- construir un payload de trazabilidad estable y serializable
- emitir trazabilidad por logger estructurado
- no alterar nunca route, continuity ni el contrato público del adaptador

No contiene:
- scoring
- precedencia
- desempates
- integración con proveedor
- persistencia en base de datos
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List

from backend.app.services.ai_analysis_common import (
    ANALYSIS_ADAPTER_VERSION,
    ensure_string,
    normalize_route,
)

logger = logging.getLogger(__name__)

TRACE_ENABLED_ENV = "AI_ANALYSIS_TRACE_ENABLED"
TRACE_VERBOSE_ENV = "AI_ANALYSIS_TRACE_VERBOSE"


def _env_flag(name: str, default: bool = False) -> bool:
    """
    Lee flags de entorno de forma robusta.
    """
    raw = os.getenv(name)
    if raw is None:
        return default

    value = raw.strip().lower()
    return value in {"1", "true", "yes", "on"}


def should_emit_decision_trace() -> bool:
    """
    Indica si la trazabilidad está activada.
    """
    return _env_flag(TRACE_ENABLED_ENV, default=False)


def _is_verbose_trace() -> bool:
    """
    Indica si la trazabilidad debe incluir campos extra de depuración.
    """
    return _env_flag(TRACE_VERBOSE_ENV, default=False)


def _safe_dict(value: Any) -> Dict[str, Any]:
    """
    Devuelve un dict o un dict vacío.
    """
    return value if isinstance(value, dict) else {}


def _safe_list(value: Any) -> List[Any]:
    """
    Devuelve una lista o una lista vacía.
    """
    return value if isinstance(value, list) else []


def _extract_continuity_path(result: Dict[str, Any]) -> str:
    """
    Extrae continuity_recommendation.recommended_path si existe.
    """
    diagnosis = _safe_dict(result.get("diagnosis"))
    continuity = _safe_dict(diagnosis.get("continuity_recommendation"))
    return ensure_string(continuity.get("recommended_path"), "").lower()


def _extract_text_meta(text_bundle: Dict[str, Any], verbose: bool) -> Dict[str, Any]:
    """
    Convierte text_bundle en metadatos seguros sin exponer texto completo.
    """
    input_text = ensure_string(text_bundle.get("input_text"), "")
    analysis_text = ensure_string(text_bundle.get("analysis_text"), "")
    merged_text = ensure_string(text_bundle.get("merged_text"), "")

    payload: Dict[str, Any] = {
        "input_length": len(input_text),
        "analysis_length": len(analysis_text),
        "merged_length": len(merged_text),
    }

    if verbose:
        payload["input_type"] = ensure_string(text_bundle.get("input_type"), "text")

    return payload


def build_decision_trace_payload(
    trace: Dict[str, Any],
    context: Dict[str, Any],
    normalized_result: Dict[str, Any],
    decision_bundle: Dict[str, Any],
    final_result: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Construye el payload canónico de trazabilidad.

    Importante:
    - no modifica ningún objeto de entrada
    - no incluye input completo por defecto
    - no depende de base de datos ni de disco
    """
    trace = _safe_dict(trace)
    context = _safe_dict(context)
    normalized_result = _safe_dict(normalized_result)
    decision_bundle = _safe_dict(decision_bundle)
    final_result = _safe_dict(final_result)

    verbose = _is_verbose_trace()

    route_before = normalize_route(normalized_result.get("route"))
    route_after = normalize_route(final_result.get("route"))

    continuity_before = _extract_continuity_path(normalized_result)
    continuity_after = _extract_continuity_path(final_result)

    active_signals = [
        item for item in _safe_list(decision_bundle.get("active_signals"))
        if isinstance(item, str) and item.strip()
    ]

    payload: Dict[str, Any] = {
        "trace_id": ensure_string(trace.get("trace_id"), ""),
        "adapter_version": ANALYSIS_ADAPTER_VERSION,
        "phase": ensure_string(trace.get("phase"), ""),
        "agent_key": ensure_string(trace.get("agent_key"), ""),
        "input_type": ensure_string(context.get("input_type"), "text"),
        "source_mode": ensure_string(context.get("source_mode"), "text"),
        "has_url_analysis": bool(context.get("has_url_analysis", False)),
        "route_before": route_before,
        "route_after": route_after,
        "continuity_before": continuity_before,
        "continuity_after": continuity_after,
        "active_signals": active_signals,
        "route_scores": _safe_dict(decision_bundle.get("route_scores")),
        "continuity_scores": _safe_dict(decision_bundle.get("continuity_scores")),
        "route_tie_break_used": decision_bundle.get("route_tie_break_used"),
        "continuity_tie_break_used": decision_bundle.get("continuity_tie_break_used"),
        "guardrails_triggered": _safe_dict(decision_bundle.get("guardrails_triggered")),
        "route_reason": ensure_string(decision_bundle.get("route_reason"), ""),
        "continuity_reason": ensure_string(decision_bundle.get("continuity_reason"), ""),
        "decision_reason": ensure_string(decision_bundle.get("decision_reason"), ""),
        "text_meta": _extract_text_meta(_safe_dict(decision_bundle.get("text_bundle")), verbose),
    }

    if verbose:
        payload["matched_phrases"] = _safe_dict(decision_bundle.get("matched_phrases"))
        payload["route_score_details"] = _safe_dict(decision_bundle.get("route_score_details"))
        payload["continuity_score_details"] = _safe_dict(decision_bundle.get("continuity_score_details"))
        payload["route_tie_break_reason"] = ensure_string(
            decision_bundle.get("route_tie_break_reason"),
            "",
        )
        payload["continuity_tie_break_reason"] = ensure_string(
            decision_bundle.get("continuity_tie_break_reason"),
            "",
        )

    return payload


def emit_decision_trace(payload: Dict[str, Any]) -> bool:
    """
    Emite el payload por logger estructurado.

    Regla crítica:
    - si falla, nunca debe romper el adaptador
    """
    if not should_emit_decision_trace():
        return False

    try:
        logger.info("ai_analysis_decision_trace=%s", payload)
        return True
    except Exception:
        logger.exception("ai_analysis_decision_trace_error")
        return False