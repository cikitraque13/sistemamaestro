import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import ExecutorChat, { executorStatusText } from './ExecutorChat';

test('terminal copy names the error and the completed page', () => {
  expect(executorStatusText('error', 'No tienes gemas suficientes. Planes: /dashboard/billing'))
    .toBe('Error. No tienes gemas suficientes. Planes: /dashboard/billing');
  expect(executorStatusText('completado', 'Página guardada.')).toBe('Completado. Página guardada.');
  expect(executorStatusText('error', 'La generación no responde. No se ha publicado nada.'))
    .toContain('no responde');
});

test('the executor shows error or completed instead of a spinner label', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => {
    root.render(
      <ExecutorChat
        phase="error"
        message="No tienes gemas suficientes. Planes: /dashboard/billing"
      />,
    );
  });
  expect(node.textContent).toContain('Error.');
  expect(node.textContent).toContain('No tienes gemas suficientes');
  expect(node.textContent).toContain('/dashboard/billing');
  act(() => {
    root.render(<ExecutorChat phase="completado" message="Página guardada." />);
  });
  expect(node.textContent).toContain('Completado.');
  expect(node.textContent).toContain('Página guardada.');
  expect(node.textContent).not.toContain('Pensando');
  act(() => root.unmount());
});

test('working states show Pensando and the empty state offers suggestions', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  const sent = [];
  act(() => {
    root.render(<ExecutorChat phase="idle" log={[]} onSubmit={(value) => sent.push(value)} />);
  });
  const chips = [...node.querySelectorAll('[data-testid="builder-suggestion"]')];
  expect(chips.length).toBeGreaterThan(0);
  expect(node.querySelector('[data-testid="builder-thinking"]')).toBeNull();
  act(() => { chips[0].click(); });
  expect(sent[0]).toBe(chips[0].textContent);
  act(() => {
    root.render(
      <ExecutorChat
        phase="construyendo"
        message="Construyendo tu página."
        log={[{ role: 'user', text: 'Clara en Madrid' }, { role: 'agent', text: 'Estoy en la primera sección.' }]}
        slow
      />,
    );
  });
  expect(node.querySelector('[data-testid="builder-thinking"]').textContent).toContain('Pensando');
  expect(node.querySelector('[data-testid="builder-user-bubble"]').className).toContain('text-right');
  expect(node.querySelector('[data-testid="builder-agent-message"]').textContent).toContain('SM');
  expect(node.textContent).not.toContain('Completado');
  const thread = node.querySelector('[data-testid="builder-executor-thread"]');
  expect(thread.className).toContain('overflow-y-auto');
  expect(node.querySelector('[aria-label="Ejecutor"]').className).toContain('overflow-hidden');
  act(() => {
    root.render(<ExecutorChat phase="error" message="No se ha podido preparar la preview." />);
  });
  expect(node.querySelector('[data-testid="builder-thinking"]')).toBeNull();
  expect(node.textContent).toContain('Error.');
  expect(node.textContent).not.toContain('Completado');
  act(() => {
    root.render(<ExecutorChat phase="iterando" message="Iterando sobre la versión guardada." />);
  });
  expect(node.querySelector('[data-testid="builder-thinking"]')).not.toBeNull();
  act(() => root.unmount());
});
