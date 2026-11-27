"""Existing builder and blueprint tests exercise the open path.

The product default is BUILDER_ENABLED unset (closed). This fixture turns the
flag on for the suite. Tests of the closed door set it back to false themselves.
"""
import pytest


@pytest.fixture(autouse=True)
def builder_enabled_for_existing_suite(monkeypatch):
    monkeypatch.setenv("BUILDER_ENABLED", "true")
