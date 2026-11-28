import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('../../../lib/apiClient', () => ({
  api: {
    get: mocks.get,
    post: mocks.post,
    patch: mocks.patch,
  },
}));

import EmbedInstallStep from './EmbedInstallStep';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SNIPPET = '<script src="https://sistemamaestro.com/embed/agent.js" data-agent-key="pk_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" async></script>';

const agent = {
  agent_id: 'emb_bici123456',
  project_id: 'proj_bici',
  key: 'pk_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  name: 'BiciSur',
  greeting: 'Hola, soy BiciSur, un asistente de inteligencia artificial.',
  allowed_origins: ['https://bici.example'],
  active: true,
  snippet: SNIPPET,
};

beforeEach(() => {
  mocks.get.mockReset();
  mocks.post.mockReset();
  mocks.patch.mockReset();
  mocks.get.mockResolvedValue({ data: agent });
  navigator.clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
});

async function renderStep() {
  const node = document.createElement('div');
  const root = createRoot(node);
  await act(async () => {
    root.render(<EmbedInstallStep projectId="proj_bici" />);
  });
  return { node, root };
}

test('el paso de instalación muestra el fragmento y las instrucciones', async () => {
  const { node, root } = await renderStep();
  const step = node.querySelector('[data-testid="embed-install-step"]');
  expect(step.querySelector('h2').textContent).toBe('Instalar en tu web');
  expect(step.querySelector('[data-testid="embed-snippet"]').textContent).toBe(SNIPPET);
  expect(step.querySelector('[data-testid="embed-snippet"]').textContent).toContain('data-agent-key="pk_');
  const instructions = step.querySelector('[data-testid="embed-instructions"]').textContent;
  expect(instructions).toContain('</body>');
  expect(instructions).toContain('No conecta WhatsApp, no reserva citas y no atiende llamadas.');
  expect(instructions).not.toContain('automatiza el WhatsApp');
  expect(step.textContent).toContain('No es un secreto');
  expect(step.querySelector('[data-testid="embed-origin"]').value).toBe('https://bici.example');
  act(() => root.unmount());
});

test('el botón Copiar deja el fragmento en el portapapeles y confirma', async () => {
  const { node, root } = await renderStep();
  const button = node.querySelector('[data-testid="embed-copy"]');
  expect(button.textContent).toBe('Copiar');
  await act(async () => {
    button.click();
  });
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SNIPPET);
  expect(button.textContent).toBe('Copiado');
  act(() => root.unmount());
});
