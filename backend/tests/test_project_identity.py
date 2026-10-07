"""Local-only S15 router checks; imported fixture installs DB and AI stubs."""
from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import patch
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
