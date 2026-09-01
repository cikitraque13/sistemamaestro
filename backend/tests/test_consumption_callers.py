"""Exercise real charged router functions with local-only dependency stubs.

FastAPI/ASGI transport and MongoDB are deliberately NOT simulated as proven.
Run in a separate process from the auth suite (which installs different stubs).
"""
import asyncio
from copy import deepcopy
import json
import sys
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import AsyncMock, patch

from backend.tests.test_credit_consumption_safety import FakeDb, Result, credits


def stub(name, **attributes):
    module = ModuleType(name)
    for key, value in attributes.items():
        setattr(module, key, value)
    sys.modules[name] = module


class HTTPException(Exception):
    def __init__(self, status_code, detail):
        super().__init__(str(detail))
        self.status_code, self.detail = status_code, detail


class APIRouter:
    def __init__(self, *args, **kwargs):
        pass

    def __getattr__(self, name):
        return lambda *args, **kwargs: lambda function: function


stub("fastapi", APIRouter=APIRouter, HTTPException=HTTPException, Request=object,
     status=SimpleNamespace(HTTP_400_BAD_REQUEST=400, HTTP_500_INTERNAL_SERVER_ERROR=500))
stub("fastapi.encoders", jsonable_encoder=lambda value: json.loads(json.dumps(value)))
stub("backend.app.core.security", get_current_user=AsyncMock(return_value={"user_id": "user_test", "plan": "premium"}))
stub("backend.app.services.ai_analysis", analyze_with_ai=AsyncMock())
stub("backend.app.services.blueprint", generate_blueprint=AsyncMock())
stub("backend.app.services.plan_recommendation", build_plan_recommendation=lambda **kwargs: {})
stub("backend.app.services.semantic_admission", run_semantic_admission=lambda *args, **kwargs: {})
stub("backend.app.services.semantic_admission_trace", build_semantic_admission_trace_payload=lambda **kwargs: {},
     emit_semantic_admission_trace=lambda *args, **kwargs: None, should_emit_semantic_admission_trace=lambda *args: False)
stub("backend.app.services.url_analysis", fetch_and_analyze_url=AsyncMock())
stub("backend.app.ai.agents.builder_agent", run_builder_agent=AsyncMock())
stub("backend.app.ai.guards.cost_guard", assess_cost=lambda value: {"action": "allow"})
stub("backend.app.ai.guards.output_guard", validate_output_shape=lambda *args: {"valid": True})
stub("backend.app.ai.guards.policy_guard", evaluate_policy=lambda **kwargs: {"allowed": True})
stub("backend.app.ai.guards.security_guard", assess_security_context=lambda value: {"action": "allow"})
stub("backend.app.ai.telemetry.agent_trace", build_trace=lambda **kwargs: {"status": "completed"})

from backend.app.routers import builder_ai, projects, consumption
from backend.app.ai.schemas.builder_ai_output import BuilderAIInput
from backend.app.schemas.projects import ProjectCreate
from backend.tests.test_credit_consumption_safety import engine_payload


class FakeProjects:
    def __init__(self):
        self.documents = {"project_test": {"project_id": "project_test", "user_id": "user_test"}}
        self.write_mode = None
        self.insert_count = 0

    async def find_one(self, query, projection=None):
        doc = self.documents.get(query["project_id"])
        return deepcopy(doc) if doc and doc.get("user_id") == query.get("user_id", doc.get("user_id")) else None

    async def insert_one(self, doc):
        self.insert_count += 1
        if self.write_mode == "before":
            raise TimeoutError("synthetic unknown write")
        self.documents[doc["project_id"]] = deepcopy(doc)
        if self.write_mode == "after":
            raise TimeoutError("synthetic committed write timeout")
        if self.write_mode == "cancel_after":
            raise asyncio.CancelledError()
        return Result(1)

    async def find_one_and_update(self, query, update, **kwargs):
        doc = await self.find_one(query)
        if doc is None:
            return None
        if self.write_mode == "before":
            raise TimeoutError("synthetic unknown update")
        doc.update(deepcopy(update["$set"]))
        self.documents[query["project_id"]] = deepcopy(doc)
        if self.write_mode == "after":
            raise TimeoutError("synthetic committed update timeout")
        return doc


def request(key="logical-operation-1"):
    return SimpleNamespace(headers={"Idempotency-Key": key} if key else {})


class ChargedCallerTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.db = FakeDb(100)
        self.db.projects = FakeProjects()
        self.analysis = AsyncMock(return_value={"route": "idea", "diagnosis": {"ok": True}})
        self.blueprint = AsyncMock(return_value={"steps": ["synthetic"]})
        self.builder = AsyncMock(return_value=SimpleNamespace(model_dump=lambda: {"assistantMessage": "synthetic", "warnings": []}))
        for target, field, value in (
            (credits, "db", self.db), (projects, "db", self.db), (builder_ai, "db", self.db),
            (projects, "analyze_with_ai", self.analysis), (projects, "generate_blueprint", self.blueprint),
            (projects, "_run_semantic_admission_shadow", lambda value: None),
            (builder_ai, "run_builder_agent", self.builder),
        ):
            handle = patch.object(target, field, value)
            handle.start()
            self.addCleanup(handle.stop)

    async def call(self, kind, key="logical-operation-1", text="synthetic input"):
        if kind == "project":
            return await projects.create_project(ProjectCreate(input_content=text), request(key))
        if kind == "blueprint":
            return await projects.create_blueprint("project_test", request(key))
        return await builder_ai.build_with_ai(BuilderAIInput(userInput=text), request(key))

    def entry(self):
        return next(iter(self.db.ledger.documents.values()))

    async def test_each_real_caller_replays_exact_durable_response_once(self):
        for kind, worker in (("project", self.analysis), ("blueprint", self.blueprint), ("builder", self.builder)):
            with self.subTest(kind=kind):
                first = await self.call(kind, key=f"{kind}-operation-1")
                balance = self.db.users.document["credit_balance"]
                # Replay must not need current balance or current plan.
                with patch.object(credits, "get_user_credit_summary", side_effect=AssertionError("must not evaluate replay")):
                    second = await self.call(kind, key=f"{kind}-operation-1")
                self.assertEqual(first, second)
                self.assertEqual(self.db.users.document["credit_balance"], balance)
                self.assertEqual(worker.await_count, 1)
        self.assertEqual(len(self.db.ledger.documents), 3)
        self.assertTrue(all(x["operation_status"] == "completed" for x in self.db.ledger.documents.values()))

    async def test_distinct_keys_are_distinct_operations(self):
        await self.call("builder", "separate-operation-1")
        await self.call("builder", "separate-operation-2")
        self.assertEqual(self.builder.await_count, 2)
        self.assertEqual(len(self.db.ledger.documents), 2)

    async def test_changed_input_same_key_is_conflict_without_work(self):
        await self.call("builder")
        balance = self.db.users.document["credit_balance"]
        with self.assertRaises(HTTPException) as error:
            await self.call("builder", text="different synthetic input")
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(self.builder.await_count, 1)
        self.assertEqual(self.db.users.document["credit_balance"], balance)

    async def test_missing_keys_fail_before_charge_for_all_callers(self):
        for kind in ("project", "blueprint", "builder"):
            with self.assertRaises(HTTPException) as error:
                await self.call(kind, key=None)
            self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(len(self.db.ledger.documents), 0)

    async def test_guard_rejection_compensates_without_running_ai(self):
        with patch.object(builder_ai, "run_builder_ai_guards", return_value={"policy": {"allowed": False}}):
            with self.assertRaises(HTTPException) as error:
                await self.call("builder")
        self.assertEqual(error.exception.status_code, 403)
        self.assertEqual(self.db.users.document["credit_balance"], 100)
        self.assertEqual(self.entry()["operation_status"], "compensated")
        self.builder.assert_not_awaited()

    async def test_downstream_ai_error_refunds_and_retry_never_reexecutes(self):
        self.builder.side_effect = RuntimeError("synthetic failure")
        with self.assertRaises(HTTPException):
            await self.call("builder")
        with self.assertRaises(HTTPException) as error:
            await self.call("builder")
        self.assertEqual(error.exception.status_code, 409)
        self.assertTrue(error.exception.detail["retry_with_new_key"])
        self.assertEqual(self.builder.await_count, 1)
        self.assertEqual(self.db.users.document["credit_balance"], 100)

    async def test_output_validation_failure_refunds(self):
        with patch.object(builder_ai, "validate_output_shape", return_value={"valid": False}):
            with self.assertRaises(HTTPException) as error:
                await self.call("builder")
        self.assertEqual(error.exception.status_code, 422)
        self.assertEqual(self.entry()["operation_status"], "compensated")
        self.assertEqual(self.db.users.document["credit_balance"], 100)

    async def test_cancellation_before_persistence_refunds(self):
        self.analysis.side_effect = asyncio.CancelledError()
        with self.assertRaises(asyncio.CancelledError):
            await self.call("project")
        self.assertEqual(self.db.users.document["credit_balance"], 100)
        self.assertEqual(self.entry()["operation_status"], "compensated")

    async def test_project_commit_then_timeout_or_cancel_reads_back_before_charging(self):
        for mode in ("after", "cancel_after"):
            self.db.projects.write_mode = mode
            first = await self.call("project", key=f"project-{mode}-operation")
            second = await self.call("project", key=f"project-{mode}-operation")
            self.assertEqual(first, second)
            stored = self.db.projects.documents[first["project_id"]]
            self.assertEqual(stored["analysis_consumption"]["trace"]["operation_status"], "reserved")
            self.assertEqual(first["analysis_consumption"]["trace"]["operation_status"], "completed")
        self.assertEqual(self.analysis.await_count, 2)
        self.assertTrue(all(x["operation_status"] == "completed" for x in self.db.ledger.documents.values()))

    async def test_blueprint_commit_then_timeout_reads_back(self):
        self.db.projects.write_mode = "after"
        first = await self.call("blueprint")
        second = await self.call("blueprint")
        self.assertEqual(first, second)
        self.assertEqual(self.blueprint.await_count, 1)
        self.assertEqual(self.entry()["operation_status"], "completed")

    async def test_uncertain_project_write_holds_reservation_and_retry_does_not_work(self):
        self.db.projects.write_mode = "before"
        with self.assertRaises(HTTPException) as error:
            await self.call("project")
        self.assertEqual(error.exception.status_code, 503)
        self.assertEqual(error.exception.detail["code"], "economic_reconciliation_required")
        with self.assertRaises(HTTPException):
            await self.call("project")
        self.assertEqual(self.entry()["operation_status"], "reserved")
        self.assertIn("credit_pending_consumption", self.db.users.document)
        self.assertEqual(self.analysis.await_count, 1)

    async def test_concurrent_http_callers_do_work_once(self):
        started, release = asyncio.Event(), asyncio.Event()
        async def slow(payload):
            started.set()
            await release.wait()
            return SimpleNamespace(model_dump=lambda: {"warnings": []})
        self.builder.side_effect = slow
        first = asyncio.create_task(self.call("builder"))
        await started.wait()
        with self.assertRaises(HTTPException) as error:
            await self.call("builder")
        self.assertEqual(error.exception.status_code, 409)
        release.set()
        await first
        self.assertEqual(self.builder.await_count, 1)
        self.assertEqual(len(self.db.ledger.documents), 1)

    async def test_direct_execute_missing_identity_is_400(self):
        payload = engine_payload()
        payload.meta.trace_id = None
        with self.assertRaises(HTTPException) as error:
            await consumption.execute_consumption(payload, request())
        self.assertEqual(error.exception.status_code, 400)

    async def test_preinsert_same_key_race_retains_identity_and_replays_one_result(self):
        from backend.app.services import consumption_engine
        original_get = consumption_engine.get_credit_operation
        barrier, started, release = asyncio.Event(), asyncio.Event(), asyncio.Event()
        readers = 0

        async def simultaneous_reads(*args):
            nonlocal readers
            result = await original_get(*args)
            readers += 1
            if readers == 2:
                barrier.set()
            await barrier.wait()
            return result

        original_result = self.builder.return_value
        async def held_work(*args):
            started.set()
            await release.wait()
            return original_result

        self.builder.side_effect = held_work
        tasks = []
        try:
            with patch.object(consumption_engine, "get_credit_operation", simultaneous_reads):
                tasks = [asyncio.create_task(self.call("builder", "race-original-key")) for _ in range(2)]
                await asyncio.wait_for(started.wait(), 2)
                done, pending = await asyncio.wait(tasks, timeout=2, return_when=asyncio.FIRST_COMPLETED)
                self.assertEqual((len(done), len(pending)), (1, 1))
                loser = next(iter(done)).exception()
                self.assertIsInstance(loser, HTTPException)
                self.assertEqual(loser.status_code, 409)
                self.assertEqual(loser.detail["trace"]["operation_status"], "reserved")
                self.assertFalse(loser.detail.get("retry_with_new_key", False))
                self.assertNotEqual(loser.detail["ux"]["next_step_hint"], "start_new_operation")
                release.set()
                original = await next(iter(pending))
            # Model the lost winner response without discarding its identity.
            replay = await self.call("builder", "race-original-key")
            self.assertEqual(replay, original)
            self.assertEqual(self.builder.await_count, 1)
            self.assertEqual(len(self.db.ledger.documents), 1)
            self.assertEqual(self.db.users.document["credit_balance"], 99)
        finally:
            release.set()
            await asyncio.gather(*tasks, return_exceptions=True)


if __name__ == "__main__":
    unittest.main()
