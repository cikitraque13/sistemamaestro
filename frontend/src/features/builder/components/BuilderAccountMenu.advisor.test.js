import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import BuilderAccountMenu from './BuilderAccountMenu';

const mocks = vi.hoisted(() => ({
  logout: vi.fn(async () => {}),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Lucas Diaz', email: 'lucas@example.test', credit_balance: 574 },
    logout: mocks.logout,
  }),
}));

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

const mount = (advisorConfig) => {
  const node = document.createElement('div');
  document.body.appendChild(node);
  const root = createRoot(node);
  act(() => {
    root.render(
      <MemoryRouter>
        <BuilderAccountMenu advisorConfig={advisorConfig} />
      </MemoryRouter>
    );
  });
  return { root, unmount: () => act(() => root.unmount()) };
};

const openMenu = async () => {
  const trigger = document.querySelector('[data-testid="builder-account-menu"]');
  act(() => activate(trigger));
  await flush();
  return trigger;
};

test('flag off keeps the advisor row visible and non-functional', async () => {
  const view = mount({ enabled: false, bookingUrl: 'https://booking.example.test/30', photoUrl: '', testimonials: [] });
  await openMenu();
  const advisor = document.querySelector('[data-testid="builder-account-advisor"]');
  expect(advisor.textContent).toContain('Conoce a tu asesor');
  expect(advisor.textContent).toContain('Próximamente');
  expect(advisor.getAttribute('aria-disabled')).toBe('true');
  act(() => activate(advisor));
  await flush();
  expect(document.querySelector('[data-testid="advisor-flow-panel"]')).toBeNull();
  expect(document.querySelector('[data-testid="advisor-booking"]')).toBeNull();
  expect(document.querySelector('[data-testid="advisor-chat"]')).toBeNull();
  view.unmount();
});

test('flag on replaces the próximamente row and opens the advisor panel', async () => {
  const view = mount({
    enabled: true,
    bookingUrl: '',
    photoUrl: '',
    testimonials: [],
  });
  await openMenu();
  const advisor = document.querySelector('[data-testid="builder-account-advisor"]');
  expect(advisor.textContent).toContain('Conoce a tu asesor');
  expect(advisor.textContent).not.toContain('Próximamente');
  expect(advisor.getAttribute('aria-disabled')).not.toBe('true');
  expect(document.querySelector('[data-testid="builder-account-help"]').textContent).toContain('Próximamente');

  act(() => activate(advisor));
  await flush();

  const panel = document.querySelector('[data-testid="advisor-flow-panel"]');
  expect(panel).not.toBeNull();
  expect(panel.getAttribute('data-advisor-state')).toBe('on');
  expect(panel.textContent).toContain('Charlar con Nova');
  expect(document.querySelector('[data-testid="advisor-booking"]').disabled).toBe(true);
  expect(document.querySelector('[data-testid="advisor-testimonials"]')).toBeNull();
  view.unmount();
});
