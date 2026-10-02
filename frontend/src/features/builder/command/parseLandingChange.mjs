// Deliberately bounded grammar: unsupported local edits never fall through to AI.
export function parseLandingChange(input) {
  const text = String(input || '').trim();
  if (!/\b(?:cta|acento|bot[oó]n principal)\b/i.test(text)) return null;
  const match = text.match(/^(?:cambiar\s+)?(?:cta|bot[oó]n)\s+principal\s+a\s+["“]([^"”]+)["”](?:\s+y\s+acento\s+(naranja|ámbar|ambar))?\s*$/i);
  const accentOnly = text.match(/^(?:cambiar\s+)?acento\s+(?:a\s+)?(naranja|ámbar|ambar)\s*$/i);
  if (!match && !accentOnly) throw new Error('Usa: CTA principal a "Texto" y acento naranja, o acento ámbar.');
  const color = match?.[2] || accentOnly?.[1];
  return [
    ...(match ? [{ type: 'set_primary_cta', value: match[1] }] : []),
    ...(color ? [{ type: 'set_accent', value: color.toLowerCase() === 'naranja' ? 'orange' : 'amber' }] : []),
  ];
}
