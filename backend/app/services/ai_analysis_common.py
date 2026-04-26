"""
ai_analysis_common.py

Constantes y helpers comunes para la capa de análisis inicial de IA.

Reglas de esta pieza:
- no contiene llamadas a proveedor
- no contiene prompting
- no contiene fallback
- no contiene trace/envelope
- no contiene normalización compleja del payload final

Su función es servir como base compartida y estable para:
- ai_analysis.py (fachada)
- ai_analysis_context.py
- ai_analysis_runtime.py
- ai_analysis_normalization.py
- ai_analysis_fallback.py
"""

from __future__ import annotations

from typing import Any, Dict

ANALYSIS_ADAPTER_VERSION = "v1"
DEFAULT_OUTPUT_TYPE = "analysis_result"
DEFAULT_PHASE = "now"
DEFAULT_REQUEST_PREFIX = "anl"

DISCOVERY_AGENT_KEY = "discovery_agent"
AUDIT_AGENT_KEY = "audit_agent"

ALLOWED_ROUTE_VALUES = {"improve", "sell", "automate", "idea"}

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

DEFAULT_LEAD_AGENT_BY_INPUT_TYPE = {
    "url": AUDIT_AGENT_KEY,
    "text": DISCOVERY_AGENT_KEY,
    "idea": DISCOVERY_AGENT_KEY,
}

LEAD_AGENT_PROFILES: Dict[str, Dict[str, Any]] = {
    DISCOVERY_AGENT_KEY: {
        "analysis_mode": "problem_discovery",
        "output_type": DEFAULT_OUTPUT_TYPE,
        "allowed_tools": [
            "intent_classifier",
            "route_mapper",
            "report_formatter",
            "output_schema_validator",
        ],
        "guard_layers": [
            "output_guard",
        ],
        "phase": DEFAULT_PHASE,
    },
    AUDIT_AGENT_KEY: {
        "analysis_mode": "visible_audit",
        "output_type": DEFAULT_OUTPUT_TYPE,
        "allowed_tools": [
            "url_reader",
            "signal_analyzer",
            "report_formatter",
            "output_schema_validator",
        ],
        "guard_layers": [
            "output_guard",
        ],
        "phase": DEFAULT_PHASE,
    },
}


def ensure_string(value: Any, fallback: str) -> str:
    """
    Devuelve un string limpio o el fallback si el valor no es utilizable.
    """
    if isinstance(value, str):
        stripped = value.strip()
        if stripped:
            return stripped
    return fallback


def normalize_route(value: Any) -> str:
    """
    Normaliza la ruta final del análisis al conjunto canónico permitido.
    """
    route = ensure_string(value, "idea").lower()
    return route if route in ALLOWED_ROUTE_VALUES else "idea"