import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Lucas Diaz', email: 'lucas@example.test', plan: 'free', credit_balance: 574 },
    logout: vi.fn(),
  }),
}));

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(async () => ({
      data: [{ project_id: 'p', input_content: 'Clara, psicóloga en Madrid' }],
      headers: {},
    })),
  },
}));

import DashboardLayout from './DashboardLayout';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('resumen does not show the workspace header', () => {
  window.sessionStorage.clear();
  const node = document.createElement('div');
  const root = createRoot(node);

  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout title="Resumen">
          <p>Contenido del resumen</p>
        </DashboardLayout>
      </MemoryRouter>
    );
  });

  expect(node.querySelector('header')).toBeNull();
  expect(node.textContent).not.toContain('Workspace');
  expect(node.textContent).not.toContain('Mejorar plan');
  expect(node.textContent).not.toContain('Conoce a tu asesor');
  expect(node.textContent).not.toContain('574');
  expect(node.querySelector('[data-testid="builder-account-menu"]')).toBeNull();

  act(() => root.unmount());
});

test('resumen sidebar keeps billing above the account card and hides oportunidades', async () => {
  const node = document.createElement('div');
  const root = createRoot(node);

  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout title="Resumen">
          <p>Contenido del resumen</p>
        </DashboardLayout>
      </MemoryRouter>
    );
  });

  const sidebar = node.querySelector('[data-testid="dashboard-sidebar"]');
  const primary = sidebar.querySelector('[data-testid="dashboard-primary-nav"]');
  const billing = sidebar.querySelector('[data-testid="dashboard-nav-facturacion"]');
  const account = sidebar.querySelector('[data-testid="dashboard-account-card"]');

  expect(sidebar.className).toContain('overflow-hidden');
  expect(sidebar.className).toContain('h-screen');
  const projectsToggle = primary.querySelector('button');
  expect(projectsToggle.textContent).toContain('Proyectos');
  expect(primary.firstElementChild).toBe(sidebar.querySelector('[data-testid="dashboard-sidebar-projects"]'));
  expect([...primary.querySelectorAll('a')].map((link) => link.textContent.trim())).toEqual([
    'Agencia de IA',
    'Agente de voz',
    'Agente de chat',
  ]);
  expect(primary.querySelector('[data-testid="dashboard-nav-agencia"]').getAttribute('href')).toBe('/#agencia-ia');
  expect(sidebar.textContent).not.toContain('Reservas');
  expect(sidebar.textContent).not.toContain('Oportunidades');
  expect(sidebar.textContent).not.toContain('Builder');
  expect(sidebar.textContent).toContain('PRODUCTOS');
  expect(primary.textContent).not.toContain('Facturación');
  expect(sidebar.querySelector('[data-testid="new-project-btn"]')).toBeNull();

  await act(async () => {
    projectsToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(sidebar.textContent).toContain('Nuevo proyecto');
  expect(billing.getAttribute('href')).toBe('/dashboard/billing');
  expect(billing.compareDocumentPosition(account) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(account.textContent).toContain('Lucas Diaz');
  expect(account.textContent).toContain('Gratis');
  expect(account.querySelector('[data-testid="dashboard-account-avatar"]').textContent).toBe('L');
  expect(account.textContent).not.toContain('Cerrar sesión');
  expect(sidebar.textContent).toContain('Cerrar sesión');
  expect(node.querySelector('header')).toBeNull();

  act(() => root.unmount());
});

test('project pages use the same shell without the chip bar', () => {
  window.sessionStorage.clear();
  const node = document.createElement('div');
  const root = createRoot(node);

  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/dashboard/projects']}>
        <DashboardLayout title="Proyectos">
          <p>Listado</p>
        </DashboardLayout>
      </MemoryRouter>
    );
  });

  expect(node.querySelector('header')).toBeNull();
  expect(node.textContent).not.toContain('Workspace');
  expect(node.textContent).not.toContain('Oportunidades');
  expect(node.querySelector('[data-testid="dashboard-sidebar"]').className).toContain('overflow-hidden');

  act(() => root.unmount());
});
