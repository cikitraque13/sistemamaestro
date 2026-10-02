export const PRIMARY_CTA_ID = 'landing-primary-cta';
const validId = id => typeof id === 'string' && /^[a-zA-Z][\w-]*$/.test(id) && !['contenido', PRIMARY_CTA_ID].includes(id);
export function availableDestinations(state) {
  const blocks = state?.blocks || [];
  const ids = blocks.map(b => b.id);
  if (new Set(ids).size !== ids.length) return [];
  const hero = blocks.find(b => b.type === 'hero') || blocks[0];
  if (!hero || !validId(hero.id)) return [];
  return blocks.filter(b => validId(b.id)).map(b => ({
    ctaId: PRIMARY_CTA_ID, sourceSectionId: hero.id, destinationType: 'section', sectionId: b.id,
    label: String(b.props?.title || b.label || b.id), targetFragment: '#' + b.id,
  }));
}
export function selectDestination(state, sectionId) {
  const target = availableDestinations(state).find(t => t.sectionId === sectionId);
  if (!target) throw new Error('DESTINATION_NOT_AVAILABLE');
  const next = JSON.parse(JSON.stringify(state));
  const index = (next.ctas || []).findIndex(c => c.intent === 'primary' || c.id === 'hero-primary-cta');
  if (index >= 0) next.ctas[index].href = target.targetFragment;
  else {
    if (typeof next.primaryCTA !== 'string' || !next.primaryCTA.trim()) throw new Error('CTA_IDENTITY_MISSING');
    next.ctas = [{id: PRIMARY_CTA_ID, intent: 'primary', label: next.primaryCTA, href: target.targetFragment}, ...(next.ctas || [])];
  }
  next.destinationIntent = target;
  return next;
}
