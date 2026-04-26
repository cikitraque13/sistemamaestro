import {
  BUILDER_BUSINESS_MODELS,
  BUILDER_COMPLEXITY_LEVELS,
  BUILDER_PRIMARY_GOALS,
  BUILDER_PROJECT_CATEGORIES,
  BUILDER_PROJECT_TYPES,
  classifyBuilderProject,
  getBuilderClassificationSummary,
} from './builderProjectClassifier';

export const BUILDER_AGENT_IDS = Object.freeze({
  HUB: 'hub',
  CRO: 'cro',
  COPY: 'copy',
  VISUAL: 'visual',
  STRUCTURE: 'structure',
  AUTOMATION: 'automation',
  TECHNICAL: 'technical',
  SEO: 'seo',
  GROWTH: 'growth',
  MONETIZATION: 'monetization',
  OPERATIONS: 'operations',
});

export const BUILDER_PLAYBOOK_SOURCE_TYPES = Object.freeze({
  BASIC: 'basic',
  EXPERT: 'expert',
  SECTOR: 'sector',
  ASSISTANT_CAPABILITY: 'assistant_capability',
});

export const BUILDER_RISK_IDS = Object.freeze({
  LOW_CLASSIFICATION_CONFIDENCE: 'low_classification_confidence',
  GENERIC_TEMPLATE: 'generic_template',
  WEAK_CTA: 'weak_cta',
  LOW_TRUST: 'low_trust',
  HIGH_TICKET_UNDERJUSTIFIED: 'high_ticket_underjustified',
  LOCAL_INFO_MISSING: 'local_info_missing',
  AUTOMATION_UNMAPPED: 'automation_unmapped',
  AI_VALUE_TOO_ABSTRACT: 'ai_value_too_abstract',
  TECHNICAL_SCOPE_AMBIGUOUS: 'technical_scope_ambiguous',
  CONVERSION_GOAL_UNCLEAR: 'conversion_goal_unclear',
});

export const DEFAULT_BUILDER_SELECTION = Object.freeze({
  primaryCTA: 'Solicitar diagnóstico',
  firstQuestion:
    '¿Quieres priorizar captación, venta, reserva, diagnóstico o automatización?',
  requiredAgents: [
    BUILDER_AGENT_IDS.HUB,
    BUILDER_AGENT_IDS.CRO,
    BUILDER_AGENT_IDS.COPY,
    BUILDER_AGENT_IDS.VISUAL,
    BUILDER_AGENT_IDS.STRUCTURE,
  ],
});

const unique = (items = []) =>
  Array.from(new Set(items.filter(Boolean)));

const compact = (items = []) => items.filter(Boolean);

const createPlaybookReference = ({
  type,
  playbook,
  score = 0,
  reason = '',
} = {}) => {
  if (!playbook?.id) return null;

  return {
    type,
    id: playbook.id,
    label: playbook.label || playbook.id,
    description: playbook.description || '',
    score,
    reason,
    playbook,
  };
};

const getMatchedScore = (classificationResult = {}, layer = '') =>
  classificationResult?.playbookContext?.matches?.[layer]?.score || 0;

const wasMatched = (classificationResult = {}, layer = '') =>
  Boolean(classificationResult?.playbookContext?.matches?.[layer]?.matched);

const resolvePrimaryPlaybookReference = (classificationResult = {}) => {
  const classification = classificationResult.classification || {};
  const selected = classificationResult.selectedPlaybooks || {};

  if (
    classification.projectType === BUILDER_PROJECT_TYPES.HIGH_TICKET_PAGE ||
    classification.businessModel === BUILDER_BUSINESS_MODELS.HIGH_TICKET
  ) {
    return createPlaybookReference({
      type: BUILDER_PLAYBOOK_SOURCE_TYPES.EXPERT,
      playbook: selected.expert,
      score: getMatchedScore(classificationResult, 'expert') + 4,
      reason:
        'El proyecto tiene señales de alto ticket, autoridad, diagnóstico o servicio premium.',
    });
  }

  if (
    classification.category === BUILDER_PROJECT_CATEGORIES.AUTOMATION ||
    classification.projectType === BUILDER_PROJECT_TYPES.AUTOMATION_WORKFLOW ||
    classification.primaryGoal === BUILDER_PRIMARY_GOALS.AUTOMATE_PROCESS
  ) {
    return createPlaybookReference({
      type: BUILDER_PLAYBOOK_SOURCE_TYPES.EXPERT,
      playbook: selected.expert,
      score: getMatchedScore(classificationResult, 'expert') + 4,
      reason:
        'El proyecto requiere mapear proceso, entradas, salidas, herramientas y excepciones.',
    });
  }

  if (
    classification.category === BUILDER_PROJECT_CATEGORIES.LOCAL_BUSINESS ||
    classification.projectType === BUILDER_PROJECT_TYPES.LOCAL_RESERVATION_PAGE
  ) {
    return createPlaybookReference({
      type: BUILDER_PLAYBOOK_SOURCE_TYPES.SECTOR,
      playbook: selected.sector,
      score: getMatchedScore(classificationResult, 'sector') + 3,
      reason:
        'El proyecto depende de conversión local: reserva, llamada, WhatsApp, ubicación o cita.',
    });
  }

  if (
    classification.category === BUILDER_PROJECT_CATEGORIES.SAAS_AI_TOOL ||
    classification.projectType === BUILDER_PROJECT_TYPES.AI_TOOL ||
    classification.projectType === BUILDER_PROJECT_TYPES.SAAS_LANDING
  ) {
    return createPlaybookReference({
      type: BUILDER_PLAYBOOK_SOURCE_TYPES.EXPERT,
      playbook: selected.expert,
      score: getMatchedScore(classificationResult, 'expert') + 3,
      reason:
        'El proyecto necesita activación rápida, demo visible, salida tangible y ruta de registro.',
    });
  }

  if (
    classification.category === BUILDER_PROJECT_CATEGORIES.ASSISTANT_HUB ||
    classification.projectType === BUILDER_PROJECT_TYPES.GPT_HUB
  ) {
    return createPlaybookReference({
      type: BUILDER_PLAYBOOK_SOURCE_TYPES.ASSISTANT_CAPABILITY,
      playbook: selected.assistantCapability,
      score: getMatchedScore(classificationResult, 'assistantCapability') + 3,
      reason:
        'El proyecto encaja con capacidades de asistentes, herramientas IA o hub operativo.',
    });
  }

  if (wasMatched(classificationResult, 'sector')) {
    return createPlaybookReference({
      type: BUILDER_PLAYBOOK_SOURCE_TYPES.SECTOR,
      playbook: selected.sector,
      score: getMatchedScore(classificationResult, 'sector') + 2,
      reason:
        'El sector detectado aporta reglas específicas de conversión, CTA y estructura.',
    });
  }

  if (wasMatched(classificationResult, 'assistantCapability')) {
    return createPlaybookReference({
      type: BUILDER_PLAYBOOK_SOURCE_TYPES.ASSISTANT_CAPABILITY,
      playbook: selected.assistantCapability,
      score: getMatchedScore(classificationResult, 'assistantCapability') + 1,
      reason:
        'La entrada activa una capacidad interna útil para construir o mejorar el proyecto.',
    });
  }

  return createPlaybookReference({
    type: BUILDER_PLAYBOOK_SOURCE_TYPES.BASIC,
    playbook: selected.basic,
    score: getMatchedScore(classificationResult, 'basic'),
    reason:
      'Se usa el playbook base porque es la estructura más segura para una primera versión.',
  });
};

const resolveSecondaryPlaybookReferences = ({
  classificationResult = {},
  primaryReference = null,
} = {}) => {
  const selected = classificationResult.selectedPlaybooks || {};

  const candidates = [
    createPlaybookReference({
      type: BUILDER_PLAYBOOK_SOURCE_TYPES.BASIC,
      playbook: selected.basic,
      score: getMatchedScore(classificationResult, 'basic'),
      reason: 'Base estructural del proyecto.',
    }),
    createPlaybookReference({
      type: BUILDER_PLAYBOOK_SOURCE_TYPES.EXPERT,
      playbook: selected.expert,
      score: getMatchedScore(classificationResult, 'expert'),
      reason: 'Capa experta de conversión, monetización, operación o activación.',
    }),
    createPlaybookReference({
      type: BUILDER_PLAYBOOK_SOURCE_TYPES.SECTOR,
      playbook: selected.sector,
      score: getMatchedScore(classificationResult, 'sector'),
      reason: 'Capa sectorial para lenguaje, bloques, CTAs y riesgos específicos.',
    }),
    createPlaybookReference({
      type: BUILDER_PLAYBOOK_SOURCE_TYPES.ASSISTANT_CAPABILITY,
      playbook: selected.assistantCapability,
      score: getMatchedScore(classificationResult, 'assistantCapability'),
      reason: 'Capacidad interna útil para producir una salida concreta.',
    }),
  ].filter(Boolean);

  return candidates
    .filter((candidate) => candidate.id !== primaryReference?.id)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

const resolvePrimaryCTA = ({
  classificationResult = {},
  primaryReference = null,
} = {}) => {
  const summary = getBuilderClassificationSummary(classificationResult);
  const primaryCtas = summary.primaryCtas || [];
  const classification = classificationResult.classification || {};

  if (primaryCtas.length) return primaryCtas[0];

  if (classification.primaryGoal === BUILDER_PRIMARY_GOALS.BOOK_RESERVATION) {
    return 'Reservar ahora';
  }

  if (classification.primaryGoal === BUILDER_PRIMARY_GOALS.BOOK_CALL) {
    return 'Reservar llamada';
  }

  if (classification.primaryGoal === BUILDER_PRIMARY_GOALS.REQUEST_DIAGNOSIS) {
    return 'Solicitar diagnóstico';
  }

  if (classification.primaryGoal === BUILDER_PRIMARY_GOALS.SELL_PRODUCT) {
    return 'Comprar ahora';
  }

  if (classification.primaryGoal === BUILDER_PRIMARY_GOALS.AUTOMATE_PROCESS) {
    return 'Diseñar automatización';
  }

  if (classification.primaryGoal === BUILDER_PRIMARY_GOALS.ACTIVATE_REGISTRATION) {
    return 'Probar gratis';
  }

  return (
    primaryReference?.playbook?.primaryCtas?.[0] ||
    primaryReference?.playbook?.primaryCTA ||
    DEFAULT_BUILDER_SELECTION.primaryCTA
  );
};

const resolveRequiredAgents = (classificationResult = {}) => {
  const classification = classificationResult.classification || {};
  const agents = [BUILDER_AGENT_IDS.HUB];

  if (
    classification.category === BUILDER_PROJECT_CATEGORIES.AUTOMATION ||
    classification.projectType === BUILDER_PROJECT_TYPES.AUTOMATION_WORKFLOW
  ) {
    agents.push(
      BUILDER_AGENT_IDS.AUTOMATION,
      BUILDER_AGENT_IDS.OPERATIONS,
      BUILDER_AGENT_IDS.TECHNICAL,
      BUILDER_AGENT_IDS.STRUCTURE
    );
  } else if (
    classification.category === BUILDER_PROJECT_CATEGORIES.SAAS_AI_TOOL ||
    classification.projectType === BUILDER_PROJECT_TYPES.AI_TOOL
  ) {
    agents.push(
      BUILDER_AGENT_IDS.CRO,
      BUILDER_AGENT_IDS.VISUAL,
      BUILDER_AGENT_IDS.TECHNICAL,
      BUILDER_AGENT_IDS.MONETIZATION,
      BUILDER_AGENT_IDS.STRUCTURE
    );
  } else if (
    classification.businessModel === BUILDER_BUSINESS_MODELS.HIGH_TICKET ||
    classification.projectType === BUILDER_PROJECT_TYPES.HIGH_TICKET_PAGE
  ) {
    agents.push(
      BUILDER_AGENT_IDS.CRO,
      BUILDER_AGENT_IDS.COPY,
      BUILDER_AGENT_IDS.VISUAL,
      BUILDER_AGENT_IDS.STRUCTURE
    );
  } else if (
    classification.category === BUILDER_PROJECT_CATEGORIES.CONTENT
  ) {
    agents.push(
      BUILDER_AGENT_IDS.COPY,
      BUILDER_AGENT_IDS.SEO,
      BUILDER_AGENT_IDS.GROWTH,
      BUILDER_AGENT_IDS.STRUCTURE
    );
  } else {
    agents.push(
      BUILDER_AGENT_IDS.CRO,
      BUILDER_AGENT_IDS.COPY,
      BUILDER_AGENT_IDS.VISUAL,
      BUILDER_AGENT_IDS.STRUCTURE
    );
  }

  if (
    classification.businessModel === BUILDER_BUSINESS_MODELS.CREDITS ||
    classification.businessModel === BUILDER_BUSINESS_MODELS.SUBSCRIPTION ||
    classification.businessModel === BUILDER_BUSINESS_MODELS.FREEMIUM
  ) {
    agents.push(BUILDER_AGENT_IDS.MONETIZATION);
  }

  return unique(agents);
};

const resolveRisks = (classificationResult = {}) => {
  const classification = classificationResult.classification || {};
  const risks = [];

  if (classification.confidence === 'low') {
    risks.push({
      id: BUILDER_RISK_IDS.LOW_CLASSIFICATION_CONFIDENCE,
      label: 'Clasificación poco segura',
      mitigation:
        'Hacer una pregunta corta para confirmar tipo de proyecto y objetivo antes de sobreconstruir.',
    });
  }

  if (!classification.primaryGoal || classification.primaryGoal === BUILDER_PRIMARY_GOALS.UNKNOWN) {
    risks.push({
      id: BUILDER_RISK_IDS.CONVERSION_GOAL_UNCLEAR,
      label: 'Objetivo de conversión poco claro',
      mitigation:
        'Definir si la acción principal es lead, venta, reserva, registro, diagnóstico o automatización.',
    });
  }

  if (
    classification.projectType === BUILDER_PROJECT_TYPES.HIGH_TICKET_PAGE ||
    classification.businessModel === BUILDER_BUSINESS_MODELS.HIGH_TICKET
  ) {
    risks.push({
      id: BUILDER_RISK_IDS.HIGH_TICKET_UNDERJUSTIFIED,
      label: 'Valor alto sin suficiente justificación',
      mitigation:
        'Reforzar autoridad, método, prueba, diagnóstico inicial y reducción de riesgo.',
    });
  }

  if (classification.category === BUILDER_PROJECT_CATEGORIES.LOCAL_BUSINESS) {
    risks.push({
      id: BUILDER_RISK_IDS.LOCAL_INFO_MISSING,
      label: 'Información local insuficiente',
      mitigation:
        'Priorizar ubicación, horarios, fotos, reseñas y CTA de reserva/contacto.',
    });
  }

  if (
    classification.category === BUILDER_PROJECT_CATEGORIES.AUTOMATION ||
    classification.projectType === BUILDER_PROJECT_TYPES.AUTOMATION_WORKFLOW
  ) {
    risks.push({
      id: BUILDER_RISK_IDS.AUTOMATION_UNMAPPED,
      label: 'Automatización sin proceso mapeado',
      mitigation:
        'Definir entrada, herramientas, pasos, salidas, errores y revisión humana.',
    });
  }

  if (
    classification.category === BUILDER_PROJECT_CATEGORIES.SAAS_AI_TOOL ||
    classification.businessModel === BUILDER_BUSINESS_MODELS.CREDITS
  ) {
    risks.push({
      id: BUILDER_RISK_IDS.AI_VALUE_TOO_ABSTRACT,
      label: 'Valor IA demasiado abstracto',
      mitigation:
        'Mostrar salida tangible, ejemplo visible, consumo de créditos y siguiente acción.',
    });
  }

  if (
    classification.complexity === BUILDER_COMPLEXITY_LEVELS.SYSTEM ||
    classification.complexity === BUILDER_COMPLEXITY_LEVELS.HIGH
  ) {
    risks.push({
      id: BUILDER_RISK_IDS.TECHNICAL_SCOPE_AMBIGUOUS,
      label: 'Alcance técnico amplio',
      mitigation:
        'Separar primera versión, iteraciones, integración, exportación y deploy.',
    });
  }

  if (!risks.length) {
    risks.push({
      id: BUILDER_RISK_IDS.GENERIC_TEMPLATE,
      label: 'Riesgo de plantilla genérica',
      mitigation:
        'Usar sector, objetivo y CTA específico para evitar una salida repetitiva.',
    });
  }

  return risks.slice(0, 5);
};

const resolveFirstQuestion = ({
  classificationResult = {},
  primaryCTA = '',
} = {}) => {
  const summary = getBuilderClassificationSummary(classificationResult);
  const classification = classificationResult.classification || {};
  const questions = summary.smartQuestions || [];

  if (questions.length) return questions[0];

  if (classification.category === BUILDER_PROJECT_CATEGORIES.LOCAL_BUSINESS) {
    return `¿La acción principal debe ser ${primaryCTA}, llamada, WhatsApp o ubicación?`;
  }

  if (classification.category === BUILDER_PROJECT_CATEGORIES.AUTOMATION) {
    return '¿Qué proceso concreto quieres automatizar primero y qué herramienta lo inicia?';
  }

  if (classification.category === BUILDER_PROJECT_CATEGORIES.SAAS_AI_TOOL) {
    return '¿Qué primer resultado debe ver el usuario antes de registrarse o consumir créditos?';
  }

  if (classification.businessModel === BUILDER_BUSINESS_MODELS.HIGH_TICKET) {
    return '¿El diagnóstico inicial será gratuito, de pago o una llamada de filtro?';
  }

  return DEFAULT_BUILDER_SELECTION.firstQuestion;
};

const resolveImmediateChanges = ({
  classificationResult = {},
  primaryReference = null,
} = {}) => {
  const summary = getBuilderClassificationSummary(classificationResult);
  const classification = classificationResult.classification || {};
  const playbook = primaryReference?.playbook || {};

  const changes = [];

  if (playbook.interventionSequence?.length) {
    changes.push(
      ...playbook.interventionSequence.slice(0, 3).map((item) => ({
        id: item.id,
        label: item.label,
        action: item.action,
      }))
    );
  }

  if (playbook.recommendedStructure?.length) {
    changes.push(
      ...playbook.recommendedStructure.slice(0, 3).map((item) => ({
        id: item.id,
        label: item.label,
        action: item.purpose,
      }))
    );
  }

  if (playbook.requiredBlocks?.length) {
    changes.push(
      ...playbook.requiredBlocks.slice(0, 3).map((item, index) => ({
        id: `required-block-${index + 1}`,
        label: item,
        action: `Incluir bloque: ${item}.`,
      }))
    );
  }

  if (playbook.outputStructure?.length) {
    changes.push(
      ...playbook.outputStructure.slice(0, 3).map((item, index) => ({
        id: `output-${index + 1}`,
        label: item,
        action: `Preparar salida: ${item}.`,
      }))
    );
  }

  if (!changes.length) {
    changes.push(
      {
        id: 'hero',
        label: 'Hero específico',
        action:
          'Ajustar titular, subtítulo y CTA al tipo de proyecto y objetivo detectado.',
      },
      {
        id: 'trust',
        label: 'Confianza',
        action:
          'Añadir señales de autoridad, prueba social, proceso o garantías.',
      },
      {
        id: 'cta',
        label: 'CTA principal',
        action:
          `Hacer dominante la acción principal: ${summary.primaryCtas?.[0] || 'Solicitar diagnóstico'}.`,
      }
    );
  }

  if (
    classification.projectType === BUILDER_PROJECT_TYPES.URL_REDESIGN
  ) {
    changes.unshift({
      id: 'url-diagnosis',
      label: 'Diagnóstico de URL',
      action:
        'Comparar versión actual y nueva propuesta antes de rediseñar bloques visuales.',
    });
  }

  return changes.slice(0, 5);
};

const resolveVisibleChangeTargets = ({
  classificationResult = {},
  primaryCTA = '',
} = {}) => {
  const classification = classificationResult.classification || {};
  const summary = getBuilderClassificationSummary(classificationResult);
  const targets = [];

  targets.push({
    id: 'hero',
    label: 'Hero',
    expectedChange:
      'Titular, subtítulo y promesa adaptados al tipo de proyecto.',
  });

  targets.push({
    id: 'cta',
    label: 'CTA',
    expectedChange:
      `Acción principal alineada con ${primaryCTA || 'el objetivo detectado'}.`,
  });

  if (summary.labels?.sector) {
    targets.push({
      id: 'sector-blocks',
      label: 'Bloques sectoriales',
      expectedChange:
        `Estructura adaptada al sector ${summary.labels.sector}.`,
    });
  }

  if (
    classification.category === BUILDER_PROJECT_CATEGORIES.SAAS_AI_TOOL ||
    classification.businessModel === BUILDER_BUSINESS_MODELS.CREDITS
  ) {
    targets.push({
      id: 'activation',
      label: 'Activación',
      expectedChange:
        'Mostrar primer resultado, demo, créditos o continuidad operativa.',
    });
  }

  if (classification.category === BUILDER_PROJECT_CATEGORIES.AUTOMATION) {
    targets.push({
      id: 'workflow',
      label: 'Flujo',
      expectedChange:
        'Mostrar entrada, pasos, herramientas, salida y control de errores.',
    });
  }

  return targets.slice(0, 5);
};

const resolveOperationalFocus = (classificationResult = {}) => {
  const summary = getBuilderClassificationSummary(classificationResult);

  return compact([
    summary.labels?.sector,
    summary.labels?.basic,
    summary.labels?.expert,
    summary.labels?.capability,
    summary.conversionTarget,
  ]).join(' · ');
};

const buildAgentInstruction = ({
  classificationResult = {},
  primaryReference = null,
  secondaryReferences = [],
  primaryCTA = '',
  firstQuestion = '',
  risks = [],
} = {}) => {
  const summary = getBuilderClassificationSummary(classificationResult);
  const classification = classificationResult.classification || {};

  const agentCues = summary.agentCues || [];
  const primaryLabel = primaryReference?.label || 'playbook principal';
  const secondaryLabels = secondaryReferences.map((item) => item.label).join(', ');

  return [
    `Clasificación: ${classification.category || 'unknown'} / ${classification.projectType || 'unknown'}.`,
    `Playbook principal: ${primaryLabel}.`,
    secondaryLabels ? `Playbooks secundarios: ${secondaryLabels}.` : '',
    `Objetivo de conversión: ${summary.conversionTarget}.`,
    `CTA recomendado: ${primaryCTA}.`,
    risks.length ? `Riesgo principal: ${risks[0].label}.` : '',
    agentCues[0] ? `Criterio del agente: ${agentCues[0]}` : '',
    `Primera pregunta útil: ${firstQuestion}.`,
  ]
    .filter(Boolean)
    .join(' ');
};

export const selectBuilderPlaybooks = ({
  text = '',
  project = null,
  explicitUserLevel = '',
  classificationResult = null,
} = {}) => {
  const resolvedClassification =
    classificationResult ||
    classifyBuilderProject({
      text,
      project,
      explicitUserLevel,
    });

  const primaryReference = resolvePrimaryPlaybookReference(resolvedClassification);
  const secondaryReferences = resolveSecondaryPlaybookReferences({
    classificationResult: resolvedClassification,
    primaryReference,
  });

  const primaryCTA = resolvePrimaryCTA({
    classificationResult: resolvedClassification,
    primaryReference,
  });

  const requiredAgents = resolveRequiredAgents(resolvedClassification);
  const risks = resolveRisks(resolvedClassification);
  const firstQuestion = resolveFirstQuestion({
    classificationResult: resolvedClassification,
    primaryCTA,
  });

  const immediateChanges = resolveImmediateChanges({
    classificationResult: resolvedClassification,
    primaryReference,
  });

  const visibleChangeTargets = resolveVisibleChangeTargets({
    classificationResult: resolvedClassification,
    primaryCTA,
  });

  const operationalFocus = resolveOperationalFocus(resolvedClassification);

  const agentInstruction = buildAgentInstruction({
    classificationResult: resolvedClassification,
    primaryReference,
    secondaryReferences,
    primaryCTA,
    firstQuestion,
    risks,
  });

  return {
    classificationResult,
    summary: getBuilderClassificationSummary(resolvedClassification),

    selected: {
      primary: primaryReference,
      secondary: secondaryReferences,
    },

    operation: {
      requiredAgents,
      primaryCTA,
      firstQuestion,
      risks,
      immediateChanges,
      visibleChangeTargets,
      operationalFocus,
      agentInstruction,
    },
  };
};

export const getBuilderPlaybookSelectionSummary = (selection = {}) => ({
  primaryPlaybook: selection.selected?.primary?.label || '',
  secondaryPlaybooks:
    selection.selected?.secondary?.map((item) => item.label) || [],
  requiredAgents: selection.operation?.requiredAgents || [],
  primaryCTA: selection.operation?.primaryCTA || DEFAULT_BUILDER_SELECTION.primaryCTA,
  firstQuestion:
    selection.operation?.firstQuestion || DEFAULT_BUILDER_SELECTION.firstQuestion,
  risks: selection.operation?.risks || [],
  immediateChanges: selection.operation?.immediateChanges || [],
  visibleChangeTargets: selection.operation?.visibleChangeTargets || [],
  operationalFocus: selection.operation?.operationalFocus || '',
  agentInstruction: selection.operation?.agentInstruction || '',
});