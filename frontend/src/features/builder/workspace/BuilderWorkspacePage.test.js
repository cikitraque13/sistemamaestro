import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';
import BuilderWorkspacePage from './BuilderWorkspacePage';
import { api } from '../../../lib/apiClient';
const mocks = vi.hoisted(() => ({
  mockUser: null,
  mockProps: null,
  mockShellProps: null,
  mockLocation: { search: '?project_id=p', state: { initialPrompt: 'unowned navigation text' } },
  mockNavigate: vi.fn(),
}));
vi.mock('react-router-dom', () => ({ useLocation: () => mocks.mockLocation, useNavigate: () => mocks.mockNavigate }));
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: mocks.mockUser }) }));
vi.mock('../../../lib/apiClient', () => ({ api: { get: vi.fn() } }));
vi.mock('../../../lib/economicRequest', () => ({ economicPost: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../../app-shell/layout/AppShellLayout', () => ({ __esModule: true, default: (props) => { mocks.mockShellProps=props; return props.children; } }));
vi.mock('./BuilderWorkspaceLayout', () => ({ __esModule: true, default: (props) => { mocks.mockProps = props; return <div>{props.ownerId}:{props.project?.input_content}</div>; } }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(()=>{vi.clearAllMocks();mocks.mockLocation={search:'?project_id=p',state:{initialPrompt:'unowned navigation text'}};});
test('S15 A to B rejects late A; existing selection handler navigates instead of cache authority',async()=>{
 const root=createRoot(document.createElement('div'));let resolveA;
 mocks.mockUser={user_id:'alice'};mocks.mockLocation={search:'?project_id=A',state:null};
 api.get.mockImplementationOnce(()=>new Promise(resolve=>{resolveA=resolve;})).mockResolvedValueOnce({data:{project_id:'B',user_id:'alice',input_content:'B content'}});
 await act(async()=>root.render(<BuilderWorkspacePage/>));
 mocks.mockShellProps.onProjectChange('B');expect(mocks.mockNavigate).toHaveBeenCalledWith('/dashboard/builder?project_id=B',{state:{projectId:'B'}});
 mocks.mockLocation={search:'?project_id=B',state:{projectId:'B'}};
 await act(async()=>root.render(<BuilderWorkspacePage/>));expect(mocks.mockProps.project.project_id).toBe('B');
 await act(async()=>resolveA({data:{project_id:'A',user_id:'alice',input_content:'late A'}}));expect(mocks.mockProps.project.project_id).toBe('B');
 act(()=>root.unmount());
});
test('S15 cache cannot select, conflicting URL/state and foreign server identity never expose project',async()=>{
 const root=createRoot(document.createElement('div'));mocks.mockUser={user_id:'alice'};
 localStorage.setItem('sistema_maestro.active_builder_project_id','A');mocks.mockLocation={search:'',state:null};
 await act(async()=>root.render(<BuilderWorkspacePage/>));expect(api.get).not.toHaveBeenCalled();expect(mocks.mockProps.project).toBeNull();
 mocks.mockLocation={search:'?project_id=A',state:{projectId:'B'}};
 await act(async()=>root.render(<BuilderWorkspacePage/>));expect(api.get).not.toHaveBeenCalled();expect(mocks.mockProps.projectError).toBe('PROJECT_IDENTITY_INVALID');
 mocks.mockLocation={search:'?project_id=A',state:null};api.get.mockResolvedValueOnce({data:{project_id:'A',user_id:'bob'}});
 await act(async()=>root.render(<BuilderWorkspacePage/>));expect(mocks.mockProps.project).toBeNull();
 expect(localStorage.getItem('sistema_maestro.active_builder_project_id')).toBe('A');act(()=>root.unmount());
});
test('S15 A to B to A rejects a blueprint response from the first A selection', async () => {
  const { economicPost } = await import('../../../lib/economicRequest');
  const root = createRoot(document.createElement('div'));
  let resolveBlueprint;
  mocks.mockUser = { user_id: 'alice' };
  api.get.mockImplementation(async (path) => ({ data: { project_id: path.split('/').pop(), user_id: 'alice', updated_at: '2026-10-03T10:00:00Z' } }));
  economicPost.mockImplementationOnce(() => new Promise((resolve) => { resolveBlueprint = resolve; }));
  mocks.mockLocation = { search: '?project_id=A', state: null };
  await act(async () => root.render(<BuilderWorkspacePage />));
  const generateFromFirstA = mocks.mockProps.onGenerateBlueprint;
  await act(async () => { generateFromFirstA(); });

  mocks.mockLocation = { search: '?project_id=B', state: { projectId: 'B' } };
  await act(async () => root.render(<BuilderWorkspacePage />));
  mocks.mockLocation = { search: '?project_id=A', state: { projectId: 'A' } };
  await act(async () => root.render(<BuilderWorkspacePage />));
  expect(mocks.mockProps.project.updated_at).toBe('2026-10-03T10:00:00Z');

  await act(async () => resolveBlueprint({ data: { project_id: 'A', user_id: 'alice', updated_at: '2026-10-03T10:01:00Z' } }));
  expect(mocks.mockProps.project.updated_at).toBe('2026-10-03T10:00:00Z');
  act(() => root.unmount());
});
test('session user_id binds owner; account switch refetches and rejects late previous response', async () => {
  const node = document.createElement('div'); const root = createRoot(node);
  let resolveAlice;
  api.get.mockImplementationOnce(() => new Promise((resolve) => { resolveAlice = resolve; }))
    .mockResolvedValueOnce({ data: { user_id: 'bob', project_id: 'p', input_content: 'Bob project' } });
  mocks.mockUser = { user_id: 'alice' };
  await act(async () => { root.render(<BuilderWorkspacePage />); });
  expect(mocks.mockProps.ownerId).toBe('alice'); expect(mocks.mockProps.project).toBeNull();
  mocks.mockUser = { user_id: 'bob' };
  await act(async () => { root.render(<BuilderWorkspacePage />); });
  expect(api.get).toHaveBeenCalledTimes(2);
  expect(mocks.mockProps.ownerId).toBe('bob'); expect(mocks.mockProps.initialPrompt).toBe('Bob project');
  await act(async () => { resolveAlice({ data: { user_id: 'alice', project_id: 'p', input_content: 'Alice private' } }); });
  expect(node.textContent).not.toContain('Alice private'); expect(mocks.mockProps.project.input_content).toBe('Bob project');
  mocks.mockUser = false; await act(async () => { root.render(<BuilderWorkspacePage />); });
  expect(node.textContent).toContain('sesión autenticada'); expect(node.textContent).not.toContain('Bob project');
  act(() => root.unmount());
});
