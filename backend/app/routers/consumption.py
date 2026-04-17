from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.core.credits_config_loader import get_credits_config_bundle
from backend.app.core.security import get_current_user
from backend.app.schemas.consumption import (
    ConsumptionErrorEnvelope,
    ConsumptionExecutionEnvelope,
    ConsumptionRequest,
    ConsumptionSimulationEnvelope,
)
from backend.app.services.consumption_engine import evaluate_consumption
from backend.app.services.consumption_executor import execute_consumption_for_user

router = APIRouter(
    prefix="/consumption",
    tags=["consumption"],
)


def _serialize_engine_error(exc: Exception) -> Dict[str, Any]:
    return {
        "type": exc.__class__.__name__,
        "message": str(exc),
    }


def _model_to_dict(model: Any) -> Dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    if hasattr(model, "dict"):
        return model.dict()
    return {"error": "serialization_failed"}


@router.get(
    "/config-summary",
    response_model=Dict[str, Any],
    summary="Resumen de configuración del motor de consumo",
)
def get_consumption_config_summary() -> Dict[str, Any]:
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
    if payload.mode != "simulate":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_model_to_dict(
                ConsumptionErrorEnvelope(
                    ok=False,
                    error="invalid_mode",
                    details={
                        "message": "El endpoint /simulate requiere mode='simulate'.",
                        "received_mode": payload.mode,
                    },
                )
            ),
        )

    try:
        result = evaluate_consumption(payload)
        return ConsumptionSimulationEnvelope(ok=True, data=result)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_model_to_dict(
                ConsumptionErrorEnvelope(
                    ok=False,
                    error="consumption_simulation_failed",
                    details=_serialize_engine_error(exc),
                )
            ),
        ) from exc


@router.post(
    "/execute",
    response_model=ConsumptionExecutionEnvelope,
    summary="Ejecuta una acción del motor de consumo sobre el usuario autenticado",
)
async def execute_consumption(
    payload: ConsumptionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> ConsumptionExecutionEnvelope:
    if payload.mode != "execute":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_model_to_dict(
                ConsumptionErrorEnvelope(
                    ok=False,
                    error="invalid_mode",
                    details={
                        "message": "El endpoint /execute requiere mode='execute'.",
                        "received_mode": payload.mode,
                    },
                )
            ),
        )

    try:
        result = await execute_consumption_for_user(current_user, payload)
        return ConsumptionExecutionEnvelope(ok=True, data=result)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_model_to_dict(
                ConsumptionErrorEnvelope(
                    ok=False,
                    error="consumption_execution_failed",
                    details=_serialize_engine_error(exc),
                )
            ),
        ) from exc
