"""Entry checks for the client agent modules.

Validation here is pure: it does not read or write Mongo and it does not call
a provider. Routers run it before any side effect. Limits below are the
defaults; the rate-limit env vars override the numeric ones when set.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from backend.app.services.agent_modules import AgentModuleError, log_failure

# Field limits. A valid client payload fits; anything larger is rejected.
CHAT_MESSAGE_MAX = 2000
CONVERSATION_ID_MAX = 64
NAME_MAX = 80
CONTACT_MAX = 120
NOTE_MAX = 240
GREETING_MAX = 240
SPEECH_MAX = 2000
WHATSAPP_TEXT_MAX = 2000
TIMEZONE_MAX = 64
SLOT_MAX = 40
ID_MAX = 64
IDEMPOTENCY_MAX = 80
REPLY_MAX = 1200

# Whole-body caps, bytes. Sized for the field limits above in UTF-8.
CHAT_BODY_MAX = 24 * 1024
BOOKING_BODY_MAX = 8 * 1024
MODULE_BODY_MAX = 16 * 1024
VOICE_BODY_MAX = 32 * 1024
WHATSAPP_BODY_MAX = 64 * 1024
REMINDER_BODY_MAX = 1024

# Per-caller window already used by chat. Per-account is the project ceiling.
CALLER_RATE_LIMIT = 20
CALLER_RATE_WINDOW_SECONDS = 60
ACCOUNT_RATE_LIMIT = 60
ACCOUNT_RATE_WINDOW_SECONDS = 60

PROVIDER_TIMEOUT_SECONDS = 30
WHATSAPP_TIMEOUT_SECONDS = 15
BOOKING_HORIZON_DAYS = 366

_ID = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
_IDEMPOTENCY = re.compile(r"^[A-Za-z0-9_-]{8,80}$")
_E164 = re.compile(r"^\+[1-9]\d{7,14}$")
_E164_DIGITS = re.compile(r"^[1-9]\d{7,14}$")
_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_TZ_NAME = re.compile(r"^[A-Za-z][A-Za-z0-9_+-]{0,40}(?:/[A-Za-z0-9_+-]{1,40}){0,3}$")
_SLOT = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2})$"
)
_WAMID = re.compile(r"^[A-Za-z0-9._-]{1,128}$")
_CLIENT_SCHEMA = "La solicitud no es válida."


def _schema(status: int = 400) -> AgentModuleError:
    return AgentModuleError("schema", status, _CLIENT_SCHEMA)


_FORBIDDEN = re.compile(
    r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]"
)
_HTML = re.compile(
    r"(?i)("
    r"<\s*/?\s*script\b"
    r"|<\s*/?\s*[a-z][a-z0-9]*\b[^>]*>"
    r"|<\s*!--"
    r"|<\s*!doctype\b"
    r"|javascript\s*:"
    r"|data\s*:\s*text/html"
    r"|\bon[a-z]{3,}\s*="
    r"|&lt;\s*/?\s*script"
    r"|&#x?0*3c;?\s*/?\s*script"
    r")"
)


def positive_int(name: str, default: int, *, ceiling: int | None = None) -> int:
    raw = (os.environ.get(name) or "").strip()
    if not raw:
        value = default
    else:
        try:
            value = int(raw)
        except ValueError:
            value = default
        if value <= 0:
            value = default
    if ceiling is not None and value > ceiling:
        value = ceiling
    return value


def timeout_seconds(name: str, default: int) -> float:
    return float(positive_int(name, default, ceiling=60))


def require_id(value: str, module: str) -> str:
    if not isinstance(value, str) or not _ID.fullmatch(value):
        log_failure("not_found", module)
        raise AgentModuleError("not_found", 404)
    return value


def optional_idempotency_key(header: str | None) -> str | None:
    if header is None or header.strip() == "":
        return None
    text = header.strip()
    if not _IDEMPOTENCY.fullmatch(text):
        log_failure("invalid_input", "citas")
        raise AgentModuleError("invalid_input", 422)
    return text


def reject_unknown(data: dict, allowed: set[str], module: str) -> None:
    unknown = [key for key in data if key not in allowed]
    if unknown:
        log_failure("unexpected_field", module)
        raise AgentModuleError("unexpected_field", 422)


def require_plain_text(value, *, max_len: int, module: str, allow_empty: bool = False) -> str:
    if not isinstance(value, str):
        log_failure("schema", module)
        raise _schema(422)
    if len(value) > max_len:
        log_failure("too_long", module)
        raise AgentModuleError("too_long", 422)
    if _FORBIDDEN.search(value) or _HTML.search(value):
        log_failure("invalid_input", module)
        raise AgentModuleError("invalid_input", 422)
    cleaned = " ".join(value.split())
    if _HTML.search(cleaned):
        log_failure("invalid_input", module)
        raise AgentModuleError("invalid_input", 422)
    if not cleaned:
        if allow_empty:
            return ""
        log_failure("empty_message", module)
        raise AgentModuleError("empty_message", 422)
    return cleaned


def optional_plain_text(value, *, max_len: int, module: str) -> str:
    if value is None or value == "":
        if value is not None and not isinstance(value, str):
            log_failure("schema", module)
            raise _schema(422)
        return ""
    return require_plain_text(value, max_len=max_len, module=module, allow_empty=True)


def normalize_e164(value, *, module: str) -> str:
    if not isinstance(value, str):
        log_failure("invalid_phone", module)
        raise AgentModuleError("invalid_phone", 422)
    if _FORBIDDEN.search(value) or _HTML.search(value):
        log_failure("invalid_input", module)
        raise AgentModuleError("invalid_input", 422)
    compact = re.sub(r"[\s().-]", "", value.strip())
    if _E164.fullmatch(compact):
        return compact
    log_failure("invalid_phone", module)
    raise AgentModuleError("invalid_phone", 422)


def e164_digits(value, *, module: str) -> str:
    """WhatsApp sends the E.164 number without the leading plus."""
    if not isinstance(value, str) or not _E164_DIGITS.fullmatch(value):
        log_failure("invalid_phone", module)
        raise AgentModuleError("invalid_phone", 422)
    return value


def clean_email_or_phone(value, *, module: str = "citas") -> str:
    if not isinstance(value, str):
        log_failure("invalid_contact", module)
        raise AgentModuleError("invalid_contact", 422)
    if len(value) > CONTACT_MAX:
        log_failure("too_long", module)
        raise AgentModuleError("too_long", 422)
    if _FORBIDDEN.search(value) or _HTML.search(value):
        log_failure("invalid_input", module)
        raise AgentModuleError("invalid_input", 422)
    text = value.strip()
    if _EMAIL.fullmatch(text):
        return text.lower()
    compact = re.sub(r"[\s().-]", "", text)
    if _E164.fullmatch(compact):
        return compact
    digits = re.sub(r"\D", "", text)
    if digits or text.startswith("+"):
        log_failure("invalid_phone", module)
        raise AgentModuleError("invalid_phone", 422)
    log_failure("invalid_contact", module)
    raise AgentModuleError("invalid_contact", 422)


def require_timezone(name, *, module: str = "citas") -> str:
    if not isinstance(name, str):
        log_failure("invalid_timezone", module)
        raise AgentModuleError("invalid_timezone", 422)
    text = name.strip()
    if (
        not text
        or len(text) > TIMEZONE_MAX
        or not _TZ_NAME.fullmatch(text)
        or _FORBIDDEN.search(text)
        or ".." in text
    ):
        log_failure("invalid_timezone", module)
        raise AgentModuleError("invalid_timezone", 422)
    try:
        ZoneInfo(text)
    except ZoneInfoNotFoundError:
        log_failure("invalid_timezone", module)
        raise AgentModuleError("invalid_timezone", 422) from None
    return text


def parse_slot_text(value, *, now: datetime, horizon_days: int = BOOKING_HORIZON_DAYS) -> datetime:
    if not isinstance(value, str) or len(value) > SLOT_MAX or not _SLOT.fullmatch(value.strip()):
        log_failure("invalid_slot", "citas")
        raise AgentModuleError("invalid_slot", 422)
    text = value.strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        log_failure("invalid_slot", "citas")
        raise AgentModuleError("invalid_slot", 422) from None
    if parsed.tzinfo is None:
        log_failure("invalid_slot", "citas")
        raise AgentModuleError("invalid_slot", 422)
    start = parsed.astimezone(timezone.utc).replace(microsecond=0)
    moment = now.astimezone(timezone.utc)
    if start <= moment or start > moment + timedelta(days=horizon_days):
        log_failure("invalid_slot", "citas")
        raise AgentModuleError("invalid_slot", 422)
    return start


def guard_json_shape(value, *, module: str, max_depth: int = 8, max_items: int = 40) -> None:
    nodes = 0

    def walk(node, depth: int) -> None:
        nonlocal nodes
        nodes += 1
        if nodes > max_items or depth > max_depth:
            log_failure("payload_too_large", module)
            raise AgentModuleError("payload_too_large", 413)
        if isinstance(node, dict):
            if len(node) > max_items:
                log_failure("payload_too_large", module)
                raise AgentModuleError("payload_too_large", 413)
            for key, child in node.items():
                if not isinstance(key, str) or len(key) > 64 or _FORBIDDEN.search(key):
                    log_failure("unexpected_field", module)
                    raise AgentModuleError("unexpected_field", 422)
                walk(child, depth + 1)
        elif isinstance(node, list):
            if len(node) > max_items:
                log_failure("payload_too_large", module)
                raise AgentModuleError("payload_too_large", 413)
            for child in node:
                walk(child, depth + 1)
        elif isinstance(node, str):
            if len(node) > 8000:
                log_failure("too_long", module)
                raise AgentModuleError("too_long", 422)
        elif isinstance(node, bool) or node is None or isinstance(node, (int, float)):
            return
        else:
            log_failure("schema", module)
            raise _schema(400)

    walk(value, 0)


def parse_json_object(body: bytes, module: str, *, max_depth: int = 8, max_items: int = 40) -> dict:
    if not body or not body.strip():
        log_failure("schema", module)
        raise _schema(400)
    try:
        data = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        log_failure("schema", module)
        raise _schema(400) from None
    if not isinstance(data, dict):
        log_failure("schema", module)
        raise _schema(400)
    guard_json_shape(data, module=module, max_depth=max_depth, max_items=max_items)
    return data


async def read_limited(request, limit: int, module: str) -> bytes:
    declared = request.headers.get("content-length")
    if declared is not None and declared != "":
        try:
            size = int(declared)
        except ValueError:
            log_failure("schema", module)
            raise _schema(400) from None
        if size < 0 or size > limit:
            if size > limit:
                log_failure("payload_too_large", module)
                raise AgentModuleError("payload_too_large", 413)
            log_failure("schema", module)
            raise _schema(400)
    body = await request.body()
    if len(body) > limit:
        log_failure("payload_too_large", module)
        raise AgentModuleError("payload_too_large", 413)
    return body


def _status_of(exc: BaseException) -> int | None:
    status = getattr(exc, "status_code", None)
    if isinstance(status, int):
        return status
    response = getattr(exc, "response", None)
    status = getattr(response, "status_code", None)
    if isinstance(status, int):
        return status
    return None


def classify_provider(exc: BaseException, module: str) -> AgentModuleError:
    """Map an upstream failure to 504, 502, or 503. Never include the cause text."""
    if isinstance(exc, AgentModuleError):
        return exc
    name = type(exc).__name__.lower()
    status = _status_of(exc)
    if isinstance(exc, TimeoutError) or "timeout" in name or status in {408, 504}:
        log_failure("provider_timeout", module)
        return AgentModuleError("provider_timeout", 504)
    if "connect" in name or "network" in name or isinstance(exc, ConnectionError) or status in {500, 502}:
        log_failure("bad_gateway", module)
        return AgentModuleError("bad_gateway", 502)
    if status is not None and 400 <= status < 500 and status != 429:
        log_failure("bad_gateway", module)
        return AgentModuleError("bad_gateway", 502)
    log_failure("provider", module)
    return AgentModuleError("provider", 503)


def classify_store(exc: BaseException, module: str) -> AgentModuleError | None:
    """Mongo outages become 504 or 503. Other exceptions stay unmapped."""
    if isinstance(exc, AgentModuleError):
        return exc
    module_name = type(exc).__module__
    if not (module_name.startswith("pymongo") or module_name.startswith("motor")):
        return None
    if "timeout" in type(exc).__name__.lower():
        log_failure("store_timeout", module)
        return AgentModuleError("store_timeout", 504)
    log_failure("store", module)
    return AgentModuleError("store", 503)


def wamid_ok(value: str) -> bool:
    return isinstance(value, str) and bool(_WAMID.fullmatch(value))
