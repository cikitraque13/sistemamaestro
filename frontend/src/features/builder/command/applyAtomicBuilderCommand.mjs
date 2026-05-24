export const BUILDER_COMMAND_V2_ALLOWED_PROJECT_ID = 'proj_b55e1dff05a7';
export const BUILDER_COMMAND_V2_ALLOWED_INPUT = 'Cambiar CTA principal a "Reservar consulta" y acento naranja';

const normalizeText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const updatePrimaryCta = (ctas = [], primaryCTA = '') => {
  if (!primaryCTA) return asArray(ctas);

  const current = asArray(ctas);
  const hasPrimary = current.some((item) => item?.intent === 'primary' || item?.id === 'hero-primary-cta');
  const nextCta = {
    id: 'hero-primary-cta',
    label: primaryCTA,
    href: '#',
    intent: 'primary',
  };

  if (!hasPrimary) return [nextCta, ...current];

  return current.map((item) =>
    item?.intent === 'primary' || item?.id === 'hero-primary-cta'
      ? { ...item, ...nextCta }
      : item
  );
};

export const isAtomicBuilderCommandAllowed = ({
  command = null,
  projectId = '',
  input = '',
  enabled = false,
} = {}) => {
  if (!enabled || !command) return false;
  if (projectId !== BUILDER_COMMAND_V2_ALLOWED_PROJECT_ID) return false;
  if (normalizeText(input) !== normalizeText(BUILDER_COMMAND_V2_ALLOWED_INPUT)) return false;
  if (command.mutation?.type !== 'update_cta') return false;
  if (command.visual?.accent !== 'orange') return false;
  if (command.mutation?.label !== 'Reservar consulta') return false;

  return true;
};

export const applyAtomicBuilderCommandToState = (command = {}, currentState = {}) => {
  const expected = command.expectedDelta || {};
  const primaryCTA = expected.primaryCTA || command.mutation?.label || '';
  const visualAccent = expected.visualAccent || command.visual?.accent || '';
  const revision = Number.isFinite(currentState.revision) ? currentState.revision + 1 : 1;

  return {
    ...currentState,
    primaryCTA,
    visualAccent,
    templateId: command.templateId || 'opp_001',
    revision,
    traceId: command.traceId || currentState.traceId || '',
    lastCommandId: command.commandId || currentState.lastCommandId || '',
    ctas: updatePrimaryCta(currentState.ctas, primaryCTA),
    theme: {
      ...(currentState.theme || {}),
      ...(visualAccent ? { visualAccent, accent: visualAccent } : {}),
    },
    previewModel: {
      ...(currentState.previewModel || {}),
      ...(primaryCTA ? { primaryCTA } : {}),
      ...(visualAccent ? { visualAccent } : {}),
      activeSectionId: currentState.previewModel?.activeSectionId || 'hero',
    },
    codeModel: {
      ...(currentState.codeModel || {}),
      ...(primaryCTA ? { primaryCTA } : {}),
      ...(visualAccent ? { visualAccent } : {}),
    },
    structureModel: {
      ...(currentState.structureModel || {}),
      ...(primaryCTA ? { primaryCTA } : {}),
      ...(visualAccent ? { visualAccent } : {}),
      templateId: command.templateId || 'opp_001',
      revision,
    },
    creditPolicy: command.creditPolicy,
    commandStatus: 'applied_locally_pending_delta_verification',
    trace: [
      ...asArray(currentState.trace),
      {
        type: command.type,
        commandId: command.commandId,
        traceId: command.traceId,
        mutationType: command.mutation?.type || '',
        visualAccent,
        primaryCTA,
        expectedDelta: expected,
        createdAt: new Date(0).toISOString(),
      },
    ],
  };
};

export const verifyAtomicBuilderCommandDelta = ({
  command = {},
  output = {},
  codeLines = [],
} = {}) => {
  const expected = command.expectedDelta || {};
  const preview = output.preview || {};
  const codeText = asArray(codeLines).join('\n');

  if (expected.primaryCTA && preview.primaryCTA !== expected.primaryCTA) return false;
  if (expected.visualAccent && preview.visualAccent !== expected.visualAccent) return false;
  if (expected.primaryCTA && !codeText.includes(expected.primaryCTA)) return false;
  if (expected.visualAccent && !codeText.includes(expected.visualAccent)) return false;

  return true;
};
