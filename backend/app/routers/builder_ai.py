from fastapi import APIRouter, HTTPException, Request

from backend.app.ai.agents.builder_agent import run_builder_agent
from backend.app.ai.schemas.builder_ai_output import BuilderAIInput
from backend.app.core.security import get_current_user
from backend.app.db.mongodb import db


router = APIRouter(prefix="/api/builder", tags=["builder-ai"])


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

    try:
        safe_payload = payload.model_copy(
            update={
                "userId": user["user_id"],
            }
        )

        result = await run_builder_agent(safe_payload)

        return result.model_dump()

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