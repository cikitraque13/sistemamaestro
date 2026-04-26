"""
ai_analysis_fallback.py

Ruta única de rescate para la primera activación IA de Sistema Maestro.

Responsabilidades:
- construir el fallback canónico del análisis
- registrar contexto mínimo del fallo
- devolver siempre el mismo contrato final compatible con projects.py

No contiene:
- llamadas a proveedor
- prompting
- contexto del caso
- trace builder
- normalización semántica pesada
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from backend.app.services.ai_analysis_normalization import (
    normalize_dimension_review,
    normalize_priority_actions,
)

logger = logging.getLogger(__name__)


def build_fallback_analysis(configured: bool = True) -> Dict[str, Any]:
    """
    Construye el payload canónico de rescate.

    Debe respetar siempre el contrato final:
    - route
    - diagnosis
    - refine_questions
    """
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
        "dimension_review": normalize_dimension_review([]),
        "priority_actions": normalize_priority_actions([]),
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


def build_analysis_fallback(
    configured: bool = True,
    trace: Optional[Dict[str, Any]] = None,
    reason: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Punto único de entrada al fallback.

    Registra señal mínima de fallo y devuelve el payload de rescate canónico.
    """
    trace_id = ""
    agent_key = ""
    phase = ""

    if isinstance(trace, dict):
        trace_id = str(trace.get("trace_id", "") or "")
        agent_key = str(trace.get("agent_key", "") or "")
        phase = str(trace.get("phase", "") or "")

    logger.warning(
        "ai_analysis_fallback trace_id=%s agent_key=%s phase=%s configured=%s reason=%s",
        trace_id,
        agent_key,
        phase,
        configured,
        reason or "",
    )

    return build_fallback_analysis(configured=configured)