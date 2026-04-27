import { PLACEHOLDER_PATTERNS } from './reportPremium.constants';

const STOPWORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'u', 'a', 'ante', 'bajo', 'con', 'contra', 'desde',
  'durante', 'en', 'entre', 'hacia', 'hasta', 'para', 'por',
  'segun', 'sin', 'sobre', 'tras', 'que', 'como', 'del', 'al',
  'se', 'su', 'sus', 'es', 'son', 'ha', 'han', 'muy', 'mas',
  'menos', 'ya', 'hoy', 'real', 'principal', 'importante', 'caso',
  'lectura', 'sistema', 'proyecto', 'negocio', 'usuario', 'usuarios',
  'web', 'pagina', 'sitio', 'mensaje', 'landing', 'propuesta',
  'valor', 'conversion', 'captacion', 'claridad', 'estructura',
  'continuidad', 'mejora', 'oportunidad', 'accion', 'comercial'
]);

export const ensureArray = (value) => (Array.isArray(value) ? value : []);

export const toSafeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;

  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
};

export const formatDate = (value) => {
  if (!value) return '';

  try {
    return new Date(value).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '';
  }
};

export const normalizeText = (value) => {
  const safeText = toSafeText(value);

  if (!safeText) return '';

  return safeText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const isMeaningfulText = (value) => {
  const safeText = toSafeText(value);
  const normalized = normalizeText(safeText);

  if (!safeText) return false;
  if (normalized.length < 12) return false;

  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized));
};

const tokenSet = (value) =>
  new Set(
    normalizeText(value)
      .split(' ')
      .filter((token) => token.length > 2 && !STOPWORDS.has(token))
  );

export const areTooSimilar = (a, b) => {
  if (!isMeaningfulText(a) || !isMeaningfulText(b)) return false;

  const normA = normalizeText(a);
  const normB = normalizeText(b);

  if (!normA || !normB) return false;
  if (normA === normB) return true;

  if (
    normA.length > 32 &&
    normB.length > 32 &&
    (normA.includes(normB) || normB.includes(normA))
  ) {
    return true;
  }

  const tokensA = tokenSet(a);
  const tokensB = tokenSet(b);

  if (!tokensA.size || !tokensB.size) return false;

  const intersection = [...tokensA].filter((token) => tokensB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size;

  if (!union) return false;

  return intersection / union >= 0.72;
};

export const dedupeTexts = (items, avoid = [], maxItems = null) => {
  const result = [];

  for (const rawItem of ensureArray(items)) {
    const item = toSafeText(rawItem);

    if (!isMeaningfulText(item)) continue;
    if (avoid.some((blocked) => areTooSimilar(item, blocked))) continue;
    if (result.some((existing) => areTooSimilar(item, existing))) continue;

    result.push(item);

    if (maxItems && result.length >= maxItems) break;
  }

  return result;
};

export const dedupeKeyValueBlocks = (items, maxItems = null) => {
  const result = [];

  for (const rawItem of ensureArray(items)) {
    if (!rawItem || typeof rawItem !== 'object') continue;

    const item = {
      ...rawItem,
      label: toSafeText(rawItem.label),
      value: toSafeText(rawItem.value)
    };

    if (!isMeaningfulText(item.value)) continue;
    if (result.some((existing) => areTooSimilar(item.value, existing.value))) continue;

    result.push(item);

    if (maxItems && result.length >= maxItems) break;
  }

  return result;
};

export const getGridClass = (count) => {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'md:grid-cols-2';

  return 'md:grid-cols-3';
};