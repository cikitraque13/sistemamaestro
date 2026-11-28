"""Per-project agent modules and the global kill switches.

Modules: chat, voz, whatsapp, citas. A new project keeps them off. Publishing a
landing turns chat and citas on unless the owner has opted out. voz and
whatsapp stay off until the project already has credentials. Every module
stays off globally until its env flag is set. Admins use the role check that
already exists for the builder; this module does not define a new admin rule.
Public webhooks have no user, so they stay hidden until the flag is on.

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
    "usage_limit": "Has alcanzado el límite de uso de hoy",
    "usage_limit_month": "Has alcanzado el límite de uso de este mes",
    "usage_limit_request": "No se ha podido completar la solicitud.",
    "input_too_long": "La solicitud es demasiado larga.",
    "voice_limit": "La sesión de voz ha alcanzado su límite.",
    "provider": "No he podido responder ahora mismo.",
    "config": "El módulo no está configurado.",
    "signature": "La firma no es válida.",
    "slot_taken": "Ese horario ya está ocupado.",
    "outside_hours": "Ese horario está fuera de la disponibilidad.",
    "invalid_slot": "El horario no es válido.",
    "invalid_contact": "Hace falta un teléfono o un correo.",
    "invalid_settings": "La configuración del módulo no es válida.",
    "store": "No se ha podido guardar.",
    "store_timeout": "El almacenamiento no ha respondido a tiempo.",
    "schema": "No he podido responder ahora mismo.",
    "empty_message": "El mensaje está vacío.",
    "invalid_input": "El mensaje contiene caracteres o contenido no permitido.",
    "invalid_phone": "El teléfono tiene que estar en formato internacional, por ejemplo +34600111222.",
    "invalid_timezone": "La zona horaria no es válida.",
    "too_long": "El texto supera el límite permitido.",
    "unexpected_field": "La solicitud contiene campos que no están permitidos.",
    "payload_too_large": "La solicitud es demasiado grande.",
    "provider_timeout": "El proveedor no ha respondido a tiempo.",
    "bad_gateway": "El proveedor no ha respondido.",
    "idempotency_conflict": "La petición repetida no coincide con la original.",
    "internal": "No se ha podido completar la operación.",
}

_indexes_ready = False


class AgentModuleError(Exception):
    def __init__(self, code: str, status: int = 400, message: str = "", *, retry_after: int | None = None):
        super().__init__(code)
        self.code = code
        self.status = status
        self.message = message or MESSAGES.get(code, "No se ha podido completar la operación.")
        self.retry_after = retry_after


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


def normalize_chat_settings(previous: dict, rotate: bool, incoming: dict | None = None) -> dict:
    if isinstance(incoming, dict) and incoming:
        from backend.app.services.agent_guard import reject_unknown

        reject_unknown(incoming, {"widget_key"}, "chat")
    key = previous.get("widget_key") if isinstance(previous, dict) else None
    if rotate or not isinstance(key, str) or len(key) < 16:
        key = fresh_widget_key()
    return {"widget_key": key}


def _stored_modules(doc, view: dict, name: str, enabled: bool) -> dict:
    """Keep an owner opt-out on the document. The public view does not show it."""
    raw = doc.get("modules") if isinstance(doc, dict) and isinstance(doc.get("modules"), dict) else {}
    modules = {}
    for module_name in MODULES:
        item = view["modules"][module_name]
        settings = item.get("settings") if isinstance(item.get("settings"), dict) else {}
        entry = {"enabled": bool(item.get("enabled")), "settings": settings}
        if module_name == name:
            entry["opted_out"] = not bool(enabled)
        else:
            previous = raw.get(module_name) if isinstance(raw.get(module_name), dict) else None
            if isinstance(previous, dict) and "opted_out" in previous:
                entry["opted_out"] = bool(previous.get("opted_out"))
        modules[module_name] = entry
    return modules


async def save_module(collection, project: dict, name: str, enabled: bool, settings: dict) -> dict:
    if name not in MODULES:
        raise AgentModuleError("not_found", 404)
    doc = await collection.find_one({"project_id": project["project_id"]})
    current = public_modules(doc, project["project_id"])
    current["modules"][name] = {"enabled": bool(enabled), "settings": settings}
    stored = {
        "project_id": project["project_id"],
        "user_id": project["user_id"],
        "modules": _stored_modules(doc, current, name, enabled),
        "updated_at": datetime.now(timezone.utc),
    }
    await collection.update_one({"project_id": project["project_id"]}, {"$set": stored}, upsert=True)
    return public_modules(stored, project["project_id"])


def _copy_entry(item) -> dict:
    if not isinstance(item, dict):
        item = {}
    settings = item.get("settings") if isinstance(item.get("settings"), dict) else {}
    entry = {"enabled": bool(item.get("enabled")), "settings": dict(settings)}
    if "opted_out" in item:
        entry["opted_out"] = bool(item.get("opted_out"))
    return entry


def channel_credentials(name: str, settings: dict) -> dict | None:
    """Normalized voz or WhatsApp settings, or None when credentials are missing.

    A missing number is not a connected channel. Callers leave the module off
    so the webhook cannot report a successful send.
    """
    if not isinstance(settings, dict) or not settings:
        return None
    if name == "voz":
        from backend.app.services.telephony import normalize_voz_settings

        normalizer = normalize_voz_settings
    elif name == "whatsapp":
        from backend.app.services.whatsapp import normalize_whatsapp_settings

        normalizer = normalize_whatsapp_settings
    else:
        return None
    try:
        return normalizer(settings)
    except AgentModuleError:
        return None


def _auto_settings(name: str, previous: dict) -> dict | None:
    if name == "chat":
        return normalize_chat_settings(previous, False)
    if name == "citas":
        from backend.app.services.bookings import normalize_citas_settings

        try:
            return normalize_citas_settings(previous or {})
        except AgentModuleError:
            return None
    if name in {"voz", "whatsapp"}:
        return channel_credentials(name, previous)
    return None


async def activate_published_attendant(collection, project: dict) -> None:
    """Turn the attendant on after a publish. Failures are logged and swallowed.

    chat and citas turn on unless the stored module has opted_out. An already
    enabled module keeps its settings, so a second publish does not rotate the
    widget key or the weekly hours. voz and whatsapp turn on only when the
    stored settings already contain credentials the normalizers accept.
    """
    if collection is None or not isinstance(project, dict):
        return
    project_id = project.get("project_id")
    user_id = project.get("user_id")
    if not isinstance(project_id, str) or not project_id or not isinstance(user_id, str):
        return
    try:
        doc = await collection.find_one({"project_id": project_id})
        raw = {}
        if isinstance(doc, dict) and isinstance(doc.get("modules"), dict):
            raw = doc["modules"]
        modules = {}
        changed = False
        for name in MODULES:
            item = raw.get(name) if isinstance(raw.get(name), dict) else {}
            entry = _copy_entry(item)
            if entry.get("opted_out") is True or entry["enabled"]:
                modules[name] = entry
                continue
            prepared = _auto_settings(name, entry["settings"])
            if prepared is None:
                modules[name] = entry
                continue
            modules[name] = {"enabled": True, "settings": prepared, "opted_out": False}
            changed = True
        if not changed:
            return
        stored = {
            "project_id": project_id,
            "user_id": user_id,
            "modules": modules,
            "updated_at": datetime.now(timezone.utc),
        }
        await collection.update_one({"project_id": project_id}, {"$set": stored}, upsert=True)
    except Exception as exc:
        logger.warning("publish_attendant_activation_failed category=%s", type(exc).__name__)


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
    await database.agent_bookings.create_index(
        [("project_id", 1), ("idempotency_key", 1)],
        unique=True,
        partialFilterExpression={"idempotency_key": {"$exists": True}},
        name="booking_idempotency",
    )
    await database.agent_inbound_events.create_index(
        [("provider", 1), ("event_id", 1)],
        unique=True,
        name="inbound_event",
    )
    _indexes_ready = True
