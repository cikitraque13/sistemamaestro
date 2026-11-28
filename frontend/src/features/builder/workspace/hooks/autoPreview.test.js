import { api } from '../../../../lib/apiClient';

vi.mock('../../../../lib/apiClient', () => ({ api: { get: vi.fn(), put: vi.fn() } }));

vi.mock('../../api/builderPreviewClient', async () => {
  const actual = await vi.importActual('../../api/builderPreviewClient');
  return {
    ...actual,
    loadLandingPreview: vi.fn(),
    streamLandingPreview: vi.fn(),
    previewErrorMessage: () => 'No se ha podido preparar la preview. No se ha publicado nada.',
    stepNeedsPatience: () => false,
  };
});

import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';
import { vi } from 'vitest';
import useBuilderWorkspaceRuntime from './useBuilderWorkspaceRuntime';
import { loadLandingPreview, streamLandingPreview } from '../../api/builderPreviewClient';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
globalThis.TextEncoder = TextEncoder;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const saved = {
  html: '<h1>Clara atiende en Madrid</h1>',
  versions: [{ version: 1, instruction: 'Clara, psicóloga en Madrid', createdAt: '2026-11-28T01:00:00+00:00' }],
};

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
    return <div>{runtime.previewPhase}</div>;
  }
  const node = document.createElement('div');
  const root = createRoot(node);
  await act(async () => { root.render(<Harness />); });
  for (let i = 0; i < 20; i += 1) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
  }
  return { runtime, root, node };
}

beforeEach(() => {
  api.get.mockResolvedValue({ data: {} });
  loadLandingPreview.mockReset();
  streamLandingPreview.mockReset();
  localStorage.clear();
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: { request: (_key, _options, fn) => fn() },
  });
});

test('Crear starts the real preview and keeps version 1', async () => {
  loadLandingPreview.mockResolvedValue(null);
  streamLandingPreview.mockImplementation(async (_project, _instruction, onEvent) => {
    onEvent({ type: 'state', phase: 'construyendo', message: 'Construyendo tu página.' });
    onEvent({ type: 'section', index: 0, title: 'Consulta', text: 'Clara atiende en Madrid', html: saved.html });
    onEvent({ type: 'done', ...saved, summary: 'Clara atiende en Madrid' });
    return saved;
  });
  const { runtime, root, node } = await mount({
    project: project('proj-auto-clara'),
    ownerId: 'test-owner',
    initialPrompt: 'Clara, psicóloga en Madrid',
    autoStart: true,
  });
  expect(streamLandingPreview).toHaveBeenCalledTimes(1);
  expect(streamLandingPreview.mock.calls[0][1]).toBe('Clara, psicóloga en Madrid');
  expect(runtime.generatedPreview.html).toContain('Clara atiende en Madrid');
  expect(runtime.generatedPreview.versions[0].version).toBe(1);
  expect(runtime.previewPhase).toBe('ready');
  expect(node.textContent).not.toContain('Convierte dudas en decisiones claras');
  act(() => root.unmount());
});

test('a failed automatic build stays on the error and does not invent a page', async () => {
  loadLandingPreview.mockResolvedValue(null);
  streamLandingPreview.mockRejectedValue(new Error('down'));
  const { runtime, root } = await mount({
    project: project('proj-auto-fail'),
    ownerId: 'test-owner',
    initialPrompt: 'Clara, psicóloga en Madrid',
    autoStart: true,
  });
  expect(runtime.previewPhase).toBe('error');
  expect(runtime.executor.phase).toBe('error');
  expect(runtime.executor.phase).not.toBe('completado');
  expect(runtime.previewNotice).toMatch(/preview|publicado/i);
  expect(runtime.generatedPreview).toBeNull();
  act(() => root.unmount());
});
