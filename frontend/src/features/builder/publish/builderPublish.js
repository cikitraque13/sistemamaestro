/** Client-side slug check. The server repeats it and is the one that decides. */

export const RESERVED_SLUGS = new Set([
  'www', 'api', 'app', 'admin', 'dashboard', 'mail',
  'ftp', 'smtp', 'imap', 'pop', 'pop3', 'ns', 'ns1', 'ns2', 'dns',
  'cdn', 'static', 'assets', 'blog', 'status', 'help', 'support',
  'docs', 'doc', 'dev', 'staging', 'stage', 'test', 'beta',
  'preview', 'auth', 'login', 'logout', 'account', 'accounts', 'billing',
  'pay', 'payments', 'stripe', 'webhook', 'webhooks', 'mx', 'mx1', 'mx2',
  'email', 'newsletter', 'nova', 'builder', 'public', 'health', 'files',
  'media', 'img', 'images', 'css', 'js', 'localhost', 'root',
  'sistemamaestro', 'sistema', 'maestro', 'home', 'about', 'legal',
  'privacy', 'terms', 'security', 'monitor', 'metrics', 'grafana',
  'autoconfig', 'autodiscover', 'cpanel', 'webmail', 'git', 'ssh', 'sftp',
  'vpn', 'internal', 'intranet', 'portal', 'studio', 'embed', 'agent',
  'agents', 'gems', 'gema', 'gemas', 'www2', 'm', 'mobile', 'origin',
  'edge', 'railway',
]);

export function validateSlug(raw) {
  const slug = String(raw || '').trim().toLowerCase();
  if (!slug) {
    return { ok: false, slug, code: 'empty', message: 'Escribe el nombre del subdominio.' };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, slug, code: 'reserved', message: 'Ese nombre está reservado.' };
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/.test(slug) || slug.includes('--')) {
    return {
      ok: false,
      slug,
      code: 'invalid',
      message: 'Usa entre 3 y 48 letras minúsculas, números o guiones, sin empezar ni terminar en guion.',
    };
  }
  return { ok: true, slug, code: '', message: '' };
}

export function publishStepsVisible({ publishLanding = false, hasPreview = false } = {}) {
  return Boolean(publishLanding && hasPreview);
}

export function targetOrPending(value) {
  const text = String(value || '').trim();
  if (text) return { value: text, pending: false };
  return { value: 'Valor pendiente de configuración. No mostramos un destino inventado.', pending: true };
}
