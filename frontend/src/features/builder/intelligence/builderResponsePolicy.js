const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const includesAny = (text, terms) => terms.some((term) => text.includes(term));

export const BUILDER_ACTION_LEVELS = {
  STRUCTURAL_CRITICAL: 'structural_critical',
  STRATEGIC_OPTIMIZATION: 'strategic_optimization',
  COSMETIC_ADJUSTMENT: 'cosmetic_adjustment',
  BLOCKED: 'blocked',
};

export const BUILDER_CONFIDENCE_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const BUILDER_RESPONSE_RISK_LEVELS = {
  SAFE: 'safe',
  CAUTION: 'caution',
  BLOCKED: 'blocked',
};

export const BUILDER_ALLOWED_CLAIM_PREFIXES = [
  'Hipótesis de mejora',
  'Primera dirección recomendada',
  'Basado en la intención detectada',
  'Para reforzar prioridad de clic',
  'Para reducir fricción visual',
  'Para mejorar claridad',
  'Para orientar la conversión',
];

export const BUILDER_FORBIDDEN_CLAIM_PATTERNS = [
  'garantiza',
  'garantizado',
  'subira ventas',
  'subirá ventas',
  'aumentara ventas',
  'aumentará ventas',
  'he visto exactamente',
  'tus usuarios abandonan',
  'esto subira un',
  'esto subirá un',
  'conversion asegurada',
  'conversión asegurada',
  'esta agencia lo haria',
  'esta agencia lo haría',
];

export const classifyBuilderAction = (intent = {}) => {
  const requested = intent.requestedChanges || {};

  if (!intent || !intent.normalizedInput) {
    return BUILDER_ACTION_LEVELS.BLOCKED;
  }

  if (
    requested.ctas ||
    requested.layout ||
    requested.copy ||
    intent.conversionGoal !== 'activation'
  ) {
    return BUILDER_ACTION_LEVELS.STRUCTURAL_CRITICAL;
  }

  if (
    requested.cards ||
    requested.colors ||
    requested.background ||
    requested.visual ||
    intent.visualDirection !== 'balanced'
  ) {
    return BUILDER_ACTION_LEVELS.STRATEGIC_OPTIMIZATION;
  }

  return BUILDER_ACTION_LEVELS.COSMETIC_ADJUSTMENT;
};

export const shouldExecuteBuilderAction = (intent = {}) => {
  const actionLevel = classifyBuilderAction(intent);

  if (actionLevel === BUILDER_ACTION_LEVELS.BLOCKED) {
    return false;
  }

  if (intent.confidence === BUILDER_CONFIDENCE_LEVELS.LOW) {
    return false;
  }

  return (
    actionLevel === BUILDER_ACTION_LEVELS.STRUCTURAL_CRITICAL ||
    actionLevel === BUILDER_ACTION_LEVELS.STRATEGIC_OPTIMIZATION
  );
};

export const shouldAskBeforeExecuting = (intent = {}) => {
  if (!intent) return true;
  if (intent.confidence === BUILDER_CONFIDENCE_LEVELS.LOW) return true;
  if (intent.shouldAsk) return true;

  const actionLevel = classifyBuilderAction(intent);

  return actionLevel === BUILDER_ACTION_LEVELS.BLOCKED;
};

export const detectResponseRisk = (text = '') => {
  const normalized = normalizeText(text);

  if (includesAny(normalized, BUILDER_FORBIDDEN_CLAIM_PATTERNS)) {
    return BUILDER_RESPONSE_RISK_LEVELS.BLOCKED;
  }

  if (
    includesAny(normalized, [
      'ventas',
      'conversion',
      'conversión',
      'usuarios',
      'abandono',
      'analytics',
      'datos',
      'metricas',
      'métricas',
    ])
  ) {
    return BUILDER_RESPONSE_RISK_LEVELS.CAUTION;
  }

  return BUILDER_RESPONSE_RISK_LEVELS.SAFE;
};

export const sanitizeBuilderResponse = (text = '') => {
  let output = String(text || '').trim();

  if (!output) {
    return 'Entendido. Voy a interpretar la petición y aplicar una mejora controlada sin romper la estructura.';
  }

  const replacements = [
    {
      pattern: /esto garantiza más ventas/gi,
      replacement: 'esto puede ayudar a reforzar la orientación a conversión',
    },
    {
      pattern: /esto garantiza mas ventas/gi,
      replacement: 'esto puede ayudar a reforzar la orientación a conversión',
    },
    {
      pattern: /tus usuarios abandonan aquí/gi,
      replacement: 'puede existir una fuga de atención en este punto',
    },
    {
      pattern: /he visto exactamente tu web/gi,
      replacement: 'basado en la información disponible de la entrada',
    },
    {
      pattern: /conversión asegurada/gi,
      replacement: 'mejora orientada a conversión',
    },
    {
      pattern: /conversion asegurada/gi,
      replacement: 'mejora orientada a conversión',
    },
  ];

  replacements.forEach(({ pattern, replacement }) => {
    output = output.replace(pattern, replacement);
  });

  return output;
};

export const buildSafePolicyPrefix = (intent = {}) => {
  const actionLevel = classifyBuilderAction(intent);

  if (intent.confidence === BUILDER_CONFIDENCE_LEVELS.LOW) {
    return 'Antes de aplicar un cambio fuerte, necesito afinar la dirección.';
  }

  if (actionLevel === BUILDER_ACTION_LEVELS.STRUCTURAL_CRITICAL) {
    return 'Cambio estructural detectado.';
  }

  if (actionLevel === BUILDER_ACTION_LEVELS.STRATEGIC_OPTIMIZATION) {
    return 'Optimización estratégica detectada.';
  }

  return 'Ajuste menor detectado.';
};

export const buildPolicyDecision = ({
  intent = null,
  proposedResponse = '',
  currentState = null,
} = {}) => {
  const responseRisk = detectResponseRisk(proposedResponse);
  const actionLevel = classifyBuilderAction(intent);
  const shouldAsk = shouldAskBeforeExecuting(intent);
  const canExecute = shouldExecuteBuilderAction(intent);
  const safeResponse = sanitizeBuilderResponse(proposedResponse);
  const policyPrefix = buildSafePolicyPrefix(intent);

  return {
    actionLevel,
    confidence: intent?.confidence || BUILDER_CONFIDENCE_LEVELS.LOW,
    responseRisk,
    canExecute,
    shouldAsk,
    safeResponse,
    policyPrefix,
    currentState,
    blocked:
      responseRisk === BUILDER_RESPONSE_RISK_LEVELS.BLOCKED ||
      actionLevel === BUILDER_ACTION_LEVELS.BLOCKED,
  };
};

export const composePolicyAwareResponse = ({
  intent = null,
  responseText = '',
  currentState = null,
} = {}) => {
  const decision = buildPolicyDecision({
    intent,
    proposedResponse: responseText,
    currentState,
  });

  if (decision.blocked) {
    return {
      ...decision,
      text:
        'No aplico ese cambio todavía porque puede generar una decisión poco fiable. Necesito una dirección más concreta antes de modificar el Builder.',
    };
  }

  if (decision.shouldAsk) {
    return {
      ...decision,
      text:
        'La petición es útil, pero demasiado abierta para ejecutarla sin riesgo. Te propongo elegir una dirección antes de tocar diseño, CTA o estructura.',
    };
  }

  return {
    ...decision,
    text: `${decision.policyPrefix} ${decision.safeResponse}`,
  };
};

export const getBuilderExecutionPermission = (intent = {}) => {
  const actionLevel = classifyBuilderAction(intent);

  return {
    actionLevel,
    canExecute: shouldExecuteBuilderAction(intent),
    shouldAsk: shouldAskBeforeExecuting(intent),
    reason:
      intent.confidence === BUILDER_CONFIDENCE_LEVELS.LOW
        ? 'Baja confianza: conviene preguntar antes de ejecutar.'
        : actionLevel === BUILDER_ACTION_LEVELS.COSMETIC_ADJUSTMENT
          ? 'Ajuste menor: ejecutar solo si mejora claridad, conversión o coherencia.'
          : 'Acción válida para ejecución controlada.',
  };
};

export default buildPolicyDecision;