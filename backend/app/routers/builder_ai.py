from fastapi import APIRouter, HTTPException

from backend.app.ai.agents.builder_agent import run_builder_agent
from backend.app.ai.schemas.builder_ai_output import BuilderAIInput


router = APIRouter(prefix="/api/builder", tags=["builder-ai"])


@router.post("/build")
async def build_with_ai(payload: BuilderAIInput):
    try:
        result = await run_builder_agent(payload)
        return result.model_dump()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Error construyendo con Builder AI.",
                "reason": str(exc),
            },
        )
