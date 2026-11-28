"""Advisor flow stays off, and only an http(s) booking URL is published."""
from backend.app.core.advisor_flow import (
    advisor_booking_url,
    advisor_flow_enabled,
    advisor_photo_url,
    public_advisor_config,
    safe_http_url,
)

_FLAG_NAMES = (
    "ADVISOR_FLOW_ENABLED",
    "REACT_APP_ADVISOR_FLOW_ENABLED",
    "VITE_ADVISOR_FLOW_ENABLED",
)
_URL_NAMES = (
    "ADVISOR_BOOKING_URL",
    "REACT_APP_ADVISOR_BOOKING_URL",
    "VITE_ADVISOR_BOOKING_URL",
    "ADVISOR_PHOTO_URL",
    "REACT_APP_ADVISOR_PHOTO_URL",
    "VITE_ADVISOR_PHOTO_URL",
)


def _clear(monkeypatch):
    for name in (*_FLAG_NAMES, *_URL_NAMES):
        monkeypatch.delenv(name, raising=False)


def test_flag_defaults_off_and_accepts_only_explicit_true(monkeypatch):
    _clear(monkeypatch)
    assert advisor_flow_enabled() is False
    for value in ("", "false", "0", "no", "off", "maybe"):
        monkeypatch.setenv("ADVISOR_FLOW_ENABLED", value)
        assert advisor_flow_enabled() is False
    monkeypatch.setenv("ADVISOR_FLOW_ENABLED", "true")
    assert advisor_flow_enabled() is True


def test_canonical_flag_wins_over_a_vite_alias(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv("ADVISOR_FLOW_ENABLED", "false")
    monkeypatch.setenv("VITE_ADVISOR_FLOW_ENABLED", "true")
    assert advisor_flow_enabled() is False


def test_react_app_alias_enables_the_flow_when_canonical_is_unset(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv("REACT_APP_ADVISOR_FLOW_ENABLED", "on")
    assert advisor_flow_enabled() is True


def test_booking_and_photo_urls_must_be_http(monkeypatch):
    _clear(monkeypatch)
    assert advisor_booking_url() == ""
    assert advisor_photo_url() == ""
    assert safe_http_url("javascript:alert(1)") == ""
    assert safe_http_url("not a url") == ""
    assert safe_http_url("https://") == ""
    monkeypatch.setenv("ADVISOR_BOOKING_URL", "javascript:alert(1)")
    monkeypatch.setenv("ADVISOR_PHOTO_URL", "data:image/png;base64,aaaa")
    assert advisor_booking_url() == ""
    assert advisor_photo_url() == ""
    monkeypatch.setenv("ADVISOR_BOOKING_URL", "https://booking.example.test/30")
    monkeypatch.setenv("ADVISOR_PHOTO_URL", "https://cdn.example.test/nova.png")
    assert advisor_booking_url() == "https://booking.example.test/30"
    assert advisor_photo_url() == "https://cdn.example.test/nova.png"


def test_public_advisor_config_stays_off_until_the_flag_and_url_are_set(monkeypatch):
    _clear(monkeypatch)
    closed = public_advisor_config()
    assert closed == {
        "advisor_flow_enabled": False,
        "advisor_booking_url": "",
        "advisor_photo_url": "",
    }
    monkeypatch.setenv("ADVISOR_FLOW_ENABLED", "true")
    monkeypatch.setenv("ADVISOR_BOOKING_URL", "https://booking.example.test/30")
    opened = public_advisor_config()
    assert opened["advisor_flow_enabled"] is True
    assert opened["advisor_booking_url"] == "https://booking.example.test/30"
    assert opened["advisor_photo_url"] == ""
