import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';
import BuilderWorkspaceLayout from './BuilderWorkspaceLayout';

vi.mock('./hooks/useBuilderWorkspaceRuntime', () => ({
  default: () => ({
    landingTransaction: { status: 'ready', revision: 0, audit: [], pending: null, error: '' },
    copy: {},
    progress: 4,
    activeCodeTab: 'tsx',
    setActiveCodeTab: () => {},
    messages: [],
    agentStatus: 'Builder pensando',
    submitMessage: () => {},
    startBuild: () => {},
    builderBuildState: { projectKind: 'landing', projectId: 'proj_hidden' },
    builderIntelligence: {},
  }),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const project = {
  project_id: 'proj_hidden',
  user_id: 'alice',
  input_content: 'Asesoría legal para empresas',
  input_type: 'text',
  status: 'analyzed',
};

const mount = (element) => {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => root.render(element));
  return { node, root };
};

function Harness() {
  const [tab, setTab] = React.useState('preview');
  return (
    <BuilderWorkspaceLayout
      ownerId="alice"
      project={project}
      activeWorkspaceTab={tab}
      onWorkspaceTabChange={setTab}
      credits={12}
      bonus={3}
      usageLabel="Créditos visibles"
    />
  );
}

test('workspace shows the sector preview and hides code, landing controls and engineering tabs', () => {
  const { node, root } = mount(<Harness />);

  expect(node.querySelector('section > div').className).toContain('lg:grid-cols-[380px_minmax(0,1fr)]');
  expect(node.querySelector('aside').className).toContain('lg:order-1');
  expect(node.querySelector('iframe')).toBeNull();
  expect(node.textContent).toContain('Convierte dudas en decisiones claras');
  expect(node.textContent).toContain('Asesoramiento experto');
  expect(node.textContent).toContain('Agendar consulta');
  expect(node.textContent).not.toContain('Gema Maestra');
  expect(node.textContent).not.toContain('12 créditos');
  expect(node.textContent).not.toContain('+ 3');
  expect(node.textContent).toContain('Aún no hay cambios');
  expect(node.textContent).toContain('Extracción');
  expect(node.textContent).toContain('Siguiente paso recomendado');
  expect(node.textContent).not.toContain('Código del proyecto');
  expect(node.textContent).not.toContain('Codigo en construccion');
  expect(node.textContent).not.toContain('Código en construcción');
  expect(node.textContent).not.toContain('Builder pensando');
  expect(node.textContent).not.toContain('Destino del CTA');
  expect(node.textContent).not.toContain('Landing activa');
  expect(node.textContent).not.toContain('Proponer destino');
  expect(node.textContent).not.toContain('Seleccionar no aplica');
  expect(node.textContent).not.toContain('Revertir último cambio');
  expect(node.textContent).not.toContain('TSX');
  expect(node.textContent).not.toContain('Estructura');
  expect(node.querySelectorAll('button').length).toBeGreaterThan(0);

  act(() => {
    [...node.querySelectorAll('button')].find((button) => button.textContent === 'Extracción').click();
  });
  expect(node.textContent).toContain('Lo que el sistema ha entendido');
  expect(node.textContent).toContain('Lectura del diagnóstico');
  expect(node.textContent).not.toContain('Gema Maestra');
  expect(node.textContent).not.toContain('+ 3');
  expect(node.textContent).not.toContain('Código del proyecto');
  expect(node.textContent).not.toContain('Destino del CTA');
  act(() => root.unmount());
});

test('free test mode shows the no-gems badge', () => {
  const { node, root } = mount(
    <BuilderWorkspaceLayout freeTestMode project={project} ownerId="alice" credits={12} bonus={0} usageLabel="" />
  );
  expect(node.textContent).toContain('Modo prueba · sin gemas');
  expect(node.textContent).not.toContain('Gema Maestra');
  act(() => root.unmount());
});
