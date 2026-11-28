"""Publish and custom-domain steps. Both stay dark unless the flag or an admin says otherwise.

No Railway calls and no DNS writes happen in these handlers.
TODO(founder): gem charge for publishing is intentionally not wired.
"""
import json

from fastapi import APIRouter, HTTPException, Request

from backend.app.core.builder_access import ensure_builder_available
from backend.app.core.security import get_current_user
from backend.app.db.mongodb import db
from backend.app.services.builder_publish import (
    PublishError,
    clear_custom_domain,
    publish_project,
    publish_settings,
    read_publication,
    republish_project,
    set_custom_domain,
    unpublish_project,
    user_may_custom_domain,
    user_may_publish,
    verify_custom_domain,
)

router = APIRouter(prefix="/api/builder", tags=["builder-publish"])

PUBLISH_CLOSED = "La publicación no está disponible."
DOMAIN_CLOSED = "El dominio propio no está disponible."


def _http(error: PublishError) -> HTTPException:
    return HTTPException(error.status, detail={"message": error.message, "code": error.code})


async def _owner(request: Request) -> dict:
    await ensure_builder_available(request)
    return await get_current_user(request)


async def _json(request: Request) -> dict:
    raw = await request.body()
    if not raw or not raw.strip():
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(422, detail={"message": "El cuerpo no es válido."}) from exc
    if not isinstance(data, dict):
        raise HTTPException(422, detail={"message": "El cuerpo no es válido."})
    return data


@router.get("/publish/{project_id}")
async def read_publish(project_id: str, request: Request):
    user = await _owner(request)
    if not user_may_publish(user):
        raise HTTPException(503, detail={"message": PUBLISH_CLOSED})
    try:
        return await read_publication(
            db.builder_publications, owner_id=user["user_id"], project_id=project_id,
            settings=publish_settings(),
        )
    except PublishError as exc:
        raise _http(exc) from None


@router.post("/publish/{project_id}")
async def publish_landing(project_id: str, request: Request):
    user = await _owner(request)
    if not user_may_publish(user):
        raise HTTPException(503, detail={"message": PUBLISH_CLOSED})
    body = await _json(request)
    # TODO(founder): charge gems for this publication. Not in this change.
    try:
        return await publish_project(
            db.projects, db.builder_landing_states, db.builder_publications,
            owner_id=user["user_id"], project_id=project_id, slug=str(body.get("slug") or ""),
            settings=publish_settings(),
            modules=db.agent_project_modules,
        )
    except PublishError as exc:
        raise _http(exc) from None


@router.post("/publish/{project_id}/republish")
async def republish_landing(project_id: str, request: Request):
    user = await _owner(request)
    if not user_may_publish(user):
        raise HTTPException(503, detail={"message": PUBLISH_CLOSED})
    try:
        return await republish_project(
            db.projects, db.builder_landing_states, db.builder_publications,
            owner_id=user["user_id"], project_id=project_id, settings=publish_settings(),
            modules=db.agent_project_modules,
        )
    except PublishError as exc:
        raise _http(exc) from None


@router.post("/publish/{project_id}/unpublish")
async def unpublish_landing(project_id: str, request: Request):
    user = await _owner(request)
    if not user_may_publish(user):
        raise HTTPException(503, detail={"message": PUBLISH_CLOSED})
    try:
        return await unpublish_project(
            db.builder_publications, owner_id=user["user_id"], project_id=project_id,
            settings=publish_settings(),
        )
    except PublishError as exc:
        raise _http(exc) from None


@router.post("/domain/{project_id}")
async def save_domain(project_id: str, request: Request):
    user = await _owner(request)
    if not user_may_custom_domain(user):
        raise HTTPException(503, detail={"message": DOMAIN_CLOSED})
    body = await _json(request)
    try:
        return await set_custom_domain(
            db.builder_publications, owner_id=user["user_id"], project_id=project_id,
            domain=str(body.get("domain") or ""), settings=publish_settings(),
        )
    except PublishError as exc:
        raise _http(exc) from None


@router.post("/domain/{project_id}/verify")
async def verify_domain(project_id: str, request: Request):
    user = await _owner(request)
    if not user_may_custom_domain(user):
        raise HTTPException(503, detail={"message": DOMAIN_CLOSED})
    try:
        return await verify_custom_domain(
            db.builder_publications, owner_id=user["user_id"], project_id=project_id,
            settings=publish_settings(),
        )
    except PublishError as exc:
        raise _http(exc) from None


@router.delete("/domain/{project_id}")
async def delete_domain(project_id: str, request: Request):
    user = await _owner(request)
    if not user_may_custom_domain(user):
        raise HTTPException(503, detail={"message": DOMAIN_CLOSED})
    try:
        return await clear_custom_domain(
            db.builder_publications, owner_id=user["user_id"], project_id=project_id,
            settings=publish_settings(),
        )
    except PublishError as exc:
        raise _http(exc) from None
