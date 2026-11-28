"""Preview SSE must end when the gem charge fails before the work starts.

The charge path is the real economic operation. Only the ledger is a fake.
"""
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")
os.environ.setdefault("BUILDER_ENABLED", "true")

import asyncio
import json
import sys
from types import SimpleNamespace

import test_consumption_callers as f

_config = sys.modules["backend.app.core.config"]
_config.GROK_API_KEY = ""
_config.GROK_MODEL = "grok-4.3"
_config.GROK_BASE_URL = "https://api.x.ai/v1"
_config.ANTHROPIC_API_KEY = ""
_config.ANTHROPIC_MODEL = "claude-haiku-5-5"
_config.ANTHROPIC_MAX_TOKENS = 8192
_config.ANTHROPIC_EFFORT = "medium"

from backend.app.routers import builder_preview
from backend.app.services.builder_charge_policy import charge_failure_policy
from backend.app.services.builder_landing_state import LandingStateError
from backend.app.services.builder_pipeline import public_preview

INSTRUCTION = "Clara, psicóloga en Madrid sk-test-do-not-log"
OTHER = "Otra instrucción distinta sk-test-do-not-log"
PREVIEW = {
    "schema": "sm.builder.preview.v1",
    "ownerId": "user_test",
    "projectId": "project_test",
    "versions": [{
        "version": 1,
        "instruction": "Clara",
        "createdAt": "2026-11-28T01:00:00+00:00",
        "html": "<h1>Clara atiende en Madrid</h1>",
    }],
}


def parse_sse(text):
    events = []
    for block in text.split("\n\n"):
        if not block.strip():
            continue
        if block.strip() == ": heartbeat":
            events.append({"type": "heartbeat"})
            continue
        name = "message"
        data = []
        for line in block.split("\n"):
            if line.startswith("event:"):
                name = line.split(":", 1)[1].strip()
            elif line.startswith("data:"):
                data.append(line.split(":", 1)[1].strip())
        payload = json.loads("\n".join(data)) if data else {}
        events.append({"type": name, **payload})
    return events


class PendingCharges:
    def __init__(self):
        self.docs = []

    async def insert_one(self, document):
        self.docs.append(dict(document))
        return SimpleNamespace(inserted_id=document.get("_id"))


class PreviewStreamChargeTests(f.ChargedCallerFixture):
    def setUp(self):
        super().setUp()
        import backend.app.core.security as security
        self.security = security
        self._user = security.get_current_user.return_value
        self._policy = os.environ.get("BUILDER_CHARGE_FAILURE_POLICY")
        self._free = os.environ.get("BUILDER_FREE_TEST_MODE")
        os.environ.pop("BUILDER_CHARGE_FAILURE_POLICY", None)
        os.environ.pop("BUILDER_FREE_TEST_MODE", None)
        os.environ["BUILDER_ENABLED"] = "true"
        self.pending = PendingCharges()
        self.calls = []
        self.security.get_current_user.return_value = {
            "user_id": "user_test",
            "plan": "premium",
            "role": "user",
        }

    def tearDown(self):
        self.security.get_current_user.return_value = self._user
        if self._policy is None:
            os.environ.pop("BUILDER_CHARGE_FAILURE_POLICY", None)
        else:
            os.environ["BUILDER_CHARGE_FAILURE_POLICY"] = self._policy
        if self._free is None:
            os.environ.pop("BUILDER_FREE_TEST_MODE", None)
        else:
            os.environ["BUILDER_FREE_TEST_MODE"] = self._free

    def _without_gems(self):
        self.db.users.document["credit_balance"] = 0
        self.db.users.document["credit_initial_free_grant_at"] = "2026-01-01T00:00:00+00:00"
        self.db.users.document["credit_lifetime_used"] = 1

    def _executor(self, blocker=None):
        async def executor(**kwargs):
            self.calls.append(kwargs.get("instruction"))
            yield {"type": "state", "phase": "construyendo", "message": "Construyendo tu página."}
            if blocker is not None:
                await blocker.wait()
            yield {
                "type": "result",
                "preview": PREVIEW,
                "public": public_preview(PREVIEW),
                "summary": "Clara",
            }
        return executor

    def _patches(self, executor):
        from unittest.mock import patch

        async def missing(*_args, **_kwargs):
            raise LandingStateError("not_found", 404)

        async def save(*_args, **_kwargs):
            return {"updated_at": "2026-11-28T01:00:00+00:00"}

        database = SimpleNamespace(
            projects=self.db.projects,
            builder_landing_states=object(),
            builder_pending_charges=self.pending,
        )
        return (
            patch.object(builder_preview, "providers_ready", return_value=None),
            patch.object(builder_preview, "db", database),
            patch.object(builder_preview, "load_generated_preview", new=missing),
            patch.object(builder_preview, "save_generated_preview", new=save),
            patch.object(builder_preview, "iter_executor", new=executor),
        )

    async def _events(self, key, instruction, timeout=2):
        response = await builder_preview.stream_preview(
            builder_preview.PreviewRequest(projectId="project_test", instruction=instruction),
            f.request(key),
        )
        chunks = []

        async def pump():
            async for chunk in response.body_iterator:
                chunks.append(chunk if isinstance(chunk, str) else chunk.decode())

        await asyncio.wait_for(pump(), timeout=timeout)
        return parse_sse("".join(chunks))

    def _assert_no_secret(self, events):
        rendered = json.dumps(events, ensure_ascii=False)
        self.assertNotIn("sk-test-do-not-log", rendered)
        self.assertNotIn("sk-test-do-not-log", json.dumps(self.pending.docs, ensure_ascii=False))

    async def test_charge_failure_policy_defaults_to_notice(self):
        os.environ.pop("BUILDER_CHARGE_FAILURE_POLICY", None)
        self.assertEqual(charge_failure_policy(), "notice")
        for value in ("", "false", "nope", "NOTICE"):
            os.environ["BUILDER_CHARGE_FAILURE_POLICY"] = value
            self.assertEqual(charge_failure_policy(), "notice")
        os.environ["BUILDER_CHARGE_FAILURE_POLICY"] = "continue"
        self.assertEqual(charge_failure_policy(), "continue")

    async def test_technical_charge_error_emits_notice_then_done_and_records_pending_charge(self):
        async def explode(_document):
            raise TimeoutError("synthetic ledger timeout")

        self.db.ledger.insert_one = explode
        before = {task for task in asyncio.all_tasks() if not task.done()}
        with self._stack(self._executor()), self.assertLogs(
            "backend.app.services.builder_charge_policy", level="ERROR",
        ) as logs:
            events = await self._events("charge-timeout-1", INSTRUCTION)
        joined = "\n".join(logs.output)
        self.assertIn("builder_charge_pending", joined)
        self.assertIn("run_id=builder_preview:charge-timeout-1", joined)
        self.assertIn("user_id=user_test", joined)
        self.assertIn("project_id=project_test", joined)
        self.assertIn("category=timeout", joined)
        self.assertNotIn("sk-test-do-not-log", joined)
        self.assertNotIn("synthetic ledger timeout", joined)
        kinds = [event["type"] for event in events]
        self.assertIn("notice", kinds)
        self.assertIn("done", kinds)
        self.assertLess(kinds.index("notice"), kinds.index("done"))
        self.assertEqual(events[kinds.index("notice")]["message"], "Cobro pendiente de confirmar")
        self.assertNotIn("heartbeat", kinds)
        self.assertEqual(len(self.pending.docs), 1)
        pending = self.pending.docs[0]
        self.assertEqual(pending["status"], "pending")
        self.assertEqual(pending["category"], "timeout")
        self.assertEqual(pending["user_id"], "user_test")
        self.assertEqual(pending["project_id"], "project_test")
        self.assertEqual(pending["run_id"], "builder_preview:charge-timeout-1")
        self.assertEqual(self.db.users.document["credit_balance"], 100)
        self.assertEqual(self.db.ledger.documents, {})
        self.assertEqual(len(self.calls), 1)
        self._assert_no_secret(events)
        await asyncio.sleep(0)
        leaked = {task for task in asyncio.all_tasks() if not task.done()} - before
        self.assertEqual(leaked, set())

    async def test_insufficient_balance_notice_policy_closes_without_heartbeats(self):
        os.environ.pop("BUILDER_CHARGE_FAILURE_POLICY", None)
        self._without_gems()
        before = {task for task in asyncio.all_tasks() if not task.done()}
        started = asyncio.get_running_loop().time()
        with self._stack(self._executor()):
            events = await self._events("no-gems-notice-1", INSTRUCTION)
        elapsed = asyncio.get_running_loop().time() - started
        self.assertLess(elapsed, 2)
        kinds = [event["type"] for event in events]
        self.assertNotIn("heartbeat", kinds)
        self.assertNotIn("done", kinds)
        notices = [event for event in events if event["type"] == "notice"]
        errors = [event for event in events if event["type"] == "error"]
        self.assertEqual(notices[0]["message"], "No tienes gemas suficientes")
        self.assertEqual(notices[0]["plansUrl"], "/dashboard/billing")
        self.assertEqual(errors[-1]["message"], "No tienes gemas suficientes")
        self.assertEqual(errors[-1]["plansUrl"], "/dashboard/billing")
        self.assertEqual(self.calls, [])
        self.assertEqual(self.pending.docs, [])
        self.assertEqual(self.db.users.document["credit_balance"], 0)
        self._assert_no_secret(events)
        await asyncio.sleep(0)
        leaked = {task for task in asyncio.all_tasks() if not task.done()} - before
        self.assertEqual(leaked, set())

    async def test_insufficient_balance_continue_policy_finishes_and_records_pending_charge(self):
        os.environ["BUILDER_CHARGE_FAILURE_POLICY"] = "continue"
        self._without_gems()
        with self._stack(self._executor()):
            events = await self._events("no-gems-continue-1", INSTRUCTION)
        kinds = [event["type"] for event in events]
        self.assertLess(kinds.index("notice"), kinds.index("done"))
        self.assertEqual(events[kinds.index("notice")]["message"], "Cobro pendiente de confirmar")
        self.assertEqual(len(self.pending.docs), 1)
        self.assertEqual(self.pending.docs[0]["status"], "pending")
        self.assertEqual(self.pending.docs[0]["category"], "insufficient_gems")
        self.assertEqual(self.db.users.document["credit_balance"], 0)
        self.assertEqual(self.db.ledger.documents, {})
        self.assertEqual(len(self.calls), 1)
        self.assertTrue(any(event.get("html") for event in events if event["type"] == "done"))

    async def test_duplicate_idempotency_key_emits_a_terminal_event(self):
        with self._stack(self._executor()):
            first = await self._events("duplicate-key-1", INSTRUCTION)
            second = await self._events("duplicate-key-1", OTHER)
        self.assertTrue(any(event["type"] == "done" for event in first))
        errors = [event for event in second if event["type"] == "error"]
        self.assertTrue(errors)
        self.assertIn("clave", errors[-1]["message"])
        self.assertNotIn("heartbeat", [event["type"] for event in second])
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.pending.docs, [])

    async def test_completed_replay_emits_done_and_closes(self):
        with self._stack(self._executor()):
            first = await self._events("replay-key-1", INSTRUCTION)
            balance = self.db.users.document["credit_balance"]
            second = await self._events("replay-key-1", INSTRUCTION)
        self.assertTrue(any(event["type"] == "done" and event.get("html") for event in first))
        self.assertTrue(any(event["type"] == "done" and event.get("html") for event in second))
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.db.users.document["credit_balance"], balance)

    async def test_in_progress_duplicate_emits_a_terminal_event(self):
        release = asyncio.Event()
        with self._stack(self._executor(release)):
            first = asyncio.create_task(self._events("running-key-1", INSTRUCTION, timeout=4))
            for _ in range(100):
                if self.calls:
                    break
                await asyncio.sleep(0.01)
            self.assertEqual(self.calls, [INSTRUCTION])
            second = await self._events("running-key-1", INSTRUCTION)
            self.assertTrue(any(
                event["type"] == "error" and "curso" in event["message"] for event in second
            ))
            self.assertEqual(self.calls, [INSTRUCTION])
            release.set()
            done = await first
        self.assertTrue(any(event["type"] == "done" for event in done))
        self.assertEqual(len(self.calls), 1)

    async def test_admin_free_test_mode_skips_the_charge(self):
        os.environ["BUILDER_FREE_TEST_MODE"] = "true"
        self.security.get_current_user.return_value = {
            "user_id": "user_test",
            "plan": "premium",
            "role": "admin",
        }
        with self._stack(self._executor()), self.assertLogs(
            "backend.app.services.builder_test_mode", level="INFO",
        ) as logs:
            events = await self._events("admin-free-1", INSTRUCTION)
        self.assertTrue(any(event["type"] == "done" and event.get("html") for event in events))
        self.assertFalse(any(event["type"] == "notice" for event in events))
        self.assertEqual(self.db.users.document["credit_balance"], 100)
        self.assertEqual(self.db.ledger.documents, {})
        self.assertEqual(self.pending.docs, [])
        self.assertIn("builder_charge_skipped action=builder_preview", "\n".join(logs.output))
        self.assertNotIn("sk-test-do-not-log", "\n".join(logs.output))

    async def test_happy_path_charges_and_emits_done(self):
        with self._stack(self._executor()):
            events = await self._events("happy-stream-1", INSTRUCTION)
        done = [event for event in events if event["type"] == "done"]
        self.assertEqual(len(done), 1)
        self.assertIn("Clara", done[0]["html"])
        self.assertFalse(any(event["type"] == "notice" for event in events))
        self.assertFalse(any(event["type"] == "error" for event in events))
        self.assertEqual(self.pending.docs, [])
        self.assertLess(self.db.users.document["credit_balance"], 100)
        self.assertGreater(self.db.users.document["credit_balance"], 0)
        entry = next(iter(self.db.ledger.documents.values()))
        self.assertEqual(entry["operation_status"], "completed")
        self.assertLess(entry["credits_delta"], 0)
        self.assertEqual(
            self.db.users.document["credit_balance"],
            100 + entry["credits_delta"],
        )

    async def test_work_exception_emits_a_terminal_event_and_refunds(self):
        async def executor(**_kwargs):
            self.calls.append("boom")
            yield {"type": "state", "phase": "construyendo", "message": "Construyendo tu página."}
            raise RuntimeError("synthetic executor failure")

        with self._stack(executor):
            events = await self._events("work-fails-1", INSTRUCTION)
        self.assertTrue(any(event["type"] == "error" and event.get("message") for event in events))
        self.assertNotIn("synthetic executor failure", json.dumps(events))
        self.assertEqual(self.db.users.document["credit_balance"], 100)
        self.assertEqual(self.entry()["operation_status"], "compensated")

    async def test_client_disconnect_cancels_tasks(self):
        release = asyncio.Event()
        before = {task for task in asyncio.all_tasks() if not task.done()}
        with self._stack(self._executor(release)):
            response = await builder_preview.stream_preview(
                builder_preview.PreviewRequest(projectId="project_test", instruction=INSTRUCTION),
                f.request("disconnect-1"),
            )
            agen = response.body_iterator
            await asyncio.wait_for(agen.__anext__(), timeout=2)
            await asyncio.wait_for(agen.aclose(), timeout=2)
        await asyncio.sleep(0)
        leaked = {task for task in asyncio.all_tasks() if not task.done()} - before
        self.assertEqual(leaked, set())
        self.assertEqual(self.db.users.document["credit_balance"], 100)
        self.assertEqual(self.entry()["operation_status"], "compensated")

    def _stack(self, executor):
        from contextlib import ExitStack
        stack = ExitStack()
        for patcher in self._patches(executor):
            stack.enter_context(patcher)
        return stack
