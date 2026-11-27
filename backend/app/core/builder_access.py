"""Closed Builder door.

BUILDER_ENABLED defaults to off. While it is off, builder endpoints stop
before any generation or credit reservation. Admins use the role check that
already exists in opportunities.ADMIN_ROLES; this module does not define a
new admin rule.
"""
import os

from fastapi import HTTPException

_ENABLED_VALUES = {"1", "true", "yes", "on"}

CLOSED_DETAIL = {
    "code": "builder_under_construction",
    "message": (
        "El Builder está en construcción. "
        "No se ha generado nada y no se han usado créditos."
    ),
}


def builder_enabled() -> bool:
    raw = os.environ.get("BUILDER_ENABLED")
    if raw is None:
        return False
    return raw.strip().lower() in _ENABLED_VALUES


def _role_is_admin(role) -> bool:
    from backend.app.routers.opportunities import ADMIN_ROLES

    return str(role or "").strip().lower() in ADMIN_ROLES


async def ensure_builder_available(request) -> None:
    if builder_enabled():
        return

    from backend.app.core.security import get_current_user

    try:
        user = await get_current_user(request)
    except HTTPException as exc:
        if exc.status_code != 401:
            raise
        user = None

    if isinstance(user, dict) and _role_is_admin(user.get("role")):
        return

    raise HTTPException(status_code=503, detail=dict(CLOSED_DETAIL))
