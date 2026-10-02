import test from 'node:test';
import assert from 'node:assert/strict';
import { newWorkspace, prepareChange, applyChange, revertChange } from './builderChangeTransaction.mjs';
import { renderLandingArtifact } from '../preview/landingArtifact.mjs';
const base = { projectId: 'structural', projectKind: 'landing', primaryCTA: 'Consultar', visualAccent: 'amber', blocks: [
  { id: 'hero', type: 'hero', order: 0, props: { title: 'Proyecto' } }, { id: 'old', type: 'features', order: 10, props: { title: 'Anterior' } },
] };
const insert = { type: 'insert_static_section', id: 'static-info', sectionType: 'trust', afterId: 'hero', content: { title: 'Decide', description: 'Información', items: ['Uno', 'Dos'] } };
test('one engine inserts, edits, moves, removes; every revert restores exact structure and bytes', async () => {
  let ws = newWorkspace(base); const initial = JSON.stringify(ws);
  const p = await prepareChange(ws, [insert]); assert.equal(JSON.stringify(ws), initial);
  assert.deepEqual(p.candidate.blocks.map((b) => b.id), ['hero', 'static-info', 'old']);
  assert.match(p.artifact.html, /data-section-id="static-info"/);
  ws = await applyChange(ws, p);
  for (const op of [
    { type: 'update_static_section', id: insert.id, sectionType: 'trust', content: { ...insert.content, title: 'Actualizado' } },
    { type: 'move_static_section', id: insert.id, afterId: 'old' },
    { type: 'remove_static_section', id: insert.id },
  ]) {
    const before = structuredClone(ws); const artifact = renderLandingArtifact(ws.committed);
    const proposal = await prepareChange(ws, [op]); const after = await applyChange(ws, proposal);
    assert.deepEqual(after.committed, proposal.candidate); assert.deepEqual(renderLandingArtifact(after.committed), proposal.artifact);
    ws = await revertChange(after, after.revision);
    assert.deepEqual(ws.committed, before.committed); assert.deepEqual(renderLandingArtifact(ws.committed), artifact);
  }
  const applied = await applyChange(newWorkspace(base), p); const reverted = await revertChange(applied, 1);
  assert.deepEqual(reverted.committed, base); assert.deepEqual(renderLandingArtifact(reverted.committed), renderLandingArtifact(base));
});
test('schema, type, identity, target, order and duplicates fail before activation', async () => {
  const ws = newWorkspace(base);
  for (const bad of [ { ...insert, id: 'hero' }, { ...insert, sectionType: 'script' }, { ...insert, afterId: 'missing' }, { ...insert, afterId: null }, { ...insert, id: '<bad>' }, { ...insert, arbitrary: true }, { ...insert, content: { ...insert.content, items: [] } }, { ...insert, content: { ...insert.content, title: '' } } ]) await assert.rejects(prepareChange(ws, [bad]));
  await assert.rejects(prepareChange(newWorkspace({ ...base, blocks: [...base.blocks, base.blocks[0]] }), [insert]), /DUPLICATE_SECTION_ID/);
  await assert.rejects(prepareChange(newWorkspace({ ...base, blocks: [] }), [insert]), /INVALID_SECTION_STRUCTURE/);
  await assert.rejects(prepareChange(ws, [{ type: 'remove_static_section', id: 'hero' }]), /UNSUPPORTED_SECTION_TARGET/);
});
test('tampered structural proposal, artifacts, stale and duplicates cannot apply', async () => {
  const ws = newWorkspace(base); const p = await prepareChange(ws, [insert]);
  const bad = structuredClone(p); bad.candidate.blocks[1].props.title = 'Injected'; await assert.rejects(applyChange(ws, bad), /CANDIDATE_MISMATCH/);
  const badHtml = structuredClone(p); badHtml.artifact.html += 'bad'; await assert.rejects(applyChange(ws, badHtml), /ARTIFACT_MISMATCH/);
  const badHash = structuredClone(p); badHash.artifactHash = 'bad'; await assert.rejects(applyChange(ws, badHash), /ARTIFACT_HASH_MISMATCH/);
  const q = await prepareChange(ws, [{ type: 'set_accent', value: 'orange' }]); const other = await applyChange(ws, q);
  await assert.rejects(applyChange(other, p), /STALE_PROPOSAL/);
  const after = await applyChange(ws, p); await assert.rejects(applyChange(after, p), /DUPLICATE_APPLY/);
  const reverted = await revertChange(after, 1); await assert.rejects(revertChange(reverted, 2), /NOTHING_TO_REVERT/);
});
test('hostile section content is escaped as text without active markup', async () => {
  const p = await prepareChange(newWorkspace(base), [{ ...insert, content: { title: '<script>alert(1)</script>', description: '<img src=x onerror=alert(1)>', items: ['</li><iframe src=x>'] } }]);
  assert.ok(!p.artifact.html.includes('<script>')); assert.ok(!p.artifact.html.includes('<img')); assert.ok(!p.artifact.html.includes('<iframe'));
  assert.match(p.artifact.html, /&lt;script&gt;/);
});
