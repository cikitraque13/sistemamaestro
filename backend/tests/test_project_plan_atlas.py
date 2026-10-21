"""Explicit opt-in only: real persistence in isolated Atlas Testing.

No environment credential is read until an authorized scenario starts; imports
never load backend configuration, dotenv, clients or a real provider.
"""
import asyncio
from copy import deepcopy
import json
import os
from pathlib import Path
import re
from types import SimpleNamespace
from urllib.parse import urlsplit, unquote, parse_qsl
from unittest.mock import AsyncMock, patch
from uuid import uuid4
import pytest

from backend.app.schemas.project_plan import PlanOperation
from backend.app.ai.schemas.intent_clarification import IntentOperation
from backend.app.services.intent_clarification import apply_intent, digest
from backend.app.services.project_plan import apply_plan, read_plan, PlanError, verify_history

pytestmark = pytest.mark.skipif(os.environ.get('SM_J063A_ATLAS_AUTHORIZED') != 'YES', reason='isolated Atlas authorization required')


async def classifier(_):
    return {'title': 'Synthetic intent', 'goal': 'Synthetic page', 'scope': ['one page'], 'assumptions': [], 'success_criteria': ['Reviewed'], 'questions': [], 'blocker_ids': []}


def content(title='Synthetic plan'):
    return {'title': title, 'objective': 'Synthetic objective', 'steps': [{'step_id': str(uuid4()), 'title': 'First', 'description': 'Review', 'acceptance_criterion': 'Reviewed'}]}


def op(pid, kind='CREATE', plan=None, **values):
    raw = {'kind': 'plan', 'projectId': pid, 'operation_id': str(uuid4()), 'operation_type': kind}
    if plan:
        raw.update({k: plan[k] for k in ('plan_id', 'generation', 'plan_revision', 'state_revision')})
        raw['expected_status'] = plan['status']
    return PlanOperation(**{**raw, **values})


async def scenario(body):
    if os.environ.get('DB_NAME') != 'sistemamaestro_test' or os.environ.get('PYTHON_DOTENV_DISABLED') != '1':
        raise RuntimeError('ATLAS_GUARD_FAILED')
    uri = os.environ.get('MONGO_URL', '')
    try:
        parsed = urlsplit(uri)
        options = parse_qsl(parsed.query, keep_blank_values=True, strict_parsing=True)
        allowed = {'retryWrites': {'true'}, 'w': {'majority'}, 'appName': {'SM-Testing'}, 'authSource': {'admin'}}
        if (parsed.scheme != 'mongodb+srv' or parsed.hostname != 'sm-testing.hbnrkcj.mongodb.net' or parsed.port is not None
                or parsed.fragment or unquote(parsed.username or '') != 'sm_testing_app' or not parsed.password
                or parsed.path != '/sistemamaestro_test' or len({k for k, _ in options}) != len(options)
                or any(k not in allowed or v not in allowed[k] for k, v in options)):
            raise ValueError()
    except (ValueError, TypeError):
        raise RuntimeError('ATLAS_GUARD_FAILED') from None
    marker = Path(os.environ.get('SM_J063A_CLEANUP_MARKER', ''))
    if not marker.is_absolute() or not marker.is_file():
        raise RuntimeError('CLEANUP_MARKER_REQUIRED')
    record = json.loads(marker.read_text(encoding='utf-8-sig'))
    run_id = record.get('run_id', '')
    if not re.fullmatch('[0-9a-f]{32}', run_id) or not isinstance(record.get('documents'), list):
        raise RuntimeError('CLEANUP_MARKER_INVALID')
    pid, owner = 'smj063a-' + uuid4().hex, 'smj063a-owner-' + uuid4().hex
    record['documents'].append({'project_id': pid, 'owner_id': owner})
    marker.write_text(json.dumps(record), encoding='utf-8')
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
    collection = client['sistemamaestro_test']['projects']
    identity = {'project_id': pid, 'user_id': owner, '_sm_j063a_run': run_id}
    original = {**identity, 'updated_at': '2026-10-20T12:00:00+00:00', 'input_type': 'text', 'input_content': 'Synthetic source', 'route': 'idea', 'refine_answers': {'historical': 'preserve'}}
    try:
        await collection.insert_one(deepcopy(original))
        iop = IntentOperation(kind='intent', projectId=pid, operation_id=str(uuid4()), operation_type='CREATE_INTENT', text='Synthetic page')
        r = await apply_intent(collection, owner, iop, original['updated_at'], classifier)
        intent = r['intent']
        iop = IntentOperation(kind='intent', projectId=pid, operation_id=str(uuid4()), operation_type='CONFIRM', intent_id=intent['intent_id'], draft_revision=intent['draft_revision'], state_revision=intent['state_revision'], digest=intent['confirmation_challenge']['digest'])
        await apply_intent(collection, owner, iop, r['updated_at'], classifier)
        confirmed = await collection.find_one(identity)
        await body(collection, pid, owner, confirmed)
    except Exception:
        # Never let driver exception text/URI escape into pytest output.
        raise RuntimeError('ATLAS_FUNCTIONAL_FAILURE') from None
    finally:
        try:
            await collection.delete_one(identity)
            if await collection.count_documents(identity) != 0:
                raise RuntimeError('CLEANUP_NOT_VERIFIED')
        except Exception:
            raise RuntimeError('CLEANUP_NOT_VERIFIED') from None
        finally:
            client.close()


async def apply(c, p, o, base, kind='CREATE', plan=None, **values):
    if kind == 'READ':
        return await read_plan(c, o, p)
    return await apply_plan(c, o, op(p, kind, plan, **values), base['updated_at'])


async def ready(c, p, o, base):
    r = await apply(c, p, o, base)
    r = await apply(c, p, o, base, 'EDIT', r['plan'], content=content())
    return await apply(c, p, o, base, 'REVIEW', r['plan'])


def test_real_persist_recover_and_exact_confirm():
    async def body(c, p, o, base):
        r = await ready(c, p, o, base)
        saved = await c.find_one({'project_id': p, 'user_id': o})
        assert saved['j06_2_plan']['status'] == 'READY_FOR_CONFIRMATION'
        r = await apply(c, p, o, base, 'CONFIRM', r['plan'], digest=r['plan']['confirmation_challenge']['digest'])
        assert r['plan']['status'] == 'CONFIRMED'
        result = await apply(c, p, o, base, 'READ')
        assert result['plan'] == r['plan']
        saved = await c.find_one({'project_id': p, 'user_id': o})
        assert {k: v for k, v in saved.items() if k != 'j06_2_plan'} == base
    asyncio.run(scenario(body))


def test_real_owner_project_isolation():
    async def body(c, p, o, base):
        for owner, pid in [(o + '-foreign', p), (o, p + '-foreign')]:
            with pytest.raises(PlanError, match='PROJECT_NOT_FOUND_OR_NOT_OWNED'):
                await apply_plan(c, owner, op(pid), base['updated_at'])
        assert await c.find_one({'project_id': p, 'user_id': o}) == base
    asyncio.run(scenario(body))


def test_real_idempotent_recovery_and_key_reuse():
    async def body(c, p, o, base):
        r = await apply(c, p, o, base)
        a = op(p, 'EDIT', r['plan'], content=content())
        await apply_plan(c, o, a, base['updated_at'])
        assert (await apply_plan(c, o, a, base['updated_at']))['code'] == 'PLAN_ALREADY_APPLIED'
        with pytest.raises(PlanError, match='IDEMPOTENCY_KEY_REUSE'):
            await apply_plan(c, o, a.model_copy(update={'content': content('Other')}), base['updated_at'])
    asyncio.run(scenario(body))


def test_real_first_save_race():
    async def body(c, p, o, base):
        results = await asyncio.gather(*(apply_plan(c, o, op(p), base['updated_at']) for _ in range(2)), return_exceptions=True)
        assert len([x for x in results if isinstance(x, dict)]) == 1
        assert len([x for x in results if isinstance(x, PlanError)]) == 1
    asyncio.run(scenario(body))


def test_real_competing_edits_and_confirmation_cas():
    async def body(c, p, o, base):
        r = await ready(c, p, o, base)
        operations = [op(p, 'EDIT', r['plan'], content=content('Changed')), op(p, 'CONFIRM', r['plan'], digest=r['plan']['confirmation_challenge']['digest'])]
        results = await asyncio.gather(*(apply_plan(c, o, value, base['updated_at']) for value in operations), return_exceptions=True)
        assert len([x for x in results if isinstance(x, dict)]) == 1 and len([x for x in results if isinstance(x, PlanError)]) == 1
    asyncio.run(scenario(body))


def test_real_cancel_restart_race_and_old_new_identity():
    async def body(c, p, o, base):
        r = await apply(c, p, o, base); r = await apply(c, p, o, base, 'CANCEL', r['plan'])
        prior = r['plan']
        results = await asyncio.gather(*(apply(c, p, o, base, 'RESTART', prior) for _ in range(2)), return_exceptions=True)
        assert len([x for x in results if isinstance(x, dict)]) == 1
        saved = await c.find_one({'project_id': p, 'user_id': o}); plan = saved['j06_2_plan']; event = plan['transitions'][-1]
        assert event['from']['plan_id'] == prior['plan_id'] and event['to']['plan_id'] == plan['plan_id']
        assert plan['generation'] == prior['generation'] + 1
    asyncio.run(scenario(body))


def test_real_source_stale_preserves_plan_and_allows_cancellation():
    async def body(c, p, o, base):
        r = await ready(c, p, o, base)
        changed = '2026-11-20T00:00:00+00:00'
        await c.update_one({'project_id': p, 'user_id': o}, {'$set': {'updated_at': changed}})
        before = await c.find_one({'project_id': p, 'user_id': o})
        with pytest.raises(PlanError): await apply(c, p, o, base, 'CONFIRM', r['plan'], digest=r['plan']['confirmation_challenge']['digest'])
        assert await c.find_one({'project_id': p, 'user_id': o}) == before
        stale = await read_plan(c, o, p)
        assert stale['plan']['status'] == 'STALE'
        cancelled = await apply_plan(c, o, op(p, 'CANCEL', stale['plan']), changed)
        assert cancelled['code'] == 'PLAN_CANCELLED'
    asyncio.run(scenario(body))


def test_real_history_tampering_no_mutation():
    async def body(c, p, o, base):
        await ready(c, p, o, base)
        await c.update_one({'project_id': p, 'user_id': o}, {'$set': {'j06_2_plan.transition_chain_head': 'f' * 64}})
        before = await c.find_one({'project_id': p, 'user_id': o})
        for kind in ('READ', 'CANCEL'):
            with pytest.raises(PlanError, match='PLAN_HISTORY_INTEGRITY_ERROR'):
                if kind == 'READ': await read_plan(c, o, p)
                else: await apply_plan(c, o, op(p, kind), base['updated_at'])
        assert await c.find_one({'project_id': p, 'user_id': o}) == before
    asyncio.run(scenario(body))


async def history_response_scenario(c, p, o, base):
    """Real router handlers + injected collection; not an ASGI transport test."""
    from backend.tests import test_consumption_callers as routes
    await ready(c, p, o, base)
    scope = {'project_id': p, 'user_id': o, '_sm_j063a_run': base['_sm_j063a_run']}
    await c.update_one(scope, {'$set': {'j06_2_plan.transition_chain_head': 'f' * 64}})
    before = await c.find_one(scope)
    expected_body = b'{"code":"PLAN_HISTORY_INTEGRITY_ERROR","retryable":false,"mutation_applied":false}'
    with patch.object(routes.projects, 'db', SimpleNamespace(projects=c)), \
            patch.object(routes.builder_ai, 'db', SimpleNamespace(projects=c)), \
            patch.object(routes.projects, 'get_current_user', new=AsyncMock(return_value={'user_id': o})), \
            patch.object(routes.builder_ai, 'get_current_user', new=AsyncMock(return_value={'user_id': o})), \
            patch.object(routes.builder_ai, 'run_builder_agent', new=AsyncMock()) as builder, \
            patch.object(routes.builder_ai, 'run_economic_operation', new=AsyncMock()) as economic:
        read_response = await routes.projects.get_project(p, SimpleNamespace())
        assert read_response.status_code == 409 and read_response.body == expected_body
        assert await c.find_one(scope) == before
        mutation_response = await routes.builder_ai.build_with_ai(
            op(p, 'CANCEL'), SimpleNamespace(headers={'If-Match': base['updated_at']}))
        assert mutation_response.status_code == 409 and mutation_response.body == expected_body
        assert await c.find_one(scope) == before
        builder.assert_not_awaited()
        economic.assert_not_awaited()


def test_real_history_error_exact_read_and_mutation_router_responses():
    asyncio.run(scenario(history_response_scenario))


async def stale_restart_scenario(c, p, o, base):
    """Fixture-only reconfirmation enables RESTART directly from effective STALE."""
    await ready(c, p, o, base)
    scope = {'project_id': p, 'user_id': o, '_sm_j063a_run': base['_sm_j063a_run']}
    changed = '2026-11-20T00:00:00+00:00'
    await c.update_one(scope, {'$set': {'updated_at': changed}})
    stale = await read_plan(c, o, p)
    assert stale['plan']['status'] == 'STALE'
    assert stale['plan']['stored_status'] == 'READY_FOR_CONFIRMATION'
    prior = deepcopy((await c.find_one(scope))['j06_2_plan'])

    # Synthetic fixture setup only. No production J06.1 recovery API is claimed.
    await c.update_one(scope, {'$unset': {'active_j06_1_intent': ''}})
    create = IntentOperation(kind='intent', projectId=p, operation_id=str(uuid4()),
                             operation_type='CREATE_INTENT', text='A newly confirmed synthetic intention')
    result = await apply_intent(c, o, create, changed, classifier)
    intent = result['intent']
    confirm = IntentOperation(kind='intent', projectId=p, operation_id=str(uuid4()), operation_type='CONFIRM',
                              intent_id=intent['intent_id'], draft_revision=intent['draft_revision'],
                              state_revision=intent['state_revision'], digest=intent['confirmation_challenge']['digest'])
    await apply_intent(c, o, confirm, result['updated_at'], classifier)
    rebound = await c.find_one(scope)
    assert rebound['j06_2_plan'] == prior  # No cancellation or hidden plan rewrite.
    still_stale = await read_plan(c, o, p)
    assert still_stale['plan']['status'] == 'STALE'
    assert still_stale['plan']['stored_status'] == 'READY_FOR_CONFIRMATION'

    restarted = await apply_plan(c, o, op(p, 'RESTART', still_stale['plan']), rebound['updated_at'])
    saved = await c.find_one(scope)
    plan = saved['j06_2_plan']
    current_intent = rebound['active_j06_1_intent']
    expected_binding = {
        'intent_id': current_intent['intent_id'],
        'confirmation_digest': current_intent['confirmation_receipt']['digest'],
        'policy_version': current_intent['intent_policy_version'],
        'source_vector_digest': digest(current_intent['source_revision_vector']),
        'source_revision': rebound['updated_at'],
    }
    assert restarted['plan']['status'] == 'DRAFT'
    assert plan['plan_id'] != prior['plan_id'] and plan['generation'] == prior['generation'] + 1
    assert plan['plan_revision'] == plan['state_revision'] == 1
    assert plan['source_binding'] == expected_binding
    assert plan['content'] == {'title': '', 'objective': '', 'steps': []}
    assert plan['transitions'][:-1] == prior['transitions']
    event = plan['transitions'][-1]
    assert event['event_type'] == 'RESTART'
    assert event['from'] == {'plan_id': prior['plan_id'], 'generation': prior['generation'], 'state': 'STALE',
                             'plan_revision': prior['plan_revision'], 'state_revision': prior['state_revision']}
    assert event['to'] == {'plan_id': plan['plan_id'], 'generation': plan['generation'], 'state': 'DRAFT',
                           'plan_revision': 1, 'state_revision': 1}
    assert event['source_revision'] == rebound['updated_at']
    assert {k: v for k, v in saved.items() if k != 'j06_2_plan'} == {k: v for k, v in rebound.items() if k != 'j06_2_plan'}
    assert saved['input_content'] == base['input_content'] and saved['refine_answers'] == base['refine_answers']
    verify_history(plan)


def test_real_restart_directly_from_effective_stale_after_fixture_reconfirmation():
    asyncio.run(scenario(stale_restart_scenario))


def test_real_history_and_receipt_eviction():
    async def body(c, p, o, base):
        first = op(p); r = await apply_plan(c, o, first, base['updated_at'])
        for n in range(66):
            r = await apply(c, p, o, base, 'EDIT', r['plan'], content=content(str(n)))
        saved = (await c.find_one({'project_id': p, 'user_id': o}))['j06_2_plan']
        assert len(saved['transitions']) == 20 and len(saved['receipts']) == 64
        verify_history(saved)
        with pytest.raises(PlanError, match='STALE_OPERATION'): await apply_plan(c, o, first, base['updated_at'])
    asyncio.run(scenario(body))


def test_real_invalid_input_and_size_rejection_no_mutation():
    async def body(c, p, o, base):
        r = await apply(c, p, o, base); before = await c.find_one({'project_id': p, 'user_id': o})
        for invalid in (content(' '), content('x' * 121)):
            with pytest.raises(PlanError): await apply(c, p, o, base, 'EDIT', r['plan'], content=invalid)
        assert await c.find_one({'project_id': p, 'user_id': o}) == before
    asyncio.run(scenario(body))
