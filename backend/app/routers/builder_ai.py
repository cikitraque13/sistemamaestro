from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Request

from backend.app.ai.agents.builder_agent import run_builder_agent
from backend.app.ai.guards.cost_guard import assess_cost
from backend.app.ai.guards.output_guard import validate_output_shape
from backend.app.ai.guards.policy_guard import evaluate_policy
from backend.app.ai.guards.security_guard import assess_security_context
from backend.app.ai.schemas.builder_ai_output import BuilderAIInput
from backend.app.ai.telemetry.agent_trace import build_trace
from backend.app.core.security import get_current_user
from backend.app.db.mongodb import db
from backend.app.schemas.consumption import ConsumptionRequest
from backend.app.services.consumption_engine import execute_consumption_for_user


router = APIRouter(prefix="/api/builder", tags=["builder-ai"])


def _model_to_dict(model: Any) -> Dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump()

    if hasattr(model, "dict"):
        return model.dict()

    return {"value": model}


def clamp_score(value: Any, default: int = 2) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = default

    return max(1, min(4, parsed))


def get_project_scores(project: Optional[Dict[str, Any]]) -> Dict[str, int]:
    if not project:
        return {
            "project_complexity_score": 2,
            "journey_depth_score": 2,
            "output_value_score": 2,
            "operational_cost_score": 2,
        }

    recommendation = project.get("plan_recommendation") or {}
    scores = recommendation.get("scores") or {}

    urgency = clamp_score(scores.get("urgency"), 1)
    structure_need = clamp_score(scores.get("structure_need"), 1)

    return {
        "project_complexity_score": clamp_score(scores.get("complexity"), 2),
        "journey_depth_score": clamp_score(scores.get("continuity_need"), 2),
        "output_value_score": clamp_score(scores.get("economic_impact"), 2),
        "operational_cost_score": clamp_score(
            max(urgency, structure_need),
            2,
        ),
    }


def resolve_builder_action_key(payload: BuilderAIInput) -> str:
    if payload.mode == "build":
        return "builder_first_run"

    if payload.mode == "repair":
        return "builder_structural_iteration"

    return "builder_light_iteration"


def build_builder_consumption_request(
    *,
    user: Dict[str, Any],
    project: Optional[Dict[str, Any]],
    payload: BuilderAIInput,
) -> ConsumptionRequest:
    project_id = (
        project.get("project_id")
        if project
        else payload.projectId or f"virtual_builder_{uuid.uuid4().hex[:12]}"
    )

    return ConsumptionRequest(
        mode="execute",
        action_key=resolve_builder_action_key(payload),
        user_context={
            "user_id": user["user_id"],
            "user_plan": user.get("plan", "free"),
            "credit_balance": 0,
            "special_credit_balance": 0,
        },
        project_context={
            "project_id": project_id,
            **get_project_scores(project),
        },
        usage_context={
            "action_count_in_session": 0,
            "action_count_on_project": 0,
        },
        meta={
            "surface": "builder",
            "entry_point": "builder_ai_build",
            "builder_mode": payload.mode,
            "trace_id": f"trace_{uuid.uuid4().hex[:12]}",
        },
    )


def build_builder_ai_guard_context(
    *,
    payload: BuilderAIInput,
    user: Dict[str, Any],
    project: Optional[Dict[str, Any]],
    consumption_payload: ConsumptionRequest,
) -> Dict[str, Any]:
    user_input = (payload.userInput or "").lower()
    target_domain = "builder_runtime"

    if "deploy" in user_input or "hosting" in user_input:
        target_domain = "autonomous_deploy"
    elif "precio" in user_input or "pricing" in user_input:
        target_domain = "pricing_strategy"

    estimated_units = max(
        len(payload.userInput or ""),
        len(str(payload.currentBuildState or {})) // 4,
    )

    return {
        "agent_key": "builder_agent",
        "target_domain": target_domain,
        "project_id": payload.projectId or project.get("project_id") if project else payload.projectId,
        "user_id": user.get("user_id"),
        "builder_mode": payload.mode,
        "estimated_units": estimated_units,
        "trace_id": consumption_payload.meta.get("trace_id") if consumption_payload.meta else None,
        "touches_auth": False,
        "touches_payments": target_domain == "pricing_strategy",
        "touches_tokens": False,
        "touches_user_sessions": False,
    }


def run_builder_ai_guards(context: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    return {
        "policy": evaluate_policy(
            agent_key="builder_agent",
            target_domain=str(context.get("target_domain") or "builder_runtime"),
        ),
        "security": assess_security_context(context),
        "cost": assess_cost(context),
    }


def enforce_builder_ai_guards(guards: Dict[str, Dict[str, Any]]) -> None:
    policy = guards.get("policy") or {}
    security = guards.get("security") or {}
    cost = guards.get("cost") or {}

    if policy.get("allowed") is False:
        raise HTTPException(
            status_code=403,
            detail={"message": "Builder AI bloqueado por policy_guard.", "guards": guards},
        )

    if security.get("action") == "require_explicit_security_gate":
        raise HTTPException(
            status_code=403,
            detail={"message": "Builder AI bloqueado por security_guard.", "guards": guards},
        )

    if cost.get("action") == "require_explicit_approval":
        raise HTTPException(
            status_code=402,
            detail={"message": "Builder AI bloqueado por cost_guard.", "guards": guards},
        )


def build_guard_warnings(guards: Dict[str, Dict[str, Any]]) -> list[str]:
    warnings: list[str] = []

    for guard_name, decision in guards.items():
        action = decision.get("action") or decision.get("reason")
        if action and action not in {"allow", "allowed", "allow_with_trace"}:
            warnings.append(f"{guard_name}:{action}")

    return warnings


@router.post("/build")
async def build_with_ai(payload: BuilderAIInput, request: Request):
    user = await get_current_user(request)

    project = None

    if payload.projectId:
        project = await db.projects.find_one(
            {
                "project_id": payload.projectId,
                "user_id": user["user_id"],
            },
            {"_id": 0},
        )

        if not project:
            raise HTTPException(
                status_code=404,
                detail="Project not found",
            )

    consumption_payload = build_builder_consumption_request(
        user=user,
        project=project,
        payload=payload,
    )

    consumption_result = await execute_consumption_for_user(
        runtime_user=user,
        payload=consumption_payload,
    )

    if consumption_result.status != "allowed":
        raise HTTPException(
            status_code=402,
            detail=_model_to_dict(consumption_result),
        )

    guard_context = build_builder_ai_guard_context(
        payload=payload,
        user=user,
        project=project,
        consumption_payload=consumption_payload,
    )
    guards = run_builder_ai_guards(guard_context)
    enforce_builder_ai_guards(guards)

    try:
        safe_payload = payload.model_copy(
            update={
                "userId": user["user_id"],
            }
        )

        result = await run_builder_agent(safe_payload)
        result_data = result.model_dump()
        output_guard = validate_output_shape("BuilderAIOutput", result_data)

        if not output_guard.get("valid"):
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Builder AI devolvió una salida inválida.",
                    "output_guard": output_guard,
                },
            )

        trace = build_trace(
            agent_key="builder_agent",
            phase="builder_ai_build",
            status="completed",
            project_id=guard_context.get("project_id"),
            user_id=guard_context.get("user_id"),
            notes=["builder_ai_spine_min"],
            meta={
                "guards": guards,
                "output_guard": output_guard,
                "builder_mode": payload.mode,
            },
        )

        result_data["warnings"] = [
            *result_data.get("warnings", []),
            *build_guard_warnings(guards),
        ]
        result_data["trace"] = trace
        result_data["guards"] = guards
        result_data["consumption"] = _model_to_dict(consumption_result)

        return result_data

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Error construyendo con Builder AI.",
                "reason": str(exc),
            },
        )