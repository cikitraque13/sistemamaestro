import { ADVISOR_TESTIMONIALS } from './advisorTestimonials';

const ENABLED = new Set(['1', 'true', 'yes', 'on']);
const MAX_URL_LENGTH = 2000;

export const BUILDER_CHAT_SELECTOR = '[data-testid="builder-executor-input"], [aria-label="Mensaje para el ejecutor"]';

export function isEnabledFlag(value) {
  return ENABLED.has(String(value ?? '').trim().toLowerCase());
}

export function safeHttpUrl(value) {
  const url = String(value ?? '').trim();
  if (!url || url.length > MAX_URL_LENGTH || /\s/.test(url)) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    if (!parsed.hostname) return '';
    return url;
  } catch {
    return '';
  }
}

export function visibleTestimonials(list) {
  if (!Array.isArray(list)) return [];
  const visible = [];
  list.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const quote = String(item.quote ?? '').trim();
    const name = String(item.name ?? '').trim();
    if (!quote || !name) return;
    const detail = String(item.detail ?? '').trim();
    const id = String(item.id ?? '').trim() || `${name}-${index}`;
    visible.push({ id, quote, name, detail });
  });
  return visible;
}

export function readBuildAdvisorConfig(env = import.meta.env) {
  const source = env || {};
  return {
    enabled: isEnabledFlag(source.VITE_ADVISOR_FLOW_ENABLED),
    bookingUrl: safeHttpUrl(source.VITE_ADVISOR_BOOKING_URL),
    photoUrl: safeHttpUrl(source.VITE_ADVISOR_PHOTO_URL),
    testimonials: visibleTestimonials(ADVISOR_TESTIMONIALS),
  };
}

export function applyPublicAdvisorConfig(base, payload) {
  const next = {
    enabled: Boolean(base?.enabled),
    bookingUrl: safeHttpUrl(base?.bookingUrl),
    photoUrl: safeHttpUrl(base?.photoUrl),
    testimonials: visibleTestimonials(base?.testimonials),
  };
  if (!payload || typeof payload !== 'object') return next;
  if (Object.prototype.hasOwnProperty.call(payload, 'advisor_flow_enabled')) {
    next.enabled = payload.advisor_flow_enabled === true;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'advisor_booking_url')) {
    next.bookingUrl = safeHttpUrl(payload.advisor_booking_url);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'advisor_photo_url')) {
    next.photoUrl = safeHttpUrl(payload.advisor_photo_url);
  }
  return next;
}

export function shouldLoadPublicAdvisorConfig(env = import.meta.env) {
  if (env?.VITEST) return false;
  return env?.MODE !== 'test';
}

export async function loadPublicAdvisorConfig(base, fetcher) {
  try {
    const payload = await fetcher();
    return applyPublicAdvisorConfig(base, payload);
  } catch {
    return applyPublicAdvisorConfig(base, null);
  }
}

export function findBuilderNovaChat(root = globalThis.document) {
  const input = root?.querySelector?.(BUILDER_CHAT_SELECTOR);
  if (!input || typeof input.focus !== 'function') return null;
  return input;
}

export function focusBuilderNovaChat(root = globalThis.document) {
  const input = findBuilderNovaChat(root);
  if (!input) return false;
  if (typeof input.scrollIntoView === 'function') {
    input.scrollIntoView({ block: 'center' });
  }
  input.focus();
  return true;
}
