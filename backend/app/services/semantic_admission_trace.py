"""
semantic_admission_trace.py

Trazabilidad opcional para la Capa de Admisión Semántica v1.

Responsabilidades:
- construir un payload de trazabilidad estable y serializable
- emitir trazabilidad por logger estructurado
- no alterar nunca el contrato público de semantic_admission.py

No contiene:
- scoring
- guardrails de decisión
- integración con ai_analysis.py
- persistencia en base de datos
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List

from backend.app.services.ai_analysis_common import ensure_string

logger = logging.getLogger(__name__)

SEMANTIC_ADMISSION_TRACE_ENABLED_ENV = "SEMANTIC_ADMISSION_TRACE_ENABLED"
SEMANTIC_ADMISSION_TRACE_VERBOSE_ENV = "SEMANTIC_ADMISSION_TRACE_VERBOSE"
SEMANTIC_ADMISSION_VERSION = "v1"


def _env_flag(name: str, default: bool = False) -> bool:
    """
    Lee flags de entorno de forma robusta.
    """
    raw = os.getenv(name)
    if raw is None:
        return default

    value = raw.strip().lower()
    return value in {"1", "true", "yes", "on"}


def should_emit_semantic_admission_trace() -> bool:
    """
    Indica si la trazabilidad de admisión está activada.
    """
    return _env_flag(SEMANTIC_ADMISSION_TRACE_ENABLED_ENV, default=False)


def _is_verbose_trace() -> bool:
    """
    Indica si la trazabilidad debe incluir campos extra.
    """
    return _env_flag(SEMANTIC_ADMISSION_TRACE_VERBOSE_ENV, default=False)


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


def build_semantic_admission_trace_payload(
    admission_payload: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Construye el payload canónico de trazabilidad de admisión.

    Importante:
    - no modifica admission_payload
    - no expone el input completo por defecto
    """
    admission_payload = _safe_dict(admission_payload)
    verbose = _is_verbose_trace()

    normalization_meta = _safe_dict(admission_payload.get("normalization_meta"))
    text_bundle = _safe_dict(admission_payload.get("text_bundle"))

    active_signals = [
        item for item in _safe_list(admission_payload.get("active_signals"))
        if isinstance(item, str) and item.strip()
    ]

    payload: Dict[str, Any] = {
        "semantic_admission_version": SEMANTIC_ADMISSION_VERSION,
        "status": ensure_string(admission_payload.get("status"), ""),
        "ready_for_analysis": bool(admission_payload.get("ready_for_analysis", False)),
        "needs_clarification": bool(admission_payload.get("needs_clarification", False)),
        "clarification_question": ensure_string(admission_payload.get("clarification_question"), ""),
        "input_mode": ensure_string(admission_payload.get("input_mode"), "text"),
        "input_nature": ensure_string(admission_payload.get("input_nature"), "mixed_input"),
        "user_intent": ensure_string(admission_payload.get("user_intent"), "unclear"),
        "maturity_level": ensure_string(admission_payload.get("maturity_level"), "concept_in_definition"),
        "confidence": ensure_string(admission_payload.get("confidence"), "low"),
        "active_signals": active_signals,
        "guardrails_triggered": [
            item for item in _safe_list(admission_payload.get("guardrails_triggered"))
            if isinstance(item, str) and item.strip()
        ],
        "scores": _safe_dict(admission_payload.get("scores")),
        "normalization_meta": {
            "raw_length": normalization_meta.get("raw_length"),
            "normalized_length": normalization_meta.get("normalized_length"),
            "raw_word_count": normalization_meta.get("raw_word_count"),
            "normalized_word_count": normalization_meta.get("normalized_word_count"),
            "sentence_count": normalization_meta.get("sentence_count"),
            "disfluency_ratio": normalization_meta.get("disfluency_ratio"),
            "is_empty_after_normalization": normalization_meta.get("is_empty_after_normalization"),
        },
        "text_meta": {
            "normalized_length": text_bundle.get("normalized_length"),
            "sentence_count": text_bundle.get("sentence_count"),
            "disfluency_ratio": text_bundle.get("disfluency_ratio"),
        },
    }

    if verbose:
        payload["score_details"] = _safe_dict(admission_payload.get("score_details"))
        payload["matched_phrases"] = _safe_dict(admission_payload.get("matched_phrases"))
        payload["precedence_rules"] = _safe_dict(admission_payload.get("precedence_rules"))
        payload["normalization_meta_verbose"] = normalization_meta
        payload["text_bundle_verbose"] = text_bundle

    return payload


def emit_semantic_admission_trace(payload: Dict[str, Any]) -> bool:
    """
    Emite el payload por logger estructurado.

    Regla crítica:
    - si falla, nunca debe romper la capa de admisión
    """
    if not should_emit_semantic_admission_trace():
        return False

    try:
        logger.info("semantic_admission_trace=%s", payload)
        return True
    except Exception:
        logger.exception("semantic_admission_trace_error")
        return False