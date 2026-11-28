"""Read-only totals for provider spend. Same admin door as the builder funnel summary."""

from fastapi import APIRouter, HTTPException, Request

from backend.app.ai.guards.llm_budget import aggregate_usage, load_stored_events

router = APIRouter(prefix="/api/internal", tags=["llm-usage"])


@router.get("/llm-usage")
async def read_llm_usage(request: Request):
    from backend.app.core.builder_access import ensure_builder_available, user_is_admin
    from backend.app.core.security import get_current_user

    await ensure_builder_available(request)
    user = await get_current_user(request)
    if not user_is_admin(user):
        raise HTTPException(403, detail={"message": "No disponible."})
    events = await load_stored_events()
    return aggregate_usage(events)
