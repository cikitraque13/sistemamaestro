import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { executorStatusText } from './ExecutorChat';
import MessageList from '../studio/components/MessageList';
import Composer from '../studio/components/Composer';

test('terminal copy names the error and the completed page', () => {
  expect(executorStatusText('error', 'No tienes gemas suficientes. Planes: /dashboard/billing'))
    .toBe('Error. No tienes gemas suficientes. Planes: /dashboard/billing');
  expect(executorStatusText('completado', 'Página guardada.')).toBe('Completado. Página guardada.');
  expect(executorStatusText('error', 'La generación no responde. No se ha publicado nada.'))
    .toContain('no responde');
});

test('the thread shows the error and a finished run without a spinner label', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => {
    root.render(
      <MessageList phase="error" message="No tienes gemas suficientes. Planes: /dashboard/billing" />,
    );
  });
  expect(node.textContent).toContain('No tienes gemas suficientes');
  expect(node.textContent).toContain('/dashboard/billing');
  act(() => {
    root.render(<MessageList phase="completado" message="Página guardada." preview={{ versions: [{ createdAt: '2026-11-28T06:28:00Z' }] }} />);
  });
  expect(node.textContent).toContain('Agente terminado');
  expect(node.textContent).not.toContain('Pensando');
  act(() => root.unmount());
});

test('working states show Pensando and the empty state offers suggestions', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  const sent = [];
  act(() => {
    root.render(<MessageList phase="idle" log={[]} onSuggest={(value) => sent.push(value)} />);
  });
  const chips = [...node.querySelectorAll('[data-testid="builder-suggestion"]')];
  expect(chips.length).toBeGreaterThan(0);
  expect(node.querySelector('[data-testid="builder-thinking"]')).toBeNull();
  act(() => { chips[0].click(); });
  expect(sent[0]).toBe(chips[0].textContent);
  act(() => {
    root.render(
      <MessageList
        phase="construyendo"
        message="Construyendo tu página."
        log={[{ role: 'user', text: 'Clara en Madrid' }, { role: 'agent', text: 'Estoy en la primera sección.' }]}
        slow
      />,
    );
  });
  expect(node.querySelector('[data-testid="builder-thinking"]').textContent).toContain('Pensando');
  expect(node.querySelector('[data-testid="builder-user-bubble"]').className).toContain('u');
  expect(node.querySelector('[data-testid="builder-agent-message"]').textContent).toContain('Estoy en la primera sección.');
  expect(node.textContent).not.toContain('Completado');
  const thread = node.querySelector('[data-testid="builder-executor-thread"]');
  expect(thread.className).toContain('studio-thread');
  act(() => {
    root.render(<MessageList phase="error" message="No se ha podido preparar la preview." />);
  });
  expect(node.querySelector('[data-testid="builder-thinking"]')).toBeNull();
  expect(node.textContent).not.toContain('Completado');
  act(() => {
    root.render(<MessageList phase="iterando" message="Iterando sobre la versión guardada." />);
  });
  expect(node.querySelector('[data-testid="builder-thinking"]')).not.toBeNull();
  act(() => root.unmount());
});

test('the composer shows the pace and never a model name', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  const paces = [];
  act(() => {
    root.render(
      <Composer
        draft=""
        pace="rapido"
        canSend={false}
        onPace={(pace) => paces.push(pace)}
        onDraft={() => {}}
        onSubmit={() => {}}
      />,
    );
  });
  expect(node.querySelector('[data-testid="builder-executor-input"]').getAttribute('placeholder')).toBe('Esperando tu próximo mensaje');
  expect(node.textContent).toContain('Modo rápido · 1 gema');
  expect(node.textContent).not.toMatch(/claude|sonnet|haiku|opus|grok/i);
  expect(node.querySelector('[aria-label="Enviar"]').disabled).toBe(true);
  act(() => root.unmount());
});
