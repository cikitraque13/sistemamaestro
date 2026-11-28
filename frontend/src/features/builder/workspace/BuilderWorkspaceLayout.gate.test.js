import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';
import BuilderWorkspaceLayout from './BuilderWorkspaceLayout';

const runtime = {
  landingTransaction: { status: 'ready', revision: 1, canRevert: true, audit: [], pending: null, error: '' },
  generatedPreview: {
    html: '<h1>Clara</h1>',
    versions: [{ version: 2, instruction: 'Segunda', createdAt: '2026-11-28T06:28:00Z' }],
    evaluation: { total: 11, max: 20, threshold: 12, passed: false },
  },
  previewNotice: '',
  previewPhase: 'ready',
  retryPreview: vi.fn(),
  reloadPreview: vi.fn(async () => runtime.generatedPreview),
  submitMessage: vi.fn(),
  copy: {},
  activeCodeTab: 'tsx',
  setActiveCodeTab: () => {},
  executor: { phase: 'completado', message: 'Página guardada.', steps: [], log: [], partialHtml: '', slow: false },
  builderBuildState: { projectKind: 'landing', projectId: 'proj_clara' },
  builderIntelligence: {},
};

vi.mock('./hooks/useBuilderWorkspaceRuntime', () => ({
  default: () => runtime,
}));
vi.mock('../publish/builderPublishClient', () => ({
  loadPublication: vi.fn(async () => ({ status: 'none', url: '' })),
  publishErrorMessage: (error) => error?.response?.data?.detail?.message || 'No se ha podido completar la acción.',
  publishSavedLanding: vi.fn(),
  republishSavedLanding: vi.fn(),
  unpublishSavedLanding: vi.fn(),
  saveCustomDomain: vi.fn(),
  verifyCustomDomain: vi.fn(),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const project = { project_id: 'proj_clara', user_id: 'alice', input_content: 'Clara' };

function render() {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => root.render(
    <BuilderWorkspaceLayout ownerId="alice" project={project} publishLanding credits={0} bonus={0} usageLabel="" />
  ));
  return { node, root };
}

test('Publicar stays disabled under the evaluation bar and enables once the score passes', async () => {
  runtime.generatedPreview.evaluation = { total: 11, max: 20, threshold: 12, passed: false };
  const low = render();
  const button = low.node.querySelector('[data-testid="builder-publish-button"]');
  expect(button.disabled).toBe(true);
  expect(button.getAttribute('title')).toContain('No se ha publicado');
  expect(low.node.querySelector('[data-testid="builder-score-badge"]').textContent).toBe('11/20');
  expect(low.node.querySelector('[data-testid="builder-resume-strip"]').textContent).toContain('vista previa estática');
  act(() => low.root.unmount());

  runtime.generatedPreview.evaluation = { total: 13, max: 20, threshold: 12, passed: true };
  const high = render();
  expect(high.node.querySelector('[data-testid="builder-publish-button"]').disabled).toBe(false);
  expect(high.node.querySelector('[data-testid="builder-score-badge"]').textContent).toBe('13/20');
  expect(high.node.querySelector('[data-step-bar], [data-testid="builder-step-bar"]').textContent).toContain('Evaluación 13/20');
  act(() => high.root.unmount());
});

test('a static preview can resume and an error stays visible', async () => {
  runtime.previewPhase = 'ready';
  runtime.executor.phase = 'completado';
  const { node, root } = render();
  const strip = node.querySelector('[data-testid="builder-resume-strip"]');
  expect(strip.textContent).toContain('Reanudar');
  await act(async () => { strip.querySelector('button').click(); });
  expect(runtime.reloadPreview).toHaveBeenCalled();
  act(() => root.unmount());

  runtime.previewPhase = 'error';
  runtime.executor = { phase: 'error', message: 'La generación no responde. No se ha publicado nada.', steps: [], log: [], partialHtml: '', slow: false };
  runtime.generatedPreview = null;
  runtime.previewNotice = 'La generación no responde. No se ha publicado nada.';
  const failed = render();
  expect(failed.node.textContent).toContain('La generación no responde');
  expect(failed.node.querySelector('[data-testid="builder-resume-strip"]')).toBeNull();
  act(() => failed.root.unmount());
});
