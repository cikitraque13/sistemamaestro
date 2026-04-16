import logging

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware

from backend.app.core.config import (
    ALLOWED_ORIGINS,
    FRONTEND_BUILD_DIR,
    FRONTEND_STATIC_DIR,
)
from backend.app.db.mongodb import client, db
from backend.app.routers.auth import router as auth_router
from backend.app.routers.projects import router as projects_router
from backend.app.routers.payments import router as payments_router
from backend.app.routers.billing import router as billing_router
from backend.app.routers.public import router as public_router
from backend.app.routers.opportunities import router as opportunities_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(
    title="Sistema Maestro API",
    description="Plataforma guiada de transformación digital"
)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(payments_router)
app.include_router(billing_router)
app.include_router(public_router)
app.include_router(opportunities_router)


@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.projects.create_index("user_id")
    await db.projects.create_index("project_id", unique=True)
    await db.user_sessions.create_index("session_token")
    await db.user_sessions.create_index("user_id")
    await db.payment_transactions.create_index("stripe_session_id")
    await db.login_attempts.create_index("identifier")


@app.get("/health")
async def health():
    return {"status": "ok"}


if FRONTEND_STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_STATIC_DIR)), name="static")


@app.get("/", include_in_schema=False)
async def serve_root():
    index_file = FRONTEND_BUILD_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"detail": "Frontend build not found"}


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_react(full_path: str):
    if full_path.startswith("api") or full_path in {"docs", "redoc", "openapi.json", "health"}:
        raise HTTPException(status_code=404, detail="Not Found")

    requested_file = FRONTEND_BUILD_DIR / full_path
    if requested_file.exists() and requested_file.is_file():
        return FileResponse(str(requested_file))

    index_file = FRONTEND_BUILD_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))

    return {"detail": "Frontend build not found"}


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
