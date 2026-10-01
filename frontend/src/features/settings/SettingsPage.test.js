import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: { name: 'Ada Lovelace', email: 'ada@example.test', created_at: null },
  checkAuth: vi.fn(),
  put: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

vi.mock('../../lib/apiClient', () => ({ api: { put: mocks.put } }));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, checkAuth: mocks.checkAuth }),
}));
vi.mock('../../components/DashboardLayout', () => ({
  default: ({ children }) => <main>{children}</main>,
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error, info: mocks.info },
}));

import SettingsPage from './SettingsPage';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('saves profile through the shared API client with the canonical relative path', async () => {
  mocks.put.mockResolvedValue({ data: {} });
  mocks.checkAuth.mockResolvedValue(undefined);
  const node = document.createElement('div');
  const root = createRoot(node);

  try {
    await act(async () => root.render(<SettingsPage />));
    await act(async () => {
      node.querySelector('form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
    });

    expect(mocks.put).toHaveBeenCalledWith('/user/profile', { name: 'Ada Lovelace' });
    expect(mocks.checkAuth).toHaveBeenCalledOnce();
    expect(mocks.success).toHaveBeenCalledWith('Perfil actualizado');
    expect(mocks.error).not.toHaveBeenCalled();
  } finally {
    act(() => root.unmount());
  }
});
