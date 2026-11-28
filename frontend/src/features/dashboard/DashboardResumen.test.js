import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

const navigateMock = vi.hoisted(() => vi.fn());
const economicPost = vi.hoisted(() => vi.fn());
const builderEntryIsOpen = vi.hoisted(() => vi.fn());

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Lucas Diaz', email: 'lucas@example.test', plan: 'premium' },
    logout: vi.fn(),
  }),
}));

vi.mock('../../lib/apiClient', () => ({
  api: {
    get: (...args) => apiMocks.get(...args),
    post: (...args) => apiMocks.post(...args),
  },
}));

vi.mock('../../lib/economicRequest', () => ({
  economicPost: (...args) => economicPost(...args),
}));

vi.mock('../builder/builderAccess', () => ({
  builderEntryIsOpen: (...args) => builderEntryIsOpen(...args),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import DashboardPage from './DashboardPage';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};

const pointer = (element, type) => {
  element.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, button: 0 }));
};

const activate = (element) => {
  pointer(element, 'pointerdown');
  pointer(element, 'pointerup');
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
};

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const projects = [
  { project_id: 'p1', input_content: 'Clara, psicóloga en Madrid' },
  { project_id: 'p2', input_content: 'Taller de bicicletas' },
  { project_id: 'p3', input_content: 'Clínica norte' },
  { project_id: 'p4', input_content: 'Estudio de arquitectura' },
];

beforeEach(() => {
  navigateMock.mockReset();
  economicPost.mockReset();
  apiMocks.post.mockReset();
  builderEntryIsOpen.mockReset();
  builderEntryIsOpen.mockResolvedValue(true);
  window.localStorage.clear();
  apiMocks.get.mockImplementation((url) => {
    if (url === '/user/billing') {
      return Promise.resolve({
        data: {
          credit_summary: {
            balance: 128,
            lifetime_used: 40,
            included_credits_for_current_plan: 500,
          },
        },
      });
    }
    if (url === '/builder/session') {
      return Promise.resolve({ data: { freeTestMode: false }, headers: {} });
    }
    if (url === '/projects') {
      return Promise.resolve({ data: projects, headers: {} });
    }
    return Promise.resolve({ data: {}, headers: {} });
  });
});

async function renderDashboard() {
  const node = document.createElement('div');
  document.body.appendChild(node);
  const root = createRoot(node);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardPage />
      </MemoryRouter>
    );
  });
  await flush();
  return {
    node,
    unmount: () => {
      act(() => root.unmount());
      node.remove();
    },
  };
}

test('resumen keeps the composer, sectors and gems, and drops recent projects', async () => {
  const { node, unmount } = await renderDashboard();
  const text = node.textContent;

  expect(text).toContain('SISTEMA MAESTRO');
  expect(text).toContain('¿Qué negocio vamos a lanzar hoy?');
  expect(text).toContain('Describe tu negocio: creamos tu web, la publicamos y tu agente de IA atiende.');
  expect(text).toContain('Crear mi web');
  expect(text).toContain('Mejorar mi web');
  expect(text).toContain('Instalar agente');
  expect(text).not.toContain('App web');
  expect(text).not.toContain('Workspace');
  expect(text).not.toContain('EMPIEZA CON UNA PLANTILLA');
  expect(text).not.toContain('Restaurante');
  expect(node.querySelector('[data-testid="dashboard-prompt"]').getAttribute('placeholder')).toBe(
    'Describe tu negocio, a quién vendes y qué quieres que hagan tus clientes…'
  );
  expect(node.querySelector('[data-testid="dashboard-attach"]')).not.toBeNull();
  expect(node.querySelector('[data-testid="dashboard-mic"]')).not.toBeNull();
  expect(node.querySelector('[data-testid="dashboard-send"]').textContent).toBe('Crear mi web ◆ 1');
  expect(node.querySelector('[data-testid="dashboard-gem-pill"]').textContent).toBe('◆ 128 gemas');
  expect(node.querySelector('[data-testid="dashboard-test-mode"]')).toBeNull();
  expect(node.querySelector('header')).toBeNull();
  expect(node.querySelector('[data-testid="dashboard-account-card"]').textContent).toContain('Premium');

  expect(node.querySelector('[data-testid="dashboard-sectors"]')).toBeNull();
  expect(node.querySelector('[data-testid^="dashboard-recent-"]')).toBeNull();
  expect(text).not.toContain('Continúa construyendo');
  expect(text).not.toContain('Ver todos');
  expect(node.querySelector('[data-testid="new-project-btn"]')).toBeNull();
  expect(node.querySelector('[data-testid="dashboard-project-menu"]').textContent).toContain('Clara, psicóloga en Madrid');
  expect(node.querySelector('[data-testid="dashboard-project-menu"]').textContent).not.toContain('Proyectos');

  unmount();
});

test('crear mi web sends the landing text flow', async () => {
  economicPost.mockResolvedValue({ data: { project_id: 'proj_new' } });
  const { node, unmount } = await renderDashboard();
  const prompt = node.querySelector('[data-testid="dashboard-prompt"]');

  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(prompt, 'Una clínica en Málaga');
    prompt.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await act(async () => {
    activate(node.querySelector('[data-testid="dashboard-send"]'));
  });
  await flush();

  expect(economicPost).toHaveBeenCalledWith(
    expect.anything(),
    '/projects',
    expect.objectContaining({
      input_type: 'text',
      input_content: expect.stringContaining('Una clínica en Málaga'),
    })
  );
  expect(navigateMock).toHaveBeenCalledWith(
    '/dashboard/builder?project_id=proj_new',
    expect.objectContaining({
      state: expect.objectContaining({
        initialMode: 'landing',
        source: 'dashboard-launch-console',
      }),
    })
  );

  unmount();
});

test('instalar agente posts the voice embed for the active project', async () => {
  apiMocks.post.mockResolvedValue({ data: { snippet: '<script src="/embed/agent.js"></script>' } });
  const { node, unmount } = await renderDashboard();

  act(() => activate(node.querySelector('[data-testid="dashboard-tab-install"]')));
  expect(node.querySelector('[data-testid="dashboard-send"]').textContent).toBe('Instalar agente');
  expect(node.querySelector('[data-testid="dashboard-agent-chat"]').disabled).toBe(true);
  expect(node.querySelector('[data-testid="dashboard-agent-chat"]').textContent).toContain('Próximamente');

  const host = node.querySelector('[data-testid="dashboard-embed-host"]');
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(host, 'tunegocio.com');
    host.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await act(async () => {
    activate(node.querySelector('[data-testid="dashboard-send"]'));
  });
  await flush();

  expect(apiMocks.post).toHaveBeenCalledWith('/embed/agents', {
    project_id: 'p1',
    allowed_origins: ['https://tunegocio.com'],
  });
  expect(node.querySelector('[data-testid="dashboard-embed-snippet"]').textContent).toContain('agent.js');
  expect(economicPost).not.toHaveBeenCalled();

  unmount();
});

test('mejorar mi web sends the existing url input type', async () => {
  economicPost.mockResolvedValue({ data: { project_id: 'proj_url' } });
  const { node, unmount } = await renderDashboard();

  act(() => activate(node.querySelector('[data-testid="dashboard-tab-url"]')));
  const prompt = node.querySelector('[data-testid="dashboard-prompt"]');
  expect(prompt.getAttribute('placeholder')).toBe('Pega la URL de tu web y dime qué quieres mejorar…');

  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(prompt, 'https://miweb.com mejora la claridad');
    prompt.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await act(async () => {
    activate(node.querySelector('[data-testid="dashboard-send"]'));
  });
  await flush();

  expect(economicPost).toHaveBeenCalledWith(
    expect.anything(),
    '/projects',
    expect.objectContaining({
      input_type: 'url',
      input_content: expect.stringContaining('https://miweb.com'),
    })
  );
  expect(navigateMock).toHaveBeenCalledWith(
    '/dashboard/builder?project_id=proj_url',
    expect.objectContaining({
      state: expect.objectContaining({ initialMode: 'url' }),
    })
  );

  unmount();
});

test('project menu lists projects and nuevo proyecto', async () => {
  const { node, unmount } = await renderDashboard();

  act(() => activate(node.querySelector('[data-testid="dashboard-project-menu"]')));
  await flush();

  const menu = document.querySelector('[data-testid="dashboard-project-options"]');
  expect(menu.textContent).toContain('Taller de bicicletas');
  expect(menu.textContent).toContain('Nuevo proyecto');

  unmount();
});

test('free test mode replaces the send cost and stays in the header', async () => {
  apiMocks.get.mockImplementation((url) => {
    if (url === '/user/billing') {
      return Promise.resolve({
        data: { credit_summary: { balance: 4, lifetime_used: 1, included_credits_for_current_plan: 10 } },
      });
    }
    if (url === '/builder/session') {
      return Promise.resolve({ data: { freeTestMode: true }, headers: {} });
    }
    if (url === '/projects') return Promise.resolve({ data: [], headers: {} });
    return Promise.resolve({ data: {}, headers: {} });
  });

  const { node, unmount } = await renderDashboard();
  expect(node.querySelector('[data-testid="dashboard-send"]').textContent).toBe('Modo prueba · sin gemas');
  expect(node.querySelector('[data-testid="dashboard-test-mode"]').textContent).toContain('Modo prueba · sin gemas');
  expect(node.querySelector('[data-testid="dashboard-gem-pill"]').textContent).toBe('◆ 4 gemas');
  expect(node.querySelector('[data-testid="dashboard-project-menu"]').textContent).toContain('Proyecto');

  unmount();
});
