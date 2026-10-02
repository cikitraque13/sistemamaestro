import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';
import BuilderWorkspacePage from './BuilderWorkspacePage';
import { api } from '../../../lib/apiClient';
const mocks = vi.hoisted(() => ({
  mockUser: null,
  mockProps: null,
  mockLocation: { search: '?project_id=p', state: { initialPrompt: 'unowned navigation text' } },
  mockNavigate: vi.fn(),
}));
vi.mock('react-router-dom', () => ({ useLocation: () => mocks.mockLocation, useNavigate: () => mocks.mockNavigate }));
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: mocks.mockUser }) }));
vi.mock('../../../lib/apiClient', () => ({ api: { get: vi.fn() } }));
vi.mock('../../../lib/economicRequest', () => ({ economicPost: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('../../app-shell/layout/AppShellLayout', () => ({ __esModule: true, default: ({ children }) => children }));
vi.mock('./BuilderWorkspaceLayout', () => ({ __esModule: true, default: (props) => { mocks.mockProps = props; return <div>{props.ownerId}:{props.project?.input_content}</div>; } }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
test('session user_id binds owner; account switch refetches and rejects late previous response', async () => {
  const node = document.createElement('div'); const root = createRoot(node);
  let resolveAlice;
  api.get.mockImplementationOnce(() => new Promise((resolve) => { resolveAlice = resolve; }))
    .mockResolvedValueOnce({ data: { project_id: 'p', input_content: 'Bob project' } });
  mocks.mockUser = { user_id: 'alice' };
  await act(async () => { root.render(<BuilderWorkspacePage />); });
  expect(mocks.mockProps.ownerId).toBe('alice'); expect(mocks.mockProps.project).toBeNull();
  mocks.mockUser = { user_id: 'bob' };
  await act(async () => { root.render(<BuilderWorkspacePage />); });
  expect(api.get).toHaveBeenCalledTimes(2);
  expect(mocks.mockProps.ownerId).toBe('bob'); expect(mocks.mockProps.initialPrompt).toBe('Bob project');
  await act(async () => { resolveAlice({ data: { project_id: 'p', input_content: 'Alice private' } }); });
  expect(node.textContent).not.toContain('Alice private'); expect(mocks.mockProps.project.input_content).toBe('Bob project');
  mocks.mockUser = false; await act(async () => { root.render(<BuilderWorkspacePage />); });
  expect(node.textContent).toContain('sesión autenticada'); expect(node.textContent).not.toContain('Bob project');
  act(() => root.unmount());
});
