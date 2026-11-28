import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Lucas Diaz', plan: 'premium' }, logout: vi.fn() }),
}));

vi.mock('../../lib/apiClient', () => ({
  api: {
    get: (...args) => apiMocks.get(...args),
    post: (...args) => apiMocks.post(...args),
    put: (...args) => apiMocks.put(...args),
    patch: (...args) => apiMocks.patch(...args),
  },
}));

import VoiceAgentPage from './VoiceAgentPage';
import ChatAgentPage from './ChatAgentPage';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const projects = [{ project_id: 'p1', input_content: 'Clínica norte' }];

beforeEach(() => {
  apiMocks.get.mockImplementation((url) => {
    if (url === '/projects') return Promise.resolve({ data: projects, headers: {} });
    if (String(url).includes('/modules')) {
      return Promise.resolve({ data: { modules: { chat: { enabled: true, settings: { widget_key: 'widget-key-123456' } } } } });
    }
    if (String(url).includes('/bookings')) return Promise.resolve({ data: { bookings: [] } });
    return Promise.resolve({ data: {}, headers: {} });
  });
  apiMocks.post.mockResolvedValue({ data: { snippet: '<script src="/embed/agent.js"></script>', agent_id: 'ag_1' } });
  apiMocks.patch.mockResolvedValue({ data: { snippet: '<script src="/embed/agent.js"></script>' } });
  apiMocks.put.mockResolvedValue({ data: { modules: { chat: { settings: { widget_key: 'widget-key-123456' } } } } });
});

async function render(nodeName) {
  const node = document.createElement('div');
  const root = createRoot(node);
  const Page = nodeName === 'voice' ? VoiceAgentPage : ChatAgentPage;
  await act(async () => {
    root.render(<MemoryRouter><Page /></MemoryRouter>);
  });
  await flush();
  return { node, unmount: () => act(() => root.unmount()) };
}

test('voice install uses the embed agent and does not pretend to place a call', async () => {
  const { node, unmount } = await render('voice');
  expect(node.textContent).toContain('No se puede elegir');
  expect(node.querySelector('button[disabled]').textContent).toContain('Llamada de prueba no disponible');

  const host = node.querySelector('[data-testid="voice-host"]');
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(host, 'tunegocio.com');
    host.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => {
    node.querySelector('[data-testid="voice-activate"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await flush();

  expect(apiMocks.post).toHaveBeenCalledWith('/embed/agents', {
    project_id: 'p1',
    allowed_origins: ['https://tunegocio.com'],
  });
  expect(node.querySelector('[data-testid="voice-snippet"]').textContent).toContain('agent.js');
  unmount();
});

test('chat keeps WhatsApp disconnected and can send a test turn', async () => {
  apiMocks.post.mockResolvedValue({ data: { reply: 'Hola desde el agente', conversation_id: 'cv_1' } });
  const { node, unmount } = await render('chat');
  expect(node.querySelector('[data-testid="chat-whatsapp"]').disabled).toBe(true);
  expect(node.textContent).toContain('Conectar WhatsApp');
  expect(node.querySelector('[data-testid="chat-brief"]').textContent).toContain('Clínica norte');

  const draft = node.querySelector('[data-testid="chat-draft"]');
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(draft, 'Hola');
    draft.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => {
    node.querySelector('[data-testid="chat-send"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await flush();

  expect(apiMocks.post).toHaveBeenCalledWith(
    '/agent/chat/p1/messages',
    { message: 'Hola' },
    { headers: { 'X-Widget-Key': 'widget-key-123456' } },
  );
  expect(node.querySelector('[data-testid="chat-reply"]').textContent).toContain('Hola desde el agente');
  unmount();
});
