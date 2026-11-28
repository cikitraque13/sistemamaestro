function requestUrl(input) {
  if (typeof input === 'string') return input;
  if (input && typeof input.url === 'string') return input.url;
  return '';
}

export function rewriteVoiceRequest(url) {
  const value = String(url || '');
  if (value.endsWith('/public/nova-voice/website-analysis')) return { kind: 'blocked' };
  if (value.endsWith('/public/nova-voice/diag')) return { kind: 'redirect', path: '/public/embed/diag' };
  if (value.endsWith('/public/nova-voice/session')) return { kind: 'redirect', path: '/public/embed/session' };
  if (value.endsWith('/public/nova-voice')) return { kind: 'redirect', path: '/public/embed/config' };
  return { kind: 'pass' };
}

export function installVoiceBridge({ fetchImpl, apiBase, frameToken }) {
  const base = String(apiBase || '').replace(/\/$/, '');
  return (input, init = {}) => {
    const decision = rewriteVoiceRequest(requestUrl(input));
    if (decision.kind === 'blocked') {
      return Promise.resolve(new Response(JSON.stringify({
        ok: false,
        registered: false,
        message: 'Esta función no está disponible en el agente incrustado.',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    if (decision.kind === 'redirect') {
      const headers = new Headers(init.headers || undefined);
      headers.set('X-Embed-Frame', frameToken);
      if (!headers.has('Accept')) headers.set('Accept', 'application/json');
      return fetchImpl(`${base}${decision.path}`, {
        ...init,
        headers,
        credentials: 'omit',
      });
    }
    return fetchImpl(input, init);
  };
}
