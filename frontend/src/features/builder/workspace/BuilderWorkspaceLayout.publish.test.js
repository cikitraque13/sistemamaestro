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

test('publicar and dominio propio render after the preview when the session opens them', async () => {
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
  const publish = node.querySelector('[aria-label="Publicar"]');
  const domain = node.querySelector('[aria-label="Dominio propio"]');
  expect(frame).not.toBeNull();
  expect(publish).not.toBeNull();
  expect(domain).not.toBeNull();
  expect(frame.compareDocumentPosition(publish) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(publish.compareDocumentPosition(domain) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
  expect(node.querySelector('[aria-label="Publicar"]')).toBeNull();
  expect(node.querySelector('[aria-label="Dominio propio"]')).toBeNull();
  act(() => root.unmount());
});
