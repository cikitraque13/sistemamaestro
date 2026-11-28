import { bootEmbed, isPublicKey, mountLauncher } from './loaderCore';

const KEY = 'pk_testpagekeytestpagekeytestpagekey12';

function scriptElement() {
  const script = document.createElement('script');
  script.src = 'https://sistemamaestro.com/embed/agent.js';
  script.setAttribute('data-agent-key', KEY);
  document.body.appendChild(script);
  return script;
}

beforeEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

test('la clave de test tiene el formato público', () => {
  expect(isPublicKey(KEY)).toBe(true);
  expect(isPublicKey('sk_secret')).toBe(false);
  expect(isPublicKey('pk_short')).toBe(false);
});

test('el launcher no filtra CSS al documento y abre el iframe con el token', async () => {
  const script = scriptElement();
  const fetchImpl = vi.fn(async (url, init) => {
    expect(url).toBe('https://sistemamaestro.com/api/public/embed/config');
    expect(url).not.toContain(KEY);
    expect(init.credentials).toBe('omit');
    expect(init.headers['X-Embed-Key']).toBe(KEY);
    return {
      ok: true,
      status: 200,
      json: async () => ({ frame_token: 'frame-token-1', name: 'BiciSur', provider: 'grok' }),
    };
  });

  const host = mountLauncher(document, { key: KEY, script, fetchImpl });
  expect(document.querySelector('style')).toBeNull();
  expect(document.querySelector('link')).toBeNull();
  expect(host.shadowRoot.querySelector('style')).toBeTruthy();
  expect(host.className).toBe('');

  host.shadowRoot.querySelector('[data-embed-launcher]').click();
  await vi.waitFor(() => {
    expect(host.shadowRoot.querySelector('iframe').getAttribute('src')).toBeTruthy();
  });
  const src = host.shadowRoot.querySelector('iframe').getAttribute('src');
  expect(src).toBe('https://sistemamaestro.com/embed/frame.html#frame-token-1');
  expect(src).not.toContain('pk_');
  expect(host.shadowRoot.querySelector('iframe').getAttribute('allow')).toBe('microphone');
  expect(document.querySelector('style')).toBeNull();
});

test('boot no monta dos veces y rechaza una clave inválida', () => {
  const script = scriptElement();
  const fetchImpl = vi.fn();
  const view = { document, fetch: fetchImpl };
  const first = bootEmbed(view);
  const second = bootEmbed(view);
  expect(first).toBeTruthy();
  expect(second).toBeNull();
  expect(document.querySelectorAll('[data-sistemamaestro-embed]')).toHaveLength(1);
  expect(script.getAttribute('data-embed-mounted')).toBe('1');

  document.body.innerHTML = '';
  const bad = document.createElement('script');
  bad.src = 'https://sistemamaestro.com/embed/agent.js';
  bad.setAttribute('data-agent-key', 'pk_no');
  document.body.appendChild(bad);
  expect(bootEmbed({ document, fetch: fetchImpl })).toBeNull();
});
