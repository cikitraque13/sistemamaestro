from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

from backend.app.core.credits_config_loader import (
    get_action_config,
    has_required_plan,
    load_threshold_rules,
    load_tier_amounts,
)
from backend.app.schemas.consumption import (
    ConsumptionDecision,
    ConsumptionGates,
    ConsumptionRequest,
    ConsumptionResponse,
    ConsumptionUX,
    TraceSnapshot,
)

ENGINE_VERSION = "consumption_v1"
CATALOG_VERSION = "credits_v1"

TIER_ORDER = ["T1", "T2", "T3"]


def _safe_int(value: Any, default: int = 0) -> int:
    if isinstance(value, int):
        return value
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _count_signal_levels(request: ConsumptionRequest, action_config: Dict[str, Any]) -> Tuple[int, int]:
    scores: Dict[str, int] = {
        "project_complexity_score": request.project_context.project_complexity_score,
        "journey_depth_score": request.project_context.journey_depth_score,
        "output_value_score": request.project_context.output_value_score,
        "operational_cost_score": request.project_context.operational_cost_score,
    }

    high_signals = 0
    critical_signals = 0

    for score_name, score_value in scores.items():
        if score_name == "project_complexity_score" and not action_config.get("can_scale_with_complexity", True):
            continue
        if score_name == "journey_depth_score" and not action_config.get("can_scale_with_depth", True):
            continue

        if score_value >= 3:
            high_signals += 1
        if score_value == 4:
            critical_signals += 1

    return high_signals, critical_signals


def _get_repetition_flags(request: ConsumptionRequest, action_config: Dict[str, Any]) -> Tuple[bool, bool]:
    if not action_config.get("can_scale_with_repetition", True):
        return False, False

    thresholds = load_threshold_rules()
    repetition = thresholds.get("repetition", {}) if isinstance(thresholds, dict) else {}

    medium_in_session = _safe_int(repetition.get("medium_in_session"), 3)
    medium_on_project = _safe_int(repetition.get("medium_on_project"), 5)
    intense_in_session = _safe_int(repetition.get("intense_in_session"), 5)
    intense_on_project = _safe_int(repetition.get("intense_on_project"), 8)

    medium_repetition = (
        request.usage_context.action_count_in_session >= medium_in_session
        or request.usage_context.action_count_on_project >= medium_on_project
    )

    intense_repetition = (
        request.usage_context.action_count_in_session >= intense_in_session
        or request.usage_context.action_count_on_project >= intense_on_project
    )

    return medium_repetition, intense_repetition


def _escalate_one_tier(tier_name: Optional[str]) -> Optional[str]:
    if tier_name not in TIER_ORDER:
        return tier_name
    index = TIER_ORDER.index(tier_name)
    if index >= len(TIER_ORDER) - 1:
        return TIER_ORDER[-1]
    return TIER_ORDER[index + 1]


def _apply_family_guards(
    family: str,
    final_tier: Optional[str],
    consumption_type: str,
) -> Tuple[Optional[str], str]:
    safe_tier = final_tier

    if family == "analysis" and safe_tier == "T3":
        safe_tier = "T2"
        consumption_type = "standard"

    if family == "final_output":
        safe_tier = "T3"

    if family == "single_report":
        consumption_type = "none"

    return safe_tier, consumption_type


def _should_require_special_credit(
    request: ConsumptionRequest,
    action_config: Dict[str, Any],
) -> bool:
    family = str(action_config.get("family") or "").strip()
    if family == "analysis":
        return False

    if action_config.get("consumption_type_allowed") == "special":
        return True

    if bool(action_config.get("requires_special_credit_by_default")):
        return True

    if bool(action_config.get("is_protected_output")):
        return True

    thresholds = load_threshold_rules()
    special_credit_rules = thresholds.get("special_credit", {}) if isinstance(thresholds, dict) else {}
    protected_action_keys = special_credit_rules.get("protected_action_keys", [])
    if isinstance(protected_action_keys, list) and request.action_key in protected_action_keys:
        return True

    output_value_score = request.project_context.output_value_score
    operational_cost_score = request.project_context.operational_cost_score

    if output_value_score == 4 and operational_cost_score >= 3:
        return True

    if operational_cost_score == 4 and output_value_score >= 3:
        return True

    return False


def _resolve_consumption_amount(
    final_tier: Optional[str],
    decision_mode: Optional[str],
    consumption_type: str,
) -> int:
    tier_amounts = load_tier_amounts()
    if not isinstance(tier_amounts, dict):
        return 0

    multipliers = tier_amounts.get("multipliers", {})
    if not isinstance(multipliers, dict):
        multipliers = {}

    if consumption_type == "none" or not final_tier:
        return 0

    raw_type_bucket = tier_amounts.get(consumption_type, {})
    type_bucket = raw_type_bucket if isinstance(raw_type_bucket, dict) else {}

    base_amount = _safe_int(type_bucket.get(final_tier), 0)

    if decision_mode == "reinforced":
        multiplier = float(multipliers.get("reinforced", 1.5))
        return max(0, round(base_amount * multiplier))

    if decision_mode == "special_gated":
        return max(0, base_amount)

    return max(0, base_amount)


def _build_scale_reason(
    decision_mode: Optional[str],
    high_signals: int,
    critical_signals: int,
    medium_repetition: bool,
    intense_repetition: bool,
    consumption_type: str,
) -> str:
    if consumption_type == "none":
        return "no_consumption"

    if decision_mode == "special_gated":
        return "protected_output_path"

    if decision_mode == "escalated":
        if intense_repetition and high_signals >= 1:
            return "depth_plus_repetition"
        if critical_signals >= 1:
            return "critical_output"
        return "multi_signal_escalation"

    if decision_mode == "reinforced":
        if medium_repetition:
            return "repetition_load"
        if critical_signals >= 1:
            return "high_operational_load"
        return "mixed_load"

    return "standard_load"


def _build_ux_label(
    status: str,
    final_tier: Optional[str],
    decision_mode: Optional[str],
    consumption_type: str,
) -> str:
    if status == "blocked_plan":
        return "Capa superior requerida"
    if status == "blocked_balance":
        return "Créditos insuficientes"
    if status == "blocked_special_credit":
        return "Crédito premium requerido"
    if status == "blocked_invalid_action":
        return "Acción no válida"

    if consumption_type == "none":
        return "Sin consumo"
    if final_tier == "T1" and decision_mode == "base":
        return "Consumo base"
    if final_tier == "T1" and decision_mode == "reinforced":
        return "Consumo reforzado"
    if final_tier == "T2":
        return "Construcción"
    if final_tier == "T3" and consumption_type == "special":
        return "Salida premium"
    if final_tier == "T3":
        return "Acción avanzada"

    return "Consumo aplicado"


def _build_message(
    status: str,
    action_config: Optional[Dict[str, Any]],
    consumption_type: str,
    decision_mode: Optional[str],
) -> str:
    if status == "blocked_invalid_action":
        return "La acción solicitada no existe o no está habilitada."

    if status == "blocked_plan":
        required_plan = (action_config or {}).get("plan_requirement") or "superior"
        return f"Esta acción requiere el plan {required_plan} o una capa superior del sistema."

    if status == "blocked_balance":
        return "Necesitas más créditos para seguir avanzando."

    if status == "blocked_special_credit":
        return "Esta salida requiere activación premium o crédito especial."

    if consumption_type == "none":
        return "Esta acción no consume créditos."

    if decision_mode == "special_gated":
        return "Esta acción entra en una salida protegida del sistema."

    if decision_mode == "reinforced":
        return "Esta acción exige más capacidad por complejidad, recorrido o repetición."

    if decision_mode == "escalated":
        return "La acción ha escalado de tramo por intensidad del caso."

    return "Esta acción consume créditos estándar."


def _build_next_step_hint(status: str, action_key: str) -> str:
    if status == "blocked_plan":
        return "upgrade_plan"
    if status == "blocked_balance":
        return "buy_credit_pack"
    if status == "blocked_special_credit":
        return "unlock_premium_output"
    if status == "blocked_invalid_action":
        return "review_action_catalog"

    if action_key == "builder_first_run":
        return "continue_builder"
    if action_key == "single_report_purchase":
        return "activate_system_trial"
    if action_key == "project_export":
        return "download_or_deploy"
    if action_key == "project_deploy":
        return "deploy_project"

    return "continue_project"


def _build_trace_snapshot(request: ConsumptionRequest) -> TraceSnapshot:
    return TraceSnapshot(
        trace_id=request.meta.trace_id,
        engine_version=ENGINE_VERSION,
        catalog_version=CATALOG_VERSION,
        scores_snapshot={
            "project_complexity_score": request.project_context.project_complexity_score,
            "journey_depth_score": request.project_context.journey_depth_score,
            "output_value_score": request.project_context.output_value_score,
            "operational_cost_score": request.project_context.operational_cost_score,
        },
        repetition_snapshot={
            "action_count_in_session": request.usage_context.action_count_in_session,
            "action_count_on_project": request.usage_context.action_count_on_project,
        },
    )


def _build_response(
    *,
    request: ConsumptionRequest,
    status: str,
    action_config: Optional[Dict[str, Any]],
    base_tier: Optional[str],
    final_tier: Optional[str],
    decision_mode: Optional[str],
    consumption_type: str,
    consumption_amount: int,
    scale_reason: str,
    plan_gate_triggered: bool = False,
    balance_gate_triggered: bool = False,
    special_credit_gate_triggered: bool = False,
) -> ConsumptionResponse:
    return ConsumptionResponse(
        status=status,
        action_key=request.action_key,
        mode=request.mode,
        decision=ConsumptionDecision(
            base_tier=base_tier,
            final_tier=final_tier,
            decision_mode=decision_mode,
            consumption_type=consumption_type,
            consumption_amount=max(0, consumption_amount),
            scale_reason=scale_reason,
        ),
        gates=ConsumptionGates(
            plan_gate_triggered=plan_gate_triggered,
            balance_gate_triggered=balance_gate_triggered,
            special_credit_gate_triggered=special_credit_gate_triggered,
        ),
        ux=ConsumptionUX(
            ux_label=_build_ux_label(status, final_tier, decision_mode, consumption_type),
            message=_build_message(status, action_config, consumption_type, decision_mode),
            next_step_hint=_build_next_step_hint(status, request.action_key),
        ),
        trace=_build_trace_snapshot(request),
    )


def evaluate_consumption(request: ConsumptionRequest) -> ConsumptionResponse:
    action_config = get_action_config(request.action_key)

    if not action_config:
        return _build_response(
            request=request,
            status="blocked_invalid_action",
            action_config=None,
            base_tier=None,
            final_tier=None,
            decision_mode=None,
            consumption_type="none",
            consumption_amount=0,
            scale_reason="invalid_action",
        )

    consumption_type_allowed = str(action_config.get("consumption_type_allowed") or "standard").strip()
    base_tier = str(action_config.get("base_tier") or "T1").strip()
    family = str(action_config.get("family") or "").strip()

    if consumption_type_allowed == "none":
        final_tier, final_consumption_type = _apply_family_guards(
            family=family,
            final_tier=base_tier,
            consumption_type="none",
        )
        return _build_response(
            request=request,
            status="allowed",
            action_config=action_config,
            base_tier=base_tier,
            final_tier=final_tier,
            decision_mode="base",
            consumption_type=final_consumption_type,
            consumption_amount=0,
            scale_reason="no_consumption",
        )

    required_plan = str(action_config.get("plan_requirement") or "free").strip()
    if not has_required_plan(request.user_context.user_plan, required_plan):
        return _build_response(
            request=request,
            status="blocked_plan",
            action_config=action_config,
            base_tier=base_tier,
            final_tier=base_tier,
            decision_mode="base",
            consumption_type=consumption_type_allowed if consumption_type_allowed in {"standard", "special"} else "standard",
            consumption_amount=0,
            scale_reason="plan_gate",
            plan_gate_triggered=True,
        )

    high_signals, critical_signals = _count_signal_levels(request, action_config)
    medium_repetition, intense_repetition = _get_repetition_flags(request, action_config)

    final_tier = base_tier
    decision_mode = "base"

    reinforced = (
        critical_signals >= 1
        or high_signals >= 2
        or medium_repetition
    )

    escalated = (
        (critical_signals >= 1 and high_signals >= 2)
        or high_signals >= 3
        or (intense_repetition and high_signals >= 1)
    )

    if reinforced:
        decision_mode = "reinforced"

    if escalated:
        decision_mode = "escalated"
        final_tier = _escalate_one_tier(base_tier)

    requires_special_credit = _should_require_special_credit(request, action_config)

    if requires_special_credit:
        decision_mode = "special_gated"
        consumption_type = "special"
    else:
        consumption_type = "standard"

    final_tier, consumption_type = _apply_family_guards(
        family=family,
        final_tier=final_tier,
        consumption_type=consumption_type,
    )

    consumption_amount = _resolve_consumption_amount(
        final_tier=final_tier,
        decision_mode=decision_mode,
        consumption_type=consumption_type,
    )

    scale_reason = _build_scale_reason(
        decision_mode=decision_mode,
        high_signals=high_signals,
        critical_signals=critical_signals,
        medium_repetition=medium_repetition,
        intense_repetition=intense_repetition,
        consumption_type=consumption_type,
    )

    if consumption_type == "standard" and request.user_context.credit_balance < consumption_amount:
        return _build_response(
            request=request,
            status="blocked_balance",
            action_config=action_config,
            base_tier=base_tier,
            final_tier=final_tier,
            decision_mode=decision_mode,
            consumption_type=consumption_type,
            consumption_amount=consumption_amount,
            scale_reason=scale_reason,
            balance_gate_triggered=True,
        )

    if consumption_type == "special" and request.user_context.special_credit_balance < consumption_amount:
        return _build_response(
            request=request,
            status="blocked_special_credit",
            action_config=action_config,
            base_tier=base_tier,
            final_tier=final_tier,
            decision_mode=decision_mode,
            consumption_type=consumption_type,
            consumption_amount=consumption_amount,
            scale_reason=scale_reason,
            special_credit_gate_triggered=True,
        )

    return _build_response(
        request=request,
        status="allowed",
        action_config=action_config,
        base_tier=base_tier,
        final_tier=final_tier,
        decision_mode=decision_mode,
        consumption_type=consumption_type,
        consumption_amount=consumption_amount,
        scale_reason=scale_reason,
    )
