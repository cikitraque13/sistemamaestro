"""First-party builder funnel. No message text and no third-party tracker."""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

logger = logging.getLogger(__name__)

STEPS = ("placeholder", "first_message", "iteration", "publish")
OUTCOMES = ("started", "completed", "failed", "abandoned")

router = APIRouter(prefix="/api/builder", tags=["builder-telemetry"])


class FunnelEventIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    projectId: str = Field(min_length=1, max_length=80)
    step: str
    outcome: str


def _now():
    return datetime.now(timezone.utc).isoformat()


def event_document(*, user_id: str, project_id: str, step: str, outcome: str) -> dict | None:
    if step not in STEPS or outcome not in OUTCOMES:
        return None
    if not user_id or not project_id:
        return None
    return {
        "user_id": user_id,
        "project_id": str(project_id)[:80],
        "step": step,
        "outcome": outcome,
        "created_at": _now(),
    }


async def record_funnel(collection, *, user_id: str, project_id: str, step: str, outcome: str) -> None:
    if collection is None:
        return
    document = event_document(user_id=user_id, project_id=project_id, step=step, outcome=outcome)
    if document is None:
        return
    await collection.insert_one(document)


async def note_funnel(database, *, user_id: str, project_id: str, step: str, outcome: str) -> None:
    collection = getattr(database, "builder_funnel_events", None)
    if collection is None:
        return
    try:
        await record_funnel(
            collection, user_id=user_id, project_id=project_id, step=step, outcome=outcome,
        )
    except Exception:
        logger.warning("executor_rejected category=telemetry")


def summarize_funnel(events) -> dict:
    steps = {
        step: {"started": 0, "completed": 0, "failed": 0, "abandoned": 0, "users": 0}
        for step in STEPS
    }
    users = {step: set() for step in STEPS}
    for event in events or []:
        if not isinstance(event, dict):
            continue
        step = event.get("step")
        outcome = event.get("outcome")
        if step not in steps or outcome not in OUTCOMES:
            continue
        steps[step][outcome] += 1
        user_id = event.get("user_id")
        if user_id:
            users[step].add(user_id)
    for step in STEPS:
        steps[step]["users"] = len(users[step])
    bottleneck = STEPS[0]
    worst = -1
    for step in STEPS:
        pain = steps[step]["failed"] + steps[step]["abandoned"]
        if pain > worst:
            worst = pain
            bottleneck = step
    return {"steps": steps, "bottleneck": bottleneck}


@router.post("/telemetry")
async def post_funnel_event(body: FunnelEventIn, request: Request):
    from backend.app.core.builder_access import ensure_builder_available
    from backend.app.core.security import get_current_user
    from backend.app.db.mongodb import db

    await ensure_builder_available(request)
    user = await get_current_user(request)
    if body.step not in STEPS or body.outcome not in OUTCOMES:
        raise HTTPException(422, detail={"message": "El evento no es válido."})
    await note_funnel(
        db,
        user_id=user["user_id"],
        project_id=body.projectId,
        step=body.step,
        outcome=body.outcome,
    )
    return {"ok": True}


@router.get("/telemetry/summary")
async def read_funnel_summary(request: Request):
    from backend.app.core.builder_access import ensure_builder_available, user_is_admin
    from backend.app.core.security import get_current_user
    from backend.app.db.mongodb import db

    await ensure_builder_available(request)
    user = await get_current_user(request)
    if not user_is_admin(user):
        raise HTTPException(403, detail={"message": "No disponible."})
    collection = getattr(db, "builder_funnel_events", None)
    events = []
    if collection is not None:
        cursor = collection.find({}, {"_id": 0, "user_id": 1, "step": 1, "outcome": 1})
        if hasattr(cursor, "__aiter__"):
            async for document in cursor:
                events.append(document)
        elif hasattr(cursor, "to_list"):
            events = await cursor.to_list(length=5000)
    return summarize_funnel(events)
