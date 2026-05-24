export const BUILDER_COMMAND_V2_TYPE = 'builder.command.v2.atomic_mutation';
export const BUILDER_COMMAND_V2_ENABLED = true;

const normalizeText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const cleanLabel = (value = '') =>
  String(value || '')
    .replace(/\s+y\s+acento\s+.+$/i, '')
    .replace(/\s+con\s+acento\s+.+$/i, '')
    .replace(/[.,;:]+$/g, '')
    .trim();

const pickCtaLabel = (input = '') => {
  const patterns = [
    /(?:cambiar\s+)?cta\s+principal\s+a\s+["“”']?([^"“”']+)["“”']?/i,
    /(?:cambiar\s+)?bot[oó]n\s+principal\s+a\s+["“”']?([^"“”']+)["“”']?/i,
  ];

  for (const pattern of patterns) {
    const match = String(input || '').match(pattern);
    const label = cleanLabel(match?.[1] || '');

    if (label) return label;
  }

  return '';
};

const pickAccent = (input = '') => {
  const normalized = normalizeText(input);

  if (normalized.includes('acento naranja') || normalized.includes('accent orange')) return 'orange';
  if (normalized.includes('acento orange') || normalized.includes('color naranja')) return 'orange';

  return '';
};

export function parseAtomicBuilderCommand(input = {}, options = {}) {
  const text = typeof input === 'string' ? input : input?.text || '';
  const label = pickCtaLabel(text);
  const accent = pickAccent(text);

  if (!label && !accent) return null;

  const stamp = options.now || Date.now();
  const commandId = options.commandId || `cmd_${stamp}`;

  return {
    type: BUILDER_COMMAND_V2_TYPE,
    enabled: Boolean(options.enabled),
    commandId,
    traceId: options.traceId || `trace_${stamp}`,
    templateId: options.templateId || 'opp_001',
    mutation: label
      ? {
          type: 'update_cta',
          target: 'hero.primaryCTA',
          label,
        }
      : null,
    visual: accent ? { accent } : null,
    expectedDelta: {
      ...(label ? { primaryCTA: label } : {}),
      ...(accent ? { visualAccent: accent } : {}),
    },
    creditPolicy: {
      mode: 'local_no_charge_until_delta_verified',
      requiresDelta: true,
    },
  };
}

export default parseAtomicBuilderCommand;
