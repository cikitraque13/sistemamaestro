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
  act(() => root.unmount());
});
