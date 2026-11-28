"""Per-project agent modules and the global kill switches.

Modules: chat, voz, whatsapp, citas. Each one is off on the project until the
owner enables it, and off globally until its env flag is set. Admins use the
role check that already exists for the builder; this module does not define a
new admin rule. Public webhooks have no user, so they stay hidden until the
flag is on.

The client dashboard that should toggle these modules is not in this change.
"""

from __future__ import annotations

import logging
import os
import secrets
from datetime import datetime, timezone

from backend.app.core.builder_access import user_is_admin

logger = logging.getLogger(__name__)

MODULES = ("chat", "voz", "whatsapp", "citas")
_TRUE = {"1", "true", "yes", "on"}
FLAG_ENV = {
    "chat": "AGENT_MODULE_CHAT_ENABLED",
    "voz": "AGENT_MODULE_VOZ_ENABLED",
    "whatsapp": "AGENT_MODULE_WHATSAPP_ENABLED",
    "citas": "AGENT_MODULE_CITAS_ENABLED",
}

MESSAGES = {
    "not_found": "No está disponible.",
    "forbidden": "No se ha podido comprobar el acceso.",
    "module_disabled": "Este módulo no está activado.",
    "rate_limited": "Demasiados mensajes. Espera un momento.",
    "cost_cap": "El asistente no está disponible ahora mismo.",
    "provider": "No he podido responder ahora mismo.",
    "config": "El módulo no está configurado.",
    "signature": "La firma no es válida.",
    "slot_taken": "Ese horario ya está ocupado.",
    "outside_hours": "Ese horario está fuera de la disponibilidad.",
    "invalid_slot": "El horario no es válido.",
    "invalid_contact": "Hace falta un teléfono o un correo.",
    "invalid_settings": "La configuración del módulo no es válida.",
    "store": "No se ha podido guardar.",
    "schema": "No he podido responder ahora mismo.",
}

_indexes_ready = False


class AgentModuleError(Exception):
    def __init__(self, code: str, status: int = 400, message: str = ""):
        super().__init__(code)
        self.code = code
        self.status = status
        self.message = message or MESSAGES.get(code, "No se ha podido completar la operación.")


def log_failure(category: str, module: str) -> None:
    """Log a failure category only. Never pass message text, numbers, or secrets."""
    logger.warning("agent_module_failed category=%s module=%s", category, module)


def global_module_enabled(name: str) -> bool:
    env_name = FLAG_ENV.get(name)
    if not env_name:
        return False
    raw = os.environ.get(env_name)
    if raw is None:
        return False
    return raw.strip().lower() in _TRUE


def runtime_block(name: str, user) -> AgentModuleError | None:
    """Global flag gate. Anonymous callers get 404. Signed-in callers get 503.

    An admin bypasses the global flag. The per-project switch is a separate check.
    """
    if name not in MODULES:
        return AgentModuleError("not_found", 404)
    if global_module_enabled(name):
        return None
    if user and user_is_admin(user):
        return None
    if user:
        return AgentModuleError("module_disabled", 503)
    return AgentModuleError("not_found", 404)


def default_module_map() -> dict:
    return {name: {"enabled": False, "settings": {}} for name in MODULES}


def public_modules(doc, project_id: str) -> dict:
    stored = doc.get("modules") if isinstance(doc, dict) else None
    modules = {}
    for name in MODULES:
        item = stored.get(name) if isinstance(stored, dict) else None
        if not isinstance(item, dict):
            item = {}
        settings = item.get("settings") if isinstance(item.get("settings"), dict) else {}
        modules[name] = {"enabled": bool(item.get("enabled")), "settings": dict(settings)}
    return {
        "project_id": project_id,
        "modules": modules,
        "global_flags": {name: global_module_enabled(name) for name in MODULES},
    }


def module_enabled(view: dict, name: str) -> bool:
    item = (view.get("modules") or {}).get(name) or {}
    return bool(item.get("enabled"))


def module_settings(view: dict, name: str) -> dict:
    item = (view.get("modules") or {}).get(name) or {}
    settings = item.get("settings")
    return dict(settings) if isinstance(settings, dict) else {}


async def load_modules(collection, project_id: str) -> dict:
    doc = await collection.find_one({"project_id": project_id})
    return public_modules(doc, project_id)


def fresh_widget_key() -> str:
    return secrets.token_urlsafe(24)


def normalize_chat_settings(previous: dict, rotate: bool) -> dict:
    key = previous.get("widget_key") if isinstance(previous, dict) else None
    if rotate or not isinstance(key, str) or len(key) < 16:
        key = fresh_widget_key()
    return {"widget_key": key}


async def save_module(collection, project: dict, name: str, enabled: bool, settings: dict) -> dict:
    if name not in MODULES:
        raise AgentModuleError("not_found", 404)
    current = await load_modules(collection, project["project_id"])
    current["modules"][name] = {"enabled": bool(enabled), "settings": settings}
    stored = {
        "project_id": project["project_id"],
        "user_id": project["user_id"],
        "modules": current["modules"],
        "updated_at": datetime.now(timezone.utc),
    }
    await collection.update_one({"project_id": project["project_id"]}, {"$set": stored}, upsert=True)
    return public_modules(stored, project["project_id"])


async def owned_project(projects, user, project_id: str) -> dict:
    if not isinstance(project_id, str) or not project_id.strip():
        raise AgentModuleError("not_found", 404)
    project = await projects.find_one(
        {"project_id": project_id, "user_id": user["user_id"]},
        {"_id": 0},
    )
    if not project:
        raise AgentModuleError("not_found", 404)
    return project


async def public_project(projects, project_id: str) -> dict:
    if not isinstance(project_id, str) or not project_id.strip():
        raise AgentModuleError("not_found", 404)
    project = await projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise AgentModuleError("not_found", 404)
    return project


async def ensure_agent_indexes(database) -> None:
    """TTL and uniqueness. Safe to call more than once per process."""
    global _indexes_ready
    if _indexes_ready:
        return
    await database.agent_project_modules.create_index("project_id", unique=True, name="project_id")
    await database.agent_conversations.create_index(
        "conversation_id", unique=True, name="conversation_id",
    )
    await database.agent_conversations.create_index(
        "expires_at", expireAfterSeconds=0, name="conversation_ttl",
    )
    await database.agent_usage.create_index(
        [("project_id", 1), ("day", 1)], unique=True, name="usage_day",
    )
    await database.agent_rate_windows.create_index("key", unique=True, name="rate_key")
    await database.agent_bookings.create_index("booking_id", unique=True, name="booking_id")
    await database.agent_bookings.create_index(
        [("project_id", 1), ("slot_start", 1)],
        unique=True,
        partialFilterExpression={"status": "confirmed"},
        name="confirmed_slot",
    )
    await database.agent_inbound_events.create_index(
        [("provider", 1), ("event_id", 1)],
        unique=True,
        name="inbound_event",
    )
    _indexes_ready = True
