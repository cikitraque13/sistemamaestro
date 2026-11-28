import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { vi } from 'vitest';

import BuilderProjectSelect, { loadOwnerProjects } from './BuilderProjectSelect';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('../../../lib/apiClient', () => ({
  api: { get: (...args) => apiMocks.get(...args) },
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

beforeEach(() => {
  apiMocks.get.mockReset();
});

test('loadOwnerProjects follows the existing project cursor and drops duplicates', async () => {
  const get = vi.fn()
    .mockResolvedValueOnce({
      data: [{ project_id: 'a', input_content: 'Uno' }],
      headers: { get: (name) => (name === 'x-next-cursor' ? 'cursor-2' : '') },
    })
    .mockResolvedValueOnce({
      data: [
        { project_id: 'b', input_content: 'https://www.ejemplo.es/ruta' },
        { project_id: 'a', input_content: 'duplicado' },
      ],
      headers: {},
    });

  const projects = await loadOwnerProjects(get);

  expect(get).toHaveBeenNthCalledWith(1, '/projects', { params: { limit: 200 } });
  expect(get).toHaveBeenNthCalledWith(2, '/projects', { params: { limit: 200, cursor: 'cursor-2' } });
  expect(projects.map((item) => item.project_id)).toEqual(['a', 'b']);
});

test('the selector lists the owner projects and switches project id', async () => {
  apiMocks.get.mockResolvedValue({
    data: [
      { project_id: 'p', input_content: 'Clara, psicóloga en Madrid' },
      { project_id: 'q', input_content: 'Taller de bicicletas' },
    ],
    headers: {},
  });
  const onProjectChange = vi.fn();
  const node = document.createElement('div');
  document.body.appendChild(node);
  const root = createRoot(node);
  await act(async () => {
    root.render(
      <BuilderProjectSelect
        activeProjectId="p"
        projectItems={[{ id: 'p', label: 'Clara, psicóloga en Madrid' }]}
        onProjectChange={onProjectChange}
      />
    );
  });
  await flush();

  const trigger = document.querySelector('[data-testid="builder-project-select"]');
  expect(trigger.textContent).toBe('Proyectos ▾');
  expect(trigger.textContent).not.toContain('Clara');
  expect(apiMocks.get).toHaveBeenCalledWith('/projects', { params: { limit: 200 } });

  act(() => activate(trigger));
  await flush();
  const option = document.querySelector('[data-testid="builder-project-option-q"]');
  const current = document.querySelector('[data-testid="builder-project-option-p"]');
  expect(option.textContent).toContain('Taller de bicicletas');
  expect(current.getAttribute('aria-current')).toBe('true');
  act(() => activate(option));
  expect(onProjectChange).toHaveBeenCalledWith('q');

  act(() => root.unmount());
  node.remove();
});

test('a failed project list keeps the open project', async () => {
  apiMocks.get.mockRejectedValue(new Error('offline'));
  const node = document.createElement('div');
  document.body.appendChild(node);
  const root = createRoot(node);
  await act(async () => {
    root.render(
      <BuilderProjectSelect
        activeProjectId="p"
        projectItems={[{ id: 'p', label: 'Proyecto abierto ahora' }]}
        onProjectChange={() => {}}
      />
    );
  });
  await flush();

  const trigger = document.querySelector('[data-testid="builder-project-select"]');
  expect(trigger.textContent).toBe('Proyectos ▾');
  act(() => activate(trigger));
  await flush();
  expect(document.querySelector('[data-testid="builder-project-option-p"]').textContent).toContain('Proyecto abierto ahora');
  act(() => root.unmount());
  node.remove();
});

function RoutedProjects() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <div data-testid="builder-location">{`${location.pathname}${location.search}`}</div>
      <BuilderProjectSelect
        activeProjectId="p"
        projectItems={[
          { id: 'p', label: 'Clara' },
          { id: 'q', label: 'Taller' },
        ]}
        onProjectChange={(id) => navigate(`/dashboard/builder?project_id=${id}`)}
        onNewProject={() => navigate('/dashboard')}
      />
    </>
  );
}

test('choosing a project navigates and the menu closes on escape and outside click', async () => {
  apiMocks.get.mockResolvedValue({
    data: [
      { project_id: 'p', input_content: 'Clara' },
      { project_id: 'q', input_content: 'Taller' },
    ],
    headers: {},
  });
  const node = document.createElement('div');
  document.body.appendChild(node);
  const root = createRoot(node);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/dashboard/builder?project_id=p']}>
        <RoutedProjects />
      </MemoryRouter>,
    );
  });
  await flush();

  const trigger = document.querySelector('[data-testid="builder-project-select"]');
  expect(trigger.textContent).toBe('Proyectos ▾');
  act(() => activate(trigger));
  await flush();
  act(() => activate(document.querySelector('[data-testid="builder-project-option-q"]')));
  await flush();
  expect(document.querySelector('[data-testid="builder-location"]').textContent).toBe('/dashboard/builder?project_id=q');
  expect(document.querySelector('[data-testid="builder-project-options"]')).toBeNull();

  act(() => activate(trigger));
  await flush();
  act(() => {
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  expect(document.querySelector('[data-testid="builder-project-options"]')).toBeNull();

  act(() => activate(trigger));
  await flush();
  expect(document.querySelector('[data-testid="builder-project-new"]').textContent).toBe('Nuevo proyecto');
  act(() => {
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
  });
  expect(document.querySelector('[data-testid="builder-project-options"]')).toBeNull();

  act(() => activate(trigger));
  await flush();
  act(() => activate(document.querySelector('[data-testid="builder-project-new"]')));
  await flush();
  expect(document.querySelector('[data-testid="builder-location"]').textContent).toBe('/dashboard');

  act(() => root.unmount());
  node.remove();
});
