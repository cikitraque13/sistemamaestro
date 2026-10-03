import test from 'node:test';
import assert from 'node:assert/strict';
import { createDurableLandingWorkspace, createLocalWorkspaceStore } from './authorizedRegressionFixture.mjs';
import { contentHash, newWorkspace, prepareChange, applyChange } from './builderChangeTransaction.mjs';
import { renderLandingArtifact } from '../preview/landingArtifact.mjs';
import { DURABLE_STORAGE_POLICY } from './durableLandingWorkspace.mjs';
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

// Genuine legacy v1 bytes, produced by the original kernel without S14 fields.
async function seedLegacy(f, count, timestamps, state = base) {
  const a = f.open();
  let workspace = newWorkspace(state);
  for (let i = 0; i < count; i++) {
    const p = await prepareChange(workspace, [{ type: 'set_accent', value: i % 2 ? 'amber' : 'orange' }], `legacy-${i}`, 'alice');
    workspace = await applyChange(workspace, p);
    if (timestamps) workspace.history.at(-1).createdAt = timestamps(i);
  }
  const body = { version: 1, ownerId: 'alice', projectId: 'landing', workspace,
    artifact: renderLandingArtifact(workspace.committed), decisions: [], decisionEpoch: 0, pendingDraft: null, draftVersion: 0 };
  const record = { ...body, digest: await contentHash(body) };
  f.data.set(a.key, JSON.stringify(record));
  return { a, record };
}
async function compactBySaving(a) {
  const p = await a.propose([{ type: 'set_accent', value: 'amber' }]);
  await a.savePending(p);
  return a.read();
}

test('S14 legacy v1 is read without rewriting; IDs reconstructed and revision survives max-64 truncation', async () => {
  const f = fixture(); const { a } = await seedLegacy(f, 70);
  const raw = f.data.get(a.key);
  const read = await a.read();
  assert.equal(read.workspace.historyBaseRevision, 0);
  assert.equal(read.workspace.consumedOperationIds.length, 70);
  assert.equal(f.data.get(a.key), raw);
  const compacted = await compactBySaving(a);
  assert.equal(compacted.workspace.revision, 70);
  assert.equal(compacted.workspace.historyBaseRevision, 6);
  assert.equal(compacted.workspace.history.length, 64);
  assert.equal(compacted.workspace.history[0].operationId, 'legacy-6');
  assert.equal(compacted.workspace.compactedProvenance.length, 6);
  await assert.rejects(a.propose([{ type: 'set_accent', value: 'orange' }], 'legacy-0'), /DUPLICATE_APPLY/);
  const fresh = f.open(); const p = await fresh.propose([{ type: 'set_accent', value: 'orange' }]);
  const next = await fresh.apply(p);
  assert.equal(next.workspace.revision, 71);
  assert.equal(next.workspace.historyBaseRevision + next.workspace.history.length, 71);
  await assert.rejects(a.revert(70), /STALE_WRITE/);
});

test('S14 90-day cutoff is strict; oldest-first and minimum 24 snapshots override expiry', async (t) => {
  const now = Date.parse('2026-10-03T12:00:00Z');
  t.mock.method(Date, 'now', () => now);
  const f = fixture(); const { a, record } = await seedLegacy(f, 30, i => new Date(now - DURABLE_STORAGE_POLICY.retentionMs - (i < 28 ? 1 : 0)).toISOString());
  const compacted = await compactBySaving(a);
  assert.equal(compacted.workspace.historyBaseRevision, 28);
  assert.deepEqual(compacted.workspace.history.map(e => e.operationId), ['legacy-28', 'legacy-29']);
  assert.equal(compacted.workspace.revertSnapshots.length, 22);
  assert.deepEqual(compacted.workspace.revertSnapshots.map(e => e.operationId), record.workspace.history.slice(6, 28).map(e => e.operationId));
  assert.deepEqual(compacted.workspace.committed, record.workspace.committed);
  // Reopen on every undo, including snapshots whose audit events were evicted.
  for (let i = 0; i < 24; i++) {
    const next = await f.open().revert(30 + i);
    assert.deepEqual(next.workspace.committed, record.workspace.history[29 - i].before);
    assert.equal(next.workspace.revision, 31 + i);
    assert.ok(next.workspace.history.length <= 64);
  }
  await assert.rejects(f.open().revert(54), /NOTHING_TO_REVERT/);
});

test('S14 legacy events without timestamps never expire by age; compaction selection is deterministic', async (t) => {
  t.mock.method(Date, 'now', () => Date.parse('2099-01-01T00:00:00Z'));
  const f = fixture(); const { a } = await seedLegacy(f, 30);
  assert.equal((await compactBySaving(a)).workspace.history.length, 30);
  const second = fixture(); const { a: b } = await seedLegacy(second, 70);
  const third = fixture(); third.data.set(b.key, second.data.get(b.key));
  const x = await compactBySaving(b), y = await compactBySaving(third.open());
  assert.deepEqual(x.workspace, y.workspace);
  assert.equal(x.workspace.history.length, 64);
});

test('S14 soft pressure compacts; hard capacity preserves mandatory data or rejects atomically', async () => {
  const f = fixture(); const { a } = await seedLegacy(f, 60, undefined, { ...base, fixturePayload: 'x'.repeat(2600) });
  const beforeBytes = 2 * (a.key.length + f.data.get(a.key).length);
  assert.ok(beforeBytes > DURABLE_STORAGE_POLICY.softBytes);
  const next = await compactBySaving(a);
  assert.ok(next.workspace.history.length < 60);
  assert.ok(next.workspace.history.length + next.workspace.revertSnapshots.length >= 24);
  assert.ok(2 * (a.key.length + f.data.get(a.key).length) <= DURABLE_STORAGE_POLICY.capacityBytes);
  assert.ok(next.pendingDraft);

  const oversized = fixture(); const repo = oversized.open();
  await assert.rejects(repo.initialize({ ...base, payload: 'x'.repeat(200000) }), /DURABLE_CAPACITY_EXCEEDED/);
  assert.equal(oversized.data.size, 0);
  // No removable history: soft threshold consumes margin, but remains under hard cap.
  const margin = fixture(); const c = margin.open();
  await c.initialize({ ...base, payload: 'x'.repeat(150000) });
  const saved = margin.data.get(c.key);
  assert.ok(2 * (c.key.length + saved.length) > DURABLE_STORAGE_POLICY.softBytes);
  assert.ok(2 * (c.key.length + saved.length) <= DURABLE_STORAGE_POLICY.capacityBytes);
  const proposal = await c.propose([{ type: 'set_accent', value: 'orange' }]);
  await assert.rejects(c.apply(proposal), /DURABLE_CAPACITY_EXCEEDED/);
  assert.equal(margin.data.get(c.key), saved);
});

test('S14 compaction never touches excluded namespaces; failed setItem preserves every byte', async () => {
  const f = fixture(); const { a } = await seedLegacy(f, 70);
  for (const key of ['sistemamaestro:builderBuildState:v1:landing:opp_001', 'sistemamaestro:landingTransaction:v1:landing', 'sistema_maestro.active_builder_project_id', 'sm_cookie_consent_v1']) f.data.set(key, 'untouched');
  const before = new Map(f.data);
  const p = await a.propose([{ type: 'set_accent', value: 'orange' }]);
  f.storage.setItem = () => { throw new Error('QUOTA'); };
  await assert.rejects(a.savePending(p), /QUOTA/);
  assert.deepEqual(f.data, before);
  f.storage.setItem = (key, value) => f.data.set(key, value);
  await a.savePending(p);
  for (const [key, value] of before) if (key !== a.key) assert.equal(f.data.get(key), value);
  const bob = f.open('bob');
  f.data.set(bob.key, f.data.get(a.key));
  await assert.rejects(bob.read(), /OWNERSHIP_OR_VERSION_MISMATCH/);
  const wrongProject = createDurableLandingWorkspace(createLocalWorkspaceStore(f.storage, { request: (_k, _o, fn) => fn() }), 'alice', 'other');
  f.data.set(wrongProject.key, f.data.get(a.key));
  await assert.rejects(wrongProject.read(), /OWNERSHIP_OR_VERSION_MISMATCH/);
});

test('S14 exact UTF-16 capacity boundary includes key; overflow never initializes storage', async () => {
  const f = fixture(), a = f.open();
  await a.initialize({ ...base, fixturePayload: '' });
  const overhead = 2 * (a.key.length + f.data.get(a.key).length);
  const units = (DURABLE_STORAGE_POLICY.capacityBytes - overhead) / 2;
  const payload = '😀'.repeat(Math.floor(units / 2)) + (units % 2 ? 'x' : '');
  const exact = fixture(), b = exact.open();
  await b.initialize({ ...base, fixturePayload: payload });
  assert.equal(2 * (b.key.length + exact.data.get(b.key).length), DURABLE_STORAGE_POLICY.capacityBytes);
  const overflow = fixture(), c = overflow.open();
  await assert.rejects(c.initialize({ ...base, fixturePayload: payload + 'x' }), /DURABLE_CAPACITY_EXCEEDED/);
  assert.equal(overflow.data.size, 0);
});

test('S14 truncated records without complete anti-replay ledger fail closed', async () => {
  const f = fixture(); const { a } = await seedLegacy(f, 70);
  await compactBySaving(a);
  const intact = f.data.get(a.key);
  for (const corrupt of [ws => delete ws.consumedOperationIds, ws => ws.compactedProvenance.pop(), ws => ws.historyBaseRevision++]) {
    const record = JSON.parse(intact); corrupt(record.workspace);
    const { digest, ...body } = record; record.digest = await contentHash(body);
    const raw = JSON.stringify(record); f.data.set(a.key, raw);
    await assert.rejects(f.open().read(), /CORRUPT_WORKSPACE/);
    assert.equal(f.data.get(a.key), raw);
  }
});
