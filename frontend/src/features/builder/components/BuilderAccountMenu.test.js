import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { realCreditBalance } from './BuilderAccountMenu';
import AppShellLayout from '../../app-shell/layout/AppShellLayout';

const mocks = vi.hoisted(() => ({
  user: {
    name: 'Lucas Diaz',
    email: 'lucas@example.test',
    credit_balance: 574,
    credit_lifetime_granted: 605,
  },
  logout: vi.fn(async () => {}),
  newProject: vi.fn(),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, logout: mocks.logout }),
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

function BuilderRoute({ screen }) {
  return (
    <MemoryRouter initialEntries={['/dashboard/builder?project_id=p']}>
      <Routes>
        <Route
          path="/dashboard/builder"
          element={(
            <AppShellLayout
              activeNavId="builder"
              credits={574}
              bonus={605}
              onNewProject={mocks.newProject}
              projectItems={[{ id: 'p', label: 'Proyecto', status: 'Abierto', accent: 'cyan' }]}
            >
              <div>{screen}</div>
            </AppShellLayout>
          )}
        />
        <Route path="/dashboard" element={<div>Nuevo proyecto abierto</div>} />
        <Route path="/dashboard/billing" element={<div>Pagina de planes</div>} />
        <Route path="/dashboard/settings" element={<div>Pagina de ajustes</div>} />
        <Route path="/" element={<div>Sesion cerrada</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const mount = (screen) => {
  const node = document.createElement('div');
  document.body.appendChild(node);
  const root = createRoot(node);
  act(() => root.render(<BuilderRoute screen={screen} />));
  return {
    node,
    root,
    rerender: (next) => act(() => root.render(<BuilderRoute screen={next} />)),
  };
};

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const openMenu = async () => {
  const trigger = document.querySelector('[data-testid="builder-account-menu"]');
  act(() => activate(trigger));
  await flush();
  return trigger;
};

beforeEach(() => {
  mocks.user = {
    name: 'Lucas Diaz',
    email: 'lucas@example.test',
    credit_balance: 574,
    credit_lifetime_granted: 605,
  };
  mocks.logout.mockClear();
  mocks.newProject.mockClear();
});

test('real balance ignores the lifetime grant figure', () => {
  expect(realCreditBalance({ credit_balance: 574, credit_lifetime_granted: 605 })).toBe('574');
  expect(realCreditBalance({ credit_lifetime_granted: 605 })).toBe('0');
  expect(realCreditBalance({ credit_balance: '574', credit_lifetime_granted: 605 })).toBe('574');
});

test('account menu renders on builder screens and shows only the real balance', async () => {
  const { root, rerender } = mount('Preview');
  const trigger = document.querySelector('[data-testid="builder-account-menu"]');

  const header = document.querySelector('[data-testid="builder-shell-header"]');
  const actions = header.querySelector('[data-testid="builder-header-actions"]');
  const mark = header.querySelector('[data-testid="builder-workspace-mark"]');

  expect(trigger).not.toBeNull();
  expect(actions.contains(trigger)).toBe(true);
  expect(mark.textContent).toContain('SM');
  expect(mark.textContent).toContain('Sistema Maestro');
  expect(mark.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(trigger.textContent).toContain('Lucas Diaz');
  expect(trigger.querySelector('[data-testid="builder-account-avatar"]').textContent).toBe('L');
  expect(trigger.querySelector('[data-testid="builder-account-photo"]')).toBeNull();
  expect(trigger.querySelector('span.hidden').className).toContain('sm:inline');
  expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  expect(trigger.getAttribute('aria-label')).toBe('Cuenta de Lucas Diaz');
  expect(header.textContent).not.toContain('Estado');
  expect(header.textContent).not.toContain('Proyecto abierto');
  expect(header.textContent).not.toContain('Nuevo proyecto');
  expect(header.querySelector('[data-testid="builder-header-upgrade"]').getAttribute('href')).toBe('/dashboard/billing');
  expect(document.body.textContent).not.toMatch(/\+\s*605/);
  expect(document.body.textContent).not.toContain('605');

  await openMenu();
  const panel = document.querySelector('[data-testid="builder-account-menu-panel"]');
  expect(panel).not.toBeNull();
  expect(panel.getAttribute('role')).toBe('menu');
  expect(panel.getAttribute('data-align')).toBe('end');
  expect(document.querySelector('[data-testid="builder-account-email"]').textContent).toBe('lucas@example.test');
  expect(document.querySelector('[data-testid="builder-account-workspace"]').textContent).toContain('Sistema Maestro');
  expect(document.querySelector('[data-testid="builder-account-workspace"]').textContent).toContain('Propietario');
  expect(panel.textContent).toContain('Créditos');
  expect(document.querySelector('[data-testid="builder-account-balance"]').textContent).toContain('574');
  expect(document.querySelector('[data-testid="builder-account-balance"]').textContent).not.toContain('605');
  expect(document.querySelector('[data-testid="builder-account-gems-info"]').getAttribute('aria-label')).toContain('saldo real');
  expect(panel.textContent).not.toContain('605');
  expect(panel.textContent).not.toMatch(/\+/);
  expect(panel.textContent).not.toContain('Idioma');
  expect(panel.textContent).not.toContain('GitHub');
  expect(panel.textContent).not.toContain('Comunidad');
  expect(document.querySelector('[data-testid="builder-account-upgrade"]').getAttribute('href')).toBe('/dashboard/billing');
  expect(document.querySelector('[data-testid="builder-account-manage-plan"]').getAttribute('href')).toBe('/dashboard/billing');
  expect(document.querySelector('[data-testid="builder-account-settings"]').getAttribute('href')).toBe('/dashboard/settings');
  expect(document.querySelector('[data-testid="builder-account-settings"]').textContent).toContain('Configuración de cuenta');
  expect(document.querySelector('[data-testid="builder-account-logout"]').className).toContain('text-red-400');

  const advisor = document.querySelector('[data-testid="builder-account-advisor"]');
  const help = document.querySelector('[data-testid="builder-account-help"]');
  expect(advisor.textContent).toContain('Conoce a tu asesor');
  expect(advisor.textContent).toContain('Próximamente');
  expect(advisor.getAttribute('aria-disabled')).toBe('true');
  expect(advisor.tagName).not.toBe('A');
  expect(help.textContent).toContain('Ayuda');
  expect(help.textContent).toContain('Próximamente');
  expect(help.getAttribute('aria-disabled')).toBe('true');
  expect(help.getAttribute('href')).toBeNull();

  mocks.user = { ...mocks.user, picture: 'https://example.test/lucas.png' };
  rerender('Preview');
  expect(document.querySelector('[data-testid="builder-account-photo"]').getAttribute('src')).toBe('https://example.test/lucas.png');
  mocks.user = { ...mocks.user, picture: 'javascript:alert(1)' };
  rerender('Preview');
  expect(document.querySelector('[data-testid="builder-account-photo"]')).toBeNull();
  expect(document.querySelector('[data-testid="builder-account-avatar"]').textContent).toBe('L');

  rerender('Extracción');
  expect(document.body.textContent).toContain('Extracción');
  expect(document.querySelector('[data-testid="builder-account-menu"]').textContent).toContain('Lucas Diaz');
  expect(document.body.textContent).not.toMatch(/\+\s*605/);
  expect(document.querySelector('[data-testid="builder-shell-header"]').textContent).not.toContain('Estado');

  act(() => root.unmount());
});

test('escape and an outside click close the account menu', async () => {
  const { root } = mount('Preview');
  const trigger = await openMenu();
  expect(trigger.getAttribute('aria-expanded')).toBe('true');

  act(() => {
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  expect(document.querySelector('[data-testid="builder-account-menu"]').getAttribute('aria-expanded')).toBe('false');
  expect(document.querySelector('[data-testid="builder-account-menu-panel"][data-state="open"]')).toBeNull();

  await openMenu();
  act(() => {
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
  });
  expect(document.querySelector('[data-testid="builder-account-menu"]').getAttribute('aria-expanded')).toBe('false');

  act(() => root.unmount());
});

test('keyboard opens the menu and moves to live actions', async () => {
  const { root } = mount('Preview');
  const trigger = document.querySelector('[data-testid="builder-account-menu"]');

  act(() => {
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  });
  await flush();
  expect(trigger.getAttribute('aria-expanded')).toBe('true');

  const upgrade = document.querySelector('[data-testid="builder-account-upgrade"]');
  await act(async () => {
    upgrade.focus();
    upgrade.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(document.activeElement?.getAttribute('data-testid')).not.toBe('builder-account-advisor');
  expect(document.activeElement?.getAttribute('data-testid')).not.toBe('builder-account-help');
  expect(document.activeElement?.textContent || '').toContain('Gestionar tu plan');

  act(() => root.unmount());
});

test('upgrade, settings and logout use the existing routes and session', async () => {
  const { root } = mount('Preview');
  await openMenu();

  await act(async () => {
    activate(document.querySelector('[data-testid="builder-account-upgrade"]'));
  });
  expect(document.body.textContent).toContain('Pagina de planes');

  act(() => root.unmount());

  const second = mount('Preview');
  await openMenu();
  await act(async () => {
    activate(document.querySelector('[data-testid="builder-account-new-project"]'));
  });
  expect(mocks.newProject).toHaveBeenCalledTimes(1);
  await openMenu();
  await act(async () => {
    activate(document.querySelector('[data-testid="builder-account-settings"]'));
  });
  expect(document.body.textContent).toContain('Pagina de ajustes');
  act(() => second.root.unmount());

  const third = mount('Preview');
  await openMenu();
  await act(async () => {
    activate(document.querySelector('[data-testid="builder-account-logout"]'));
  });
  expect(mocks.logout).toHaveBeenCalledTimes(1);
  expect(document.body.textContent).toContain('Sesion cerrada');
  act(() => third.root.unmount());
});

test('the non-builder shell does not render the account menu', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => {
    root.render(
      <AppShellLayout
        activeNavId="overview"
        userLabel="Cuenta principal"
        credits={574}
        bonus={605}
      />
    );
  });
  expect(node.querySelector('[data-testid="builder-account-menu"]')).toBeNull();
  expect(node.textContent).toContain('Cuenta principal');
  expect(node.textContent).toContain('Sistema Maestro');
  act(() => root.unmount());
});
