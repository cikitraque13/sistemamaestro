import {
  classifyBuilderProject,
  getBuilderClassificationSummary,
} from './builderProjectClassifier';

import {
  selectBuilderPlaybooks,
  getBuilderPlaybookSelectionSummary,
  BUILDER_AGENT_IDS,
} from './builderPlaybookSelector';

import {
  interpretBuilderIteration,
  getBuilderIterationSummary,
  BUILDER_ITERATION_ACTION_TYPES,
} from './builderIterationInterpreter';

export const BUILDER_HUB_MODES = Object.freeze({
  INITIAL_BUILD: 'initial_build',
  ITERATION: 'iteration',
  RECLASSIFICATION: 'reclassification',
});

export const BUILDER_HUB_STATUS = Object.freeze({
  READY: 'ready',
  NEEDS_CLARIFICATION: 'needs_clarification',
  CAN_APPLY: 'can_apply',
  LOW_CONFIDENCE: 'low_confidence',
});

export const BUILDER_HUB_PHASES = Object.freeze({
  DISCOVERY: 'discovery',
  CLASSIFICATION: 'classification',
  PLAYBOOK_SELECTION: 'playbook_selection',
  ITERATION_INTERPRETATION: 'iteration_interpretation',
  AGENT_INSTRUCTION: 'agent_instruction',
});

const compact = (items = []) => items.filter(Boolean);

const unique = (items = []) => Array.from(new Set(items.filter(Boolean)));

const getPrimaryInput = ({
  input = '',
  message = '',
  project = null,
} = {}) =>
  compact([
    input,
    message,
    project?.input_content,
    project?.prompt,
    project?.title,
    project?.summary,
  ]).join(' ');

const resolveHubMode = ({
  mode = '',
  message = '',
  hasCurrentSelection = false,
} = {}) => {
  if (mode && Object.values(BUILDER_HUB_MODES).includes(mode)) {
    return mode;
  }

  if (message && hasCurrentSelection) {
    return BUILDER_HUB_MODES.ITERATION;
  }

  return BUILDER_HUB_MODES.INITIAL_BUILD;
};

const resolveHubStatus = ({
  classificationSummary = {},
  selectionSummary = {},
  iterationSummary = null,
} = {}) => {
  if (classificationSummary.confidence === 'low') {
    return BUILDER_HUB_STATUS.LOW_CONFIDENCE;
  }

  if (iterationSummary?.shouldAskClarification) {
    return BUILDER_HUB_STATUS.NEEDS_CLARIFICATION;
  }

  if (
    iterationSummary?.actionType ===
    BUILDER_ITERATION_ACTION_TYPES.APPLY_DIRECTLY
  ) {
    return BUILDER_HUB_STATUS.CAN_APPLY;
  }

  if (!selectionSummary.primaryPlaybook) {
    return BUILDER_HUB_STATUS.NEEDS_CLARIFICATION;
  }

  return BUILDER_HUB_STATUS.READY;
};

const resolveHubAgents = ({
  selectionSummary = {},
  iterationSummary = null,
} = {}) => {
  const agents = [
    BUILDER_AGENT_IDS.HUB,
    ...(selectionSummary.requiredAgents || []),
  ];

  if (iterationSummary?.affectedLayers?.includes('visual')) {
    agents.push(BUILDER_AGENT_IDS.VISUAL);
  }

  if (iterationSummary?.affectedLayers?.includes('copy')) {
    agents.push(BUILDER_AGENT_IDS.COPY);
  }

  if (iterationSummary?.affectedLayers?.includes('cta')) {
    agents.push(BUILDER_AGENT_IDS.CRO);
  }

  if (iterationSummary?.affectedLayers?.includes('structure')) {
    agents.push(BUILDER_AGENT_IDS.STRUCTURE);
  }

  if (iterationSummary?.affectedLayers?.includes('automation')) {
    agents.push(BUILDER_AGENT_IDS.AUTOMATION);
    agents.push(BUILDER_AGENT_IDS.OPERATIONS);
  }

  if (iterationSummary?.affectedLayers?.includes('technical')) {
    agents.push(BUILDER_AGENT_IDS.TECHNICAL);
  }

  return unique(agents);
};

const buildHubDecision = ({
  mode,
  classificationSummary = {},
  selectionSummary = {},
  iterationSummary = null,
} = {}) => {
  const isIteration = mode === BUILDER_HUB_MODES.ITERATION;

  return {
    mode,
    projectCategory: classificationSummary.category,
    projectType: classificationSummary.projectType,
    businessModel: classificationSummary.businessModel,
    primaryGoal: classificationSummary.primaryGoal,
    conversionTarget: classificationSummary.conversionTarget,
    complexity: classificationSummary.complexity,
    confidence: classificationSummary.confidence,
    primaryPlaybook: selectionSummary.primaryPlaybook,
    secondaryPlaybooks: selectionSummary.secondaryPlaybooks || [],
    primaryCTA:
      iterationSummary?.cta ||
      selectionSummary.primaryCTA ||
      'Solicitar diagnóstico',
    firstQuestion:
      iterationSummary?.clarifyingQuestion ||
      selectionSummary.firstQuestion ||
      '',
    operationalFocus: selectionSummary.operationalFocus || '',
    isIteration,
    iterationIntent: iterationSummary?.primaryIntent || null,
    affectedLayers: iterationSummary?.affectedLayers || [],
  };
};

const buildHubVisiblePlan = ({
  selectionSummary = {},
  iterationSummary = null,
} = {}) => {
  const immediateChanges = selectionSummary.immediateChanges || [];
  const visibleTargets = selectionSummary.visibleChangeTargets || [];
  const appliedChangeSummary = iterationSummary?.appliedChangeSummary || [];

  return {
    immediateChanges,
    visibleTargets,
    appliedChangeSummary,
    shouldShowClarifyingQuestion: Boolean(
      iterationSummary?.shouldAskClarification
    ),
    shouldApplyVisibleDelta: Boolean(
      iterationSummary?.actionType ===
        BUILDER_ITERATION_ACTION_TYPES.APPLY_DIRECTLY
    ),
  };
};

const buildHubAgentMessage = ({
  mode,
  status,
  classificationSummary = {},
  selectionSummary = {},
  iterationSummary = null,
} = {}) => {
  if (iterationSummary?.agentResponse) {
    return iterationSummary.agentResponse;
  }

  if (status === BUILDER_HUB_STATUS.LOW_CONFIDENCE) {
    return [
      'He detectado el proyecto, pero la clasificación todavía no es suficientemente precisa.',
      `Foco provisional: ${selectionSummary.operationalFocus || 'captación cualificada'}.`,
      selectionSummary.firstQuestion ||
        '¿Quieres priorizar captación, venta, reserva, diagnóstico o automatización?',
    ].join(' ');
  }

  if (mode === BUILDER_HUB_MODES.INITIAL_BUILD) {
    return [
      `Clasifico este proyecto como ${classificationSummary.projectType}.`,
      `Activaré el playbook principal: ${selectionSummary.primaryPlaybook}.`,
      `Objetivo de conversión: ${classificationSummary.conversionTarget}.`,
      `CTA recomendado: ${selectionSummary.primaryCTA}.`,
      'Voy a construir la primera versión con estructura, copy, jerarquía visual y acción principal alineadas al contexto detectado.',
    ].join(' ');
  }

  return [
    `Hub activo sobre ${selectionSummary.operationalFocus || 'el proyecto actual'}.`,
    `Playbook principal: ${selectionSummary.primaryPlaybook}.`,
    `Siguiente decisión útil: ${selectionSummary.firstQuestion}.`,
  ].join(' ');
};

const buildHubAgentInstruction = ({
  mode,
  status,
  classificationSummary = {},
  selectionSummary = {},
  iterationSummary = null,
  requiredAgents = [],
} = {}) => {
  const lines = [
    `Modo Hub: ${mode}.`,
    `Estado: ${status}.`,
    `Categoría: ${classificationSummary.category}.`,
    `Tipo de proyecto: ${classificationSummary.projectType}.`,
    `Modelo de negocio: ${classificationSummary.businessModel}.`,
    `Objetivo: ${classificationSummary.primaryGoal}.`,
    `Conversión esperada: ${classificationSummary.conversionTarget}.`,
    `Complejidad: ${classificationSummary.complexity}.`,
    `Confianza: ${classificationSummary.confidence}.`,
    `Playbook principal: ${selectionSummary.primaryPlaybook}.`,
    selectionSummary.secondaryPlaybooks?.length
      ? `Playbooks secundarios: ${selectionSummary.secondaryPlaybooks.join(', ')}.`
      : '',
    `Agentes requeridos: ${requiredAgents.join(', ')}.`,
    `CTA recomendado: ${
      iterationSummary?.cta || selectionSummary.primaryCTA || 'Solicitar diagnóstico'
    }.`,
    iterationSummary?.primaryIntent
      ? `Intención de iteración: ${iterationSummary.primaryIntent}.`
      : '',
    iterationSummary?.affectedLayers?.length
      ? `Capas afectadas: ${iterationSummary.affectedLayers.join(', ')}.`
      : '',
    selectionSummary.risks?.length
      ? `Riesgo principal: ${selectionSummary.risks[0].label}. Mitigación: ${selectionSummary.risks[0].mitigation}.`
      : '',
    iterationSummary?.shouldAskClarification
      ? `Pregunta obligatoria antes de aplicar: ${iterationSummary.clarifyingQuestion}.`
      : '',
    selectionSummary.agentInstruction
      ? `Instrucción operativa: ${selectionSummary.agentInstruction}`
      : '',
  ];

  return lines.filter(Boolean).join(' ');
};

const buildHubDebugTrace = ({
  classificationSummary = {},
  selectionSummary = {},
  iterationSummary = null,
} = {}) => ({
  classification: {
    category: classificationSummary.category,
    projectType: classificationSummary.projectType,
    businessModel: classificationSummary.businessModel,
    primaryGoal: classificationSummary.primaryGoal,
    confidence: classificationSummary.confidence,
  },
  selection: {
    primaryPlaybook: selectionSummary.primaryPlaybook,
    secondaryPlaybooks: selectionSummary.secondaryPlaybooks,
    requiredAgents: selectionSummary.requiredAgents,
    primaryCTA: selectionSummary.primaryCTA,
  },
  iteration: iterationSummary
    ? {
        primaryIntent: iterationSummary.primaryIntent,
        confidence: iterationSummary.confidence,
        affectedLayers: iterationSummary.affectedLayers,
        actionType: iterationSummary.actionType,
      }
    : null,
});

export const orchestrateBuilderHub = ({
  input = '',
  message = '',
  project = null,
  mode = '',
  explicitUserLevel = '',
  currentSelection = null,
} = {}) => {
  const primaryInput = getPrimaryInput({
    input,
    message,
    project,
  });

  const hubMode = resolveHubMode({
    mode,
    message,
    hasCurrentSelection: Boolean(currentSelection),
  });

  const classificationResult = classifyBuilderProject({
    text: primaryInput,
    project,
    explicitUserLevel,
  });

  const classificationSummary =
    getBuilderClassificationSummary(classificationResult);

  const selection = selectBuilderPlaybooks({
    text: primaryInput,
    project,
    explicitUserLevel,
    classificationResult,
  });

  const selectionSummary = getBuilderPlaybookSelectionSummary(selection);

  const iteration =
    hubMode === BUILDER_HUB_MODES.ITERATION
      ? interpretBuilderIteration({
          message,
          project,
          currentSelection: currentSelection || selection,
          explicitUserLevel,
        })
      : null;

  const iterationSummary = iteration
    ? getBuilderIterationSummary(iteration)
    : null;

  const status = resolveHubStatus({
    classificationSummary,
    selectionSummary,
    iterationSummary,
  });

  const requiredAgents = resolveHubAgents({
    selectionSummary,
    iterationSummary,
  });

  const decision = buildHubDecision({
    mode: hubMode,
    classificationSummary,
    selectionSummary,
    iterationSummary,
  });

  const visiblePlan = buildHubVisiblePlan({
    selectionSummary,
    iterationSummary,
  });

  const agentMessage = buildHubAgentMessage({
    mode: hubMode,
    status,
    classificationSummary,
    selectionSummary,
    iterationSummary,
  });

  const agentInstruction = buildHubAgentInstruction({
    mode: hubMode,
    status,
    classificationSummary,
    selectionSummary,
    iterationSummary,
    requiredAgents,
  });

  return {
    phase: BUILDER_HUB_PHASES.AGENT_INSTRUCTION,
    status,
    mode: hubMode,

    input: {
      raw: primaryInput,
      userMessage: message,
      initialInput: input,
    },

    classification: classificationResult,
    classificationSummary,

    selection,
    selectionSummary,

    iteration,
    iterationSummary,

    decision,
    visiblePlan,

    agent: {
      requiredAgents,
      message: agentMessage,
      instruction: agentInstruction,
    },

    trace: buildHubDebugTrace({
      classificationSummary,
      selectionSummary,
      iterationSummary,
    }),
  };
};

export const orchestrateInitialBuilderHub = ({
  input = '',
  project = null,
  explicitUserLevel = '',
} = {}) =>
  orchestrateBuilderHub({
    input,
    project,
    explicitUserLevel,
    mode: BUILDER_HUB_MODES.INITIAL_BUILD,
  });

export const orchestrateBuilderIterationHub = ({
  message = '',
  project = null,
  currentSelection = null,
  explicitUserLevel = '',
} = {}) =>
  orchestrateBuilderHub({
    message,
    project,
    currentSelection,
    explicitUserLevel,
    mode: BUILDER_HUB_MODES.ITERATION,
  });

export const getBuilderHubSummary = (hubResult = {}) => ({
  status: hubResult.status,
  mode: hubResult.mode,
  projectType: hubResult.decision?.projectType,
  category: hubResult.decision?.projectCategory,
  businessModel: hubResult.decision?.businessModel,
  conversionTarget: hubResult.decision?.conversionTarget,
  primaryPlaybook: hubResult.decision?.primaryPlaybook,
  secondaryPlaybooks: hubResult.decision?.secondaryPlaybooks || [],
  primaryCTA: hubResult.decision?.primaryCTA,
  firstQuestion: hubResult.decision?.firstQuestion,
  operationalFocus: hubResult.decision?.operationalFocus,
  iterationIntent: hubResult.decision?.iterationIntent,
  affectedLayers: hubResult.decision?.affectedLayers || [],
  requiredAgents: hubResult.agent?.requiredAgents || [],
  agentMessage: hubResult.agent?.message || '',
  agentInstruction: hubResult.agent?.instruction || '',
  visiblePlan: hubResult.visiblePlan || {},
});