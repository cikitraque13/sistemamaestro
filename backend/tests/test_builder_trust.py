"""Failure recovery for one builder charge.

A failed build must not keep a paid page, must not charge twice, and must
not leave a partial landing version or a reduced gem balance.
"""
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")
os.environ.setdefault("BUILDER_ENABLED", "true")

import asyncio
import json
from contextlib import ExitStack
from types import SimpleNamespace
from unittest.mock import patch

from pydantic import ValidationError

import test_builder_preview_stream_charge as stream_tests
from backend.app.routers import builder_preview
from backend.app.services.builder_claude_loop import run_copy_tool_loop
from backend.app.services.builder_copy_tools import validate_tool_input
from backend.app.services.builder_landing_state import LandingStateError, save_generated_preview
from backend.app.services.builder_pipeline import PipelineError

INSTRUCTION = "Clara, psicóloga en Madrid. Quiere una web para pedir cita."
GOOD = {
    "title": "Clara atiende en Madrid",
    "subtitle": "Psicóloga. Primera visita con un siguiente paso claro.",
    "cta": "Pedir cita con Clara",
    "sections": [
        {"title": "La consulta", "text": "Clara explica la primera visita en Madrid.", "role": "oferta"},
        {"title": "La duda", "text": "La primera sesión responde el miedo a comprometerse.", "role": "objecion"},
    ],
}


def _case():
    case = stream_tests.PreviewStreamChargeTests()
    case.setUp()
    return case


def _events(case, key, instruction=INSTRUCTION):
    return asyncio.run(case._events(key, instruction))


def _completed_deltas(case):
    return [
        entry["credits_delta"]
        for entry in case.db.ledger.documents.values()
        if entry.get("operation_status") == "completed"
    ]


class Store:
    def __init__(self, fail=False):
        self.documents = []
        self.fail = fail
        self.calls = 0

    async def update_one(self, query, update, upsert=False):
        self.calls += 1
        if self.fail:
            raise ConnectionError("mongo down")
        fields = dict(update["$set"])
        for document in self.documents:
            if document.get("project_id") == query.get("project_id") and document.get("user_id") == query.get("user_id"):
                document.update(fields)
                return
        if upsert:
            self.documents.append(fields)


class Projects:
    async def find_one(self, query, projection=None):
        if query.get("project_id") == "project_test" and query.get("user_id") == "user_test":
            return {"project_id": "project_test"}
        return None


def _patches(case, *, draft, judge, save, landings):
    async def classify(_data):
        return {"title": "Clara, psicóloga", "goal": "Conseguir citas en Madrid"}

    async def blueprint(_project):
        return {"title": "Consulta de Clara", "summary": "Primera visita", "priorities": ["La consulta", "La duda"]}

    async def missing(*_args, **_kwargs):
        raise LandingStateError("not_found", 404)

    database = SimpleNamespace(
        projects=case.db.projects,
        builder_landing_states=landings,
        builder_pending_charges=case.pending,
    )
    return [
        patch.object(builder_preview, "providers_ready", return_value=None),
        patch.object(builder_preview, "db", database),
        patch.object(builder_preview, "load_generated_preview", new=missing),
        patch.object(builder_preview, "save_generated_preview", new=save),
        patch.object(builder_preview, "classify_for_pipeline", new=classify),
        patch.object(builder_preview, "generate_blueprint", new=blueprint),
        patch.object(builder_preview, "draft_landing_with_claude", new=draft),
        patch.object(builder_preview, "judge_draft", new=judge),
    ]


def _run(case, patches, key):
    stack = ExitStack()
    for patcher in patches:
        stack.enter_context(patcher)
    with stack:
        return _events(case, key)


def test_a_charge_failure_is_not_a_paid_page_and_a_later_build_charges_once():
    case = _case()
    try:
        case._without_gems()
        saved = []

        async def save(*_args, **_kwargs):
            saved.append(True)
            return {"updated_at": "t"}

        with case._stack(case._executor()):
            with patch.object(builder_preview, "save_generated_preview", new=save):
                events = _events(case, "trust-no-gems")
        assert any(event["type"] == "error" for event in events)
        assert not any(event["type"] == "done" for event in events)
        assert saved == []
        assert case.db.users.document["credit_balance"] == 0
        assert case.db.ledger.documents == {}
        assert case.pending.docs == []
    finally:
        case.tearDown()

    case = _case()
    landings = Store()
    saved_preview = {}

    async def draft(_data):
        return GOOD

    async def judge(draft, _instruction):
        assert "Madrid" in draft["sections"][0]["text"]
        return {
            "ok": True,
            "summary": "La página habla de Clara.",
            "scores": {"visual_hierarchy": 5, "selling_microcopy": 4, "objections": 4, "specificity": 5},
            "total": 18,
        }

    async def save(*_args, **_kwargs):
        preview = _args[4]
        saved_preview["preview"] = preview
        landings.documents.append(preview)
        return {"updated_at": "t2"}

    try:
        events = _run(case, _patches(case, draft=draft, judge=judge, save=save, landings=landings), "trust-charge-ok")
    finally:
        case.tearDown()
    assert any(event["type"] == "done" for event in events)
    assert len(landings.documents) == 1
    assert "Clara" in landings.documents[0]["versions"][-1]["html"]
    assert _completed_deltas(case)
    assert case.db.users.document["credit_balance"] == 100 + _completed_deltas(case)[0]
    assert len(_completed_deltas(case)) == 1


def test_provider_timeouts_refund_and_do_not_save():
    async def draft_timeout(_data):
        raise TimeoutError("anthropic timed out")

    async def draft_ok(_data):
        return GOOD

    async def judge_timeout(_draft, _instruction):
        raise TimeoutError("grok timed out")

    async def unused_judge(*_args):
        raise AssertionError("the judge must not run after the writer times out")

    for name, draft, judge in (
        ("anthropic", draft_timeout, unused_judge),
        ("grok", draft_ok, judge_timeout),
    ):
        case = _case()
        landings = Store()
        try:
            events = _run(
                case,
                _patches(case, draft=draft, judge=judge, save=landings.update_one, landings=landings),
                f"trust-timeout-{name}",
            )
        finally:
            case.tearDown()
        rendered = json.dumps(events)
        assert any(event["type"] == "error" for event in events)
        assert "timed out" not in rendered
        assert "completado" not in rendered
        assert landings.documents == []
        assert case.db.users.document["credit_balance"] == 100
        assert all(entry["operation_status"] == "compensated" for entry in case.db.ledger.documents.values())
        assert len(case.db.ledger.documents) == 1


def test_mongo_outage_mid_save_leaves_the_previous_version_and_refunds():
    case = _case()
    previous = {
        "schema": "sm.builder.preview.v1",
        "ownerId": "user_test",
        "projectId": "project_test",
        "versions": [{
            "version": 1,
            "instruction": "Clara",
            "createdAt": "2026-11-28T01:00:00+00:00",
            "html": "<h1>Clara anterior</h1>",
        }],
    }
    landings = Store(fail=True)
    landings.documents.append({
        "project_id": "project_test",
        "user_id": "user_test",
        "preview": previous,
        "stage": "draft",
    })

    async def load(*_args, **_kwargs):
        return {"preview": previous, "updated_at": "t0"}

    async def draft(_data):
        return GOOD

    async def judge(*_args):
        return {"ok": True, "summary": "Clara.", "scores": {"visual_hierarchy": 5, "selling_microcopy": 4, "objections": 4, "specificity": 5}, "total": 18}

    async def save(projects, rows, owner_id, project_id, preview):
        await rows.update_one(
            {"project_id": project_id, "user_id": owner_id},
            {"$set": {"preview": preview, "stage": "draft"}},
            upsert=True,
        )
        return {"updated_at": "t1"}

    patches = [
        item for item in _patches(case, draft=draft, judge=judge, save=save, landings=landings)
        if getattr(item, "attribute", None) != "load_generated_preview"
    ]
    patches.append(patch.object(builder_preview, "load_generated_preview", new=load))
    try:
        events = _run(case, patches, "trust-mongo")
    finally:
        case.tearDown()
    assert any(event["type"] == "error" for event in events)
    assert landings.documents[0]["preview"]["versions"] == previous["versions"]
    assert "Clara anterior" in landings.documents[0]["preview"]["versions"][0]["html"]
    assert len(landings.documents[0]["preview"]["versions"]) == 1
    assert case.db.users.document["credit_balance"] == 100


def test_malformed_payload_and_tool_json_do_not_write_or_charge():
    case = _case()
    try:
        try:
            builder_preview.PreviewRequest(projectId="", instruction="")
        except ValidationError:
            pass
        else:
            raise AssertionError("an empty payload must be rejected")
        assert case.db.users.document["credit_balance"] == 100
        assert case.db.ledger.documents == {}
    finally:
        case.tearDown()

    cleaned, errors = validate_tool_input("{\"title\":")
    assert cleaned is None
    assert errors == ["type"]
    cleaned, errors = validate_tool_input({"title": "Clara", "sections": "{}"})
    assert cleaned is None
    assert any(item.startswith("missing:") for item in errors)

    calls = {"n": 0}

    async def complete(_messages):
        calls["n"] += 1
        if calls["n"] < 3:
            return {"content": [{"type": "tool_use", "id": "t", "name": "submit_landing_copy", "input": "{not-json"}], "usage": {}}
        return {"content": [{"type": "text", "text": "sin herramienta"}], "usage": {}}

    try:
        asyncio.run(run_copy_tool_loop({"instruction": INSTRUCTION}, complete))
    except PipelineError as exc:
        assert exc.code == "landing_unavailable"
    else:
        raise AssertionError("malformed tool input must fail the build")
    assert calls["n"] == 3


def test_a_version_without_html_is_refused_before_any_write():
    landings = Store()

    async def run():
        try:
            await save_generated_preview(Projects(), landings, "user_test", "project_test", {
                "schema": "sm.builder.preview.v1",
                "ownerId": "user_test",
                "projectId": "project_test",
                "versions": [{"version": 1, "instruction": "Clara", "html": "  "}],
            })
        except LandingStateError as exc:
            return exc
        return None

    error = asyncio.run(run())
    assert error.code == "invalid_record"
    assert landings.calls == 0
    assert landings.documents == []
