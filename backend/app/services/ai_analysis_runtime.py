"""
ai_analysis_runtime.py

Motor directo provisional del análisis inicial de Sistema Maestro.

Responsabilidades:
- limpiar y parsear JSON del proveedor
- ejecutar la llamada directa al modelo
- validar forma mínima del output
- usar output_guard si está disponible sin acoplarse de forma frágil

No contiene:
- construcción de contexto
- trace o envelope
- fallback
- normalización semántica final del payload
"""

from __future__ import annotations

import importlib
import json
import logging
from typing import Any, Dict, Optional

import openai

from backend.app.core.config import OPENAI_API_KEY
from backend.app.services.ai_analysis_common import ensure_string
from backend.app.services.ai_analysis_prompts import build_system_prompt, build_user_prompt

logger = logging.getLogger(__name__)


def clean_json_text(text: str) -> str:
    """
    Limpia bloques markdown o fences accidentales antes de parsear JSON.
    """
    cleaned = (text or "").strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]

    return cleaned.strip()


def parse_ai_json(text: str) -> Dict[str, Any]:
    """
    Parsea la salida del proveedor y exige objeto JSON raíz.
    """
    cleaned = clean_json_text(text)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.error("AI raw response was not valid JSON: %s", cleaned[:3000])
        raise

    if not isinstance(parsed, dict):
        raise ValueError("AI response root must be a JSON object")

    return parsed


def _load_output_guard_module() -> Optional[Any]:
    """
    Carga de forma tolerante el módulo output_guard.

    No forzamos un acoplamiento rígido porque todavía estamos en primera ola
    y la firma exacta del guard puede evolucionar.
    """
    try:
        return importlib.import_module("backend.app.ai.guards.output_guard")
    except Exception:
        logger.exception("output_guard module could not be imported")
        return None


def _call_output_guard(
    payload: Dict[str, Any],
    output_type: str,
    lead_meta: Dict[str, Any],
    trace: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Intenta invocar el output_guard con varias firmas tolerantes.

    Si el guard no existe o falla, no rompe el runtime:
    devolvemos una validación neutra y seguimos con validación mínima local.
    """
    module = _load_output_guard_module()
    if module is None:
        return {
            "valid": True,
            "issues": [],
            "action": "allow",
            "source": "guard_unavailable",
        }

    candidate_names = (
        "validate_output_shape",
        "validate_output",
        "guard_output",
        "evaluate_output",
    )

    for name in candidate_names:
        func = getattr(module, name, None)
        if not callable(func):
            continue

        call_variants = (
            lambda: func(output_type=output_type, payload=payload),
            lambda: func(payload=payload, output_type=output_type),
            lambda: func(payload=payload),
            lambda: func(
                payload=payload,
                output_type=output_type,
                agent_key=lead_meta.get("lead_agent_key"),
                trace_id=trace.get("trace_id"),
            ),
        )

        for variant in call_variants:
            try:
                result = variant()
                if isinstance(result, dict):
                    return {
                        "valid": bool(result.get("valid", True)),
                        "issues": list(result.get("issues", [])),
                        "action": ensure_string(result.get("action"), "allow"),
                        "source": f"guard:{name}",
                    }
                return {
                    "valid": bool(result),
                    "issues": [],
                    "action": "allow" if bool(result) else "fallback",
                    "source": f"guard:{name}:bool",
                }
            except TypeError:
                continue
            except Exception:
                logger.exception("output_guard execution failed: %s", name)
                return {
                    "valid": True,
                    "issues": [],
                    "action": "allow",
                    "source": f"guard_error:{name}",
                }

    return {
        "valid": True,
        "issues": [],
        "action": "allow",
        "source": "guard_no_callable_api",
    }


def validate_analysis_output(
    payload: Any,
    lead_meta: Dict[str, Any],
    trace: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Valida forma mínima del payload.

    Estrategia:
    1. intentar output_guard si existe
    2. aplicar validación local mínima obligatoria
    """
    if not isinstance(payload, dict):
        return {
            "valid": False,
            "issues": ["payload_not_dict"],
            "action": "fallback",
            "guard_source": "local",
        }

    guard_result = _call_output_guard(
        payload=payload,
        output_type=ensure_string(lead_meta.get("output_type"), "analysis_result"),
        lead_meta=lead_meta,
        trace=trace,
    )

    issues = list(guard_result.get("issues", []))

    route = payload.get("route")
    diagnosis = payload.get("diagnosis")
    refine_questions = payload.get("refine_questions")

    if not isinstance(route, str) or not route.strip():
        issues.append("missing_route")

    if not isinstance(diagnosis, dict):
        issues.append("diagnosis_not_dict")

    if refine_questions is not None and not isinstance(refine_questions, list):
        issues.append("refine_questions_not_list")

    valid = len(issues) == 0

    return {
        "valid": valid,
        "issues": issues,
        "action": "allow" if valid else "fallback",
        "guard_source": guard_result.get("source", "local"),
    }


async def run_direct_analysis(
    context: Dict[str, Any],
    envelope: Dict[str, Any],
    trace: Dict[str, Any],
    lead_meta: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Ejecuta el motor directo provisional:
    - construye prompts
    - llama al proveedor
    - parsea JSON bruto
    """
    if not OPENAI_API_KEY:
        raise RuntimeError("openai_not_configured")

    client_ai = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
    system_prompt = build_system_prompt(lead_meta)
    user_prompt = build_user_prompt(context)

    logger.info(
        "ai_runtime_start trace_id=%s agent_key=%s analysis_mode=%s source_mode=%s request_id=%s",
        trace.get("trace_id"),
        lead_meta.get("lead_agent_key"),
        lead_meta.get("analysis_mode"),
        context.get("source_mode"),
        envelope.get("request_id"),
    )

    response = await client_ai.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.15,
        max_tokens=2600,
    )

    response_text = response.choices[0].message.content or "{}"
    return parse_ai_json(response_text)