"""Client agent modules: chat, telephony proposal, WhatsApp, bookings, flags."""

import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")

import asyncio
import hashlib
import hmac
import json
import logging
from datetime import datetime, timedelta
from types import SimpleNamespace
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from agent_module_fakes import FakeDB
from backend.app.services.agent_modules import AgentModuleError
from backend.app.services.bookings import DAYS
from backend.app.services.telephony import PRODUCTION_READY, PROPOSAL_PROVIDER, twilio_signature

PROJECT_ID = "proj_clinic"
OWNER = {"user_id": "owner-1", "role": "user", "email": "owner@example.com"}
ADMIN = {"user_id": "owner-1", "role": "admin", "email": "owner@example.com"}
OTHER = {"user_id": "other", "role": "user", "email": "other@example.com"}
SECRET_TEXT = "mensaje secreto del paciente 4242"
OFFICE = {day: [["09:00", "12:00"]] for day in DAYS}
ALL_DAY = {day: [["00:00", "23:30"]] for day in DAYS}
SLOT = "2027-01-04T09:00:00+01:00"
FLAGS = {
    "chat": "AGENT_MODULE_CHAT_ENABLED",
    "voz": "AGENT_MODULE_VOZ_ENABLED",
    "whatsapp": "AGENT_MODULE_WHATSAPP_ENABLED",
    "citas": "AGENT_MODULE_CITAS_ENABLED",
}


@pytest.fixture(autouse=True)
def stable_agent_env(monkeypatch):
    monkeypatch.setenv("BUILDER_EXECUTOR_ORCHESTRATOR", "grok")
    monkeypatch.setenv("GROK_MODEL", "grok-4.3")
    monkeypatch.setenv("AGENT_CHAT_DAILY_COST_CAP_USD", "1")
    monkeypatch.setenv("AGENT_CHAT_RATE_LIMIT", "20")
    monkeypatch.setenv("AGENT_CHAT_RATE_WINDOW_SECONDS", "3600")
    monkeypatch.setenv("AGENT_CHAT_RETENTION_DAYS", "30")
    for env_name in FLAGS.values():
        monkeypatch.setenv(env_name, "false")


def flags_on(monkeypatch, *names):
    for name, env_name in FLAGS.items():
        monkeypatch.setenv(env_name, "true" if name in names else "false")


def seed(fake):
    fake.projects.docs.append({
        "project_id": PROJECT_ID,
        "user_id": "owner-1",
        "input_content": "Clínica Sol. Fisioterapia en Málaga. Primera visita 40 euros.",
        "diagnosis": {"summary": "Necesita que alguien conteste y una agenda."},
        "blueprint": {
            "title": "Clínica Sol",
            "summary": "Web con citas",
            "priorities": ["Agenda", "WhatsApp"],
        },
        "refine_answers": {"horario": "Mañanas"},
        "api_key": "sk-live-SHOULD-NOT-LEAK",
    })


class Actor:
    def __init__(self):
        self.user = None


def open_client(fake):
    """One app. The actor is who get_current_user returns for the next call."""
    import backend.app.routers.agent_modules as routes
    import backend.app.services.agent_modules as modules

    modules._indexes_ready = False
    routes.db = fake
    actor = Actor()

    async def current_user(request):
        if actor.user is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
        return actor.user

    routes.get_current_user = current_user
    app = FastAPI()
    app.include_router(routes.router)
    return TestClient(app), actor


def enable(client, module, settings=None):
    response = client.put(
        f"/api/projects/{PROJECT_ID}/modules/{module}",
        json={"enabled": True, "settings": settings or {}},
    )
    assert response.status_code == 200, response.text
    return response.json()


def patch_reply(monkeypatch, text="La primera visita son 40 euros."):
    calls = []

    async def complete_turn(messages, tools=None):
        calls.append({"messages": messages, "tools": tools})
        return {"content": text}

    monkeypatch.setattr("backend.app.services.agent_chat.complete_turn", complete_turn)
    return calls


def widget_key(payload):
    return payload["modules"]["chat"]["settings"]["widget_key"]


def test_twilio_signature_matches_the_published_vector():
    signature = twilio_signature(
        "12345",
        "https://mycompany.com/myapp.php?foo=1&bar=2",
        {
            "CallSid": "CA1234567890ABCDE",
            "Caller": "+14158675309",
            "Digits": "1234",
            "From": "+14158675309",
            "To": "+18005551212",
        },
    )
    assert signature == "RSOYDt4T1cUTdK1PDd93/VVr8B8="
    assert PROPOSAL_PROVIDER == "twilio"
    assert PRODUCTION_READY is False


def test_routes_are_registered_before_the_frontend_catch_all():
    # Read the entrypoint as text. Importing the app here would load every
    # router before the suite's dependency stubs, and those stubs would miss.
    source = open(
        os.path.join(os.path.dirname(__file__), "..", "app", "main.py"),
        encoding="utf-8",
    ).read()
    agent = source.index("app.include_router(agent_modules_router)")
    catch = source.index("@app.get(\"/{full_path:path}\"")
    assert agent < catch
    assert "agent_modules_router" in source


def test_gems_are_listed_and_not_charged():
    root = os.path.join(os.path.dirname(__file__), "..", "app")
    for name in ("services/agent_chat.py", "services/whatsapp.py", "services/bookings.py"):
        text = open(os.path.join(root, name), encoding="utf-8").read()
        assert "TODO(gems)" in text
        assert "run_economic_operation" not in text
    router = open(os.path.join(root, "routers/agent_modules.py"), encoding="utf-8").read()
    assert "builder_test_mode" not in router
    assert "embed_agents" not in router
    assert "stripe" not in router.lower()


def test_modules_default_off_and_only_the_owner_can_toggle():
    fake = FakeDB()
    seed(fake)
    client, actor = open_client(fake)

    denied = client.get(f"/api/projects/{PROJECT_ID}/modules")
    assert denied.status_code == 401
    actor.user = OTHER
    missing = client.get(f"/api/projects/{PROJECT_ID}/modules")
    assert missing.status_code == 404

    actor.user = OWNER
    owner = client
    current = owner.get(f"/api/projects/{PROJECT_ID}/modules")
    assert current.status_code == 200
    body = current.json()
    assert body["global_flags"] == {"chat": False, "voz": False, "whatsapp": False, "citas": False}
    assert all(item["enabled"] is False for item in body["modules"].values())

    enabled = enable(owner, "chat")
    key = widget_key(enabled)
    assert key
    again = enable(owner, "chat", {"widget_key": "client-picked-key"})
    assert widget_key(again) == key
    rotated = owner.put(
        f"/api/projects/{PROJECT_ID}/modules/chat",
        json={"enabled": True, "settings": {}, "rotate_widget_key": True},
    )
    assert rotated.status_code == 200
    assert widget_key(rotated.json()) != key

    bad_voice = owner.put(
        f"/api/projects/{PROJECT_ID}/modules/voz",
        json={"enabled": True, "settings": {"inbound_number": "no-es-un-numero"}},
    )
    assert bad_voice.status_code == 422
    voice = enable(owner, "voz", {"inbound_number": "+34900111222", "greeting": "Hola"})
    assert voice["modules"]["voz"]["settings"]["inbound_number"] == "+34900111222"

    bad_hours = owner.put(
        f"/api/projects/{PROJECT_ID}/modules/citas",
        json={"enabled": True, "settings": {"weekly_hours": {"lunes": [["09:00", "10:00"]]}}},
    )
    assert bad_hours.status_code == 422
    citas = enable(owner, "citas", {"timezone": "Europe/Madrid", "weekly_hours": OFFICE})
    assert citas["modules"]["citas"]["settings"]["timezone"] == "Europe/Madrid"
    assert citas["modules"]["citas"]["enabled"] is True


def test_chat_replies_from_the_project_and_does_not_log_the_message(monkeypatch, caplog):
    flags_on(monkeypatch, "chat")
    calls = patch_reply(monkeypatch)
    fake = FakeDB()
    seed(fake)
    owner, actor = open_client(fake)
    actor.user = OWNER
    key = widget_key(enable(owner, "chat"))
    caplog.set_level(logging.WARNING)
    response = owner.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers={"X-Widget-Key": key, "X-Forwarded-For": "203.0.113.55"},
        json={"message": SECRET_TEXT},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["reply"] == "La primera visita son 40 euros."
    assert body["booking_id"] is None
    prompt = calls[0]["messages"][0]["content"]
    assert "inteligencia artificial" in prompt
    assert "Clínica Sol" in prompt
    assert "Mañanas" in prompt
    assert "40 euros" in prompt
    assert "sk-live-SHOULD-NOT-LEAK" not in prompt
    assert "Sistema Maestro" in prompt
    assert SECRET_TEXT not in caplog.text
    assert "sk-live-SHOULD-NOT-LEAK" not in caplog.text
    assert "agent_module_failed" not in caplog.text
    stored = json.dumps(fake.agent_conversations.docs, default=str)
    assert "203.0.113.55" not in stored
    assert SECRET_TEXT in stored
    assert fake.agent_conversations.docs[0]["expires_at"] > datetime.now(fake.agent_conversations.docs[0]["expires_at"].tzinfo)

    follow = owner.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers={"X-Widget-Key": key},
        json={"message": "¿Y el horario?", "conversation_id": body["conversation_id"]},
    )
    assert follow.status_code == 200
    history = [item["content"] for item in calls[1]["messages"]]
    assert SECRET_TEXT in history
    wrong = owner.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers={"X-Widget-Key": "no-es-la-clave"},
        json={"message": "hola"},
    )
    assert wrong.status_code == 403


def test_chat_retention_rate_limit_and_cost_cap(monkeypatch):
    flags_on(monkeypatch, "chat")
    calls = patch_reply(monkeypatch)
    fake = FakeDB()
    seed(fake)
    owner, actor = open_client(fake)
    actor.user = OWNER
    key = widget_key(enable(owner, "chat"))
    headers = {"X-Widget-Key": key}
    first = owner.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers=headers,
        json={"message": SECRET_TEXT},
    )
    assert first.status_code == 200
    conversation_id = first.json()["conversation_id"]
    fake.agent_conversations.docs[0]["expires_at"] = datetime(2000, 1, 1, tzinfo=ZoneInfo("UTC"))
    expired = owner.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers=headers,
        json={"message": "sigo aqui", "conversation_id": conversation_id},
    )
    assert expired.status_code == 404
    assert fake.agent_conversations.docs == []

    monkeypatch.setenv("AGENT_CHAT_RATE_LIMIT", "2")
    limited = {**headers, "X-Forwarded-For": "198.51.100.10"}
    for _ in range(2):
        allowed = owner.post(
            f"/api/agent/chat/{PROJECT_ID}/messages",
            headers=limited,
            json={"message": "hola"},
        )
        assert allowed.status_code == 200, allowed.text
    blocked = owner.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers=limited,
        json={"message": SECRET_TEXT},
    )
    assert blocked.status_code == 429
    assert blocked.json()["detail"]["code"] == "rate_limited"
    assert SECRET_TEXT not in blocked.text

    monkeypatch.setenv("AGENT_CHAT_RATE_LIMIT", "20")
    monkeypatch.setenv("AGENT_CHAT_DAILY_COST_CAP_USD", "0.00015")
    fake.agent_usage.docs.clear()
    headers = {**headers, "X-Forwarded-For": "198.51.100.20"}

    def cheap(prompt, reply, rates):
        return 100

    monkeypatch.setattr("backend.app.services.agent_chat.estimate_turn_micros", cheap)
    before = len(calls)
    under = owner.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers=headers,
        json={"message": "una mas"},
    )
    assert under.status_code == 200
    over = owner.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers=headers,
        json={"message": "otra"},
    )
    assert over.status_code == 429
    assert over.json()["detail"]["code"] == "cost_cap"
    assert len(calls) == before + 1


def test_provider_failure_logs_a_category_and_not_the_message(monkeypatch, caplog):
    flags_on(monkeypatch, "chat")
    fake = FakeDB()
    seed(fake)
    owner, actor = open_client(fake)
    actor.user = OWNER
    key = widget_key(enable(owner, "chat"))

    class Boom:
        def __init__(self, **kwargs):
            self.chat = self
            self.completions = self

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def create(self, **kwargs):
            raise RuntimeError("secreto-en-excepcion")

    monkeypatch.setenv("GROK_API_KEY", "xai-test-key")
    monkeypatch.setattr("backend.app.ai.providers.grok_client.GrokChatClient", Boom)
    caplog.set_level(logging.WARNING)
    response = owner.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers={"X-Widget-Key": key},
        json={"message": SECRET_TEXT},
    )
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "provider"
    assert SECRET_TEXT not in caplog.text
    assert SECRET_TEXT not in response.text
    assert "secreto-en-excepcion" not in caplog.text
    assert "xai-test-key" not in caplog.text
    assert "category=provider" in caplog.text


def test_complete_turn_parses_a_provider_tool_call_without_logging_it(monkeypatch, caplog):
    class FakeGrok:
        def __init__(self, **kwargs):
            self.chat = self
            self.completions = self

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def create(self, **kwargs):
            FakeGrok.kwargs = kwargs
            return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(
                content=None,
                tool_calls=[SimpleNamespace(id="1", name="create_booking", arguments='{"slot_start":"2027-01-04T09:00:00+01:00"}')],
            ))])

    monkeypatch.setenv("GROK_API_KEY", "xai-test-key")
    monkeypatch.setattr("backend.app.ai.providers.grok_client.GrokChatClient", FakeGrok)
    caplog.set_level(logging.WARNING)
    from backend.app.services.agent_chat import complete_turn

    result = asyncio.run(complete_turn(
        [{"role": "user", "content": "texto-que-no-se-loguea"}],
        [{"type": "function", "function": {"name": "create_booking"}}],
    ))
    assert result["tool_calls"][0]["name"] == "create_booking"
    assert result["tool_calls"][0]["arguments"]["slot_start"].startswith("2027-01-04")
    assert FakeGrok.kwargs["tools"][0]["function"]["name"] == "create_booking"
    assert "texto-que-no-se-loguea" not in caplog.text
    assert "xai-test-key" not in caplog.text

    monkeypatch.setenv("GROK_API_KEY", "")
    with pytest.raises(AgentModuleError) as error:
        asyncio.run(complete_turn([{"role": "user", "content": "otro-secreto"}], None))
    assert error.value.code == "config"
    assert "otro-secreto" not in caplog.text


def test_flags_off_hide_public_routes_and_block_owners_unless_admin(monkeypatch):
    flags_on(monkeypatch)
    fake = FakeDB()
    seed(fake)
    client, actor = open_client(fake)
    actor.user = OWNER
    enable(client, "chat")
    enable(client, "citas", {"weekly_hours": OFFICE})
    key = widget_key(client.get(f"/api/projects/{PROJECT_ID}/modules").json())

    actor.user = None
    hidden = client.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers={"X-Widget-Key": key},
        json={"message": "hola"},
    )
    assert hidden.status_code == 404
    actor.user = OWNER
    signed_in = client.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers={"X-Widget-Key": key},
        json={"message": "hola"},
    )
    assert signed_in.status_code == 503
    assert signed_in.json()["detail"]["code"] == "module_disabled"
    bookings_response = client.get(f"/api/projects/{PROJECT_ID}/bookings")
    assert bookings_response.status_code == 503
    actor.user = ADMIN
    bypass = client.get(f"/api/projects/{PROJECT_ID}/bookings")
    assert bypass.status_code == 200
    assert bypass.json()["bookings"] == []


def test_chat_can_create_a_booking_through_the_tool(monkeypatch):
    flags_on(monkeypatch, "chat", "citas")
    calls = []

    async def complete_turn(messages, tools=None):
        calls.append({"messages": messages, "tools": tools})
        if len(calls) == 1:
            return {"tool_calls": [{"name": "create_booking", "arguments": {
                "slot_start": SLOT,
                "customer_name": "Ana",
                "contact": "ana@example.com",
            }}]}
        return {"content": "Queda confirmada tu cita."}

    monkeypatch.setattr("backend.app.services.agent_chat.complete_turn", complete_turn)
    fake = FakeDB()
    seed(fake)
    owner, actor = open_client(fake)
    actor.user = OWNER
    key = widget_key(enable(owner, "chat"))
    enable(owner, "citas", {"timezone": "Europe/Madrid", "slot_minutes": 30, "weekly_hours": OFFICE})
    response = owner.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers={"X-Widget-Key": key},
        json={"message": "Quiero una cita el 4 de enero a las 9"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["reply"] == "Queda confirmada tu cita."
    assert body["booking_id"]
    listed = owner.get(f"/api/projects/{PROJECT_ID}/bookings")
    assert listed.status_code == 200
    assert listed.json()["bookings"][0]["booking_id"] == body["booking_id"]
    assert listed.json()["bookings"][0]["contact"] == "ana@example.com"
    follow = calls[1]["messages"][-1]["content"]
    assert '"ok": true' in follow
    assert "ana@example.com" not in follow
    assert calls[0]["tools"][0]["function"]["name"] == "create_booking"


def test_booking_create_list_cancel_and_double_booking(monkeypatch):
    flags_on(monkeypatch, "citas")
    fake = FakeDB()
    seed(fake)
    owner, actor = open_client(fake)
    actor.user = OWNER
    enable(owner, "citas", {
        "timezone": "Europe/Madrid",
        "slot_minutes": 30,
        "reminder_hours_before": 24,
        "weekly_hours": OFFICE,
    })
    day = "2027-01-04"
    open_before = owner.get(f"/api/projects/{PROJECT_ID}/bookings/availability", params={"day": day})
    assert open_before.status_code == 200
    assert any(item.startswith("2027-01-04T08:00:00") for item in open_before.json()["slots"])

    created = owner.post(
        f"/api/projects/{PROJECT_ID}/bookings",
        json={"slot_start": SLOT, "customer_name": "Ana Ruiz", "contact": "+34600111222", "note": "nota secreta"},
    )
    assert created.status_code == 200, created.text
    booking_id = created.json()["booking_id"]
    taken = owner.post(
        f"/api/projects/{PROJECT_ID}/bookings",
        json={"slot_start": SLOT, "customer_name": "Otra", "contact": "otra@example.com"},
    )
    assert taken.status_code == 409
    assert taken.json()["detail"]["code"] == "slot_taken"
    later = owner.post(
        f"/api/projects/{PROJECT_ID}/bookings",
        json={"slot_start": "2027-01-04T09:30:00+01:00", "customer_name": "Luis", "contact": "luis@example.com"},
    )
    assert later.status_code == 200
    outside = owner.post(
        f"/api/projects/{PROJECT_ID}/bookings",
        json={"slot_start": "2027-01-04T03:00:00+01:00", "customer_name": "Ana", "contact": "ana@example.com"},
    )
    assert outside.status_code == 422
    assert outside.json()["detail"]["code"] == "outside_hours"
    open_after = owner.get(f"/api/projects/{PROJECT_ID}/bookings/availability", params={"day": day})
    assert created.json()["slot_start"] not in open_after.json()["slots"]

    cancelled = owner.post(f"/api/projects/{PROJECT_ID}/bookings/{booking_id}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    again = owner.post(
        f"/api/projects/{PROJECT_ID}/bookings",
        json={"slot_start": SLOT, "customer_name": "Ana Ruiz", "contact": "+34600111222"},
    )
    assert again.status_code == 200
    removed = owner.delete(f"/api/projects/{PROJECT_ID}/bookings/{again.json()['booking_id']}")
    assert removed.status_code == 204
    listed = owner.get(f"/api/projects/{PROJECT_ID}/bookings")
    ids = [item["booking_id"] for item in listed.json()["bookings"]]
    assert again.json()["booking_id"] not in ids
    assert booking_id in ids


def test_reminders_use_the_whatsapp_adapter_and_skip_email(monkeypatch, caplog):
    flags_on(monkeypatch, "citas", "whatsapp")
    sent = []

    async def send_text(*, phone_number_id, to, body, transport=None):
        sent.append({"phone_number_id": phone_number_id, "to": to, "body": body})

    monkeypatch.setattr("backend.app.services.whatsapp.send_text", send_text)
    monkeypatch.setenv("BOOKINGS_REMINDER_SECRET", "reminder-secret")
    fake = FakeDB()
    seed(fake)
    client, actor = open_client(fake)
    actor.user = OWNER
    owner_client = client
    owner = client
    enable(owner_client, "whatsapp", {"phone_number_id": "123456789"})
    enable(owner_client, "citas", {
        "timezone": "Europe/Madrid",
        "slot_minutes": 30,
        "reminder_hours_before": 24,
        "weekly_hours": ALL_DAY,
    })
    zone = ZoneInfo("Europe/Madrid")
    candidate = datetime.now(zone) + timedelta(hours=2)
    candidate = candidate.replace(second=0, microsecond=0)
    candidate += timedelta(minutes=(30 - candidate.minute % 30) % 30)
    if candidate.hour >= 23:
        candidate = (candidate + timedelta(days=1)).replace(hour=10, minute=0)
    created = owner_client.post(
        f"/api/projects/{PROJECT_ID}/bookings",
        json={
            "slot_start": candidate.isoformat(),
            "customer_name": "Ana",
            "contact": "+34600999888",
            "note": "nota secreta que no sale",
        },
    )
    assert created.status_code == 200, created.text
    caplog.set_level(logging.WARNING)
    first = owner.post(
        "/api/agent/bookings/reminders/run",
        headers={"X-Reminder-Secret": "reminder-secret"},
    )
    assert first.status_code == 200, first.text
    assert first.json()["sent"] == 1
    assert sent[0]["to"] == "34600999888"
    assert sent[0]["phone_number_id"] == "123456789"
    assert "nota secreta que no sale" not in sent[0]["body"]
    assert "34600999888" not in caplog.text
    assert "nota secreta que no sale" not in caplog.text
    second = owner.post(
        "/api/agent/bookings/reminders/run",
        headers={"X-Reminder-Secret": "reminder-secret"},
    )
    assert second.json()["sent"] == 0
    assert len(sent) == 1

    email = owner_client.post(
        f"/api/projects/{PROJECT_ID}/bookings",
        json={
            "slot_start": (candidate + timedelta(minutes=30)).isoformat(),
            "customer_name": "Ana",
            "contact": "ana@example.com",
        },
    )
    assert email.status_code == 200, email.text
    skipped = owner.post(
        "/api/agent/bookings/reminders/run",
        headers={"X-Reminder-Secret": "reminder-secret"},
    )
    assert skipped.json()["skipped"] == 1
    assert len(sent) == 1
    assert "ana@example.com" not in caplog.text
    bad = owner.post("/api/agent/bookings/reminders/run", headers={"X-Reminder-Secret": "no"})
    assert bad.status_code == 403


def test_whatsapp_verify_signature_and_reply(monkeypatch, caplog):
    flags_on(monkeypatch, "whatsapp")
    calls = patch_reply(monkeypatch, "Te respondo enseguida.")
    sent = []

    async def send_text(*, phone_number_id, to, body, transport=None):
        sent.append({"phone_number_id": phone_number_id, "to": to, "body": body})

    monkeypatch.setattr("backend.app.services.whatsapp.send_text", send_text)
    monkeypatch.setenv("WHATSAPP_VERIFY_TOKEN", "verify-token")
    monkeypatch.setenv("WHATSAPP_APP_SECRET", "app-secret")
    fake = FakeDB()
    seed(fake)
    client, actor = open_client(fake)
    actor.user = OWNER
    owner = client
    public = client
    enable(owner, "whatsapp", {"phone_number_id": "123456789"})

    monkeypatch.setenv("AGENT_MODULE_WHATSAPP_ENABLED", "false")
    hidden = public.get(
        "/api/agent/whatsapp/webhook",
        params={"hub.mode": "subscribe", "hub.verify_token": "verify-token", "hub.challenge": "123456"},
    )
    assert hidden.status_code == 404
    monkeypatch.setenv("AGENT_MODULE_WHATSAPP_ENABLED", "true")
    handshake = public.get(
        "/api/agent/whatsapp/webhook",
        params={"hub.mode": "subscribe", "hub.verify_token": "verify-token", "hub.challenge": "123456"},
    )
    assert handshake.status_code == 200
    assert handshake.text == "123456"
    assert handshake.headers["x-whatsapp-integration"] == "proposal"
    rejected = public.get(
        "/api/agent/whatsapp/webhook",
        params={"hub.mode": "subscribe", "hub.verify_token": "otro", "hub.challenge": "123456"},
    )
    assert rejected.status_code == 403

    payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "metadata": {"phone_number_id": "123456789"},
                    "contacts": [{"profile": {"name": "No guardar este nombre"}}],
                    "messages": [{
                        "from": "34600111222",
                        "id": "wamid.1",
                        "type": "text",
                        "text": {"body": "mensaje secreto whatsapp 9988"},
                    }],
                }
            }]
        }]
    }
    raw = json.dumps(payload).encode()
    signature = "sha256=" + hmac.new(b"app-secret", raw, hashlib.sha256).hexdigest()
    caplog.set_level(logging.WARNING)
    bad = public.post(
        "/api/agent/whatsapp/webhook",
        content=raw,
        headers={"X-Hub-Signature-256": "sha256=deadbeef", "Content-Type": "application/json"},
    )
    assert bad.status_code == 403
    assert "mensaje secreto whatsapp 9988" not in caplog.text
    assert "category=signature" in caplog.text
    assert sent == []

    ok = public.post(
        "/api/agent/whatsapp/webhook",
        content=raw,
        headers={"X-Hub-Signature-256": signature, "Content-Type": "application/json"},
    )
    assert ok.status_code == 200, ok.text
    assert sent == [{
        "phone_number_id": "123456789",
        "to": "34600111222",
        "body": "Te respondo enseguida.",
    }]
    assert "No guardar este nombre" not in json.dumps(fake.agent_conversations.docs, default=str)
    again = public.post(
        "/api/agent/whatsapp/webhook",
        content=raw,
        headers={"X-Hub-Signature-256": signature, "Content-Type": "application/json"},
    )
    assert again.status_code == 200
    assert len(sent) == 1
    assert len(calls) == 1
    assert "app-secret" not in caplog.text


def _voice_body(speech=""):
    fields = {
        "CallSid": "CA1234567890ABCDE",
        "From": "+14158675309",
        "To": "+18005551212",
    }
    if speech:
        fields["SpeechResult"] = speech
    return urlencode(fields).encode()


def test_telephony_webhook_validates_signature_and_stays_a_proposal(monkeypatch, caplog):
    flags_on(monkeypatch, "voz")
    calls = patch_reply(monkeypatch, "Dime en qué te ayudo.")
    fake = FakeDB()
    seed(fake)
    client, actor = open_client(fake)
    actor.user = OWNER
    owner = client
    public = client
    enable(owner, "voz", {"inbound_number": "+18005551212"})
    monkeypatch.setenv("TELEPHONY_PROVIDER", "twilio")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "12345")
    monkeypatch.setenv("TELEPHONY_PUBLIC_URL", "https://example.com/api/agent/telephony/voice")
    caplog.set_level(logging.WARNING)

    monkeypatch.setenv("AGENT_MODULE_VOZ_ENABLED", "false")
    hidden = public.post("/api/agent/telephony/voice", content=_voice_body())
    assert hidden.status_code == 404
    monkeypatch.setenv("AGENT_MODULE_VOZ_ENABLED", "true")

    unsigned = public.post(
        "/api/agent/telephony/voice",
        content=_voice_body("secreto-voz-azul"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert unsigned.status_code == 403
    assert "secreto-voz-azul" not in caplog.text
    assert "category=signature" in caplog.text
    assert calls == []

    greeting_body = _voice_body()
    greeting_params = {
        "CallSid": "CA1234567890ABCDE",
        "From": "+14158675309",
        "To": "+18005551212",
    }
    greeting_sig = twilio_signature("12345", "https://example.com/api/agent/telephony/voice", greeting_params)
    greeting = public.post(
        "/api/agent/telephony/voice",
        content=greeting_body,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Twilio-Signature": greeting_sig,
        },
    )
    assert greeting.status_code == 200, greeting.text
    assert greeting.headers["x-telephony-production"] == "false"
    assert greeting.headers["x-telephony-adapter"] == "twilio-proposal"
    assert "<Say" in greeting.text
    assert "inteligencia artificial" in greeting.text
    assert calls == []

    speech = "quiero una cita"
    speech_params = dict(greeting_params)
    speech_params["SpeechResult"] = speech
    speech_body = urlencode(speech_params).encode()
    speech_sig = twilio_signature("12345", "https://example.com/api/agent/telephony/voice", speech_params)
    answered = public.post(
        "/api/agent/telephony/voice",
        content=speech_body,
        headers={"Content-Type": "application/x-www-form-urlencoded", "X-Twilio-Signature": speech_sig},
    )
    assert answered.status_code == 200, answered.text
    assert "Dime en qué te ayudo." in answered.text
    assert len(calls) == 1
    stored = json.dumps(fake.agent_conversations.docs, default=str)
    assert "+14158675309" not in stored
    repeated = public.post(
        "/api/agent/telephony/voice",
        content=speech_body,
        headers={"Content-Type": "application/x-www-form-urlencoded", "X-Twilio-Signature": speech_sig},
    )
    assert repeated.status_code == 200
    assert len(calls) == 1

    monkeypatch.setenv("TELEPHONY_PROVIDER", "mock")
    monkeypatch.setenv("TELEPHONY_MOCK_SECRET", "mock-secret")
    mock_body = urlencode({
        "CallSid": "CA9999999999ABCDE",
        "To": "+18005551212",
        "SpeechResult": "desde el mock",
    }).encode()
    mock_sig = hmac.new(b"mock-secret", mock_body, hashlib.sha256).hexdigest()
    bad_mock = public.post(
        "/api/agent/telephony/voice",
        content=mock_body,
        headers={"Content-Type": "application/x-www-form-urlencoded", "X-Mock-Signature": "no"},
    )
    assert bad_mock.status_code == 403
    mocked = public.post(
        "/api/agent/telephony/voice",
        content=mock_body,
        headers={"Content-Type": "application/x-www-form-urlencoded", "X-Mock-Signature": mock_sig},
    )
    assert mocked.status_code == 200, mocked.text
    assert mocked.json()["production"] is False
    assert mocked.json()["say"] == "Dime en qué te ayudo."
    assert mocked.headers["x-telephony-production"] == "false"


def test_erasure_removes_conversations_and_bookings(monkeypatch):
    flags_on(monkeypatch, "chat", "citas")
    patch_reply(monkeypatch)
    fake = FakeDB()
    seed(fake)
    owner, actor = open_client(fake)
    actor.user = OWNER
    key = widget_key(enable(owner, "chat"))
    enable(owner, "citas", {"weekly_hours": OFFICE, "timezone": "Europe/Madrid"})
    posted = owner.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers={"X-Widget-Key": key},
        json={"message": SECRET_TEXT},
    )
    assert posted.status_code == 200
    conversation_id = posted.json()["conversation_id"]
    created = owner.post(
        f"/api/projects/{PROJECT_ID}/bookings",
        json={"slot_start": SLOT, "customer_name": "Ana", "contact": "ana@example.com"},
    )
    assert created.status_code == 200
    usage_before = len(fake.agent_usage.docs)
    assert usage_before >= 1

    visitor = owner.delete(
        f"/api/agent/chat/{PROJECT_ID}/conversations/{conversation_id}",
        headers={"X-Widget-Key": key},
    )
    assert visitor.status_code == 204
    assert fake.agent_conversations.docs == []

    posted_again = owner.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers={"X-Widget-Key": key},
        json={"message": "otro mensaje"},
    )
    assert posted_again.status_code == 200
    monkeypatch.setenv("AGENT_MODULE_CHAT_ENABLED", "false")
    monkeypatch.setenv("AGENT_MODULE_CITAS_ENABLED", "false")
    erased = owner.delete(f"/api/projects/{PROJECT_ID}/agent-data")
    assert erased.status_code == 200, erased.text
    assert erased.json()["conversations_deleted"] == 1
    assert erased.json()["bookings_deleted"] == 1
    assert fake.agent_conversations.docs == []
    assert fake.agent_bookings.docs == []
    assert fake.agent_usage.docs
    blob = json.dumps(
        {"conversations": fake.agent_conversations.docs, "bookings": fake.agent_bookings.docs},
        default=str,
    )
    assert SECRET_TEXT not in blob
    assert "ana@example.com" not in blob
