import { installVoiceBridge, rewriteVoiceRequest } from './voiceBridge';

test('las peticiones de Nova se desvían al agente incrustado', () => {
  expect(rewriteVoiceRequest('https://sistemamaestro.com/api/public/nova-voice').path).toBe('/public/embed/config');
  expect(rewriteVoiceRequest('https://sistemamaestro.com/api/public/nova-voice/session').path).toBe('/public/embed/session');
  expect(rewriteVoiceRequest('https://sistemamaestro.com/api/public/nova-voice/diag').path).toBe('/public/embed/diag');
  expect(rewriteVoiceRequest('https://sistemamaestro.com/api/public/nova-voice/website-analysis').kind).toBe('blocked');
  expect(rewriteVoiceRequest('https://sistemamaestro.com/api/projects/1').kind).toBe('pass');
});

test('el puente manda el token efímero y no la clave del proveedor', async () => {
  const fetchImpl = vi.fn(async (url, init) => ({ url, init }));
  const bridged = installVoiceBridge({
    fetchImpl,
    apiBase: 'https://sistemamaestro.com/api',
    frameToken: 'frame-token-1',
  });

  const session = await bridged('https://sistemamaestro.com/api/public/nova-voice/session', { method: 'POST' });
  expect(session.url).toBe('https://sistemamaestro.com/api/public/embed/session');
  expect(session.init.credentials).toBe('omit');
  expect(session.init.headers.get('X-Embed-Frame')).toBe('frame-token-1');
  expect(session.url).not.toContain('grok');
  expect(session.url).not.toContain('pk_');

  const blocked = await bridged('https://sistemamaestro.com/api/public/nova-voice/website-analysis', { method: 'POST' });
  const body = await blocked.json();
  expect(body.registered).toBe(false);
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});
