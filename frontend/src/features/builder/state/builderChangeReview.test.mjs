import test from 'node:test';
import assert from 'node:assert/strict';
import { newWorkspace, prepareChange, applyChange, contentHash } from './builderChangeTransaction.mjs';
import { createChangeReview, validateChangeReview, exactChanges } from './builderChangeReview.mjs';
import { createDurableLandingWorkspace, createLocalWorkspaceStore } from './authorizedRegressionFixture.mjs';
const base = { projectId: 'review', projectKind: 'landing', primaryCTA: 'Antes', visualAccent: 'amber', blocks: [
  { id: 'hero', type: 'hero', order: 0, props: { title: 'Proyecto' } },
  { id: 'info', type: 'trust', canonicalStatic: 1, order: 1, label: 'Información', props: { title: 'Información', description: '', items: ['Primero'] } },
  { id: 'tail', type: 'features', order: 2, props: { title: 'Final' } },
] };
const edit = { type: 'update_static_section', id: 'info', sectionType: 'trust', content: { title: 'Nuevo', description: 'Texto', items: ['Segundo'] } };
test('review derives exact content, additions, removals, moves and CTA properties from validated states', async () => {
  const ws = newWorkspace(base);
  for (const [op, kind] of [
    [edit, 'EDIT'], [{ type: 'move_static_section', id: 'info', afterId: 'tail' }, 'MOVE'],
    [{ type: 'remove_static_section', id: 'info' }, 'DELETE'],
    [{ ...edit, type: 'insert_static_section', id: 'new', afterId: 'hero' }, 'ADD'],
  ]) {
    const p = await prepareChange(ws, [op], 'operation'); const r = await createChangeReview(ws, 'alice', p);
    assert.ok(r.sections.some((s) => s.kind === kind && s.target === op.id));
    assert.equal(r.beforeHash, await contentHash(base)); assert.equal(r.candidateHash, await contentHash(p.candidate));
    assert.equal(r.artifactHash, await contentHash(p.artifact)); assert.equal(r.proposalHash, await contentHash(p));
    await validateChangeReview(ws, 'alice', p, r);
    if (kind === 'EDIT') assert.deepEqual(r.sections.find((s) => s.kind === kind).fields.find((c) => c.path.join('.') === 'props.items.0'), { path: ['props', 'items', '0'], beforePresent: true, afterPresent: true, before: 'Primero', after: 'Segundo' });
  }
  const p = await prepareChange(ws, [{ type: 'set_primary_cta', value: 'Después' }, { type: 'set_accent', value: 'orange' }]);
  const r = await createChangeReview(ws, 'alice', p);
  assert.ok(r.changes.some((c) => c.path.join('.') === 'primaryCTA' && c.before === 'Antes' && c.after === 'Después'));
  assert.ok(r.changes.some((c) => c.path.join('.') === 'visualAccent' && c.before === 'amber' && c.after === 'orange'));
  assert.deepEqual(exactChanges({ a: null }, {}), [{ path: ['a'], beforePresent: true, afterPresent: false, before: null }]);
});
test('all identity fields, displayed diff, warnings and validation are checked at apply', async () => {
  const ws = newWorkspace(base); const p = await prepareChange(ws, [edit]); const r = await createChangeReview(ws, 'alice', p);
  for (const field of ['ownerId', 'projectId', 'proposalId', 'baseRevision', 'beforeHash', 'candidateHash', 'artifactHash', 'proposalHash', 'reviewId', 'validation']) {
    const bad = structuredClone(r); bad[field] = 'tampered'; await assert.rejects(validateChangeReview(ws, 'alice', p, bad), /REVIEW_STALE_OR_TAMPERED/);
  }
  for (const field of ['changes', 'sections', 'warnings']) {
    const bad = structuredClone(r); bad[field] = []; await assert.rejects(validateChangeReview(ws, 'alice', p, bad), /REVIEW_STALE_OR_TAMPERED/);
  }
  for (const field of ['baseHash', 'candidateHash', 'artifactHash', 'operationId']) {
    const bad = structuredClone(p); bad[field] = 'tampered'; await assert.rejects(validateChangeReview(ws, 'alice', bad, r));
  }
  await assert.rejects(validateChangeReview(ws, 'alice', p, null), /REVIEW_REQUIRED/);
});
test('move then edit invalidates old review; delete also prevents old apply', async () => {
  let ws = newWorkspace(base); const old = await prepareChange(ws, [edit]); const review = await createChangeReview(ws, 'alice', old);
  ws = await applyChange(ws, await prepareChange(ws, [{ type: 'move_static_section', id: 'info', afterId: 'tail' }]));
  await assert.rejects(validateChangeReview(ws, 'alice', old, review), /STALE_PROPOSAL/);
  const current = await prepareChange(ws, [edit]); const fresh = await createChangeReview(ws, 'alice', current);
  await validateChangeReview(ws, 'alice', current, fresh); assert.equal(fresh.baseRevision, 1);
  ws = await applyChange(ws, await prepareChange(ws, [{ type: 'remove_static_section', id: 'info' }]));
  await assert.rejects(validateChangeReview(ws, 'alice', current, fresh), /STALE_PROPOSAL/);
});
test('two repositories holding the identical proposal/review allow only one commit; review cannot be omitted', async () => {
  const data = new Map(); let queue = Promise.resolve();
  const store = createLocalWorkspaceStore({ getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }, { request: (_k, _o, fn) => { const result = queue.then(fn); queue = result.catch(() => {}); return result; } });
  const a = createDurableLandingWorkspace(store, 'alice', 'review'); const b = createDurableLandingWorkspace(store, 'alice', 'review');
  await a.initialize(base); const envelope = await a.propose([edit]); const before = await a.read();
  const missing = structuredClone(envelope); delete missing.review; await assert.rejects(a.apply(missing), /REVIEW_REQUIRED/); assert.deepEqual(await a.read(), before);
  const tampered = structuredClone(envelope); tampered.review.changes = []; await assert.rejects(a.apply(tampered), /REVIEW_STALE_OR_TAMPERED/); assert.deepEqual(await a.read(), before);
  const result = await Promise.allSettled([a.apply(envelope), b.apply(structuredClone(envelope))]);
  assert.equal(result.filter((x) => x.status === 'fulfilled').length, 1); assert.match(result.find((x) => x.status === 'rejected').reason.message, /STALE_(WRITE|DECISION)/);
});
