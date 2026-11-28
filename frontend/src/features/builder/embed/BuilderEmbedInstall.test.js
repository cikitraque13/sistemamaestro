import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';

vi.mock('../workspace/hooks/useBuilderWorkspaceRuntime', () => ({
  default: () => ({
    landingTransaction: { status: 'ready', revision: 0, audit: [], pending: null, error: '' },
    copy: {},
    progress: 4,
    activeCodeTab: 'tsx',
    setActiveCodeTab: () => {},
    messages: [],
    agentStatus: 'listo',
    submitMessage: () => {},
    startBuild: () => {},
    builderBuildState: { projectKind: 'landing', projectId: 'proj_bici' },
    builderIntelligence: {},
    executor: { phase: 'idle', message: '', steps: [], log: [] },
    previewPhase: 'idle',
    generatedPreview: null,
    previewNotice: '',
    retryPreview: () => {},
  }),
}));

vi.mock('./EmbedInstallStep', () => ({
  default: ({ projectId }) => <section data-testid="embed-install-step">Instalar {projectId}</section>,
}));

import BuilderWorkspaceLayout from '../workspace/BuilderWorkspaceLayout';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const project = {
  project_id: 'proj_bici',
  user_id: 'alice',
  input_content: 'Taller de bicicletas',
  input_type: 'text',
  status: 'analyzed',
};

function Harness({ embedInstall = false }) {
  const [tab, setTab] = useState('preview');
  return (
    <BuilderWorkspaceLayout
      ownerId="alice"
      project={project}
      activeWorkspaceTab={tab}
      onWorkspaceTabChange={setTab}
      embedInstall={embedInstall}
      credits={3}
      bonus={0}
      usageLabel=""
    />
  );
}

test('sin la bandera no aparece el paso de instalación', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => root.render(<Harness />));
  expect(node.textContent).not.toContain('Instalar en tu web');
  act(() => root.unmount());
});

test('con la bandera el paso muestra el proyecto', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => root.render(<Harness embedInstall />));
  const button = [...node.querySelectorAll('button')].find((item) => item.textContent === 'Instalar en tu web');
  expect(button).toBeTruthy();
  act(() => button.click());
  expect(node.querySelector('[data-testid="embed-install-step"]').textContent).toBe('Instalar proj_bici');
  act(() => root.unmount());
});
