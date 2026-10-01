import test from 'node:test';
import assert from 'node:assert/strict';
import { newWorkspace, prepareChange, applyChange, revertChange, contentHash, saveWorkspace, loadWorkspace } from './builderChangeTransaction.mjs';
import { parseLandingChange } from '../command/parseLandingChange.mjs';
const base = (id = 'synthetic-a') => ({ projectId: id, projectKind: 'landing', primaryCTA: 'Antes', visualAccent: 'amber', theme: {}, ctas: [], files: [{ path: 'untouched.txt', content: 'unchanged' }], blocks: [], custom: { keep: true } });
const ops = parseLandingChange('CTA principal a "Reservar consulta" y acento naranja');
test('proposal → candidate → apply → reload → revert preserves exact before; two projects', async () => {
  for (const id of ['synthetic-a', 'synthetic-b']) {
    const before = base(id); const ws = newWorkspace(before);
    const proposal = await prepareChange(ws, ops, id);
    assert.deepEqual(ws.committed, before);
    assert.equal(proposal.candidate.primaryCTA, 'Reservar consulta');
    assert.deepEqual(proposal.candidate.files, before.files);
    const after = await applyChange(ws, proposal);
    assert.equal(after.revision, 1);
    const storage = { data: null, getItem() { return this.data; }, setItem(k,v) { this.data=v; } };
    saveWorkspace(storage, after, null);
    const restored = loadWorkspace(storage, id);
    const reverted = await revertChange(restored, 1);
    assert.deepEqual(reverted.committed, before);
    assert.equal(await contentHash(reverted.committed), proposal.baseHash);
    assert.equal(reverted.revision, 2);
    await assert.rejects(revertChange(reverted, 2), /NOTHING_TO_REVERT/);
    await assert.rejects(applyChange(after, proposal), /DUPLICATE_APPLY/);
  }
});
test('invalid, stale, tampered and cross-project proposals are blocked', async () => {
  const ws = newWorkspace(base()); const proposal = await prepareChange(ws, ops);
  for (const operations of [[], [{type:'delete',value:'x'}], [{type:'set_primary_cta',value:''}], [{type:'set_primary_cta',value:'a'.repeat(121)}], [{type:'set_accent',value:'red'}], [{type:'set_accent',value:'orange',extra:true}], [...ops,ops[0]]]) {
    await assert.rejects(prepareChange(ws, operations));
  }
  await assert.rejects(applyChange({...ws,revision:1}, proposal), /STALE/);
  await assert.rejects(applyChange(newWorkspace(base('other')), proposal), /STALE/);
  await assert.rejects(applyChange({...ws,committed:{...base(),custom:'changed'}}, proposal), /STALE/);
  await assert.rejects(applyChange(ws, {...proposal,candidate:{...proposal.candidate,files:[]}}), /CANDIDATE_MISMATCH/);
  await assert.rejects(applyChange(ws, {...proposal,candidateHash:'fake'}), /CANDIDATE_MISMATCH/);
  assert.throws(() => parseLandingChange('CTA principal a "Aceptar" y acento rojo'));
  assert.throws(() => parseLandingChange('CTA principal a "Aceptar" y borrar archivos'));
  await assert.rejects(prepareChange(newWorkspace({...base(),projectKind:'app'}),ops), /UNSUPPORTED_PROJECT/);
});
test('second change, stale revert, corrupt before and storage failures', async () => {
  const first = await applyChange(newWorkspace(base()),await prepareChange(newWorkspace(base()),ops));
  const second = await applyChange(first,await prepareChange(first,parseLandingChange('CTA principal a "Contactar" y acento ámbar')));
  await assert.rejects(revertChange(second,1), /STALE_REVERT/);
  assert.deepEqual((await revertChange(second,2)).committed, first.committed);
  const corrupt = structuredClone(first); corrupt.history[0].before.primaryCTA='tamper';
  await assert.rejects(revertChange(corrupt,1), /REVERT_IDENTITY/);
  const storage = { getItem:()=>null, setItem:()=>{throw new Error('QUOTA');} };
  assert.throws(()=>saveWorkspace(storage,first,null),/QUOTA/);
  assert.throws(()=>saveWorkspace({...storage,getItem:()=> 'other'},first,null),/STORAGE_CONFLICT/);
  assert.throws(()=>loadWorkspace({getItem:()=> '{}'},'synthetic-a'),/INVALID_STORAGE/);
});
