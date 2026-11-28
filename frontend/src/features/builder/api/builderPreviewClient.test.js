import {
  PREVIEW_STREAM_COPY,
  notePreviewProgress,
  parseSseBuffer,
  previewStreamStalled,
  stepNeedsPatience,
  streamLandingPreview,
  streamTerminalState,
  streamWatchdog,
} from './builderPreviewClient';

test('sse frames become step and section events and skip heartbeats', () => {
  const buffer = [
    ': heartbeat',
    '',
    'event: step',
    'data: {"id":"entender","label":"Entendiendo tu negocio","status":"done","summary":"Clara"}',
    '',
    'event: section',
    'data: {"index":0,"title":"La consulta","html":"<h1>Clara</h1>"}',
    '',
    'event: step',
    'data: {"id":"textos","status":"in_progress"}',
  ].join('\n');
  const parsed = parseSseBuffer(buffer);
  expect(parsed.rest).toContain('in_progress');
  expect(parsed.events).toHaveLength(2);
  expect(parsed.events[0].label).toBe('Entendiendo tu negocio');
  expect(parsed.events[1].html).toContain('Clara');
});

test('a step is patient only after twenty seconds', () => {
  expect(stepNeedsPatience(1_000, 20_000)).toBe(false);
  expect(stepNeedsPatience(1_000, 21_000)).toBe(true);
  expect(stepNeedsPatience(undefined, 50_000)).toBe(false);
});

test('heartbeats do not keep a quiet stream alive', () => {
  const started = 1_000;
  const afterBeats = notePreviewProgress({ type: 'heartbeat' }, started, 20_000);
  expect(afterBeats).toBe(started);
  expect(previewStreamStalled(afterBeats, 20_000, 15_000)).toBe(true);
  const moved = notePreviewProgress({ type: 'step', id: 'textos' }, started, 20_000);
  expect(previewStreamStalled(moved, 20_000, 15_000)).toBe(false);
});

test('notice stays open and error or done closes the run', () => {
  const pending = streamTerminalState({
    type: 'notice',
    code: 'pending_charge',
    message: PREVIEW_STREAM_COPY.pending,
  });
  expect(pending.terminal).toBe(false);
  expect(pending.notice).toBe('Cobro pendiente de confirmar');

  const broke = streamTerminalState({
    type: 'error',
    code: 'insufficient_gems',
    message: 'No tienes gemas suficientes',
    plansUrl: '/dashboard/billing',
  });
  expect(broke).toMatchObject({ terminal: true, phase: 'error' });
  expect(broke.message).toContain('No tienes gemas suficientes');
  expect(broke.message).toContain('/dashboard/billing');

  const duplicate = streamTerminalState({
    type: 'error',
    code: 'duplicate_run',
    message: PREVIEW_STREAM_COPY.duplicate,
  });
  expect(duplicate.phase).toBe('error');
  expect(duplicate.message).toMatch(/curso|clave/);

  const done = streamTerminalState({ type: 'done', html: '<h1>Clara</h1>', summary: 'Clara' });
  expect(done).toMatchObject({ terminal: true, phase: 'completado', message: 'Clara' });

  const timedOut = streamTerminalState({ type: 'timeout' });
  expect(timedOut.phase).toBe('error');
  expect(timedOut.message).toBe('La generación no responde. No se ha publicado nada.');
});

test('a stream of only heartbeats becomes a timeout instead of spinning', async () => {
  const previous = streamWatchdog.ms;
  streamWatchdog.ms = 40;
  const encoder = new TextEncoder();
  const seen = [];
  const heartbeat = encoder.encode(': heartbeat\n\n');
  global.fetch = vi.fn(async () => ({
    ok: true,
    body: {
      getReader: () => ({
        read: () => new Promise((resolve) => {
          setTimeout(() => resolve({ done: false, value: heartbeat }), 15);
        }),
        cancel: async () => {},
      }),
    },
  }));
  try {
    await expect(streamLandingPreview(
      { project_id: 'proj-watch', updated_at: '0' },
      'Clara',
      (event) => seen.push(event),
    )).rejects.toThrow(/no responde/i);
  } finally {
    streamWatchdog.ms = previous;
  }
  expect(seen.some((event) => event.type === 'timeout')).toBe(true);
  expect(seen.some((event) => event.type === 'done')).toBe(false);
});
