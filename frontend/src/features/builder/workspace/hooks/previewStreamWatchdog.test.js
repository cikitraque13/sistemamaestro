import { api } from '../../../../lib/apiClient';

vi.mock('../../../../lib/apiClient', () => ({ api: { get: vi.fn(), put: vi.fn() } }));

vi.mock('../../api/builderPreviewClient', async () => {
  const actual = await vi.importActual('../../api/builderPreviewClient');
  return {
    ...actual,
    loadLandingPreview: vi.fn(),
    streamLandingPreview: vi.fn(),
  };
});

import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';
import { vi } from 'vitest';
import useBuilderWorkspaceRuntime from './useBuilderWorkspaceRuntime';
import { loadLandingPreview, streamLandingPreview, streamWatchdog } from '../../api/builderPreviewClient';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
globalThis.TextEncoder = TextEncoder;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function project(id) {
  return {
    user_id: 'test-owner',
    project_id: id,
    input_type: 'text',
    input_content: 'Clara, psicóloga en Madrid',
    route: 'idea',
    status: 'analyzed',
  };
}

async function mount(props) {
  let runtime;
  function Harness() {
    runtime = useBuilderWorkspaceRuntime(props);
    return <div>{runtime.executor?.phase}</div>;
  }
  const node = document.createElement('div');
  const root = createRoot(node);
  await act(async () => { root.render(<Harness />); });
  for (let i = 0; i < 8; i += 1) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 15)); });
  }
  return { runtime, root };
}

beforeEach(() => {
  api.get.mockResolvedValue({ data: {} });
  loadLandingPreview.mockReset();
  streamLandingPreview.mockReset();
  loadLandingPreview.mockResolvedValue(null);
  localStorage.clear();
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: { request: (_key, _options, fn) => fn() },
  });
});

afterEach(() => {
  streamWatchdog.ms = 150000;
});

test('only heartbeats leave the executor in error, not an endless build', async () => {
  streamWatchdog.ms = 30;
  streamLandingPreview.mockImplementation((_project, _instruction, onEvent) => new Promise(() => {
    onEvent({ type: 'heartbeat' });
  }));
  const { runtime, root } = await mount({
    project: project('proj-watchdog-beats'),
    ownerId: 'test-owner',
    initialPrompt: 'Clara, psicóloga en Madrid',
    autoStart: true,
  });
  expect(runtime.executor.phase).toBe('error');
  expect(runtime.executor.message).toMatch(/no responde/i);
  expect(runtime.previewPhase).toBe('error');
  act(() => root.unmount());
});

test('an insufficient terminal event sets error and a done event sets completado', async () => {
  streamLandingPreview.mockImplementation(async (_project, _instruction, onEvent) => {
    onEvent({
      type: 'notice',
      code: 'insufficient_gems',
      message: 'No tienes gemas suficientes',
      plansUrl: '/dashboard/billing',
    });
    onEvent({
      type: 'error',
      code: 'insufficient_gems',
      message: 'No tienes gemas suficientes',
      plansUrl: '/dashboard/billing',
    });
    const error = new Error('No tienes gemas suficientes. Planes: /dashboard/billing');
    error.response = { data: { detail: { message: error.message } } };
    throw error;
  });
  const failed = await mount({
    project: project('proj-watchdog-gems'),
    ownerId: 'test-owner',
    initialPrompt: 'Clara, psicóloga en Madrid',
    autoStart: true,
  });
  expect(failed.runtime.executor.phase).toBe('error');
  expect(failed.runtime.executor.message).toContain('No tienes gemas suficientes');
  expect(failed.runtime.executor.message).toContain('/dashboard/billing');
  expect(failed.runtime.previewPhase).toBe('error');
  act(() => failed.root.unmount());

  streamLandingPreview.mockImplementation(async (_project, _instruction, onEvent) => {
    onEvent({ type: 'notice', code: 'pending_charge', message: 'Cobro pendiente de confirmar' });
    onEvent({ type: 'done', html: '<h1>Clara</h1>', summary: 'Clara', versions: [] });
    return { html: '<h1>Clara</h1>', summary: 'Clara', versions: [] };
  });
  const done = await mount({
    project: project('proj-watchdog-done'),
    ownerId: 'test-owner',
    initialPrompt: 'Clara, psicóloga en Madrid',
    autoStart: true,
  });
  expect(done.runtime.executor.phase).toBe('completado');
  expect(done.runtime.previewPhase).toBe('ready');
  expect(done.runtime.previewNotice).toContain('Cobro pendiente de confirmar');
  expect(done.runtime.generatedPreview.html).toContain('Clara');
  act(() => done.root.unmount());
});
