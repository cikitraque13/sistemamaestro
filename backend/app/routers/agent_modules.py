"""HTTP API for the client agent modules.

Dashboard UI is not part of this change. The owner API below is what that
screen will call:

- GET  /api/projects/{project_id}/modules
- PUT  /api/projects/{project_id}/modules/{chat|voz|whatsapp|citas}
  body: {enabled, settings, rotate_widget_key}
- GET/POST /api/projects/{project_id}/bookings and cancel/delete
- DELETE /api/projects/{project_id}/agent-data  (erasure)

Chat, voice, and WhatsApp runtime stay hidden until the global flag is on.
An admin bypasses that flag. The per-project switch still has to be on.
"""

from __future__ import annotations

import hashlib
import hmac
import os
import re
from datetime import date, datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse, Response
from fastapi.routing import APIRoute

from backend.app.core.security import get_current_user
from backend.app.db.mongodb import db
from backend.app.services import agent_chat, bookings, telephony, whatsapp
from backend.app.services.agent_guard import (
    BOOKING_BODY_MAX,
    CHAT_BODY_MAX,
    CHAT_MESSAGE_MAX,
    MODULE_BODY_MAX,
    REMINDER_BODY_MAX,
    VOICE_BODY_MAX,
    WHATSAPP_BODY_MAX,
    classify_provider,
    classify_store,
    optional_idempotency_key,
    parse_json_object,
    read_limited,
    reject_unknown,
    require_id,
    require_plain_text,
)
from backend.app.services.agent_modules import (
    MODULES,
    AgentModuleError,
    ensure_agent_indexes,
    load_modules,
    log_failure,
    module_enabled,
    module_settings,
    normalize_chat_settings,
    owned_project,
    public_modules,
    public_project,
    runtime_block,
    save_module,
)

_CLIENT_SCHEMA = "La solicitud no es válida."
_DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _module_for_path(path: str) -> str:
    if "/telephony/" in path:
        return "voz"
    if "/whatsapp/" in path:
        return "whatsapp"
    if "/bookings" in path:
        return "citas"
    if "/chat/" in path or "/agent-conversations/" in path or path.endswith("/agent-data"):
        return "chat"
    return "modules"


def _http(exc: AgentModuleError) -> HTTPException:
    headers = None
    if exc.status == 429 and exc.retry_after:
        headers = {"Retry-After": str(int(exc.retry_after))}
    return HTTPException(
        status_code=exc.status,
        detail={"code": exc.code, "message": exc.message},
        headers=headers,
    )


class GuardedRoute(APIRoute):
    """Turn module failures into JSON. Mongo and provider faults get 504, 502, or 503."""

    def get_route_handler(self):
        original = super().get_route_handler()

        async def guarded(request: Request):
            try:
                return await original(request)
            except AgentModuleError as exc:
                raise _http(exc) from None
            except HTTPException:
                raise
            except Exception as exc:
                module = _module_for_path(request.url.path)
                mapped = classify_store(exc, module)
                origin = type(exc).__module__
                if mapped is None and (
                    origin.startswith(("httpx", "httpcore", "anthropic"))
                    or isinstance(exc, (TimeoutError, ConnectionError))
                ):
                    mapped = classify_provider(exc, module)
                if mapped is None:
                    log_failure("internal", module)
                    raise HTTPException(
                        status_code=500,
                        detail={
                            "code": "internal",
                            "message": "No se ha podido completar la operación.",
                        },
                    ) from None
                raise _http(mapped) from None

        return guarded


router = APIRouter(prefix="/api", tags=["agent-modules"], route_class=GuardedRoute)


def _schema(status: int = 400) -> AgentModuleError:
    return AgentModuleError("schema", status, _CLIENT_SCHEMA)


async def prepare() -> None:
    try:
        await ensure_agent_indexes(db)
    except AgentModuleError:
        raise
    except Exception as exc:
        mapped = classify_store(exc, "modules")
        if mapped is not None:
            raise mapped from None
        log_failure("store", "modules")
        raise AgentModuleError("store", 503) from None


async def maybe_user(request: Request):
    try:
        return await get_current_user(request)
    except HTTPException as exc:
        if exc.status_code == 401:
            return None
        raise


def require_runtime(name: str, user) -> None:
    blocked = runtime_block(name, user)
    if blocked is None:
        return
    log_failure("module_off", name)
    raise blocked


def require_project_module(view: dict, name: str) -> None:
    if module_enabled(view, name):
        return
    log_failure("module_off", name)
    raise AgentModuleError("not_found", 404)


def client_host(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    host = forwarded.split(",")[0].strip() if forwarded else ""
    if not host and request.client is not None:
        host = request.client.host or ""
    return (host or "unknown")[:80]


def widget_key_ok(settings: dict, presented: str) -> bool:
    expected = settings.get("widget_key") if isinstance(settings, dict) else ""
    if not isinstance(expected, str) or not expected or not presented:
        return False
    return hmac.compare_digest(expected.encode("utf-8"), presented.encode("utf-8"))


def resolve_settings(name: str, previous: dict, incoming: dict, rotate: bool, enabled: bool) -> dict:
    if name == "chat":
        return normalize_chat_settings(previous, rotate, incoming)
    source = incoming if incoming else previous
    if name == "voz":
        if enabled or incoming:
            return telephony.normalize_voz_settings(source)
        return dict(previous)
    if name == "whatsapp":
        if enabled or incoming:
            return whatsapp.normalize_whatsapp_settings(source)
        return dict(previous)
    if name == "citas":
        return bookings.normalize_citas_settings(source or {})
    raise AgentModuleError("not_found", 404)


async def owner_and_project(request: Request, project_id: str):
    user = await get_current_user(request)
    try:
        project = await owned_project(db.projects, user, project_id)
    except AgentModuleError as exc:
        raise _http(exc) from None
    return user, project


def citas_ready(view: dict, user):
    if not module_enabled(view, "citas"):
        return False, None
    if runtime_block("citas", user) is not None:
        return False, None
    try:
        return True, bookings.normalize_citas_settings(module_settings(view, "citas"))
    except AgentModuleError:
        log_failure("config", "citas")
        return False, None


def _module_body(data: dict, module_name: str) -> tuple[bool, dict, bool]:
    reject_unknown(data, {"enabled", "settings", "rotate_widget_key"}, module_name)
    if not isinstance(data.get("enabled"), bool):
        raise _schema(422)
    settings = data.get("settings", {})
    if settings is None:
        settings = {}
    if not isinstance(settings, dict):
        raise _schema(422)
    rotate = data.get("rotate_widget_key", False)
    if not isinstance(rotate, bool):
        raise _schema(422)
    return data["enabled"], settings, rotate


@router.get("/projects/{project_id}/modules")
async def get_modules(project_id: str, request: Request):
    require_id(project_id, "modules")
    await prepare()
    _user, project = await owner_and_project(request, project_id)
    return await load_modules(db.agent_project_modules, project["project_id"])


@router.put("/projects/{project_id}/modules/{module_name}")
async def put_module(project_id: str, module_name: str, request: Request):
    require_id(project_id, "modules")
    if module_name not in MODULES:
        raise AgentModuleError("not_found", 404)
    raw = await read_limited(request, MODULE_BODY_MAX, module_name)
    data = parse_json_object(raw, module_name, max_depth=6, max_items=40)
    enabled, incoming, rotate = _module_body(data, module_name)
    if module_name == "chat":
        reject_unknown(incoming, {"widget_key"}, "chat")
    elif module_name == "voz" and (enabled or incoming):
        telephony.normalize_voz_settings(incoming)
    elif module_name == "whatsapp" and (enabled or incoming):
        whatsapp.normalize_whatsapp_settings(incoming)
    elif module_name == "citas":
        bookings.normalize_citas_settings(incoming or {})
    await prepare()
    _user, project = await owner_and_project(request, project_id)
    current = await load_modules(db.agent_project_modules, project["project_id"])
    previous = module_settings(current, module_name)
    settings = resolve_settings(module_name, previous, incoming, rotate, enabled)
    return await save_module(
        db.agent_project_modules, project, module_name, enabled, settings,
    )


@router.post("/agent/chat/{project_id}/messages")
async def post_chat(project_id: str, request: Request):
    require_id(project_id, "chat")
    user = await maybe_user(request)
    require_runtime("chat", user)
    raw = await read_limited(request, CHAT_BODY_MAX, "chat")
    data = parse_json_object(raw, "chat", max_depth=3, max_items=8)
    reject_unknown(data, {"message", "conversation_id"}, "chat")
    if "message" not in data:
        raise _schema(422)
    message = require_plain_text(data["message"], max_len=CHAT_MESSAGE_MAX, module="chat")
    conversation_id = data.get("conversation_id")
    if conversation_id is not None and not isinstance(conversation_id, str):
        raise _schema(422)
    if isinstance(conversation_id, str) and not _conversation_id_ok(conversation_id):
        raise AgentModuleError("not_found", 404)
    await prepare()
    project = await public_project(db.projects, project_id)
    view = await load_modules(db.agent_project_modules, project["project_id"])
    require_project_module(view, "chat")
    settings = module_settings(view, "chat")
    if not widget_key_ok(settings, request.headers.get("x-widget-key", "")):
        log_failure("forbidden", "chat")
        raise AgentModuleError("forbidden", 403)
    bookings_on, citas_settings = citas_ready(view, user)
    return await agent_chat.handle_turn(
        db,
        project=project,
        channel="chat",
        text=message,
        conversation_id=conversation_id,
        caller=client_host(request),
        bookings_on=bookings_on,
        citas_settings=citas_settings,
        create_if_missing=False,
    )


@router.delete("/agent/chat/{project_id}/conversations/{conversation_id}")
async def delete_chat_conversation(project_id: str, conversation_id: str, request: Request):
    require_id(project_id, "chat")
    require_id(conversation_id, "chat")
    await prepare()
    user = await maybe_user(request)
    require_runtime("chat", user)
    project = await public_project(db.projects, project_id)
    view = await load_modules(db.agent_project_modules, project["project_id"])
    require_project_module(view, "chat")
    if not widget_key_ok(module_settings(view, "chat"), request.headers.get("x-widget-key", "")):
        log_failure("forbidden", "chat")
        raise AgentModuleError("forbidden", 403)
    await agent_chat.delete_conversation(
        db.agent_conversations,
        project_id=project["project_id"],
        conversation_id=conversation_id,
    )
    return Response(status_code=204)


@router.post("/agent/telephony/voice")
async def inbound_call(request: Request):
    require_runtime("voz", None)
    adapter = telephony.build_adapter()
    body = await read_limited(request, VOICE_BODY_MAX, "voz")
    if not adapter.signature_ok(body, request.headers):
        log_failure("signature", "voz")
        raise AgentModuleError("signature", 403)
    inbound = adapter.parse(body)
    if inbound is None:
        log_failure("schema", "voz")
        raise AgentModuleError("schema", 400, _CLIENT_SCHEMA)
    await prepare()
    stored = await db.agent_project_modules.find_one({
        "modules.voz.enabled": True,
        "modules.voz.settings.inbound_number": inbound.to_number,
    })
    if not stored:
        log_failure("not_found", "voz")
        raise AgentModuleError("not_found", 404)
    view = public_modules(stored, stored["project_id"])
    project = await public_project(db.projects, stored["project_id"])
    conversation_id = agent_chat.stable_conversation_id("vo_", project["project_id"], inbound.call_id)
    moment = datetime.now(timezone.utc)
    event_id = inbound.call_id + (
        ":greeting" if not inbound.speech else ":" + hashlib.sha256(inbound.speech.encode("utf-8")).hexdigest()[:16]
    )
    headers = telephony.response_headers(adapter)
    await agent_chat.consume_rate(
        db.agent_rate_windows,
        project_id=project["project_id"],
        channel="voice",
        caller=inbound.call_id,
        now=moment,
    )
    claimed = await agent_chat.claim_event(
        db.agent_inbound_events,
        provider="voice",
        event_id=event_id,
        project_id=project["project_id"],
        now=moment,
    )
    if not claimed:
        previous = await agent_chat.last_reply(
            db.agent_conversations,
            project_id=project["project_id"],
            conversation_id=conversation_id,
        )
        say = previous or agent_chat.voice_greeting(project, module_settings(view, "voz"))
        media, payload = adapter.render(say)
        return Response(content=payload, media_type=media, headers=headers)
    if not inbound.speech:
        media, payload = adapter.render(agent_chat.voice_greeting(project, module_settings(view, "voz")))
        return Response(content=payload, media_type=media, headers=headers)
    bookings_on, citas_settings = citas_ready(view, None)
    try:
        result = await agent_chat.handle_turn(
            db,
            project=project,
            channel="voice",
            text=inbound.speech,
            conversation_id=conversation_id,
            caller=inbound.call_id,
            bookings_on=bookings_on,
            citas_settings=citas_settings,
            create_if_missing=True,
            enforce_rate=False,
        )
    except Exception:
        await agent_chat.release_event(db.agent_inbound_events, provider="voice", event_id=event_id)
        raise
    media, payload = adapter.render(result["reply"])
    return Response(content=payload, media_type=media, headers=headers)


@router.get("/agent/whatsapp/webhook")
async def whatsapp_verify(request: Request):
    require_runtime("whatsapp", None)
    mode = request.query_params.get("hub.mode", "")
    token = request.query_params.get("hub.verify_token", "")
    challenge = request.query_params.get("hub.challenge", "")
    body = whatsapp.handshake(mode, token, challenge)
    return PlainTextResponse(body, headers={"X-WhatsApp-Integration": "proposal"})


@router.post("/agent/whatsapp/webhook")
async def whatsapp_inbound(request: Request):
    require_runtime("whatsapp", None)
    body = await read_limited(request, WHATSAPP_BODY_MAX, "whatsapp")
    if not whatsapp.app_secret():
        log_failure("config", "whatsapp")
        raise AgentModuleError("config", 503)
    if not whatsapp.signature_ok(body, request.headers.get("x-hub-signature-256", "")):
        log_failure("signature", "whatsapp")
        raise AgentModuleError("signature", 403)
    payload = whatsapp.parse_payload(body)
    incoming = whatsapp.extract_text_messages(payload)
    headers = {"X-WhatsApp-Integration": "proposal"}
    if not incoming:
        return JSONResponse({"ok": True}, headers=headers)
    await prepare()
    for item in incoming:
        stored = await db.agent_project_modules.find_one({
            "modules.whatsapp.enabled": True,
            "modules.whatsapp.settings.phone_number_id": item["phone_number_id"],
        })
        if not stored:
            log_failure("not_found", "whatsapp")
            continue
        try:
            project = await public_project(db.projects, stored["project_id"])
        except AgentModuleError:
            log_failure("not_found", "whatsapp")
            continue
        moment = datetime.now(timezone.utc)
        await agent_chat.consume_rate(
            db.agent_rate_windows,
            project_id=project["project_id"],
            channel="whatsapp",
            caller=item["wa_id"],
            now=moment,
        )
        claimed = await agent_chat.claim_event(
            db.agent_inbound_events,
            provider="whatsapp",
            event_id=item["message_id"],
            project_id=project["project_id"],
            now=moment,
        )
        if not claimed:
            continue
        view = public_modules(stored, project["project_id"])
        bookings_on, citas_settings = citas_ready(view, None)
        digits = "".join(ch for ch in item["wa_id"] if ch.isdigit())
        try:
            result = await agent_chat.handle_turn(
                db,
                project=project,
                channel="whatsapp",
                text=item["text"],
                conversation_id=agent_chat.stable_conversation_id(
                    "wa_", project["project_id"], item["wa_id"],
                ),
                caller=item["wa_id"],
                bookings_on=bookings_on,
                citas_settings=citas_settings,
                create_if_missing=True,
                enforce_rate=False,
            )
            await whatsapp.send_text(
                phone_number_id=item["phone_number_id"],
                to=digits,
                body=result["reply"],
            )
        except Exception:
            await agent_chat.release_event(
                db.agent_inbound_events, provider="whatsapp", event_id=item["message_id"],
            )
            raise
    return JSONResponse({"ok": True}, headers=headers)


async def _citas_owner(project_id: str, request: Request):
    await prepare()
    user, project = await owner_and_project(request, project_id)
    require_runtime("citas", user)
    view = await load_modules(db.agent_project_modules, project["project_id"])
    require_project_module(view, "citas")
    settings = bookings.normalize_citas_settings(module_settings(view, "citas"))
    return project, settings


def _booking_fields(data: dict) -> dict:
    reject_unknown(data, {"slot_start", "customer_name", "contact", "note"}, "citas")
    for key in ("slot_start", "customer_name", "contact"):
        if key not in data:
            raise _schema(422)
    note = data.get("note", "")
    if note is None:
        note = ""
    if not all(isinstance(data[key], str) for key in ("slot_start", "customer_name", "contact")):
        raise _schema(422)
    if not isinstance(note, str):
        raise _schema(422)
    return {
        "slot_start": data["slot_start"],
        "customer_name": data["customer_name"],
        "contact": data["contact"],
        "note": note,
    }


@router.get("/projects/{project_id}/bookings")
async def get_bookings(project_id: str, request: Request):
    require_id(project_id, "citas")
    project, _settings = await _citas_owner(project_id, request)
    return {"bookings": await bookings.list_bookings(db, project["project_id"])}


@router.get("/projects/{project_id}/bookings/availability")
async def get_availability(project_id: str, request: Request, day: str = ""):
    require_id(project_id, "citas")
    if not _DAY.fullmatch(day or ""):
        raise AgentModuleError("invalid_slot", 422)
    try:
        parsed = date.fromisoformat(day)
    except ValueError:
        raise AgentModuleError("invalid_slot", 422) from None
    project, settings = await _citas_owner(project_id, request)
    return {"day": day, "slots": await bookings.open_slots(db, project["project_id"], settings, parsed)}


@router.post("/projects/{project_id}/bookings")
async def post_booking(project_id: str, request: Request):
    require_id(project_id, "citas")
    raw = await read_limited(request, BOOKING_BODY_MAX, "citas")
    fields = _booking_fields(parse_json_object(raw, "citas", max_depth=3, max_items=8))
    idempotency_key = optional_idempotency_key(request.headers.get("idempotency-key"))
    moment = datetime.now(timezone.utc)
    from backend.app.services.agent_guard import parse_slot_text

    start = parse_slot_text(fields["slot_start"], now=moment)
    bookings.clean_name(fields["customer_name"])
    bookings.clean_contact(fields["contact"])
    bookings.clean_note(fields["note"])
    project, settings = await _citas_owner(project_id, request)
    if not bookings.slot_is_open(start, settings):
        raise AgentModuleError("outside_hours", 422)
    await agent_chat.consume_account_rate(
        db.agent_rate_windows,
        project_id=project["project_id"],
        channel="citas",
        now=moment,
    )
    return await bookings.create_booking(
        db,
        project=project,
        settings=settings,
        slot_start=fields["slot_start"],
        customer_name=fields["customer_name"],
        contact=fields["contact"],
        note=fields["note"],
        channel="api",
        now=moment,
        idempotency_key=idempotency_key,
    )


@router.post("/projects/{project_id}/bookings/{booking_id}/cancel")
async def post_cancel_booking(project_id: str, booking_id: str, request: Request):
    require_id(project_id, "citas")
    require_id(booking_id, "citas")
    project, _settings = await _citas_owner(project_id, request)
    await agent_chat.consume_account_rate(
        db.agent_rate_windows,
        project_id=project["project_id"],
        channel="citas",
        now=datetime.now(timezone.utc),
    )
    return await bookings.cancel_booking(db, project["project_id"], booking_id)


@router.delete("/projects/{project_id}/bookings/{booking_id}")
async def delete_one_booking(project_id: str, booking_id: str, request: Request):
    """Erasure of one booking. Ownership is enough; the module flag is not."""
    require_id(project_id, "citas")
    require_id(booking_id, "citas")
    await prepare()
    _user, project = await owner_and_project(request, project_id)
    await bookings.delete_booking(db, project["project_id"], booking_id)
    return Response(status_code=204)


@router.delete("/projects/{project_id}/agent-conversations/{conversation_id}")
async def delete_one_conversation(project_id: str, conversation_id: str, request: Request):
    require_id(project_id, "chat")
    require_id(conversation_id, "chat")
    await prepare()
    _user, project = await owner_and_project(request, project_id)
    await agent_chat.delete_conversation(
        db.agent_conversations,
        project_id=project["project_id"],
        conversation_id=conversation_id,
    )
    return Response(status_code=204)


@router.delete("/projects/{project_id}/agent-data")
async def delete_agent_data(project_id: str, request: Request):
    """Erase conversations and bookings for this project. The cost ledger stays.

    The ledger is a project id, a day, and an integer. It has no message content.
    Deleting it would also reset the daily cap.
    """
    require_id(project_id, "modules")
    await prepare()
    _user, project = await owner_and_project(request, project_id)
    conversations = await agent_chat.delete_project_conversations(db, project["project_id"])
    removed = await bookings.delete_project_bookings(db, project["project_id"])
    return {"conversations_deleted": conversations, "bookings_deleted": removed}


@router.post("/agent/bookings/reminders/run")
async def run_reminders(request: Request):
    require_runtime("citas", None)
    raw = await read_limited(request, REMINDER_BODY_MAX, "citas")
    secret = (os.environ.get("BOOKINGS_REMINDER_SECRET") or "").strip()
    presented = (request.headers.get("x-reminder-secret") or "").strip()
    if len(presented) > 256:
        log_failure("signature", "citas")
        raise AgentModuleError("forbidden", 403)
    if not secret:
        log_failure("config", "citas")
        raise AgentModuleError("config", 503)
    if not presented or not hmac.compare_digest(secret.encode("utf-8"), presented.encode("utf-8")):
        log_failure("signature", "citas")
        raise AgentModuleError("forbidden", 403)
    if raw.strip():
        extra = parse_json_object(raw, "citas", max_depth=2, max_items=4)
        reject_unknown(extra, set(), "citas")
    await prepare()
    await agent_chat.consume_account_rate(
        db.agent_rate_windows,
        project_id="reminders",
        channel="citas",
        now=datetime.now(timezone.utc),
    )
    return await bookings.run_due_reminders(db)


def _conversation_id_ok(value: str) -> bool:
    if not isinstance(value, str) or not 8 <= len(value) <= 64:
        return False
    return all(ch.isalnum() or ch in {"_", "-"} for ch in value)
