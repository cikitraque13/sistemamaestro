import test from 'node:test';
import assert from 'node:assert/strict';
import {createDurableLandingWorkspace,createLocalWorkspaceStore} from './authorizedRegressionFixture.mjs';
const base={projectId:'s11',projectKind:'landing',primaryCTA:'Inicio',visualAccent:'amber',blocks:[{id:'hero',type:'hero',props:{title:'Inicio'}},{id:'info',type:'trust',canonicalStatic:1,props:{title:'Equipo'}}]};
function fixture(){const data=new Map();let tail=Promise.resolve();const store=createLocalWorkspaceStore({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},{request:(k,o,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}});return {open:(owner='alice',check)=>createDurableLandingWorkspace(store,owner,'s11',check)};}
async function setup(){const f=fixture(),a=f.open();await a.initialize(base);const p=await a.propose([{type:'set_primary_destination',value:'info'}]);return {f,a,p};}
test('accept requires human rationale, persists audit with exact binding, reload cannot reuse, applied state and revert survive',async()=>{
 const {a,p,f}=await setup();await assert.rejects(a.apply(p),/HUMAN_DECISION_REQUIRED/);await assert.rejects(a.decide(p,'ACCEPT_WARNING','  '),/RATIONALE/);
 const d=await a.decide(p,'ACCEPT_WARNING','El detalle está en esta sección.');assert.equal(d.decision.validity,'VALID');assert.equal((await a.read()).workspace.revision,0);
 await assert.rejects(f.open().apply(d),/STALE_DECISION/);await a.apply(d);const recovered=await f.open().read();assert.equal(recovered.workspace.history[0].humanDecision.rationale,'El detalle está en esta sección.');assert.equal(recovered.decisions[0].reviewId,p.review.reviewId);await a.revert(1);assert.deepEqual((await a.read()).workspace.committed,base);
});
test('tampering any identity or rationale cannot authorize apply, including rehashed decision',async()=>{
 const {a,p}=await setup();const d=await a.decide(p,'ACCEPT_WARNING','Intención temporal.');const before=await a.read();
 for(const key of ['decisionId','reviewId','candidateHash','artifactHash','semanticAssessmentId','ownerId','baseRevision','rationale']){const bad=structuredClone(d);bad.decision[key]='changed';await assert.rejects(a.apply(bad));assert.deepEqual(await a.read(),before);}
 const {contentHash}=await import('./builderChangeTransaction.mjs');const bad=structuredClone(d);bad.decision.rationale='Otra razón';const {decisionId,...body}=bad.decision;bad.decision.decisionId=await contentHash(body);await assert.rejects(a.apply(bad),/STALE_DECISION/);
});
test('reject and clarification are recorded without content change and terminal for that review',async()=>{
 for(const type of ['REJECT_CHANGE','REQUIRES_CLARIFICATION']){const {a,p}=await setup();const d=await a.decide(p,type,'');await assert.rejects(a.apply(d),/DECISION_TERMINAL/);await assert.rejects(a.decide(d,'ACCEPT_WARNING','Revivo'),/DECISION_TERMINAL/);assert.deepEqual((await a.read()).workspace.committed,base);assert.equal((await a.read()).decisions[0].type,type);}
});
test('cross-tab decision race has one winner and invalidates the other envelope',async()=>{
 const {a,p,f}=await setup(),b=f.open();const other=await b.propose([{type:'set_primary_destination',value:'info'}]);
 const results=await Promise.allSettled([a.decide(p,'ACCEPT_WARNING','Primera'),b.decide(other,'REJECT_CHANGE','Segunda')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);await assert.rejects(b.apply(other),/STALE_DECISION/);
});
test('new review, base revision and owner/session cannot inherit approval',async()=>{
 const {a,p,f}=await setup();const d=await a.decide(p,'ACCEPT_WARNING','Una revisión');const other=await a.propose([{type:'set_primary_destination',value:'info'}]);await assert.rejects(a.apply({...other,decision:d.decision}),/STALE_DECISION/);await assert.rejects(async()=>f.open('bob').apply(d));await a.apply(d);await assert.rejects(a.apply(d),/STALE/);
 let live=true;const c=f.open('alice',()=>{if(!live)throw new Error('SESSION_CHANGED');});const q=await c.propose([{type:'set_primary_cta',value:'Comprar'}]);live=false;await assert.rejects(c.decide(q,'ACCEPT_WARNING','Cuenta anterior'),/SESSION_CHANGED/);
});

test('legacy apply cannot consume an acceptance as an evergreen bypass',async()=>{const {a,p}=await setup();const d=await a.decide(p,'ACCEPT_WARNING','Solo esta revisión');const {applyChange}=await import('./builderChangeTransaction.mjs');await assert.rejects(applyChange((await a.read()).workspace,p.proposal,d.decision),/HUMAN_DECISION_REQUIRED/);});
