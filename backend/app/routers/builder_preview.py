"""Generate a saved landing preview.

Publication lives in builder_publish. The flags stay off unless the
environment or an admin opens them. This module only reports that state.
"""
import asyncio

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from starlette.responses import StreamingResponse

from backend.app.ai.agents.intent_clarification import ClassifierUnavailable, classify_intent
from backend.app.ai.providers.model_pricing import ANTHROPIC_RATES
from backend.app.core.builder_access import ensure_builder_available
from backend.app.core.config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL, GROK_API_KEY, GROK_MODEL
from backend.app.core.security import get_current_user
from backend.app.db.mongodb import db
from backend.app.routers.builder_ai import build_builder_consumption_request
from backend.app.routers.projects import assert_project_revision, expected_project_revision
from backend.app.ai.schemas.builder_ai_output import BuilderAIInput
from backend.app.services.blueprint import generate_blueprint
from backend.app.services.builder_landing_state import (
    LandingStateError,
    load_generated_preview,
    save_generated_preview,
)
from backend.app.services.builder_executor import encode_sse, iter_executor, with_heartbeats
from backend.app.services.builder_executor_providers import draft_page, draft_piece, judge_draft
from backend.app.services.builder_pipeline import GENERIC_MESSAGE, PipelineError, public_preview, run_pipeline
from backend.app.services.builder_publish import (
    publish_landing_enabled,
    user_may_custom_domain,
    user_may_publish,
)
from backend.app.services.builder_test_mode import builder_charge_waived, run_builder_operation
from backend.app.services.economic_operation import request_operation_id, run_economic_operation

router = APIRouter(prefix="/api/builder", tags=["builder-preview"])


class PreviewRequest(BaseModel):
    projectId: str = Field(min_length=1)
    instruction: str = Field(min_length=1, max_length=4000)


def _http_error(error: PipelineError) -> HTTPException:
    status = 503 if error.code in {
        "CLASSIFIER_UNAVAILABLE",
        "blueprint_provider_unavailable",
        "landing_unavailable",
        "landing_rejected",
        "judge_unavailable",
        "publish_disabled",
    } else 422
    return HTTPException(status, detail={"message": error.message})


def providers_ready() -> str | None:
    if not (GROK_API_KEY or "").strip() or GROK_MODEL not in {"grok-4.3", "grok-4.7"}:
        return "CLASSIFIER_UNAVAILABLE"
    if not (ANTHROPIC_API_KEY or "").strip() or ANTHROPIC_MODEL not in ANTHROPIC_RATES:
        return "landing_unavailable"
    return None


async def classify_for_pipeline(data):
    try:
        return await classify_intent(data)
    except ClassifierUnavailable as exc:
        raise PipelineError("CLASSIFIER_UNAVAILABLE") from exc


async def draft_landing_with_claude(data):
    return await draft_page(data)


async def draft_section_with_writer(data):
    return await draft_piece(data)


@router.get("/session")
async def builder_session(request: Request):
    await ensure_builder_available(request)
    user = await get_current_user(request)
    return {
        "freeTestMode": builder_charge_waived(user),
        "publishLanding": user_may_publish(user),
        "customDomain": user_may_custom_domain(user),
    }


@router.get("/preview/{project_id}")
async def read_preview(project_id: str, request: Request):
    await ensure_builder_available(request)
    user = await get_current_user(request)
    try:
        loaded = await load_generated_preview(
            db.projects, db.builder_landing_states, user["user_id"], project_id,
        )
    except LandingStateError as exc:
        if exc.code == "not_found":
            raise HTTPException(404, detail={"message": "Aún no hay una preview guardada."}) from None
        raise HTTPException(exc.status, detail={"message": GENERIC_MESSAGE}) from None
    return public_preview(loaded["preview"])


@router.post("/preview")
async def create_preview(body: PreviewRequest, request: Request):
    await ensure_builder_available(request)
    missing = providers_ready()
    if missing:
        raise _http_error(PipelineError(missing))
    user = await get_current_user(request)
    expected = expected_project_revision(request)
    project = await db.projects.find_one(
        {"project_id": body.projectId, "user_id": user["user_id"]},
        {"_id": 0},
    )
    if not project:
        raise HTTPException(404, detail={"message": "No se ha encontrado el proyecto."})
    assert_project_revision(project, expected)
    try:
        current = await load_generated_preview(
            db.projects, db.builder_landing_states, user["user_id"], body.projectId,
        )
        previous = current["preview"]
    except LandingStateError:
        previous = None
    operation_id = request_operation_id(request, "builder_preview")
    payload = BuilderAIInput(
        userInput=body.instruction,
        projectId=body.projectId,
        mode="iterate" if previous else "build",
        contextUse="project_overview",
    )
    consumption = build_builder_consumption_request(
        user=user, project=project, payload=payload, operation_id=operation_id,
    )

    async def work(_consumption):
        fresh = await db.projects.find_one(
            {"project_id": body.projectId, "user_id": user["user_id"]},
            {"_id": 0, "updated_at": 1},
        )
        if not fresh:
            raise HTTPException(404, detail={"message": "No se ha encontrado el proyecto."})
        assert_project_revision(fresh, expected)
        result = await run_pipeline(
            project=project,
            owner_id=user["user_id"],
            instruction=body.instruction,
            classify=classify_for_pipeline,
            blueprint=generate_blueprint,
            draft_landing=draft_landing_with_claude,
            judge=judge_draft,
            previous=previous,
        )
        saved = await save_generated_preview(
            db.projects, db.builder_landing_states, user["user_id"], body.projectId, result["preview"],
        )
        return {**result["public"], "updated_at": saved["updated_at"]}

    try:
        return await run_builder_operation(
            user=user,
            action="builder_preview",
            consumption_payload=consumption,
            inputs={"projectId": body.projectId, "instruction": body.instruction, "expected": expected},
            work=work,
            charge=run_economic_operation,
        )
    except PipelineError as exc:
        raise _http_error(exc) from None
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(503, detail={"message": GENERIC_MESSAGE}) from exc


@router.post("/preview/stream")
async def stream_preview(body: PreviewRequest, request: Request):
    await ensure_builder_available(request)
    missing = providers_ready()
    if missing:
        raise _http_error(PipelineError(missing))
    user = await get_current_user(request)
    expected = expected_project_revision(request)
    project = await db.projects.find_one(
        {"project_id": body.projectId, "user_id": user["user_id"]},
        {"_id": 0},
    )
    if not project:
        raise HTTPException(404, detail={"message": "No se ha encontrado el proyecto."})
    assert_project_revision(project, expected)
    try:
        current = await load_generated_preview(
            db.projects, db.builder_landing_states, user["user_id"], body.projectId,
        )
        previous = current["preview"]
    except LandingStateError:
        previous = None
    operation_id = request_operation_id(request, "builder_preview")
    payload = BuilderAIInput(
        userInput=body.instruction,
        projectId=body.projectId,
        mode="iterate" if previous else "build",
        contextUse="project_overview",
    )
    consumption = build_builder_consumption_request(
        user=user, project=project, payload=payload, operation_id=operation_id,
    )
    queue = asyncio.Queue()

    async def work(_consumption):
        try:
            fresh = await db.projects.find_one(
                {"project_id": body.projectId, "user_id": user["user_id"]},
                {"_id": 0, "updated_at": 1},
            )
            if not fresh:
                raise HTTPException(404, detail={"message": "No se ha encontrado el proyecto."})
            assert_project_revision(fresh, expected)
            async for event in with_heartbeats(iter_executor(
                project=project,
                owner_id=user["user_id"],
                instruction=body.instruction,
                classify=classify_for_pipeline,
                blueprint=generate_blueprint,
                draft_landing=draft_landing_with_claude,
                draft_section=draft_section_with_writer,
                judge=judge_draft,
                previous=previous,
            )):
                await queue.put(event)
                if event.get("type") == "error":
                    raise PipelineError("landing_unavailable")
                if event.get("type") == "result":
                    saved = await save_generated_preview(
                        db.projects, db.builder_landing_states, user["user_id"], body.projectId, event["preview"],
                    )
                    done = {**event["public"], "updated_at": saved["updated_at"], "summary": event.get("summary") or ""}
                    await queue.put({"type": "done", **done})
                    return done
            raise PipelineError("landing_unavailable")
        finally:
            await queue.put(None)

    async def frames():
        task = asyncio.create_task(run_builder_operation(
            user=user,
            action="builder_preview",
            consumption_payload=consumption,
            inputs={"projectId": body.projectId, "instruction": body.instruction, "expected": expected, "stream": True},
            work=work,
            charge=run_economic_operation,
        ))
        sent_error = False
        try:
            while True:
                try:
                    item = await asyncio.wait_for(queue.get(), timeout=10)
                except asyncio.TimeoutError:
                    yield encode_sse({"type": "heartbeat"})
                    continue
                if item is None:
                    break
                if item.get("type") == "result":
                    continue
                if item.get("type") == "error":
                    sent_error = True
                yield encode_sse(item)
            try:
                await task
            except Exception:
                if not sent_error:
                    yield encode_sse({"type": "error", "message": GENERIC_MESSAGE})
        finally:
            if not task.done():
                task.cancel()

    return StreamingResponse(
        frames(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
