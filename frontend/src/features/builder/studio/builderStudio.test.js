import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Ana', credit_balance: 4 }, logout: async () => {} }),
}));
vi.mock('../../../lib/apiClient', () => ({
  api: { get: vi.fn(async () => ({ data: [], headers: {} })) },
}));

import { previewRequestBody } from '../api/builderPreviewClient';
import {
  derivePreviewPhase,
  gemNoticeState,
  mapBuilderSteps,
  paceLabel,
  publishGate,
  readEvaluation,
  versionRows,
} from './model';
import { builderStudioReducer, initialStudioState } from './store';
import GemNotice from './components/GemNotice';
import ResumeStrip from './components/ResumeStrip';
import ModeSelector from './components/ModeSelector';
import BuilderShellHeader from '../components/BuilderShellHeader';

test('preview request sends the pace and no model name', () => {
  const body = previewRequestBody({ project_id: 'p' }, 'Clara', 'profundo');
  expect(body).toEqual({ projectId: 'p', instruction: 'Clara', pace: 'profundo' });
  expect(JSON.stringify(body)).not.toMatch(/claude|sonnet|haiku|opus|model/i);
  expect(previewRequestBody({ project_id: 'p' }, 'Clara', 'rapido').pace).toBe('rapido');
  expect(previewRequestBody({ project_id: 'p' }, 'Clara').pace).toBeUndefined();
});

test('pace labels use the catalog tier costs', () => {
  expect(paceLabel('rapido')).toBe('Modo rápido · 1 gema');
  expect(paceLabel('profundo')).toBe('Modo profundo · 3 gemas');
});

test('publish gate blocks a score under 12 and allows a passing score', () => {
  const low = readEvaluation({ evaluation: { total: 11, max: 20, threshold: 12, passed: false } });
  const high = readEvaluation({ evaluation: { total: 13, max: 20, threshold: 12, passed: true } });
  expect(publishGate(low, { publishEnabled: true }).enabled).toBe(false);
  expect(publishGate(low, { publishEnabled: true }).reason).toContain('No se ha publicado');
  expect(publishGate(high, { publishEnabled: true }).enabled).toBe(true);
  expect(publishGate(high, { publishEnabled: true, busy: true }).enabled).toBe(false);
  expect(publishGate(null, { publishEnabled: false }).reason).toContain('no está disponible');
});

test('gem notice covers a normal balance, a low balance and exhaustion', () => {
  expect(gemNoticeState({ balance: 42, pace: 'rapido' })).toEqual({ tone: 'normal', text: 'Te quedan 42 gemas' });
  expect(gemNoticeState({ balance: 2, pace: 'profundo' }).tone).toBe('low');
  expect(gemNoticeState({ balance: 2, pace: 'profundo' }).text).toBe('Te quedan 2 gemas');
  expect(gemNoticeState({ balance: 0 }).tone).toBe('exhausted');
  expect(gemNoticeState({ balance: 0 }).text).toBe('Has agotado tus gemas');
  expect(gemNoticeState({ balance: 0, freeTestMode: true }).tone).toBe('test');
});

test('step bar follows project, score, publication and the live surface', () => {
  const steps = mapBuilderSteps({
    project: { project_id: 'p', input_content: 'Clara', diagnosis: { summary: 'Consulta' } },
    preview: { html: '<h1>Clara</h1>' },
    evaluation: { total: 13, max: 20, passed: true },
    publication: { status: 'none' },
    live: false,
  });
  expect(steps.find((step) => step.id === 'idea').done).toBe(true);
  expect(steps.find((step) => step.id === 'analisis').done).toBe(true);
  expect(steps.find((step) => step.id === 'construccion').done).toBe(true);
  expect(steps.find((step) => step.id === 'evaluacion').label).toBe('Evaluación 13/20');
  expect(steps.find((step) => step.id === 'evaluacion').done).toBe(true);
  expect(steps.find((step) => step.id === 'publicar').current).toBe(true);
  expect(steps.find((step) => step.id === 'dominio').pending).toBe(true);
  expect(steps.find((step) => step.id === 'envivo').done).toBe(false);
});

test('preview phase distinguishes static, resuming, live and error', () => {
  expect(derivePreviewPhase({ html: '<h1></h1>' })).toBe('static');
  expect(derivePreviewPhase({ resuming: true, html: '<h1></h1>' })).toBe('resuming');
  expect(derivePreviewPhase({ busy: true })).toBe('live');
  expect(derivePreviewPhase({ failed: true, html: '<h1></h1>' })).toBe('error');
  expect(derivePreviewPhase({})).toBe('idle');
});

test('version restore is available only when this session has the html', () => {
  const rows = versionRows(
    [{ version: 1, instruction: 'Primera' }, { version: 2, instruction: 'Segunda' }],
    { 2: '<h1>Ahora</h1>' },
  );
  expect(rows[0].canRestore).toBe(false);
  expect(rows[1].canRestore).toBe(true);
});

test('the store keeps the pace and the resume flag', () => {
  let state = builderStudioReducer(initialStudioState, { type: 'pace', pace: 'profundo' });
  expect(state.composer.pace).toBe('profundo');
  state = builderStudioReducer(state, { type: 'pace', pace: 'opus' });
  expect(state.composer.pace).toBe('profundo');
  state = builderStudioReducer(state, { type: 'resume-start' });
  expect(state.ui.resuming).toBe(true);
  state = builderStudioReducer(state, { type: 'remember-html', version: 3, html: '<h1>v</h1>' });
  expect(state.htmlByVersion[3]).toContain('v');
});

test('Inicio leaves the builder for the dashboard', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/dashboard/builder']}>
        <BuilderShellHeader projectItems={[{ id: 'p', label: 'Clara' }]} activeProjectId="p" />
      </MemoryRouter>,
    );
  });
  const inicio = node.querySelector('[data-testid="builder-inicio"]');
  expect(inicio.getAttribute('href')).toBe('/dashboard');
  expect(inicio.textContent).toContain('Inicio');
  expect(node.textContent).not.toMatch(/claude|sonnet|haiku|opus/i);
  act(() => root.unmount());
});

test('the gem notice and the resume strip render their states', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => {
    root.render(
      <>
        <GemNotice tone="low" text="Te quedan 2 gemas" onDismiss={() => {}} />
        <ResumeStrip phase="resuming" onResume={() => {}} />
      </>,
    );
  });
  expect(node.querySelector('[data-testid="builder-gem-notice"]').getAttribute('data-tone')).toBe('low');
  expect(node.querySelector('[data-testid="builder-gem-notice"]').textContent).toContain('Te quedan 2 gemas');
  expect(node.querySelector('[data-testid="builder-gem-notice"]').textContent).toContain('Mejorar plan');
  expect(node.querySelector('[data-testid="builder-resume-strip"]').textContent).toContain('Reanudando…');
  expect(node.querySelector('[data-testid="builder-resume-strip"]').textContent).toContain('vista previa estática');
  act(() => root.unmount());
});

test('the mode control lists both paces and no provider', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  const chosen = [];
  act(() => root.render(<ModeSelector pace="rapido" onChange={(pace) => chosen.push(pace)} />));
  expect(node.textContent).toContain('Modo rápido · 1 gema');
  act(() => { node.querySelector('[data-testid="builder-pace-button"]').click(); });
  expect(node.textContent).toContain('Modo profundo · 3 gemas');
  const item = [...node.querySelectorAll('[role="menuitem"]')].find((button) => button.textContent.includes('profundo'));
  act(() => { item.click(); });
  expect(chosen).toEqual(['profundo']);
  expect(node.textContent).not.toMatch(/claude|sonnet|haiku|opus|grok/i);
  act(() => root.unmount());
});
