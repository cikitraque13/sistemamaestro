"""Bookings for a client project.

Slots follow the business weekly hours. The default timezone is Europe/Madrid.
A confirmed slot cannot be taken twice. Personal data is the name and one
phone or email. Cancellation frees the slot. Deletion removes the record.

WhatsApp reminders go through the WhatsApp adapter. There is no WhatsApp
account in this change: the sender is injected in tests and reads env names
in the real adapter.
"""

from __future__ import annotations

import re
import secrets
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from backend.app.services.agent_guard import (
    BOOKING_HORIZON_DAYS,
    NAME_MAX,
    NOTE_MAX,
    clean_email_or_phone,
    optional_plain_text,
    parse_slot_text,
    reject_unknown,
    require_plain_text,
    require_timezone,
)
from backend.app.services.agent_modules import (
    AgentModuleError,
    global_module_enabled,
    log_failure,
    module_enabled,
    module_settings,
    public_modules,
)

DAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
SLOT_MINUTES = {15, 20, 30, 60}
_CITAS_KEYS = {"timezone", "slot_minutes", "weekly_hours", "reminder_hours_before"}
_TIME = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def default_citas_settings() -> dict:
    return {
        "timezone": "Europe/Madrid",
        "slot_minutes": 30,
        "weekly_hours": {},
        "reminder_hours_before": 24,
    }


def _zone(name: str) -> ZoneInfo:
    try:
        return ZoneInfo(require_timezone(name))
    except AgentModuleError:
        raise
    except ZoneInfoNotFoundError:
        raise AgentModuleError("invalid_timezone", 422) from None


def normalize_citas_settings(raw) -> dict:
    if raw is None:
        raw = {}
    if not isinstance(raw, dict):
        raise AgentModuleError("invalid_settings", 422)
    reject_unknown(raw, _CITAS_KEYS, "citas")
    incoming = raw
    settings = default_citas_settings()
    timezone_name = incoming.get("timezone") or settings["timezone"]
    settings["timezone"] = require_timezone(timezone_name)

    minutes = incoming.get("slot_minutes", settings["slot_minutes"])
    if minutes not in SLOT_MINUTES:
        raise AgentModuleError("invalid_settings", 422)
    settings["slot_minutes"] = minutes

    hours = incoming.get("reminder_hours_before", settings["reminder_hours_before"])
    if isinstance(hours, bool) or not isinstance(hours, int) or not 1 <= hours <= 168:
        raise AgentModuleError("invalid_settings", 422)
    settings["reminder_hours_before"] = hours

    weekly = incoming.get("weekly_hours", {})
    if weekly is None:
        weekly = {}
    if not isinstance(weekly, dict):
        raise AgentModuleError("invalid_settings", 422)
    clean = {}
    for day, windows in weekly.items():
        if day not in DAYS:
            raise AgentModuleError("invalid_settings", 422)
        if not isinstance(windows, list) or len(windows) > 4:
            raise AgentModuleError("invalid_settings", 422)
        parsed = []
        for window in windows:
            if not isinstance(window, (list, tuple)) or len(window) != 2:
                raise AgentModuleError("invalid_settings", 422)
            start, end = window
            if not isinstance(start, str) or not isinstance(end, str):
                raise AgentModuleError("invalid_settings", 422)
            if not _TIME.match(start) or not _TIME.match(end) or start >= end:
                raise AgentModuleError("invalid_settings", 422)
            parsed.append([start, end])
        if parsed:
            clean[day] = parsed
    settings["weekly_hours"] = clean
    return settings


def parse_slot(value: str) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise AgentModuleError("invalid_slot", 422)
    text = value.strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        raise AgentModuleError("invalid_slot", 422) from None
    if parsed.tzinfo is None:
        raise AgentModuleError("invalid_slot", 422)
    return parsed.astimezone(timezone.utc).replace(microsecond=0)


def _combine(day: date, hm: str, zone: ZoneInfo) -> datetime:
    hour, minute = hm.split(":")
    return datetime.combine(day, time(int(hour), int(minute)), tzinfo=zone)


def slot_is_open(start_utc: datetime, settings: dict) -> bool:
    zone = _zone(settings["timezone"])
    local = start_utc.astimezone(zone)
    if local.second or local.microsecond:
        return False
    minutes = int(settings["slot_minutes"])
    midnight = local.replace(hour=0, minute=0, second=0, microsecond=0)
    offset = int((local - midnight).total_seconds() // 60)
    if offset % minutes != 0:
        return False
    end_local = local + timedelta(minutes=minutes)
    if end_local.date() != local.date():
        return False
    day = DAYS[local.weekday()]
    for start_hm, end_hm in settings.get("weekly_hours", {}).get(day, []):
        window_start = _combine(local.date(), start_hm, zone)
        window_end = _combine(local.date(), end_hm, zone)
        if window_start <= local and end_local <= window_end:
            return True
    return False


def clean_name(value: str) -> str:
    try:
        return require_plain_text(value, max_len=NAME_MAX, module="citas")
    except AgentModuleError as exc:
        if exc.code == "empty_message":
            raise AgentModuleError("invalid_contact", 422) from None
        raise


def clean_contact(value: str) -> str:
    return clean_email_or_phone(value, module="citas")


def clean_note(value: str) -> str:
    return optional_plain_text(value, max_len=NOTE_MAX, module="citas")


def whatsapp_destination(contact: str) -> str | None:
    if not isinstance(contact, str) or "@" in contact:
        return None
    digits = re.sub(r"\D", "", contact)
    if 8 <= len(digits) <= 15:
        return digits
    return None


def _iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def serialize_booking(doc: dict, *, include_contact: bool = True) -> dict:
    payload = {
        "booking_id": doc["booking_id"],
        "project_id": doc["project_id"],
        "slot_start": _iso(doc["slot_start"]),
        "slot_end": _iso(doc["slot_end"]),
        "timezone": doc.get("timezone") or "Europe/Madrid",
        "status": doc.get("status"),
        "channel": doc.get("channel"),
    }
    if include_contact:
        payload["customer_name"] = doc.get("customer_name") or ""
        payload["contact"] = doc.get("contact") or ""
        if doc.get("note"):
            payload["note"] = doc["note"]
    return payload


async def _confirmed_overlap(collection, project_id: str, start: datetime, end: datetime):
    cursor = collection.find({
        "project_id": project_id,
        "status": "confirmed",
        "slot_start": {"$lt": end},
        "slot_end": {"$gt": start},
    })
    return await cursor.to_list(20)


async def create_booking(
    database,
    *,
    project: dict,
    settings: dict,
    slot_start: str,
    customer_name: str,
    contact: str,
    note: str = "",
    channel: str,
    now: datetime | None = None,
    idempotency_key: str | None = None,
) -> dict:
    moment = now or datetime.now(timezone.utc)
    settings = settings or default_citas_settings()
    # Every check above the first collection call is pure. A bad payload
    # never reaches Mongo.
    start = parse_slot_text(slot_start, now=moment, horizon_days=BOOKING_HORIZON_DAYS)
    name = clean_name(customer_name)
    contact_clean = clean_contact(contact)
    note_clean = clean_note(note)
    if not slot_is_open(start, settings):
        raise AgentModuleError("outside_hours", 422)
    end = start + timedelta(minutes=int(settings["slot_minutes"]))
    if idempotency_key:
        existing = await database.agent_bookings.find_one({
            "project_id": project["project_id"],
            "idempotency_key": idempotency_key,
        })
        if existing:
            return _replay_or_conflict(existing, start=start, name=name, contact=contact_clean, note=note_clean)
    overlap = await _confirmed_overlap(database.agent_bookings, project["project_id"], start, end)
    if overlap:
        log_failure("slot_taken", "citas")
        raise AgentModuleError("slot_taken", 409)
    from pymongo.errors import DuplicateKeyError

    document = {
        "booking_id": "bk_" + secrets.token_hex(8),
        "project_id": project["project_id"],
        "slot_start": start,
        "slot_end": end,
        "timezone": settings["timezone"],
        "status": "confirmed",
        "customer_name": name,
        "contact": contact_clean,
        "note": note_clean,
        "channel": channel if channel in {"chat", "whatsapp", "voice", "api"} else "api",
        **({"idempotency_key": idempotency_key} if idempotency_key else {}),
        "reminder_due_at": start - timedelta(hours=int(settings["reminder_hours_before"])),
        "reminder_sent_at": None,
        "reminder_claimed_at": None,
        "reminder_skip": None,
        "created_at": moment,
    }
    try:
        await database.agent_bookings.insert_one(document)
    except DuplicateKeyError:
        if idempotency_key:
            existing = await database.agent_bookings.find_one({
                "project_id": project["project_id"],
                "idempotency_key": idempotency_key,
            })
            if existing:
                return _replay_or_conflict(
                    existing, start=start, name=name, contact=contact_clean, note=note_clean,
                )
        log_failure("slot_taken", "citas")
        raise AgentModuleError("slot_taken", 409) from None
    return serialize_booking(document)


def _same_instant(stored, start: datetime) -> bool:
    if not isinstance(stored, datetime):
        return False
    return stored.astimezone(timezone.utc).replace(microsecond=0) == start


def _replay_or_conflict(existing: dict, *, start: datetime, name: str, contact: str, note: str) -> dict:
    if (
        _same_instant(existing.get("slot_start"), start)
        and existing.get("customer_name") == name
        and existing.get("contact") == contact
        and (existing.get("note") or "") == note
    ):
        return serialize_booking(existing)
    log_failure("idempotency_conflict", "citas")
    raise AgentModuleError("idempotency_conflict", 409)


async def list_bookings(database, project_id: str) -> list:
    cursor = database.agent_bookings.find({"project_id": project_id})
    rows = await cursor.to_list(500)
    rows.sort(key=lambda row: row.get("slot_start") or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return [serialize_booking(row) for row in rows[:200]]


async def _owned_booking(database, project_id: str, booking_id: str) -> dict:
    doc = await database.agent_bookings.find_one({
        "project_id": project_id,
        "booking_id": booking_id,
    })
    if not doc:
        raise AgentModuleError("not_found", 404)
    return doc


async def cancel_booking(database, project_id: str, booking_id: str, now: datetime | None = None) -> dict:
    doc = await _owned_booking(database, project_id, booking_id)
    if doc.get("status") != "cancelled":
        await database.agent_bookings.update_one(
            {"project_id": project_id, "booking_id": booking_id, "status": "confirmed"},
            {"$set": {"status": "cancelled", "cancelled_at": now or datetime.now(timezone.utc)}},
        )
        doc["status"] = "cancelled"
    return serialize_booking(doc)


async def delete_booking(database, project_id: str, booking_id: str) -> None:
    result = await database.agent_bookings.delete_one({
        "project_id": project_id,
        "booking_id": booking_id,
    })
    if getattr(result, "deleted_count", 0) != 1:
        raise AgentModuleError("not_found", 404)


def _day_bounds(day: date, zone: ZoneInfo) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=zone).astimezone(timezone.utc)
    end = datetime.combine(day + timedelta(days=1), time.min, tzinfo=zone).astimezone(timezone.utc)
    return start, end


async def open_slots(database, project_id: str, settings: dict, day: date) -> list:
    zone = _zone(settings["timezone"])
    today = datetime.now(zone).date()
    if day > today + timedelta(days=BOOKING_HORIZON_DAYS):
        log_failure("invalid_slot", "citas")
        raise AgentModuleError("invalid_slot", 422)
    window_start, window_end = _day_bounds(day, zone)
    cursor = database.agent_bookings.find({
        "project_id": project_id,
        "status": "confirmed",
        "slot_start": {"$gte": window_start, "$lt": window_end},
    })
    taken_docs = await cursor.to_list(200)
    taken = set()
    for doc in taken_docs:
        start = doc.get("slot_start")
        if isinstance(start, datetime):
            taken.add(start.astimezone(timezone.utc).replace(microsecond=0))
    minutes = int(settings["slot_minutes"])
    day_name = DAYS[day.weekday()]
    slots = []
    for start_hm, end_hm in settings.get("weekly_hours", {}).get(day_name, []):
        cursor_local = _combine(day, start_hm, zone)
        end_local = _combine(day, end_hm, zone)
        while cursor_local + timedelta(minutes=minutes) <= end_local:
            utc = cursor_local.astimezone(timezone.utc).replace(microsecond=0)
            if utc not in taken and utc > datetime.now(timezone.utc):
                slots.append(utc.isoformat())
            cursor_local += timedelta(minutes=minutes)
    return slots


def reminder_text(project: dict, booking: dict) -> str:
    from backend.app.services.agent_chat import knowledge_for

    knowledge = knowledge_for(project or {})
    business = knowledge.get("blueprintTitle") or knowledge.get("instruction") or "tu cita"
    business = " ".join(str(business).split())[:80]
    zone = _zone(booking.get("timezone") or "Europe/Madrid")
    local = booking["slot_start"].astimezone(zone)
    when = local.strftime("%d/%m a las %H:%M")
    return (
        f"Recordatorio: tienes una cita con {business} el {when} ({zone.key}). "
        "Responde a este mensaje si necesitas cambiarla."
    )


async def run_due_reminders(database, *, now: datetime | None = None, send=None) -> dict:
    """Send due WhatsApp reminders. Counts only. No phone numbers and no text."""
    # TODO(gems): each reminder sent through WhatsApp can cost gems.
    # The send helper carries the same note. Do not charge here.
    from backend.app.services import whatsapp as whatsapp_service

    moment = now or datetime.now(timezone.utc)
    sender = send or whatsapp_service.send_text
    await _release_stale_claims(database, moment)
    cursor = database.agent_bookings.find({
        "status": "confirmed",
        "reminder_sent_at": None,
        "reminder_claimed_at": None,
        "reminder_skip": None,
        "reminder_due_at": {"$lte": moment},
        "slot_start": {"$gt": moment},
    })
    rows = await cursor.to_list(100)
    sent = skipped = failed = 0
    for row in rows:
        destination = whatsapp_destination(row.get("contact") or "")
        if not destination:
            await database.agent_bookings.update_one(
                {"booking_id": row["booking_id"], "reminder_sent_at": None},
                {"$set": {"reminder_skip": "no_phone"}},
            )
            log_failure("no_phone", "citas")
            skipped += 1
            continue
        stored = await database.agent_project_modules.find_one({"project_id": row["project_id"]})
        view = public_modules(stored, row["project_id"])
        phone_number_id = module_settings(view, "whatsapp").get("phone_number_id") or ""
        # Flag or project switch off is temporary: leave the reminder due so a
        # later activation can still send it. A contact that is not a phone
        # never becomes one, so that skip is permanent.
        if not global_module_enabled("whatsapp") or not module_enabled(view, "whatsapp") or not phone_number_id:
            log_failure("module_off", "citas")
            skipped += 1
            continue
        claimed = await database.agent_bookings.update_one(
            {
                "booking_id": row["booking_id"],
                "reminder_sent_at": None,
                "reminder_claimed_at": None,
            },
            {"$set": {"reminder_claimed_at": moment}},
        )
        if getattr(claimed, "matched_count", 0) != 1:
            continue
        project = await database.projects.find_one({"project_id": row["project_id"]}) or {}
        body = reminder_text(project, row)
        try:
            await sender(phone_number_id=phone_number_id, to=destination, body=body)
        except Exception as exc:
            await database.agent_bookings.update_one(
                {"booking_id": row["booking_id"]},
                {"$set": {"reminder_claimed_at": None}},
            )
            if isinstance(exc, AgentModuleError):
                raise
            from backend.app.services.agent_guard import classify_provider

            raise classify_provider(exc, "citas") from None
        await database.agent_bookings.update_one(
            {"booking_id": row["booking_id"]},
            {"$set": {"reminder_sent_at": moment}},
        )
        sent += 1
    return {"checked": len(rows), "sent": sent, "skipped": skipped, "failed": failed}


async def _release_stale_claims(database, moment: datetime) -> None:
    """A claim older than two minutes is released so a crash cannot hold a reminder forever."""
    stale_before = moment - timedelta(minutes=2)
    cursor = database.agent_bookings.find({
        "status": "confirmed",
        "reminder_sent_at": None,
        "reminder_skip": None,
    })
    rows = await cursor.to_list(100)
    for row in rows:
        claimed = row.get("reminder_claimed_at")
        if not isinstance(claimed, datetime) or claimed > stale_before:
            continue
        await database.agent_bookings.update_one(
            {"booking_id": row["booking_id"], "reminder_sent_at": None},
            {"$set": {"reminder_claimed_at": None}},
        )


async def delete_project_bookings(database, project_id: str) -> int:
    result = await database.agent_bookings.delete_many({"project_id": project_id})
    return int(getattr(result, "deleted_count", 0))
