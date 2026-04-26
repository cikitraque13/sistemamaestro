"""
ai_analysis.py

Fachada pública del análisis inicial de Sistema Maestro.

Responsabilidades:
- exponer analyze_with_ai(...)
- coordinar el pipeline del adaptador de primera activación IA
- mantener contrato estable con projects.py:
  - route
  - diagnosis
  - refine_questions

No contiene:
- prompting pesado
- normalización semántica pesada
- fallback detallado
- lógica de trace/envelope
- motor directo del proveedor
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from backend.app.core.config import OPENAI_API_KEY
from backend.app.services.ai_analysis_common import (
    ANALYSIS_ADAPTER_VERSION,
    ensure_string,
)
from backend.app.services.ai_analysis_context import (
    build_analysis_context,
    build_analysis_envelope,
    build_analysis_trace,
    resolve_analysis_lead,
)
from backend.app.services.ai_analysis_decision import decide_and_apply_analysis_result
from backend.app.services.ai_analysis_decision_trace import (
    build_decision_trace_payload,
    emit_decision_trace,
    should_emit_decision_trace,
)
from backend.app.services.ai_analysis_fallback import build_analysis_fallback
from backend.app.services.ai_analysis_normalization import normalize_analysis_result
from backend.app.services.ai_analysis_runtime import (
    run_direct_analysis,
    validate_analysis_output,
)

logger = logging.getLogger(__name__)


def _log_analysis_event(stage: str, trace: Optional[Dict[str, Any]] = None, **extra: Any) -> None:
    """
    Logging estructurado mínimo del adaptador de análisis.
    """
    payload: Dict[str, Any] = {
        "stage": stage,
        "adapter_version": ANALYSIS_ADAPTER_VERSION,
    }

    if isinstance(trace, dict):
        payload["trace_id"] = trace.get("trace_id")
        payload["agent_key"] = trace.get("agent_key")
        payload["phase"] = trace.get("phase")

    for key, value in extra.items():
        if value is not None:
            payload[key] = value

    logger.info("ai_analysis_event=%s", payload)


async def analyze_with_ai(
    input_type: str,
    input_content: str,
    url_analysis: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Pipeline del adaptador de primera activación IA:

    1. construir contexto del caso
    2. resolver liderazgo local
    3. crear trace
    4. crear envelope
    5. comprobar configuración mínima
    6. ejecutar análisis directo provisional
    7. validar salida bruta
    8. normalizar resultado
    9. aplicar microfase algorítmica de decisión (route + continuity)
    10. emitir trazabilidad interna opcional de decisión
    11. validar salida final
    12. devolver contrato final
    13. fallback si algo falla
    """
    context = build_analysis_context(
        input_type=input_type,
        input_content=input_content,
        url_analysis=url_analysis,
    )

    lead_meta = resolve_analysis_lead(context)
    trace = build_analysis_trace(context, lead_meta)
    envelope = build_analysis_envelope(context, lead_meta, trace)

    _log_analysis_event(
        "analysis_start",
        trace,
        lead_agent_key=lead_meta.get("lead_agent_key"),
        analysis_mode=lead_meta.get("analysis_mode"),
        source_mode=context.get("source_mode"),
        has_url_analysis=context.get("has_url_analysis"),
    )

    if not OPENAI_API_KEY:
        return build_analysis_fallback(
            configured=False,
            trace=trace,
            reason="openai_api_key_missing",
        )

    try:
        raw_result = await run_direct_analysis(
            context=context,
            envelope=envelope,
            trace=trace,
            lead_meta=lead_meta,
        )

        raw_validation = validate_analysis_output(
            payload=raw_result,
            lead_meta=lead_meta,
            trace=trace,
        )
        if not raw_validation["valid"]:
            return build_analysis_fallback(
                configured=True,
                trace=trace,
                reason="raw_output_invalid",
            )

        normalized = normalize_analysis_result(raw_result)

        final_result = normalized
        decision_bundle: Optional[Dict[str, Any]] = None

        try:
            decision_output = decide_and_apply_analysis_result(
                input_type=input_type,
                input_content=input_content,
                normalized_result=normalized,
            )
            decision_bundle = decision_output.get("decision_bundle")
            applied_result = decision_output.get("applied_result")

            if isinstance(applied_result, dict):
                final_result = applied_result

            if isinstance(decision_bundle, dict):
                _log_analysis_event(
                    "decision_applied",
                    trace,
                    route_final=decision_bundle.get("route_final"),
                    continuity_final=decision_bundle.get("continuity_final"),
                    active_signals_count=len(decision_bundle.get("active_signals", [])),
                    route_tie_break_used=decision_bundle.get("route_tie_break_used"),
                    continuity_tie_break_used=decision_bundle.get("continuity_tie_break_used"),
                )

                if should_emit_decision_trace():
                    try:
                        trace_payload = build_decision_trace_payload(
                            trace=trace,
                            context=context,
                            normalized_result=normalized,
                            decision_bundle=decision_bundle,
                            final_result=final_result,
                        )
                        emit_decision_trace(trace_payload)
                    except Exception:
                        logger.exception(
                            "AI decision trace layer error",
                            extra={
                                "trace_id": trace.get("trace_id"),
                                "agent_key": lead_meta.get("lead_agent_key"),
                                "adapter_version": ANALYSIS_ADAPTER_VERSION,
                            },
                        )
        except Exception:
            logger.exception(
                "AI decision layer error",
                extra={
                    "trace_id": trace.get("trace_id"),
                    "agent_key": lead_meta.get("lead_agent_key"),
                    "adapter_version": ANALYSIS_ADAPTER_VERSION,
                },
            )
            final_result = normalized

        final_validation = validate_analysis_output(
            payload=final_result,
            lead_meta=lead_meta,
            trace=trace,
        )
        if not final_validation["valid"]:
            return build_analysis_fallback(
                configured=True,
                trace=trace,
                reason="normalized_output_invalid",
            )

        continuity_path = ""
        diagnosis = final_result.get("diagnosis", {})
        if isinstance(diagnosis, dict):
            continuity_recommendation = diagnosis.get("continuity_recommendation", {})
            if isinstance(continuity_recommendation, dict):
                continuity_path = ensure_string(
                    continuity_recommendation.get("recommended_path"),
                    "",
                )

        _log_analysis_event(
            "analysis_success",
            trace,
            route=ensure_string(final_result.get("route"), "idea"),
            continuity_path=continuity_path,
            refine_questions_count=len(final_result.get("refine_questions", [])),
        )
        return final_result

    except Exception:
        logger.exception(
            "AI analysis error",
            extra={
                "trace_id": trace.get("trace_id"),
                "agent_key": lead_meta.get("lead_agent_key"),
                "adapter_version": ANALYSIS_ADAPTER_VERSION,
            },
        )
        return build_analysis_fallback(
            configured=True,
            trace=trace,
            reason="analysis_exception",
        )