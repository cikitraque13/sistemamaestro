import logging
import os

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from backend.app.services.nova_voice import (
    NovaVoiceUnavailable,
    RateLimiter,
    mint_ephemeral_token,
    nova_voice_id,
    public_config,
    public_session,
    resolve_nova_voice_provider,
)

router = APIRouter(prefix="/api", tags=["nova-voice"])
logger = logging.getLogger(__name__)
_limiter = RateLimiter()


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
