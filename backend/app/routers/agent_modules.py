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
from datetime import date, datetime, timezone

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse, PlainTextResponse, Response
from pydantic import BaseModel, Field

from backend.app.core.security import get_current_user
from backend.app.db.mongodb import db
from backend.app.services import agent_chat, bookings, telephony, whatsapp
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

router = APIRouter(prefix="/api", tags=["agent-modules"])


class ModuleUpdate(BaseModel):
    enabled: bool
    settings: dict = Field(default_factory=dict)
    rotate_widget_key: bool = False


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: str | None = Field(default=None, max_length=64)


class BookingIn(BaseModel):
    slot_start: str = Field(min_length=8, max_length=40)
    customer_name: str = Field(min_length=1, max_length=80)
    contact: str = Field(min_length=3, max_length=120)
    note: str = Field(default="", max_length=240)


def _http(exc: AgentModuleError) -> HTTPException:
    return HTTPException(
        status_code=exc.status,
        detail={"code": exc.code, "message": exc.message},
    )


async def prepare() -> None:
    try:
        await ensure_agent_indexes(db)
    except Exception:
        log_failure("store", "modules")
        raise HTTPException(status_code=503, detail={"code": "store", "message": "No se ha podido guardar."}) from None


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
    raise _http(blocked)


def require_project_module(view: dict, name: str) -> None:
    if module_enabled(view, name):
        return
    log_failure("module_off", name)
    raise _http(AgentModuleError("not_found", 404))


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
        return normalize_chat_settings(previous, rotate)
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


@router.get("/projects/{project_id}/modules")
async def get_modules(project_id: str, request: Request):
    await prepare()
    _user, project = await owner_and_project(request, project_id)
    return await load_modules(db.agent_project_modules, project["project_id"])


@router.put("/projects/{project_id}/modules/{module_name}")
async def put_module(project_id: str, module_name: str, body: ModuleUpdate, request: Request):
    await prepare()
    if module_name not in MODULES:
        raise _http(AgentModuleError("not_found", 404))
    _user, project = await owner_and_project(request, project_id)
    current = await load_modules(db.agent_project_modules, project["project_id"])
    previous = module_settings(current, module_name)
    try:
        settings = resolve_settings(
            module_name, previous, body.settings or {}, body.rotate_widget_key, body.enabled,
        )
        return await save_module(
            db.agent_project_modules, project, module_name, body.enabled, settings,
        )
    except AgentModuleError as exc:
        raise _http(exc) from None


@router.post("/agent/chat/{project_id}/messages")
async def post_chat(project_id: str, body: ChatIn, request: Request):
    await prepare()
    user = await maybe_user(request)
    require_runtime("chat", user)
    try:
        project = await public_project(db.projects, project_id)
        view = await load_modules(db.agent_project_modules, project["project_id"])
        require_project_module(view, "chat")
        settings = module_settings(view, "chat")
        if not widget_key_ok(settings, request.headers.get("x-widget-key", "")):
            log_failure("forbidden", "chat")
            raise AgentModuleError("forbidden", 403)
        conversation_id = body.conversation_id
        if conversation_id is not None and not _conversation_id_ok(conversation_id):
            raise AgentModuleError("not_found", 404)
        bookings_on, citas_settings = citas_ready(view, user)
        return await agent_chat.handle_turn(
            db,
            project=project,
            channel="chat",
            text=body.message,
            conversation_id=conversation_id,
            caller=client_host(request),
            bookings_on=bookings_on,
            citas_settings=citas_settings,
            create_if_missing=False,
        )
    except AgentModuleError as exc:
        raise _http(exc) from None


@router.delete("/agent/chat/{project_id}/conversations/{conversation_id}")
async def delete_chat_conversation(project_id: str, conversation_id: str, request: Request):
    await prepare()
    user = await maybe_user(request)
    require_runtime("chat", user)
    try:
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
    except AgentModuleError as exc:
        raise _http(exc) from None
    return Response(status_code=204)


@router.post("/agent/telephony/voice")
async def inbound_call(request: Request):
    await prepare()
    require_runtime("voz", None)
    try:
        adapter = telephony.build_adapter()
    except AgentModuleError as exc:
        raise _http(exc) from None
    body = await request.body()
    if not adapter.signature_ok(body, request.headers):
        log_failure("signature", "voz")
        raise _http(AgentModuleError("signature", 403))
    inbound = adapter.parse(body)
    if inbound is None:
        log_failure("schema", "voz")
        raise _http(AgentModuleError("schema", 400))
    stored = await db.agent_project_modules.find_one({
        "modules.voz.enabled": True,
        "modules.voz.settings.inbound_number": inbound.to_number,
    })
    if not stored:
        log_failure("not_found", "voz")
        raise _http(AgentModuleError("not_found", 404))
    view = public_modules(stored, stored["project_id"])
    try:
        project = await public_project(db.projects, stored["project_id"])
    except AgentModuleError as exc:
        raise _http(exc) from None
    conversation_id = agent_chat.stable_conversation_id("vo_", project["project_id"], inbound.call_id)
    moment = datetime.now(timezone.utc)
    event_id = inbound.call_id + (
        ":greeting" if not inbound.speech else ":" + hashlib.sha256(inbound.speech.encode("utf-8")).hexdigest()[:16]
    )
    headers = telephony.response_headers(adapter)
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
        )
    except AgentModuleError as exc:
        await agent_chat.release_event(db.agent_inbound_events, provider="voice", event_id=event_id)
        raise _http(exc) from None
    media, payload = adapter.render(result["reply"])
    return Response(content=payload, media_type=media, headers=headers)


@router.get("/agent/whatsapp/webhook")
async def whatsapp_verify(
    request: Request,
    mode: str = Query(default="", alias="hub.mode"),
    token: str = Query(default="", alias="hub.verify_token"),
    challenge: str = Query(default="", alias="hub.challenge"),
):
    await prepare()
    require_runtime("whatsapp", None)
    try:
        body = whatsapp.handshake(mode, token, challenge)
    except AgentModuleError as exc:
        raise _http(exc) from None
    return PlainTextResponse(body, headers={"X-WhatsApp-Integration": "proposal"})


@router.post("/agent/whatsapp/webhook")
async def whatsapp_inbound(request: Request):
    await prepare()
    require_runtime("whatsapp", None)
    body = await request.body()
    if not whatsapp.app_secret():
        log_failure("config", "whatsapp")
        raise _http(AgentModuleError("config", 503))
    if not whatsapp.signature_ok(body, request.headers.get("x-hub-signature-256", "")):
        log_failure("signature", "whatsapp")
        raise _http(AgentModuleError("signature", 403))
    try:
        payload = whatsapp.parse_payload(body)
    except AgentModuleError as exc:
        raise _http(exc) from None
    incoming = whatsapp.extract_text_messages(payload)
    headers = {"X-WhatsApp-Integration": "proposal"}
    if not incoming:
        return JSONResponse({"ok": True}, headers=headers)
    failed = False
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
            )
            await whatsapp.send_text(
                phone_number_id=item["phone_number_id"],
                to=digits,
                body=result["reply"],
            )
        except AgentModuleError as exc:
            if exc.code in {"provider", "config", "store", "schema"}:
                await agent_chat.release_event(
                    db.agent_inbound_events, provider="whatsapp", event_id=item["message_id"],
                )
                failed = True
    if failed:
        raise _http(AgentModuleError("provider", 503))
    return JSONResponse({"ok": True}, headers=headers)


async def _citas_owner(project_id: str, request: Request):
    await prepare()
    user, project = await owner_and_project(request, project_id)
    require_runtime("citas", user)
    view = await load_modules(db.agent_project_modules, project["project_id"])
    require_project_module(view, "citas")
    try:
        settings = bookings.normalize_citas_settings(module_settings(view, "citas"))
    except AgentModuleError as exc:
        raise _http(exc) from None
    return project, settings


@router.get("/projects/{project_id}/bookings")
async def get_bookings(project_id: str, request: Request):
    project, _settings = await _citas_owner(project_id, request)
    return {"bookings": await bookings.list_bookings(db, project["project_id"])}


@router.get("/projects/{project_id}/bookings/availability")
async def get_availability(project_id: str, request: Request, day: str = Query(min_length=10, max_length=10)):
    project, settings = await _citas_owner(project_id, request)
    try:
        parsed = date.fromisoformat(day)
    except ValueError:
        raise _http(AgentModuleError("invalid_slot", 422)) from None
    return {"day": day, "slots": await bookings.open_slots(db, project["project_id"], settings, parsed)}


@router.post("/projects/{project_id}/bookings")
async def post_booking(project_id: str, body: BookingIn, request: Request):
    project, settings = await _citas_owner(project_id, request)
    try:
        return await bookings.create_booking(
            db,
            project=project,
            settings=settings,
            slot_start=body.slot_start,
            customer_name=body.customer_name,
            contact=body.contact,
            note=body.note,
            channel="api",
        )
    except AgentModuleError as exc:
        raise _http(exc) from None


@router.post("/projects/{project_id}/bookings/{booking_id}/cancel")
async def post_cancel_booking(project_id: str, booking_id: str, request: Request):
    project, _settings = await _citas_owner(project_id, request)
    try:
        return await bookings.cancel_booking(db, project["project_id"], booking_id)
    except AgentModuleError as exc:
        raise _http(exc) from None


@router.delete("/projects/{project_id}/bookings/{booking_id}")
async def delete_one_booking(project_id: str, booking_id: str, request: Request):
    """Erasure of one booking. Ownership is enough; the module flag is not."""
    await prepare()
    _user, project = await owner_and_project(request, project_id)
    try:
        await bookings.delete_booking(db, project["project_id"], booking_id)
    except AgentModuleError as exc:
        raise _http(exc) from None
    return Response(status_code=204)


@router.delete("/projects/{project_id}/agent-conversations/{conversation_id}")
async def delete_one_conversation(project_id: str, conversation_id: str, request: Request):
    await prepare()
    _user, project = await owner_and_project(request, project_id)
    try:
        await agent_chat.delete_conversation(
            db.agent_conversations,
            project_id=project["project_id"],
            conversation_id=conversation_id,
        )
    except AgentModuleError as exc:
        raise _http(exc) from None
    return Response(status_code=204)


@router.delete("/projects/{project_id}/agent-data")
async def delete_agent_data(project_id: str, request: Request):
    """Erase conversations and bookings for this project. The cost ledger stays.

    The ledger is a project id, a day, and an integer. It has no message content.
    Deleting it would also reset the daily cap.
    """
    await prepare()
    _user, project = await owner_and_project(request, project_id)
    conversations = await agent_chat.delete_project_conversations(db, project["project_id"])
    removed = await bookings.delete_project_bookings(db, project["project_id"])
    return {"conversations_deleted": conversations, "bookings_deleted": removed}


@router.post("/agent/bookings/reminders/run")
async def run_reminders(request: Request):
    await prepare()
    require_runtime("citas", None)
    secret = (os.environ.get("BOOKINGS_REMINDER_SECRET") or "").strip()
    presented = (request.headers.get("x-reminder-secret") or "").strip()
    if not secret:
        log_failure("config", "citas")
        raise _http(AgentModuleError("config", 503))
    if not presented or not hmac.compare_digest(secret.encode("utf-8"), presented.encode("utf-8")):
        log_failure("signature", "citas")
        raise _http(AgentModuleError("forbidden", 403))
    try:
        return await bookings.run_due_reminders(db)
    except AgentModuleError as exc:
        raise _http(exc) from None
    except Exception:
        log_failure("store", "citas")
        raise HTTPException(status_code=503, detail={"code": "store", "message": "No se ha podido guardar."}) from None


def _conversation_id_ok(value: str) -> bool:
    if not isinstance(value, str) or not 8 <= len(value) <= 64:
        return False
    return all(ch.isalnum() or ch in {"_", "-"} for ch in value)
