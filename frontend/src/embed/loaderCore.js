const KEY_RE = /^pk_[A-Za-z0-9_-]{32,80}$/;

export function isPublicKey(value) {
  return KEY_RE.test(String(value || '').trim());
}

export function scriptKey(script) {
  if (!script || typeof script.getAttribute !== 'function') return '';
  return String(script.getAttribute('data-agent-key') || '').trim();
}

export function findEmbedScript(doc) {
  const current = doc.currentScript;
  if (current && scriptKey(current)) return current;
  const scripts = Array.from(doc.querySelectorAll('script[data-agent-key]'));
  return (
    scripts.find((script) => /\/embed\/agent\.js(?:$|\?)/.test(script.getAttribute('src') || ''))
    || scripts[0]
    || null
  );
}

export function apiBaseFromScript(script) {
  try {
    const url = new URL(script.src, 'https://sistemamaestro.com');
    return `${url.origin}/api`;
  } catch {
    return 'https://sistemamaestro.com/api';
  }
}

export function framePageUrl(script, token) {
  const url = new URL(script.src, 'https://sistemamaestro.com');
  return `${url.origin}/embed/frame.html#${encodeURIComponent(token)}`;
}

function messageFor(status, data) {
  const detail = String((data && (data.detail || data.code)) || '');
  if (status === 403 && detail.includes('origin')) return 'Este dominio no está autorizado para el agente.';
  if (status === 403) return 'Este agente está desactivado.';
  if (status === 429) return 'Ahora mismo hay demasiadas sesiones. Prueba más tarde.';
  return 'Este agente no está disponible.';
}

const HOST_STYLE = [
  'all:initial',
  'display:block',
  'position:fixed',
  'right:16px',
  'bottom:16px',
  'z-index:2147483000',
  'width:min(420px, calc(100vw - 24px))',
  'font-family:Manrope, Segoe UI, sans-serif',
].join(';');

export function mountLauncher(doc, { key, script, fetchImpl }) {
  const host = doc.createElement('div');
  host.setAttribute('data-sistemamaestro-embed', '1');
  host.setAttribute('style', HOST_STYLE);
  const shadow = host.attachShadow({ mode: 'open' });

  const style = doc.createElement('style');
  style.textContent = [
    ':host{all:initial;}',
    '.panel{display:none;width:100%;height:680px;margin-top:8px;}',
    '.panel[data-open="1"]{display:block;}',
    'button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border:0;border-radius:999px;background:#5b21b6;color:#fff;font:600 15px/1 Manrope,Segoe UI,sans-serif;cursor:pointer;}',
    'iframe{width:100%;height:100%;border:0;border-radius:16px;background:#0a0a0a;}',
    'p{margin:8px 0 0;color:#fee2e2;font:14px/1.4 Manrope,Segoe UI,sans-serif;}',
  ].join('');

  const button = doc.createElement('button');
  button.type = 'button';
  button.setAttribute('data-embed-launcher', '1');
  button.textContent = 'Hablar';

  const panel = doc.createElement('div');
  panel.className = 'panel';
  panel.setAttribute('data-embed-panel', '1');

  const frame = doc.createElement('iframe');
  frame.title = 'Agente de voz';
  frame.setAttribute('allow', 'microphone');
  frame.setAttribute('referrerpolicy', 'no-referrer');
  frame.setAttribute('data-embed-frame', '1');

  const error = doc.createElement('p');
  error.hidden = true;
  error.setAttribute('data-embed-error', '1');

  panel.append(frame, error);
  shadow.append(style, button, panel);

  let pending = false;
  button.addEventListener('click', async () => {
    if (frame.getAttribute('src')) {
      const open = panel.getAttribute('data-open') === '1';
      panel.setAttribute('data-open', open ? '0' : '1');
      return;
    }
    if (pending) return;
    pending = true;
    button.disabled = true;
    try {
      const response = await fetchImpl(`${apiBaseFromScript(script)}/public/embed/config`, {
        method: 'GET',
        credentials: 'omit',
        headers: { Accept: 'application/json', 'X-Embed-Key': key },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data || !data.frame_token) {
        error.hidden = false;
        error.textContent = messageFor(response.status, data);
        panel.setAttribute('data-open', '1');
        return;
      }
      if (data.name) frame.title = `Agente de voz de ${data.name}`;
      frame.src = framePageUrl(script, data.frame_token);
      error.hidden = true;
      panel.setAttribute('data-open', '1');
    } catch {
      error.hidden = false;
      error.textContent = 'No se ha podido abrir el agente.';
      panel.setAttribute('data-open', '1');
    } finally {
      pending = false;
      button.disabled = false;
    }
  });

  doc.body.appendChild(host);
  return host;
}

export function bootEmbed(windowObject) {
  const doc = windowObject && windowObject.document;
  if (!doc || !doc.body) return null;
  const script = findEmbedScript(doc);
  if (!script || script.getAttribute('data-embed-mounted') === '1') return null;
  const key = scriptKey(script);
  if (!isPublicKey(key)) return null;
  script.setAttribute('data-embed-mounted', '1');
  const fetchImpl = (windowObject.fetch || globalThis.fetch).bind(windowObject);
  return mountLauncher(doc, { key, script, fetchImpl });
}
