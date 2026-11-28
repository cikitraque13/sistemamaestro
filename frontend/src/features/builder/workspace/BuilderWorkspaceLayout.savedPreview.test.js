import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';
import BuilderWorkspaceLayout from './BuilderWorkspaceLayout';

const CLARA_HTML = `<!doctype html><html lang="es"><body><h1>Clara atiende la consulta esta semana</h1><a href="#contenido">Pedir cita con Clara</a></body></html>`;

vi.mock('./hooks/useBuilderWorkspaceRuntime', () => ({
  default: () => ({
    landingTransaction: { status: 'ready', revision: 1, audit: [], pending: null, error: '' },
    generatedPreview: {
      html: CLARA_HTML,
      versions: [{ version: 1, instruction: 'Landing de Clara para consultas de empresa', createdAt: '2026-11-28T01:00:00+00:00' }],
    },
    previewNotice: '',
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
  }),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('saved Clara landing renders in the preview instead of the sector template', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => root.render(
    <BuilderWorkspaceLayout
      ownerId="alice"
      project={{ project_id: 'proj_clara', user_id: 'alice', input_content: 'Landing de Clara para consultas de empresa' }}
      credits={12}
      bonus={0}
      usageLabel=""
    />
  ));
  const frame = node.querySelector('iframe');
  expect(frame).not.toBeNull();
  expect(frame.getAttribute('sandbox')).toBe('');
  expect(frame.getAttribute('srcdoc')).toContain('Clara atiende la consulta esta semana');
  expect(frame.getAttribute('srcdoc')).toContain('Pedir cita con Clara');
  expect(frame.getAttribute('srcdoc')).not.toContain('Convierte dudas en decisiones claras');
  expect(node.textContent).toContain('Landing de Clara para consultas de empresa');
  expect(node.textContent).not.toContain('Convierte dudas en decisiones claras');
  act(() => root.unmount());
});
