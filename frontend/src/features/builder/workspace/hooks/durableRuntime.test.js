import HumanSemanticDecision from '../../panels/HumanSemanticDecision';
import CTADestinationSelector from '../../panels/CTADestinationSelector';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';
import { vi } from 'vitest';
import useBuilderWorkspaceRuntime from './useBuilderWorkspaceRuntime';
import { createInitialBuildState } from '../../state/builderBuildState';
import { BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID, persistBuilderBuildState, restoreBuilderBuildState } from '../../state/builderBuildStateStorage';
import { durableWorkspaceKey, createDurableLandingWorkspace, createLocalWorkspaceStore } from '../../state/durableLandingWorkspace.mjs';
import { transactionStorageKey } from '../../state/builderChangeTransaction.mjs';
import BuilderChangeReview from '../../panels/BuilderChangeReview';
import StaticSectionEditor from '../../panels/StaticSectionEditor';
import LandingArtifactPreview from '../../panels/LandingArtifactPreview';
Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
globalThis.TextEncoder = TextEncoder;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const project = { project_id: 'owned-landing', input_type: 'text', input_content: 'Landing de consultoría profesional', route: 'idea', status: 'created' };
let roots, clients, hold;
const previewBodies = new Map();
const previewHtml = node => previewBodies.get(node.querySelector('iframe').getAttribute('src'));
const NativeBlob = global.Blob;
function Harness({ owner, slot, activeProject = project }) { clients[slot] = useBuilderWorkspaceRuntime({ project: activeProject, ownerId: owner }); return null; }
const settle = async () => { for (let i = 0; i < 20; i++) await act(async () => { await new Promise((r) => setTimeout(r, 3)); }); };
async function mount(owner = 'alice', slot = 0, activeProject = project) {
  if (!roots[slot]) roots[slot] = createRoot(document.createElement('div'));
  await act(async () => { roots[slot].render(<Harness key={owner} owner={owner} slot={slot} activeProject={activeProject} />); });
  await settle();
  return clients[slot];
}
beforeEach(() => {
  roots = []; clients = []; hold = null; localStorage.clear(); previewBodies.clear();
  global.Blob = class extends NativeBlob { constructor(parts,options){super(parts,options);this.testHTML=parts.join('');} };
  URL.createObjectURL = vi.fn(blob => {const url='blob:test-'+previewBodies.size;previewBodies.set(url,blob.testHTML);return url;});
  URL.revokeObjectURL = vi.fn();
  let tail = Promise.resolve();
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: (_key, _options, fn) => {
    const waiting = hold;
    const result = tail.then(async () => { if (waiting) await waiting; return fn(); });
    tail = result.catch(() => {}); return result;
  } } });
  global.fetch = vi.fn(() => { throw new Error('NO_EXTERNAL_AI'); });
});
afterEach(() => { act(() => roots.forEach((root) => root?.unmount())); vi.restoreAllMocks(); });
test('owner recovery, exact artifact, account switch and unclaimed legacy', async () => {
  const legacyKey = transactionStorageKey(project.project_id);
  localStorage.setItem(legacyKey, '{legacy bytes without owner}');
  await mount(); const before = JSON.parse(JSON.stringify(clients[0].builderBuildState));
  expect(clients[0].landingTransaction.status).toBe('ready');
  await act(async () => { await clients[0].submitMessage('CTA principal a "Mi cuenta" y acento naranja'); });
  const proposal = clients[0].landingTransaction.pending;
  expect(clients[0].builderBuildState).toEqual(before);
  await act(async () => { await clients[0].landingTransaction.apply(); });
  const key = durableWorkspaceKey('alice', project.project_id);
  const after = JSON.parse(localStorage.getItem(key));
  expect(after.artifact).toEqual(proposal.artifact);
  act(() => roots[0].unmount()); roots[0] = null;
  await mount(); expect(clients[0].builderBuildState).toEqual(after.workspace.committed);
  expect(clients[0].landingTransaction.pending).toBeNull();
  expect(clients[0].landingTransaction.review).toBeNull();
  await mount('bob'); expect(clients[0].builderBuildState.primaryCTA).toBe(before.primaryCTA);
  expect(clients[0].builderBuildState.primaryCTA).not.toBe('Mi cuenta');
  expect(clients[0].landingTransaction.canRevert).toBe(false);
  await mount('alice');
  await act(async () => { await clients[0].landingTransaction.revert(); });
  expect(clients[0].builderBuildState).toEqual(before);
  expect(localStorage.getItem(legacyKey)).toBe('{legacy bytes without owner}');
  expect(global.fetch).not.toHaveBeenCalled();
});
test('legacy non-landing workspace restores and persists through the main cache', async () => {
  const legacyProject = { ...project, project_id: 'legacy-app' };
  const legacyState = createInitialBuildState({
    projectId: legacyProject.project_id,
    projectKind: 'app',
    templateId: BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID,
    revision: 1,
    traceId: 'legacy-trace',
    status: 'code_ready',
  });
  expect(persistBuilderBuildState({ projectId: legacyProject.project_id, state: legacyState })).toBe(true);
  const client = await mount('alice', 0, legacyProject);
  expect(client.builderBuildState.projectKind).toBe('app');
  expect(client.builderBuildState.traceId).toBe('legacy-trace');
  await act(async () => { client.handleDecision({ type: 'add_api_layer' }); });
  const restored = restoreBuilderBuildState({ projectId: legacyProject.project_id });
  expect(restored.projectKind).toBe('app');
  expect(restored.apiRoutes.length).toBeGreaterThan(0);
});
test('two mounted clients compete; stale and duplicate writes are blocked', async () => {
  await mount('alice', 0); await mount('alice', 1);
  await act(async () => { await clients[0].submitMessage('CTA principal a "Uno"'); await clients[1].submitMessage('CTA principal a "Dos"'); });
  await act(async () => { await Promise.all(clients.map((c) => c.landingTransaction.apply())); });
  expect(clients.map((c) => c.landingTransaction.error).filter(Boolean)).toHaveLength(1);
  const key = durableWorkspaceKey('alice', project.project_id);
  expect(JSON.parse(localStorage.getItem(key)).workspace.revision).toBe(1);
  await act(async () => { await clients[0].landingTransaction.apply(); });
  expect(JSON.parse(localStorage.getItem(key)).workspace.revision).toBe(1);
  await act(async () => { await clients[0].landingTransaction.revert(); });
  const reverted = localStorage.getItem(key);
  await act(async () => { await clients[0].landingTransaction.revert(); });
  expect(localStorage.getItem(key)).toBe(reverted);
});
test('account switch while apply waits cannot commit into either account', async () => {
  await mount(); await act(async () => { await clients[0].submitMessage('CTA principal a "No aplicar"'); });
  const key = durableWorkspaceKey('alice', project.project_id); const before = localStorage.getItem(key);
  let release; hold = new Promise((r) => { release = r; }); let operation;
  await act(async () => { operation = clients[0].landingTransaction.apply(); await new Promise((r) => setTimeout(r, 5)); });
  await act(async () => { roots[0].render(<Harness key="bob" owner="bob" slot={0} />); });
  hold = null;
  await act(async () => { release(); await operation; }); await settle();
  expect(localStorage.getItem(key)).toBe(before);
  expect(clients[0].landingTransaction.revision).toBe(0);
});
test('quota and corrupt data fail closed; reload drops a proposal', async () => {
  await mount(); const key = durableWorkspaceKey('alice', project.project_id); const before = localStorage.getItem(key);
  await act(async () => { await clients[0].submitMessage('CTA principal a "Pendiente"'); });
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QUOTA'); });
  await act(async () => { await clients[0].landingTransaction.apply(); });
  expect(clients[0].landingTransaction.error).toBe('QUOTA'); expect(localStorage.getItem(key)).toBe(before); spy.mockRestore();
  act(() => roots[0].unmount()); roots[0] = null; await mount();
  expect(clients[0].landingTransaction.pending).toBeNull();
  expect(clients[0].landingTransaction.review).toBeNull();
  await act(async () => { await clients[0].landingTransaction.apply(); }); expect(localStorage.getItem(key)).toBe(before);
  localStorage.setItem(key, 'corrupt'); act(() => roots[0].unmount()); roots[0] = null; await mount();
  expect(clients[0].landingTransaction.status).toBe('blocked'); expect(localStorage.getItem(key)).toBe('corrupt');
});
test('artifact manipulation and legacy decision bypass are rejected; storage event invalidates preview', async () => {
  await mount(); const key = durableWorkspaceKey('alice', project.project_id); const before = localStorage.getItem(key);
  await act(async () => { await clients[0].submitMessage('CTA principal a "Validar"'); });
  clients[0].landingTransaction.pending.artifact.html += 'tampered';
  await act(async () => { await clients[0].landingTransaction.apply(); });
  expect(clients[0].landingTransaction.error).toBe('ARTIFACT_MISMATCH');
  expect(localStorage.getItem(key)).toBe(before);
  act(() => { clients[0].handleDecision({ type: 'add_booking_flow', label: 'Bypass' }); });
  expect(localStorage.getItem(key)).toBe(before);
  await act(async () => { await clients[0].submitMessage('CTA principal a "Nueva"'); });
  act(() => window.dispatchEvent(new StorageEvent('storage', { key })));
  expect(clients[0].landingTransaction.pending).toBeNull();
  expect(clients[0].landingTransaction.review).toBeNull();
  expect(clients[0].landingTransaction.status).toBe('conflict');
  await act(async () => { await clients[0].landingTransaction.apply(); });
  expect(localStorage.getItem(key)).toBe(before);
});
test('S4 real editor stages structure, exact preview, durable apply/reload/revert; legacy decision converges', async () => {
  let product;
  function Product() {
    product = useBuilderWorkspaceRuntime({ project, ownerId: 'alice' });
    const tx = product.landingTransaction;
    return <><StaticSectionEditor state={product.builderBuildState} transaction={tx} /><BuilderChangeReview review={tx.review} />
      {product.builderBuildState && <LandingArtifactPreview state={tx.pending?.candidate || product.builderBuildState} artifact={tx.pending?.artifact} isCandidate={Boolean(tx.pending)} />}
      <button id="apply" onClick={tx.apply}>Aplicar</button><button id="revert" onClick={tx.revert}>Revertir</button></>;
  }
  const node = document.createElement('div'); roots[0] = createRoot(node);
  await act(async () => { roots[0].render(<Product />); }); await settle();
  const before = JSON.parse(JSON.stringify(product.builderBuildState));
  const beforeHtml = previewHtml(node);
  const propose = [...node.querySelectorAll('button')].find((button) => button.textContent === 'Proponer sección');
  act(() => propose.click()); await settle();
  const proposal = product.landingTransaction.pending;
  expect(proposal.operations[0].type).toBe('insert_static_section');
  expect(node.querySelector('[aria-label="Revisión exacta del cambio"]').textContent).toContain('Añadir sección');
  expect(product.landingTransaction.review.candidateHash).toBe(proposal.candidateHash);
  expect(product.landingTransaction.review.artifactHash).toBe(proposal.artifactHash);
  expect(product.builderBuildState).toEqual(before);
  expect(previewHtml(node)).toBe(proposal.artifact.html);
  expect(proposal.artifact.html).toContain('data-section-id=');
  act(() => node.querySelector('#apply').click()); await settle();
  expect(product.builderBuildState).toEqual(proposal.candidate);
  const appliedHtml = previewHtml(node);
  act(() => roots[0].unmount()); roots[0] = createRoot(node);
  await act(async () => { roots[0].render(<Product />); }); await settle();
  expect(product.builderBuildState).toEqual(proposal.candidate);
  expect(previewHtml(node)).toBe(appliedHtml);
  act(() => node.querySelector('#revert').click()); await settle();
  expect(product.builderBuildState).toEqual(before);
  expect(previewHtml(node)).toBe(beforeHtml);
  act(() => roots[0].unmount()); roots[0] = createRoot(node);
  await act(async () => { roots[0].render(<Product />); }); await settle();
  expect(product.builderBuildState).toEqual(before);
  await act(async () => { await product.handleDecision({ type: 'add_trust_section', label: 'Añadir confianza' }); });
  expect(product.builderBuildState).toEqual(before);
  expect(product.landingTransaction.pending.operations[0].type).toBe('insert_static_section');
  expect(global.fetch).not.toHaveBeenCalled();
});
test('S4 structural writes retain concurrent, owner, quota and duplicate protections', async () => {
  await mount('alice', 0); await mount('alice', 1);
  await act(async () => { await clients[0].handleDecision({ type: 'add_trust_section' }); await clients[1].handleDecision({ type: 'add_trust_section' }); });
  const key = durableWorkspaceKey('alice', project.project_id); const before = localStorage.getItem(key);
  const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QUOTA'); });
  await act(async () => { await clients[0].landingTransaction.apply(); });
  expect(localStorage.getItem(key)).toBe(before); fail.mockRestore();
  await act(async () => { await Promise.all(clients.map((c) => c.landingTransaction.apply())); });
  expect(JSON.parse(localStorage.getItem(key)).workspace.revision).toBe(1);
  expect(clients.filter(c => c.landingTransaction.error === 'STALE_WRITE')).toHaveLength(1);
  const after = localStorage.getItem(key);
  await act(async () => { await clients[0].landingTransaction.apply(); }); expect(localStorage.getItem(key)).toBe(after);
  const old = clients[1].landingTransaction;
  await mount('bob', 1); await act(async () => { await old.apply(); });
  expect(localStorage.getItem(key)).toBe(after);
  expect(clients[1].landingTransaction.revision).toBe(0);
});
test('S5 discard revokes review; an old apply handler cannot apply a new proposal', async () => {
  await mount(); const key = durableWorkspaceKey('alice', project.project_id); const before = localStorage.getItem(key);
  await act(async () => { await clients[0].handleDecision({ type: 'add_trust_section' }); });
  const oldApply = clients[0].landingTransaction.apply;
  const oldReview = clients[0].landingTransaction.review;
  act(() => clients[0].landingTransaction.discard());
  expect(clients[0].landingTransaction.review).toBeNull(); expect(localStorage.getItem(key)).toBe(before);
  await act(async () => { await oldApply(); }); expect(localStorage.getItem(key)).toBe(before);
  await act(async () => { await clients[0].submitMessage('CTA principal a "Revisión nueva"'); });
  expect(clients[0].landingTransaction.review.reviewId).not.toBe(oldReview.reviewId);
  await act(async () => { await oldApply(); }); expect(localStorage.getItem(key)).toBe(before);
  expect(clients[0].landingTransaction.error).toBe('REVIEW_STALE_OR_MISSING');
  await act(async () => { await clients[0].landingTransaction.apply(); });
  expect(clients[0].builderBuildState.primaryCTA).toBe('Revisión nueva');
});
test('S5 altered displayed diff blocks apply and invalidates pending review', async () => {
  await mount(); const key = durableWorkspaceKey('alice', project.project_id); const before = localStorage.getItem(key);
  await act(async () => { await clients[0].handleDecision({ type: 'add_trust_section' }); });
  clients[0].landingTransaction.review.sections.find((section) => section.kind === 'ADD').after.props.title = 'False displayed change';
  await act(async () => { await clients[0].landingTransaction.apply(); });
  expect(clients[0].landingTransaction.error).toBe('REVIEW_STALE_OR_TAMPERED');
  expect(clients[0].landingTransaction.review).toBeNull(); expect(localStorage.getItem(key)).toBe(before);
});
const compositeBase = { projectId: project.project_id, projectKind: 'landing', primaryCTA: 'Consultar', visualAccent: 'amber', blocks: [
  { id: 'hero', type: 'hero', order: 0, props: { title: 'Landing' } },
  { id: 'info', type: 'trust', canonicalStatic: 1, order: 1, label: 'Original', props: { title: 'Original', description: '', items: ['Original'] } },
  { id: 'tail', type: 'features', order: 2, props: { title: 'Final' } },
] };
const compositeOps = [
  { type: 'update_static_section', id: 'info', sectionType: 'trust', content: { title: 'Contenido combinado', description: 'Descripción', items: ['Punto'] } },
  { type: 'move_static_section', id: 'info', afterId: 'tail' },
];
async function seedComposite() {
  const repo = createDurableLandingWorkspace(createLocalWorkspaceStore(localStorage, navigator.locks), 'alice', project.project_id);
  await repo.initialize(compositeBase);
}
test('S6 visible EDIT+MOVE is one review, final preview, one durable revision; reload and atomic revert', async () => {
  await seedComposite(); const rendered = []; let product;
  function Product() {
    product = useBuilderWorkspaceRuntime({ project, ownerId: 'alice' }); const tx = product.landingTransaction;
    if (tx.status === 'ready') rendered.push(JSON.parse(JSON.stringify(product.builderBuildState)));
    return <><StaticSectionEditor state={product.builderBuildState} transaction={tx} /><BuilderChangeReview review={tx.review} />
      {product.builderBuildState && <LandingArtifactPreview state={tx.pending?.candidate || product.builderBuildState} artifact={tx.pending?.artifact} isCandidate={Boolean(tx.pending)} />}
      <button id="composite-apply" onClick={tx.apply}>Aplicar conjunto</button><button id="composite-revert" onClick={tx.revert}>Revertir conjunto</button></>;
  }
  const node = document.createElement('div'); roots[0] = createRoot(node);
  await act(async () => { roots[0].render(<Product />); }); await settle();
  const before = JSON.parse(JSON.stringify(product.builderBuildState)); const beforeHtml = previewHtml(node);
  act(() => Simulate.change(node.querySelector('[aria-label="Sección"]'), { target: { value: 'info' } }));
  act(() => Simulate.change(node.querySelector('[aria-label="Título de sección"]'), { target: { value: 'Contenido combinado' } }));
  act(() => Simulate.change(node.querySelector('[aria-label="Posición de sección"]'), { target: { value: 'tail' } }));
  const propose = [...node.querySelectorAll('button')].find((b) => b.textContent === 'Proponer contenido y posición');
  act(() => propose.click()); await settle();
  const p = product.landingTransaction.pending; expect(p.operationCount).toBe(2);
  expect(node.textContent).toContain('Operación 1: Editar'); expect(node.textContent).toContain('Operación 2: Mover');
  expect(product.builderBuildState).toEqual(before); expect(previewHtml(node)).toBe(p.artifact.html);
  const writes = vi.spyOn(Storage.prototype, 'setItem');
  act(() => node.querySelector('#composite-apply').click()); await settle();
  expect(product.builderBuildState).toEqual(p.candidate); expect(product.landingTransaction.revision).toBe(1);
  expect(writes.mock.calls.filter(([key]) => key === durableWorkspaceKey('alice', project.project_id))).toHaveLength(1);
  act(() => roots[0].unmount()); roots[0] = createRoot(node);
  await act(async () => { roots[0].render(<Product />); }); await settle();
  expect(product.builderBuildState).toEqual(p.candidate); expect(product.landingTransaction.review).toBeNull();
  act(() => node.querySelector('#composite-revert').click()); await settle();
  expect(product.builderBuildState).toEqual(before); expect(previewHtml(node)).toBe(beforeHtml);
  expect(product.landingTransaction.revision).toBe(2);
  expect(rendered.every((state) => JSON.stringify(state) === JSON.stringify(before) || JSON.stringify(state) === JSON.stringify(p.candidate))).toBe(true);
});
test('S6 invalid second operation and account switch during apply never expose a partial active state', async () => {
  await seedComposite(); await mount(); const key = durableWorkspaceKey('alice', project.project_id); const original = localStorage.getItem(key);
  await act(async () => { await clients[0].landingTransaction.propose([compositeOps[0], { ...compositeOps[1], afterId: 'missing' }]); });
  expect(clients[0].landingTransaction.pending).toBeNull(); expect(localStorage.getItem(key)).toBe(original); expect(clients[0].builderBuildState).toEqual(compositeBase);
  await act(async () => { await clients[0].landingTransaction.propose(compositeOps); });
  const oldApply = clients[0].landingTransaction.apply;
  act(() => clients[0].landingTransaction.discard()); await act(async () => { await oldApply(); }); expect(localStorage.getItem(key)).toBe(original);
  await act(async () => { await clients[0].landingTransaction.propose(compositeOps); });
  let release; hold = new Promise((r) => { release = r; }); let applying;
  await act(async () => { applying = clients[0].landingTransaction.apply(); await new Promise((r) => setTimeout(r, 5)); });
  await act(async () => { roots[0].render(<Harness key="bob" owner="bob" slot={0} />); });
  hold = null; await act(async () => { release(); await applying; }); await settle();
  expect(localStorage.getItem(key)).toBe(original); expect(clients[0].landingTransaction.revision).toBe(0);
});
test('S7 functional status on current kernel landing', async () => { await mount(); await act(async()=>{await clients[0].submitMessage('CTA principal a "Mi cuenta" y acento naranja');}); const t=clients[0].landingTransaction; expect(t.pending.functionalValidation.failedInvariants).toEqual([]); });
test('S7 real runtime review explains functional FAIL and bypassed apply preserves active bytes', async () => {
  const base = {...compositeBase, ctas:[{intent:'primary',href:'#info'}]};
  const repo=createDurableLandingWorkspace(createLocalWorkspaceStore(localStorage,navigator.locks),'alice',project.project_id);
  await repo.initialize(base); await mount(); const raw=localStorage.getItem(repo.key);
  await act(async()=>{await clients[0].landingTransaction.propose([{type:'remove_static_section',id:'info'}]);});
  const tx=clients[0].landingTransaction; expect(tx.review.validation).toBe('FAIL');
  const node=document.createElement('div'); roots[1]=createRoot(node);
  act(()=>roots[1].render(<BuilderChangeReview review={tx.review}/>));
  expect(node.textContent).toContain('Este cambio no puede aplicarse');
  expect(node.textContent).toContain('destino interno existente');
  await act(async()=>{await tx.apply();});
  expect(localStorage.getItem(repo.key)).toBe(raw); expect(clients[0].builderBuildState).toEqual(base);
  expect(clients[0].landingTransaction.error).toContain('FUNCTIONAL_VALIDATION_FAIL');
});

test('S8 visible repair revalidates without apply; discard revokes callback; explicit apply/revert', async () => {
  const base={...compositeBase,ctas:[{intent:'primary',href:'#info'}]};
  const repo=createDurableLandingWorkspace(createLocalWorkspaceStore(localStorage,navigator.locks),'alice',project.project_id);
  await repo.initialize(base); const raw=localStorage.getItem(repo.key); let product;
  function Product(){product=useBuilderWorkspaceRuntime({project,ownerId:'alice'});const tx=product.landingTransaction;return <><BuilderChangeReview review={tx.review} onRepair={tx.repair} busy={tx.busy}/>{tx.pending && <LandingArtifactPreview state={tx.pending.candidate} artifact={tx.pending.artifact}/>}</>;}
  const node=document.createElement('div');roots[0]=createRoot(node);act(()=>roots[0].render(<Product/>));await settle();
  const propose=async()=>{await act(async()=>{await product.landingTransaction.propose([{type:'remove_static_section',id:'info'}]);});};
  await propose();const parent=product.landingTransaction.pending;
  expect(node.textContent).toContain('Hay una reparación local disponible');
  expect([...node.querySelectorAll('button')].find(b=>b.textContent==='Proponer reparación').disabled).toBe(true);
  expect(product.landingTransaction.review.repairability.targets.every(t => typeof t.label === 'string' && typeof t.targetFragment === 'string')).toBe(true);
  expect(node.querySelectorAll('option span')).toHaveLength(0);
  const destination=node.querySelector('select');act(()=>{Simulate.change(destination,{target:{value:'tail'}});});
  const repairButton=[...node.querySelectorAll('button')].find(b=>b.textContent==='Proponer reparación');
  await act(async()=>{repairButton.click();});await settle();
  expect(product.landingTransaction.review.validation).toBe('PASS');expect(node.textContent).toContain('Todavía no se ha aplicado');
  expect(product.landingTransaction.pending.repair.parentProposalId).toBe(parent.operationId);
  expect(previewHtml(node)).toBe(product.landingTransaction.pending.artifact.html);expect(localStorage.getItem(repo.key)).toBe(raw);
  const oldApply=product.landingTransaction.apply;act(()=>product.landingTransaction.discard());
  await act(async()=>{await oldApply();});expect(localStorage.getItem(repo.key)).toBe(raw);expect(product.landingTransaction.pending).toBeNull();
  await propose();await act(async()=>{await product.landingTransaction.repair('tail');});
  await act(async()=>{await oldApply();});expect(localStorage.getItem(repo.key)).toBe(raw);
  await act(async()=>{await product.landingTransaction.decide('ACCEPT_WARNING','La sección cubre este destino.');});
  await act(async()=>{await product.landingTransaction.apply();});expect(product.landingTransaction.revision).toBe(1);
  await act(async()=>{await product.landingTransaction.revert();});expect(product.builderBuildState).toEqual(base);expect(global.fetch).not.toHaveBeenCalled();
});
test('S8 queued repair is revoked by account switch and by discard', async()=>{
  const base={...compositeBase,ctas:[{intent:'primary',href:'#info'}]};
  const repo=createDurableLandingWorkspace(createLocalWorkspaceStore(localStorage,navigator.locks),'alice',project.project_id);
  await repo.initialize(base);await mount();const raw=localStorage.getItem(repo.key);
  await act(async()=>{await clients[0].landingTransaction.propose([{type:'remove_static_section',id:'info'}]);});
  let release;hold=new Promise(r=>{release=r;});let pending;
  act(()=>{pending=clients[0].landingTransaction.repair('tail');});await act(async()=>{await new Promise(r=>setTimeout(r,20));});
  act(()=>clients[0].landingTransaction.discard());hold=null;release();await act(async()=>{await pending;});
  expect(clients[0].landingTransaction.pending).toBeNull();expect(localStorage.getItem(repo.key)).toBe(raw);
  await act(async()=>{await clients[0].landingTransaction.propose([{type:'remove_static_section',id:'info'}]);});
  hold=new Promise(r=>{release=r;});act(()=>{pending=clients[0].landingTransaction.repair('tail');});await act(async()=>{await new Promise(r=>setTimeout(r,20));});
  act(()=>roots[0].render(<Harness key="bob" owner="bob" slot={0}/>));hold=null;release();await act(async()=>{await pending;});await settle();
  expect(clients[0].landingTransaction.pending).toBeNull();expect(clients[0].landingTransaction.revision).toBe(0);expect(localStorage.getItem(repo.key)).toBe(raw);
});

test('S9 explicit target selection stages reviewed intent; old selection callback cannot apply replacement',async()=>{
  await seedComposite();let product;const node=document.createElement('div');roots[0]=createRoot(node);
  function Product(){product=useBuilderWorkspaceRuntime({project,ownerId:'alice'});return <><CTADestinationSelector state={product.builderBuildState} transaction={product.landingTransaction}/><BuilderChangeReview review={product.landingTransaction.review}/></>;}
  act(()=>roots[0].render(<Product/>));await settle();const before=JSON.parse(JSON.stringify(product.builderBuildState));
  expect(node.querySelector('button').disabled).toBe(true);
  act(()=>Simulate.change(node.querySelector('select'),{target:{value:'info'}}));
  expect(product.builderBuildState).toEqual(before);expect(product.landingTransaction.pending).toBeNull();
  act(()=>node.querySelector('button').click());await settle();
  expect(product.landingTransaction.review.destinationIntent.sectionId).toBe('info');expect(node.textContent).toContain('Destino elegido: Original (#info)');
  const old=product.landingTransaction.apply;act(()=>product.landingTransaction.discard());
  await act(async()=>{await product.landingTransaction.propose([{type:'set_primary_destination',value:'tail'}]);});
  await act(async()=>{await old();});expect(product.builderBuildState).toEqual(before);
  await act(async()=>{await product.landingTransaction.decide('ACCEPT_WARNING','La sección cubre este destino.');});
  await act(async()=>{await product.landingTransaction.apply();});expect(product.builderBuildState.destinationIntent.sectionId).toBe('tail');
  await act(async()=>{await product.landingTransaction.revert();});expect(product.builderBuildState).toEqual(before);
});

test('S11 visible acceptance captures human rationale; old callback blocked; apply and reload retain audit',async()=>{
 await seedComposite();let product;const node=document.createElement('div');roots[0]=createRoot(node);
 function Product(){product=useBuilderWorkspaceRuntime({project,ownerId:'alice'});const tx=product.landingTransaction;return <><BuilderChangeReview review={tx.review}/>{tx.review && <HumanSemanticDecision key={tx.review.reviewId} review={tx.review} decision={tx.decision} onDecide={tx.decide} busy={tx.busy}/>}</>;}
 act(()=>roots[0].render(<Product/>));await settle();const before=JSON.parse(JSON.stringify(product.builderBuildState));
 await act(async()=>{await product.landingTransaction.propose([{type:'set_primary_destination',value:'info'}]);});
 const oldApply=product.landingTransaction.apply;
 const accept=()=>[...node.querySelectorAll('button')].find(b=>b.textContent==='Aceptar advertencia');expect(accept().disabled).toBe(true);
 act(()=>Simulate.change(node.querySelector('textarea'),{target:{value:'El contenido cumple mi intención.'}}));
 await act(async()=>{accept().click();});await settle();expect(node.textContent).toContain('El contenido cumple mi intención.');expect(node.textContent).toContain('VALID');expect(product.builderBuildState).toEqual(before);
 await act(async()=>{await oldApply();});expect(product.builderBuildState).toEqual(before);
 await act(async()=>{await product.landingTransaction.apply();});expect(product.landingTransaction.revision).toBe(1);
 act(()=>roots[0].unmount());roots[0]=null;await mount();expect(clients[0].landingTransaction.pending).toBeNull();expect(clients[0].landingTransaction.audit[0].rationale).toBe('El contenido cumple mi intención.');expect(clients[0].landingTransaction.audit[0].effectiveStatus).toBe('APPLIED_HISTORICAL');
});
test('S11 reject, clarification, discard and account switch cannot revive a decision callback',async()=>{
 await seedComposite();await mount();const before=JSON.parse(JSON.stringify(clients[0].builderBuildState));
 for(const type of ['REJECT_CHANGE','REQUIRES_CLARIFICATION']){
 await act(async()=>{await clients[0].landingTransaction.propose([{type:'set_primary_destination',value:'info'}]);});
 await act(async()=>{await clients[0].landingTransaction.decide(type,'');});await act(async()=>{await clients[0].landingTransaction.apply();});expect(clients[0].builderBuildState).toEqual(before);act(()=>clients[0].landingTransaction.discard());}
 await act(async()=>{await clients[0].landingTransaction.propose([{type:'set_primary_destination',value:'info'}]);});const oldDecide=clients[0].landingTransaction.decide;
 let release,pending;hold=new Promise(r=>release=r);act(()=>{pending=oldDecide('ACCEPT_WARNING','Pendiente');});await act(async()=>{await new Promise(r=>setTimeout(r,20));});act(()=>clients[0].landingTransaction.discard());hold=null;release();await act(async()=>{await pending;});expect(clients[0].landingTransaction.decision).toBeNull();
 await mount('bob');await act(async()=>{await oldDecide('ACCEPT_WARNING','Cuenta anterior');});expect(clients[0].landingTransaction.decision).toBeNull();
 const record=JSON.parse(localStorage.getItem(durableWorkspaceKey('alice',project.project_id)));expect(record.decisions.map(d=>d.type)).toEqual(['REJECT_CHANGE','REQUIRES_CLARIFICATION']);
});

test('S12 explicit save and recovery through real hook preserves bytes and requires a fresh acceptance',async()=>{
 await seedComposite();await mount();const before=JSON.parse(JSON.stringify(clients[0].builderBuildState));
 await act(async()=>{await clients[0].landingTransaction.propose([{type:'set_primary_destination',value:'info'}]);});
 const original=clients[0].landingTransaction.pending;
 await act(async()=>{await clients[0].landingTransaction.decide('ACCEPT_WARNING','Razón anterior');});
 await act(async()=>{await clients[0].landingTransaction.savePending();});const oldApply=clients[0].landingTransaction.apply;
 act(()=>roots[0].unmount());roots[0]=null;await mount();expect(clients[0].landingTransaction.pending).toBeNull();expect(clients[0].landingTransaction.hasSavedDraft).toBe(true);
 await act(async()=>{await clients[0].landingTransaction.recoverPending();});expect(clients[0].landingTransaction.pending.artifact).toEqual(original.artifact);expect(clients[0].landingTransaction.decision).toBeNull();expect(clients[0].builderBuildState).toEqual(before);
 await act(async()=>{await oldApply();});expect(clients[0].builderBuildState).toEqual(before);
 await act(async()=>{await clients[0].landingTransaction.apply();});expect(clients[0].landingTransaction.error).toBe('HUMAN_DECISION_REQUIRED');
 await act(async()=>{await clients[0].landingTransaction.decide('ACCEPT_WARNING','Nueva revisión consciente');});await act(async()=>{await clients[0].landingTransaction.apply();});expect(clients[0].landingTransaction.hasSavedDraft).toBe(false);
 await act(async()=>{await clients[0].landingTransaction.revert();});expect(clients[0].builderBuildState).toEqual(before);
});
test('S12 account switch and discard while recovery waits do not revive pending work',async()=>{
 await seedComposite();await mount();await act(async()=>{await clients[0].landingTransaction.propose([{type:'set_primary_destination',value:'info'}]);});await act(async()=>{await clients[0].landingTransaction.savePending();});act(()=>clients[0].landingTransaction.discard());
 let release,pending;hold=new Promise(r=>release=r);act(()=>{pending=clients[0].landingTransaction.recoverPending();});await act(async()=>{await new Promise(r=>setTimeout(r,20));});act(()=>clients[0].landingTransaction.discard());hold=null;release();await act(async()=>{await pending;});expect(clients[0].landingTransaction.pending).toBeNull();
 await mount('bob');expect(clients[0].landingTransaction.hasSavedDraft).toBe(false);await mount('alice');expect(clients[0].landingTransaction.hasSavedDraft).toBe(true);
 await act(async()=>{await clients[0].landingTransaction.discardPending();});act(()=>roots[0].unmount());roots[0]=null;await mount();expect(clients[0].landingTransaction.hasSavedDraft).toBe(false);
});
