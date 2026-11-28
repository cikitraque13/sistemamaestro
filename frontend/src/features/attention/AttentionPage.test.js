import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../../lib/apiClient', () => ({ API_BASE: 'https://sistemamaestro.com/api' }));

import AttentionPage from './AttentionPage';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => act(async () => {
  await Promise.resolve();
  await Promise.resolve();
});

function renderPage() {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/atencion/proj_clara']}>
        <Routes>
          <Route path="/atencion/:projectId" element={<AttentionPage />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return {
    node,
    unmount: () => act(() => root.unmount()),
  };
}

test('shows an honest closed desk and does not claim a booking', async () => {
  const calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    calls.push(String(url));
    return {
      ok: true,
      json: async () => ({
        project_id: 'proj_clara',
        title: 'Clínica Sol',
        chat: false,
        citas: false,
      }),
    };
  }));
  const { node, unmount } = renderPage();
  try {
    await flush();
    expect(calls).toEqual(['https://sistemamaestro.com/api/public/attention/proj_clara']);
    expect(node.textContent).toContain('Clínica Sol');
    expect(node.textContent).toContain('El asistente no está disponible ahora mismo.');
    expect(node.textContent).not.toContain('Cita reservada');
    expect(node.querySelector('form')).toBeNull();
    expect(node.textContent.toLowerCase()).not.toMatch(/grok|claude|gpt/);
  } finally {
    unmount();
    vi.unstubAllGlobals();
  }
});

test('sends the message to the public attendant and reports an empty day', async () => {
  const calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
    const target = String(url);
    calls.push({ url: target, method: options.method || 'GET', body: options.body });
    if (target.endsWith('/messages')) {
      return {
        ok: true,
        json: async () => ({ conversation_id: 'cv_12345678', reply: 'Te escribo enseguida.', booking_id: null }),
      };
    }
    if (target.includes('/availability')) {
      return { ok: true, json: async () => ({ day: '2027-01-04', slots: [] }) };
    }
    return {
      ok: true,
      json: async () => ({
        project_id: 'proj_clara',
        title: 'Clínica Sol',
        chat: true,
        citas: true,
      }),
    };
  }));
  const { node, unmount } = renderPage();
  try {
    await flush();
    const message = node.querySelector('#attention-message');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    await act(async () => {
      setter.call(message, 'Hola');
      message.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      node.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();
    expect(calls.some((call) => call.url.endsWith('/messages') && call.body.includes('"message":"Hola"'))).toBe(true);
    expect(node.textContent).toContain('Te escribo enseguida.');
    expect(node.textContent).not.toContain('Cita reservada');

    const day = node.querySelector('#attention-day');
    const daySetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    await act(async () => {
      daySetter.call(day, '2027-01-04');
      day.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const forms = node.querySelectorAll('form');
    await act(async () => {
      forms[1].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();
    expect(calls.some((call) => call.url.includes('/availability?day=2027-01-04'))).toBe(true);
    expect(node.textContent).toContain('Ese día no hay huecos libres.');
    expect(node.textContent).not.toContain('Cita reservada');
  } finally {
    unmount();
    vi.unstubAllGlobals();
  }
});
