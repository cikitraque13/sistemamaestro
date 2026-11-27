from backend.app.routers import builder_ai
import logging
import asyncio
from contextlib import suppress
from backend.app.services.intent_clarification import run_receipt_compaction_worker

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from backend.app.core.config import (
    ALLOWED_ORIGINS,
    FRONTEND_BUILD_DIR,
    FRONTEND_STATIC_DIR,
)
from backend.app.services.frontend_cache import cache_control_for
from backend.app.db.mongodb import client, db
from backend.app.routers.auth import router as auth_router
from backend.app.routers.billing import router as billing_router
from backend.app.routers.consumption import router as consumption_router
from backend.app.routers.opportunities import router as opportunities_router
from backend.app.routers.payments import router as payments_router
from backend.app.routers.projects import router as projects_router
from backend.app.routers.nova_voice import router as nova_voice_router
from backend.app.routers.public import router as public_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(
    title="Sistema Maestro API",
    description="Plataforma guiada de transformaciÃ³n digital",
)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(payments_router)
app.include_router(billing_router)
app.include_router(public_router)
app.include_router(nova_voice_router)
app.include_router(opportunities_router)
app.include_router(consumption_router)


@app.on_event("startup")
async def startup_event():
    from backend.app.core.llm_client import log_llm_startup
    log_llm_startup()
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.projects.create_index("user_id")
    await db.projects.create_index("project_id", unique=True)
    await db.projects.create_index([("user_id", 1), ("created_at", -1), ("project_id", -1)])
    await db.projects.create_index([("j06_1_operation_receipts.completed_at", 1)])
    await db.user_sessions.create_index("session_token")
    await db.user_sessions.create_index("user_id")
    await db.payment_transactions.create_index("stripe_session_id")
    await db.login_attempts.create_index("identifier")
    await db.newsletter_subscribers.create_index("email", unique=True)
    await db.analysis_requests.create_index("created_at")
    await db.builder_landing_states.create_index(
        [("user_id", 1), ("project_id", 1)],
        unique=True,
    )
    app.state.j06_receipt_compaction_task = asyncio.create_task(run_receipt_compaction_worker(db.projects))


@app.get("/health")
async def health():
    return {"status": "ok"}


if FRONTEND_STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_STATIC_DIR)), name="static")


def _frontend_response(path, relative: str):
    return FileResponse(str(path), headers={"Cache-Control": cache_control_for(relative)})


@app.get("/", include_in_schema=False)
async def serve_root():
    index_file = FRONTEND_BUILD_DIR / "index.html"
    if index_file.exists():
        return _frontend_response(index_file, "index.html")
    return {"detail": "Frontend build not found"}


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_react(full_path: str):
    if full_path.startswith("api") or full_path in {"docs", "redoc", "openapi.json", "health"}:
        raise HTTPException(status_code=404, detail="Not Found")

    build_root = FRONTEND_BUILD_DIR.resolve()
    requested_file = (build_root / full_path).resolve()
    if requested_file.is_relative_to(build_root) and requested_file.exists() and requested_file.is_file():
        relative = requested_file.relative_to(build_root).as_posix()
        return _frontend_response(requested_file, relative)

    index_file = FRONTEND_BUILD_DIR / "index.html"
    if index_file.exists():
        return _frontend_response(index_file, "index.html")

    return {"detail": "Frontend build not found"}


@app.on_event("shutdown")
async def shutdown_db_client():
    task = getattr(app.state, "j06_receipt_compaction_task", None)
    if task is not None:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task
    client.close()

app.include_router(builder_ai.router)

