"""Builder advisor flow. Off unless ADVISOR_FLOW_ENABLED is set.

The booking link is an operator-supplied http(s) URL. This module does not
choose a calendar provider and does not embed an account.
"""
import os
from urllib.parse import urlparse

_ENABLED_VALUES = {"1", "true", "yes", "on"}
_MAX_URL_LENGTH = 2000

_FLAG_NAMES = (
    "ADVISOR_FLOW_ENABLED",
    "REACT_APP_ADVISOR_FLOW_ENABLED",
    "VITE_ADVISOR_FLOW_ENABLED",
)
_BOOKING_URL_NAMES = (
    "ADVISOR_BOOKING_URL",
    "REACT_APP_ADVISOR_BOOKING_URL",
    "VITE_ADVISOR_BOOKING_URL",
)
_PHOTO_URL_NAMES = (
    "ADVISOR_PHOTO_URL",
    "REACT_APP_ADVISOR_PHOTO_URL",
    "VITE_ADVISOR_PHOTO_URL",
)


def _first_set(*names: str):
    for name in names:
        if name in os.environ:
            return os.environ.get(name)
    return None


def advisor_flow_enabled() -> bool:
    raw = _first_set(*_FLAG_NAMES)
    if raw is None:
        return False
    return raw.strip().lower() in _ENABLED_VALUES


def safe_http_url(value) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if not text or len(text) > _MAX_URL_LENGTH or any(char.isspace() for char in text):
        return ""
    parsed = urlparse(text)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return ""
    return text


def _configured_url(*names: str) -> str:
    return safe_http_url(_first_set(*names))


def advisor_booking_url() -> str:
    return _configured_url(*_BOOKING_URL_NAMES)


def advisor_photo_url() -> str:
    return _configured_url(*_PHOTO_URL_NAMES)


def public_advisor_config() -> dict:
    return {
        "advisor_flow_enabled": advisor_flow_enabled(),
        "advisor_booking_url": advisor_booking_url(),
        "advisor_photo_url": advisor_photo_url(),
    }
