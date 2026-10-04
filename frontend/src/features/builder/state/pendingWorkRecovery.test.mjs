import test from 'node:test';
import assert from 'node:assert/strict';
import {createDurableLandingWorkspace,createLocalWorkspaceStore} from './authorizedRegressionFixture.mjs';
import {contentHash, newWorkspace, prepareChange, applyChange} from './builderChangeTransaction.mjs';
import {renderLandingArtifact} from '../preview/landingArtifact.mjs';
import {createDurableLandingWorkspace as createBoundRepository} from './durableLandingWorkspace.mjs';
import {requestedProject, validatedProjectIdentity, requireOutputIdentity} from './projectIdentity.mjs';
const base={projectId:'s12',projectKind:'landing',primaryCTA:'Consultar',visualAccent:'amber',blocks:[{id:'hero',type:'hero',props:{title:'Inicio'}},{id:'info',type:'trust',canonicalStatic:1,props:{title:'Info'}},{id:'tail',type:'trust',canonicalStatic:1,props:{title:'Final'}}]};

function boundFixture() {
 const data=new Map(); let current='2026-10-03T08:00:00+00:00';
 const store=createLocalWorkspaceStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}, {request:(_k,_o,fn)=>fn()});
 return {data,setCurrent:v=>{current=v;},open:(revision='2026-10-03T08:00:00+00:00')=>createBoundRepository(store,'alice','s12',()=>{}, {serverRevision:revision,verify:async()=>current})};
}
test('S15 matching server token persists separately, recovers pending and retains local revision',async()=>{
 const f=boundFixture(),a=f.open(); await a.initialize(base);
 const p=await a.propose([{type:'set_accent',value:'orange'}]);await a.savePending(p);
 const raw=JSON.parse(f.data.get(a.key)); assert.equal(raw.serverRevision,'2026-10-03T08:00:00+00:00');assert.equal(raw.workspace.revision,0);
 const b=f.open(),recovered=await b.recoverPending(); const applied=await b.apply(recovered,await b.authorize(recovered));
 assert.equal(applied.workspace.revision,1);assert.equal(applied.serverRevision,raw.serverRevision);
 assert.deepEqual((await b.revert(1)).workspace.committed,base);
});
test('S15 changed or unverifiable server token rejects recovery/apply preserving every byte',async()=>{
 for(const revision of ['2026-10-03T09:00:00+00:00',null,undefined]) {
 const f=boundFixture(),a=f.open();await a.initialize(base);const p=await a.propose([{type:'set_accent',value:'orange'}]);const saved=await a.savePending(p);const auth=await a.authorize(saved);const before=f.data.get(a.key);
 f.setCurrent(revision);await assert.rejects(a.recoverPending(),/SERVER_REVISION/);await assert.rejects(a.apply(saved,auth),/SERVER_REVISION/);assert.equal(f.data.get(a.key),before);
 }
});
test('S15 missing/mismatched persisted binding preserves legacy without rebasing',async()=>{
 for(const revision of [undefined,'2026-10-03T07:00:00+00:00']) {
 const f=boundFixture(),a=f.open();await a.initialize(base);const p=await a.propose([{type:'set_accent',value:'orange'}]);await a.savePending(p);
 const raw=JSON.parse(f.data.get(a.key));if(revision===undefined)delete raw.serverRevision;else raw.serverRevision=revision;
 const {digest,...body}=raw;raw.digest=await contentHash(body);f.data.set(a.key,JSON.stringify(raw));const before=f.data.get(a.key);
 await assert.rejects(f.open().initialize(base),/SERVER_REVISION/);await assert.rejects(f.open().recoverPending(),/SERVER_REVISION/);await assert.rejects(a.authorize(p),/SERVER_REVISION/);assert.equal(f.data.get(a.key),before);
 }
});
test('S15 rechecks server token before committing replacement',async()=>{
 const data=new Map();let calls=0;const store=createLocalWorkspaceStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},{request:(_k,_o,fn)=>fn()});
 const a=createBoundRepository(store,'alice','s12',()=>{}, {serverRevision:'0',verify:async()=> ++calls===1?'0':null});
 await assert.rejects(a.initialize(base),/SERVER_REVISION/);assert.equal(data.size,0);
});
test('S15 URL/state selection conflicts and server owner/revision mismatch fail closed',()=>{
 assert.equal(requestedProject('?project_id=A',null),'A');assert.equal(requestedProject('',null),'');
 assert.throws(()=>requestedProject('?project_id=A',{projectId:'B'}));assert.throws(()=>requestedProject('?project_id=A&project_id=B',null));
 assert.throws(()=>validatedProjectIdentity({project_id:'A',user_id:'bob'},'alice','A'));
 assert.throws(()=>validatedProjectIdentity({project_id:'A',user_id:'alice',updated_at:null},'alice','A'));
 assert.deepEqual(validatedProjectIdentity({project_id:'A',user_id:'alice'},'alice','A'),{ownerId:'alice',projectId:'A',serverRevision:'0'});
});
test('S15 projectless and foreign output cannot be adopted by project-bound runtime',()=>{
 const identity={ownerId:'alice',projectId:'A',serverRevision:'0'};
 for(const binding of [{...identity,scope:'projectless'},{...identity,scope:'project',projectId:'B'},{...identity,scope:'project',serverRevision:'other'}])assert.throws(()=>requireOutputIdentity({trace:{meta:{identity:binding}}},identity));
 assert.ok(requireOutputIdentity({trace:{meta:{identity:{...identity,scope:'project'}}}},identity));
});
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

test('S14 compaction preserves pending candidate, decisions, provenance, recovery and exact revert', async (t) => {
 const f=fixture(), a=f.open();
 let workspace=newWorkspace(base);
 for(let i=0;i<70;i++) {
  const proposal=await prepareChange(workspace,[{type:'set_accent',value:i%2?'amber':'orange'}],`old-${i}`,'alice');
  workspace=await applyChange(workspace,proposal);
 }
 const body={version:1,serverRevision:'0',ownerId:'alice',projectId:'s12',workspace,artifact:renderLandingArtifact(workspace.committed),decisions:[],decisionEpoch:0,pendingDraft:null,draftVersion:0};
 f.data.set(a.key,JSON.stringify({...body,digest:await contentHash(body)}));
 const proposed=await a.propose([{type:'set_primary_destination',value:'info'}]);
 const accepted=await a.decide(proposed,'ACCEPT_WARNING','Destino revisado');
 await a.savePending(accepted);
 const saved=await a.read();
 assert.equal(saved.workspace.history.length,64);
 assert.equal(saved.workspace.historyBaseRevision,6);
 assert.deepEqual(saved.decisions,[accepted.decision]);
 assert.deepEqual(saved.pendingDraft.proposal,proposed.proposal);
 assert.deepEqual(saved.pendingDraft.review,proposed.review);
 assert.deepEqual(saved.workspace.compactedProvenance.map(e=>e.operationId),Array.from({length:6},(_,i)=>`old-${i}`));
 const original=f.data.get(a.key);
 f.quota(true); await assert.rejects(f.open().recoverPending(),/QUOTA/); assert.equal(f.data.get(a.key),original); f.quota(false);
 const b=f.open(), recovered=await b.recoverPending();
 assert.deepEqual(recovered.proposal.candidate,proposed.proposal.candidate);
 assert.deepEqual(recovered.proposal.artifact,proposed.proposal.artifact);
 assert.equal(recovered.decision,undefined);
 assert.deepEqual((await b.read()).decisions,saved.decisions);
 await assert.rejects(a.apply(accepted),/STALE_DECISION|STALE_DRAFT/);
 const decision=await b.decide(recovered,'ACCEPT_WARNING','Revalidado tras recuperación');
 await b.apply(decision);
 const restored=await b.revert(71);
 assert.deepEqual(restored.workspace.committed,saved.workspace.committed);
 assert.deepEqual(restored.artifact,saved.artifact);
 assert.deepEqual(restored.decisions,[accepted.decision,decision.decision]);
 // Prune the applied event by age; its decision and consumed authorization stay auditable.
 t.mock.method(Date,'now',()=>Date.parse('2199-01-01T00:00:00Z'));
 const next=await b.propose([{type:'set_accent',value:'orange'}]); await b.savePending(next);
 const final=await b.read();
 assert.ok(final.workspace.consumedOperationIds.includes(recovered.proposal.operationId));
 const applied=[...final.workspace.history,...final.workspace.compactedProvenance].find(e=>e.operationId===recovered.proposal.operationId);
 assert.equal(applied.authorization.validity,'CONSUMED');
 assert.equal(applied.humanDecision.decisionId,decision.decision.decisionId);
});

test('S14 failed hard-cap pending write does not erase an existing draft or human decisions', async () => {
 const f=fixture(),a=f.open();
 await a.initialize({...base,fixturePayload:'x'.repeat(110000)});
 const p=await a.propose([{type:'set_primary_destination',value:'info'}]);
 const accepted=await a.decide(p,'ACCEPT_WARNING','Conservar el trabajo previo');
 // A valid oversized legacy draft remains readable, never silently deleted to fit.
 const raw=JSON.parse(f.data.get(a.key));
 raw.pendingDraft={version:1,ownerId:'alice',projectId:'s12',proposal:accepted.proposal,review:accepted.review};
 const {digest,...body}=raw; raw.digest=await contentHash(body); f.data.set(a.key,JSON.stringify(raw));
 const previous=f.data.get(a.key);
 await assert.rejects(a.savePending(accepted),/DURABLE_CAPACITY_EXCEEDED/);
 assert.equal(f.data.get(a.key),previous);
});

test('S14 compacted IDs cannot be resurrected through a forged pending envelope', async () => {
 const {f,a,p}=await setup();
 const accepted=await a.decide(p,'ACCEPT_WARNING','Destino aceptado');await a.apply(accepted);
 const candidate=await a.propose([{type:'set_accent',value:'orange'}]);
 candidate.proposal.operationId=p.proposal.operationId;
 const previous=f.data.get(a.key);
 await assert.rejects(a.savePending(candidate),/DUPLICATE_APPLY/);
 assert.equal(f.data.get(a.key),previous);
 const wrong=await a.propose([{type:'set_accent',value:'orange'}]);wrong.proposal.ownerId='bob';
 await assert.rejects(a.savePending(wrong),/OWNER_OR_PROJECT_MISMATCH/);
 assert.equal(f.data.get(a.key),previous);
});

// S14 -> S15 compatibility: only exact, authenticated, pending-free records.
async function legacyFixture(change = () => {}) {
 const data = new Map(); let tail = Promise.resolve(), writes = 0, current = '0', generation = 0, quota = false;
 const storage = {getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(quota)throw Error('QUOTA'); writes++;data.set(k,v);}};
 const store = createLocalWorkspaceStore(storage,{request:(_k,_o,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}});
 const key='sistemamaestro:durable:v1:'+JSON.stringify(['alice','s12']);
 const body={version:1,ownerId:'alice',projectId:'s12',workspace:newWorkspace(base),artifact:renderLandingArtifact(base),decisions:[],decisionEpoch:0,pendingDraft:null,draftVersion:0};
 change(body); data.set(key,JSON.stringify({...body,digest:await contentHash(body)}));
 return {data,key,original:data.get(key),writes:()=>writes,setCurrent:v=>current=v,switch:()=>generation++,quota:()=>quota=true,
 open:(options={})=>{const epoch=generation; return createBoundRepository(store,'alice','s12',()=>{if(epoch!==generation)throw Error('SESSION_CHANGED');},{ownerId:'alice',projectId:'s12',serverRevision:'0',verify:async()=>current,...options});}};
}
test('legacy exact binding preserves complete payload/artifact/local revision; repeated and concurrent initialization is idempotent',async()=>{
 const f=await legacyFixture(); const before=JSON.parse(f.original);
 const results=await Promise.all([f.open().initialize(base),f.open().initialize(base)]);
 assert.equal(f.writes(),1); assert.deepEqual(results[0],results[1]);
 const after=JSON.parse(f.data.get(f.key));const {digest,serverRevision,...payload}=after;
 const {digest:oldDigest,...originalPayload}=before;
 assert.deepEqual(payload,originalPayload);assert.equal(serverRevision,'0');assert.equal(digest,await contentHash({...payload,serverRevision}));
 await f.open().initialize(base);assert.equal(f.writes(),1);
 const p=await f.open().propose([{type:'set_accent',value:'orange'}]);
 assert.deepEqual(JSON.parse(f.data.get(f.key)).workspace.committed,base);assert.ok(p.review);
});
test('legacy complete equality rejects hidden content changes and unknown envelope/workspace/artifact fields without writes',async(t)=>{
 for(const [name,change] of [
 ['content',b=>b.workspace.committed.primaryCTA='Different'],
 ['hidden state',b=>b.workspace.committed.hiddenField=true],
 ['envelope',b=>b.extra=true],['workspace',b=>b.workspace.extra=true],['artifact',b=>b.artifact.extra=true],
 ['pending',b=>b.pendingDraft={}],['missing pending',b=>delete b.pendingDraft],
 ['null token',b=>b.serverRevision=null],['stale token',b=>b.serverRevision='2026-10-01T00:00:00Z'],
 ['owner',b=>b.ownerId='bob'],['project',b=>b.projectId='other'],
 ]) await t.test(name,async()=>{const f=await legacyFixture(change);await assert.rejects(f.open().initialize(base));assert.equal(f.data.get(f.key),f.original);assert.equal(f.writes(),0);});
});
test('legacy requires verified owner/project and authenticated current revision',async(t)=>{
 for(const options of [{ownerId:'bob'},{projectId:'B'},{ownerId:undefined},{verify:async()=>null},{verify:async()=>{throw Error('UNAUTHORIZED');}}])await t.test(JSON.stringify(options),async()=>{
 const f=await legacyFixture();await assert.rejects(f.open(options).initialize(base));assert.equal(f.data.get(f.key),f.original);});
});
test('legacy original digest and CAS are checked; stale GET, competing write and quota preserve bytes',async(t)=>{
 await t.test('digest',async()=>{const f=await legacyFixture();f.data.set(f.key,f.original.replace('Consultar','Tampered'));const before=f.data.get(f.key);await assert.rejects(f.open().initialize(base),/CORRUPT/);assert.equal(f.data.get(f.key),before);});
 await t.test('stale GET',async()=>{const f=await legacyFixture();let calls=0;await assert.rejects(f.open({verify:async()=>++calls===1?'0':'2026-10-04T00:00:00Z'}).initialize(base),/SERVER_REVISION/);assert.equal(f.data.get(f.key),f.original);});
 await t.test('CAS',async()=>{const f=await legacyFixture();let calls=0;const competing=f.original+' ';await assert.rejects(f.open({verify:async()=>{if(++calls===2)f.data.set(f.key,competing);return '0';}}).initialize(base),/STORAGE_CONFLICT/);assert.equal(f.data.get(f.key),competing);assert.equal(f.writes(),0);});
 await t.test('quota',async()=>{const f=await legacyFixture();f.quota();await assert.rejects(f.open().initialize(base),/QUOTA/);assert.equal(f.data.get(f.key),f.original);});
});
test('legacy A B A session generation cannot complete an old migration',async()=>{
 const f=await legacyFixture();let enter,release;const started=new Promise(r=>enter=r),held=new Promise(r=>release=r);
 const old=f.open({verify:async()=>{enter();await held;return '0';}});const pending=old.initialize(base);await started;
 f.switch();f.switch();release();await assert.rejects(pending,/SESSION_CHANGED/);assert.equal(f.data.get(f.key),f.original);
 await f.open().initialize(base);assert.equal(f.writes(),1);
});
test('legacy read/recover/apply do not migrate or auto-apply',async()=>{
 const f=await legacyFixture(),a=f.open();await assert.rejects(a.read(),/SERVER_REVISION/);await assert.rejects(a.recoverPending(),/SERVER_REVISION/);
 assert.throws(()=>a.apply({},{}),/AUTHORIZATION/);assert.equal(f.data.get(f.key),f.original);
});

test('legacy history, consumed IDs, decisions and exact artifact survive binding after an exact revert',async()=>{
 const f=await legacyFixture(),a=f.open();await a.initialize(base);
 const proposal=await a.propose([{type:'set_primary_destination',value:'info'}]);
 const accepted=await a.decide(proposal,'ACCEPT_WARNING','Destino elegido deliberadamente');
 await a.apply(accepted,await a.authorize(accepted));await a.revert(1);
 const record=JSON.parse(f.data.get(f.key));delete record.serverRevision;const {digest,...body}=record;
 record.digest=await contentHash(body);f.data.set(f.key,JSON.stringify(record));
 const migrated=await f.open().initialize(base);const after=JSON.parse(f.data.get(f.key));
 assert.equal(migrated.workspace.revision,2);assert.deepEqual(after.workspace,record.workspace);
 assert.deepEqual(after.decisions,record.decisions);assert.deepEqual(after.artifact,record.artifact);
 const state=await f.open().read();assert.deepEqual(state.workspace.committed,base);
 // Unknown nested authorization data must never inherit server authority.
 delete after.serverRevision;after.workspace.history[0].authorization.unknown=true;
 const {digest:ignored,...changed}=after;after.digest=await contentHash(changed);const bytes=JSON.stringify(after);f.data.set(f.key,bytes);
 await assert.rejects(f.open().initialize(base),/LEGACY_SCHEMA_UNKNOWN/);assert.equal(f.data.get(f.key),bytes);
});
test('legacy canonical equality ignores object key order only and leaves excluded namespaces untouched',async()=>{
 const f=await legacyFixture();const unrelated=['builderBuildState:v1','landingTransaction:v1','sistema_maestro.active_builder_project_id'];
 for(const key of unrelated)f.data.set(key,'untouched');
 const reordered=Object.fromEntries(Object.entries(base).reverse());await f.open().initialize(reordered);
 for(const key of unrelated)assert.equal(f.data.get(key),'untouched');
 const g=await legacyFixture();await assert.rejects(g.open().initialize({...base,updatedAt:'new'}),/LEGACY_CONTENT_MISMATCH/);assert.equal(g.data.get(g.key),g.original);
});
