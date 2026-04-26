"""
semantic_admission.py

Fachada pública de la Capa de Admisión Semántica v1.

Responsabilidades:
- recibir entrada libre del usuario
- orquestar:
  1. normalización multimodal
  2. extracción de señales
  3. decisión de admisión
- devolver un contrato estable y serializable

No contiene:
- integración con ai_analysis.py
- trazabilidad runtime
- scoring del motor de análisis
- diagnóstico final del caso
"""

from __future__ import annotations

from typing import Any, Dict

from backend.app.services.ai_analysis_common import ensure_string
from backend.app.services.semantic_admission_decision import (
    build_semantic_admission_decision,
)
from backend.app.services.semantic_admission_normalization import (
    normalize_semantic_admission_input,
)
from backend.app.services.semantic_admission_signals import (
    build_semantic_admission_signals,
)


def run_semantic_admission(
    input_mode: str,
    raw_input: Any,
) -> Dict[str, Any]:
    """
    Ejecuta la Capa de Admisión Semántica completa.

    Flujo:
    1. normaliza la entrada
    2. extrae señales
    3. construye la decisión de admisión

    Devuelve un payload canónico con:
    - status
    - ready_for_analysis
    - needs_clarification
    - clarification_question
    - input_nature
    - user_intent
    - maturity_level
    - confidence
    - normalized_text
    - señales, scores y metadatos asociados
    """
    normalization_bundle = normalize_semantic_admission_input(
        input_mode=input_mode,
        raw_input=raw_input,
    )

    resolved_input_mode = ensure_string(
        normalization_bundle.get("input_mode"),
        "text",
    ).strip().lower()

    normalized_text = ensure_string(
        normalization_bundle.get("normalized_text"),
        "",
    )

    normalization_meta = normalization_bundle.get("normalization_meta", {})
    if not isinstance(normalization_meta, dict):
        normalization_meta = {}

    signals_bundle = build_semantic_admission_signals(
        input_mode=resolved_input_mode,
        normalized_text=normalized_text,
        normalization_meta=normalization_meta,
    )

    decision_payload = build_semantic_admission_decision(
        input_mode=resolved_input_mode,
        normalized_text=normalized_text,
        signals_bundle=signals_bundle,
    )

    payload: Dict[str, Any] = {
        "status": ensure_string(decision_payload.get("status"), "clarification_required"),
        "ready_for_analysis": bool(decision_payload.get("ready_for_analysis", False)),
        "needs_clarification": bool(decision_payload.get("needs_clarification", True)),
        "clarification_question": ensure_string(
            decision_payload.get("clarification_question"),
            "",
        ),
        "input_mode": resolved_input_mode,
        "normalized_text": normalized_text,
        "input_nature": ensure_string(
            decision_payload.get("input_nature"),
            "mixed_input",
        ),
        "user_intent": ensure_string(
            decision_payload.get("user_intent"),
            "unclear",
        ),
        "maturity_level": ensure_string(
            decision_payload.get("maturity_level"),
            "concept_in_definition",
        ),
        "confidence": ensure_string(
            decision_payload.get("confidence"),
            "low",
        ),
        "normalization_meta": normalization_meta,
        "active_signals": decision_payload.get("active_signals", []),
        "scores": decision_payload.get("scores", {}),
        "score_details": decision_payload.get("score_details", {}),
        "guardrails_triggered": decision_payload.get("guardrails_triggered", []),
        "matched_phrases": decision_payload.get("matched_phrases", {}),
        "text_bundle": decision_payload.get("text_bundle", {}),
        "precedence_rules": decision_payload.get("precedence_rules", {}),
    }

    return payload


def run_text_semantic_admission(raw_input: Any) -> Dict[str, Any]:
    """
    Helper de conveniencia para texto escrito.
    """
    return run_semantic_admission(
        input_mode="text",
        raw_input=raw_input,
    )


def run_pasted_text_semantic_admission(raw_input: Any) -> Dict[str, Any]:
    """
    Helper de conveniencia para texto pegado.
    """
    return run_semantic_admission(
        input_mode="pasted_text",
        raw_input=raw_input,
    )


def run_voice_semantic_admission(raw_input: Any) -> Dict[str, Any]:
    """
    Helper de conveniencia para transcripción de voz.
    """
    return run_semantic_admission(
        input_mode="voice_transcript",
        raw_input=raw_input,
    )