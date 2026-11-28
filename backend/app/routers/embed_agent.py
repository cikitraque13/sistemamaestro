"""Owner and public routes for the embeddable voice agent."""

import logging
import os

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from backend.app.core.builder_access import user_is_admin
from backend.app.core.security import get_current_user
from backend.app.services.embed_agent import (
    daily_cap,
    diag_category,
    embed_agent_enabled,
    failure_category,
    frame_request_allowed,
    frame_token_secret,
    generate_public_key,
    is_agent_id,
    is_public_key,
    issue_frame_token,
    log_embed_failure,
    new_agent_record,
    normalize_origin,
    origin_allowed,
    owner_payload,
    parse_allowed_origins,
    provider_for_env,
    public_embed_config,
    public_embed_session,
    read_frame_token,
    release_daily_slot,
    reserve_daily_slot,
    resolve_public_origin,
    utc_day,
    voice_for_env,
)
from backend.app.services.nova_voice import (
    NovaVoiceUnavailable,
    RateLimiter,
    mint_ephemeral_token,
    sanitize_nova_diag,
)

router = APIRouter(prefix="/api", tags=["embed-agent"])
logger = logging.getLogger(__name__)

_burst = RateLimiter()
_diag_burst = RateLimiter(limit=30, window_seconds=600)
_unknown_burst = RateLimiter(limit=30, window_seconds=600)

# TODO(founder): no gem charge on create or on a voice session. See embed_agent.py.


class EmbedAgentCreate(BaseModel):
    project_id: str = Field(min_length=1, max_length=80)
    allowed_origins: list[str] = Field(default_factory=list, max_length=5)


class EmbedAgentUpdate(BaseModel):
    allowed_origins: list[str] = Field(default_factory=list, max_length=5)
    name: str | None = Field(default=None, max_length=80)
    greeting: str | None = Field(default=None, max_length=400)


class EmbedDiag(BaseModel):
    stage: str = Field(default="unknown", max_length=32)
    http_status: int | None = None
    ws_code: int | None = None
    ws_reason: str = Field(default="", max_length=200)
    message: str = Field(default="", max_length=200)


def agents_collection():
    from backend.app.db.mongodb import db

    return db.embed_agents


def usage_collection():
    from backend.app.db.mongodb import db

    return db.embed_agent_usage


def projects_collection():
    from backend.app.db.mongodb import db

    return db.projects


def users_collection():
    from backend.app.db.mongodb import db

    return db.users


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()[:80] or "unknown"
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _burst_limiter() -> RateLimiter:
    return _burst


def _public_base(request: Request) -> str:
    return resolve_public_origin(str(request.base_url))


def _closed(status: int, category: str):
    log_embed_failure(logger, category)
    return JSONResponse(
        status_code=status,
        content={"provider": "browser", "detail": f"embed_agent_{failure_category(category)}"},
    )


async def _require_owner(request: Request) -> dict:
    user = await get_current_user(request)
    if embed_agent_enabled() or user_is_admin(user):
        return user
    raise HTTPException(
        status_code=503,
        detail={
            "code": "embed_agent_disabled",
            "message": "El agente para webs existentes todavía no está disponible.",
        },
    )


def _origins_or_422(values) -> list[str]:
    try:
        return parse_allowed_origins(values)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "embed_agent_origin",
                "message": "Escribe el dominio completo, por ejemplo https://tuempresa.com.",
            },
        ) from None


async def _owned_agent(user: dict, agent_id: str) -> dict:
    if not is_agent_id(agent_id):
        raise HTTPException(status_code=404, detail={"code": "embed_agent_unknown"})
    record = await agents_collection().find_one(
        {"agent_id": agent_id, "user_id": user.get("user_id")},
        {"_id": 0},
    )
    if not record:
        raise HTTPException(status_code=404, detail={"code": "embed_agent_unknown"})
    return record


@router.post("/embed/agents")
async def create_embed_agent(body: EmbedAgentCreate, request: Request):
    user = await _require_owner(request)
    origins = _origins_or_422(body.allowed_origins)
    project = await projects_collection().find_one(
        {"project_id": body.project_id, "user_id": user.get("user_id")},
        {"_id": 0},
    )
    if not project:
        raise HTTPException(status_code=404, detail={"code": "project_not_found"})

    existing = await agents_collection().find_one(
        {"user_id": user.get("user_id"), "project_id": body.project_id},
        {"_id": 0},
    )
    if existing and existing.get("active"):
        return owner_payload(existing, _public_base(request))

    record = new_agent_record(project, user.get("user_id"), origins)
    if existing:
        record["agent_id"] = existing.get("agent_id") or record["agent_id"]
        record["created_at"] = existing.get("created_at") or record["created_at"]
        await agents_collection().update_one({"agent_id": record["agent_id"]}, {"$set": record})
    else:
        await agents_collection().insert_one(dict(record))
    return owner_payload(record, _public_base(request))


@router.get("/embed/agents")
async def read_embed_agent(request: Request, project_id: str = ""):
    user = await _require_owner(request)
    if not project_id or len(project_id) > 80:
        raise HTTPException(status_code=422, detail={"code": "project_not_found"})
    record = await agents_collection().find_one(
        {"user_id": user.get("user_id"), "project_id": project_id},
        {"_id": 0},
    )
    if not record:
        raise HTTPException(status_code=404, detail={"code": "embed_agent_unknown"})
    return owner_payload(record, _public_base(request))


@router.patch("/embed/agents/{agent_id}")
async def update_embed_agent(agent_id: str, body: EmbedAgentUpdate, request: Request):
    user = await _require_owner(request)
    record = await _owned_agent(user, agent_id)
    origins = _origins_or_422(body.allowed_origins)
    updates = {"allowed_origins": origins, "updated_at": _stamp()}
    if body.name is not None:
        name = " ".join(body.name.split()).strip()
        if not name:
            raise HTTPException(status_code=422, detail={"code": "embed_agent_name"})
        updates["name"] = name[:80]
    if body.greeting is not None:
        greeting = " ".join(body.greeting.split()).strip()
        if not greeting:
            raise HTTPException(status_code=422, detail={"code": "embed_agent_greeting"})
        updates["greeting"] = greeting[:400]
    record.update(updates)
    await agents_collection().update_one({"agent_id": record["agent_id"]}, {"$set": updates})
    return owner_payload(record, _public_base(request))


@router.post("/embed/agents/{agent_id}/rotate")
async def rotate_embed_agent(agent_id: str, request: Request):
    user = await _require_owner(request)
    record = await _owned_agent(user, agent_id)
    if not record.get("active"):
        raise HTTPException(status_code=409, detail={"code": "embed_agent_revoked"})
    record["key"] = generate_public_key()
    record["updated_at"] = _stamp()
    await agents_collection().update_one(
        {"agent_id": record["agent_id"]},
        {"$set": {"key": record["key"], "updated_at": record["updated_at"]}},
    )
    return owner_payload(record, _public_base(request))


@router.post("/embed/agents/{agent_id}/revoke")
async def revoke_embed_agent(agent_id: str, request: Request):
    user = await _require_owner(request)
    record = await _owned_agent(user, agent_id)
    stamp = _stamp()
    record["active"] = False
    record["revoked_at"] = stamp
    record["updated_at"] = stamp
    await agents_collection().update_one(
        {"agent_id": record["agent_id"]},
        {"$set": {"active": False, "revoked_at": stamp, "updated_at": stamp}},
    )
    return owner_payload(record, _public_base(request))


def _stamp() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def _header_key(request: Request) -> str:
    return (request.headers.get("x-embed-key") or "").strip()


def _header_frame(request: Request) -> str:
    return (request.headers.get("x-embed-frame") or "").strip()


async def _agent_by_key(key: str):
    if not is_public_key(key):
        return None
    return await agents_collection().find_one({"key": key}, {"_id": 0})


async def _public_open(record: dict) -> bool:
    if embed_agent_enabled():
        return True
    user = await users_collection().find_one(
        {"user_id": record.get("user_id")},
        {"_id": 0, "role": 1, "user_id": 1},
    )
    return user_is_admin(user or {})


async def _resolve_public(request: Request):
    """Return ``(record, parent_origin)`` or a JSONResponse."""
    if not _unknown_burst.allow(_client_key(request)):
        return _closed(429, "rate_limit")

    frame = _header_frame(request)
    secret = frame_token_secret()
    if frame:
        payload = read_frame_token(secret, frame) if secret else None
        if not payload:
            return _closed(401, "bad_token")
        record = await _agent_by_key(payload["k"])
        if not record or record.get("agent_id") != payload["a"]:
            return _closed(404, "unknown")
        if not await _public_open(record):
            return _closed(404, "disabled")
        if not record.get("active"):
            return _closed(403, "revoked")
        api_origin = normalize_origin(str(request.base_url)) or ""
        if not frame_request_allowed(payload, request.headers.get("origin", ""), api_origin):
            return _closed(403, "origin")
        if not origin_allowed(payload["o"], record.get("allowed_origins")):
            return _closed(403, "origin")
        return record, payload["o"]

    key = _header_key(request)
    record = await _agent_by_key(key)
    if not record:
        return _closed(404, "unknown")
    if not await _public_open(record):
        return _closed(404, "disabled")
    if not record.get("active"):
        return _closed(403, "revoked")
    parent = request.headers.get("origin", "")
    if not origin_allowed(parent, record.get("allowed_origins")):
        return _closed(403, "origin")
    return record, normalize_origin(parent)


@router.get("/public/embed/config")
async def embed_public_config(request: Request):
    resolved = await _resolve_public(request)
    if isinstance(resolved, JSONResponse):
        return resolved
    record, parent = resolved
    provider = provider_for_env()
    body = public_embed_config(record, provider)
    secret = frame_token_secret()
    if not secret:
        return _closed(503, "unavailable")
    try:
        body["frame_token"] = issue_frame_token(
            secret,
            key=record["key"],
            agent_id=record["agent_id"],
            origin=parent,
        )
    except ValueError:
        return _closed(503, "unavailable")
    return body


@router.post("/public/embed/session")
async def embed_public_session(request: Request):
    resolved = await _resolve_public(request)
    if isinstance(resolved, JSONResponse):
        return resolved
    record, _parent = resolved
    if not _burst_limiter().allow(record["agent_id"]):
        return _closed(429, "rate_limit")

    provider = provider_for_env()
    if provider != "grok":
        return public_embed_config(record, provider)

    api_key = (os.environ.get("GROK_API_KEY") or "").strip()
    if not api_key:
        return public_embed_config(record, "browser")

    day = utc_day()
    reserved = await reserve_daily_slot(usage_collection(), record["agent_id"], day, daily_cap())
    if not reserved:
        return _closed(429, "daily_cap")

    try:
        minted = await mint_ephemeral_token(api_key)
    except NovaVoiceUnavailable:
        await release_daily_slot(usage_collection(), record["agent_id"], day)
        return _closed(503, "mint_failed")
    except Exception:
        await release_daily_slot(usage_collection(), record["agent_id"], day)
        log_embed_failure(logger, "mint_failed")
        return JSONResponse(
            status_code=503,
            content={"provider": "browser", "detail": "embed_agent_unavailable"},
        )

    logger.info("embed_agent_session category=minted")
    return public_embed_session(minted["token"], minted["expires_at"], voice_for_env(), record)


@router.post("/public/embed/diag")
async def embed_public_diag(body: EmbedDiag, request: Request):
    if not _diag_burst.allow(_client_key(request)):
        log_embed_failure(logger, "rate_limit")
        return JSONResponse(status_code=429, content={"ok": False})
    resolved = await _resolve_public(request)
    if isinstance(resolved, JSONResponse):
        return resolved
    clean = sanitize_nova_diag(body.model_dump())
    logger.warning("embed_agent_diag category=%s", diag_category(clean.get("stage")))
    return {"ok": True}
