import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Lucas Diaz', plan: 'premium' },
    logout: vi.fn(),
  }),
}));

vi.mock('../../lib/apiClient', () => ({
  api: { get: (...args) => apiMocks.get(...args) },
}));

import AgentModulePage from './AgentModulePage';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

beforeEach(() => {
  window.localStorage.clear();
  apiMocks.get.mockImplementation((url) => {
    if (url === '/projects') {
      return Promise.resolve({
        data: [{ project_id: 'p1', input_content: 'Clara, psicóloga en Madrid' }],
        headers: {},
      });
    }
    if (url === '/projects/p1/bookings') {
      return Promise.resolve({
        data: {
          bookings: [{
            booking_id: 'bk_1',
            customer_name: 'Ana',
            contact: 'ana@example.com',
            slot_start: '2026-12-01T10:00:00.000Z',
            status: 'confirmed',
          }],
        },
      });
    }
    return Promise.resolve({ data: {}, headers: {} });
  });
});

test('voice and chat views list the active project bookings', async () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <AgentModulePage title="Agente de voz" />
      </MemoryRouter>
    );
  });
  await flush();

  expect(node.textContent).toContain('Próximamente');
  expect(node.textContent).not.toContain('Ana');

  await act(async () => {
    node.querySelector('[data-testid="agent-reservas-tab"]').dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
  });
  await flush();

  expect(apiMocks.get).toHaveBeenCalledWith('/projects/p1/bookings');
  expect(node.querySelector('[data-testid="agent-bookings"]').textContent).toContain('Ana');
  expect(node.querySelector('[data-testid="agent-bookings"]').textContent).toContain('Confirmada');
  expect(node.querySelector('[data-testid="dashboard-primary-nav"]').textContent).not.toContain('Reservas');

  act(() => root.unmount());
});
