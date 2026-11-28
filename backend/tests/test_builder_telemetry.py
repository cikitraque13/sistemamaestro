"""First-party funnel counts. No message body and no third-party call."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")

import asyncio

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.app.services.builder_telemetry import FunnelEventIn, event_document, record_funnel, router, summarize_funnel


class Events:
    def __init__(self):
        self.documents = []

    async def insert_one(self, document):
        self.documents.append(dict(document))

    def find(self, query, projection=None):
        rows = []
        for document in self.documents:
            if projection:
                rows.append({key: document.get(key) for key in projection if key != "_id"})
            else:
                rows.append(dict(document))

        class Cursor:
            def __init__(self, items):
                self.items = items

            def __aiter__(self):
                self._index = 0
                return self

            async def __anext__(self):
                if self._index >= len(self.items):
                    raise StopAsyncIteration
                item = self.items[self._index]
                self._index += 1
                return item

        return Cursor(rows)


def test_events_have_no_message_and_the_bottleneck_is_the_abandon_step():
    refused = event_document(user_id="alice", project_id="proj", step="note", outcome="started")
    assert refused is None
    try:
        FunnelEventIn(projectId="proj", step="first_message", outcome="abandoned", message="el texto del cliente")
    except ValidationError:
        pass
    else:
        raise AssertionError("a message field must be rejected")
    events = [
        {"user_id": "alice", "project_id": "proj", "step": "placeholder", "outcome": "started"},
        {"user_id": "alice", "project_id": "proj", "step": "placeholder", "outcome": "abandoned"},
        {"user_id": "bob", "project_id": "other", "step": "first_message", "outcome": "failed"},
        {"user_id": "bob", "project_id": "other", "step": "first_message", "outcome": "started", "message": "should not count as content"},
    ]
    summary = summarize_funnel(events)
    assert summary["bottleneck"] == "placeholder"
    assert summary["steps"]["placeholder"]["abandoned"] == 1
    assert summary["steps"]["first_message"]["failed"] == 1
    assert summary["steps"]["placeholder"]["users"] == 1
    assert "message" not in summary["steps"]["first_message"]


def test_record_keeps_only_the_allowlist_and_admin_summary_hides_it_from_members():
    collection = Events()

    async def run():
        await record_funnel(collection, user_id="alice", project_id="proj", step="iteration", outcome="failed")
        await record_funnel(collection, user_id="alice", project_id="proj", step="iteration", outcome="failed",)
        return collection.documents

    stored = asyncio.run(run())
    assert stored[0].keys() == {"user_id", "project_id", "step", "outcome", "created_at"}
    assert "message" not in stored[0]

    app = FastAPI()
    app.include_router(router)

    async def member(_request):
        return {"user_id": "alice", "role": "user"}

    async def admin(_request):
        return {"user_id": "root", "role": "admin"}

    import backend.app.services.builder_telemetry as telemetry
    import backend.app.core.builder_access as access

    original_user = telemetry.get_current_user if hasattr(telemetry, "get_current_user") else None
    # The endpoint imports get_current_user lazily. Patch the security module and the db.
    import backend.app.core.security as security
    import backend.app.db.mongodb as mongodb

    previous_user = security.get_current_user
    previous_db = mongodb.db
    access_enabled = os.environ.get("BUILDER_ENABLED")
    os.environ["BUILDER_ENABLED"] = "true"
    try:
        security.get_current_user = member
        mongodb.db = type("DB", (), {"builder_funnel_events": collection})()
        client = TestClient(app)
        denied = client.get("/api/builder/telemetry/summary")
        security.get_current_user = admin
        allowed = client.get("/api/builder/telemetry/summary")
        posted = client.post("/api/builder/telemetry", json={
            "projectId": "proj", "step": "publish", "outcome": "abandoned",
        })
        extra = client.post("/api/builder/telemetry", json={
            "projectId": "proj", "step": "publish", "outcome": "abandoned", "message": "secreto",
        })
    finally:
        security.get_current_user = previous_user
        mongodb.db = previous_db
        if access_enabled is None:
            os.environ.pop("BUILDER_ENABLED", None)
        else:
            os.environ["BUILDER_ENABLED"] = access_enabled
        if original_user:
            telemetry.get_current_user = original_user

    assert denied.status_code == 403
    assert allowed.status_code == 200
    assert allowed.json()["steps"]["iteration"]["failed"] == 2
    assert posted.status_code == 200
    assert extra.status_code == 422
    assert all("secreto" not in str(item) for item in collection.documents)
