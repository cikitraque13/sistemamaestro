import test from 'node:test';
import assert from 'node:assert/strict';
import {createDurableLandingWorkspace,createLocalWorkspaceStore} from './authorizedRegressionFixture.mjs';
import {contentHash} from './builderChangeTransaction.mjs';
const base={projectId:'s12',projectKind:'landing',primaryCTA:'Consultar',visualAccent:'amber',blocks:[{id:'hero',type:'hero',props:{title:'Inicio'}},{id:'info',type:'trust',canonicalStatic:1,props:{title:'Info'}},{id:'tail',type:'trust',canonicalStatic:1,props:{title:'Final'}}]};
function fixture(){const data=new Map();let tail=Promise.resolve(),quota=false;const store=createLocalWorkspaceStore({getItem:k=>data.get(k)||null,setItem:(k,v)=>{if(quota)throw Error('QUOTA');data.set(k,v);}},{request:(k,o,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}});return {data,quota:v=>quota=v,open:(owner='alice',check)=>createDurableLandingWorkspace(store,owner,'s12',check)};}
async function setup(){const f=fixture(),a=f.open();await a.initialize(base);const p=await a.propose([{type:'set_primary_destination',value:'info'}]);return {f,a,p};}
test('save/reload/recover preserves exact candidate/artifact and clears authorization; apply/reload/revert',async()=>{
 const {f,a,p}=await setup();const accepted=await a.decide(p,'ACCEPT_WARNING','Destino intencional');await a.savePending(accepted);const b=f.open();assert.deepEqual((await b.read()).workspace.committed,base);
 const recovered=await b.recoverPending();assert.notEqual(recovered.review.reviewId,p.review.reviewId);assert.notEqual(recovered.proposal.operationId,p.proposal.operationId);assert.deepEqual(recovered.proposal.candidate,p.proposal.candidate);assert.deepEqual(recovered.proposal.artifact,p.proposal.artifact);assert.equal(recovered.decision,undefined);
 await assert.rejects(b.apply({...recovered,decision:accepted.decision}),/STALE_DECISION/);await assert.rejects(b.apply(recovered),/HUMAN_DECISION_REQUIRED/);
 await b.apply(await b.decide(recovered,'ACCEPT_WARNING','Revisado de nuevo'));const after=await f.open().read();assert.equal(after.pendingDraft,null);assert.equal(after.workspace.revision,1);await b.revert(1);assert.deepEqual((await b.read()).workspace.committed,base);
});
test('concurrent saves are conditional; recovery invalidates old envelopes; stale delete cannot erase newer work',async()=>{
 const {f,a,p}=await setup(),b=f.open();const q=await b.propose([{type:'set_primary_destination',value:'tail'}]);const results=await Promise.allSettled([a.savePending(p),b.savePending(q)]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
 const saved=results.find(x=>x.status==='fulfilled').value;await b.recoverPending();await assert.rejects(a.savePending(saved),/STALE_DRAFT/);await assert.rejects(a.discardPending(saved.draftVersion),/STALE_DRAFT/);assert.ok((await b.read()).pendingDraft);
});
test('corruption, rehashed candidate tampering, stale base and owner contamination fail closed',async()=>{
 for(const mutate of [r=>r.pendingDraft.ownerId='bob',r=>r.pendingDraft.proposal.candidate.primaryCTA='Injected',r=>r.pendingDraft.proposal.baseRevision++,r=>r.pendingDraft.review.semanticCoherence.status='Injected']){
 const {f,a,p}=await setup();await a.savePending(p);const record=JSON.parse(f.data.get(a.key));mutate(record);const {digest,...body}=record;record.digest=await contentHash(body);f.data.set(a.key,JSON.stringify(record));const before=f.data.get(a.key);await assert.rejects(f.open().recoverPending());assert.equal(f.data.get(a.key),before);
 }
 const {f,a,p}=await setup();await a.savePending(p);await assert.rejects(f.open('bob').recoverPending(),/NO_PENDING/);f.data.set(a.key,'{broken');await assert.rejects(f.open().recoverPending(),/CORRUPT/);
});
test('quota/session failure does not lose draft; explicit deletion and rejection prevent recovery',async()=>{
 const {f,a,p}=await setup();const saved=await a.savePending(p);const raw=f.data.get(a.key);f.quota(true);await assert.rejects(f.open().recoverPending(),/QUOTA/);assert.equal(f.data.get(a.key),raw);f.quota(false);
 let alive=true;const b=f.open('alice',()=>{if(!alive)throw Error('SESSION_CHANGED');});alive=false;await assert.rejects(b.recoverPending(),/SESSION_CHANGED/);
 await a.discardPending(saved.draftVersion);await assert.rejects(f.open().recoverPending(),/NO_PENDING/);
 const q=await a.propose([{type:'set_primary_destination',value:'info'}]);const savedQ=await a.savePending(q);await a.decide(savedQ,'REJECT_CHANGE','');await assert.rejects(f.open().recoverPending(),/NO_PENDING/);
});
test('composite repaired draft retains repair lineage and final bytes while regenerating review',async()=>{
 const {f,a}=await setup();const initial={...base,ctas:[{intent:'primary',href:'#tail'}]};const other=f.open('repair-owner');await other.initialize(initial);const parent=await other.propose([{type:'update_static_section',id:'info',sectionType:'trust',content:{title:'Actualizado',description:'Detalle',items:['Uno']}},{type:'remove_static_section',id:'tail'}]);const repaired=await other.repair(parent,'info');await other.savePending(repaired);const recovered=await f.open('repair-owner').recoverPending();assert.equal(recovered.proposal.repair.parentProposalId,parent.proposal.operationId);assert.deepEqual(recovered.proposal.artifact,repaired.proposal.artifact);assert.equal(recovered.review.validation,'PASS');
});

test('saving a newer draft prevents an older tab from applying and erasing it',async()=>{
 const {f,a,p}=await setup(),b=f.open();const older=await b.propose([{type:'set_accent',value:'orange'}]);await a.savePending(p);await assert.rejects(b.apply(older),/STALE_DRAFT/);assert.ok((await a.read()).pendingDraft);assert.deepEqual((await a.read()).workspace.committed,base);
});

test('saving/recovering never rerenders a legacy active artifact',async()=>{
 const f=fixture(),a=f.open();await a.initialize({...base,ctas:[{intent:'primary',href:'#info'}]});const p=await a.propose([{type:'set_accent',value:'orange'}]);const record=JSON.parse(f.data.get(a.key));const {renderLandingArtifact}=await import('../preview/landingArtifact.mjs');record.artifact=renderLandingArtifact(record.workspace.committed,true);const {digest,...body}=record;record.digest=await contentHash(body);f.data.set(a.key,JSON.stringify(record));await a.savePending(p);assert.deepEqual((await a.read()).artifact,record.artifact);await f.open().recoverPending();assert.deepEqual((await a.read()).artifact,record.artifact);
});
