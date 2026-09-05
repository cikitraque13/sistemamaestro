"""Run from copy root: env -i PATH=... PYTHONDONTWRITEBYTECODE=1 python -m unittest ...

No Mongo/Stripe/HTTP runtime claim: doubles replace those boundaries only.
Actual payments.py, credits.py, plans.py and payment schema execute.
"""
import os
os.environ.clear()
import asyncio
import socket
import subprocess
import sys
import unittest
from types import ModuleType, SimpleNamespace
from unittest.mock import patch


def denied(*args, **kwargs):
    raise AssertionError('Network/process/service construction forbidden in synthetic tests')


socket.socket = denied
socket.create_connection = denied
subprocess.Popen = denied
os.system = denied


def module(name, **attributes):
    result = ModuleType(name)
    result.__dict__.update(attributes)
    sys.modules[name] = result
    return result


class HTTPException(Exception):
    def __init__(self, status_code, detail):
        self.status_code, self.detail = status_code, detail


class Router:
    def __init__(self, **kwargs):
        pass
    def get(self, *args):
        return lambda fn: fn
    post = get


# asyncio requires local socketpair to create its self-pipe; block network via
# connect/connect_ex/create_connection instead of disabling local socket creation.
socket.socket = __import__('_socket').socket
class LocalOnlySocket(socket.socket):
    def __init__(self, family=socket.AF_INET, *args, **kwargs):
        if family != socket.AF_UNIX:
            denied()
        super().__init__(family, *args, **kwargs)
    connect = denied
    connect_ex = denied
    sendto = denied
socket.socket = LocalOnlySocket
os.posix_spawn = denied
os.posix_spawnp = denied
os.fork = denied
module('fastapi', APIRouter=Router, HTTPException=HTTPException, Request=object)
module('backend.app.core.config', ALLOWED_ORIGINS=['https://synthetic.invalid'],
       CREDIT_LEDGER_COLLECTION='synthetic_credit_ledger', PLAN_INCLUDED_CREDITS={'free':0, 'blueprint':60},
       STRIPE_SECRET_KEY='synthetic-only', STRIPE_WEBHOOK_SECRET='synthetic-only')
async def current_user(request):
    return {'user_id':'user_test'}
module('backend.app.core.security', get_current_user=current_user)
module('backend.app.db.mongodb', db=None)
stripe = module('stripe', checkout=SimpleNamespace(Session=SimpleNamespace(create=denied, retrieve=denied)),
                Webhook=SimpleNamespace(construct_event=denied),
                error=SimpleNamespace(SignatureVerificationError=type('SignatureError', (Exception,), {})))
from backend.tests.payment_recovery_fakes import Database, matches
from backend.app.services import credits
from backend.app.routers import payments


def stage(name):
    return lambda q, u: u.get('$set', {}).get('finalization_status') == name


def plan_write(q, u):
    return u.get('$set', {}).get('plan') == 'blueprint'


class RecoveryTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.db = Database()
        payments.db = credits.db = self.db
        self.grants = 0
        real = credits.grant_plan_credits
        async def counted(**kwargs):
            self.grants += 1
            return await real(**kwargs)
        self.patcher = patch.object(payments, 'grant_plan_credits', counted)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)
        stripe.checkout.Session.retrieve = lambda sid: SimpleNamespace(status='complete', payment_status='paid')
        stripe.Webhook.construct_event = lambda **kwargs: {'type':'checkout.session.completed',
            'data':{'object':{'id':'cs_test', 'payment_status':'paid'}}}

    async def finalize(self):
        return await payments.finalize_paid_transaction(self.db.payment_transactions.docs[0], 'cs_test')

    def assert_effect(self, complete=True):
        self.assertEqual(self.grants, 1)
        self.assertEqual(len(self.db.ledger.docs), 1)
        self.assertEqual(self.db.users.docs[0]['credit_balance'], 60)
        self.assertEqual(self.db.users.docs[0]['credit_lifetime_granted'], 60)
        if complete:
            self.assertEqual(self.db.users.docs[0]['plan'], 'blueprint')
            self.assertEqual(self.db.payment_transactions.docs[0]['finalization_status'], 'complete')

    async def test_normal_and_replay_real_grant(self):
        for _ in range(4):
            result = await self.finalize()
            self.assertEqual(result['status'], 'complete')
        self.assert_effect()

    async def test_interrupt_after_grant_before_checkpoint(self):
        self.db.payment_transactions.fault('update_one','before',stage('grant_confirmed'), RuntimeError('before checkpoint'))
        with self.assertRaises(RuntimeError):
            await self.finalize()
        await self.finalize()
        self.assert_effect()

    async def test_plan_reply_lost_then_evidence_recovery(self):
        self.db.users.fault('update_one','after',plan_write, RuntimeError('lost plan reply'))
        with self.assertRaises(RuntimeError):
            await self.finalize()
        await self.finalize()
        self.assert_effect()

    async def test_before_plan_write_is_explicit_reconciliation(self):
        self.db.users.fault('update_one','before',plan_write, RuntimeError('before plan'))
        with self.assertRaises(RuntimeError):
            await self.finalize()
        result = await self.finalize()
        self.assertEqual(result['finalization_resolution'], 'reconciliation_required')
        self.assertEqual(result['status'], 'pending')
        self.assertEqual(self.db.users.docs[0]['plan'], 'free')
        self.assert_effect(False)

    async def test_terminal_write_failed_or_lost_response(self):
        for when in ['before', 'after']:
            with self.subTest(when=when):
                self.db = Database(); payments.db = credits.db = self.db; self.grants = 0
                self.db.payment_transactions.fault('update_one',when,stage('complete'),RuntimeError('close fault'))
                with self.assertRaises(RuntimeError):
                    await self.finalize()
                result = await self.finalize()
                self.assertEqual(result['status'], 'complete')
                self.assert_effect()

    async def test_zero_match_close_never_synthesizes_success(self):
        self.db.payment_transactions.fault('update_one','before',stage('complete'),'zero')
        result = await self.finalize()
        self.assertEqual(payments._payment_response(result)['status'], 'pending')
        await self.finalize()
        self.assert_effect()

    async def test_zero_match_user_never_succeeds(self):
        self.db.users.fault('update_one','before',plan_write,'zero')
        with self.assertRaises(RuntimeError):
            await self.finalize()
        result = await self.finalize()
        self.assertEqual(payments._payment_response(result)['status'], 'pending')
        self.assert_effect(False)

    async def test_ambiguous_grant_write_never_regrants(self):
        self.db.users.fault('find_one_and_update','after',lambda q,u:'$inc' in u, RuntimeError('lost balance reply'))
        with self.assertRaises(RuntimeError):
            await self.finalize()
        for _ in range(3):
            result = await self.finalize()
            self.assertEqual(result['finalization_resolution'], 'reconciliation_required')
        self.assert_effect(False)
        self.assertEqual(self.db.ledger.docs[0]['operation_status'], 'pending')
        self.assertIn('credit_pending_consumption', self.db.users.docs[0])

    async def test_cancel_after_grant_then_recover(self):
        self.db.payment_transactions.fault('update_one','before',stage('grant_confirmed'),asyncio.CancelledError())
        with self.assertRaises(asyncio.CancelledError):
            await self.finalize()
        await self.finalize()
        self.assert_effect()

    async def test_cancel_during_plan_after_effect_then_recover(self):
        self.db.users.fault('update_one','after',plan_write,asyncio.CancelledError())
        with self.assertRaises(asyncio.CancelledError):
            await self.finalize()
        await self.finalize()
        self.assert_effect()

    async def test_concurrent_recovery_elects_one_plan_writer(self):
        self.db.payment_transactions.fault('update_one','before',stage('grant_confirmed'),RuntimeError('interrupt'))
        with self.assertRaises(RuntimeError):
            await self.finalize()
        await asyncio.gather(*(self.finalize() for _ in range(8)))
        self.assert_effect()
        writes = [e for e in self.db.users.events if e[0:2] == ('update_one','before') and plan_write(e[2],e[3])]
        self.assertEqual(len(writes),1)

    async def test_webhook_polling_concurrently(self):
        async def body(): return b'synthetic'
        request = SimpleNamespace(body=body, headers={'Stripe-Signature':'synthetic'})
        outputs = await asyncio.gather(payments.get_payment_status('cs_test',request),
                                       payments.stripe_webhook(request), return_exceptions=True)
        for result in outputs:
            if isinstance(result, HTTPException):
                self.assertEqual(result.status_code,503)
            elif isinstance(result, Exception):
                raise result
            elif result.get('status') == 'complete':
                self.assertEqual(self.db.payment_transactions.docs[0]['finalization_status'],'complete')
        await self.finalize()
        self.assert_effect()

    async def test_polling_paid_ambiguous_returns_pending(self):
        tx = self.db.payment_transactions.docs[0]
        tx.update(payment_status='paid', status='complete', finalization_status='processing')
        result = await payments.get_payment_status('cs_test',None)
        self.assertEqual(result['payment_status'],'paid')
        self.assertEqual(result['status'],'pending')
        self.assertEqual(self.grants,0)

    async def test_old_payment_does_not_overwrite_intervening_plan(self):
        self.db.payment_transactions.fault('update_one','before',stage('grant_confirmed'), RuntimeError('interrupt'))
        with self.assertRaises(RuntimeError):
            await self.finalize()
        self.db.users.docs[0]['plan'] = 'premium'
        with self.assertRaises(RuntimeError):
            await self.finalize()
        result = await self.finalize()
        self.assertEqual(result['status'],'pending')
        self.assertEqual(self.db.users.docs[0]['plan'],'premium')
        self.assert_effect(False)

    async def test_wrong_identity_ledger_not_effective(self):
        tx = self.db.payment_transactions.docs[0]
        tx.update(finalization_status='processing')
        self.db.ledger.docs.append({'user_id':'other', 'reason_code':'plan_grant',
            'meta':{'plan_id':'blueprint','source_ref':'cs_test'}, 'operation_status':'completed', 'credits_delta':60})
        result = await self.finalize()
        self.assertNotEqual(result['finalization_status'],'complete')
        self.assertEqual(self.grants,0)

    async def test_exact_canonical_ledger_delta_can_complete_without_regrant(self):
        tx = self.db.payment_transactions.docs[0]
        tx.update(finalization_status='processing', payment_status='paid', status='pending',
                  finalization_previous_plan='free')
        self.db.ledger.docs.append({
            'entry_id':'ledger_exact', 'user_id':'user_test', 'reason_code':'plan_grant',
            'meta':{'plan_id':'blueprint','source_ref':'cs_test'},
            'operation_status':'completed', 'credits_delta':60,
        })
        result = await self.finalize()
        self.assertEqual(result['finalization_status'],'complete')
        self.assertEqual(result['status'],'complete')
        self.assertEqual(self.db.users.docs[0]['plan'],'blueprint')
        self.assertEqual(self.grants,0)

    async def test_noncanonical_ledger_delta_requires_reconciliation(self):
        cases = (
            ('missing', False, None), ('zero', True, 0), ('lower', True, 59),
            ('higher', True, 61), ('negative', True, -60), ('non_numeric', True, '60'),
        )
        for label, include_delta, recorded_delta in cases:
            with self.subTest(label=label, recorded_delta=recorded_delta):
                self.db = Database(); payments.db = credits.db = self.db; self.grants = 0
                tx = self.db.payment_transactions.docs[0]
                tx.update(finalization_status='processing', payment_status='paid', status='pending',
                          finalization_previous_plan='free')
                ledger_entry = {
                    'entry_id':'ledger_invalid', 'user_id':'user_test',
                    'reason_code':'plan_grant',
                    'meta':{'plan_id':'blueprint','source_ref':'cs_test'},
                    'operation_status':'completed',
                }
                if include_delta:
                    ledger_entry['credits_delta'] = recorded_delta
                self.db.ledger.docs.append(ledger_entry)
                result = await self.finalize()
                response = payments._payment_response(result)
                self.assertEqual(result['finalization_resolution'],'reconciliation_required')
                self.assertEqual(result['status'],'pending')
                self.assertEqual(response['status'],'pending')
                self.assertEqual(self.db.users.docs[0]['plan'],'free')
                self.assertEqual(self.db.users.docs[0]['credit_balance'],0)
                self.assertEqual(self.grants,0)

    async def test_lost_claim_reply_does_not_regrant(self):
        self.db.payment_transactions.fault('find_one_and_update','after',stage('processing'), RuntimeError('claim reply lost'))
        with self.assertRaises(RuntimeError):
            await self.finalize()
        result = await self.finalize()
        self.assertEqual(result['finalization_resolution'],'reconciliation_required')
        self.assertEqual(self.grants,0)
        self.assertEqual(len(self.db.ledger.docs),0)

    async def test_webhook_ambiguous_not_acknowledged_complete(self):
        self.db.payment_transactions.docs[0].update(finalization_status='processing')
        async def body(): return b'synthetic'
        with self.assertRaises(HTTPException) as caught:
            await payments.stripe_webhook(SimpleNamespace(body=body, headers={'Stripe-Signature':'synthetic'}))
        self.assertEqual(caught.exception.status_code,503)

    async def test_legacy_complete_without_evidence_not_trusted(self):
        self.db.payment_transactions.docs[0].update(finalization_status='complete',status='complete',
                                                   payment_status='paid',credits_grant_status='granted')
        result = await payments.get_payment_status('cs_test', None)
        self.assertEqual(result['status'],'pending')
        self.assertEqual(self.grants,0)
        self.assertEqual(self.db.users.docs[0]['plan'],'free')

    async def test_new_terminal_replay_does_not_revert_later_plan(self):
        await self.finalize()
        self.db.users.docs[0]['plan'] = 'premium'
        result = await self.finalize()
        self.assertEqual(result['status'],'complete')
        self.assertEqual(self.db.users.docs[0]['plan'],'premium')
        self.assertEqual(self.grants,1)

    async def test_legacy_completed_grant_and_matching_plan_can_recover(self):
        await self.finalize()
        tx = self.db.payment_transactions.docs[0]
        tx.pop('finalization_version')
        tx.pop('finalization_previous_plan')
        result = await self.finalize()
        self.assertEqual(result['finalization_version'],1)
        self.assert_effect()

    async def test_grant_reply_lost_after_durable_ledger_recovers(self):
        self.db.users.fault('update_one','after',lambda q,u:'credit_last_grant_at' in u.get('$set',{}),
                           RuntimeError('grant tail reply lost'))
        with self.assertRaises(RuntimeError):
            await self.finalize()
        await self.finalize()
        self.assert_effect()

    async def test_cancel_inside_grant_preserves_ambiguous_intent(self):
        self.db.users.fault('find_one_and_update','after',lambda q,u:'$inc' in u, asyncio.CancelledError())
        with self.assertRaises(asyncio.CancelledError):
            await self.finalize()
        result = await self.finalize()
        self.assertEqual(result['status'],'pending')
        self.assert_effect(False)
        self.assertIn('credit_pending_consumption', self.db.users.docs[0])

    async def test_recovery_while_original_grant_active_does_not_steal(self):
        entered, release = asyncio.Event(), asyncio.Event()
        async def pause():
            entered.set()
            await release.wait()
        self.db.ledger.fault('insert_one','before',lambda q,u:True,pause)
        original = asyncio.create_task(self.finalize())
        await entered.wait()
        pending = await self.finalize()
        self.assertEqual(pending['status'],'pending')
        self.assertEqual(self.grants,1)
        release.set()
        await original
        self.assert_effect()

    async def test_one_time_offer_no_plan_or_grant(self):
        self.db.payment_transactions.docs[0].update(item_type='one_time_offer',item_id='single_report')
        result = await self.finalize()
        self.assertEqual(result['status'],'complete')
        self.assertEqual(self.grants,0)
        self.assertEqual(self.db.users.docs[0]['plan'],'free')

    async def test_safety_controls_and_identity_matching(self):
        with self.assertRaises(AssertionError): socket.socket(socket.AF_INET)
        with self.assertRaises(AssertionError): subprocess.Popen(['no-command'])
        self.assertFalse(matches({'stripe_session_id':'other'}, {'stripe_session_id':'cs_test'}))
        self.assertFalse(matches({'finalization_owner':'other'}, {'finalization_owner':'owner'}))
        self.assertEqual(os.environ,{})


if __name__ == '__main__':
    unittest.main()
