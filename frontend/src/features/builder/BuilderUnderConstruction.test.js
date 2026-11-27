import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: { user_id: 'ada', role: 'user' },
  get: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}));
vi.mock('../../lib/apiClient', () => ({
  api: { get: mocks.get },
}));
vi.mock('../../components/DashboardLayout', () => ({
  default: ({ children, title }) => (
    <main>
      <h2>{title}</h2>
      {children}
    </main>
  ),
}));
vi.mock('./workspace/BuilderWorkspacePage', () => ({
  default: () => <div data-testid="builder-workspace">workspace</div>,
}));

import BuilderUnderConstruction from './BuilderUnderConstruction';
import BuilderRoute from './BuilderRoute';
import { builderEntryIsOpen } from './builderAccess';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  mocks.user = { user_id: 'ada', role: 'user' };
  mocks.get.mockReset();
  mocks.get.mockResolvedValue({ data: { builder_enabled: false } });
});

test('muestra la pantalla de construcción en español', async () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  await act(async () => {
    root.render(<BuilderUnderConstruction />);
  });

  const screen = node.querySelector('[data-testid="builder-under-construction"]');
  expect(screen.querySelector('h1').textContent).toBe('El Builder está en construcción');
  expect(screen.textContent).toContain(
    'Lo estamos terminando para que funcione de verdad. Mientras tanto, puedes hablar con Nova o contarnos tu proyecto.'
  );
  expect(screen.querySelector('a[href="/"]').textContent).toBe('Volver al inicio');
  expect(screen.querySelector('a[href="/#agencia-ia"]').textContent).toBe('Hablar con Nova');
  act(() => root.unmount());
});

test('la ruta del builder muestra la puerta y no el workspace cuando está cerrado', async () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  await act(async () => {
    root.render(<BuilderRoute />);
  });
  expect(node.querySelector('[data-testid="builder-under-construction"]')).toBeTruthy();
  expect(node.querySelector('[data-testid="builder-workspace"]')).toBeNull();
  expect(mocks.get).toHaveBeenCalledWith('/public/config');
  act(() => root.unmount());
});

test('un admin con el rol que ya existe entra al workspace sin mirar la bandera', async () => {
  mocks.user = { user_id: 'ada', role: ' Admin ' };
  const node = document.createElement('div');
  const root = createRoot(node);
  await act(async () => {
    root.render(<BuilderRoute />);
  });
  expect(node.querySelector('[data-testid="builder-workspace"]')).toBeTruthy();
  expect(mocks.get).not.toHaveBeenCalled();
  expect(await builderEntryIsOpen({ role: 'admin' })).toBe(true);
  act(() => root.unmount());
});
