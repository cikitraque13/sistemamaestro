"""Offline user-authored-plan contract tests; no config or external services."""
import asyncio
from copy import deepcopy
from types import SimpleNamespace
from uuid import uuid4
import pytest
from pydantic import ValidationError

from backend.app.ai.schemas.intent_clarification import IntentOperation
from backend.app.schemas.project_plan import PlanOperation
from backend.app.services.intent_clarification import apply_intent
from backend.app.services import project_plan as service
from backend.app.services.project_plan import apply_plan, read_plan, project_plan_view, PlanError, normalize_content, verify_history

REV = "2026-10-20T12:00:00+00:00"


class Collection:
    def __init__(self, project=None):
        self.doc = deepcopy(project or {"project_id": "p", "user_id": "owner", "updated_at": REV,
                                        "input_type": "text", "input_content": "Synthetic source", "route": "idea",
                                        "refine_answers": {"historical": "preserve"}, "builder_state": {"keep": True}})
        self.writes = 0
        self.filters = []
        self.barrier = None
        self.race_reads = 0

    async def find_one(self, predicate, projection=None):
        found = deepcopy(self.doc) if all(self.doc.get(k) == v for k, v in predicate.items()) else None
        if self.barrier and self.race_reads < 2:
            self.race_reads += 1
            if self.race_reads == 2:
                self.barrier.set()
            await self.barrier.wait()
        return found

    async def update_one(self, predicate, update):
        self.filters.append(deepcopy(predicate))
        for key, value in predicate.items():
            found, exists = self.doc, True
            for part in key.split('.'):
                if not isinstance(found, dict) or part not in found:
                    exists, found = False, None
                    break
                found = found[part]
            if isinstance(value, dict) and "$exists" in value:
                if exists != value["$exists"]:
                    return SimpleNamespace(modified_count=0)
            elif isinstance(value, dict) and "$not" in value:
                scope = value["$not"]["$elemMatch"]["scope_key"]
                if any(x["scope_key"] == scope for x in (found or [])):
                    return SimpleNamespace(modified_count=0)
            elif found != value:
                return SimpleNamespace(modified_count=0)
        self.doc.update(deepcopy(update.get("$set", {})))
        for key, value in update.get("$push", {}).items():
            self.doc.setdefault(key, []).append(deepcopy(value))
        self.writes += 1
        return SimpleNamespace(modified_count=1)


async def classifier(data):
    return {"title": "Synthetic intent", "goal": "A page", "scope": ["one page"], "assumptions": [],
            "success_criteria": ["explicit confirmation"], "questions": [], "blocker_ids": []}


async def confirm_intent(c):
    o = IntentOperation(kind="intent", projectId=c.doc["project_id"], operation_id=str(uuid4()), operation_type="CREATE_INTENT", text="A synthetic page")
    r = await apply_intent(c, c.doc["user_id"], o, c.doc["updated_at"], classifier)
    i = r["intent"]
    o = IntentOperation(kind="intent", projectId=c.doc["project_id"], operation_id=str(uuid4()), operation_type="CONFIRM",
                        intent_id=i["intent_id"], draft_revision=i["draft_revision"], state_revision=i["state_revision"], digest=i["confirmation_challenge"]["digest"])
    await apply_intent(c, c.doc["user_id"], o, r["updated_at"], classifier)
    return c


def collection():
    return asyncio.run(confirm_intent(Collection()))


def content(title="Plan"):
    return {"title": title, "objective": "User-authored objective", "steps": [
        {"step_id": str(uuid4()), "title": "First", "description": "Review a synthetic page", "acceptance_criterion": "Human reviewed"}]}


def operation(c, kind="CREATE", **values):
    raw = {"kind": "plan", "projectId": c.doc["project_id"], "operation_id": str(uuid4()), "operation_type": kind}
    if kind != "CREATE" and c.doc.get("j06_2_plan"):
        p = c.doc["j06_2_plan"]
        raw.update({k: p[k] for k in ("plan_id", "generation", "plan_revision", "state_revision")})
        raw["expected_status"] = project_plan_view(c.doc, c.doc["user_id"])["status"]
    raw.update(values)
    return PlanOperation(**raw)


def phase3b_operation(c, kind, plan=None, **values):
    plan = plan or c.doc["j06_2_plan"]
    raw = {"kind": "plan", "projectId": c.doc["project_id"], "operation_id": str(uuid4()),
           "operation_type": kind, "plan_id": plan["plan_id"], "generation": plan["generation"],
           "plan_revision": plan["plan_revision"], "state_revision": plan["state_revision"],
           "expected_status": project_plan_view(c.doc, c.doc["user_id"])["status"],
           "expected_progress_revision": project_plan_view(c.doc, c.doc["user_id"])["progress_revision"]}
    raw.update(values)
    return PlanOperation(**raw)


def confirm_plan(c):
    result = ready(c)
    return run(c, "CONFIRM", digest=result["plan"]["confirmation_challenge"]["digest"])


def run(c, kind="CREATE", **values):
    if kind == 'READ':
        return asyncio.run(read_plan(c, c.doc['user_id'], c.doc['project_id']))
    o = operation(c, kind, **values)
    return asyncio.run(apply_plan(c, c.doc["user_id"], o, c.doc.get("updated_at", "0")))


def ready(c):
    run(c)
    run(c, "EDIT", content=content())
    return run(c, "REVIEW")


def test_create_edit_review_confirm_and_server_recovery_preserve_other_fields():
    c = collection(); before = deepcopy(c.doc)
    r = ready(c)
    p = r["plan"]
    challenge = p["confirmation_challenge"]
    assert challenge["envelope"]["display_projection"] == challenge["display_projection"]
    assert challenge["digest"] == service._hash(challenge["envelope"])
    assert list(challenge["display_projection"]["field_order"]) == ["title", "objective", "steps"]
    r = run(c, "CONFIRM", digest=challenge["digest"])
    assert r["plan"]["status"] == "CONFIRMED"
    writes = c.writes
    assert run(c, "READ")["plan"]["status"] == "CONFIRMED" and c.writes == writes
    assert {k: v for k, v in c.doc.items() if k != "j06_2_plan"} == before
    assert c.filters[-1]["j06_2_plan"]["status"] == "READY_FOR_CONFIRMATION"


def test_initial_blank_draft_cannot_be_reviewed():
    c = collection(); run(c); before = deepcopy(c.doc)
    with pytest.raises(PlanError, match="INVALID_PLAN"):
        run(c, "REVIEW")
    assert c.doc == before


@pytest.mark.parametrize('field', ["title", "objective", "description", "acceptance_criterion"])
@pytest.mark.parametrize('value', ["", " \t\r\n", "\u2000\u0085\u3000"])
def test_blank_content_rejected_without_mutation(field, value):
    c = collection(); run(c); before = deepcopy(c.doc); body = content()
    (body if field in {"title", "objective"} else body["steps"][0])[field] = value
    with pytest.raises(PlanError, match="INVALID_PLAN"):
        run(c, "EDIT", content=body)
    assert c.doc == before


def test_normalization_exact_whitespace_and_fingerprint_replay():
    c = collection(); run(c); body = content("  Cafe\u0301\r\n  ")
    o = operation(c, "EDIT", content=body)
    result = asyncio.run(apply_plan(c, "owner", o, c.doc["updated_at"]))
    assert result["plan"]["content"]["title"] == "  Café\n  "
    equivalent = deepcopy(body); equivalent["title"] = "  Café\n  "
    assert asyncio.run(apply_plan(c, "owner", o.model_copy(update={"content": equivalent}), c.doc["updated_at"]))["code"] == "PLAN_ALREADY_APPLIED"
    changed = deepcopy(body); changed["title"] = "Other"
    with pytest.raises(PlanError, match="IDEMPOTENCY_KEY_REUSE"):
        asyncio.run(apply_plan(c, "owner", o.model_copy(update={"content": changed}), c.doc["updated_at"]))


@pytest.mark.parametrize('bad', ["unknown", "duplicate", "steps", "length", "type"])
def test_closed_schema_limits_and_ids(bad):
    body = content()
    if bad == "unknown": body["hidden"] = "x"
    elif bad == "duplicate": body["steps"].append(deepcopy(body["steps"][0]))
    elif bad == "steps": body["steps"] = body["steps"] * 13
    elif bad == "length": body["title"] = "x" * 121
    else: body["objective"] = 1
    with pytest.raises(PlanError): normalize_content(body)


def test_edit_invalidates_challenge_and_confirmed_is_immutable():
    c = collection(); r = ready(c); old = r["plan"]["confirmation_challenge"]["digest"]
    run(c, "EDIT", content=content("Changed")); assert c.doc["j06_2_plan"]["confirmation_challenge"] is None
    with pytest.raises(PlanError): run(c, "CONFIRM", digest=old)
    r = run(c, "REVIEW"); run(c, "CONFIRM", digest=r["plan"]["confirmation_challenge"]["digest"])
    before = deepcopy(c.doc)
    for kind in ("EDIT", "RESTART", "CANCEL"):
        with pytest.raises(PlanError): run(c, kind, **({"content": content()} if kind == "EDIT" else {}))
    assert c.doc == before


def test_digest_binds_every_envelope_field_and_label():
    c = collection(); r = ready(c); env = r["plan"]["confirmation_challenge"]["envelope"]
    for field in ("owner_id", "project_id", "intent_id", "confirmation_digest", "source_vector_digest", "source_revision", "plan_id", "generation", "plan_revision", "state_revision"):
        altered = deepcopy(env); altered[field] = str(altered[field]) + "changed"
        assert service._hash(altered) != service._hash(env)
    c.doc["j06_2_plan"]["confirmation_challenge"]["display_projection"]["labels"]["title"] = "Changed"
    before = deepcopy(c.doc)
    with pytest.raises(PlanError, match="DIGEST_MISMATCH"): run(c, "CONFIRM", digest=r["plan"]["confirmation_challenge"]["digest"])
    assert c.doc == before


def test_owner_and_project_isolation_no_write():
    c = collection(); before = deepcopy(c.doc)
    for owner, pid in [("other", "p"), ("owner", "other")]:
        o = operation(c).model_copy(update={"projectId": pid})
        with pytest.raises(PlanError, match="PROJECT_NOT_FOUND_OR_NOT_OWNED"):
            asyncio.run(apply_plan(c, owner, o, c.doc["updated_at"]))
    assert c.doc == before


def test_stale_read_cancel_and_conditional_restart():
    c = collection(); ready(c); source = deepcopy(c.doc["active_j06_1_intent"])
    c.doc["updated_at"] = "2026-11-20T00:00:00+00:00"
    before = deepcopy(c.doc); assert run(c, "READ")["plan"]["status"] == "STALE"; assert c.doc == before
    with pytest.raises(PlanError): run(c, "EDIT", content=content())
    with pytest.raises(PlanError): run(c, "RESTART")
    run(c, "CANCEL"); assert c.doc["j06_2_plan"]["status"] == "CANCELLED"
    assert run(c, 'READ')['plan']['stored_status'] == 'CANCELLED'
    cancelled = deepcopy(c.doc)
    with pytest.raises(PlanError, match='PLAN_REVISION_CONFLICT'): run(c, 'CANCEL')
    assert c.doc == cancelled
    # Reconfirmation is a fixture capability only; production J06.1 is untouched.
    c.doc.pop("active_j06_1_intent")
    asyncio.run(confirm_intent(c))
    prior = deepcopy(c.doc["j06_2_plan"]); run(c, "RESTART")
    p = c.doc["j06_2_plan"]; record = p["transitions"][-1]
    assert p["generation"] == prior["generation"] + 1 and p["plan_id"] != prior["plan_id"]
    assert record["from"]["plan_id"] == prior["plan_id"] and record["to"]["plan_id"] == p["plan_id"]
    assert p["content"] == {"title": "", "objective": "", "steps": []}
    assert source != c.doc["active_j06_1_intent"]


@pytest.mark.parametrize('kind', ["CREATE", "EDIT", "CONFIRM", "RESTART"])
def test_competing_operations_single_winner(kind):
    async def execute():
        c = await confirm_intent(Collection())
        if kind == "EDIT": await apply_plan(c, "owner", operation(c), c.doc["updated_at"])
        elif kind == "CONFIRM":
            for k, extra in [("CREATE", {}), ("EDIT", {"content": content()}), ("REVIEW", {})]:
                await apply_plan(c, "owner", operation(c, k, **extra), c.doc["updated_at"])
        elif kind == "RESTART":
            await apply_plan(c, "owner", operation(c), c.doc["updated_at"])
            await apply_plan(c, "owner", operation(c, "CANCEL"), c.doc["updated_at"])
        extra = {"content": content()} if kind == "EDIT" else {"digest": c.doc["j06_2_plan"]["confirmation_challenge"]["digest"]} if kind == "CONFIRM" else {}
        ops = [operation(c, kind, **extra), operation(c, kind, **extra)]
        before = c.writes; c.barrier = asyncio.Event()
        results = await asyncio.gather(*(apply_plan(c, "owner", o, c.doc["updated_at"]) for o in ops), return_exceptions=True)
        assert len([r for r in results if isinstance(r, dict)]) == 1
        assert len([r for r in results if isinstance(r, PlanError)]) == 1
        assert c.writes == before + 1
    asyncio.run(execute())


def test_same_key_different_fingerprint_race():
    async def execute():
        c = await confirm_intent(Collection()); await apply_plan(c, "owner", operation(c), c.doc["updated_at"])
        a = operation(c, "EDIT", content=content("A")); b = a.model_copy(update={"content": content("B")})
        c.barrier = asyncio.Event(); results = await asyncio.gather(*(apply_plan(c, "owner", o, c.doc["updated_at"]) for o in (a, b)), return_exceptions=True)
        assert len([x for x in results if isinstance(x, dict)]) == 1
        assert [x.code for x in results if isinstance(x, PlanError)] == ["IDEMPOTENCY_KEY_REUSE"]
    asyncio.run(execute())


def test_history_window_receipt_eviction_old_operation_cannot_reexecute():
    c = collection(); original = operation(c)
    asyncio.run(apply_plan(c, "owner", original, c.doc["updated_at"]))
    for n in range(70): run(c, "EDIT", content=content(str(n)))
    p = c.doc["j06_2_plan"]
    assert len(p["transitions"]) == 20 and len(p["receipts"]) == 64 and p["transition_sequence"] == 71
    assert p["transitions"][0]["seq"] > 1 and p["transitions"][0]["previous_hash"] != "0" * 64
    verify_history(p); assert len(service.encoded(p)) <= 96000
    before = deepcopy(c.doc)
    with pytest.raises(PlanError, match='STALE_OPERATION'): asyncio.run(apply_plan(c, "owner", original, c.doc["updated_at"]))
    assert c.doc == before


@pytest.mark.parametrize('tamper', ["previous_hash", "record_hash", "seq", "head", "from", "event", "metadata", "missing_record"])
def test_history_corruption_read_and_mutation_are_fail_closed(tamper):
    c = collection(); ready(c); p = c.doc["j06_2_plan"]
    if tamper == "head": p["transition_chain_head"] = "f" * 64
    elif tamper == "missing_record": p["transitions"].pop(0)
    elif tamper == "metadata": p["transitions"][0]["hidden"] = "x"
    elif tamper == "from": p["transitions"][-1]["from"]["plan_id"] = str(uuid4())
    elif tamper == "event": p["transitions"][-1]["event_type"] = "RESTART"
    elif tamper == "seq": p["transitions"][-1]["seq"] = 99
    else: p["transitions"][0][tamper] = "f" * 64
    before = deepcopy(c.doc); writes = c.writes
    for kind in ("READ", "CANCEL"):
        with pytest.raises(PlanError, match="PLAN_HISTORY_INTEGRITY_ERROR"):
            if kind == 'READ': asyncio.run(read_plan(c, 'owner', 'p'))
            else:
                o = PlanOperation(kind="plan", projectId="p", operation_id=str(uuid4()), operation_type=kind)
                asyncio.run(apply_plan(c, "owner", o, c.doc["updated_at"]))
    assert c.doc == before and c.writes == writes


@pytest.mark.parametrize('limit', ["transition", "subdoc", "project"])
def test_admission_caps_reject_before_write(monkeypatch, limit):
    c = collection(); run(c); before = deepcopy(c.doc)
    cap = len(service.encoded(c.doc['j06_2_plan']['transitions'][0])) + 1 if limit == 'transition' else 1
    monkeypatch.setattr(service, {"transition": "MAX_TRANSITION_BYTES", "subdoc": "MAX_PLAN_BYTES", "project": "MAX_PROJECT_BYTES"}[limit], cap)
    with pytest.raises(PlanError, match="PLAN_SIZE_LIMIT"): run(c, "EDIT", content=content())
    assert c.doc == before


def test_overlong_source_revision_rejected_without_rewriting_it():
    c = collection(); run(c); long_revision = "2026-10-20T00:00:00." + "0" * 105 + "+00:00"
    c.doc["updated_at"] = long_revision; before = deepcopy(c.doc)
    with pytest.raises(PlanError, match="PLAN_SIZE_LIMIT"): run(c, "CANCEL")
    assert c.doc == before and c.doc["updated_at"] == long_revision


@pytest.mark.parametrize('encoded_size,accepted', [(128, True), (129, False)])
def test_source_revision_exact_encoded_boundary(encoded_size, accepted):
    c = collection(); run(c); plan = deepcopy(c.doc['j06_2_plan'])
    prefix, suffix = '2026-10-20T00:00:00.', '+00:00'
    revision = prefix + '0' * (encoded_size - len(prefix) - len(suffix) - 2) + suffix
    assert len(service.encoded(revision)) == encoded_size
    c.doc['updated_at'] = revision; before = deepcopy(c.doc)
    o = PlanOperation(kind='plan', projectId='p', operation_id=str(uuid4()), operation_type='CANCEL',
                      **{k: plan[k] for k in ('plan_id', 'generation', 'plan_revision', 'state_revision')}, expected_status='STALE')
    if accepted:
        asyncio.run(apply_plan(c, 'owner', o, revision))
        assert c.doc['updated_at'] == revision and c.doc['j06_2_plan']['transitions'][-1]['source_revision'] == revision
    else:
        with pytest.raises(PlanError, match='PLAN_SIZE_LIMIT'): asyncio.run(apply_plan(c, 'owner', o, revision))
        assert c.doc == before


def test_real_project_bson_ceiling_rejects_without_write():
    c = collection(); run(c); c.doc['synthetic_padding'] = 'x' * (15 * 1024 * 1024)
    before = deepcopy(c.doc)
    with pytest.raises(PlanError, match='PLAN_SIZE_LIMIT'): run(c, 'EDIT', content=content())
    assert c.doc == before


def test_content_byte_ceiling_is_independent_of_codepoint_limits():
    c = collection(); run(c); before = deepcopy(c.doc)
    body = content(); body['steps'] = [{**content()['steps'][0], 'title': '🪴' * 120, 'description': '🪴' * 600, 'acceptance_criterion': '🪴' * 400} for _ in range(12)]
    with pytest.raises(PlanError, match='PLAN_SIZE_LIMIT'): run(c, 'EDIT', content=body)
    assert c.doc == before


@pytest.mark.parametrize('field', ['key', 'fingerprint', 'completed_at'])
def test_malformed_receipt_blocks_reads_and_writes(field):
    c = collection(); run(c); c.doc['j06_2_plan']['receipts'][0][field] = 'malformed'
    before = deepcopy(c.doc)
    with pytest.raises(PlanError, match='PLAN_HISTORY_INTEGRITY_ERROR'): project_plan_view(c.doc, 'owner')
    assert c.doc == before


def test_counter_overflow_no_mutation(monkeypatch):
    c = collection(); run(c); before = deepcopy(c.doc)
    monkeypatch.setattr(service, 'MAX_COUNTER', 1)
    with pytest.raises(PlanError, match="PLAN_SIZE_LIMIT"): run(c, "EDIT", content=content())
    assert c.doc == before


def test_route_dispatch_and_exact_history_error_body():
    import sys
    from pathlib import Path
    from unittest.mock import AsyncMock, patch
    sys.path.insert(0, str(Path(__file__).parent))
    import test_consumption_callers as fixture
    o = PlanOperation(kind="plan", projectId="p", operation_id=str(uuid4()), operation_type="CREATE")
    with patch.object(fixture.builder_ai, "db", SimpleNamespace(projects=object())), patch.object(fixture.builder_ai, "apply_plan", new=AsyncMock(side_effect=PlanError(service.HISTORY_ERROR))), patch.object(fixture.builder_ai, "run_builder_agent", new=AsyncMock()) as builder, patch.object(fixture.builder_ai, "run_economic_operation", new=AsyncMock()) as economic:
        response = asyncio.run(fixture.builder_ai.build_with_ai(o, SimpleNamespace(headers={"If-Match": REV})))
        assert response.status_code == 409
        assert response.body == b'{"code":"PLAN_HISTORY_INTEGRITY_ERROR","retryable":false,"mutation_applied":false}'
        builder.assert_not_awaited(); economic.assert_not_awaited()


def test_project_get_exact_history_error_body():
    import sys
    from pathlib import Path
    from unittest.mock import AsyncMock, patch
    sys.path.insert(0, str(Path(__file__).parent))
    import test_consumption_callers as fixture
    c = collection(); run(c); c.doc['j06_2_plan']['transition_chain_head'] = 'f' * 64
    with patch.object(fixture.projects, 'db', SimpleNamespace(projects=SimpleNamespace(find_one=AsyncMock(return_value=c.doc)))):
        response = asyncio.run(fixture.projects.get_project('p', SimpleNamespace()))
    assert response.status_code == 409 and response.body == b'{"code":"PLAN_HISTORY_INTEGRITY_ERROR","retryable":false,"mutation_applied":false}'


@pytest.mark.parametrize('scenario_name', ['history_response_scenario', 'stale_restart_scenario'])
def test_prepared_atlas_remediation_scenarios_offline(scenario_name):
    """Exercise the same prepared scenario bodies without a client/URI/Atlas."""
    from backend.tests import test_project_plan_atlas as atlas
    class ScenarioCollection(Collection):
        async def update_one(self, predicate, update):
            result = await super().update_one(predicate, update)
            if result.modified_count:
                # This fake is local evidence only; Atlas will validate Mongo $unset.
                for name in update.get('$unset', {}):
                    self.doc.pop(name, None)
                for name, value in update.get('$set', {}).items():
                    if '.' in name:
                        self.doc.pop(name, None)
                        container = self.doc
                        parts = name.split('.')
                        for part in parts[:-1]:
                            container = container[part]
                        container[parts[-1]] = deepcopy(value)
            return result
    async def execute():
        c = await confirm_intent(ScenarioCollection())
        c.doc['_sm_j063a_run'] = '0' * 32
        await getattr(atlas, scenario_name)(c, 'p', 'owner', deepcopy(c.doc))
    asyncio.run(execute())


def test_phase3b_progress_materializes_snapshot_checkpoint_and_replays_without_write():
    c = collection(); confirmed = confirm_plan(c)["plan"]; step_id = confirmed["content"]["steps"][0]["step_id"]
    operation = phase3b_operation(c, "PROGRESS_UPDATE", step_id=step_id, status="IN_PROGRESS")
    result = asyncio.run(apply_plan(c, "owner", operation, c.doc["updated_at"]))
    stored = c.doc["j06_2_plan"]
    assert result["code"] == "PLAN_PROGRESS_RECORDED"
    assert stored["progress_snapshot"] == {"progress_revision": 1, "step_statuses": {step_id: "IN_PROGRESS"}}
    checkpoint = stored["progress_checkpoint"]
    assert checkpoint["snapshot_digest"] == service._digest("progress-snapshot", stored["progress_snapshot"])
    assert checkpoint["checkpoint_digest"] == service._digest("progress-checkpoint", {k: v for k, v in checkpoint.items() if k != "checkpoint_digest"})
    writes = c.writes
    replay = asyncio.run(apply_plan(c, "owner", operation, c.doc["updated_at"]))
    assert replay["code"] == "PLAN_PROGRESS_RECORDED" and c.writes == writes
    changed = operation.model_copy(update={"status": "COMPLETED"})
    with pytest.raises(PlanError, match="IDEMPOTENCY_KEY_REUSE"):
        asyncio.run(apply_plan(c, "owner", changed, c.doc["updated_at"]))


def test_phase3b_same_status_progress_is_recorded_as_a_new_declaration():
    c = collection(); confirmed = confirm_plan(c)["plan"]
    step_id = confirmed["content"]["steps"][0]["step_id"]
    first = phase3b_operation(c, "PROGRESS_UPDATE", step_id=step_id, status="IN_PROGRESS")
    asyncio.run(apply_plan(c, "owner", first, c.doc["updated_at"]))
    second = phase3b_operation(c, "PROGRESS_UPDATE", step_id=step_id, status="IN_PROGRESS")
    result = asyncio.run(apply_plan(c, "owner", second, c.doc["updated_at"]))

    plan = c.doc["j06_2_plan"]
    event = plan["transitions"][-1]
    assert result["code"] == "PLAN_PROGRESS_RECORDED"
    assert plan["progress_snapshot"]["progress_revision"] == 2
    assert plan["progress_snapshot"]["step_statuses"][step_id] == "IN_PROGRESS"
    assert event["status_before"] == event["status_after"] == "IN_PROGRESS"
    assert event["progress_revision_before"] == 1 and event["progress_revision_after"] == 2
    assert verify_history(plan) is None


def test_phase3b_legacy_confirmed_plan_reads_derived_progress_without_write():
    c = collection(); plan = confirm_plan(c)["plan"]; before = deepcopy(c.doc); writes = c.writes
    recovered = run(c, "READ")["plan"]
    assert recovered["progress_revision"] == 0
    assert recovered["step_statuses"] == {plan["content"]["steps"][0]["step_id"]: "NOT_STARTED"}
    assert c.writes == writes and c.doc == before
    step_id = plan["content"]["steps"][0]["step_id"]
    operation = phase3b_operation(c, "PROGRESS_UPDATE", step_id=step_id, status="BLOCKED")
    asyncio.run(apply_plan(c, "owner", operation, c.doc["updated_at"]))
    assert c.doc["j06_2_plan"]["progress_snapshot"]["progress_revision"] == 1


def test_phase3b_progress_rejects_unknown_step_and_stale_revision_without_mutation():
    c = collection(); confirm_plan(c); plan = c.doc["j06_2_plan"]; before = deepcopy(c.doc)
    invalid = phase3b_operation(c, "PROGRESS_UPDATE", step_id=str(uuid4()), status="COMPLETED")
    with pytest.raises(PlanError, match="INVALID_PLAN"):
        asyncio.run(apply_plan(c, "owner", invalid, c.doc["updated_at"]))
    assert c.doc == before
    valid = phase3b_operation(c, "PROGRESS_UPDATE", step_id=plan["content"]["steps"][0]["step_id"], status="COMPLETED")
    stale = valid.model_copy(update={"expected_progress_revision": 1})
    with pytest.raises(PlanError, match="PLAN_REVISION_CONFLICT"):
        asyncio.run(apply_plan(c, "owner", stale, c.doc["updated_at"]))
    assert c.doc == before


def test_phase3b_progress_cas_race_has_single_winner():
    c = collection(); r = ready(c)
    r = run(c, "CONFIRM", digest=r["plan"]["confirmation_challenge"]["digest"])
    step = r["plan"]["content"]["steps"][0]["step_id"]
    async def execute():
        ops = [phase3b_operation(c, "PROGRESS_UPDATE", step_id=step, status=status) for status in ("IN_PROGRESS", "BLOCKED")]
        before = c.writes; c.barrier = asyncio.Event()
        results = await asyncio.gather(*(apply_plan(c, "owner", op, c.doc["updated_at"]) for op in ops), return_exceptions=True)
        assert len([x for x in results if isinstance(x, dict) and x.get("code") == "PLAN_PROGRESS_RECORDED"]) == 1
        assert len([x for x in results if isinstance(x, PlanError) and x.code == "PLAN_REVISION_CONFLICT"]) == 1
        assert c.writes == before + 1 and c.doc["j06_2_plan"]["progress_snapshot"]["progress_revision"] == 1
    asyncio.run(execute())


def test_phase3b_replan_links_predecessor_and_resets_progress_without_copying_snapshot():
    c = collection(); confirmed = confirm_plan(c)["plan"]
    step_id = confirmed["content"]["steps"][0]["step_id"]
    progress = phase3b_operation(c, "PROGRESS_UPDATE", step_id=step_id, status="COMPLETED")
    asyncio.run(apply_plan(c, "owner", progress, c.doc["updated_at"]))
    predecessor = deepcopy(c.doc["j06_2_plan"])
    replan = phase3b_operation(c, "REPLAN")
    result = asyncio.run(apply_plan(c, "owner", replan, c.doc["updated_at"]))
    successor = c.doc["j06_2_plan"]
    assert result["code"] == "PLAN_REPLANNED" and successor["status"] == "DRAFT"
    assert successor["plan_id"] != predecessor["plan_id"] and successor["generation"] == predecessor["generation"] + 1
    assert successor["plan_revision"] == successor["state_revision"] == 1
    assert successor["content"] == predecessor["content"]
    assert "progress_snapshot" not in successor and "progress_checkpoint" not in successor
    reference = successor["predecessor_reference"]
    assert reference["plan_id"] == predecessor["plan_id"] and reference["progress_revision"] == 1
    assert reference["progress_snapshot_digest"] == service._digest("progress-snapshot", predecessor["progress_snapshot"])
    assert result["plan"]["progress_revision"] == 0 and result["plan"]["step_statuses"][step_id] == "NOT_STARTED"
    event = successor["transitions"][-1]
    assert event["event_type"] == "REPLAN" and event["from"]["plan_id"] == predecessor["plan_id"]
    assert event["to"]["plan_id"] == successor["plan_id"]
    assert verify_history(successor) is None
    writes = c.writes
    assert asyncio.run(apply_plan(c, "owner", replan, c.doc["updated_at"]))["code"] == "PLAN_REPLANNED"
    assert c.writes == writes


def test_phase3b_replan_without_current_confirmed_intent_fails_closed():
    c = collection(); confirm_plan(c); c.doc["updated_at"] = "2026-10-24T13:00:00+00:00"
    before = deepcopy(c.doc)
    request = phase3b_operation(c, "REPLAN")
    with pytest.raises(PlanError, match="INTENT_STALE"):
        asyncio.run(apply_plan(c, "owner", request, c.doc["updated_at"]))
    assert c.doc == before


def test_phase3b_replan_rejects_self_consistent_wrong_predecessor_generation_without_mutation():
    c = collection(); confirm_plan(c)
    replan = phase3b_operation(c, "REPLAN")
    asyncio.run(apply_plan(c, "owner", replan, c.doc["updated_at"]))
    plan = c.doc["j06_2_plan"]
    request = PlanOperation(kind="plan", projectId="p", operation_id=str(uuid4()), operation_type="REPLAN",
                            plan_id=plan["plan_id"], generation=plan["generation"],
                            plan_revision=plan["plan_revision"], state_revision=plan["state_revision"],
                            expected_status="STALE", expected_progress_revision=0)

    # Keep all hashes internally consistent so this exercises the generation
    # relationship check rather than merely detecting a stale digest.
    plan["predecessor_reference"]["generation"] = plan["generation"]
    plan["predecessor_reference_digest"] = service._digest(
        "predecessor-reference", plan["predecessor_reference"])
    event = next(event for event in reversed(plan["transitions"])
                 if event["event_type"] == "REPLAN" and event["to"]["plan_id"] == plan["plan_id"])
    event["predecessor_reference_digest"] = plan["predecessor_reference_digest"]
    event["record_hash"] = service._record_hash(event)
    plan["transition_chain_head"] = event["record_hash"]
    before = deepcopy(c.doc); writes = c.writes

    with pytest.raises(PlanError, match="PLAN_HISTORY_INTEGRITY_ERROR"):
        asyncio.run(apply_plan(c, "owner", request, c.doc["updated_at"]))
    assert c.doc == before and c.writes == writes


def test_phase3b_router_progress_bypasses_builder_and_economics():
    import sys
    from pathlib import Path
    from unittest.mock import AsyncMock, patch
    sys.path.insert(0, str(Path(__file__).parent))
    import test_consumption_callers as fixture
    c = Collection({"project_id": "project_test", "user_id": "user_test", "updated_at": REV,
                    "input_type": "text", "input_content": "Synthetic source", "route": "idea",
                    "refine_answers": {}, "builder_state": {}})
    asyncio.run(confirm_intent(c)); confirmed = confirm_plan(c)["plan"]
    request = phase3b_operation(c, "PROGRESS_UPDATE", step_id=confirmed["content"]["steps"][0]["step_id"], status="IN_PROGRESS")
    with patch.object(fixture.builder_ai, "db", SimpleNamespace(projects=c)), \
         patch.object(fixture.builder_ai, "run_builder_agent", new=AsyncMock()) as builder, \
         patch.object(fixture.builder_ai, "run_economic_operation", new=AsyncMock()) as economic:
        result = asyncio.run(fixture.builder_ai.build_with_ai(request, SimpleNamespace(headers={"If-Match": c.doc["updated_at"]})))
    assert result["code"] == "PLAN_PROGRESS_RECORDED"
    builder.assert_not_awaited(); economic.assert_not_awaited()


def test_phase3b_replan_from_stale_predecessor_uses_separately_valid_current_binding():
    c = collection(); confirm_plan(c)
    c.doc["j06_2_plan"]["source_binding"]["source_revision"] = "2026-10-23T12:00:00+00:00"
    assert project_plan_view(c.doc, "owner")["status"] == "STALE"
    assert service._binding(c.doc, "owner") != c.doc["j06_2_plan"]["source_binding"]
    predecessor = deepcopy(c.doc["j06_2_plan"])
    result = asyncio.run(apply_plan(c, "owner", phase3b_operation(c, "REPLAN"), c.doc["updated_at"]))
    successor = c.doc["j06_2_plan"]
    assert result["code"] == "PLAN_REPLANNED"
    assert successor["generation"] == predecessor["generation"] + 1 and successor["status"] == "DRAFT"
    assert successor["source_binding"] == service._binding(c.doc, "owner")
    assert verify_history(successor) is None


def test_phase3b_checkpoint_must_point_to_latest_retained_progress_event():
    c = collection(); confirmed = confirm_plan(c)["plan"]
    step = confirmed["content"]["steps"][0]["step_id"]
    first = phase3b_operation(c, "PROGRESS_UPDATE", step_id=step, status="IN_PROGRESS")
    asyncio.run(apply_plan(c, "owner", first, c.doc["updated_at"]))
    plan = c.doc["j06_2_plan"]
    prior_snapshot = deepcopy(plan["progress_snapshot"])
    prior_checkpoint = deepcopy(plan["progress_checkpoint"])
    second = phase3b_operation(c, "PROGRESS_UPDATE", step_id=step, status="BLOCKED")
    asyncio.run(apply_plan(c, "owner", second, c.doc["updated_at"]))
    plan = c.doc["j06_2_plan"]
    assert len([event for event in plan["transitions"] if event["event_type"] == "PROGRESS_UPDATE"]) == 2
    # Both checkpoint and snapshot are independently well-formed and hash-valid,
    # but they point to the earlier update while a later one remains retained.
    plan["progress_snapshot"] = prior_snapshot
    plan["progress_checkpoint"] = prior_checkpoint
    before = deepcopy(c.doc); writes = c.writes
    with pytest.raises(PlanError, match="PLAN_HISTORY_INTEGRITY_ERROR"):
        run(c, "READ")
    assert c.doc == before and c.writes == writes


def test_phase3b_progress_continuity_remains_valid_after_prior_events_are_truncated():
    c = collection(); confirmed = confirm_plan(c)["plan"]
    step_id = confirmed["content"]["steps"][0]["step_id"]
    # Twenty-one accepted declarations force the earlier lifecycle and first
    # progress event out of the 20-record window while retaining a contiguous
    # suffix and its opaque predecessor anchor.
    for _ in range(21):
        operation = phase3b_operation(c, "PROGRESS_UPDATE", step_id=step_id, status="IN_PROGRESS")
        asyncio.run(apply_plan(c, "owner", operation, c.doc["updated_at"]))

    plan = c.doc["j06_2_plan"]
    retained = plan["transitions"]
    assert len(retained) == 20 and retained[0]["seq"] > 1
    assert retained[0]["event_type"] == "PROGRESS_UPDATE"
    assert retained[0]["previous_hash"] != "0" * 64
    assert all(previous["seq"] + 1 == current["seq"]
               and previous["record_hash"] == current["previous_hash"]
               and previous["progress_revision_after"] == current["progress_revision_before"]
               and previous["snapshot_after_digest"] == current["snapshot_before_digest"]
               for previous, current in zip(retained, retained[1:]))
    assert plan["progress_snapshot"]["progress_revision"] == 21
    assert plan["progress_checkpoint"]["last_event_seq"] == plan["transition_sequence"]
    assert retained[-1]["record_hash"] == plan["progress_checkpoint"]["last_event_hash"]
    assert verify_history(plan) is None


def test_phase3b_success_receipt_cannot_cross_operation_types_after_event_eviction():
    c = collection(); confirmed = confirm_plan(c)["plan"]
    progress = phase3b_operation(c, "PROGRESS_UPDATE", step_id=confirmed["content"]["steps"][0]["step_id"], status="BLOCKED")
    asyncio.run(apply_plan(c, "owner", progress, c.doc["updated_at"]))
    replan = phase3b_operation(c, "REPLAN")
    asyncio.run(apply_plan(c, "owner", replan, c.doc["updated_at"]))
    for index in range(20):
        run(c, "EDIT", content=content(f"Revision {index}"))
    plan = c.doc["j06_2_plan"]
    progress_key = service._hash({"domain": "SM/J06.2/OPERATION/V1", "owner_id": "owner",
                                  "project_id": "p", "operation_id": progress.operation_id})
    receipt = next(item for item in plan["receipts"] if item["key"] == progress_key)
    assert not any(event["operation_fingerprint"] == receipt["fingerprint"] for event in plan["transitions"])
    receipt["result_code"] = "PLAN_REPLANNED"
    before = deepcopy(c.doc); writes = c.writes
    with pytest.raises(PlanError, match="PLAN_HISTORY_INTEGRITY_ERROR"):
        asyncio.run(apply_plan(c, "owner", progress, c.doc["updated_at"]))
    assert c.doc == before and c.writes == writes


def test_phase3b_checkpoint_mismatch_and_partial_presence_fail_closed_on_read():
    c = collection(); confirmed = confirm_plan(c)["plan"]
    update = phase3b_operation(c, "PROGRESS_UPDATE", step_id=confirmed["content"]["steps"][0]["step_id"], status="BLOCKED")
    asyncio.run(apply_plan(c, "owner", update, c.doc["updated_at"]))
    c.doc["j06_2_plan"]["progress_checkpoint"]["last_event_seq"] = 0
    before = deepcopy(c.doc)
    with pytest.raises(PlanError, match="PLAN_HISTORY_INTEGRITY_ERROR"):
        run(c, "READ")
    assert c.doc == before
    c.doc["j06_2_plan"].pop("progress_checkpoint")
    before = deepcopy(c.doc)
    with pytest.raises(PlanError, match="PLAN_HISTORY_INTEGRITY_ERROR"):
        run(c, "READ")
    assert c.doc == before


@pytest.mark.parametrize("override", [
    {"project_id": "p"}, {"extra": True}, {"status": None}, {"generation": True}, {"generation": 1.0},
    {"expected_progress_revision": -1}, {"step_id": "ABC"},
])
def test_phase3b_request_schema_is_closed_and_strict(override):
    raw = {"kind": "plan", "projectId": "p", "operation_id": str(uuid4()), "operation_type": "PROGRESS_UPDATE",
           "plan_id": str(uuid4()), "generation": 1, "plan_revision": 1, "state_revision": 1,
           "expected_status": "CONFIRMED", "expected_progress_revision": 0,
           "step_id": str(uuid4()), "status": "IN_PROGRESS"}
    raw.update(override)
    with pytest.raises(ValidationError):
        PlanOperation(**raw)
