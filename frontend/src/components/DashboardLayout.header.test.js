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

import DashboardLayout from './DashboardLayout';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('dashboard header stays the workspace header', () => {
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

  const header = node.querySelector('header');
  expect(header).not.toBeNull();
  expect(header.className).toContain('sticky');
  expect(header.className).toContain('top-0');
  expect(header.className).toContain('z-30');
  expect(header.querySelector('p').textContent.trim()).toBe('Workspace');
  expect(header.querySelector('h1').textContent.trim()).toBe('Resumen');
  expect(header.textContent).toContain('Gratis');
  expect(header.textContent).toContain('Resumen');
  expect(header.querySelector('[data-testid="builder-account-menu"]')).toBeNull();
  expect(header.textContent).not.toContain('Mejorar plan');
  expect(header.textContent).not.toContain('Conoce a tu asesor');
  expect(header.textContent).not.toContain('Próximamente');
  expect(header.textContent).not.toContain('574');
  expect({
    className: header.className,
    text: header.textContent.replace(/\s+/g, ' ').trim(),
  }).toMatchSnapshot();

  act(() => root.unmount());
});
