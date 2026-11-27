"""Solicitud pública de análisis de una web.

Nova deja la petición en cola. Este módulo no descarga la página ni devuelve
un diagnóstico: solo valida la URL y prepara la fila que se guarda.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone

from backend.app.services.url_analysis import _normalise_url

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_PHONE = re.compile(r"^\+?[0-9][0-9 \-().]{6,20}$")

QUEUED_MESSAGE = (
    "La solicitud de análisis queda registrada. El análisis no está hecho y no hay resultados. "
    "Di a la persona: queda registrado para el análisis."
)
NOT_REGISTERED_MESSAGE = (
    "No se ha podido registrar la solicitud. No digas que quedó registrada."
)


class WebsiteAnalysisError(Exception):
    def __init__(self, detail: str, nova_message: str):
        super().__init__(detail)
        self.detail = detail
        self.nova_message = nova_message


def _clean_business_name(raw) -> str:
    name = " ".join(str(raw or "").split())
    if not name or len(name) > 120:
        raise WebsiteAnalysisError(
            "invalid_business_name",
            "Falta el nombre del negocio. No ha quedado registrada.",
        )
    return name


def _valid_contact(value: str) -> bool:
    if _EMAIL.fullmatch(value):
        return True
    digits = re.sub(r"\D", "", value)
    return bool(_PHONE.fullmatch(value) and 8 <= len(digits) <= 15)


def _clean_contact(raw, consent: bool) -> str:
    contact = " ".join(str(raw or "").split())
    if not contact or not consent:
        return ""
    if len(contact) > 200 or not _valid_contact(contact):
        raise WebsiteAnalysisError(
            "invalid_contact",
            "El contacto no es un correo ni un teléfono válido. No ha quedado registrada. "
            "Pide otro contacto con consentimiento, o llama a la herramienta sin contacto.",
        )
    return contact


def normalize_public_website_url(raw) -> str:
    text = str(raw or "").strip()
    if not text or any(char.isspace() for char in text) or len(text) > 500:
        raise WebsiteAnalysisError(
            "invalid_url",
            "La URL no es válida. No ha quedado registrada. Pide una dirección pública http o https.",
        )
    if not text.lower().startswith(("http://", "https://")):
        text = "https://" + text
    try:
        normalised, hostname, _port = _normalise_url(text)
    except ValueError as exc:
        raise WebsiteAnalysisError(
            "invalid_url",
            "La URL no es válida. No ha quedado registrada. Pide una dirección pública http o https.",
        ) from exc
    if ":" not in hostname and "." not in hostname:
        raise WebsiteAnalysisError(
            "invalid_url",
            "La URL no es válida. No ha quedado registrada. Pide una dirección pública http o https.",
        )
    return normalised


def prepare_analysis_request(payload: dict, now: datetime | None = None) -> dict:
    """Arma la fila. No habla con la base de datos."""
    if not isinstance(payload, dict):
        payload = {}
    business_name = _clean_business_name(payload.get("business_name"))
    url = normalize_public_website_url(payload.get("website_url"))
    consent = payload.get("consent") is True
    contact = _clean_contact(payload.get("contact"), consent)
    moment = now if isinstance(now, datetime) else datetime.now(timezone.utc)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    return {
        "business_name": business_name,
        "url": url,
        "contact": contact,
        "consent": consent,
        "source": "nova_voice",
        "status": "queued",
        "created_at": moment.isoformat(),
    }


def queued_result(record: dict) -> dict:
    return {
        "ok": True,
        "registered": True,
        "status": "queued",
        "business_name": record["business_name"],
        "website_url": record["url"],
        "contact_stored": bool(record.get("contact")),
        "message": QUEUED_MESSAGE,
    }


def refused_result(detail: str, message: str) -> dict:
    return {
        "ok": False,
        "registered": False,
        "detail": detail,
        "message": message,
    }
