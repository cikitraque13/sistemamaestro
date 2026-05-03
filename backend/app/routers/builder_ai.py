from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Request

from backend.app.ai.agents.builder_agent import run_builder_agent
from backend.app.ai.schemas.builder_ai_output import BuilderAIInput
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

    try:
        safe_payload = payload.model_copy(
            update={
                "userId": user["user_id"],
            }
        )

        result = await run_builder_agent(safe_payload)
        result_data = result.model_dump()

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