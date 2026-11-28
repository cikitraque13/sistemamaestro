"""Publishable embed keys, origin checks, revoke, caps, and no provider secrets."""

import logging
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-must-be-32-characters")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

from pymongo.errors import DuplicateKeyError

from backend.app.core.embed_cors import EmbedPublicCORSMiddleware
from backend.app.routers import embed_agent as embed_router
from backend.app.services import embed_agent as service
from backend.app.services.embed_agent import contains_provider_secret
from backend.app.services.embed_assets import resolve_embed_asset
from backend.app.services.nova_voice import NovaVoiceUnavailable
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pathlib import Path


SECRET = "super-secret-grok-key"
ORIGIN = "https://cliente.example"
GREETING = "SALUDO-UNICO-XYZ"
BRIEF = "Taller de bicicletas en Málaga."


class MemoryCollection:
    def __init__(self, unique=None):
        self.docs = []
        self.unique = unique or []

    def _match(self, doc, query):
        for key, expected in query.items():
            if isinstance(expected, dict):
                value = doc.get(key, 0)
                if "$lt" in expected and not value < expected["$lt"]:
                    return False
                if "$gt" in expected and not value > expected["$gt"]:
                    return False
            elif doc.get(key) != expected:
                return False
        return True

    def _apply(self, doc, update):
        for key, value in (update.get("$set") or {}).items():
            doc[key] = value
        for key, value in (update.get("$setOnInsert") or {}).items():
            doc.setdefault(key, value)
        for key, value in (update.get("$inc") or {}).items():
            doc[key] = int(doc.get(key, 0)) + int(value)

    def _ensure_unique(self, doc):
        for fields in self.unique:
            query = {field: doc.get(field) for field in fields}
            if any(self._match(existing, query) for existing in self.docs):
                raise DuplicateKeyError("duplicate")

    async def find_one(self, query, projection=None):
        for doc in self.docs:
            if self._match(doc, query):
                return dict(doc)
        return None

    async def insert_one(self, doc):
        stored = dict(doc)
        self._ensure_unique(stored)
        self.docs.append(stored)

    async def update_one(self, query, update, upsert=False):
        for doc in self.docs:
            if self._match(doc, query):
                self._apply(doc, update)
                return
        if upsert:
            created = {}
            self._apply(created, update)
            self.docs.append(created)

    async def find_one_and_update(self, query, update, upsert=False, return_document=None):
        for doc in self.docs:
            if self._match(doc, query):
                self._apply(doc, update)
                return dict(doc)
        if not upsert:
            return None
        created = {}
        for key, expected in query.items():
            if not isinstance(expected, dict):
                created[key] = expected
        self._apply(created, update)
        self._ensure_unique(created)
        self.docs.append(created)
        return dict(created)


def _client():
    app = FastAPI()
    app.add_middleware(EmbedPublicCORSMiddleware)
    app.include_router(embed_router.router)
    return TestClient(app)


def test_flag_defaults_off(monkeypatch):
    monkeypatch.delenv("EMBED_AGENT_ENABLED", raising=False)
    assert service.embed_agent_enabled() is False
    for value in ("", "false", "0", "no", "off", "maybe"):
        monkeypatch.setenv("EMBED_AGENT_ENABLED", value)
        assert service.embed_agent_enabled() is False
    monkeypatch.setenv("EMBED_AGENT_ENABLED", "true")
    assert service.embed_agent_enabled() is True


def test_public_key_is_publishable_and_not_the_provider_secret():
    keys = {service.generate_public_key() for _ in range(30)}
    assert len(keys) == 30
    for key in keys:
        assert key.startswith("pk_")
        assert service.is_public_key(key)
        assert SECRET not in key
        assert "sk_" not in key
        assert service.snippet("https://sistemamaestro.com", key).count(key) == 1


def test_origin_validation_is_exact():
    assert service.normalize_origin("Cliente.example") == "https://cliente.example"
    assert service.normalize_origin("https://Cliente.example/") == "https://cliente.example"
    assert service.normalize_origin("https://cliente.example/ruta") is None
    assert service.normalize_origin("*") is None
    assert service.normalize_origin("https://user:pass@cliente.example") is None
    assert service.normalize_origin("http://localhost:5173") == "http://localhost:5173"
    assert service.normalize_origin("https://cliente.example:443") == "https://cliente.example"
    allowed = ["https://cliente.example"]
    assert service.origin_allowed("https://cliente.example", allowed)
    assert not service.origin_allowed("https://evil.example", allowed)
    assert not service.origin_allowed("https://cliente.example.evil.com", allowed)
    assert not service.origin_allowed("http://cliente.example", allowed)
    assert not service.origin_allowed("https://www.cliente.example", allowed)
    assert not service.origin_allowed(None, allowed)


def test_instructions_follow_the_project_and_skip_nova_sales_script():
    text = service.build_agent_instructions("BiciSur", GREETING, BRIEF)
    assert GREETING in text
    assert BRIEF in text
    assert "No ofrezcas WhatsApp" in text
    assert "Manual de venta" not in text
    assert "register_website_analysis" not in text
    assert "GROK_API_KEY" not in text
    assert SECRET not in text


def test_frame_token_is_bound_to_origin_and_rejects_tampering():
    secret = "frame-signing-secret"
    token = service.issue_frame_token(
        secret,
        key="pk_" + "a" * 32,
        agent_id="emb_" + "b" * 12,
        origin="https://cliente.example",
        now=1_000,
        nonce="fixed",
    )
    assert secret not in token
    payload = service.read_frame_token(secret, token, now=1_000)
    assert payload["o"] == ORIGIN
    assert service.read_frame_token(secret, token + "x", now=1_000) is None
    assert service.read_frame_token("other-secret", token, now=1_000) is None
    assert service.read_frame_token(secret, token, now=1_000 + service.FRAME_TOKEN_SECONDS + 5) is None
    assert service.frame_request_allowed(payload, ORIGIN, "http://testserver")
    assert service.frame_request_allowed(payload, "http://testserver", "http://testserver")
    assert not service.frame_request_allowed(payload, "https://evil.example", "http://testserver")


def test_snippet_rejects_a_key_that_could_break_the_attribute():
    try:
        service.snippet("https://sistemamaestro.com", 'pk_"><script>')
    except ValueError:
        return
    raise AssertionError("snippet accepted an unsafe key")


def test_failure_log_keeps_only_a_category():
    messages = []

    class Handler(logging.Handler):
        def emit(self, record):
            messages.append(record.getMessage())

    logger = logging.getLogger("embed-agent-test")
    handler = Handler()
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    try:
        service.log_embed_failure(logger, GREETING)
        service.log_embed_failure(logger, "daily_cap")
    finally:
        logger.removeHandler(handler)
    assert messages == [
        "embed_agent_failure category=unknown",
        "embed_agent_failure category=daily_cap",
    ]
    assert GREETING not in " ".join(messages)


def test_daily_cap_blocks_and_duplicate_does_not_open_a_second_counter():
    import asyncio

    usage = MemoryCollection(unique=[("agent_id", "day")])

    async def run():
        assert await service.reserve_daily_slot(usage, "emb_1", "2026-11-28", 1)
        assert not await service.reserve_daily_slot(usage, "emb_1", "2026-11-28", 1)
        assert len(usage.docs) == 1
        await service.release_daily_slot(usage, "emb_1", "2026-11-28")
        assert usage.docs[0]["count"] == 0
        assert await service.reserve_daily_slot(usage, "emb_1", "2026-11-28", 1)

    asyncio.run(run())


def test_embed_asset_stays_inside_the_bundle(tmp_path):
    bundle = tmp_path / "embed"
    (bundle / "assets").mkdir(parents=True)
    script = bundle / "agent.js"
    script.write_text("/* widget */", encoding="utf-8")
    (bundle / "assets" / "frame.js").write_text("frame", encoding="utf-8")
    (bundle / "secret.map").write_text("nope", encoding="utf-8")
    assert resolve_embed_asset(bundle, "agent.js") == script.resolve()
    assert resolve_embed_asset(bundle, "assets/frame.js") is not None
    assert resolve_embed_asset(bundle, "../.env") is None
    assert resolve_embed_asset(bundle, "secret.map") is None
    assert resolve_embed_asset(bundle, "/etc/passwd") is None


class TestEmbedApi:
    def setup_method(self):
        self.projects = MemoryCollection()
        self.agents = MemoryCollection(unique=[("key",), ("user_id", "project_id")])
        self.usage = MemoryCollection(unique=[("agent_id", "day")])
        self.users = MemoryCollection()
        self.user = {"user_id": "user_1", "role": "user"}
        self.projects.docs.append({
            "project_id": "proj_bici",
            "user_id": "user_1",
            "title": "BiciSur",
            "input_content": "Taller de bicicletas",
            "diagnosis": {"summary": BRIEF},
        })
        self.users.docs.append({"user_id": "user_1", "role": "user"})
        self._env = {
            name: os.environ.get(name)
            for name in (
                "EMBED_AGENT_ENABLED",
                "EMBED_AGENT_DAILY_CAP",
                "EMBED_PUBLIC_ORIGIN",
                "GROK_API_KEY",
                "NOVA_VOICE_PROVIDER",
            )
        }
        os.environ["EMBED_AGENT_ENABLED"] = "true"
        os.environ["EMBED_AGENT_DAILY_CAP"] = "20"
        os.environ.pop("EMBED_PUBLIC_ORIGIN", None)
        os.environ["GROK_API_KEY"] = SECRET
        os.environ["NOVA_VOICE_PROVIDER"] = "grok"
        for limiter in (embed_router._burst, embed_router._diag_burst, embed_router._unknown_burst):
            limiter._hits.clear()
        embed_router._burst.limit = 8
        self.mint_calls = []

        async def current_user(request):
            return self.user

        async def mint(api_key, client=None):
            self.mint_calls.append(api_key)
            if self.fail_mint:
                raise NovaVoiceUnavailable("upstream status")
            return {"token": "ephemeral-client-secret", "expires_at": 1700000000}

        self.fail_mint = False
        self._current_user = embed_router.get_current_user
        self._mint = embed_router.mint_ephemeral_token
        self._agents = embed_router.agents_collection
        self._usage = embed_router.usage_collection
        self._projects = embed_router.projects_collection
        self._users = embed_router.users_collection
        embed_router.get_current_user = current_user
        embed_router.mint_ephemeral_token = mint
        embed_router.agents_collection = lambda: self.agents
        embed_router.usage_collection = lambda: self.usage
        embed_router.projects_collection = lambda: self.projects
        embed_router.users_collection = lambda: self.users
        self.client = _client()
        self.logs = []
        self.handler = logging.Handler()
        self.handler.emit = lambda record: self.logs.append(record.getMessage())
        logging.getLogger("backend.app.routers.embed_agent").addHandler(self.handler)

    def teardown_method(self):
        embed_router.get_current_user = self._current_user
        embed_router.mint_ephemeral_token = self._mint
        embed_router.agents_collection = self._agents
        embed_router.usage_collection = self._usage
        embed_router.projects_collection = self._projects
        embed_router.users_collection = self._users
        logging.getLogger("backend.app.routers.embed_agent").removeHandler(self.handler)
        for name, value in self._env.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value

    def _create(self, origins=None):
        return self.client.post(
            "/api/embed/agents",
            json={"project_id": "proj_bici", "allowed_origins": origins if origins is not None else [ORIGIN]},
        )

    def _public(self, key, origin=ORIGIN):
        return {"Origin": origin, "X-Embed-Key": key}

    def test_create_is_idempotent_and_snippet_has_no_secret(self):
        created = self._create()
        assert created.status_code == 200
        body = created.json()
        assert body["key"].startswith("pk_")
        assert body["name"] == "BiciSur"
        assert "BiciSur" in body["greeting"]
        assert BRIEF in body["business_brief"]
        assert 'data-agent-key="' + body["key"] + '"' in body["snippet"]
        assert body["snippet"].startswith("<script ")
        assert SECRET not in created.text
        assert "GROK_API_KEY" not in created.text
        again = self._create()
        assert again.json()["key"] == body["key"]
        assert len(self.agents.docs) == 1

    def test_other_users_project_is_not_found(self):
        self.user = {"user_id": "user_2", "role": "user"}
        response = self._create()
        assert response.status_code == 404
        assert self.agents.docs == []

    def test_bad_origin_is_rejected_before_save(self):
        response = self._create(origins=["https://cliente.example/admin"])
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "embed_agent_origin"
        assert self.agents.docs == []

    def test_flag_off_blocks_non_admin_and_lets_admin_through(self):
        os.environ["EMBED_AGENT_ENABLED"] = "false"
        blocked = self._create()
        assert blocked.status_code == 503
        assert blocked.json()["detail"]["code"] == "embed_agent_disabled"
        assert self.agents.docs == []
        self.user = {"user_id": "user_1", "role": "admin"}
        opened = self._create()
        assert opened.status_code == 200
        assert opened.json()["key"].startswith("pk_")

    def test_origin_revoke_and_rotate(self):
        key = self._create().json()["key"]
        agent_id = self.agents.docs[0]["agent_id"]
        denied = self.client.get("/api/public/embed/config", headers=self._public(key, "https://evil.example"))
        assert denied.status_code == 403
        assert denied.json()["detail"] == "embed_agent_origin"
        assert "business_brief" not in denied.json()
        allowed = self.client.get("/api/public/embed/config", headers=self._public(key))
        assert allowed.status_code == 200
        config = allowed.json()
        assert config["name"] == "BiciSur"
        assert "frame_token" in config
        assert "business_brief" not in config
        assert "instructions" not in config
        assert SECRET not in allowed.text

        rotated = self.client.post(f"/api/embed/agents/{agent_id}/rotate")
        assert rotated.status_code == 200
        rotated_key = rotated.json()["key"]
        assert rotated_key != key
        assert self.client.get("/api/public/embed/config", headers=self._public(key)).status_code == 404
        assert self.client.get("/api/public/embed/config", headers=self._public(rotated_key)).status_code == 200

        revoked = self.client.post(f"/api/embed/agents/{agent_id}/revoke")
        assert revoked.status_code == 200
        assert revoked.json()["active"] is False
        assert revoked.json()["snippet"] == ""
        dead = self.client.get("/api/public/embed/config", headers=self._public(rotated_key))
        assert dead.status_code == 403
        assert dead.json()["detail"] == "embed_agent_revoked"

    def test_rotate_keeps_the_daily_cap_on_the_same_agent(self):
        os.environ["EMBED_AGENT_DAILY_CAP"] = "1"
        created = self._create().json()
        first = self.client.post("/api/public/embed/session", headers=self._public(created["key"]))
        assert first.status_code == 200
        assert first.json()["provider"] == "grok"
        assert not contains_provider_secret(first.json(), SECRET)
        assert first.json()["tools"] == []
        assert "Manual de venta" not in first.json()["instructions"]
        assert BRIEF in first.json()["instructions"]
        assert "business_brief" not in first.json()
        rotated = self.client.post(f"/api/embed/agents/{created['agent_id']}/rotate")
        assert rotated.status_code == 200
        second = self.client.post(
            "/api/public/embed/session",
            headers=self._public(rotated.json()["key"]),
        )
        assert second.status_code == 429
        assert second.json()["detail"] == "embed_agent_daily_cap"
        assert self.mint_calls == [SECRET]

    def test_rate_limit_and_failed_mint_does_not_keep_the_slot_or_the_secret(self):
        embed_router._burst.limit = 2
        created = self._create().json()
        headers = self._public(created["key"])
        assert self.client.post("/api/public/embed/session", headers=headers).status_code == 200
        assert self.client.post("/api/public/embed/session", headers=headers).status_code == 200
        limited = self.client.post("/api/public/embed/session", headers=headers)
        assert limited.status_code == 429
        assert limited.json()["detail"] == "embed_agent_rate_limit"
        assert len(self.mint_calls) == 2

        embed_router._burst._hits.clear()
        self.fail_mint = True
        before = self.usage.docs[0]["count"]
        failed = self.client.post("/api/public/embed/session", headers=headers)
        assert failed.status_code == 503
        assert failed.json()["detail"] == "embed_agent_mint_failed"
        assert SECRET not in failed.text
        assert self.usage.docs[0]["count"] == before
        joined = "\n".join(self.logs)
        assert SECRET not in joined
        assert created["greeting"] not in joined
        assert BRIEF not in joined

    def test_diag_logs_a_category_and_drops_the_transcript(self):
        created = self._create().json()
        transcript = "TRANSCRIPCION SECRETA el cliente dijo hola"
        response = self.client.post(
            "/api/public/embed/diag",
            headers=self._public(created["key"]),
            json={
                "stage": "session",
                "message": f"{transcript} {SECRET}",
                "ws_reason": transcript,
            },
        )
        assert response.status_code == 200
        joined = "\n".join(self.logs)
        assert "embed_agent_diag category=session" in joined
        assert transcript not in joined
        assert SECRET not in joined

    def test_public_flag_off_hides_keys_unless_the_owner_is_admin(self):
        created = self._create().json()
        os.environ["EMBED_AGENT_ENABLED"] = "false"
        hidden = self.client.get("/api/public/embed/config", headers=self._public(created["key"]))
        assert hidden.status_code == 404
        assert hidden.json()["detail"] == "embed_agent_disabled"
        self.users.docs[0]["role"] = "admin"
        visible = self.client.get("/api/public/embed/config", headers=self._public(created["key"]))
        assert visible.status_code == 200
        assert visible.json()["frame_token"]

    def test_browser_provider_does_not_mint_or_spend_the_cap(self):
        os.environ["NOVA_VOICE_PROVIDER"] = "off"
        created = self._create().json()
        response = self.client.post("/api/public/embed/session", headers=self._public(created["key"]))
        assert response.status_code == 200
        assert response.json()["provider"] == "browser"
        assert "token" not in response.json()
        assert self.mint_calls == []
        assert self.usage.docs == []

    def test_cors_reflects_the_visitor_origin_without_credentials(self):
        preflight = self.client.options(
            "/api/public/embed/config",
            headers={
                "Origin": ORIGIN,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "x-embed-key, content-type",
            },
        )
        assert preflight.status_code == 204
        assert preflight.headers["access-control-allow-origin"] == ORIGIN
        assert "access-control-allow-credentials" not in preflight.headers
        created = self._create().json()
        response = self.client.get("/api/public/embed/config", headers=self._public(created["key"]))
        assert response.headers["access-control-allow-origin"] == ORIGIN

    def test_router_source_does_not_charge_gems(self):
        source = Path(embed_router.__file__).read_text(encoding="utf-8")
        assert "run_economic_operation" not in source
        assert "TODO(founder)" in source
