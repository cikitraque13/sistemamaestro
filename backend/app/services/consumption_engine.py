from __future__ import annotations

from typing import Any, Dict

from backend.app.core.credits_config_loader import (
    get_action_config,
    get_credits_config_bundle,
    has_required_plan,
)
from backend.app.schemas.consumption import (
    ConsumptionDecision,
    ConsumptionGates,
    ConsumptionRequest,
    ConsumptionResponse,
    ConsumptionResponse,
    ConsumptionUX,
    TraceSnapshot,
)
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


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


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
        "special_credit_balance": int(runtime_credit_summary.get("special_credit_balance", 0) or 0),
    }

    return ConsumptionRequest(**data)


def _score_snapshot(payload: ConsumptionRequest) -> Dict[str, int]:
    return {
        "project_complexity_score": payload.project_context.project_complexity_score,
        "journey_depth_score": payload.project_context.journey_depth_score,
        "output_value_score": payload.project_context.output_value_score,
        "operational_cost_score": payload.project_context.operational_cost_score,
    }


def _repetition_snapshot(payload: ConsumptionRequest) -> Dict[str, int]:
    return {
        "action_count_in_session": payload.usage_context.action_count_in_session,
        "action_count_on_project": payload.usage_context.action_count_on_project,
    }


def _build_trace(payload: ConsumptionRequest) -> TraceSnapshot:
    return TraceSnapshot(
        trace_id=payload.meta.trace_id,
        engine_version="consumption_v1",
        catalog_version="credits_v1",
        scores_snapshot=_score_snapshot(payload),
        repetition_snapshot=_repetition_snapshot(payload),
    )


def _build_response(
    *,
    payload: ConsumptionRequest,
    status: str,
    decision: ConsumptionDecision,
    gates: ConsumptionGates | None = None,
    ux: ConsumptionUX | None = None,
) -> ConsumptionResponse:
    return ConsumptionResponse(
        status=status,
        action_key=payload.action_key,
        mode=payload.mode,
        decision=decision,
        gates=gates or ConsumptionGates(),
        ux=ux or ConsumptionUX(),
        trace=_build_trace(payload),
    )


def _resolve_base_tier(payload: ConsumptionRequest) -> str:
    total = (
        payload.project_context.project_complexity_score
        + payload.project_context.journey_depth_score
        + payload.project_context.output_value_score
        + payload.project_context.operational_cost_score
    )

    if total >= 13:
        return "T3"
    if total >= 9:
        return "T2"
    return "T1"


def _resolve_decision_mode(payload: ConsumptionRequest, threshold_rules: Dict[str, Any]) -> str:
    scores = _score_snapshot(payload)
    repetition = _repetition_snapshot(payload)

    high_signals = sum(1 for value in scores.values() if value >= 3)
    critical_signals = sum(1 for value in scores.values() if value >= 4)

    repetition_rules = threshold_rules.get("repetition", {})
    reinforced_rules = threshold_rules.get("reinforced", {})
    escalated_rules = threshold_rules.get("escalated", {})

    intense_session = repetition["action_count_in_session"] >= _safe_int(
        repetition_rules.get("intense_in_session"),
        5,
    )
    intense_project = repetition["action_count_on_project"] >= _safe_int(
        repetition_rules.get("intense_on_project"),
        8,
    )
    medium_session = repetition["action_count_in_session"] >= _safe_int(
        repetition_rules.get("medium_in_session"),
        3,
    )
    medium_project = repetition["action_count_on_project"] >= _safe_int(
        repetition_rules.get("medium_on_project"),
        5,
    )

    if intense_session or intense_project:
        return "escalated"

    if (
        (
            bool(escalated_rules.get("critical_and_high", True))
            and critical_signals >= 1
            and high_signals >= 2
        )
        or high_signals >= _safe_int(escalated_rules.get("high_signals_min"), 3)
    ):
        return "escalated"

    if (
        critical_signals >= _safe_int(reinforced_rules.get("critical_signals_min"), 1)
        or high_signals >= _safe_int(reinforced_rules.get("high_signals_min"), 2)
        or medium_session
        or medium_project
    ):
        return "reinforced"

    return "base"


def _resolve_final_tier(base_tier: str, decision_mode: str) -> str:
    rank = {"T1": 1, "T2": 2, "T3": 3}.get(base_tier, 1)

    if decision_mode == "base":
        final_rank = rank
    elif decision_mode == "reinforced":
        final_rank = min(rank + 1, 3)
    else:
        final_rank = 3

    return {1: "T1", 2: "T2", 3: "T3"}[final_rank]


def _resolve_consumption_type(
    payload: ConsumptionRequest,
    action_config: Dict[str, Any],
    threshold_rules: Dict[str, Any],
) -> str:
    raw_type = action_config.get("consumption_type")
    if raw_type in {"none", "standard", "special"}:
        return raw_type

    protected = (
        threshold_rules.get("special_credit", {})
        .get("protected_action_keys", [])
    )
    if payload.action_key in protected:
        return "special"

    return "standard"


def _resolve_amount(
    action_config: Dict[str, Any],
    bundle: Dict[str, Any],
    consumption_type: str,
    final_tier: str,
    decision_mode: str,
) -> int:
    if isinstance(action_config.get("consumption_amount"), int):
        return max(0, int(action_config["consumption_amount"]))

    tier_amounts = bundle.get("tier_amounts", {})
    type_table = tier_amounts.get(consumption_type, {})
    base_amount = _safe_int(
        type_table.get(final_tier, type_table.get(final_tier.lower(), 0)),
        0,
    )

    multipliers = tier_amounts.get("multipliers", {})
    if decision_mode == "base":
        multiplier = float(multipliers.get("base", 1.0) or 1.0)
    elif decision_mode == "reinforced":
        multiplier = float(multipliers.get("reinforced", 1.5) or 1.5)
    else:
        multiplier = float(multipliers.get("intensive_t3", 2.0) or 2.0)

    return max(0, int(round(base_amount * multiplier)))


def evaluate_consumption(payload: ConsumptionRequest) -> ConsumptionResponse:
    bundle = get_credits_config_bundle()
    threshold_rules = bundle.get("threshold_rules", {})

    action_config = get_action_config(payload.action_key)
    if not action_config:
        return _build_response(
            payload=payload,
            status="blocked_invalid_action",
            decision=ConsumptionDecision(consumption_type="none", consumption_amount=0),
            ux=ConsumptionUX(
                ux_label="Accion no valida",
                message="La accion solicitada no existe en el catalogo de consumo.",
                next_step_hint="review_action_key",
            ),
        )

    required_plan = action_config.get("required_plan", "free")
    if not has_required_plan(payload.user_context.user_plan, required_plan):
        return _build_response(
            payload=payload,
            status="blocked_plan",
            decision=ConsumptionDecision(consumption_type="none", consumption_amount=0),
            gates=ConsumptionGates(plan_gate_triggered=True),
            ux=ConsumptionUX(
                ux_label="Plan requerido",
                message="Tu plan actual no permite ejecutar esta accion.",
                next_step_hint="upgrade_plan",
            ),
        )

    base_tier = _resolve_base_tier(payload)
    decision_mode = _resolve_decision_mode(payload, threshold_rules)
    final_tier = _resolve_final_tier(base_tier, decision_mode)
    consumption_type = _resolve_consumption_type(payload, action_config, threshold_rules)
    consumption_amount = _resolve_amount(
        action_config=action_config,
        bundle=bundle,
        consumption_type=consumption_type,
        final_tier=final_tier,
        decision_mode=decision_mode,
    )

    decision = ConsumptionDecision(
        base_tier=base_tier,
        final_tier=final_tier,
        decision_mode=decision_mode,
        consumption_type=consumption_type,
        consumption_amount=consumption_amount,
        scale_reason=f"{decision_mode}:{base_tier}->{final_tier}",
    )

    if consumption_type == "special":
        special_balance = _safe_int(payload.user_context.special_credit_balance, 0)
        if special_balance < consumption_amount:
            return _build_response(
                payload=payload,
                status="blocked_special_credit",
                decision=decision,
                gates=ConsumptionGates(special_credit_gate_triggered=True),
                ux=ConsumptionUX(
                    ux_label="Credito premium requerido",
                    message="Esta accion requiere credito premium disponible.",
                    next_step_hint="unlock_premium_output",
                ),
            )

    if consumption_type == "standard":
        credit_balance = _safe_int(payload.user_context.credit_balance, 0)
        if credit_balance < consumption_amount:
            return _build_response(
                payload=payload,
                status="blocked_balance",
                decision=decision,
                gates=ConsumptionGates(balance_gate_triggered=True),
                ux=ConsumptionUX(
                    ux_label="Creditos insuficientes",
                    message="No tienes saldo suficiente para esta accion.",
                    next_step_hint="buy_credit_pack",
                ),
            )

    return _build_response(
        payload=payload,
        status="allowed",
        decision=decision,
        ux=ConsumptionUX(
            ux_label="Accion permitida",
            message="La accion puede ejecutarse con la configuracion actual.",
            next_step_hint="continue_project",
        ),
    )


def _build_blocked_balance_from_response(
    response: ConsumptionResponse,
    *,
    message: str = "Necesitas mas creditos para seguir avanzando.",
) -> ConsumptionResponse:
    data = _model_to_dict(response)
    data["status"] = "blocked_balance"
    data["gates"]["balance_gate_triggered"] = True
    data["ux"]["ux_label"] = "Creditos insuficientes"
    data["ux"]["message"] = message
    data["ux"]["next_step_hint"] = "buy_credit_pack"
    return ConsumptionResponse(**data)


def _build_blocked_special_from_response(
    response: ConsumptionResponse,
    *,
    message: str = "La capa de credito premium todavia no esta activa en ejecucion real.",
) -> ConsumptionResponse:
    data = _model_to_dict(response)
    data["status"] = "blocked_special_credit"
    data["gates"]["special_credit_gate_triggered"] = True
    data["ux"]["ux_label"] = "Credito premium requerido"
    data["ux"]["message"] = message
    data["ux"]["next_step_hint"] = "unlock_premium_output"
    return ConsumptionResponse(**data)


async def execute_consumption_for_user(
    runtime_user: Dict[str, Any],
    payload: ConsumptionRequest,
) -> ConsumptionResponse:
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
            meta={
                "project_id": project_id,
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
            message="El saldo ya no es suficiente para ejecutar esta accion.",
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