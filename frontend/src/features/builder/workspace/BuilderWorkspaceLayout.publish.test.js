import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';
import BuilderWorkspaceLayout from './BuilderWorkspaceLayout';

vi.mock('../publish/builderPublishClient', () => ({
  loadPublication: vi.fn(async () => ({
    status: 'none',
    slug: '',
    baseDomain: 'sistemamaestro.com',
    cnameTarget: 'edge.example.net',
    apexTarget: '203.0.113.10',
    message: '',
    customDomain: null,
    ssl: 'El certificado lo emite el borde de hosting (dominios personalizados de Railway). Esta pantalla no da de alta el dominio.',
  })),
  publishSavedLanding: vi.fn(),
  republishSavedLanding: vi.fn(),
  unpublishSavedLanding: vi.fn(),
  saveCustomDomain: vi.fn(),
  verifyCustomDomain: vi.fn(),
  publishErrorMessage: () => 'No se ha podido completar la acción.',
}));

vi.mock('./hooks/useBuilderWorkspaceRuntime', () => ({
  default: () => ({
    landingTransaction: { status: 'ready', revision: 1, audit: [], pending: null, error: '' },
    generatedPreview: {
      html: '<h1>Clara atiende</h1>',
      versions: [{ version: 1, instruction: 'Landing de Clara', createdAt: '2026-11-28T01:00:00+00:00' }],
      evaluation: { total: 14, max: 20, threshold: 12, passed: true },
    },
    previewNotice: '',
    previewPhase: 'ready',
    copy: {},
    progress: 100,
    activeCodeTab: 'tsx',
    setActiveCodeTab: () => {},
    messages: [],
    agentStatus: 'Builder preparado',
    submitMessage: () => {},
    startBuild: () => {},
    builderBuildState: { projectKind: 'landing', projectId: 'proj_clara' },
    builderIntelligence: {},
    executor: { phase: 'listo', message: '', steps: [], log: [] },
  }),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const project = {
  project_id: 'proj_clara',
  user_id: 'alice',
  input_content: 'Landing de Clara',
};

test('Publicar on En vivo opens the slug flow in the chat column', async () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  await act(async () => {
    root.render(
      <BuilderWorkspaceLayout
        ownerId="alice"
        project={project}
        publishLanding
        customDomain
        credits={0}
        bonus={0}
        usageLabel=""
      />
    );
  });
  const frame = node.querySelector('iframe');
  const open = node.querySelector('[data-testid="builder-publish-open"]');
  expect(frame).not.toBeNull();
  expect(open.disabled).toBe(false);
  expect(node.querySelector('[aria-label="Publicar"]')).toBeNull();
  await act(async () => { open.click(); });
  const flow = node.querySelector('[data-testid="builder-side-panel"] [data-testid="builder-publish-flow"]');
  const publish = flow.querySelector('[aria-label="Publicar"]');
  const domain = flow.querySelector('[aria-label="Dominio propio"]');
  expect(publish).not.toBeNull();
  expect(domain).not.toBeNull();
  expect(node.querySelector('.studio-right [data-builder-steps="publish"]')).toBeNull();
  expect(node.textContent).toContain('Pendiente de activación por Sistema Maestro');
  expect(node.textContent).toContain('edge.example.net');
  expect(node.textContent).not.toContain('up.railway.app');
  act(() => root.unmount());
});

test('the final steps stay hidden while publish is dark', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => {
    root.render(
      <BuilderWorkspaceLayout ownerId="alice" project={project} credits={0} bonus={0} usageLabel="" />
    );
  });
  expect(node.querySelector('iframe')).not.toBeNull();
  expect(node.querySelector('[data-testid="builder-publish-open"]')).toBeNull();
  expect(node.querySelector('[aria-label="Publicar"]')).toBeNull();
  expect(node.querySelector('[aria-label="Dominio propio"]')).toBeNull();
  act(() => root.unmount());
});
