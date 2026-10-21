import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { vi } from 'vitest';
import { webcrypto } from 'crypto';
import ProjectPlan, { PlanProjection } from './ProjectPlan';
import { submitPlanOperation, recoverProjectPlan } from '../api/builderAiClient';
vi.mock('../api/builderAiClient', () => ({ submitPlanOperation: vi.fn(), recoverProjectPlan: vi.fn() }));
Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const body = { title: 'Synthetic plan', objective: 'A useful outcome', steps: [{ step_id: 'step-a', title: 'First', description: 'Review', acceptance_criterion: 'Approved' }, { step_id: 'step-b', title: 'Second', description: 'Publish later', acceptance_criterion: 'Reviewed' }] };
const projection = { schema: 'sm.j06.2.plan-display.v1', labels: { title: 'Título del plan', objective: 'Objetivo', steps: 'Pasos en orden', step_id: 'ID', step_title: 'Título', description: 'Descripción', acceptance_criterion: 'Criterio' }, field_order: ['title', 'objective', 'steps'], step_field_order: ['step_id', 'title', 'description', 'acceptance_criterion'], ...body };
const ready = { plan_id: 'plan', generation: 1, plan_revision: 2, state_revision: 2, status: 'READY_FOR_CONFIRMATION', content: body, confirmation_challenge: { digest: 'a'.repeat(64), display_projection: projection } };
const project = { project_id: 'p', user_id: 'owner', updated_at: 'r', active_j06_1_intent: { status: 'CONFIRMED' }, j06_2_plan: ready };
const mount = element => { const node = document.createElement('div'); const root = createRoot(node); act(() => root.render(element)); return { node, root }; };
const button = (node, text) => [...node.querySelectorAll('button')].find(n => n.textContent === text);
const response = plan => ({ user_id: 'owner', project_id: 'p', updated_at: 'r', plan });
afterEach(() => vi.resetAllMocks());

test('renders exact ordered projection and escapes markup', () => {
  const { node, root } = mount(<PlanProjection projection={{ ...projection, title: '<img src=x>' }} />);
  expect([...node.querySelectorAll('h3')].map(n => n.textContent)).toEqual(['Título del plan', 'Objetivo', 'Pasos en orden']);
  expect(node.textContent).toContain('<img src=x>'); expect(node.querySelector('img')).toBeNull();
  expect(node.textContent.indexOf('First')).toBeLessThan(node.textContent.indexOf('Second')); act(() => root.unmount());
});

test('confirmation sends exact digest, plan identity and revisions', async () => {
  submitPlanOperation.mockResolvedValue(response({ ...ready, status: 'CONFIRMED', confirmation_challenge: null }));
  const { node, root } = mount(<ProjectPlan project={project} ownerId="owner" />);
  await act(async () => button(node, 'Confirmo este plan exacto').click());
  const [op, revision] = submitPlanOperation.mock.calls[0];
  expect(op).toMatchObject({ operation_type: 'CONFIRM', digest: 'a'.repeat(64), plan_id: 'plan', generation: 1, plan_revision: 2, state_revision: 2 });
  expect(revision).toBe('r'); expect(node.textContent).toContain('Estado del plan: CONFIRMED'); act(() => root.unmount());
});

test('a local edit hides confirmation until save and review of a new projection', async () => {
  const changed = { ...body, title: 'Revised title' };
  submitPlanOperation.mockResolvedValueOnce(response({ ...ready, status: 'DRAFT', plan_revision: 3, state_revision: 3, content: changed, confirmation_challenge: null }))
    .mockResolvedValueOnce(response({ ...ready, plan_revision: 3, state_revision: 4, content: changed, confirmation_challenge: { digest: 'b'.repeat(64), display_projection: { ...projection, ...changed } } }));
  const { node, root } = mount(<ProjectPlan project={project} ownerId="owner" />);
  act(() => Simulate.change(node.querySelector('input'), { target: { value: 'Revised title' } }));
  expect(button(node, 'Confirmo este plan exacto')).toBeUndefined(); expect(button(node, 'Revisar plan guardado').disabled).toBe(true);
  await act(async () => button(node, 'Guardar plan').click());
  expect(submitPlanOperation.mock.calls[0][0].content.title).toBe('Revised title');
  await act(async () => button(node, 'Revisar plan guardado').click());
  expect(node.querySelector('[aria-label="Plan exacto a confirmar"]').textContent).toContain('Revised title');
  expect(button(node, 'Confirmo este plan exacto').disabled).toBe(false); act(() => root.unmount());
});

test('user can reorder steps and save the new order', async () => {
  submitPlanOperation.mockResolvedValue(response({ ...ready, status: 'DRAFT', content: { ...body, steps: [...body.steps].reverse() }, confirmation_challenge: null }));
  const { node, root } = mount(<ProjectPlan project={{ ...project, j06_2_plan: { ...ready, status: 'DRAFT', confirmation_challenge: null } }} ownerId="owner" />);
  act(() => button(node, 'Bajar paso 1').click()); await act(async () => button(node, 'Guardar plan').click());
  expect(submitPlanOperation.mock.calls[0][0].content.steps.map(step => step.step_id)).toEqual(['step-b', 'step-a']); act(() => root.unmount());
});

test('uncertain persistence locks editing and retries the exact request', async () => {
  submitPlanOperation.mockRejectedValue(new TypeError('offline'));
  const { node, root } = mount(<ProjectPlan project={project} ownerId="owner" />);
  await act(async () => button(node, 'Confirmo este plan exacto').click()); const original = submitPlanOperation.mock.calls[0];
  expect(node.querySelector('input').disabled).toBe(true);
  await act(async () => button(node, 'Reintentar la misma solicitud de plan').click());
  expect(submitPlanOperation.mock.calls[1]).toEqual(original); act(() => root.unmount());
});

test('identity keyed remount removes prior owner project plan', () => {
  const { node, root } = mount(<ProjectPlan key="owner:p" project={project} ownerId="owner" />);
  act(() => root.render(<ProjectPlan key="owner:q" project={{ project_id: 'q', user_id: 'owner', updated_at: 'new' }} ownerId="owner" />));
  expect(node.textContent).not.toContain('Synthetic plan'); expect(node.querySelector('input')).toBeNull(); act(() => root.unmount());
});

test('stale plan is readable but editing and confirmation are disabled', () => {
  const { node, root } = mount(<ProjectPlan project={{ ...project, j06_2_plan: { ...ready, status: 'STALE', confirmation_challenge: null } }} ownerId="owner" />);
  expect(node.querySelector('input').disabled).toBe(true); expect(button(node, 'Confirmo este plan exacto')).toBeUndefined();
  expect(button(node, 'Cancelar plan').disabled).toBe(false); expect(node.textContent).toContain('La intención fuente cambió'); act(() => root.unmount());
});

test('recovery uses owner-checked existing project GET and never submits a mutation', async () => {
  recoverProjectPlan.mockResolvedValue(response({ ...ready, status: 'DRAFT', confirmation_challenge: null }));
  const { node, root } = mount(<ProjectPlan project={project} ownerId="owner" />);
  await act(async () => button(node, 'Recuperar plan guardado').click());
  expect(recoverProjectPlan).toHaveBeenCalledWith('p', ''); expect(submitPlanOperation).not.toHaveBeenCalled();
  expect(node.textContent).toContain('Estado del plan: DRAFT'); act(() => root.unmount());
});
