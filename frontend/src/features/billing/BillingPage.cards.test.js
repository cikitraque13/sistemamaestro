import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(async (url) => {
      if (String(url).includes('/user/billing')) {
        return {
          data: {
            current_plan: { id: 'sistema', name: 'Growth', included_credits: 200 },
            credit_summary: {
              enabled: true,
              balance: 128,
              included_credits_for_current_plan: 200,
              lifetime_granted: 300,
              lifetime_used: 12,
            },
            transactions: [
              { transaction_id: 't1', payment_status: 'pending', amount: 29, created_at: '2026-11-20T10:00:00Z' },
            ],
          },
        };
      }
      return { data: {} };
    }),
    post: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Lucas Diaz', plan: 'sistema' },
    checkAuth: vi.fn(),
  }),
}));

vi.mock('../../lib/apiClient', () => ({
  api: { get: vi.fn(async () => ({ data: [], headers: {} })) },
}));

import BillingPage from './BillingPage';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

test('facturación renders only the plan cards inside the v5 shell', async () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/dashboard/billing']}>
        <BillingPage />
      </MemoryRouter>
    );
  });
  await flush();

  const text = node.textContent;
  expect(node.querySelector('[data-testid="plan-card-blueprint"]')).not.toBeNull();
  expect(node.querySelector('[data-testid="plan-card-sistema"]')).not.toBeNull();
  expect(node.querySelector('[data-testid="plan-card-premium"]')).not.toBeNull();
  expect(node.querySelector('[data-testid="plan-card-sistema"]').textContent).toContain('Actual');
  expect(node.querySelector('[data-testid="upgrade-btn-sistema"]').textContent).toContain('Plan actual');
  expect(node.querySelector('[data-testid="upgrade-btn-blueprint"]')).not.toBeNull();
  expect(node.querySelector('header')).toBeNull();
  expect(text).not.toContain('Workspace');
  expect(text).not.toContain('Historial de pagos');
  expect(text).not.toContain('Sistema Maestro Gold');
  expect(text).not.toContain('Saldo actual');
  expect(text).not.toContain('Oportunidades');
  expect(node.querySelector('[data-testid="dashboard-nav-facturacion"]').getAttribute('href')).toBe('/dashboard/billing');

  act(() => root.unmount());
});
