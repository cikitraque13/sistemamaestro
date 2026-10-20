import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';
import { webcrypto } from 'crypto';
import IntentClarification, { IntentProjection } from './IntentClarification';
import { submitIntentOperation } from '../api/builderAiClient';
vi.mock('../api/builderAiClient', () => ({ submitIntentOperation: vi.fn() }));
Object.defineProperty(globalThis,'crypto',{value:webcrypto});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const labels={title:'Título',goal:'Objetivo',scope:'Alcance',assumptions:'Supuestos',success_criteria:'Criterios de éxito',clarifications:'Aclaraciones',sources:'Fuentes',question_id:'ID de pregunta',question:'Pregunta',answer:'Respuesta',source_label:'Fuente',field_path:'Campo',revision:'Revisión'};
const projection={schema:'sm.j06.1.intent-display.v1',labels,title:'<img src=x>',goal:'Árbol 🪴',scope:['Primero','Segundo'],assumptions:[],success_criteria:[],clarifications:[{question_id:'q',question:'¿Quién?',answer:'Equipo'}],sources:[{label:'user_supplied',field_path:'project.route',revision:'r'}]};
const project={project_id:'p',user_id:'owner',updated_at:'r',active_j06_1_intent:{intent_id:'i',draft_revision:'1',state_revision:'1',text:'Page',status:'READY_FOR_CONFIRMATION',questions:[],answers:{},confirmation_challenge:{digest:'a'.repeat(64),display_projection:projection}}};
const mount=(element)=>{const node=document.createElement('div');const root=createRoot(node);act(()=>root.render(element));return {node,root};};
afterEach(()=>vi.clearAllMocks());
test('exact text, headings and ordered values; markup never executes',()=>{
 const {node,root}=mount(<IntentProjection projection={projection}/>);
 expect([...node.querySelectorAll('h3')].map(n=>n.textContent)).toEqual(['Título','Objetivo','Alcance','Supuestos','Criterios de éxito','Aclaraciones','Fuentes']);
 expect(node.textContent).toContain('<img src=x>');expect(node.textContent).toContain('Árbol 🪴');expect(node.querySelector('img')).toBeNull();
 expect(node.textContent.indexOf('Primero')).toBeLessThan(node.textContent.indexOf('Segundo'));act(()=>root.unmount());
});
test('confirm transmits exact digest/revisions and does not build',async()=>{
 submitIntentOperation.mockResolvedValue({user_id:'owner',project_id:'p',updated_at:'r2',intent:{...project.active_j06_1_intent,status:'CONFIRMED'}});
 const {node,root}=mount(<IntentClarification project={project} ownerId="owner"/>);
 await act(async()=>[...node.querySelectorAll('button')].find(n=>n.textContent==='Confirmo esta intención exacta').click());
 expect(submitIntentOperation).toHaveBeenCalledTimes(1);const [body,revision]=submitIntentOperation.mock.calls[0];
 expect(body.operation_type).toBe('CONFIRM');expect(body.digest).toBe('a'.repeat(64));expect(body.intent_id).toBe('i');expect(revision).toBe('r');
 expect(node.textContent).toContain('No se ha iniciado ninguna construcción');act(()=>root.unmount());
});
test('uncertain persistence allows only exact retry',async()=>{
 submitIntentOperation.mockRejectedValue(Object.assign(new Error(),{code:'PERSISTENCE_UNAVAILABLE'}));
 const {node,root}=mount(<IntentClarification project={project} ownerId="owner"/>);
 await act(async()=>[...node.querySelectorAll('button')].find(n=>n.textContent==='Confirmo esta intención exacta').click());
 const first=submitIntentOperation.mock.calls[0];
 expect([...node.querySelectorAll('button')].find(n=>n.textContent==='Cancelar').disabled).toBe(true);
 await act(async()=>[...node.querySelectorAll('button')].find(n=>n.textContent==='Reintentar la misma solicitud').click());
 expect(submitIntentOperation.mock.calls[1]).toEqual(first);act(()=>root.unmount());
});
test('project identity keyed remount clears previous proposal',()=>{
 const {node,root}=mount(<IntentClarification key="owner:p" project={project} ownerId="owner"/>);
 act(()=>root.render(<IntentClarification key="owner:other" project={{project_id:'other',updated_at:'new'}} ownerId="owner"/>));
 expect(node.textContent).not.toContain('Árbol');expect(node.querySelector('textarea').value).toBe('');act(()=>root.unmount());
});

test.each([new TypeError('network failure'), new SyntaxError('JSON parse failure')])('raw transport failure retains same operation and revision',async(failure)=>{
 submitIntentOperation.mockRejectedValue(failure);
 const {node,root}=mount(<IntentClarification project={project} ownerId="owner"/>);
 await act(async()=>[...node.querySelectorAll('button')].find(n=>n.textContent==='Confirmo esta intención exacta').click());
 const first=submitIntentOperation.mock.calls[0];
 expect(node.querySelector('[role="alert"]').textContent).toBe('PERSISTENCE_UNAVAILABLE');
 expect([...node.querySelectorAll('button')].find(n=>n.textContent==='Cancelar').disabled).toBe(true);
 await act(async()=>[...node.querySelectorAll('button')].find(n=>n.textContent==='Reintentar la misma solicitud').click());
 expect(submitIntentOperation.mock.calls[1]).toEqual(first);
 expect(submitIntentOperation.mock.calls[1][0].operation_id).toBe(first[0].operation_id);
 act(()=>root.unmount());
});
