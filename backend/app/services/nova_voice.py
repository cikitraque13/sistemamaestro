"""Voz de Nova en la portada.

Grok Voice es opcional y solo se usa en el servidor. GROK_API_KEY no sale de
este proceso: el navegador recibe un token efímero. Si no hay clave, el
proveedor está apagado o el proveedor falla, no se lanza una excepción hacia
la página: el cliente usa la voz del navegador y, si esa tampoco está, texto.
"""

from __future__ import annotations

import os
import time
from typing import Mapping

import httpx

XAI_CLIENT_SECRETS_URL = "https://api.x.ai/v1/realtime/client_secrets"
GROK_REALTIME_URL = (
    "wss://api.x.ai/v1/realtime?model=grok-voice-latest&reasoning.effort=none"
)
TOKEN_SECONDS = 60
OUTPUT_SAMPLE_RATE = 24000
DEFAULT_VOICE = "ara"

NOVA_GREETING = (
    "Hola, soy Nova, asistente de inteligencia artificial de Sistema Maestro. "
    "Estoy aquí para explicarte el producto con claridad y resolver tus dudas. "
    "¿Me cuentas en una frase qué negocio tienes y qué te trae por aquí?"
)

NOVA_INSTRUCTIONS = f"""Eres Nova, la asistente de voz de Sistema Maestro en la demo pública de la portada.

# Idioma y voz
Habla siempre en español de España (es-ES), con acento neutro de España.
No uses acento andaluz, malagueño ni de ninguna otra región.
No cambies de idioma salvo que el visitante te lo pida. Si dudas, sigue en español de España.
Frases cortas, claras, pensadas para oírse. Sin listas largas ni markdown.

# Identidad
Te presentas siempre como Nova. No uses otro nombre.
Eres una asistente de inteligencia artificial. No digas que eres humana.

# Saludo
En el primer turno, di exactamente este saludo y espera:
{NOVA_GREETING}

# Producto
Sistema Maestro construye la web de un negocio, la lanza y pone un agente de inteligencia artificial a atender a los clientes por chat, web o WhatsApp.
Responde a las dudas sobre esa idea con claridad.
Si no conoces un precio, un dato de cuenta o un detalle que no esté en estas instrucciones, dilo con honestidad y sugiere seguir en la web. No inventes precios, planes ni datos del visitante.

# Límites
No pidas contraseñas ni datos de pago.
No afirmes que has hecho una llamada, un cobro o un cambio en la cuenta del visitante.
"""

ALLOWED_VOICES = frozenset(
    {
        "altair",
        "ara",
        "atlas",
        "aurora",
        "carina",
        "castor",
        "celeste",
        "cosmo",
        "eve",
        "helios",
        "helix",
        "iris",
        "kepler",
        "leo",
        "liora",
        "lumen",
        "luna",
        "lux",
        "naksh",
        "orion",
        "perseus",
        "rex",
        "rigel",
        "sal",
        "sirius",
        "ursa",
        "zagan",
        "zenith",
    }
)


class NovaVoiceUnavailable(Exception):
    """El proveedor de voz no ha podido abrir una sesión. El cliente debe degradar."""


def resolve_nova_voice_provider(env: Mapping[str, str] | None = None) -> str:
    source = os.environ if env is None else env
    raw = str(source.get("NOVA_VOICE_PROVIDER") or "").strip().lower()
    key = str(source.get("GROK_API_KEY") or "").strip()
    if raw in {"text", "texto"}:
        return "text"
    if raw in {"browser", "speech", "off", "none", "disabled"}:
        return "browser"
    if raw in {"", "grok", "xai", "on", "true", "1", "yes"}:
        return "grok" if key else "browser"
    return "browser"


def nova_voice_id(env: Mapping[str, str] | None = None) -> str:
    source = os.environ if env is None else env
    voice = str(source.get("NOVA_GROK_VOICE") or DEFAULT_VOICE).strip().lower()
    if voice not in ALLOWED_VOICES:
        return DEFAULT_VOICE
    return voice


def public_config(provider: str) -> dict:
    return {
        "provider": provider,
        "language": "es-ES",
        "greeting": NOVA_GREETING,
    }


def public_session(token: str, expires_at, voice: str) -> dict:
    return {
        "provider": "grok",
        "token": token,
        "expires_at": expires_at,
        "websocket_url": GROK_REALTIME_URL,
        "voice": voice,
        "language": "es-ES",
        "output_sample_rate": OUTPUT_SAMPLE_RATE,
        "instructions": NOVA_INSTRUCTIONS,
        "greeting": NOVA_GREETING,
    }


class RateLimiter:
    def __init__(self, limit: int = 8, window_seconds: int = 600):
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, list[float]] = {}

    def allow(self, key: str, now: float | None = None) -> bool:
        moment = time.time() if now is None else now
        bucket = [stamp for stamp in self._hits.get(key, []) if moment - stamp < self.window]
        if len(bucket) >= self.limit:
            self._hits[key] = bucket
            return False
        bucket.append(moment)
        self._hits[key] = bucket
        return True


async def mint_ephemeral_token(api_key: str, client=None) -> dict:
    """Pide a xAI un client secret de un solo uso. No registra la clave ni el token."""
    payload = {"expires_after": {"seconds": TOKEN_SECONDS}}
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async def _post(http):
        return await http.post(XAI_CLIENT_SECRETS_URL, headers=headers, json=payload)

    if client is None:
        async with httpx.AsyncClient(timeout=10.0) as http:
            response = await _post(http)
    else:
        response = await _post(client)

    if getattr(response, "status_code", 0) != 200:
        raise NovaVoiceUnavailable("upstream status")

    try:
        data = response.json()
    except Exception as exc:
        raise NovaVoiceUnavailable("upstream body") from exc

    token = data.get("value") if isinstance(data, dict) else None
    if not isinstance(token, str):
        raise NovaVoiceUnavailable("upstream token")
    token = token.strip()
    if not token or token == api_key or len(token) > 4096:
        raise NovaVoiceUnavailable("upstream token")

    expires_at = data.get("expires_at") if isinstance(data, dict) else None
    if not isinstance(expires_at, int):
        expires_at = None
    return {"token": token, "expires_at": expires_at}
