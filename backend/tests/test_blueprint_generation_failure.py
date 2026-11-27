"""Provider failures must not persist a blueprint or keep the credit."""
import importlib
import json
import sys
from types import SimpleNamespace
from unittest.mock import patch

import test_consumption_callers as f

config = sys.modules["backend.app.core.config"]
config.GROK_API_KEY = "synthetic-grok-key"
config.GROK_MODEL = "grok-4.3"
config.GROK_BASE_URL = "https://api.x.ai/v1"
sys.modules.pop("backend.app.services.blueprint", None)
blueprint_service = importlib.import_module("backend.app.services.blueprint")

REVISION = "2026-10-16T12:00:00+00:00"
MESSAGE = (
    "No hemos podido generar el blueprint ahora. No se te ha cobrado. "
    "Prueba de nuevo en unos minutos."
)


def _project():
    return {
        "project_id": "project_test",
        "user_id": "user_test",
        "updated_at": REVISION,
        "status": "refined",
        "refine_questions": [{"id": "goal", "question": "Project goal?"}],
        "refine_answers": {"goal": "synthetic"},
        "route": "idea",
        "diagnosis": {"summary": "synthetic"},
        "input_content": "synthetic project",
        "url_analysis": "synthetic URL facts",
    }


class FakeClient:
    def __init__(self, content=None, error=None):
        self.content = content
        self.error = error
        self.calls = 0
        self.closed = False
        self.messages = []
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self.create))

    async def create(self, **kwargs):
        self.calls += 1
        self.messages = kwargs.get("messages") or []
        if self.error is not None:
            raise self.error
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=self.content))]
        )

    async def close(self):
        self.closed = True


class BlueprintChargeTests(f.ChargedCallerFixture):
    def setUp(self):
        super().setUp()
        blueprint_service.GROK_API_KEY = "synthetic-grok-key"
        blueprint_service.GROK_MODEL = "grok-4.3"
        blueprint_service.GROK_BASE_URL = "https://api.x.ai/v1"
        f.projects.generate_blueprint = blueprint_service.generate_blueprint
        f.projects.BlueprintGenerationError = blueprint_service.BlueprintGenerationError
        self.db.projects.documents["project_test"].update(_project())

    def _headers(self, key):
        return SimpleNamespace(headers={"Idempotency-Key": key, "If-Match": REVISION})

    async def _fail(self, client, key):
        with patch("backend.app.ai.providers.grok_client.GrokChatClient", return_value=client):
            with self.assertRaises(f.HTTPException) as error:
                await f.projects.create_blueprint("project_test", self._headers(key))
        return error.exception

    def _assert_released(self):
        stored = self.db.projects.documents["project_test"]
        self.assertNotIn("blueprint", stored)
        self.assertNotIn("blueprint_consumption", stored)
        self.assertEqual(stored["status"], "refined")
        self.assertEqual(stored["updated_at"], REVISION)
        self.assertEqual(self.db.users.document["credit_balance"], 100)
        self.assertNotIn("credit_pending_consumption", self.db.users.document)
        entry = self.entry()
        self.assertEqual(entry["operation_status"], "compensated")
        self.assertEqual(entry["failure_type"], "HTTPException")

    async def test_provider_raise_releases_reservation_without_saving(self):
        client = FakeClient(error=TimeoutError("synthetic timeout"))
        error = await self._fail(client, "blueprint-provider-down")
        self.assertEqual(error.status_code, 503)
        self.assertEqual(error.detail["code"], "blueprint_provider_unavailable")
        self.assertEqual(error.detail["message"], MESSAGE)
        self.assertTrue(error.detail["retry_with_new_key"])
        self.assertEqual(client.calls, 1)
        self.assertTrue(client.closed)
        self._assert_released()

    async def test_invalid_json_releases_reservation_without_saving(self):
        client = FakeClient(content="esto no es json")
        error = await self._fail(client, "blueprint-invalid-json")
        self.assertEqual(error.status_code, 502)
        self.assertEqual(error.detail["code"], "blueprint_invalid_output")
        self.assertEqual(error.detail["message"], MESSAGE)
        self.assertTrue(client.closed)
        self._assert_released()

    async def test_missing_minimum_keys_is_invalid_output(self):
        client = FakeClient(content=json.dumps({"title": "Solo titulo", "summary": "Sin prioridades"}))
        error = await self._fail(client, "blueprint-missing-keys")
        self.assertEqual(error.status_code, 502)
        self.assertEqual(error.detail["code"], "blueprint_invalid_output")
        self._assert_released()

    async def test_valid_response_saves_blueprint_and_charges(self):
        payload = {
            "title": "Plan concreto",
            "summary": "Resumen concreto del proyecto",
            "priorities": ["Validar oferta", "Construir el flujo de cobro"],
        }
        client = FakeClient(content=json.dumps(payload))
        with patch("backend.app.ai.providers.grok_client.GrokChatClient", return_value=client):
            result = await f.projects.create_blueprint("project_test", self._headers("blueprint-valid"))
        stored = self.db.projects.documents["project_test"]
        self.assertEqual(stored["blueprint"], payload)
        self.assertEqual(stored["status"], "blueprint_generated")
        self.assertIn("blueprint_consumption", stored)
        self.assertEqual(result["blueprint"], payload)
        self.assertEqual(result["status"], "blueprint_generated")
        self.assertEqual(self.entry()["operation_status"], "completed")
        self.assertLess(self.db.users.document["credit_balance"], 100)
        self.assertEqual(client.calls, 1)
        self.assertTrue(client.closed)

    async def test_prompt_does_not_ask_for_deployment_and_drops_the_field(self):
        payload = {
            "title": "Plan concreto",
            "summary": "Resumen concreto del proyecto",
            "priorities": ["Validar oferta"],
            "deployment_steps": ["Publicar la web", "Configurar el dominio"],
        }
        client = FakeClient(content=json.dumps(payload))
        with patch("backend.app.ai.providers.grok_client.GrokChatClient", return_value=client):
            result = await f.projects.create_blueprint("project_test", self._headers("blueprint-no-deploy-steps"))
        prompt = client.messages[0]["content"]
        self.assertNotIn("deployment_steps", prompt)
        self.assertIn("Un tercero ejecuta", prompt)
        stored = self.db.projects.documents["project_test"]["blueprint"]
        self.assertNotIn("deployment_steps", stored)
        self.assertNotIn("deployment_steps", result["blueprint"])
        self.assertEqual(stored["title"], "Plan concreto")
