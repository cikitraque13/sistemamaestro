import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';
import BuilderWorkspaceLayout from './BuilderWorkspaceLayout';

const runtime = {
  landingTransaction: { status: 'ready', revision: 0, audit: [], pending: null, error: '' },
  generatedPreview: null,
  previewNotice: '',
  previewPhase: 'working',
  retryPreview: vi.fn(),
  copy: {},
  progress: 4,
  activeCodeTab: 'tsx',
  setActiveCodeTab: () => {},
  messages: [],
  agentStatus: 'Builder preparado',
  submitMessage: () => {},
  startBuild: () => {},
  builderBuildState: { projectKind: 'landing', projectId: 'proj_clara' },
  builderIntelligence: {},
};

vi.mock('./hooks/useBuilderWorkspaceRuntime', () => ({
  default: () => runtime,
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const project = {
  project_id: 'proj_clara',
  user_id: 'alice',
  input_content: 'Clara, psicóloga en Madrid',
};

function render() {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => root.render(
    <BuilderWorkspaceLayout ownerId="alice" project={project} credits={0} bonus={0} usageLabel="" />
  ));
  return { node, root };
}

test('a build in progress does not show the generic template', () => {
  runtime.previewPhase = 'working';
  runtime.generatedPreview = null;
  runtime.previewNotice = '';
  runtime.executor = null;
  const { node, root } = render();
  expect(node.textContent).toContain('Preparando tu página…');
  expect(node.textContent).not.toContain('Convierte dudas en decisiones claras');
  expect(node.querySelector('iframe')).toBeNull();
  act(() => root.unmount());
});

test('iterating keeps the saved page and the working state visible', () => {
  runtime.previewPhase = 'working';
  runtime.generatedPreview = { html: '<h1>Clara atiende</h1>', versions: [] };
  runtime.executor = {
    phase: 'iterando',
    message: 'Iterando sobre la versión guardada.',
    partialHtml: '',
    slow: true,
    steps: [{ id: 'textos', label: 'Textos', status: 'in_progress' }],
    log: [],
  };
  const { node, root } = render();
  expect(node.querySelector('iframe')).not.toBeNull();
  expect(node.textContent).toContain('Iterando sobre la versión guardada.');
  expect(node.textContent).toContain('sigue trabajando…');
  expect(node.textContent).not.toContain('Convierte dudas en decisiones claras');
  act(() => root.unmount());
});

test('a section event paints the right pane while the executor is still building', () => {
  runtime.previewPhase = 'working';
  runtime.generatedPreview = null;
  runtime.previewNotice = '';
  runtime.executor = {
    phase: 'construyendo',
    message: 'Construyendo tu página.',
    partialHtml: '<h1>Clara parcial</h1>',
    slow: false,
    steps: [],
    log: [],
  };
  const { node, root } = render();
  expect(node.querySelector('iframe').getAttribute('srcdoc')).toContain('Clara parcial');
  expect(node.textContent).toContain('Pensando');
  expect(node.textContent).not.toContain('Completado');
  act(() => root.unmount());
});

test('a failed build keeps the error and the retry button, not the generic template', () => {
  runtime.previewPhase = 'error';
  runtime.generatedPreview = null;
  runtime.executor = { phase: 'error', message: '', partialHtml: '', slow: false, steps: [], log: [] };
  runtime.previewNotice = 'El clasificador no está disponible ahora. No se ha generado ningún resultado.';
  runtime.retryPreview = vi.fn();
  const { node, root } = render();
  expect(node.textContent).toContain('El clasificador no está disponible ahora. No se ha generado ningún resultado.');
  expect(node.textContent).not.toContain('Convierte dudas en decisiones claras');
  act(() => {
    [...node.querySelectorAll('button')].find((button) => button.textContent === 'Reintentar').click();
  });
  expect(runtime.retryPreview).toHaveBeenCalled();
  act(() => root.unmount());
});
