"""Offline hops from an instruction to a saved landing preview."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")

import asyncio
import json

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.routers.builder_ai import router as builder_router
from backend.app.services.blueprint import BlueprintGenerationError
from backend.app.services.builder_landing_state import (
    LandingStateError,
    load_generated_preview,
    save_generated_preview,
    save_landing,
)
from backend.app.services.builder_pipeline import PipelineError, public_preview, render_preview_html, run_pipeline

INTENT = {"title": "Consulta clara", "goal": "Conseguir una primera visita"}
BLUEPRINT = {"title": "Landing de consulta", "summary": "Una página", "priorities": ["Hero", "Prueba", "CTA"]}
DRAFT = {
    "title": "Clara atiende la consulta esta semana",
    "subtitle": "Una landing escrita para este encargo, no la plantilla de sector.",
    "cta": "Pedir cita con Clara",
    "sections": [{"title": "La consulta", "text": "Clara revisa el caso y propone el siguiente paso."}],
}
PROJECT = {"project_id": "proj_pipeline", "user_id": "alice", "input_content": "Asesoría", "route": "idea"}


class Projects:
    def __init__(self):
        self.documents = [dict(PROJECT)]

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return {"project_id": document["project_id"]}
        return None


class Landings:
    def __init__(self):
        self.documents = []

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return dict(document)
        return None

    async def update_one(self, query, update, upsert=False):
        fields = update["$set"]
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                document.update(fields)
                return
        if upsert:
            self.documents.append(dict(fields))


def test_classifier_unavailable_does_not_save():
    saved = []

    async def classify(_data):
        raise PipelineError("CLASSIFIER_UNAVAILABLE")

    async def run():
        try:
            await run_pipeline(
                project=PROJECT, owner_id="alice", instruction="Haz la landing",
                classify=classify, blueprint=saved.append, draft_landing=saved.append,
            )
        except PipelineError as exc:
            return exc
        return None

    error = asyncio.run(run())
    assert error.code == "CLASSIFIER_UNAVAILABLE"
    assert "clasificador" in error.message
    assert saved == []


def test_blueprint_failure_does_not_save():
    drafted = []

    async def classify(_data):
        return INTENT

    async def blueprint(_project):
        raise BlueprintGenerationError("blueprint_provider_unavailable")

    async def run():
        try:
            await run_pipeline(
                project=PROJECT, owner_id="alice", instruction="Haz la landing",
                classify=classify, blueprint=blueprint, draft_landing=drafted.append,
            )
        except PipelineError as exc:
            return exc
        return None

    error = asyncio.run(run())
    assert error.code == "blueprint_provider_unavailable"
    assert drafted == []


def test_landing_failure_does_not_save():
    async def classify(_data):
        return INTENT

    async def blueprint(_project):
        return BLUEPRINT

    async def draft(_data):
        raise PipelineError("landing_unavailable")

    async def run():
        try:
            await run_pipeline(
                project=PROJECT, owner_id="alice", instruction="Haz la landing",
                classify=classify, blueprint=blueprint, draft_landing=draft,
            )
        except PipelineError as exc:
            return exc
        return None

    error = asyncio.run(run())
    assert error.code == "landing_unavailable"
    assert "No se ha guardado" in error.message


def test_instruction_is_saved_and_becomes_the_preview_payload():
    projects = Projects()
    landings = Landings()

    async def classify(_data):
        return INTENT

    async def blueprint(project):
        assert project["input_content"] == "Quiero una landing de consulta"
        return BLUEPRINT

    async def draft(data):
        assert data["intent"]["title"] == "Consulta clara"
        return DRAFT

    async def run():
        result = await run_pipeline(
            project=PROJECT, owner_id="alice", instruction="Quiero una landing de consulta",
            classify=classify, blueprint=blueprint, draft_landing=draft, created_at="2026-11-28T01:00:00+00:00",
        )
        saved = await save_generated_preview(projects, landings, "alice", "proj_pipeline", result["preview"], "2026-11-28T01:00:00+00:00")
        loaded = await load_generated_preview(projects, landings, "alice", "proj_pipeline")
        return saved, loaded, result

    saved, loaded, result = asyncio.run(run())
    html = result["public"]["html"]
    assert "Clara atiende la consulta esta semana" in html
    assert "Pedir cita con Clara" in html
    assert "Convierte dudas en decisiones claras" not in html
    assert "<script" not in html
    assert loaded["preview"]["versions"][0]["instruction"] == "Quiero una landing de consulta"
    assert public_preview(loaded["preview"])["html"] == html
    assert saved["updated_at"] == "2026-11-28T01:00:00+00:00"
    assert landings.documents[0].get("record") is None


def test_each_iteration_keeps_only_the_last_versions():
    async def classify(_data):
        return INTENT

    async def blueprint(_project):
        return BLUEPRINT

    async def draft(data):
        return {**DRAFT, "title": data["instruction"]}

    async def run():
        previous = None
        for index in range(10):
            result = await run_pipeline(
                project=PROJECT, owner_id="alice", instruction=f"Cambio {index}",
                classify=classify, blueprint=blueprint, draft_landing=draft,
                previous=previous, created_at=f"2026-11-28T01:00:0{index}+00:00",
            )
            previous = result["preview"]
        return previous

    preview = asyncio.run(run())
    versions = preview["versions"]
    assert len(versions) == 8
    assert versions[0]["instruction"] == "Cambio 2"
    assert versions[-1]["instruction"] == "Cambio 9"
    assert "Cambio 9" in versions[-1]["html"]


def test_stale_landing_write_conflicts_and_a_matching_version_saves():
    projects = Projects()
    landings = Landings()
    record = '{"ownerId":"alice","projectId":"proj_pipeline"}'

    async def run():
        first = await save_landing(projects, landings, "alice", "proj_pipeline", record, "t1", expected_updated_at="0")
        conflict = None
        try:
            await save_landing(projects, landings, "alice", "proj_pipeline", record, "t2", expected_updated_at="0")
        except LandingStateError as exc:
            conflict = exc
        second = await save_landing(projects, landings, "alice", "proj_pipeline", record, "t2", expected_updated_at=first["updated_at"])
        return conflict, second, landings.documents[0]["updated_at"]

    conflict, second, stamp = asyncio.run(run())
    assert conflict.status == 409
    assert second["updated_at"] == "t2"
    assert stamp == "t2"


def test_build_route_reads_a_json_body_not_a_query_param():
    app = FastAPI()
    app.include_router(builder_router)
    operation = app.openapi()["paths"]["/api/builder/build"]["post"]
    assert "requestBody" in operation
    parameters = operation.get("parameters") or []
    assert all(item.get("name") != "payload" for item in parameters)
    response = TestClient(app, raise_server_exceptions=False).post(
        "/api/builder/build", json={"userInput": "Una landing de consulta"},
    )
    assert response.status_code != 422
    assert "query" not in response.text or "payload" not in response.text


def test_publish_stays_off():
    from backend.app.routers.builder_preview import publish_landing_enabled
    from pathlib import Path
    assert publish_landing_enabled() is False
    doc = Path(__file__).resolve().parents[2] / "docs/builder/PUBLICACION_DOMINIO.md"
    text = doc.read_text()
    assert "BUILDER_PUBLISH_ENABLED" in text
    assert "No" in text or "no escribe" in text


def test_preview_html_escapes_markup():
    html = render_preview_html({**DRAFT, "title": "<script>alert(1)</script>"})
    assert "<script>" not in html
    assert "&lt;script&gt;" in html
