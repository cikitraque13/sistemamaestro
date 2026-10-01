import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';
import BuilderChangeReview from './BuilderChangeReview';
import { DestinationChoice } from './CTADestinationSelector';
import { createChangeReview } from '../state/builderChangeReview.mjs';
import { newWorkspace, prepareChange } from '../state/builderChangeTransaction.mjs';
Object.defineProperty(globalThis, 'crypto', { value: webcrypto }); globalThis.TextEncoder = TextEncoder;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
test('repair destination renders plain text options without invalid nesting', () => {
  const errors = [];
  const originalError = console.error;
  const spy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (String(args[0]).includes('validateDOMNesting')) errors.push(args);
    else originalError(...args);
  });
  const node = document.createElement('div'); const root = createRoot(node);
  act(() => root.render(<DestinationChoice targets={[{ sectionId: 'info', label: 'Información', targetFragment: '#info' }]} onSelect={() => {}} />));
  expect([...node.querySelectorAll('option')].map(option => option.label)).toEqual(['Elige una sección', 'Información (#info)']);
  expect(node.querySelectorAll('option span')).toHaveLength(0);
  expect(errors).toHaveLength(0);
  act(() => root.unmount()); spy.mockRestore();
});
test('visible before/after is exact text; hostile content cannot create markup', async () => {
  const state = { projectId: 'review-ui', projectKind: 'landing', primaryCTA: 'Anterior', visualAccent: 'amber', blocks: [] };
  const ws = newWorkspace(state); const malicious = '<img src=x onerror=alert(1)>';
  const proposal = await prepareChange(ws, [{ type: 'set_primary_cta', value: malicious }]);
  const review = await createChangeReview(ws, 'alice', proposal);
  const node = document.createElement('div'); const root = createRoot(node);
  act(() => root.render(<BuilderChangeReview review={review} />));
  expect(node.textContent).toContain('Anterior'); expect(node.textContent).toContain(malicious);
  expect(node.querySelector('img,script,iframe')).toBeNull();
  expect(node.textContent).toContain(proposal.candidateHash); expect(node.textContent).toContain(proposal.artifactHash);
  act(() => root.render(<BuilderChangeReview review={null} />)); expect(node.textContent).toBe('');
  act(() => root.unmount());
});

test('semantic assessment is visible, escaped and distinct from functional validity', async () => {
 const state={projectId:'semantic-ui',projectKind:'landing',primaryCTA:'Ver precios',visualAccent:'amber',destinationIntent:{sectionId:'info'},blocks:[{id:'hero',type:'hero',props:{title:'Inicio'}},{id:'info',type:'trust',props:{title:'Equipo'}}]};
 // Use the real destination contract, not a hand-built review.
 const {selectDestination}=await import('../state/ctaDestinationIntent.mjs');
 const ws=newWorkspace(selectDestination(state,'info'));
 const proposal=await prepareChange(ws,[{type:'set_primary_cta',value:'Comprar'}]);
 const review=await createChangeReview(ws,'alice',proposal);
 const node=document.createElement('div'),root=createRoot(node);
 act(()=>root.render(<BuilderChangeReview review={review}/>));
 expect(node.textContent).toContain('Posible incoherencia');expect(node.textContent).toContain('Promesa: Comprar');expect(node.textContent).toContain('Contenido de llegada: Equipo');expect(node.textContent).toContain('no ejecuta compras');expect(node.textContent).toContain('no aplica cambios');
 act(()=>root.unmount());
});
