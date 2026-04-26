"""
ai_analysis_context.py

Construcción del caso y microorquestación local para la primera activación IA.

Responsabilidades:
- construir un contexto uniforme del caso
- resolver liderazgo lógico local del análisis
- crear trace mínima
- crear envelope de entrada

No contiene:
- prompting
- llamada a proveedor
- fallback
- normalización final compleja del payload
"""

from __future__ import annotations

from typing import Any, Dict, Optional
import uuid

from backend.app.ai.schemas.agent_envelope import AgentInputEnvelope, serialize_input
from backend.app.ai.telemetry.agent_trace import build_trace
from backend.app.services.ai_analysis_common import (
    ANALYSIS_ADAPTER_VERSION,
    DEFAULT_LEAD_AGENT_BY_INPUT_TYPE,
    DEFAULT_REQUEST_PREFIX,
    DEFAULT_OUTPUT_TYPE,
    DISCOVERY_AGENT_KEY,
    LEAD_AGENT_PROFILES,
    ensure_string,
)


def build_analysis_context(
    input_type: str,
    input_content: str,
    url_analysis: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Construye un contexto uniforme del caso para el adaptador de análisis.

    Devuelve un diccionario estable con:
    - input_type normalizado
    - input_content limpio
    - source_mode
    - analysis_scope
    - expected_output_type
    - has_url_analysis
    - raw_url_content
    """
    normalized_input_type = ensure_string(input_type, "text").lower()
    if normalized_input_type not in {"url", "text", "idea"}:
        normalized_input_type = "text"

    source_mode = "url" if normalized_input_type == "url" else "text"
    input_content_clean = ensure_string(input_content, "")

    raw_url_content: Dict[str, Any] = {}
    if normalized_input_type == "url" and isinstance(url_analysis, dict):
        content = url_analysis.get("content", {})
        if isinstance(content, dict):
            raw_url_content = content

    has_url_analysis = bool(raw_url_content)
    analysis_scope = "visible_audit" if source_mode == "url" else "problem_discovery"

    return {
        "input_type": normalized_input_type,
        "input_content": input_content_clean,
        "source_mode": source_mode,
        "analysis_scope": analysis_scope,
        "expected_output_type": DEFAULT_OUTPUT_TYPE,
        "has_url_analysis": has_url_analysis,
        "raw_url_content": raw_url_content,
    }


def resolve_analysis_lead(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Resuelve el liderazgo lógico local del caso.

    Primera activación:
    - URL -> audit_agent
    - texto/idea -> discovery_agent

    No activa agentes reales. Solo fija semántica de liderazgo compatible
    con la futura orquestación.
    """
    input_type = ensure_string(context.get("input_type"), "text").lower()
    lead_agent_key = DEFAULT_LEAD_AGENT_BY_INPUT_TYPE.get(input_type, DISCOVERY_AGENT_KEY)
    profile = LEAD_AGENT_PROFILES.get(lead_agent_key, LEAD_AGENT_PROFILES[DISCOVERY_AGENT_KEY])

    return {
        "lead_agent_key": lead_agent_key,
        "analysis_mode": profile["analysis_mode"],
        "output_type": profile["output_type"],
        "allowed_tools": list(profile["allowed_tools"]),
        "guard_layers": list(profile["guard_layers"]),
        "phase": profile["phase"],
    }


def build_analysis_trace(context: Dict[str, Any], lead_meta: Dict[str, Any]) -> Dict[str, Any]:
    """
    Crea la trace mínima del análisis.

    La trace nace antes de ejecutar el motor directo para dejar ya trazado:
    - quién lidera
    - en qué modo entra
    - qué tipo de caso es
    """
    request_id = f"{DEFAULT_REQUEST_PREFIX}_{uuid.uuid4().hex[:12]}"

    return build_trace(
        agent_key=lead_meta["lead_agent_key"],
        phase=lead_meta["phase"],
        status="started",
        request_id=request_id,
        project_id=None,
        user_id=None,
        notes=[
            f"analysis_mode={lead_meta['analysis_mode']}",
            f"source_mode={ensure_string(context.get('source_mode'), 'text')}",
        ],
        meta={
            "adapter_version": ANALYSIS_ADAPTER_VERSION,
            "input_type": ensure_string(context.get("input_type"), "text"),
            "has_url_analysis": bool(context.get("has_url_analysis")),
            "expected_output_type": ensure_string(
                context.get("expected_output_type"),
                DEFAULT_OUTPUT_TYPE,
            ),
        },
    )


def build_analysis_envelope(
    context: Dict[str, Any],
    lead_meta: Dict[str, Any],
    trace: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Construye el envelope de entrada del caso.

    El envelope formaliza:
    - agente líder lógico
    - request_id
    - intent
    - payload
    - contexto
    - herramientas permitidas
    - guard layers mínimas
    """
    request_id = ensure_string(
        trace.get("request_id"),
        ensure_string(trace.get("trace_id"), ""),
    )

    envelope = AgentInputEnvelope(
        agent_key=lead_meta["lead_agent_key"],
        request_id=request_id,
        project_id=None,
        user_id=None,
        intent=ensure_string(context.get("analysis_scope"), "problem_discovery"),
        payload={
            "input_type": ensure_string(context.get("input_type"), "text"),
            "input_content": ensure_string(context.get("input_content"), ""),
            "url_analysis": context.get("raw_url_content")
            if context.get("has_url_analysis")
            else None,
        },
        context={
            "source_mode": ensure_string(context.get("source_mode"), "text"),
            "analysis_scope": ensure_string(context.get("analysis_scope"), "problem_discovery"),
            "adapter_version": ANALYSIS_ADAPTER_VERSION,
            "trace_id": ensure_string(trace.get("trace_id"), ""),
        },
        allowed_tools=list(lead_meta.get("allowed_tools", [])),
        guard_layers=list(lead_meta.get("guard_layers", [])),
    )
    return serialize_input(envelope)