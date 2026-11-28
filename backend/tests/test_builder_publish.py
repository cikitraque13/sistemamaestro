"""Slug, snapshot, host, unpublish, DNS and the dark publish flags."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")

import asyncio
import copy
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.routers import builder_preview
from backend.app.routers.builder_publish import router as publish_router
from backend.app.services.builder_pipeline import render_preview_html
from backend.app.services.builder_publish import (
    ACTIVATION_PENDING,
    DomainActivationAdapter,
    PREVIEW_CSP,
    PublishError,
    PublishSettings,
    classify_host,
    custom_domain_enabled,
    dns_instructions,
    publish_landing_enabled,
    publish_project,
    published_landing_response,
    republish_project,
    resolve_host,
    set_custom_domain,
    unpublish_project,
    validate_slug,
    verify_custom_domain,
    PublishedLandingMiddleware,
)

DRAFT = {
    "title": "Clara atiende la consulta esta semana",
    "subtitle": "Una landing escrita para este encargo.",
    "cta": "Pedir cita con Clara",
    "sections": [{"title": "La consulta", "text": "Clara revisa el caso y propone el siguiente paso."}],
}
SETTINGS = PublishSettings(
    base_domain="sistemamaestro.com",
    cname_target="edge.example.net",
    apex_target="203.0.113.10",
    app_hosts=frozenset({"localhost", "127.0.0.1", "::1"}),
    resolve_custom_hosts=True,
)
ROOT = Path(__file__).resolve().parents[2]


def preview(owner, project_id, html, version=1, instruction="Landing de Clara"):
    return {
        "schema": "sm.builder.preview.v1",
        "ownerId": owner,
        "projectId": project_id,
        "versions": [{
            "version": version,
            "instruction": instruction,
            "createdAt": "2026-11-28T01:00:00+00:00",
            "html": html,
        }],
    }


class Projects:
    def __init__(self, rows):
        self.documents = rows

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return {"project_id": document["project_id"]}
        return None


class Store:
    def __init__(self):
        self.documents = []

    def _match(self, document, query):
        for key, expected in query.items():
            current = document
            found = True
            for part in key.split("."):
                if not isinstance(current, dict) or part not in current:
                    found = False
                    break
                current = current[part]
            if not found or current != expected:
                return False
        return True

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if self._match(document, query):
                return copy.deepcopy(document)
        return None

    async def update_one(self, query, update, upsert=False):
        fields = copy.deepcopy(update.get("$set") or {})
        for document in self.documents:
            if self._match(document, query):
                document.update(fields)
                for key in update.get("$unset") or {}:
                    document.pop(key, None)
                return
        if upsert:
            self.documents.append(fields)


def world(html=None, owner="alice", project_id="proj_clara"):
    page = html or render_preview_html(DRAFT)
    projects = Projects([{"project_id": project_id, "user_id": owner}])
    landings = Store()
    landings.documents.append({
        "project_id": project_id,
        "user_id": owner,
        "preview": preview(owner, project_id, page),
        "preview_updated_at": "2026-11-28T01:00:00+00:00",
    })
    return projects, landings, Store(), page


def run(coro):
    return asyncio.run(coro)


def test_slug_accepts_a_name_and_rejects_reserved_and_invalid_ones():
    assert validate_slug("Clara") == "clara"
    assert validate_slug("mi-landing") == "mi-landing"
    for reserved in ("www", "api", "app", "admin", "dashboard", "mail", "API"):
        try:
            validate_slug(reserved)
        except PublishError as exc:
            assert exc.code == "reserved_slug"
            assert exc.status == 422
        else:
            raise AssertionError(reserved)
    for raw in ("ab", "-abc", "abc-", "a--b", "mi landing", "a" * 49, ""):
        try:
            validate_slug(raw)
        except PublishError as exc:
            assert exc.code == "invalid_slug"
        else:
            raise AssertionError(raw)


def test_slug_is_unique_across_projects_and_stays_reserved_after_unpublish():
    projects, landings, publications, _html = world()
    other_projects, other_landings, _ignored, _html = world(owner="bob", project_id="proj_bob")

    async def go():
        await publish_project(
            projects, landings, publications,
            owner_id="alice", project_id="proj_clara", slug="clara", now="t1", settings=SETTINGS,
        )
        await unpublish_project(
            publications, owner_id="alice", project_id="proj_clara", now="t2", settings=SETTINGS,
        )
        try:
            await publish_project(
                other_projects, other_landings, publications,
                owner_id="bob", project_id="proj_bob", slug="clara", now="t3", settings=SETTINGS,
            )
        except PublishError as exc:
            return exc
        return None

    error = run(go())
    assert error.status == 409
    assert error.code == "slug_taken"
    assert publications.documents[0]["slug"] == "clara"
    assert publications.documents[0]["status"] == "unpublished"


def test_publish_copies_the_latest_version_and_republish_keeps_the_old_snapshot():
    projects, landings, publications, first_html = world()
    second = render_preview_html({**DRAFT, "title": "Clara abre hueco el jueves"})

    async def go():
        await publish_project(
            projects, landings, publications,
            owner_id="alice", project_id="proj_clara", slug="clara", now="t1", settings=SETTINGS,
        )
        landings.documents[0]["preview"]["versions"][0]["html"] = "mutated-source"
        landings.documents[0]["preview"]["versions"].append({
            "version": 2,
            "instruction": "Hueco del jueves",
            "createdAt": "2026-11-28T02:00:00+00:00",
            "html": second,
        })
        await republish_project(
            projects, landings, publications,
            owner_id="alice", project_id="proj_clara", now="t2", settings=SETTINGS,
        )

    run(go())
    stored = publications.documents[0]
    assert stored["history"][0]["html"] == first_html
    assert stored["history"][0]["publishedAt"] == "t1"
    assert stored["snapshot"]["html"] == second
    assert stored["snapshot"]["version"] == 2
    assert stored["snapshot"] is not stored["history"][0]
    assert "mutated-source" not in stored["history"][0]["html"]


def test_unpublish_stops_serving_and_a_published_host_sends_the_preview_csp():
    projects, landings, publications, html = world()

    async def go():
        await publish_project(
            projects, landings, publications,
            owner_id="alice", project_id="proj_clara", slug="clara", now="t1", settings=SETTINGS,
        )
        live = await published_landing_response(publications, "clara.sistemamaestro.com", SETTINGS)
        await unpublish_project(
            publications, owner_id="alice", project_id="proj_clara", now="t2", settings=SETTINGS,
        )
        hidden = await published_landing_response(publications, "clara.sistemamaestro.com", SETTINGS)
        unknown = await published_landing_response(publications, "nadie.sistemamaestro.com", SETTINGS)
        nested = await published_landing_response(publications, "a.b.sistemamaestro.com", SETTINGS)
        apex = await published_landing_response(publications, "sistemamaestro.com", SETTINGS)
        api = await published_landing_response(publications, "api.sistemamaestro.com", SETTINGS)
        return live, hidden, unknown, nested, apex, api

    live, hidden, unknown, nested, apex, api = run(go())
    assert live.status_code == 200
    assert html in live.body.decode()
    policy = live.headers["content-security-policy"]
    assert PREVIEW_CSP in policy
    assert "script-src 'none'" in policy
    assert live.headers["x-content-type-options"] == "nosniff"
    for response in (hidden, unknown, nested):
        assert response.status_code == 404
        text = response.body.decode()
        assert "no está publicada" in text
        assert "Clara atiende" not in text
        assert PREVIEW_CSP in response.headers["content-security-policy"]
    assert apex is None
    assert api is None
    assert classify_host("www.sistemamaestro.com", SETTINGS) == "pass"
    assert classify_host("localhost", SETTINGS) == "pass"


def test_unsafe_html_is_not_published_or_served():
    projects, landings, publications, _html = world(html="<h1>Clara</h1><script>alert(1)</script>")

    async def go():
        try:
            await publish_project(
                projects, landings, publications,
                owner_id="alice", project_id="proj_clara", slug="clara", now="t1", settings=SETTINGS,
            )
        except PublishError as exc:
            planted = {
                "slug": "clara",
                "status": "published",
                "snapshot": {"html": "<script>alert(1)</script>"},
            }
            publications.documents.append(planted)
            page = await resolve_host(publications, "clara.sistemamaestro.com", SETTINGS, "subdomain")
            return exc, page
        return None, None

    error, page = run(go())
    assert error.code == "unsafe_html"
    assert page["status"] == 404
    assert "<script>" not in page["html"]


def test_verified_custom_domain_serves_and_a_pending_one_does_not():
    projects, landings, publications, html = world()

    async def go():
        await publish_project(
            projects, landings, publications,
            owner_id="alice", project_id="proj_clara", slug="clara", now="t1", settings=SETTINGS,
        )
        await set_custom_domain(
            publications, owner_id="alice", project_id="proj_clara", domain="https://Cliente.com/ruta",
            now="t2", settings=SETTINGS,
        )
        pending = await published_landing_response(publications, "cliente.com", SETTINGS)
        publications.documents[0]["custom_domain"]["status"] = "verified"
        verified = await published_landing_response(publications, "cliente.com", SETTINGS)
        stranger = await published_landing_response(publications, "otro.example", SETTINGS)
        return pending, verified, stranger

    pending, verified, stranger = run(go())
    assert publications.documents[0]["custom_domain"]["host"] == "cliente.com"
    assert pending.status_code == 404
    assert "Clara atiende" not in pending.body.decode()
    assert verified.status_code == 200
    assert html in verified.body.decode()
    assert "script-src 'none'" in verified.headers["content-security-policy"]
    assert stranger is None


def test_dns_verification_uses_the_injected_resolver_and_configured_targets():
    projects, landings, publications, _html = world()
    calls = []

    class Spy(DomainActivationAdapter):
        async def request_attachment(self, host: str) -> dict:
            calls.append(host)
            return await super().request_attachment(host)

    async def go():
        await publish_project(
            projects, landings, publications,
            owner_id="alice", project_id="proj_clara", slug="clara", now="t1", settings=SETTINGS,
        )
        saved = await set_custom_domain(
            publications, owner_id="alice", project_id="proj_clara", domain="www.cliente.com",
            now="t2", settings=SETTINGS,
        )
        token = publications.documents[0]["custom_domain"]["token"]
        looked = []

        def resolve(name):
            looked.append(name)
            return ["otra-cosa"]

        missed = await verify_custom_domain(
            publications, owner_id="alice", project_id="proj_clara", now="t3", settings=SETTINGS,
            resolve_txt=resolve, activation=Spy(),
        )
        after_miss = list(calls)

        def resolve_ok(name):
            looked.append(name)
            return [token]

        matched = await verify_custom_domain(
            publications, owner_id="alice", project_id="proj_clara", now="t4", settings=SETTINGS,
            resolve_txt=resolve_ok, activation=Spy(),
        )
        return saved, missed, matched, token, looked, after_miss

    saved, missed, matched, token, looked, after_miss = run(go())
    instructions = saved["customDomain"]["instructions"]
    assert instructions["txt"]["host"] == "_sistemamaestro-verify.www.cliente.com"
    assert instructions["txt"]["value"] == token
    assert instructions["cname"]["host"] == "www.cliente.com"
    assert instructions["cname"]["value"] == "edge.example.net"
    assert instructions["apex"]["host"] == "cliente.com"
    assert instructions["apex"]["value"] == "203.0.113.10"
    assert instructions["apex"]["applies"] is True
    assert looked[0] == "_sistemamaestro-verify.www.cliente.com"
    assert missed["customDomain"]["status"] == "pending"
    assert after_miss == []
    assert matched["customDomain"]["status"] == "verified"
    assert matched["customDomain"]["activation"] == "pending_sistema_maestro"
    assert ACTIVATION_PENDING in matched["message"]
    assert calls == ["www.cliente.com"]
    empty = dns_instructions("cliente.com", "sm-verify=x", PublishSettings(
        "", "", "", frozenset(), False,
    ))
    assert empty["cname"]["value"] == ""
    assert empty["cname"]["configured"] is False
    assert empty["apex"]["value"] == ""
    assert "railway" not in empty["cname"]["value"]


def test_a_failed_lookup_does_not_mark_the_domain_verified():
    projects, landings, publications, _html = world()

    async def go():
        await publish_project(
            projects, landings, publications,
            owner_id="alice", project_id="proj_clara", slug="clara", now="t1", settings=SETTINGS,
        )
        await set_custom_domain(
            publications, owner_id="alice", project_id="proj_clara", domain="cliente.com",
            now="t2", settings=SETTINGS,
        )

        def explode(_name):
            raise TimeoutError("synthetic")

        try:
            await verify_custom_domain(
                publications, owner_id="alice", project_id="proj_clara", now="t3", settings=SETTINGS,
                resolve_txt=explode, activation=DomainActivationAdapter(),
            )
        except PublishError as exc:
            return exc, publications.documents[0]["custom_domain"]["status"]
        return None, None

    error, status = run(go())
    assert error.status == 503
    assert status == "pending"


def test_flags_default_off_and_the_admin_bypass_is_the_only_dark_path(monkeypatch):
    monkeypatch.delenv("PUBLISH_LANDING_ENABLED", raising=False)
    monkeypatch.delenv("BUILDER_PUBLISH_ENABLED", raising=False)
    monkeypatch.delenv("CUSTOM_DOMAIN_ENABLED", raising=False)
    monkeypatch.delenv("BUILDER_FREE_TEST_MODE", raising=False)
    assert publish_landing_enabled() is False
    assert custom_domain_enabled() is False

    monkeypatch.setenv("BUILDER_PUBLISH_ENABLED", "true")
    assert publish_landing_enabled() is True
    monkeypatch.delenv("BUILDER_PUBLISH_ENABLED", raising=False)
    monkeypatch.setenv("PUBLISH_LANDING_ENABLED", "yes")
    assert publish_landing_enabled() is True

    seen = {}

    async def fake_publish(*_args, **kwargs):
        seen["slug"] = kwargs["slug"]
        return {"status": "published", "slug": kwargs["slug"]}

    async def admin(_request):
        return {"user_id": "alice", "role": "admin"}

    async def member(_request):
        return {"user_id": "alice", "role": "user"}

    app = FastAPI()
    app.include_router(publish_router)
    monkeypatch.setattr("backend.app.routers.builder_publish.publish_project", fake_publish)
    client = TestClient(app)

    monkeypatch.delenv("PUBLISH_LANDING_ENABLED", raising=False)
    monkeypatch.setattr("backend.app.routers.builder_publish.get_current_user", member)
    closed = client.post("/api/builder/publish/proj_clara", json={"slug": "clara"})
    assert closed.status_code == 503
    assert closed.json()["detail"]["message"] == "La publicación no está disponible."
    assert seen == {}

    domain = client.post("/api/builder/domain/proj_clara", json={"domain": "cliente.com"})
    assert domain.status_code == 503
    assert domain.json()["detail"]["message"] == "El dominio propio no está disponible."

    monkeypatch.setattr("backend.app.routers.builder_publish.get_current_user", admin)
    opened = client.post("/api/builder/publish/proj_clara", json={"slug": "Clara"})
    assert opened.status_code == 200
    assert seen["slug"] == "Clara"

    async def session(role):
        async def current(_request):
            return {"user_id": "alice", "role": role}

        monkeypatch.setattr(builder_preview, "get_current_user", current)
        return await builder_preview.builder_session(object())

    monkeypatch.delenv("PUBLISH_LANDING_ENABLED", raising=False)
    admin_session = run(session("admin"))
    member_session = run(session("user"))
    assert admin_session["publishLanding"] is True
    assert admin_session["customDomain"] is True
    assert admin_session["freeTestMode"] is False
    assert member_session["publishLanding"] is False
    assert member_session["customDomain"] is False
    monkeypatch.setenv("PUBLISH_LANDING_ENABLED", "true")
    flagged = run(session("user"))
    assert flagged["publishLanding"] is True
    assert flagged["customDomain"] is False


def test_landing_host_does_not_reach_the_api_and_the_app_host_does():
    projects, landings, publications, html = world()
    run(publish_project(
        projects, landings, publications,
        owner_id="alice", project_id="proj_clara", slug="clara", now="t1", settings=SETTINGS,
    ))
    hits = {"api": 0}

    async def app(scope, receive, send):
        hits["api"] += 1
        from starlette.responses import JSONResponse
        await JSONResponse({"app": True})(scope, receive, send)

    guarded = PublishedLandingMiddleware(app, publications, lambda: SETTINGS)

    async def call(host, method="GET", path="/"):
        messages = []
        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": method,
            "scheme": "http",
            "path": path,
            "raw_path": path.encode(),
            "query_string": b"",
            "headers": [(b"host", host.encode())],
            "client": ("127.0.0.1", 5000),
            "server": (host, 80),
        }

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(message):
            messages.append(message)

        await guarded(scope, receive, send)
        start = next(item for item in messages if item["type"] == "http.response.start")
        body = b"".join(item.get("body", b"") for item in messages if item["type"] == "http.response.body")
        headers = {key.decode().lower(): value.decode() for key, value in start["headers"]}
        return start["status"], headers, body.decode()

    async def go():
        landing = await call("clara.sistemamaestro.com")
        blocked = await call("clara.sistemamaestro.com", "POST", "/api/builder/publish/proj_clara")
        product = await call("localhost")
        return landing, blocked, product

    landing, blocked, product = run(go())
    assert landing[0] == 200
    assert html[:40] in landing[2]
    assert "script-src 'none'" in landing[1]["content-security-policy"]
    assert blocked[0] == 404
    assert "no está publicada" in blocked[2]
    assert product[0] == 200
    assert '"app":true' in product[2].replace(" ", "")
    assert hits["api"] == 1


def test_publish_code_does_not_call_railway_or_charge_gems():
    service = (ROOT / "backend/app/services/builder_publish.py").read_text()
    routes = (ROOT / "backend/app/routers/builder_publish.py").read_text()
    assert "api.railway.com" not in service
    assert "railway.app" not in service
    assert "TODO(founder)" in service
    assert "economic_operation" not in routes
    assert "TODO(founder)" in routes
    result = run(DomainActivationAdapter().request_attachment("cliente.com"))
    assert result["status"] == "pending_sistema_maestro"
    assert result["ok"] is False
