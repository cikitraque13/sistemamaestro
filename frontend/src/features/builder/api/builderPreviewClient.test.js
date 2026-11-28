import { parseSseBuffer, stepNeedsPatience } from './builderPreviewClient';

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
