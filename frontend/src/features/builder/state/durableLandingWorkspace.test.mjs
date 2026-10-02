import test from 'node:test';
import assert from 'node:assert/strict';
import { createDurableLandingWorkspace, createLocalWorkspaceStore } from './authorizedRegressionFixture.mjs';
const base = { projectId: 'landing', projectKind: 'landing', primaryCTA: 'Antes', visualAccent: 'amber' };
function fixture() {
  const data = new Map();
  let tail = Promise.resolve();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const locks = { request: (_key, _options, fn) => {
    const result = tail.then(fn); tail = result.catch(() => {}); return result;
  } };
  const store = createLocalWorkspaceStore(storage, locks);
  return { data, storage, open: (owner = 'alice') => createDurableLandingWorkspace(store, owner, 'landing') };
}
test('reopen restores exact state and artifact; revert restores before; duplicates blocked', async () => {
  const f = fixture(); const a = f.open(); const before = await a.initialize(base);
  const proposal = await a.propose([{ type: 'set_primary_cta', value: 'Después' }], 'one');
  assert.deepEqual(await a.read(), before);
  const after = await a.apply(proposal);
  assert.deepEqual(after.artifact, proposal.proposal.artifact);
  assert.deepEqual(await f.open().read(), after);
  await assert.rejects(a.apply(proposal), /STALE_WRITE/);
  const reverted = await f.open().revert(1);
  assert.deepEqual(reverted.workspace.committed, before.workspace.committed);
  assert.deepEqual(reverted.artifact, before.artifact);
  await assert.rejects(a.revert(1), /STALE_WRITE/);
  await assert.rejects(a.revert(2), /NOTHING_TO_REVERT/);
});
test('two concurrent writers have exactly one winner', async () => {
  const f = fixture(); const a = f.open(); const b = f.open(); await a.initialize(base);
  const p = await a.propose([{ type: 'set_accent', value: 'orange' }], 'a');
  const q = await b.propose([{ type: 'set_primary_cta', value: 'B' }], 'b');
  const results = await Promise.allSettled([a.apply(p), b.apply(q)]);
  assert.equal(results.filter((x) => x.status === 'fulfilled').length, 1);
  assert.match(results.find((x) => x.status === 'rejected').reason.message, /STALE_WRITE/);
  assert.equal((await a.read()).workspace.revision, 1);
});
test('owners isolated and cross-owner proposal rejected', async () => {
  const f = fixture(); const a = f.open(); const b = f.open('bob');
  await a.initialize(base); assert.equal(await b.read(), null); await b.initialize(base);
  const p = await a.propose([{ type: 'set_accent', value: 'orange' }]);
  assert.throws(() => b.apply(p), /OWNER_MISMATCH/);
  assert.throws(() => f.open(''), /OWNER_AND_PROJECT_REQUIRED/);
});
test('recovery from serialized bytes in a fresh store and repeated initialization preserve authority', async () => {
  const first = fixture(); const a = first.open(); await a.initialize(base);
  const proposal = await a.propose([{ type: 'set_primary_cta', value: 'Persistido' }]);
  const after = await a.apply(proposal);
  const second = fixture(); second.data.set(a.key, first.data.get(a.key));
  const reopened = second.open();
  assert.deepEqual(await reopened.read(), after);
  assert.deepEqual(await reopened.initialize({ ...base, primaryCTA: 'Obsoleto' }), after);
  assert.deepEqual((await reopened.revert(1)).workspace.committed, base);
});
test('corruption and quota failure preserve persisted bytes without fallback', async () => {
  const f = fixture(); const a = f.open(); await a.initialize(base);
  const original = f.data.get(a.key);
  const p = await a.propose([{ type: 'set_accent', value: 'orange' }]);
  f.storage.setItem = () => { throw new Error('QUOTA'); };
  await assert.rejects(a.apply(p), /QUOTA/); assert.equal(f.data.get(a.key), original);
  const corrupt = JSON.parse(original); corrupt.workspace.committed.primaryCTA = 'Corrupt';
  f.data.set(a.key, JSON.stringify(corrupt));
  await assert.rejects(a.read(), /CORRUPT_WORKSPACE/);
  await assert.rejects(a.initialize(base), /CORRUPT_WORKSPACE/);
  assert.equal(f.data.get(a.key), JSON.stringify(corrupt));
});
test('input mutation and tampered artifact cannot alter accepted revision', async () => {
  const f = fixture(); const a = f.open(); await a.initialize(base);
  const p = await a.propose([{ type: 'set_accent', value: 'orange' }]);
  const applying = a.apply(p); p.proposal.candidate.primaryCTA = 'Injected';
  assert.equal((await applying).workspace.committed.primaryCTA, 'Antes');
  const q = await a.propose([{ type: 'set_accent', value: 'amber' }]);
  q.proposal.artifact.html += 'injected';
  await assert.rejects(a.apply(q), /ARTIFACT_MISMATCH/);
  assert.equal((await a.read()).workspace.revision, 1);
  assert.throws(() => createLocalWorkspaceStore(f.storage, null), /ATOMIC_STORAGE_UNAVAILABLE/);
});
