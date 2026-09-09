import asyncio
from copy import deepcopy
import sys
from types import ModuleType
import unittest
from unittest.mock import patch


mongodb_stub = ModuleType("backend.app.db.mongodb")
mongodb_stub.db = None
config_stub = ModuleType("backend.app.core.config")
config_stub.CREDIT_LEDGER_COLLECTION = "credit_ledger"
config_stub.PLAN_INCLUDED_CREDITS = {"free": 0}
config_stub.JWT_ALGORITHM = "HS256"
config_stub.JWT_SECRET = "unit-test-secret"
config_stub.get_google_client_id = lambda: None
sys.modules.setdefault("backend.app.core.config", config_stub)
sys.modules.setdefault("backend.app.db.mongodb", mongodb_stub)

from backend.app.services import credits
from backend.app.schemas.consumption import ConsumptionRequest
from backend.app.services import consumption_engine


class Result:
    def __init__(self, modified_count=0):
        self.modified_count = modified_count


def _get_path(document, path):
    value = document
    for part in path.split("."):
        if not isinstance(value, dict) or part not in value:
            return None, False
        value = value[part]
    return value, True


def _matches(document, query):
    for key, expected in query.items():
        if key == "$or":
            if not any(_matches(document, condition) for condition in expected):
                return False
            continue

        actual, exists = _get_path(document, key)
        if isinstance(expected, dict):
            if "$in" in expected and actual not in expected["$in"]:
                return False
            if "$gte" in expected and (not exists or actual < expected["$gte"]):
                return False
            if "$exists" in expected and exists != expected["$exists"]:
                return False
            continue
        if not exists or actual != expected:
            return False
    return True


def _set_path(document, path, value):
    target = document
    parts = path.split(".")
    for part in parts[:-1]:
        target = target.setdefault(part, {})
    target[parts[-1]] = deepcopy(value)


def _unset_path(document, path):
    target = document
    parts = path.split(".")
    for part in parts[:-1]:
        target = target.get(part, {})
    target.pop(parts[-1], None)


def _apply_update(document, update):
    for path, value in update.get("$inc", {}).items():
        current, exists = _get_path(document, path)
        _set_path(document, path, (current if exists else 0) + value)
    for path, value in update.get("$set", {}).items():
        _set_path(document, path, value)
    for path in update.get("$unset", {}):
        _unset_path(document, path)


class FakeUsers:
    def __init__(self, balance):
        self.document = {
            "user_id": "user_test",
            "credit_balance": balance,
            "credit_lifetime_used": 0,
        }
        self.lock = asyncio.Lock()

    async def find_one(self, query, projection=None):
        async with self.lock:
            if not _matches(self.document, query):
                return None
            return deepcopy(self.document)

    async def find_one_and_update(
        self,
        query,
        update,
        projection=None,
        return_document=None,
    ):
        async with self.lock:
            if not _matches(self.document, query):
                return None
            _apply_update(self.document, update)
            return deepcopy(self.document)

    async def update_one(self, query, update):
        async with self.lock:
            if not _matches(self.document, query):
                return Result(0)
            _apply_update(self.document, update)
            return Result(1)


class FakeLedger:
    def __init__(self, fail_completion_once=False):
        self.documents = {}
        self.lock = asyncio.Lock()
        self.fail_completion_once = fail_completion_once

    async def insert_one(self, document):
        async with self.lock:
            if "_id" not in document:
                document["_id"] = document["entry_id"]
            key = document["_id"]
            if key in self.documents:
                raise RuntimeError("duplicate key")
            self.documents[key] = deepcopy(document)
            return Result(1)

    async def find_one(self, query, projection=None):
        async with self.lock:
            for document in self.documents.values():
                if _matches(document, query):
                    return deepcopy(document)
            return None

    async def update_one(self, query, update):
        async with self.lock:
            for document in self.documents.values():
                if not _matches(document, query):
                    continue
                if (
                    self.fail_completion_once
                    and update.get("$set", {}).get("operation_status") == "completed"
                ):
                    self.fail_completion_once = False
                    raise RuntimeError("synthetic ledger finalization failure")
                _apply_update(document, update)
                return Result(1)
            return Result(0)

    async def delete_one(self, query):
        async with self.lock:
            for key, document in list(self.documents.items()):
                if _matches(document, query):
                    del self.documents[key]
                    return Result(1)
            return Result(0)


class FakeDb:
    def __init__(self, balance, fail_completion_once=False):
        self.users = FakeUsers(balance)
        self.ledger = FakeLedger(fail_completion_once)

    def __getitem__(self, name):
        return self.ledger


def consumption_kwargs(operation_id="operation_test", amount=4):
    return {
        "user_id": "user_test",
        "credits_amount": amount,
        "operation_id": operation_id,
        "reason_code": "consumption_execute",
        "project_id": "project_test",
        "meta": {
            "action_key": "builder_first_run",
            "trace_id": operation_id,
            "surface": "builder",
            "entry_point": "builder_ai_build",
        },
    }


def engine_payload(operation_id="engine_operation"):
    return ConsumptionRequest(
        mode="execute",
        action_key="builder_first_run",
        user_context={
            "user_id": "untrusted_user",
            "user_plan": "free",
            "credit_balance": 999,
            "special_credit_balance": 0,
        },
        project_context={
            "project_id": "project_test",
            "project_complexity_score": 1,
            "journey_depth_score": 1,
            "output_value_score": 1,
            "operational_cost_score": 1,
        },
        meta={
            "trace_id": operation_id,
            "surface": "builder",
            "entry_point": "builder_ai_build",
        },
    )


class CreditConsumptionSafetyTests(unittest.IsolatedAsyncioTestCase):
    async def test_sufficient_balance_creates_traceable_completed_movement(self):
        fake_db = FakeDb(balance=10)
        with patch.object(credits, "db", fake_db):
            result = await credits.consume_standard_credits(**consumption_kwargs())

        self.assertEqual(fake_db.users.document["credit_balance"], 6)
        self.assertEqual(fake_db.users.document["credit_lifetime_used"], 4)
        self.assertNotIn("credit_pending_consumption", fake_db.users.document)
        self.assertEqual(result["balance_after"], 6)
        self.assertFalse(result["idempotent_replay"])

        entry = next(iter(fake_db.ledger.documents.values()))
        self.assertEqual(entry["operation_status"], "completed")
        self.assertEqual(entry["operation_id"], "operation_test")
        self.assertEqual(entry["user_id"], "user_test")
        self.assertEqual(entry["project_id"], "project_test")
        self.assertEqual(entry["credits_delta"], -4)
        self.assertEqual(entry["credits_balance_after"], 6)
        self.assertEqual(entry["reason_code"], "consumption_execute")
        self.assertEqual(entry["meta"]["action_key"], "builder_first_run")
        self.assertEqual(entry["meta"]["trace_id"], "operation_test")
        self.assertEqual(entry["meta"]["surface"], "builder")
        self.assertEqual(entry["meta"]["entry_point"], "builder_ai_build")

    async def test_insufficient_balance_never_goes_negative(self):
        fake_db = FakeDb(balance=3)
        with patch.object(credits, "db", fake_db):
            with self.assertRaises(credits.InsufficientCreditsError):
                await credits.consume_standard_credits(**consumption_kwargs())

        self.assertEqual(fake_db.users.document["credit_balance"], 3)
        self.assertEqual(fake_db.users.document["credit_lifetime_used"], 0)
        entry = next(iter(fake_db.ledger.documents.values()))
        self.assertEqual(entry["operation_status"], "blocked_insufficient")

    async def test_same_operation_retry_returns_prior_result_without_new_charge(self):
        fake_db = FakeDb(balance=10)
        with patch.object(credits, "db", fake_db):
            first = await credits.consume_standard_credits(**consumption_kwargs())
            retry = await credits.consume_standard_credits(**consumption_kwargs())

        self.assertEqual(fake_db.users.document["credit_balance"], 6)
        self.assertEqual(fake_db.users.document["credit_lifetime_used"], 4)
        self.assertEqual(len(fake_db.ledger.documents), 1)
        self.assertEqual(first["entry_id"], retry["entry_id"])
        self.assertTrue(retry["idempotent_replay"])

    async def test_concurrent_same_operation_charges_once(self):
        fake_db = FakeDb(balance=10)
        with patch.object(credits, "db", fake_db):
            results = await asyncio.gather(
                credits.consume_standard_credits(**consumption_kwargs()),
                credits.consume_standard_credits(**consumption_kwargs()),
            )

        self.assertEqual(fake_db.users.document["credit_balance"], 6)
        self.assertEqual(fake_db.users.document["credit_lifetime_used"], 4)
        self.assertEqual(len(fake_db.ledger.documents), 1)
        self.assertEqual({result["entry_id"] for result in results}, {results[0]["entry_id"]})

    async def test_concurrent_distinct_operations_cannot_spend_same_balance(self):
        fake_db = FakeDb(balance=5)
        with patch.object(credits, "db", fake_db):
            results = await asyncio.gather(
                credits.consume_standard_credits(
                    **consumption_kwargs(operation_id="operation_a")
                ),
                credits.consume_standard_credits(
                    **consumption_kwargs(operation_id="operation_b")
                ),
                return_exceptions=True,
            )

        successes = [result for result in results if isinstance(result, dict)]
        failures = [result for result in results if isinstance(result, Exception)]
        self.assertEqual(len(successes), 1)
        self.assertEqual(len(failures), 1)
        self.assertIsInstance(failures[0], credits.InsufficientCreditsError)
        self.assertEqual(fake_db.users.document["credit_balance"], 1)
        self.assertEqual(fake_db.users.document["credit_lifetime_used"], 4)

    async def test_ledger_failure_after_debit_is_compensated(self):
        fake_db = FakeDb(balance=10, fail_completion_once=True)
        with patch.object(credits, "db", fake_db):
            with self.assertRaises(credits.CreditLedgerPersistenceError) as raised:
                await credits.consume_standard_credits(**consumption_kwargs())

        self.assertTrue(raised.exception.compensated)
        self.assertEqual(fake_db.users.document["credit_balance"], 10)
        self.assertEqual(fake_db.users.document["credit_lifetime_used"], 0)
        self.assertNotIn("credit_pending_consumption", fake_db.users.document)
        entry = next(iter(fake_db.ledger.documents.values()))
        self.assertEqual(entry["operation_status"], "compensated")

    async def test_engine_returns_durable_trace_and_idempotent_retry(self):
        fake_db = FakeDb(balance=10)
        with patch.object(credits, "db", fake_db):
            first = await consumption_engine.execute_consumption_for_user(
                runtime_user={"user_id": "user_test", "plan": "free"},
                payload=engine_payload(),
            )
            retry = await consumption_engine.execute_consumption_for_user(
                runtime_user={"user_id": "user_test", "plan": "free"},
                payload=engine_payload(),
            )

        self.assertEqual(first.status, "allowed")
        self.assertTrue(first.trace.executed)
        self.assertEqual(first.trace.operation_id, "engine_operation")
        self.assertTrue(first.trace.ledger_entry_id.startswith("cled_consume_"))
        self.assertEqual(first.trace.balance_after, 9)
        self.assertFalse(first.trace.idempotent_replay)
        self.assertEqual(retry.status, "allowed")
        self.assertTrue(retry.trace.idempotent_replay)
        self.assertEqual(retry.trace.ledger_entry_id, first.trace.ledger_entry_id)
        self.assertEqual(fake_db.users.document["credit_balance"], 9)

    async def test_engine_reports_compensated_ledger_failure_without_charge(self):
        fake_db = FakeDb(balance=10, fail_completion_once=True)
        with patch.object(credits, "db", fake_db):
            result = await consumption_engine.execute_consumption_for_user(
                runtime_user={"user_id": "user_test", "plan": "free"},
                payload=engine_payload("engine_failure"),
            )

        self.assertEqual(result.status, "blocked_balance")
        self.assertTrue(result.gates.balance_gate_triggered)
        self.assertIn("saldo fue restaurado", result.ux.message)
        self.assertEqual(fake_db.users.document["credit_balance"], 10)
        self.assertEqual(fake_db.users.document["credit_lifetime_used"], 0)

    async def test_completed_engine_retry_survives_balance_and_plan_change(self):
        fake_db = FakeDb(balance=1)
        with patch.object(credits, "db", fake_db):
            first = await consumption_engine.execute_consumption_for_user(
                runtime_user={"user_id": "user_test", "plan": "premium"}, payload=engine_payload(),
            )
            retry = await consumption_engine.execute_consumption_for_user(
                runtime_user={"user_id": "user_test", "plan": "unknown"}, payload=engine_payload(),
            )
        self.assertEqual(first.status, "allowed")
        self.assertEqual(retry.status, "allowed")
        self.assertEqual(fake_db.users.document["credit_balance"], 0)
        self.assertTrue(retry.trace.idempotent_replay)

    async def test_reservation_retry_never_owns_execution(self):
        fake_db = FakeDb(balance=10)
        with patch.object(credits, "db", fake_db):
            await credits.consume_standard_credits(**consumption_kwargs(), defer_finalization=True)
            with self.assertRaises(credits.CreditOperationBusyError):
                await credits.consume_standard_credits(**consumption_kwargs(), defer_finalization=True)
        self.assertEqual(fake_db.users.document["credit_balance"], 6)

    async def test_finalization_timeout_after_write_reads_durable_result(self):
        fake_db = FakeDb(balance=10)
        original = fake_db.ledger.update_one
        async def ambiguous(query, update):
            result = await original(query, update)
            if update.get("$set", {}).get("operation_status") == "completed":
                raise TimeoutError("synthetic acknowledged-lost write")
            return result
        with patch.object(credits, "db", fake_db):
            await credits.consume_standard_credits(**consumption_kwargs(), defer_finalization=True)
            with patch.object(fake_db.ledger, "update_one", ambiguous):
                result = await credits.finalize_standard_credit_consumption(
                    user_id="user_test", operation_id="operation_test", durable_result={"ok": True},
                )
        self.assertEqual(result["operation_status"], "completed")
        self.assertEqual(result["durable_result"], {"ok": True})
        self.assertEqual(fake_db.users.document["credit_balance"], 6)

    async def test_compensation_and_finalization_are_mutually_exclusive(self):
        fake_db = FakeDb(balance=10)
        with patch.object(credits, "db", fake_db):
            await credits.consume_standard_credits(**consumption_kwargs(), defer_finalization=True)
            await asyncio.gather(
                credits.compensate_standard_credit_consumption(
                    user_id="user_test", operation_id="operation_test", failure_type="synthetic",
                ),
                credits.finalize_standard_credit_consumption(
                    user_id="user_test", operation_id="operation_test", durable_result={"ok": True},
                ), return_exceptions=True,
            )
        entry = next(iter(fake_db.ledger.documents.values()))
        self.assertIn(entry["operation_status"], {"completed", "compensated"})
        self.assertEqual(fake_db.users.document["credit_balance"], 6 if entry["operation_status"] == "completed" else 10)

    async def test_refund_crash_keeps_evidence_and_prevents_retry_debit(self):
        fake_db = FakeDb(balance=10)
        original = fake_db.ledger.update_one
        async def fail_compensated(query, update):
            if update.get("$set", {}).get("operation_status") == "compensated":
                raise TimeoutError("synthetic ledger outage after refund")
            return await original(query, update)
        with patch.object(credits, "db", fake_db):
            await credits.consume_standard_credits(**consumption_kwargs(), defer_finalization=True)
            with patch.object(fake_db.ledger, "update_one", fail_compensated):
                with self.assertRaises(TimeoutError):
                    await credits.compensate_standard_credit_consumption(
                        user_id="user_test", operation_id="operation_test", failure_type="synthetic",
                    )
            with self.assertRaises(credits.CreditOperationBusyError):
                await credits.consume_standard_credits(**consumption_kwargs())
        self.assertEqual(fake_db.users.document["credit_balance"], 10)
        self.assertTrue(fake_db.users.document["credit_pending_consumption"]["refunded"])
        self.assertEqual(next(iter(fake_db.ledger.documents.values()))["operation_status"], "compensating")

    async def test_grant_and_manual_adjustment_do_not_overwrite_concurrent_consumption(self):
        for kind in ("grant", "manual"):
            fake_db = FakeDb(balance=10)
            snapshot_read, release = asyncio.Event(), asyncio.Event()
            original_profile = credits.ensure_user_credit_profile
            async def paused_profile(user_id):
                result = await original_profile(user_id)
                snapshot_read.set()
                await release.wait()
                return result
            with patch.object(credits, "db", fake_db), patch.object(credits, "get_plan_included_credits", side_effect=lambda plan: 5 if plan == "premium" else 0):
                with patch.object(credits, "ensure_user_credit_profile", paused_profile):
                    task = asyncio.create_task(
                        credits.grant_plan_credits("user_test", "premium", "synthetic_source") if kind == "grant"
                        else credits.apply_manual_credit_adjustment("user_test", 5)
                    )
                    await snapshot_read.wait()
                    await credits.consume_standard_credits(**consumption_kwargs())
                    release.set()
                    await task
            self.assertEqual(fake_db.users.document["credit_balance"], 11, kind)
            self.assertEqual(sum(row["credits_delta"] for row in fake_db.ledger.documents.values()), 1)

    async def test_manual_negative_adjustment_has_atomic_nonnegative_gate(self):
        fake_db = FakeDb(balance=5)
        with patch.object(credits, "db", fake_db):
            results = await asyncio.gather(
                credits.apply_manual_credit_adjustment("user_test", -4),
                credits.apply_manual_credit_adjustment("user_test", -4), return_exceptions=True,
            )
        self.assertEqual(fake_db.users.document["credit_balance"], 1)
        self.assertEqual(sum(isinstance(value, credits.InsufficientCreditsError) for value in results), 1)

    async def test_grant_intent_insert_failure_never_mutates_balance(self):
        fake_db = FakeDb(balance=10)
        async def fail_insert(document):
            raise RuntimeError("synthetic grant ledger failure")
        with patch.object(credits, "db", fake_db), patch.object(credits, "get_plan_included_credits", side_effect=lambda plan: 5 if plan == "premium" else 0), patch.object(fake_db.ledger, "insert_one", fail_insert):
            with self.assertRaises(RuntimeError):
                await credits.grant_plan_credits("user_test", "premium", "synthetic_source")
        self.assertEqual(fake_db.users.document["credit_balance"], 10)
        self.assertEqual(len(fake_db.ledger.documents), 0)
        self.assertNotIn("credit_pending_consumption", fake_db.users.document)

    async def test_concurrent_same_source_grant_happens_once_and_legacy_lookup_survives(self):
        fake_db = FakeDb(balance=10)
        with patch.object(credits, "db", fake_db), patch.object(credits, "get_plan_included_credits", side_effect=lambda plan: 5 if plan == "premium" else 0):
            results = await asyncio.gather(*[
                credits.grant_plan_credits("user_test", "premium", "synthetic_source") for _ in range(3)
            ], return_exceptions=True)
            replay = await credits.grant_plan_credits("user_test", "premium", "synthetic_source")
        self.assertEqual(fake_db.users.document["credit_balance"], 15)
        self.assertEqual(len(fake_db.ledger.documents), 1)
        self.assertEqual(sum(isinstance(x, dict) and x["granted"] for x in results), 1)
        self.assertEqual(replay["reason"], "already_granted")
        self.assertEqual(replay["credits_delta"], 0)

        legacy_db = FakeDb(balance=15)
        legacy_db.ledger.documents["legacy"] = {
            "_id": "legacy", "user_id": "user_test", "reason_code": "plan_grant",
            "meta": {"plan_id": "premium", "source_ref": "legacy-source"},
            "credits_balance_after": 15,
        }
        with patch.object(credits, "db", legacy_db), patch.object(credits, "get_plan_included_credits", side_effect=lambda plan: 5 if plan == "premium" else 0):
            result = await credits.grant_plan_credits("user_test", "premium", "legacy-source")
        self.assertEqual(result["reason"], "already_granted")
        self.assertEqual(legacy_db.users.document["credit_balance"], 15)

    async def test_signed_grant_and_manual_finalization_failure_compensates(self):
        for kind, delta in (("grant", 5), ("manual", 5), ("manual", -4)):
            fake_db = FakeDb(balance=10, fail_completion_once=True)
            with patch.object(credits, "db", fake_db), patch.object(credits, "get_plan_included_credits", side_effect=lambda plan: 5 if plan == "premium" else 0):
                with self.assertRaises(credits.CreditLedgerPersistenceError):
                    if kind == "grant":
                        await credits.grant_plan_credits("user_test", "premium", "source-failure")
                    else:
                        await credits.apply_manual_credit_adjustment("user_test", delta)
            self.assertEqual(fake_db.users.document["credit_balance"], 10)
            self.assertEqual(fake_db.users.document["credit_lifetime_used"], 0)
            self.assertEqual(fake_db.users.document["credit_lifetime_granted"], 0)
            self.assertEqual(next(iter(fake_db.ledger.documents.values()))["operation_status"], "compensated")

    async def test_initial_grant_is_once_and_preserves_existing_history(self):
        fake_db = FakeDb(balance=0)
        with patch.object(credits, "db", fake_db), patch.object(credits, "get_plan_included_credits", return_value=5):
            await asyncio.gather(*[credits.ensure_user_credit_profile("user_test") for _ in range(3)])
            await credits.ensure_user_credit_profile("user_test")
        self.assertEqual(fake_db.users.document["credit_balance"], 5)
        self.assertEqual(fake_db.users.document["credit_lifetime_granted"], 5)
        self.assertEqual(len(fake_db.ledger.documents), 1)
        self.assertTrue(fake_db.users.document["credit_initial_free_grant_at"])
        history_db = FakeDb(balance=0)
        history_db.users.document["credit_lifetime_used"] = 2
        with patch.object(credits, "db", history_db), patch.object(credits, "get_plan_included_credits", return_value=5):
            await credits.ensure_user_credit_profile("user_test")
        self.assertEqual(history_db.users.document["credit_balance"], 0)
        self.assertEqual(len(history_db.ledger.documents), 0)

    async def test_ambiguous_balance_write_retains_pending_intent_without_reexecution(self):
        fake_db = FakeDb(balance=10)
        original = fake_db.users.find_one_and_update
        async def commit_then_timeout(*args, **kwargs):
            await original(*args, **kwargs)
            raise TimeoutError("synthetic balance acknowledgement lost")
        with patch.object(credits, "db", fake_db), patch.object(credits, "get_plan_included_credits", side_effect=lambda plan: 5 if plan == "premium" else 0):
            with patch.object(fake_db.users, "find_one_and_update", commit_then_timeout):
                with self.assertRaises(TimeoutError):
                    await credits.grant_plan_credits("user_test", "premium", "source-timeout")
            with self.assertRaises(credits.CreditOperationBusyError):
                await credits.grant_plan_credits("user_test", "premium", "source-timeout")
        self.assertEqual(fake_db.users.document["credit_balance"], 15)
        self.assertEqual(next(iter(fake_db.ledger.documents.values()))["operation_status"], "pending")
        self.assertIn("credit_pending_consumption", fake_db.users.document)

    async def test_pending_grant_excludes_overlapping_grant_and_consumption(self):
        fake_db = FakeDb(balance=10)
        entered, release = asyncio.Event(), asyncio.Event()
        original = fake_db.ledger.update_one
        async def paused_completion(query, update):
            if update.get("$set", {}).get("operation_status") == "completed":
                entered.set()
                await release.wait()
            return await original(query, update)
        with patch.object(credits, "db", fake_db), patch.object(credits, "get_plan_included_credits", side_effect=lambda plan: 5 if plan == "premium" else 0), patch.object(fake_db.ledger, "update_one", paused_completion):
            first = asyncio.create_task(credits.grant_plan_credits("user_test", "premium", "overlap-source"))
            await entered.wait()
            with self.assertRaises(credits.CreditOperationBusyError):
                await credits.grant_plan_credits("user_test", "premium", "overlap-source")
            with self.assertRaises(credits.CreditOperationBusyError):
                await credits.consume_standard_credits(**consumption_kwargs())
            release.set()
            await first
        self.assertEqual(fake_db.users.document["credit_balance"], 15)
        self.assertEqual(fake_db.users.document["credit_lifetime_used"], 0)
        self.assertEqual(fake_db.users.document["credit_lifetime_granted"], 5)

    async def test_manual_supplied_identity_replays_one_durable_adjustment(self):
        fake_db = FakeDb(balance=10)
        with patch.object(credits, "db", fake_db):
            first = await credits.apply_manual_credit_adjustment("user_test", 5, meta={"operation_id": "manual-stable"})
            replay = await credits.apply_manual_credit_adjustment("user_test", 5, meta={"operation_id": "manual-stable"})
        self.assertEqual(fake_db.users.document["credit_balance"], 15)
        self.assertEqual(first["entry_id"], replay["entry_id"])
        self.assertTrue(replay["idempotent_replay"])

    async def test_blocked_busy_grant_recovers_same_source_with_concurrent_retry_cas(self):
        fake_db = FakeDb(balance=10)
        with patch.object(credits, "db", fake_db), patch.object(credits, "get_plan_included_credits", side_effect=lambda plan: 5 if plan == "premium" else 0):
            await credits.consume_standard_credits(**consumption_kwargs("held-consumption"), defer_finalization=True)
            with self.assertRaises(credits.CreditOperationBusyError) as blocked:
                await credits.grant_plan_credits("user_test", "premium", "synthetic-paid-source")
            self.assertEqual(blocked.exception.operation_status, "blocked_busy")
            grant = next(row for row in fake_db.ledger.documents.values() if row["reason_code"] == "plan_grant")
            self.assertEqual(grant["operation_status"], "blocked_busy")
            self.assertEqual(fake_db.users.document["credit_balance"], 6)
            await credits.finalize_standard_credit_consumption(
                user_id="user_test", operation_id="held-consumption", durable_result={"synthetic": True},
            )

            # Both retries genuinely read the same unmutated busy grant before
            # the reclaim CAS, so only a conditional transition may own it.
            original_find = fake_db.ledger.find_one
            readers, barrier = 0, asyncio.Event()
            async def simultaneous_blocked_reads(query, projection=None):
                nonlocal readers
                row = await original_find(query, projection)
                if query.get("_id") == grant["_id"] and row["operation_status"] == "blocked_busy":
                    readers += 1
                    if readers == 2:
                        barrier.set()
                    await asyncio.wait_for(barrier.wait(), 2)
                return row

            with patch.object(fake_db.ledger, "find_one", simultaneous_blocked_reads):
                results = await asyncio.gather(*[
                    credits.grant_plan_credits("user_test", "premium", "synthetic-paid-source") for _ in range(2)
                ], return_exceptions=True)
            self.assertEqual(readers, 2)
            self.assertEqual(sum(isinstance(result, dict) and result["granted"] for result in results), 1)
            losers = [result for result in results if isinstance(result, credits.CreditOperationBusyError)]
            self.assertEqual(len(losers), 1)
            self.assertNotEqual(losers[0].operation_status, "blocked_busy")
            replay = await credits.grant_plan_credits("user_test", "premium", "synthetic-paid-source")
        self.assertEqual(replay["reason"], "already_granted")
        self.assertEqual(fake_db.users.document["credit_balance"], 11)
        self.assertEqual(fake_db.users.document["credit_lifetime_granted"], 5)
        self.assertEqual(fake_db.users.document["credit_lifetime_used"], 4)
        self.assertNotIn("credit_pending_consumption", fake_db.users.document)
        self.assertEqual(len(fake_db.ledger.documents), 2)
        self.assertEqual(grant["operation_status"], "completed")


if __name__ == "__main__":
    unittest.main()
