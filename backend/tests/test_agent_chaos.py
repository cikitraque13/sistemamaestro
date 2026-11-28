"""Fail-fast validation and fault injection for chat, voice, WhatsApp, and bookings.

A bad payload must not write a conversation, a booking, or a rate bucket, and
must not call the model. Upstream and Mongo faults return 504, 502, or 503
without leaving a claim or a half-written appointment, and the next call works.
"""

import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

import httpx
from pymongo.errors import AutoReconnect, ServerSelectionTimeoutError

from test_agent_modules import (
    OFFICE,
    OWNER,
    PROJECT_ID,
    SLOT,
    enable,
    flags_on,
    open_client,
    seed,
    widget_key,
)
from backend.app.services.telephony import twilio_signature

PUBLIC_URL = "https://example.com/api/agent/telephony/voice"


def _chat(client, key, payload, ip="203.0.113.8"):
    return client.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers={"X-Widget-Key": key, "X-Forwarded-For": ip},
        json=payload,
    )


def _ready_chat(monkeypatch):
    flags_on(monkeypatch, "chat")
    calls = []

    async def complete_turn(messages, tools=None):
        calls.append(messages)
        return {"content": "De acuerdo."}

    monkeypatch.setattr("backend.app.services.agent_chat.complete_turn", complete_turn)
    fake_db = __import__("agent_module_fakes", fromlist=["FakeDB"]).FakeDB()
    seed(fake_db)
    client, actor = open_client(fake_db)
    actor.user = OWNER
    key = widget_key(enable(client, "chat"))
    return client, fake_db, key, calls


def _assert_fast(started: float) -> None:
    assert time.monotonic() - started < 1.0


def _detail(response):
    return response.json()["detail"]


def test_chat_rejects_bad_input_before_any_write(monkeypatch):
    client, fake, key, calls = _ready_chat(monkeypatch)
    before_rates = len(fake.agent_rate_windows.docs)
    cases = [
        ({"message": "   "}, 422, "empty_message"),
        ({"message": ""}, 422, "empty_message"),
        ({"message": "hola\x00"}, 422, "invalid_input"),
        ({"message": "<script>alert(1)</script>"}, 422, "invalid_input"),
        ({"message": "javascript:alert(1)"}, 422, "invalid_input"),
        ({"message": "hola", "injected": True}, 422, "unexpected_field"),
        ({"message": "a" * 2001}, 422, "too_long"),
    ]
    for payload, status, code in cases:
        started = time.monotonic()
        response = _chat(client, key, payload)
        _assert_fast(started)
        assert response.status_code == status, response.text
        assert _detail(response)["code"] == code
        assert _detail(response)["message"]
    huge = b'{"message":"' + (b"a" * (30 * 1024)) + b'"}'
    started = time.monotonic()
    oversized = client.post(
        f"/api/agent/chat/{PROJECT_ID}/messages",
        headers={"X-Widget-Key": key, "Content-Type": "application/json"},
        content=huge,
    )
    _assert_fast(started)
    assert oversized.status_code == 413
    assert _detail(oversized)["code"] == "payload_too_large"
    assert calls == []
    assert fake.agent_conversations.docs == []
    assert fake.agent_bookings.docs == []
    assert len(fake.agent_rate_windows.docs) == before_rates

    ok = _chat(client, key, {"message": "2 < 3, hola"})
    assert ok.status_code == 200, ok.text
    assert ok.json()["reply"] == "De acuerdo."
    assert len(calls) == 1


def test_account_rate_limit_returns_retry_after(monkeypatch):
    client, fake, key, calls = _ready_chat(monkeypatch)
    monkeypatch.setenv("AGENT_ACCOUNT_RATE_LIMIT", "2")
    monkeypatch.setenv("AGENT_ACCOUNT_RATE_WINDOW_SECONDS", "60")
    for index, ip in enumerate(("198.51.100.1", "198.51.100.2")):
        allowed = _chat(client, key, {"message": f"hola {index}"}, ip=ip)
        assert allowed.status_code == 200, allowed.text
    started = time.monotonic()
    blocked = _chat(client, key, {"message": "tercera"}, ip="198.51.100.3")
    _assert_fast(started)
    assert blocked.status_code == 429
    assert _detail(blocked)["code"] == "rate_limited"
    assert _detail(blocked)["message"]
    retry_after = int(blocked.headers["retry-after"])
    assert 1 <= retry_after <= 60
    assert len(calls) == 2
    assert len(fake.agent_conversations.docs) == 2


def test_booking_input_is_rejected_before_insert(monkeypatch):
    flags_on(monkeypatch, "citas")
    fake = __import__("agent_module_fakes", fromlist=["FakeDB"]).FakeDB()
    seed(fake)
    client, actor = open_client(fake)
    actor.user = OWNER
    enable(client, "citas", {"timezone": "Europe/Madrid", "slot_minutes": 30, "weekly_hours": OFFICE})

    def post(body, headers=None):
        return client.post(f"/api/projects/{PROJECT_ID}/bookings", json=body, headers=headers)

    base = {"slot_start": SLOT, "customer_name": "Ana Ruiz", "contact": "+34600111222"}
    cases = [
        ({**base, "contact": "600111222"}, "invalid_phone"),
        ({**base, "contact": "+0123456789"}, "invalid_phone"),
        ({**base, "customer_name": "<b>Ana</b>"}, "invalid_input"),
        ({**base, "customer_name": "Ana", "note": "x" * 241}, "too_long"),
        ({**base, "slot_start": "2027-02-31T09:00:00+01:00"}, "invalid_slot"),
        ({**base, "slot_start": "2027-01-04T09:00:00"}, "invalid_slot"),
        ({**base, "slot_start": "2028-06-06T09:00:00+02:00"}, "invalid_slot"),
        ({**base, "extra": 1}, "unexpected_field"),
    ]
    for body, code in cases:
        started = time.monotonic()
        response = post(body)
        _assert_fast(started)
        assert response.status_code in {413, 422}, response.text
        assert _detail(response)["code"] == code
        assert fake.agent_bookings.docs == []

    bad_zone = client.put(
        f"/api/projects/{PROJECT_ID}/modules/citas",
        json={"enabled": True, "settings": {"timezone": "Mars/Olympus", "weekly_hours": OFFICE}},
    )
    assert bad_zone.status_code == 422
    assert _detail(bad_zone)["code"] == "invalid_timezone"
    bad_path = client.put(
        f"/api/projects/{PROJECT_ID}/modules/citas",
        json={"enabled": True, "settings": {"timezone": "../etc/passwd", "weekly_hours": OFFICE}},
    )
    assert bad_path.status_code == 422
    assert _detail(bad_path)["code"] == "invalid_timezone"

    formatted = post({**base, "contact": "+34 600 111 222"})
    assert formatted.status_code == 200, formatted.text
    assert formatted.json()["contact"] == "+34600111222"
    assert formatted.json()["status"] == "confirmed"
    assert len(fake.agent_bookings.docs) == 1


def test_booking_idempotency_and_no_double_book(monkeypatch):
    flags_on(monkeypatch, "citas")
    fake = __import__("agent_module_fakes", fromlist=["FakeDB"]).FakeDB()
    seed(fake)
    client, actor = open_client(fake)
    actor.user = OWNER
    enable(client, "citas", {"timezone": "Europe/Madrid", "slot_minutes": 30, "weekly_hours": OFFICE})
    body = {"slot_start": SLOT, "customer_name": "Ana Ruiz", "contact": "+34600111222", "note": "nota"}
    headers = {"Idempotency-Key": "retry-key-01"}
    first = client.post(f"/api/projects/{PROJECT_ID}/bookings", json=body, headers=headers)
    second = client.post(f"/api/projects/{PROJECT_ID}/bookings", json=body, headers=headers)
    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert first.json()["booking_id"] == second.json()["booking_id"]
    assert len(fake.agent_bookings.docs) == 1
    assert fake.agent_bookings.docs[0]["status"] == "confirmed"

    conflict = client.post(
        f"/api/projects/{PROJECT_ID}/bookings",
        json={**body, "slot_start": "2027-01-04T09:30:00+01:00"},
        headers=headers,
    )
    assert conflict.status_code == 409
    assert _detail(conflict)["code"] == "idempotency_conflict"
    assert len(fake.agent_bookings.docs) == 1

    taken = client.post(
        f"/api/projects/{PROJECT_ID}/bookings",
        json={**body, "customer_name": "Otra", "contact": "otra@example.com"},
    )
    assert taken.status_code == 409
    assert _detail(taken)["code"] == "slot_taken"
    assert len(fake.agent_bookings.docs) == 1


def test_grok_timeout_and_connect_error_then_recovery(monkeypatch, caplog):
    flags_on(monkeypatch, "chat")
    monkeypatch.setenv("GROK_API_KEY", "xai-test-key")
    monkeypatch.setenv("GROK_MODEL", "grok-4.3")
    monkeypatch.setenv("BUILDER_EXECUTOR_ORCHESTRATOR", "grok")
    fake = __import__("agent_module_fakes", fromlist=["FakeDB"]).FakeDB()
    seed(fake)
    client, actor = open_client(fake)
    actor.user = OWNER
    key = widget_key(enable(client, "chat"))

    class TimeoutClient:
        def __init__(self, **kwargs):
            assert kwargs.get("max_retries") == 0
            assert 0 < float(kwargs.get("timeout")) <= 60
            self.chat = self
            self.completions = self

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def create(self, **kwargs):
            raise TimeoutError("xai-test-key")

    monkeypatch.setattr("backend.app.ai.providers.grok_client.GrokChatClient", TimeoutClient)
    caplog.set_level("WARNING")
    started = time.monotonic()
    timed_out = _chat(client, key, {"message": "hola"})
    _assert_fast(started)
    assert timed_out.status_code == 504
    assert _detail(timed_out)["code"] == "provider_timeout"
    assert "xai-test-key" not in timed_out.text
    assert "xai-test-key" not in caplog.text
    assert fake.agent_conversations.docs == []
    assert fake.agent_bookings.docs == []

    class ConnectClient(TimeoutClient):
        async def create(self, **kwargs):
            raise httpx.ConnectError("network down")

    monkeypatch.setattr("backend.app.ai.providers.grok_client.GrokChatClient", ConnectClient)
    started = time.monotonic()
    offline = _chat(client, key, {"message": "hola de nuevo"}, ip="203.0.113.9")
    _assert_fast(started)
    assert offline.status_code == 502
    assert _detail(offline)["code"] == "bad_gateway"
    assert "network down" not in offline.text
    assert fake.agent_conversations.docs == []

    async def complete_turn(messages, tools=None):
        return {"content": "ya respondo"}

    monkeypatch.setattr("backend.app.services.agent_chat.complete_turn", complete_turn)
    recovered = _chat(client, key, {"message": "otra vez"}, ip="203.0.113.10")
    assert recovered.status_code == 200, recovered.text
    assert recovered.json()["reply"] == "ya respondo"
    assert len(fake.agent_conversations.docs) == 1


def test_anthropic_timeout_is_504_and_the_next_call_works(monkeypatch):
    flags_on(monkeypatch, "chat")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setenv("ANTHROPIC_MODEL", "claude-haiku-5-5")
    monkeypatch.setenv("BUILDER_EXECUTOR_ORCHESTRATOR", "anthropic")
    fake = __import__("agent_module_fakes", fromlist=["FakeDB"]).FakeDB()
    seed(fake)
    client, actor = open_client(fake)
    actor.user = OWNER
    key = widget_key(enable(client, "chat"))

    class APITimeoutError(Exception):
        pass

    class Client:
        def __init__(self, **kwargs):
            assert kwargs.get("max_retries") == 0
            assert 0 < float(kwargs.get("timeout")) <= 60
            self.messages = self

        async def create(self, **kwargs):
            raise APITimeoutError("slow")

        async def close(self):
            return None

    monkeypatch.setattr("anthropic.AsyncAnthropic", Client)
    started = time.monotonic()
    response = _chat(client, key, {"message": "hola"})
    _assert_fast(started)
    assert response.status_code == 504
    assert _detail(response)["code"] == "provider_timeout"
    assert "sk-ant-test" not in response.text
    assert fake.agent_conversations.docs == []

    async def complete_turn(messages, tools=None):
        return {"content": "recuperado"}

    monkeypatch.setattr("backend.app.services.agent_chat.complete_turn", complete_turn)
    monkeypatch.setenv("BUILDER_EXECUTOR_ORCHESTRATOR", "grok")
    recovered = _chat(client, key, {"message": "sigo"}, ip="203.0.113.11")
    assert recovered.status_code == 200, recovered.text
    assert len(fake.agent_conversations.docs) == 1


def test_mongo_outage_does_not_leave_a_booking_or_a_conversation(monkeypatch):
    flags_on(monkeypatch, "chat", "citas")
    calls = []

    async def complete_turn(messages, tools=None):
        calls.append(1)
        return {"content": "ok"}

    monkeypatch.setattr("backend.app.services.agent_chat.complete_turn", complete_turn)
    fake = __import__("agent_module_fakes", fromlist=["FakeDB"]).FakeDB()
    seed(fake)
    client, actor = open_client(fake)
    actor.user = OWNER
    key = widget_key(enable(client, "chat"))
    enable(client, "citas", {"timezone": "Europe/Madrid", "weekly_hours": OFFICE, "slot_minutes": 30})

    original_insert = fake.agent_bookings.insert_one

    async def fail_insert(doc):
        raise AutoReconnect("mongo-down")

    fake.agent_bookings.insert_one = fail_insert
    body = {"slot_start": SLOT, "customer_name": "Ana", "contact": "+34600111222"}
    started = time.monotonic()
    failed = client.post(f"/api/projects/{PROJECT_ID}/bookings", json=body)
    _assert_fast(started)
    assert failed.status_code == 503
    assert _detail(failed)["code"] == "store"
    assert "mongo-down" not in failed.text
    assert fake.agent_bookings.docs == []

    fake.agent_bookings.insert_one = original_insert
    created = client.post(f"/api/projects/{PROJECT_ID}/bookings", json=body)
    assert created.status_code == 200, created.text
    assert len(fake.agent_bookings.docs) == 1
    assert fake.agent_bookings.docs[0]["status"] == "confirmed"

    original_update = fake.agent_conversations.update_one

    async def fail_update(query, update, upsert=False):
        raise ServerSelectionTimeoutError("slow-store")

    fake.agent_conversations.update_one = fail_update
    started = time.monotonic()
    saved = _chat(client, key, {"message": "guarda esto"})
    _assert_fast(started)
    assert saved.status_code == 504
    assert _detail(saved)["code"] == "store_timeout"
    assert "slow-store" not in saved.text
    assert fake.agent_conversations.docs == []
    assert len(calls) == 1

    fake.agent_conversations.update_one = original_update
    again = _chat(client, key, {"message": "ahora si"}, ip="203.0.113.12")
    assert again.status_code == 200, again.text
    assert len(fake.agent_conversations.docs) == 1


def _wa_signature(raw: bytes) -> str:
    return "sha256=" + hmac.new(b"app-secret", raw, hashlib.sha256).hexdigest()


def test_whatsapp_send_timeout_releases_the_claim_and_retry_sends_once(monkeypatch):
    flags_on(monkeypatch, "whatsapp")
    calls = []

    async def complete_turn(messages, tools=None):
        calls.append(1)
        return {"content": "respuesta"}

    monkeypatch.setattr("backend.app.services.agent_chat.complete_turn", complete_turn)
    monkeypatch.setenv("WHATSAPP_APP_SECRET", "app-secret")
    sent = []

    async def send_text(*, phone_number_id, to, body, transport=None):
        if not sent:
            raise TimeoutError("graph timeout")
        sent.append({"to": to, "body": body})

    monkeypatch.setattr("backend.app.services.whatsapp.send_text", send_text)
    fake = __import__("agent_module_fakes", fromlist=["FakeDB"]).FakeDB()
    seed(fake)
    client, actor = open_client(fake)
    actor.user = OWNER
    enable(client, "whatsapp", {"phone_number_id": "123456789"})
    payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "metadata": {"phone_number_id": "123456789"},
                    "messages": [{
                        "from": "34600111222",
                        "id": "wamid.chaos",
                        "type": "text",
                        "text": {"body": "hola"},
                    }],
                }
            }]
        }]
    }
    raw = json.dumps(payload).encode()
    headers = {"X-Hub-Signature-256": _wa_signature(raw), "Content-Type": "application/json"}
    started = time.monotonic()
    failed = client.post("/api/agent/whatsapp/webhook", content=raw, headers=headers)
    _assert_fast(started)
    assert failed.status_code == 504
    assert _detail(failed)["code"] == "provider_timeout"
    assert fake.agent_inbound_events.docs == []
    assert sent == []

    async def send_ok(*, phone_number_id, to, body, transport=None):
        sent.append({"to": to, "body": body})

    monkeypatch.setattr("backend.app.services.whatsapp.send_text", send_ok)
    retried = client.post("/api/agent/whatsapp/webhook", content=raw, headers=headers)
    assert retried.status_code == 200, retried.text
    assert sent == [{"to": "34600111222", "body": "respuesta"}]
    assert len(calls) == 2
    assert fake.agent_inbound_events.docs

    malicious = {
        "entry": [{
            "changes": [{
                "value": {
                    "metadata": {"phone_number_id": "123456789"},
                    "messages": [{
                        "from": "12",
                        "id": "wamid.bad",
                        "type": "text",
                        "text": {"body": "<script>alert(1)</script>"},
                    }],
                }
            }]
        }]
    }
    bad_raw = json.dumps(malicious).encode()
    rejected = client.post(
        "/api/agent/whatsapp/webhook",
        content=bad_raw,
        headers={"X-Hub-Signature-256": _wa_signature(bad_raw), "Content-Type": "application/json"},
    )
    assert rejected.status_code == 422
    assert _detail(rejected)["code"] in {"invalid_phone", "invalid_input"}
    assert len(calls) == 2


def _voice(client, fields):
    body = urlencode(fields).encode()
    signature = twilio_signature("12345", PUBLIC_URL, fields)
    return client.post(
        "/api/agent/telephony/voice",
        content=body,
        headers={"Content-Type": "application/x-www-form-urlencoded", "X-Twilio-Signature": signature},
    )


def test_voice_rejects_script_and_a_timeout_can_be_retried(monkeypatch):
    flags_on(monkeypatch, "voz")
    calls = []

    async def complete_turn(messages, tools=None):
        calls.append(1)
        if len(calls) == 1:
            raise TimeoutError("voice timeout")
        return {"content": "dime"}

    monkeypatch.setattr("backend.app.services.agent_chat.complete_turn", complete_turn)
    monkeypatch.setenv("TELEPHONY_PROVIDER", "twilio")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "12345")
    monkeypatch.setenv("TELEPHONY_PUBLIC_URL", PUBLIC_URL)
    fake = __import__("agent_module_fakes", fromlist=["FakeDB"]).FakeDB()
    seed(fake)
    client, actor = open_client(fake)
    actor.user = OWNER
    enable(client, "voz", {"inbound_number": "+18005551212"})
    fields = {
        "CallSid": "CA1234567890ABCDE",
        "From": "+14158675309",
        "To": "+18005551212",
        "SpeechResult": "<script>alert(1)</script>",
    }
    rejected = _voice(client, fields)
    assert rejected.status_code == 422
    assert _detail(rejected)["code"] == "invalid_input"
    assert calls == []
    assert fake.agent_inbound_events.docs == []

    fields["SpeechResult"] = "quiero una cita"
    started = time.monotonic()
    failed = _voice(client, fields)
    _assert_fast(started)
    assert failed.status_code == 504
    assert _detail(failed)["code"] == "provider_timeout"
    assert fake.agent_inbound_events.docs == []
    assert fake.agent_conversations.docs == []

    retried = _voice(client, fields)
    assert retried.status_code == 200, retried.text
    assert "dime" in retried.text
    assert len(calls) == 2
    assert len(fake.agent_conversations.docs) == 1


def test_reminder_timeout_clears_the_claim_and_a_stale_claim_is_sent(monkeypatch):
    flags_on(monkeypatch, "citas", "whatsapp")
    monkeypatch.setenv("BOOKINGS_REMINDER_SECRET", "reminder-secret")
    sent = []

    async def send_text(*, phone_number_id, to, body, transport=None):
        if not sent:
            raise TimeoutError("reminder timeout")
        sent.append(to)

    monkeypatch.setattr("backend.app.services.whatsapp.send_text", send_text)
    fake = __import__("agent_module_fakes", fromlist=["FakeDB"]).FakeDB()
    seed(fake)
    client, actor = open_client(fake)
    actor.user = OWNER
    enable(client, "whatsapp", {"phone_number_id": "123456789"})
    enable(client, "citas", {
        "timezone": "Europe/Madrid",
        "slot_minutes": 30,
        "reminder_hours_before": 24,
        "weekly_hours": {day: [["00:00", "23:30"]] for day in (
            "mon", "tue", "wed", "thu", "fri", "sat", "sun",
        )},
    })
    local = datetime.now(ZoneInfo("Europe/Madrid")) + timedelta(hours=3)
    local = local.replace(second=0, microsecond=0)
    local += timedelta(minutes=(30 - local.minute % 30) % 30)
    if local.hour >= 23:
        local = (local + timedelta(days=1)).replace(hour=10, minute=0)
    created = client.post(
        f"/api/projects/{PROJECT_ID}/bookings",
        json={
            "slot_start": local.isoformat(),
            "customer_name": "Ana",
            "contact": "+34600999888",
        },
    )
    assert created.status_code == 200, created.text
    started = time.monotonic()
    failed = client.post(
        "/api/agent/bookings/reminders/run",
        headers={"X-Reminder-Secret": "reminder-secret"},
    )
    _assert_fast(started)
    assert failed.status_code == 504
    assert _detail(failed)["code"] == "provider_timeout"
    assert fake.agent_bookings.docs[0].get("reminder_claimed_at") is None
    assert fake.agent_bookings.docs[0].get("reminder_sent_at") is None
    assert fake.agent_bookings.docs[0]["status"] == "confirmed"

    async def send_ok(*, phone_number_id, to, body, transport=None):
        sent.append(to)

    monkeypatch.setattr("backend.app.services.whatsapp.send_text", send_ok)
    ok = client.post(
        "/api/agent/bookings/reminders/run",
        headers={"X-Reminder-Secret": "reminder-secret"},
    )
    assert ok.status_code == 200, ok.text
    assert ok.json()["sent"] == 1
    assert sent == ["34600999888"]

    fake.agent_bookings.docs[0]["reminder_sent_at"] = None
    fake.agent_bookings.docs[0]["reminder_claimed_at"] = datetime.now(timezone.utc) - timedelta(minutes=10)
    sent.clear()
    stale = client.post(
        "/api/agent/bookings/reminders/run",
        headers={"X-Reminder-Secret": "reminder-secret"},
    )
    assert stale.status_code == 200, stale.text
    assert stale.json()["sent"] == 1
    assert sent == ["34600999888"]
    assert fake.agent_bookings.docs[0].get("reminder_sent_at") is not None
