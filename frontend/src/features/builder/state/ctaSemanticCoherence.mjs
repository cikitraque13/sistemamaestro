// Bounded Spanish lexical evidence, not a semantic truth or conversion score.
const text = (v, fallback = '') => typeof v === 'string' && v.trim() ? v : fallback;
const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const rules = [
  ['PRICING', /\b(precio|precios|tarifa|tarifas|planes)\b/, /\b(precio|precios|tarifa|tarifas|eur|euros)\b|[€$]/],
  ['CONTACT', /\b(contactar|contacto|hablar)\b/, /\b(contacto|telefono|correo|email)\b/],
  ['DETAILS', /\b(beneficios|caracteristicas)\b/, /\b(beneficios|caracteristicas)\b/],
];
const actions = /\b(comprar|pagar|reservar|registrarme|suscribirme|descargar)\b/;
export function assessCtaCoherence(state) {
  const promise = text(state.primaryCTA, text(state.ctas?.find(c => c.intent === 'primary')?.label, 'Ver contenido'));
  const intent = state.destinationIntent;
  const blocks = state.blocks || [];
  const matches = blocks.filter(b => b.id === intent?.sectionId);
  const block = matches.length === 1 ? matches[0] : null;
  const hero = blocks.find(b => b.type === 'hero') || blocks[0];
  const props = block?.props || {};
  // Only text actually rendered in the destination; metadata and hidden descriptions are excluded.
  const visible = block ? [text(props.title, text(block.label, block === hero ? 'Tu proyecto' : 'Contenido')), text(props.subtitle, text(props.description)), ...(block === hero ? [] : (Array.isArray(props.items) ? props.items : []).map(i => typeof i === 'string' ? i : text(i?.title, text(i?.label))))].filter(Boolean) : [];
  const p = normalize(promise), evidence = normalize(visible.join(' '));
  const recognized = rules.filter(([,pattern]) => pattern.test(p));
  let status = 'UNCERTAIN', reason = 'UNRECOGNIZED_PROMISE';
  if (!intent || !block) reason = 'EXPLICIT_DESTINATION_REQUIRED';
  else if (actions.test(p)) { status = 'POTENTIAL_MISMATCH'; reason = 'ACTION_NOT_PROVIDED_BY_STATIC_ARTIFACT'; }
  else if (recognized.length > 1) reason = 'MULTIPLE_PROMISES';
  else if (recognized.length === 1) {
    status = recognized[0][2].test(evidence) ? 'SUPPORTING_SIGNALS' : 'POTENTIAL_MISMATCH';
    reason = status === 'SUPPORTING_SIGNALS' ? 'VISIBLE_LEXICAL_SUPPORT' : 'NO_VISIBLE_SUPPORT_FOR_PROMISE';
    if (/\b(no|sin|nunca)\b/.test(p + ' ' + evidence)) { status = 'UNCERTAIN'; reason = 'NEGATION_REQUIRES_HUMAN_REVIEW'; }
  }
  return { version: 1, method: 'bounded-es-lexical-v1', advisoryOnly: true, status, reason, promise,
    destinationId: intent?.sectionId || null, destinationContent: visible,
    recognizedIntents: recognized.map(([id]) => id),
    limitation: 'Señales locales, no garantía semántica. Comprueba que el contenido cumple la promesa antes de aplicar.' };
}
