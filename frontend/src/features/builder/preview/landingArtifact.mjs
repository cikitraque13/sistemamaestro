export const LANDING_RENDERER_VERSION = 'static-landing-v1';
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const text = (value, fallback = '') => typeof value === 'string' && value.trim() ? value : fallback;

// A static document, never arbitrary generated JS. All user content is text.
export function renderLandingArtifact(state, legacy = false) {
  if (state?.projectKind !== 'landing' || !state.projectId) throw new Error('UNSUPPORTED_ARTIFACT');
  const blocks = Array.isArray(state.blocks) ? state.blocks : [];
  const hero = blocks.find((block) => block.type === 'hero') || blocks[0];
  const title = text(hero?.props?.title, text(hero?.label, 'Tu proyecto'));
  const subtitle = text(hero?.props?.subtitle, text(hero?.props?.description));
  const cta = text(state.primaryCTA, text(state.ctas?.find((item) => item.intent === 'primary')?.label, 'Ver contenido'));
  const requestedTarget = state.ctas?.find((item) => item.intent === 'primary' || item.id === 'hero-primary-cta')?.href;
  const target = !legacy && requestedTarget && requestedTarget !== '#' ? requestedTarget : '#contenido';
  const version = !legacy && requestedTarget && requestedTarget !== '#' ? 'static-landing-v2' : LANDING_RENDERER_VERSION;
  const accent = state.visualAccent || state.theme?.visualAccent || 'amber';
  if (!['orange', 'amber'].includes(accent)) throw new Error('UNSUPPORTED_ARTIFACT_ACCENT');
  if (cta.length > 120 || blocks.length > 100) throw new Error('ARTIFACT_LIMIT');
  const sections = blocks.filter((block) => block !== hero).map((block, index) => {
    const props = block.props || {};
    const items = Array.isArray(props.items) ? props.items : [];
    return `<section id="${escape(version === LANDING_RENDERER_VERSION ? `section-${index}` : block.id || `section-${index}`)}"${block.canonicalStatic === 1 ? ` data-section-id="${escape(block.id)}"` : ''}><h2>${escape(text(props.title, text(block.label, 'Contenido')))}</h2><p>${escape(text(props.subtitle, text(props.description)))}</p>${items.length ? `<ul>${items.map((item) => `<li>${escape(typeof item === 'string' ? item : text(item?.title, text(item?.label)))}</li>`).join('')}</ul>` : ''}</section>`;
  }).join('');
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(title)}</title>
<style>:root{--accent:${accent === 'orange' ? '#fb923c' : '#fbbf24'}}*{box-sizing:border-box}body{margin:0;background:#090b12;color:#f5f5f7;font:18px/1.6 system-ui,sans-serif}main{max-width:1080px;margin:auto;padding:clamp(24px,6vw,80px)}header{padding:60px 0}h1{font-size:clamp(36px,6vw,72px);line-height:1.08;letter-spacing:-.04em}h2{font-size:28px}p{max-width:70ch;color:#c9ccd5}a{display:inline-block;background:var(--accent);color:#17120a;padding:14px 24px;border-radius:12px;font-weight:700;text-decoration:none}a:focus-visible{outline:3px solid white;outline-offset:5px}section{padding:24px 0;border-top:1px solid #303541}#contenido{scroll-margin-top:20px}</style></head>
<body data-renderer="${version}" data-accent="${accent}"><main><header${state.destinationIntent ? ` id="${escape(hero?.id)}"` : ''}><h1>${escape(title)}</h1><p>${escape(subtitle)}</p><a data-primary-cta${state.destinationIntent ? ' id="landing-primary-cta"' : ''} href="${escape(target)}">${escape(cta)}</a></header><div id="contenido">${sections || '<section><h2>Contenido del proyecto</h2></section>'}</div></main></body></html>`;
  if (html.length > 250000) throw new Error('ARTIFACT_LIMIT');
  return { rendererVersion: version, mediaType: 'text/html;charset=utf-8', html };
}

export function validateLandingArtifact(state, artifact) {
  const expected = renderLandingArtifact(state, artifact?.rendererVersion === 'static-landing-v1');
  if (!artifact || artifact.rendererVersion !== expected.rendererVersion || artifact.mediaType !== expected.mediaType || artifact.html !== expected.html) throw new Error('ARTIFACT_MISMATCH');
  return true;
}
