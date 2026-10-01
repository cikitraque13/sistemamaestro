import {testDecision} from './semanticDecisionTestSupport.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { assessCtaCoherence } from './ctaSemanticCoherence.mjs';
import { selectDestination } from './ctaDestinationIntent.mjs';
import { newWorkspace, prepareChange, applyReviewedChange as applyChange, revertChange } from './builderChangeTransaction.mjs';
import { createChangeReview, validateChangeReview } from './builderChangeReview.mjs';
const base = {projectId:'s10',projectKind:'landing',primaryCTA:'Ver precios',visualAccent:'amber',blocks:[{id:'hero',type:'hero',props:{title:'Inicio'}},{id:'info',type:'trust',canonicalStatic:1,props:{title:'Precios',description:'Desde 20 euros',items:[]}}]};
const state = () => selectDestination(structuredClone(base),'info');
test('rendered promise and actual destination content provide advisory evidence without mutation',()=>{
 const s=state(), before=structuredClone(s); s.ctas[0].label='Comprar';
 const a=assessCtaCoherence(s); assert.equal(a.promise,'Ver precios'); assert.equal(a.status,'SUPPORTING_SIGNALS'); assert.equal(a.advisoryOnly,true); assert.deepEqual(s.blocks,before.blocks);
 s.blocks[1].props={title:'Equipo',description:'Personas'}; assert.equal(assessCtaCoherence(s).status,'POTENTIAL_MISMATCH');
});
test('unknown, missing, ambiguous and negated promises remain uncertain',()=>{
 for(const promise of ['Explorar','Ver precios y contacto','No ver precios']){const s=state();s.primaryCTA=promise;assert.equal(assessCtaCoherence(s).status,'UNCERTAIN');}
 assert.equal(assessCtaCoherence(base).reason,'EXPLICIT_DESTINATION_REQUIRED');
 const s=state();s.blocks[1].props.description='Sin precios disponibles';assert.equal(assessCtaCoherence(s).status,'UNCERTAIN');
});
test('hidden metadata cannot substantiate a promise and static navigation cannot execute an action',()=>{
 const s=state();s.blocks[1].props={title:'Equipo',subtitle:'Personas',description:'Precios 20 euros',items:[{title:'Equipo',description:'precios'}]};assert.equal(assessCtaCoherence(s).status,'POTENTIAL_MISMATCH');
 s.primaryCTA='Comprar';s.blocks[1].props.title='Comprar';assert.equal(assessCtaCoherence(s).reason,'ACTION_NOT_PROVIDED_BY_STATIC_ARTIFACT');
});
test('assessment is part of exact review: tampering, another candidate, owner or base rejected; advisory permits explicit apply and exact revert',async()=>{
 const ws=newWorkspace(state()); const p=await prepareChange(ws,[{type:'set_primary_cta',value:'Comprar'}]);const r=await createChangeReview(ws,'alice',p);
 assert.equal(r.validation,'PASS');assert.equal(r.semanticCoherence.status,'POTENTIAL_MISMATCH');
 const bad=structuredClone(r);bad.semanticCoherence.status='SUPPORTING_SIGNALS';await assert.rejects(validateChangeReview(ws,'alice',p,bad),/REVIEW_STALE/);
 await assert.rejects(validateChangeReview(ws,'bob',p,r),/REVIEW_STALE/);
 const other=await prepareChange(ws,[{type:'set_primary_cta',value:'Ver beneficios'}]);await assert.rejects(validateChangeReview(ws,'alice',other,r),/REVIEW_STALE/);
 await validateChangeReview(ws,'alice',p,r);const after=await applyChange(ws,p,await testDecision(ws,p)); await assert.rejects(validateChangeReview(after,'alice',p,r));assert.deepEqual((await revertChange(after,1)).committed,ws.committed);
});
