from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status

from app.core.credits_config_loader import get_credits_config_bundle
from app.schemas.consumption import (
    ConsumptionErrorEnvelope,
    ConsumptionExecutionEnvelope,
    ConsumptionRequest,
    ConsumptionSimulationEnvelope,
)
from app.services.consumption_engine import evaluate_consumption

router = APIRouter(
    prefix="/consumption",
    tags=["consumption"],
)


def _serialize_engine_error(exc: Exception) -> Dict[str, Any]:
    return {
        "type": exc.__class__.__name__,
        "message": str(exc),
    }


@router.get(
    "/config-summary",
    response_model=Dict[str, Any],
    summary="Resumen de configuración del motor de consumo",
)
def get_consumption_config_summary() -> Dict[str, Any]:
    """
    Endpoint de inspección segura.
    No devuelve toda la configuración cruda: devuelve un resumen útil
    para validar que el catálogo y los JSON canónicos están cargando.
    """
    try:
        bundle = get_credits_config_bundle()

        action_catalog = bundle.get("action_catalog", [])
        tier_amounts = bundle.get("tier_amounts", {})
        threshold_rules = bundle.get("threshold_rules", {})
        plan_levels = bundle.get("plan_levels", {})
        contracts = bundle.get("contracts", {})
        paths = bundle.get("paths", {})

        return {
            "ok": True,
            "engine_version": "consumption_v1",
            "catalog_version": "credits_v1",
            "summary": {
                "action_catalog_count": len(action_catalog) if isinstance(action_catalog, list) else 0,
                "has_tier_amounts": bool(tier_amounts),
                "has_threshold_rules": bool(threshold_rules),
                "has_plan_levels": bool(plan_levels),
                "has_request_schema": bool(contracts.get("consumption_request")),
                "has_response_schema": bool(contracts.get("consumption_response")),
            },
            "paths": paths,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "No se pudo cargar la configuración del motor de consumo.",
                "details": _serialize_engine_error(exc),
            },
        ) from exc


@router.post(
    "/simulate",
    response_model=ConsumptionSimulationEnvelope,
    summary="Simula una acción del motor de consumo",
)
def simulate_consumption(payload: ConsumptionRequest) -> ConsumptionSimulationEnvelope:
    """
    Simula la decisión del motor sin descontar créditos.
    Útil para UX previa, validación de bloqueos y estimación de consumo.
    """
    if payload.mode != "simulate":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ConsumptionErrorEnvelope(
                ok=False,
                error="invalid_mode",
                details={
                    "message": "El endpoint /simulate requiere mode='simulate'.",
                    "received_mode": payload.mode,
                },
            ).model_dump(),
        )

    try:
        result = evaluate_consumption(payload)
        return ConsumptionSimulationEnvelope(ok=True, data=result)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ConsumptionErrorEnvelope(
                ok=False,
                error="consumption_simulation_failed",
                details=_serialize_engine_error(exc),
            ).model_dump(),
        ) from exc


@router.post(
    "/execute",
    response_model=ConsumptionExecutionEnvelope,
    summary="Evalúa una acción en modo ejecución",
)
def execute_consumption(payload: ConsumptionRequest) -> ConsumptionExecutionEnvelope:
    """
    En esta fase todavía no descuenta del ledger.
    Reutiliza la misma lógica canónica del motor para validar:
    - acción;
    - plan;
    - tramos;
    - bloqueos;
    - tipo de consumo.

    Más adelante, aquí se conectará el descuento real.
    """
    if payload.mode != "execute":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ConsumptionErrorEnvelope(
                ok=False,
                error="invalid_mode",
                details={
                    "message": "El endpoint /execute requiere mode='execute'.",
                    "received_mode": payload.mode,
                },
            ).model_dump(),
        )

    try:
        result = evaluate_consumption(payload)
        return ConsumptionExecutionEnvelope(ok=True, data=result)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ConsumptionErrorEnvelope(
                ok=False,
                error="consumption_execution_failed",
                details=_serialize_engine_error(exc),
            ).model_dump(),
        ) from exc
