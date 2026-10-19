"""Local-only S15 router checks; imported fixture installs DB and AI stubs."""
from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
import test_consumption_callers as f


class ProjectIdentityTests(f.ChargedCallerFixture):
    async def test_projectless_cannot_carry_project_state(self):
        with self.assertRaises(f.HTTPException):
            await f.builder_ai.build_with_ai(f.BuilderAIInput(userInput='synthetic', currentBuildState={'projectId':'project_test'}), f.request())
        self.builder.assert_not_awaited()
        result = await self.call('builder')
        self.assertEqual(result['trace']['meta']['identity']['scope'], 'projectless')
        self.assertIsNone(result['trace']['meta']['identity']['projectId'])

    async def test_project_bound_output_has_server_identity(self):
        self.db.projects.documents['project_test'].update({
            'input_type': 'text', 'input_content': 'synthetic project', 'route': 'idea',
        })
        result = await f.builder_ai.build_with_ai(f.BuilderAIInput(userInput='synthetic', projectId='project_test'), f.request())
        identity = result['trace']['meta']['identity']
        self.assertEqual(identity['projectId'], 'project_test')
        self.assertEqual(identity['ownerId'], 'user_test')
        self.assertEqual(identity['serverRevision'], '0')
    async def test_create_identity_precedes_ai_and_one_complete_write(self):
        async def analysis(*args, identity):
            self.assertEqual(self.db.projects.insert_count, 0)
            self.assertEqual(identity['user_id'], 'user_test')
            self.assertEqual(identity['operation_id'], 'create_project:logical-operation-1')
            self.identity = identity
            return {'route':'idea', 'diagnosis':{}}
        self.analysis.side_effect = analysis
        result = await self.call('project')
        self.assertEqual(result['project_id'], self.identity['project_id'])
        self.assertEqual(result['updated_at'], self.identity['revision'])
        self.assertEqual(self.db.projects.insert_count, 1)
    async def test_refine_owner_and_cas_and_no_replay(self):
        self.db.projects.documents['project_test']['refine_questions'] = [
            {'id': 'x', 'question': 'Synthetic question?'}
        ]
        before = deepcopy(self.db.projects.documents)
        with patch.object(f.projects, 'get_current_user', return_value={'user_id': 'other'}):
            with self.assertRaises(f.HTTPException):
                await f.projects.refine_project('project_test', SimpleNamespace(answers={}), f.request())
        self.assertEqual(before, self.db.projects.documents)
        result = await f.projects.refine_project('project_test', SimpleNamespace(answers={'x':'yes'}), f.request())
        self.assertEqual(result['user_id'], 'user_test')
        self.assertNotEqual(result['updated_at'], '0')
        after = deepcopy(self.db.projects.documents)
        with self.assertRaises(f.HTTPException):
            await f.projects.refine_project('project_test', SimpleNamespace(answers={}), f.request())
        self.assertEqual(after, self.db.projects.documents)

    async def test_malformed_and_null_revisions_never_write(self):
        before = deepcopy(self.db.projects.documents)
        for value in (None, '', 'null', '*', '2026-10-03', 'invalid'):
            with self.assertRaises(f.HTTPException):
                await f.projects.refine_project('project_test', SimpleNamespace(answers={}), SimpleNamespace(headers={'If-Match':value}))
        self.db.projects.documents['project_test']['updated_at'] = None
        with self.assertRaises(f.HTTPException):
            await f.projects.refine_project('project_test', SimpleNamespace(answers={}), f.request())
        self.db.projects.documents['project_test'].pop('updated_at')
        self.assertEqual(before, self.db.projects.documents)

    async def test_blueprint_race_rejects_loser_and_preserves_winner(self):
        async def racing_ai(project):
            self.db.projects.documents['project_test']['updated_at'] = '2026-10-03T12:00:00+00:00'
            return {'synthetic': True}
        self.blueprint.side_effect = racing_ai
        with self.assertRaises(f.HTTPException) as error:
            await self.call('blueprint')
        self.assertEqual(error.exception.status_code, 409)
        self.assertNotIn('blueprint', self.db.projects.documents['project_test'])
        self.assertEqual(self.db.users.document['credit_balance'], 100)

    async def test_blueprint_checks_revision_before_economic_reservation(self):
        project = self.db.projects.documents['project_test']
        project.update({
            'updated_at': '2026-10-16T12:00:00+00:00',
            'route': 'idea', 'input_content': 'synthetic project',
        })
        with patch.object(f.projects, 'run_economic_operation', new_callable=AsyncMock) as economic:
            with self.assertRaises(f.HTTPException) as error:
                await f.projects.create_blueprint(
                    'project_test',
                    SimpleNamespace(headers={
                        'Idempotency-Key': 'blueprint-stale-before',
                        'If-Match': '2026-10-16T11:59:00+00:00',
                    }),
                )
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(error.exception.detail['code'], 'stale_project_revision')
        economic.assert_not_awaited()
        self.blueprint.assert_not_awaited()

    async def test_blueprint_foreign_project_rejects_before_economic_reservation(self):
        self.db.projects.documents['project_test']['user_id'] = 'another_owner'
        with patch.object(f.projects, 'run_economic_operation', new_callable=AsyncMock) as economic:
            with self.assertRaises(f.HTTPException) as error:
                await f.projects.create_blueprint(
                    'project_test',
                    SimpleNamespace(headers={
                        'Idempotency-Key': 'blueprint-foreign-owner',
                        'If-Match': '0',
                    }),
                )
        self.assertEqual(error.exception.status_code, 404)
        economic.assert_not_awaited()
        self.blueprint.assert_not_awaited()

    async def test_blueprint_rereads_after_reservation_and_compensates_if_stale(self):
        project = self.db.projects.documents['project_test']
        project.update({
            'updated_at': '2026-10-16T12:00:00+00:00',
            'route': 'idea', 'diagnosis': {'summary': 'synthetic'},
            'input_content': 'synthetic project', 'refine_answers': {},
            'url_analysis': 'synthetic URL facts',
        })
        original_find_one = self.db.projects.find_one
        calls = 0
        queries = []

        async def stale_before_live_read(query, projection=None):
            nonlocal calls
            calls += 1
            queries.append((deepcopy(query), projection))
            if calls == 2:
                self.db.projects.documents['project_test']['updated_at'] = (
                    '2026-10-16T12:00:01+00:00'
                )
            return await original_find_one(query, projection)

        self.db.projects.find_one = stale_before_live_read
        with self.assertRaises(f.HTTPException) as error:
            await f.projects.create_blueprint(
                'project_test',
                SimpleNamespace(headers={
                    'Idempotency-Key': 'blueprint-stale-after-reserve',
                    'If-Match': '2026-10-16T12:00:00+00:00',
                }),
            )

        self.assertEqual(calls, 2)
        self.assertEqual(queries[1][0], {
            'project_id': 'project_test', 'user_id': 'user_test',
        })
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(error.exception.detail['code'], 'stale_project_revision')
        self.blueprint.assert_not_awaited()
        self.assertEqual(self.db.users.document['credit_balance'], 100)
        self.assertEqual(self.entry()['operation_status'], 'compensated')
        self.assertNotIn('blueprint', self.db.projects.documents['project_test'])

    async def test_blueprint_missing_at_live_reread_compensates_before_provider(self):
        project = self.db.projects.documents['project_test']
        project.update({
            'updated_at': '2026-10-16T12:00:00+00:00',
            'route': 'idea', 'input_content': 'synthetic project',
        })
        original_find_one = self.db.projects.find_one
        calls = 0

        async def disappear_before_live_read(query, projection=None):
            nonlocal calls
            calls += 1
            if calls == 2:
                self.db.projects.documents.pop('project_test', None)
            return await original_find_one(query, projection)

        self.db.projects.find_one = disappear_before_live_read
        with self.assertRaises(f.HTTPException) as error:
            await f.projects.create_blueprint(
                'project_test',
                SimpleNamespace(headers={
                    'Idempotency-Key': 'blueprint-missing-after-reserve',
                    'If-Match': '2026-10-16T12:00:00+00:00',
                }),
            )

        self.assertEqual(calls, 2)
        self.assertEqual(error.exception.status_code, 404)
        self.assertEqual(error.exception.detail, 'Project not found')
        self.blueprint.assert_not_awaited()
        self.assertEqual(self.db.users.document['credit_balance'], 100)
        self.assertEqual(self.entry()['operation_status'], 'compensated')

    async def test_blueprint_provider_receives_only_five_selected_values(self):
        project = self.db.projects.documents['project_test']
        project.update({
            'updated_at': '2026-10-16T12:00:00+00:00',
            'route': 'idea', 'diagnosis': {'summary': 'synthetic diagnosis'},
            'input_content': 'synthetic project',
            'refine_answers': {'audience': 'synthetic'},
            'url_analysis': {'title': 'synthetic page'},
            'plan_recommendation': {'scores': {'complexity': 4}},
        })
        await f.projects.create_blueprint(
            'project_test',
            SimpleNamespace(headers={
                'Idempotency-Key': 'blueprint-selected-values',
                'If-Match': '2026-10-16T12:00:00+00:00',
            }),
        )
        provider_context = self.blueprint.await_args.args[0]
        self.assertEqual(set(provider_context), {
            'route', 'diagnosis', 'input_content', 'refine_answers', 'url_analysis',
        })
        self.assertEqual(provider_context, {
            'route': 'idea',
            'diagnosis': {'summary': 'synthetic diagnosis'},
            'input_content': 'synthetic project',
            'refine_answers': {'audience': 'synthetic'},
            'url_analysis': {'title': 'synthetic page'},
        })
        self.assertNotIn('project_id', provider_context)
        self.assertNotIn('user_id', provider_context)
        self.assertNotIn('updated_at', provider_context)
        self.assertNotIn('provenance', str(provider_context))
        self.assertNotIn('plan_recommendation', str(provider_context))
        stored = self.db.projects.documents['project_test']
        self.assertNotIn('project_context_snapshot', stored)
        self.assertNotIn('context_snapshot', stored)
