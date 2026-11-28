"""Inbound voice webhook adapters.

There is no telephony account. The interface is real. The only provider
adapter is a proposal for Twilio Programmable Voice webhooks
(https://www.twilio.com/docs/usage/webhooks/voice-webhooks and
https://www.twilio.com/docs/usage/security#validating-requests). It is not
connected to a Twilio account and it must not be described as working in
production. Tests use the mock adapter, which never leaves this process.

Env:
  TELEPHONY_PROVIDER       twilio (proposal, the default) or mock
  TWILIO_AUTH_TOKEN        proposal only; empty in this repo
  TELEPHONY_PUBLIC_URL     exact https URL Twilio would call
  TELEPHONY_MOCK_SECRET    tests
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
from dataclasses import dataclass
from urllib.parse import parse_qs
from xml.sax.saxutils import escape

from backend.app.services.agent_modules import AgentModuleError, log_failure

PROPOSAL_PROVIDER = "twilio"
PRODUCTION_READY = False
_E164 = re.compile(r"^\+[1-9]\d{7,14}$")
_CALL_ID = re.compile(r"^[A-Za-z0-9]{6,64}$")


@dataclass(frozen=True)
class InboundCall:
    call_id: str
    to_number: str
    speech: str


def twilio_signature(auth_token: str, url: str, params: dict) -> str:
    """Twilio's published HMAC-SHA1 of the URL plus sorted POST fields."""
    material = url + "".join(key + params[key] for key in sorted(params))
    digest = hmac.new(auth_token.encode("utf-8"), material.encode("utf-8"), hashlib.sha1).digest()
    return base64.b64encode(digest).decode("ascii")


def _form(body: bytes) -> dict:
    try:
        text = body.decode("utf-8")
    except UnicodeDecodeError:
        return {}
    parsed = parse_qs(text, keep_blank_values=True)
    flat = {}
    for key, values in parsed.items():
        if not values:
            continue
        flat[key] = values[0]
    return flat


def _call_from_form(form: dict) -> InboundCall | None:
    call_id = form.get("CallSid") or ""
    number = (form.get("To") or "").strip()
    speech = (form.get("SpeechResult") or "").strip()[:2000]
    if not _CALL_ID.fullmatch(call_id) or not _E164.fullmatch(number):
        return None
    return InboundCall(call_id=call_id, to_number=number, speech=speech)


class TwilioVoiceAdapter:
    """Proposal adapter. PRODUCTION_READY stays false until an account exists."""

    name = "twilio-proposal"

    def configured(self) -> bool:
        token = (os.environ.get("TWILIO_AUTH_TOKEN") or "").strip()
        url = (os.environ.get("TELEPHONY_PUBLIC_URL") or "").strip()
        return bool(token) and url.startswith("https://")

    def signature_ok(self, body: bytes, headers) -> bool:
        token = (os.environ.get("TWILIO_AUTH_TOKEN") or "").strip()
        url = (os.environ.get("TELEPHONY_PUBLIC_URL") or "").strip()
        presented = (headers.get("x-twilio-signature") or "").strip()
        if not token or not url.startswith("https://") or not presented:
            return False
        expected = twilio_signature(token, url, _form(body))
        return hmac.compare_digest(expected, presented)

    def parse(self, body: bytes) -> InboundCall | None:
        # From is intentionally dropped. The call id is enough to continue the call.
        return _call_from_form(_form(body))

    def render(self, say: str) -> tuple[str, str]:
        safe = escape(" ".join((say or "").split())[:500])
        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            "<Response>"
            '<Gather input="speech" language="es-ES" speechTimeout="auto">'
            f'<Say language="es-ES">{safe}</Say>'
            "</Gather>"
            "</Response>"
        )
        return "application/xml", xml


class MockTelephonyAdapter:
    """In-process adapter. The signature is HMAC-SHA256 of the raw body."""

    name = "mock"

    def configured(self) -> bool:
        return bool((os.environ.get("TELEPHONY_MOCK_SECRET") or "").strip())

    def signature_ok(self, body: bytes, headers) -> bool:
        secret = (os.environ.get("TELEPHONY_MOCK_SECRET") or "").strip()
        presented = (headers.get("x-mock-signature") or "").strip()
        if not secret or not presented:
            return False
        expected = hmac.new(secret.encode("utf-8"), bytes(body), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, presented)

    def parse(self, body: bytes) -> InboundCall | None:
        return _call_from_form(_form(body))

    def render(self, say: str) -> tuple[str, str]:
        payload = {"say": " ".join((say or "").split())[:500], "gather": True, "production": False}
        return "application/json", json.dumps(payload, ensure_ascii=False)


def build_adapter():
    name = (os.environ.get("TELEPHONY_PROVIDER") or PROPOSAL_PROVIDER).strip().lower()
    if name == "mock":
        adapter = MockTelephonyAdapter()
    elif name == PROPOSAL_PROVIDER:
        adapter = TwilioVoiceAdapter()
    else:
        log_failure("config", "voz")
        raise AgentModuleError("config", 503)
    if not adapter.configured():
        log_failure("config", "voz")
        raise AgentModuleError("config", 503)
    return adapter


def normalize_voz_settings(raw) -> dict:
    incoming = raw if isinstance(raw, dict) else {}
    number = incoming.get("inbound_number")
    if not isinstance(number, str) or not _E164.fullmatch(number.strip()):
        raise AgentModuleError("invalid_settings", 422)
    greeting = incoming.get("greeting") or ""
    if not isinstance(greeting, str) or len(greeting) > 240:
        raise AgentModuleError("invalid_settings", 422)
    settings = {"inbound_number": number.strip()}
    clean = " ".join(greeting.split())
    if clean:
        settings["greeting"] = clean[:240]
    return settings


def response_headers(adapter) -> dict:
    return {
        "X-Telephony-Adapter": adapter.name,
        "X-Telephony-Production": "true" if PRODUCTION_READY else "false",
    }
