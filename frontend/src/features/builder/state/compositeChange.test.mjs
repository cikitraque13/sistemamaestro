import test from 'node:test';
import assert from 'node:assert/strict';
import { newWorkspace, prepareChange, applyChange, revertChange } from './builderChangeTransaction.mjs';
import { createChangeReview, validateChangeReview } from './builderChangeReview.mjs';
import { createDurableLandingWorkspace, createLocalWorkspaceStore } from './authorizedRegressionFixture.mjs';
import { renderLandingArtifact } from '../preview/landingArtifact.mjs';
const base = { projectId: 'composite', projectKind: 'landing', primaryCTA: 'Consultar', visualAccent: 'amber', blocks: [
  { id: 'hero', type: 'hero', order: 0, props: { title: 'Landing' } },
  { id: 'info', type: 'trust', canonicalStatic: 1, label: 'Antes', order: 1, props: { title: 'Antes', description: '', items: ['Original'] } },
  { id: 'tail', type: 'features', order: 2, props: { title: 'Final' } },
] };
const edit = { type: 'update_static_section', id: 'info', sectionType: 'trust', content: { title: 'Después', description: 'Nuevo contenido', items: ['Nuevo'] } };
const move = { type: 'move_static_section', id: 'info', afterId: 'tail' };
function fixture() {
  const data = new Map(); const writes = []; let queue = Promise.resolve();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); writes.push(JSON.parse(value)); } };
  const store = createLocalWorkspaceStore(storage, { request: (_key, _options, fn) => { const p = queue.then(fn); queue = p.catch(() => {}); return p; } });
  return { data, writes, storage, open: (owner = 'alice') => createDurableLandingWorkspace(store, owner, 'composite') };
}
test('EDIT + MOVE has one final candidate/review, one durable write and atomic exact revert', async () => {
  const f = fixture(); const repo = f.open(); const before = await repo.initialize(base); f.writes.length = 0;
  const p = await repo.propose([edit, move]);
  assert.equal(p.proposal.operationCount, 2); assert.equal(p.review.operationCount, 2);
  assert.deepEqual(p.review.steps.map((s) => s.type), [edit.type, move.type]);
  assert.deepEqual(p.review.finalStructure.map((s) => s.id), ['hero', 'tail', 'info']);
  assert.equal(p.proposal.candidate.blocks[2].props.title, 'Después');
  assert.equal(f.writes.length, 0); assert.deepEqual(await repo.read(), before);
  const after = await repo.apply(p);
  assert.equal(f.writes.length, 1); assert.equal(after.workspace.revision, 1); assert.equal(after.workspace.history.length, 1);
  assert.deepEqual(after.artifact, p.proposal.artifact); assert.deepEqual((await f.open().read()).workspace.committed, p.proposal.candidate);
  const restored = await f.open().revert(1);
  assert.equal(f.writes.length, 2); assert.equal(restored.workspace.revision, 2); assert.deepEqual(restored.workspace.committed, base); assert.deepEqual(restored.artifact, before.artifact);
  await assert.rejects(repo.revert(2), /NOTHING_TO_REVERT/); assert.equal(f.writes.length, 2);
});
test('failed second operation, removed target, impossible MOVE and mid-sequence duplicate never write', async () => {
  const f = fixture(); const repo = f.open(); await repo.initialize(base); const raw = f.data.get(repo.key); f.writes.length = 0;
  const add = { ...edit, type: 'insert_static_section', id: 'new', afterId: 'hero' };
  for (const operations of [
    [edit, { ...move, afterId: 'missing' }],
    [{ type: 'remove_static_section', id: 'info' }, edit],
    [edit, { ...move, afterId: null }],
    [add, { ...add }],
    [edit, { ...edit, content: { ...edit.content, title: '' } }],
  ]) { await assert.rejects(repo.propose(operations)); assert.equal(f.data.get(repo.key), raw); assert.equal(f.writes.length, 0); }
  await assert.rejects(repo.propose([edit, move, edit, move, edit]), /INVALID_OPERATIONS/);
  await assert.rejects(repo.propose([edit, { type: 'set_accent', value: 'orange' }]), /MIXED_COMPOSITE_NOT_SUPPORTED/);
  // Ordered dependencies are supported explicitly: an ADD creates a target for EDIT.
  const valid = await repo.propose([add, { ...edit, id: 'new' }]); assert.equal(valid.proposal.candidate.blocks.find((b) => b.id === 'new').props.title, 'Después');
});
test('tampering order, count, operation set, candidate, artifact or review prevents all writes', async () => {
  const f = fixture(); const repo = f.open(); await repo.initialize(base); const original = f.data.get(repo.key);
  const p = await repo.propose([edit, move]);
  const mutate = [
    (q) => q.proposal.operations.reverse(),
    (q) => { q.proposal.operations.push(edit); q.proposal.operationCount++; },
    (q) => { q.proposal.operationCount = 3; },
    (q) => { q.proposal.candidate.blocks[2].props.title = 'Tampered'; },
    (q) => { q.proposal.artifact.html += 'Tampered'; },
    (q) => { q.review.steps.reverse(); },
    (q) => { q.proposal.operations[1].afterId = 'missing'; },
  ];
  for (const change of mutate) { const q = structuredClone(p); change(q); await assert.rejects(repo.apply(q)); assert.equal(f.data.get(repo.key), original); }
  const setItem = f.storage.setItem; f.storage.setItem = () => { throw new Error('QUOTA'); };
  await assert.rejects(repo.apply(p), /QUOTA/); assert.equal(f.data.get(repo.key), original); f.storage.setItem = setItem;
  await repo.apply(p); await assert.rejects(repo.apply(p), /STALE_(WRITE|DECISION)/);
});
test('same composite on two clients has one winner; owner mismatch and stale base never partially replay', async () => {
  const f = fixture(); const a = f.open(); const b = f.open(); await a.initialize(base); const p = await a.propose([edit, move]);
  assert.throws(() => f.open('bob').apply(p), /OWNER_MISMATCH/);
  const results = await Promise.allSettled([a.apply(p), b.apply(structuredClone(p))]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1); assert.match(results.find((r) => r.status === 'rejected').reason.message, /STALE_(WRITE|DECISION)/);
  assert.equal((await a.read()).workspace.revision, 1);
});
test('review ties ordered steps to final state, including commuting EDIT/MOVE', async () => {
  const ws = newWorkspace(base); const p = await prepareChange(ws, [edit, move]); const review = await createChangeReview(ws, 'alice', p);
  const reversed = await prepareChange(ws, [move, edit], p.operationId);
  assert.deepEqual(reversed.candidate, p.candidate); // Same final bytes still require a new review for a different sequence.
  await assert.rejects(validateChangeReview(ws, 'alice', reversed, review), /REVIEW_STALE_OR_TAMPERED/);
  const after = await applyChange(ws, p); const before = await revertChange(after, 1);
  assert.deepEqual(renderLandingArtifact(before.committed), renderLandingArtifact(base));
});
