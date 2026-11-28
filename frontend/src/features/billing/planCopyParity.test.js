import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(async (url) => {
      if (String(url).includes('/user/billing')) {
        return {
          data: {
            current_plan: { id: 'sistema', name: 'Growth', included_credits: 220 },
            credit_summary: {
              enabled: true,
              balance: 128,
              included_credits_for_current_plan: 220,
            },
            transactions: [],
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
import HomePlansPanel from '../home/components/HomePlansPanel';
import { planDisplayCopyById } from '../../content/planDisplayCopy';
import { pricingPlans } from '../../content/pricingContent';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PAID_PLAN_IDS = ['blueprint', 'sistema', 'premium'];
const PRICES = { free: 0, blueprint: 29, sistema: 79, premium: 199 };

const flush = async () => {
  await act(async () => {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
  });
};

const readBackendGemDefaults = () => {
  const configPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../backend/app/core/config.py'
  );
  const source = readFileSync(configPath, 'utf8');
  const block = source.match(/PLAN_INCLUDED_CREDITS = \{([\s\S]*?)\n\}/);
  if (!block) throw new Error('PLAN_INCLUDED_CREDITS not found');

  const defaults = {};
  for (const match of block[1].matchAll(/"(\w+)":\s*int\(os\.environ\.get\("[^"]+",\s*"(\d+)"\)\)/g)) {
    defaults[match[1]] = Number(match[2]);
  }
  return defaults;
};

const readHomeCards = (node) =>
  [...node.querySelectorAll('article')].map((article) => {
    const bullets = [...article.querySelectorAll('li')].map((item) =>
      item.textContent.replace(/•/g, '').trim()
    );

    return {
      name: article.querySelector('p').textContent.trim(),
      tagline: article.querySelector('p.mt-4').textContent.trim(),
      badge: article.querySelector('span.uppercase')?.textContent.trim() || '',
      gems: bullets.find((item) => /gemas/i.test(item)) || '',
      bullets,
    };
  });

test('home and facturación render the same names, taglines and gems', async () => {
  const gemDefaults = readBackendGemDefaults();
  expect(gemDefaults).toEqual({ free: 10, blueprint: 60, sistema: 220, premium: 600 });

  for (const plan of pricingPlans) {
    expect(plan.creditsIncluded).toBe(gemDefaults[plan.id]);
    expect(plan.price).toBe(PRICES[plan.id]);
  }
  expect(pricingPlans.map((plan) => plan.id)).toEqual(['free', 'blueprint', 'sistema', 'premium']);
  expect(pricingPlans.find((plan) => plan.id === 'premium').visibleName).toBe('AI Master');

  const homeNode = document.createElement('div');
  const homeRoot = createRoot(homeNode);
  await act(async () => {
    homeRoot.render(
      <MemoryRouter>
        <HomePlansPanel />
      </MemoryRouter>
    );
  });

  expect(homeNode.textContent).toContain('La suscripción abre el sistema.');
  const homeCards = readHomeCards(homeNode);
  expect(homeCards.map((card) => card.name)).toEqual(['Gratis', 'Pro', 'Growth', 'AI Master']);

  for (const card of homeCards) {
    const plan = pricingPlans.find((item) => item.visibleName === card.name);
    const copy = planDisplayCopyById[plan.id];
    expect(card.tagline).toBe(copy.tagline);
    expect(card.gems).toBe(copy.gemsLine);
    expect(card.bullets).toEqual(copy.bullets);
    expect(card.gems).toContain(String(gemDefaults[plan.id]));
    expect(card.badge).toBe(copy.badge || '');
  }

  const billingNode = document.createElement('div');
  const billingRoot = createRoot(billingNode);
  await act(async () => {
    billingRoot.render(
      <MemoryRouter initialEntries={['/dashboard/billing']}>
        <BillingPage />
      </MemoryRouter>
    );
  });
  await flush();

  expect(billingNode.querySelector('[data-testid="plan-card-free"]')).toBeNull();

  for (const id of PAID_PLAN_IDS) {
    const copy = planDisplayCopyById[id];
    const home = homeCards.find((card) => card.name === copy.name);
    const card = billingNode.querySelector(`[data-testid="plan-card-${id}"]`);
    const bullets = [...card.querySelectorAll('li')].map((item) => item.textContent.trim());

    expect(card.querySelector(`[data-testid="plan-name-${id}"]`).textContent).toBe(home.name);
    expect(card.querySelector(`[data-testid="plan-tagline-${id}"]`).textContent).toBe(home.tagline);
    expect(card.querySelector(`[data-testid="plan-gems-${id}"]`).textContent).toBe(home.gems);
    expect(bullets).toEqual(home.bullets);
    expect(card.textContent).toContain(copy.priceLabel);
  }

  const growth = billingNode.querySelector('[data-testid="plan-card-sistema"]');
  const pro = billingNode.querySelector('[data-testid="plan-card-blueprint"]');
  const master = billingNode.querySelector('[data-testid="plan-card-premium"]');

  expect(growth.getAttribute('data-highlight')).toBe('true');
  expect(growth.querySelector('[data-testid="plan-badge-sistema"]').textContent).toBe('Núcleo');
  expect(growth.textContent).toContain('Actual');
  expect(growth.textContent).not.toContain('Núcleo operativo');
  expect(pro.getAttribute('data-highlight')).toBe('false');
  expect(pro.textContent).not.toContain('Recomendado');
  expect(pro.textContent).not.toContain('Entrada seria');
  expect(master.querySelector('[data-testid="plan-badge-premium"]').textContent).toBe('Superior');
  expect(master.querySelector('[data-testid="plan-name-premium"]').textContent).toBe('AI Master');
  expect(master.textContent).not.toContain('AI Master 199');
  expect(master.textContent).not.toContain('Nivel maestro');
  expect(billingNode.textContent).not.toContain('AI Auditor');

  act(() => {
    homeRoot.unmount();
    billingRoot.unmount();
  });
});
