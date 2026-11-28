import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import AdvisorFlowPanel from './AdvisorFlowPanel';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};

const base = {
  enabled: true,
  bookingUrl: '',
  photoUrl: '',
  testimonials: [],
};

const mount = (config, open = true) => {
  const node = document.createElement('div');
  document.body.appendChild(node);
  const root = createRoot(node);
  const api = { open, onOpenChange: (next) => { api.open = next; } };
  const render = () => {
    act(() => {
      root.render(
        <AdvisorFlowPanel
          open={api.open}
          config={config}
          onOpenChange={(next) => {
            api.open = next;
            render();
          }}
        />
      );
    });
  };
  render();
  return {
    root,
    unmount: () => act(() => root.unmount()),
  };
};

test('flag off shows próximamente and no booking or chat action', () => {
  const view = mount({ ...base, enabled: false });
  const panel = document.querySelector('[data-testid="advisor-flow-panel"]');
  expect(panel.getAttribute('data-advisor-state')).toBe('off');
  expect(panel.textContent).toContain('Conoce a tu asesor');
  expect(panel.textContent).toContain('Próximamente');
  expect(document.querySelector('[data-testid="advisor-booking"]')).toBeNull();
  expect(document.querySelector('[data-testid="advisor-chat"]')).toBeNull();
  expect(document.querySelector('[data-testid="advisor-testimonials"]')).toBeNull();
  view.unmount();
});

test('flag on offers Nova chat and a disabled booking button when the url is missing', () => {
  const view = mount({ ...base, bookingUrl: 'javascript:alert(1)' });
  const panel = document.querySelector('[data-testid="advisor-flow-panel"]');
  expect(panel.getAttribute('data-advisor-state')).toBe('on');
  expect(panel.textContent).toContain('Charlar con Nova');
  expect(panel.textContent).toContain('Hablas con una persona real, en una llamada en vivo.');
  expect(panel.textContent).toContain('Puedes traer cualquier problema de tu aplicación.');
  expect(panel.textContent).toContain('Sales con el siguiente paso, claro.');
  expect(document.querySelector('[data-testid="advisor-booking-note"]').textContent).toContain('Gratis · 30 minutos · eliges el horario');

  const booking = document.querySelector('[data-testid="advisor-booking"]');
  expect(booking.tagName).toBe('BUTTON');
  expect(booking.disabled).toBe(true);
  expect(booking.getAttribute('href')).toBeNull();
  expect(document.querySelector('[data-testid="advisor-booking-unavailable"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="advisor-testimonials"]')).toBeNull();
  expect(document.querySelector('[data-testid="advisor-photo"]')).toBeNull();
  expect(document.querySelector('[data-testid="advisor-nova-avatar"]')).not.toBeNull();
  view.unmount();
});

test('a configured booking url is an external link and an empty testimonial list stays hidden', () => {
  const view = mount({
    ...base,
    bookingUrl: 'https://booking.example.test/30',
    photoUrl: 'https://cdn.example.test/advisor.png',
    testimonials: [{ quote: 'Sin nombre' }, { name: 'Sin cita' }],
  });
  const booking = document.querySelector('[data-testid="advisor-booking"]');
  expect(booking.tagName).toBe('A');
  expect(booking.getAttribute('href')).toBe('https://booking.example.test/30');
  expect(booking.getAttribute('target')).toBe('_blank');
  expect(booking.getAttribute('rel')).toContain('noopener');
  expect(document.querySelector('[data-testid="advisor-photo"]').getAttribute('src')).toBe('https://cdn.example.test/advisor.png');
  expect(document.querySelector('[data-testid="advisor-testimonials"]')).toBeNull();
  expect(document.body.textContent).not.toContain('Sin nombre');
  expect(document.body.textContent).not.toContain('Sin cita');
  view.unmount();
});

test('only configured testimonials render, and the carousel can move', () => {
  const view = mount({
    ...base,
    testimonials: [
      { id: '1', quote: 'Primera cita real.', name: 'Marta Ruiz', detail: 'Valencia' },
      { id: '2', quote: 'Segunda cita real.', name: 'Luis Ortega' },
    ],
  });
  const block = document.querySelector('[data-testid="advisor-testimonials"]');
  expect(block).not.toBeNull();
  expect(document.querySelector('[data-testid="advisor-testimonial-quote"]').textContent).toContain('Primera cita real.');
  expect(document.querySelector('[data-testid="advisor-testimonial-name"]').textContent).toContain('Marta Ruiz');
  expect(document.querySelector('[data-testid="advisor-testimonial-name"]').textContent).toContain('Valencia');

  act(() => {
    document.querySelector('[data-testid="advisor-testimonial-next"]').dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
  });
  expect(document.querySelector('[data-testid="advisor-testimonial-quote"]').textContent).toContain('Segunda cita real.');
  expect(document.querySelector('[data-testid="advisor-testimonial-name"]').textContent).toContain('Luis Ortega');
  expect(document.querySelector('[data-testid="advisor-testimonial-name"]').textContent).not.toContain('Valencia');
  view.unmount();
});

test('charlar con Nova focuses the existing builder chat and does nothing when it is absent', async () => {
  const input = document.createElement('input');
  input.setAttribute('data-testid', 'builder-executor-input');
  document.body.appendChild(input);

  const view = mount(base);
  await act(async () => {
    document.querySelector('[data-testid="advisor-chat"]').dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(document.activeElement).toBe(input);
  expect(document.querySelector('[data-testid="advisor-flow-panel"]')).toBeNull();
  view.unmount();
  input.remove();

  const closed = mount(base);
  act(() => {
    document.querySelector('[data-testid="advisor-chat"]').dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
  });
  expect(document.querySelector('[data-testid="advisor-chat-missing"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="advisor-flow-panel"]')).not.toBeNull();
  closed.unmount();
});

test('a broken advisor photo falls back to the Nova avatar', () => {
  const view = mount({ ...base, photoUrl: 'https://cdn.example.test/missing.png' });
  const image = document.querySelector('[data-testid="advisor-photo"]');
  act(() => {
    image.dispatchEvent(new Event('error'));
  });
  expect(document.querySelector('[data-testid="advisor-photo"]')).toBeNull();
  expect(document.querySelector('[data-testid="advisor-nova-avatar"]')).not.toBeNull();
  view.unmount();
});
