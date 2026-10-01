import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';
import useLandingTransaction from './useLandingTransaction';
import { parseLandingChange } from '../../command/parseLandingChange.mjs';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
globalThis.TextEncoder = TextEncoder;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let api, active, replace, eventPromise;
const initial = { projectId:'fixture', projectKind:'landing', primaryCTA:'Antes', visualAccent:'amber' };
function Harness() {
  const [state, setState] = useState(initial); active = state; replace = setState;
  api = useLandingTransaction(state, setState);
  return <div><output>{api.pending?.candidate.primaryCTA || state.primaryCTA}</output><button onClick={() => { eventPromise = api.apply(); }}>Apply</button><button onClick={() => { eventPromise = api.revert(); }}>Revert</button><p role="alert">{api.error}</p></div>;
}
let root, node;
beforeEach(()=>{ localStorage.clear(); node=document.createElement('div'); document.body.appendChild(node); root=createRoot(node); act(()=>root.render(<Harness/>)); });
afterEach(()=>{ act(()=>root.unmount()); node.remove(); jest.restoreAllMocks(); });
test('actual hook separates candidate and active then applies and reverts through rendered controls', async()=>{
  global.fetch = jest.fn(()=>{ throw new Error('External calls forbidden'); });
  await act(async()=>{await api.propose(parseLandingChange('CTA principal a "Reservar" y acento naranja'));});
  expect(active).toEqual(initial); expect(node.querySelector('output').textContent).toBe('Reservar');
  await act(async()=>{ node.querySelectorAll("button")[0].click(); await eventPromise; });
  expect(active.primaryCTA).toBe('Reservar'); expect(api.pending).toBe(null);
  await act(async()=>{ node.querySelectorAll("button")[1].click(); await eventPromise; });
  expect(active).toEqual(initial); expect(api.revision).toBe(2); expect(global.fetch).not.toHaveBeenCalled();
});
test('storage failure does not commit and base change invalidates pending', async()=>{
  await act(async()=>{await api.propose(parseLandingChange('acento naranja'));});
  jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('QUOTA');});
  await act(async()=>{await api.apply();});
  expect(active).toEqual(initial); expect(api.error).toBe('QUOTA');
  act(()=>replace({...initial,primaryCTA:'New base'}));
  expect(api.pending).toBe(null);
});
test('storage event invalidates preview and another tab cannot be overwritten',async()=>{
  await act(async()=>{await api.propose(parseLandingChange('acento naranja'));});
  act(()=>window.dispatchEvent(new StorageEvent('storage',{key:'sistemamaestro:landingTransaction:v1:fixture'})));
  expect(api.pending).toBe(null);expect(api.canRevert).toBe(false);
  expect(api.error).toMatch(/otra pestaña/);
});
test('reload recovers committed revision and allows exact revert',async()=>{
  await act(async()=>{await api.propose(parseLandingChange('acento naranja'));});
  await act(async()=>{await api.apply();});
  const persisted=JSON.parse(localStorage.getItem('sistemamaestro:landingTransaction:v1:fixture'));
  expect(persisted.committed).toEqual(active);expect(persisted.revision).toBe(1);
  act(()=>replace(JSON.parse(JSON.stringify(persisted.committed))));
  expect(api.canRevert).toBe(true);
  await act(async()=>{await api.revert();});
  expect(active).toEqual(initial);
});
