from __future__ import annotations

from typing import Any, Dict

from backend.app.schemas.consumption import ConsumptionRequest, ConsumptionResponse
from backend.app.services.consumption_engine import evaluate_consumption
from backend.app.services.credits import (
    apply_manual_credit_adjustment,
    get_user_credit_summary,
)


def _model_to_dict(model: Any) -> Dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    if hasattr(model, "dict"):
        return model.dict()
    raise TypeError("Unsupported model serialization")


def _clone_request(payload: ConsumptionRequest) -> Dict[str, Any]:
    return _model_to_dict(payload)


def _force_runtime_user_context(
    payload: ConsumptionRequest,
    runtime_user: Dict[str, Any],
    runtime_credit_summary: Dict[str, Any],
) -> ConsumptionRequest:
    data = _clone_request(payload)

    data["user_context"] = {
        "user_id": runtime_user["user_id"],
        "user_plan": runtime_user.get("plan", "free"),
        "credit_balance": int(runtime_credit_summary.get("credit_balance", 0) or 0),
        "special_credit_balance": 0
    }

    return ConsumptionRequest(**data)


def _build_blocked_balance_from_response(
    response: ConsumptionResponse,
    *,
    message: str = "Necesitas más créditos para seguir avanzando.",
) -> ConsumptionResponse:
    data = _model_to_dict(response)
    data["status"] = "blocked_balance"
    data["gates"]["balance_gate_triggered"] = True
    data["ux"]["ux_label"] = "Créditos insuficientes"
    data["ux"]["message"] = message
    data["ux"]["next_step_hint"] = "buy_credit_pack"
    return ConsumptionResponse(**data)


def _build_blocked_special_from_response(
    response: ConsumptionResponse,
    *,
    message: str = "La capa de crédito premium todavía no está activa en ejecución real.",
) -> ConsumptionResponse:
    data = _model_to_dict(response)
    data["status"] = "blocked_special_credit"
    data["gates"]["special_credit_gate_triggered"] = True
    data["ux"]["ux_label"] = "Crédito premium requerido"
    data["ux"]["message"] = message
    data["ux"]["next_step_hint"] = "unlock_premium_output"
    return ConsumptionResponse(**data)


async def execute_consumption_for_user(
    runtime_user: Dict[str, Any],
    payload: ConsumptionRequest,
) -> ConsumptionResponse:
    """
    Ejecuta consumo real sobre ledger estándar.

    Fase actual:
    - sobrescribe user_context con datos reales del usuario autenticado;
    - ejecuta decisión canónica;
    - descuenta solo consumo_type == 'standard';
    - deja consumo_type == 'special' bloqueado a propósito
      hasta abrir persistencia real de special_credit_balance.
    """
    runtime_user_id = runtime_user.get("user_id")
    if not runtime_user_id:
        raise ValueError("Authenticated user is missing user_id")

    runtime_credit_summary = await get_user_credit_summary(runtime_user_id)
    runtime_request = _force_runtime_user_context(
        payload=payload,
        runtime_user=runtime_user,
        runtime_credit_summary=runtime_credit_summary,
    )

    decision = evaluate_consumption(runtime_request)

    if decision.status != "allowed":
        return decision

    consumption_type = decision.decision.consumption_type
    consumption_amount = int(decision.decision.consumption_amount or 0)
    project_id = runtime_request.project_context.project_id

    if consumption_type == "none" or consumption_amount <= 0:
        return decision

    if consumption_type == "special":
        return _build_blocked_special_from_response(decision)

    if consumption_type != "standard":
        return decision

    try:
        adjustment_result = await apply_manual_credit_adjustment(
            user_id=runtime_user_id,
            credits_delta=-consumption_amount,
            reason_code="consumption_execute",
            project_id=project_id,
            meta={
                "action_key": runtime_request.action_key,
                "mode": runtime_request.mode,
                "trace_id": runtime_request.meta.trace_id,
                "surface": runtime_request.meta.surface,
                "entry_point": runtime_request.meta.entry_point,
                "decision_mode": decision.decision.decision_mode,
                "base_tier": decision.decision.base_tier,
                "final_tier": decision.decision.final_tier,
                "consumption_type": decision.decision.consumption_type,
                "scale_reason": decision.decision.scale_reason,
            },
        )
    except ValueError:
        return _build_blocked_balance_from_response(
            decision,
            message="El saldo ya no es suficiente para ejecutar esta acción.",
        )

    balance_after = int(
        adjustment_result.get("balance_after")
        or adjustment_result.get("credit_balance")
        or 0
    )

    data = _model_to_dict(decision)
    data["ux"]["message"] = "Consumo ejecutado correctamente."
    data["ux"]["next_step_hint"] = "continue_project"
    data["trace"]["executed"] = True
    data["trace"]["ledger_reason_code"] = "consumption_execute"
    data["trace"]["balance_after"] = balance_after

    return ConsumptionResponse(**data)
