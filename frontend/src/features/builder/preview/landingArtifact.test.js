import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';
import { vi } from 'vitest';
import { renderLandingArtifact, validateLandingArtifact } from './landingArtifact.mjs';
import { newWorkspace, prepareChange, applyChange, revertChange } from '../state/builderChangeTransaction.mjs';
import LandingArtifactPreview from '../panels/LandingArtifactPreview';
Object.defineProperty(globalThis,'crypto',{value:webcrypto});
globalThis.TextEncoder=TextEncoder;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const state = {projectId:'fixture-html',projectKind:'landing',primaryCTA:'Ver servicios',visualAccent:'amber',blocks:[{id:'hero',type:'hero',props:{title:'Consultoría',subtitle:'Trabajemos juntos'}},{id:'services',type:'section',props:{title:'Servicios',items:['Diagnóstico','Entrega']}}]};
const dom = (html) => new DOMParser().parseFromString(html,'text/html');
test('valid DOM, preserved text, local CTA target and fixed palette',()=>{
  const artifact=renderLandingArtifact(state);const doc=dom(artifact.html);
  expect(doc.querySelector('h1').textContent).toBe('Consultoría');
  expect(doc.querySelectorAll('li')).toHaveLength(2);
  const cta=doc.querySelector('[data-primary-cta]');
  expect(cta.textContent).toBe('Ver servicios');expect(doc.querySelector(cta.getAttribute('href'))).not.toBe(null);
  expect(doc.querySelector('style').textContent).toContain('--accent:#fbbf24');
  expect(doc.querySelectorAll('script,iframe,img,form,link')).toHaveLength(0);
  expect(renderLandingArtifact(state)).toEqual(artifact);
});
test('hostile text remains text; no external requests, scripts or event handlers become elements',()=>{
  const hostile='<img src="https://evil.invalid/x" onerror="alert(1)"><script>bad()</script>';
  const artifact=renderLandingArtifact({...state,primaryCTA:hostile,blocks:[{type:'hero',props:{title:hostile}}]});
  const doc=dom(artifact.html);
  expect(doc.querySelector('h1').textContent).toBe(hostile);
  expect(doc.querySelector('[data-primary-cta]').textContent).toBe(hostile);
  expect(doc.querySelectorAll('script,img,[onerror]')).toHaveLength(0);
  expect(()=>validateLandingArtifact(state,{...artifact,html:artifact.html+'<script>x</script>'})).toThrow('ARTIFACT_MISMATCH');
});
test('apply rejects tampered artifact and valid revert restores original artifact byte-for-byte',async()=>{
  const ws=newWorkspace(state);
  const proposal=await prepareChange(ws,[{type:'set_primary_cta',value:'Reservar'},{type:'set_accent',value:'orange'}]);
  await expect(applyChange(ws,{...proposal,artifact:{...proposal.artifact,html:proposal.artifact.html+'changed'}})).rejects.toThrow('ARTIFACT_MISMATCH');
  await expect(applyChange(ws,{...proposal,artifactHash:'wrong'})).rejects.toThrow('ARTIFACT_HASH_MISMATCH');
  const after=await applyChange(ws,proposal);
  expect(renderLandingArtifact(after.committed)).toEqual(proposal.artifact);
  const reverted=await revertChange(after,after.revision);
  expect(renderLandingArtifact(reverted.committed).html).toBe(renderLandingArtifact(state).html);
});
test('real preview iframe and download use identical validated bytes; invalid input exposes neither',()=>{
  vi.useFakeTimers();
  const artifact=renderLandingArtifact(state);const node=document.createElement('div');document.body.appendChild(node);const root=createRoot(node);
  let downloaded;
  const originalBlob=global.Blob;
  global.Blob=class {constructor(parts){downloaded=parts[0];}};
  URL.createObjectURL=vi.fn(()=> 'blob:fixture');URL.revokeObjectURL=vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
  try {
    act(()=>root.render(<LandingArtifactPreview state={state} artifact={artifact}/>));
    expect(node.querySelector('iframe').getAttribute('sandbox')).toBe('allow-same-origin');
    expect(node.querySelector('iframe').getAttribute('src')).toBe('blob:fixture');
    expect(downloaded).toBe(artifact.html);
    act(()=>node.querySelector('button').click());
    expect(downloaded).toBe(artifact.html);
    act(()=>root.render(<LandingArtifactPreview state={state} artifact={{...artifact,html:'invalid'}}/>));
    expect(node.querySelector('iframe')).toBe(null);expect(node.querySelector('button')).toBe(null);
    expect(node.querySelector('[role=alert]')).not.toBe(null);
    vi.runAllTimers();expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture');
  } finally {act(()=>root.unmount());node.remove();global.Blob=originalBlob;vi.restoreAllMocks();vi.useRealTimers();}
});
