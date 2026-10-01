import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';
import useBuilderWorkspaceRuntime from './useBuilderWorkspaceRuntime';
import { createBuilderOutputMap } from '../../state/builderOutputMap';
import { buildSectorLandingModel } from '../../preview/builderSectorProfileResolver';
import { contentHash } from '../../state/builderChangeTransaction.mjs';
Object.defineProperty(globalThis,'crypto',{value:webcrypto});
globalThis.TextEncoder=TextEncoder;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const project={project_id:'synthetic-landing',input_type:'text',input_content:'Landing de consultoría profesional',route:'idea',status:'created'};
let runtime, root, node;
function Harness(){runtime=useBuilderWorkspaceRuntime({project, ownerId: 'test-owner'});return <div/>;}
beforeEach(async()=>{let tail=Promise.resolve(); Object.defineProperty(navigator,'locks',{configurable:true,value:{request:(_key,_options,fn)=>{const result=tail.then(fn);tail=result.catch(()=>{});return result;}}});localStorage.clear();global.fetch=jest.fn(()=>{throw new Error('NO_NETWORK');});node=document.createElement('div');root=createRoot(node);await act(async()=>{root.render(<Harness/>);}); for(let i=0;i<30 && runtime.landingTransaction.status!=='ready';i++) await act(async()=>{await new Promise(r=>setTimeout(r,5));});expect(runtime.landingTransaction.status).toBe('ready');});
afterEach(()=>{act(()=>root.unmount());jest.restoreAllMocks();});
test('full Builder submit path produces exact candidate projections and reversible active content without AI',async()=>{
  const before=JSON.parse(JSON.stringify(runtime.builderBuildState));
  await act(async()=>{await runtime.submitMessage('CTA principal a "Reservar consulta" y acento naranja');});
  const proposal=runtime.landingTransaction.pending;
  expect(proposal).not.toBe(null);
  expect(runtime.builderBuildState).toEqual(before);
  const output=createBuilderOutputMap(proposal.candidate);
  const model=buildSectorLandingModel({project,builderIntelligence:{builderKernelOutput:output}});
  expect(model.primaryCTA).toBe('Reservar consulta');expect(model.visualAccent).toBe('orange');
  await act(async()=>{await runtime.landingTransaction.apply();});
  expect(await contentHash(runtime.builderBuildState)).toBe(proposal.candidateHash);
  await act(async()=>{await runtime.landingTransaction.revert();});
  expect(runtime.builderBuildState).toEqual(before);
  expect(await contentHash(runtime.builderBuildState)).toBe(proposal.baseHash);
  expect(global.fetch).not.toHaveBeenCalled();
});
test('invalid local intent never invokes provider or mutates state',async()=>{
  const before=runtime.builderBuildState;
  await act(async()=>{await runtime.submitMessage('CTA principal a "Aceptar" y acento rojo');});
  expect(runtime.landingTransaction.error).toBeTruthy();expect(runtime.landingTransaction.pending).toBe(null);
  expect(runtime.builderBuildState).toBe(before);expect(global.fetch).not.toHaveBeenCalled();
});
