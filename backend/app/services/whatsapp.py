"""WhatsApp Business Cloud API webhook.

This is not a live integration. No access token, app secret, or phone number
is stored in the repo. The names below are the env vars a future account would
fill in. The global flag defaults off, and tests use a fake sender.

Env:
  WHATSAPP_VERIFY_TOKEN
  WHATSAPP_APP_SECRET
  WHATSAPP_ACCESS_TOKEN
  WHATSAPP_GRAPH_VERSION  (optional, default v21.0)
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re

from backend.app.services.agent_guard import (
    WHATSAPP_TEXT_MAX,
    WHATSAPP_TIMEOUT_SECONDS,
    classify_provider,
    e164_digits,
    reject_unknown,
    require_plain_text,
    timeout_seconds,
    wamid_ok,
)
from backend.app.services.agent_modules import AgentModuleError, log_failure

GRAPH_HOST = "https://graph.facebook.com"
_VERSION = re.compile(r"^v\d+\.\d+$")
_CHALLENGE = re.compile(r"^[A-Za-z0-9]{1,128}$")


def verify_token() -> str:
    return (os.environ.get("WHATSAPP_VERIFY_TOKEN") or "").strip()


def app_secret() -> str:
    return (os.environ.get("WHATSAPP_APP_SECRET") or "").strip()


def access_token() -> str:
    return (os.environ.get("WHATSAPP_ACCESS_TOKEN") or "").strip()


def normalize_whatsapp_settings(raw) -> dict:
    if raw is None:
        raw = {}
    if not isinstance(raw, dict):
        raise AgentModuleError("invalid_settings", 422)
    reject_unknown(raw, {"phone_number_id"}, "whatsapp")
    phone_number_id = raw.get("phone_number_id")
    if not isinstance(phone_number_id, str) or not re.fullmatch(r"\d{6,20}", phone_number_id.strip()):
        raise AgentModuleError("invalid_settings", 422)
    return {"phone_number_id": phone_number_id.strip()}


def signature_ok(body: bytes, header: str) -> bool:
    secret = app_secret()
    presented = (header or "").strip()
    if not secret or not presented or not isinstance(body, (bytes, bytearray)):
        return False
    expected = "sha256=" + hmac.new(secret.encode("utf-8"), bytes(body), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, presented)


def handshake(mode: str, token: str, challenge: str) -> str:
    if not isinstance(mode, str) or not isinstance(token, str) or not isinstance(challenge, str):
        log_failure("schema", "whatsapp")
        raise AgentModuleError("schema", 400, "La solicitud no es válida.")
    if len(mode) > 32 or len(token) > 256 or len(challenge) > 128:
        log_failure("schema", "whatsapp")
        raise AgentModuleError("schema", 400, "La solicitud no es válida.")
    expected = verify_token()
    if not expected:
        log_failure("config", "whatsapp")
        raise AgentModuleError("config", 503)
    if mode != "subscribe" or not token or not hmac.compare_digest(expected, token):
        log_failure("signature", "whatsapp")
        raise AgentModuleError("signature", 403)
    if not _CHALLENGE.fullmatch(challenge or ""):
        log_failure("schema", "whatsapp")
        raise AgentModuleError("schema", 400)
    return challenge


def extract_text_messages(payload) -> list:
    """Text messages only. Profile names and media are dropped."""
    found = []
    if not isinstance(payload, dict):
        return found
    for entry in payload.get("entry") or []:
        if not isinstance(entry, dict):
            continue
        for change in entry.get("changes") or []:
            value = change.get("value") if isinstance(change, dict) else None
            if not isinstance(value, dict):
                continue
            metadata = value.get("metadata") if isinstance(value.get("metadata"), dict) else {}
            phone_number_id = metadata.get("phone_number_id")
            for message in value.get("messages") or []:
                if not isinstance(message, dict) or message.get("type") != "text":
                    continue
                text_block = message.get("text") if isinstance(message.get("text"), dict) else {}
                text = text_block.get("body") if isinstance(text_block.get("body"), str) else ""
                wa_id = message.get("from") if isinstance(message.get("from"), str) else ""
                message_id = message.get("id") if isinstance(message.get("id"), str) else ""
                if not (
                    isinstance(phone_number_id, str)
                    and wa_id
                    and message_id
                    and text.strip()
                ):
                    continue
                if not re.fullmatch(r"\d{6,20}", phone_number_id):
                    log_failure("schema", "whatsapp")
                    raise AgentModuleError("schema", 400, "La solicitud no es válida.")
                e164_digits(wa_id, module="whatsapp")
                if not wamid_ok(message_id):
                    log_failure("schema", "whatsapp")
                    raise AgentModuleError("schema", 400, "La solicitud no es válida.")
                found.append({
                    "phone_number_id": phone_number_id,
                    "wa_id": wa_id,
                    "message_id": message_id,
                    "text": require_plain_text(text, max_len=WHATSAPP_TEXT_MAX, module="whatsapp"),
                })
                if len(found) == 5:
                    return found
    return found


def parse_payload(body: bytes):
    try:
        return json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        log_failure("schema", "whatsapp")
        raise AgentModuleError("schema", 400, "La solicitud no es válida.") from None


async def _post(version: str, phone_number_id: str, token: str, payload: dict) -> int:
    import httpx

    url = f"{GRAPH_HOST}/{version}/{phone_number_id}/messages"
    timeout = timeout_seconds("AGENT_WHATSAPP_TIMEOUT_SECONDS", WHATSAPP_TIMEOUT_SECONDS)
    async with httpx.AsyncClient(timeout=timeout) as http:
        response = await http.post(
            url,
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
        )
    return response.status_code


async def send_text(*, phone_number_id: str, to: str, body: str, transport=None) -> None:
    """Send one text. Failures log a category and never the body or the token.

    TODO(gems): sending a WhatsApp message, whether a reply or a reminder,
    can cost gems. Do not charge here. Prices are not decided.
    """
    token = access_token()
    version = (os.environ.get("WHATSAPP_GRAPH_VERSION") or "v21.0").strip() or "v21.0"
    if not token or not phone_number_id or not to or not _VERSION.fullmatch(version):
        log_failure("config", "whatsapp")
        raise AgentModuleError("config", 503)
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {"preview_url": False, "body": (body or "")[:1000]},
    }
    post = transport or _post
    try:
        status = await post(version, phone_number_id, token, payload)
    except AgentModuleError:
        raise
    except Exception as exc:
        raise classify_provider(exc, "whatsapp") from None
    if status == 200:
        return
    if status in {408, 504}:
        log_failure("provider_timeout", "whatsapp")
        raise AgentModuleError("provider_timeout", 504)
    if status in {500, 502} or (400 <= status < 500 and status != 429):
        log_failure("bad_gateway", "whatsapp")
        raise AgentModuleError("bad_gateway", 502)
    log_failure("provider", "whatsapp")
    raise AgentModuleError("provider", 503)
