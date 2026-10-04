import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoundWorkspace as createDurableLandingWorkspace,createLocalWorkspaceStore} from './authorizedRegressionFixture.mjs';
const base={projectId:'s13',projectKind:'landing',primaryCTA:'Inicio',visualAccent:'amber',blocks:[]};
function fixture(){const data=new Map();let queue=Promise.resolve();const store=createLocalWorkspaceStore({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},{request:(k,o,fn)=>{const p=queue.then(fn);queue=p.catch(()=>{});return p;}});return {open:()=>createDurableLandingWorkspace(store,'alice','s13')};}
async function setup(){const f=fixture(),a=f.open();await a.initialize(base);const p=await a.propose([{type:'set_primary_cta',value:'Ver precios'}]);return {f,a,p};}
test('valid candidate/review cannot directly apply; authorization is read-only and single-use',async()=>{const {a,p}=await setup();const before=await a.read();assert.throws(()=>a.apply(p),/AUTHORIZATION_REQUIRED/);const auth=await a.authorize(p);assert.deepEqual(await a.read(),before);const after=await a.apply(p,auth);assert.equal(after.workspace.history[0].authorization.validity,'CONSUMED');assert.throws(()=>a.apply(p,auth),/CONSUMED/);await a.revert(1);assert.deepEqual((await a.read()).workspace.committed,base);});
test('candidate artifact review rationale and token mutation cannot cross the boundary',async()=>{
 for(const mutate of [p=>p.proposal.candidateHash='bad',p=>p.proposal.artifactHash='bad',p=>p.review.reviewId='bad',p=>p.review.semanticCoherence.status='bad',p=>p.ownerId='bob',p=>p.decision={decisionId:'old',rationale:'invented'}]){const {a,p}=await setup();const auth=await a.authorize(p);const bad=structuredClone(p);mutate(bad);await assert.rejects(async()=>a.apply(bad,auth));assert.deepEqual((await a.read()).workspace.committed,base);}
 const {a,p}=await setup();const auth=await a.authorize(p);auth.candidateHash='bad';await assert.rejects(a.apply(p,auth),/INVALID_AUTHORIZATION/);
});
test('another authorization cycle, reload and explicit revocation invalidate prior capabilities',async()=>{const {f,a,p}=await setup();const old=await a.authorize(p);const next=await a.authorize(p);assert.throws(()=>a.apply(p,old),/CONSUMED/);assert.throws(()=>f.open().apply(p,next),/AUTHORIZATION/);a.revokeAuthorizations();assert.throws(()=>a.apply(p,next),/AUTHORIZATION/);});
test('tab B commits after A authorized: A fails stale without changing B result',async()=>{const {f,a,p}=await setup();const auth=await a.authorize(p),b=f.open();const q=await b.propose([{type:'set_primary_cta',value:'Otro'}]);const after=await b.apply(q,await b.authorize(q));await assert.rejects(a.apply(p,auth),/STALE/);assert.deepEqual(await a.read(),after);});
test('recovered work and reconstructed review do not restore authorization',async()=>{const {f,a,p}=await setup();const saved=await a.savePending(p);const old=await a.authorize(saved);const b=f.open();const recovered=await b.recoverPending();assert.throws(()=>b.apply(recovered,old),/AUTHORIZATION/);await assert.rejects(a.apply(saved,old),/STALE/);const auth=await b.authorize(recovered);await b.apply(recovered,auth);});

test('warning decision is required but never itself an authorization; reject revokes outstanding authorization',async()=>{
 const f=fixture(),a=f.open();await a.initialize({...base,blocks:[{id:'hero',type:'hero',props:{title:'Inicio'}},{id:'info',type:'trust',canonicalStatic:1,props:{title:'Equipo'}}]});
 const p=await a.propose([{type:'set_primary_destination',value:'info'}]);await assert.rejects(a.authorize(p),/HUMAN_DECISION_REQUIRED/);
 const accepted=await a.decide(p,'ACCEPT_WARNING','Destino temporal elegido.');assert.throws(()=>a.apply(accepted),/AUTHORIZATION/);const auth=await a.authorize(accepted);await a.decide(accepted,'REJECT_CHANGE','He reconsiderado');assert.throws(()=>a.apply(accepted,auth),/AUTHORIZATION/);assert.equal((await a.read()).workspace.revision,0);
});
test('repair PASS still requires authorization and new transformation revokes old capability',async()=>{
 const f=fixture(),a=f.open();await a.initialize({...base,ctas:[{intent:'primary',href:'#tail'}],blocks:[{id:'hero',type:'hero',props:{title:'Inicio'}},{id:'info',type:'trust',canonicalStatic:1,props:{title:'Info'}},{id:'tail',type:'trust',canonicalStatic:1,props:{title:'Final'}}]});
 const parent=await a.propose([{type:'remove_static_section',id:'tail'}]),repair=await a.repair(parent,'info');assert.equal(repair.review.validation,'PASS');assert.throws(()=>a.apply(repair),/AUTHORIZATION/);const accepted=await a.decide(repair,'ACCEPT_WARNING','Destino revisado');const auth=await a.authorize(accepted);await a.propose([{type:'set_accent',value:'orange'}]);assert.throws(()=>a.apply(accepted,auth),/AUTHORIZATION/);
});
