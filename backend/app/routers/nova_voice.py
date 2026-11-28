import logging
import os

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from backend.app.services.nova_voice import (
    NovaVoiceUnavailable,
    RateLimiter,
    mint_ephemeral_token,
    nova_voice_id,
    public_config,
    public_session,
    resolve_nova_voice_provider,
    sanitize_nova_diag,
)
from backend.app.services.website_analysis_request import (
    NOT_REGISTERED_MESSAGE,
    WebsiteAnalysisError,
    prepare_analysis_request,
    queued_result,
    refused_result,
)

router = APIRouter(prefix="/api", tags=["nova-voice"])
logger = logging.getLogger(__name__)
_limiter = RateLimiter()
_diag_limiter = RateLimiter(limit=30, window_seconds=600)
_analysis_limiter = RateLimiter(limit=5, window_seconds=600)


class WebsiteAnalysisIn(BaseModel):
    business_name: str = Field(default="", max_length=200)
    website_url: str = Field(default="", max_length=500)
    contact: str = Field(default="", max_length=200)
    consent: bool = False


def analysis_requests_collection():
    from backend.app.db.mongodb import db

    return db.analysis_requests


class NovaVoiceDiag(BaseModel):
    stage: str = Field(default="unknown", max_length=32)
    http_status: int | None = None
    ws_code: int | None = None
    ws_reason: str = Field(default="", max_length=200)
    message: str = Field(default="", max_length=200)


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()[:80] or "unknown"
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


@router.get("/public/nova-voice")
async def nova_voice_config():
    return public_config(resolve_nova_voice_provider())


@router.post("/public/nova-voice/session")
async def nova_voice_session(request: Request):
    provider = resolve_nova_voice_provider()
    if provider != "grok":
        return public_config(provider)

    if not _limiter.allow(_client_key(request)):
        return JSONResponse(
            status_code=429,
            content={"provider": "browser", "detail": "nova_voice_busy"},
        )

    api_key = (os.environ.get("GROK_API_KEY") or "").strip()
    if not api_key:
        return public_config("browser")

    from backend.app.ai.guards.llm_budget import authorize_voice, persist_recorded
    from backend.app.services.nova_voice import TOKEN_SECONDS

    grant = authorize_voice(surface="demo", subject=_client_key(request), token_seconds=TOKEN_SECONDS)
    if not grant["allowed"]:
        return JSONResponse(
            status_code=429,
            content={"provider": "browser", "detail": "usage_limit", "message": grant["message"]},
        )
    await persist_recorded(grant.get("event"))

    try:
        minted = await mint_ephemeral_token(api_key)
    except NovaVoiceUnavailable:
        logger.warning("nova_voice_mint_failed")
        return JSONResponse(
            status_code=503,
            content={"provider": "browser", "detail": "nova_voice_unavailable"},
        )
    except Exception:
        logger.exception("nova_voice_mint_error")
        return JSONResponse(
            status_code=503,
            content={"provider": "browser", "detail": "nova_voice_unavailable"},
        )

    logger.info("nova_voice_session_minted")
    return public_session(minted["token"], minted["expires_at"], nova_voice_id())


@router.post("/public/nova-voice/website-analysis")
async def nova_website_analysis(body: WebsiteAnalysisIn, request: Request):
    if not _analysis_limiter.allow(_client_key(request)):
        return JSONResponse(
            status_code=429,
            content=refused_result("rate_limited", NOT_REGISTERED_MESSAGE),
        )
    try:
        record = prepare_analysis_request(body.model_dump())
    except WebsiteAnalysisError as exc:
        return JSONResponse(
            status_code=400,
            content=refused_result(exc.detail, exc.nova_message),
        )
    try:
        await analysis_requests_collection().insert_one(dict(record))
    except Exception:
        logger.error("website_analysis_store_failed")
        return JSONResponse(
            status_code=503,
            content=refused_result("store_failed", NOT_REGISTERED_MESSAGE),
        )
    logger.info("website_analysis_queued")
    return queued_result(record)


@router.post("/public/nova-voice/diag")
async def nova_voice_diag(body: NovaVoiceDiag, request: Request):
    if not _diag_limiter.allow(_client_key(request)):
        return JSONResponse(status_code=429, content={"ok": False})
    clean = sanitize_nova_diag(body.model_dump())
    logger.warning("nova_voice_diag %s", clean)
    return {"ok": True}
