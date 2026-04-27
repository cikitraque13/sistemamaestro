import {
  interpretBuilderIntent,
  summarizeBuilderIntent,
} from './builderIntentInterpreter';

import {
  BUILDER_HUB_STATUS,
  orchestrateBuilderIterationHub,
  orchestrateInitialBuilderHub,
  getBuilderHubSummary,
} from './builderHubOrchestrator';

import {
  resolveBuilderLifecycle,
  buildLifecycleDecisionMessage,
} from '../lifecycle/builderLifecycleResolver';

const cleanText = (value = '') => String(value || '').trim();

const getLifecycleCopySource = ({
  currentState = null,
  context = {},
} = {}) =>
  context?.copy ||
  currentState?.copy ||
  currentState?.landingCopy ||
  currentState?.previewCopy ||
  {};

const getLifecycleBuilderIntelligence = ({
  currentState = null,
  context = {},
  hub = null,
  hubSummary = {},
} = {}) => ({
  hubSummary,
  hubState: hub,
  lastDelta:
    context?.lastDelta ||
    currentState?.lastDelta ||
    currentState?.delta ||
    null,
  lastOperation:
    context?.lastOperation ||
    currentState?.lastOperation ||
    currentState?.operation ||
    null,
  builderBuildState:
    context?.builderBuildState ||
    currentState?.builderBuildState ||
    currentState ||
    null,
  builderKernelOutput:
    context?.builderKernelOutput ||
    currentState?.builderKernelOutput ||
    null,
  builderKernelResult:
    context?.builderKernelResult ||
    currentState?.builderKernelResult ||
    null,
  builderBuildSummary:
    context?.builderBuildSummary ||
    currentState?.builderBuildSummary ||
    null,
  appliedLifecycleActions:
    context?.appliedLifecycleActions ||
    currentState?.appliedLifecycleActions ||
    currentState?.lifecycle?.appliedActions ||
    [],
});

const resolveLifecycleForAgent = ({
  userInput = '',
  currentState = null,
  project = null,
  context = {},
  hub = null,
  hubSummary = {},
} = {}) =>
  resolveBuilderLifecycle({
    copy: getLifecycleCopySource({
      currentState,
      context,
    }),
    project,
    builderIntelligence: getLifecycleBuilderIntelligence({
      currentState,
      context,
      hub,
      hubSummary,
    }),
    userInput,
  });

const buildLifecycleQuestion = ({ lifecycle } = {}) =>
  buildLifecycleDecisionMessage({
    lifecycle,
  });

const getFallbackText = ({
  lifecycle = null,
  mode = 'iteration',
} = {}) => {
  const stageLabel = lifecycle?.currentStage?.label || 'Proyecto en marcha';
  const score = lifecycle?.readinessScore || 0;
  const primaryAction = lifecycle?.primaryAction?.label || '';

  if (mode === 'initial') {
    return [
      'He preparado la primera version visible del proyecto.',
      `Estado: ${stageLabel} (${score}/100).`,
      primaryAction
        ? `Siguiente mejora recomendada: ${primaryAction}.`
        : 'Siguiente paso: seguir madurando el proyecto.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  return [
    'He interpretado tu mensaje y mantengo el proyecto dentro de su recorrido de maduracion.',
    `Estado: ${stageLabel} (${score}/100).`,
    primaryAction
      ? `Siguiente mejora recomendada: ${primaryAction}.`
      : 'Elige la siguiente mejora para avanzar.',
  ]
    .filter(Boolean)
    .join(' ');
};

const buildLifecycleSummaryText = ({
  lifecycle = null,
  hubSummary = {},
  legacySummary = '',
} = {}) => {
  const parts = [
    lifecycle?.projectType ? `Tipo: ${lifecycle.projectType}` : '',
    lifecycle?.sectorProfileId ? `Sector: ${lifecycle.sectorProfileId}` : '',
    lifecycle?.currentStage?.label
      ? `Etapa: ${lifecycle.currentStage.label}`
      : '',
    Number.isFinite(lifecycle?.readinessScore)
      ? `Madurez: ${lifecycle.readinessScore}/100`
      : '',
    hubSummary?.primaryCTA ? `CTA: ${hubSummary.primaryCTA}` : '',
  ].filter(Boolean);

  if (parts.length) return parts.join(' | ');

  return legacySummary || 'Builder lifecycle activo.';
};

const resolveHubConfidence = ({
  hub = null,
  iterationSummary = null,
  fallbackConfidence = 'medium',
} = {}) => {
  if (hub?.status === BUILDER_HUB_STATUS.LOW_CONFIDENCE) return 'low';
  if (hub?.status === BUILDER_HUB_STATUS.NEEDS_CLARIFICATION) return 'medium';
  if (iterationSummary?.confidence) return iterationSummary.confidence;

  return fallbackConfidence || 'medium';
};

const buildHubIntentAdapter = ({
  userInput = '',
  legacyIntent = null,
  hub = null,
  hubSummary = {},
  lifecycle = null,
} = {}) => ({
  ...(legacyIntent || {}),
  source: 'builder_lifecycle',
  rawInput: userInput,
  hubStatus: hub?.status,
  hubMode: hub?.mode,
  projectType: lifecycle?.projectType || hubSummary.projectType,
  sectorProfileId: lifecycle?.sectorProfileId,
  businessName: lifecycle?.businessName,
  readinessScore: lifecycle?.readinessScore,
  currentStage: lifecycle?.currentStage?.id,
  nextStage: lifecycle?.nextStage?.id,
  targetStageId: lifecycle?.targetStageId,
  category: hubSummary.category,
  businessModel: hubSummary.businessModel,
  conversionTarget: hubSummary.conversionTarget,
  primaryPlaybook: hubSummary.primaryPlaybook,
  secondaryPlaybooks: hubSummary.secondaryPlaybooks || [],
  primaryCTA: hubSummary.primaryCTA,
  operationalFocus: hubSummary.operationalFocus,
  iterationIntent: hubSummary.iterationIntent,
  affectedLayers: hubSummary.affectedLayers || [],
  requiredAgents: hubSummary.requiredAgents || [],
});

const composeLegacyBuilderAgentResponse = ({
  userInput = '',
  currentState = null,
  project = null,
  context = {},
} = {}) => {
  const intent = interpretBuilderIntent(userInput, {
    projectId: currentState?.projectId || project?.project_id || project?.id,
    previousMode: currentState?.mode,
    previousTemplateType: currentState?.templateType,
    previousDirection: currentState?.direction,
    previousConversionGoal: currentState?.conversionGoal,
    ...context,
  });

  return {
    intent,
    text: 'He entendido la instruccion y la preparo dentro del recorrido del Builder.',
    question: null,
    confidence: intent.confidence || 'medium',
    shouldAsk: false,
    summary: summarizeBuilderIntent(intent),

    hub: null,
    hubSummary: null,
    lifecycle: null,
    delta: null,
    operation: null,
    source: 'legacy_context_only',
  };
};

const composeHubBuilderAgentResponse = ({
  userInput = '',
  currentState = null,
  project = null,
  context = {},
  legacyResponse = null,
} = {}) => {
  const hub = orchestrateBuilderIterationHub({
    message: userInput,
    project,
    currentSelection:
      context?.currentSelection ||
      currentState?.currentSelection ||
      null,
    explicitUserLevel: context?.explicitUserLevel || '',
  });

  const hubSummary = getBuilderHubSummary(hub);
  const iterationSummary = hub?.iterationSummary || null;

  const lifecycle = resolveLifecycleForAgent({
    userInput,
    currentState,
    project,
    context,
    hub,
    hubSummary,
  });

  const question = buildLifecycleQuestion({
    lifecycle,
  });

  const confidence = resolveHubConfidence({
    hub,
    iterationSummary,
    fallbackConfidence: legacyResponse?.confidence,
  });

  const intent = buildHubIntentAdapter({
    userInput,
    legacyIntent: legacyResponse?.intent,
    hub,
    hubSummary,
    lifecycle,
  });

  const text = cleanText(
    getFallbackText({
      lifecycle,
      mode: 'iteration',
    })
  );

  return {
    intent,
    text,
    question,
    confidence,
    shouldAsk: Boolean(question),
    summary: buildLifecycleSummaryText({
      lifecycle,
      hubSummary,
      legacySummary: legacyResponse?.summary,
    }),

    hub,
    hubSummary,
    lifecycle,
    delta: hub?.iteration?.delta || null,
    operation: {
      requiredAgents: hubSummary.requiredAgents || [],
      primaryCTA: hubSummary.primaryCTA || '',
      primaryPlaybook: hubSummary.primaryPlaybook || '',
      secondaryPlaybooks: hubSummary.secondaryPlaybooks || [],
      operationalFocus: hubSummary.operationalFocus || '',
      visiblePlan: hubSummary.visiblePlan || {},
      agentInstruction:
        hubSummary.agentInstruction ||
        hub?.agent?.instruction ||
        '',
      lifecycleAction:
        lifecycle?.primaryAction?.lifecycleActionId ||
        lifecycle?.primaryAction?.id ||
        '',
      lifecycleStage: lifecycle?.targetStageId || '',
      readinessScore: lifecycle?.readinessScore || 0,
    },
    source: 'builder_lifecycle',
  };
};

export const composeBuilderAgentResponse = ({
  userInput = '',
  currentState = null,
  project = null,
  context = {},
} = {}) => {
  const legacyResponse = composeLegacyBuilderAgentResponse({
    userInput,
    currentState,
    project,
    context,
  });

  try {
    return composeHubBuilderAgentResponse({
      userInput,
      currentState,
      project,
      context,
      legacyResponse,
    });
  } catch (error) {
    const lifecycle = resolveLifecycleForAgent({
      userInput,
      currentState,
      project,
      context,
    });

    const question = buildLifecycleQuestion({
      lifecycle,
    });

    return {
      ...legacyResponse,
      text: cleanText(
        getFallbackText({
          lifecycle,
          mode: 'iteration',
        })
      ),
      question,
      shouldAsk: Boolean(question),
      lifecycle,
      summary: buildLifecycleSummaryText({
        lifecycle,
        legacySummary: legacyResponse?.summary,
      }),
      error: {
        source: 'builder_lifecycle',
        message: error?.message || 'Error desconocido en Builder lifecycle.',
      },
      source: 'builder_lifecycle_fallback',
    };
  }
};

export const composeInitialBuilderAgentMessage = ({
  project = null,
  initialPrompt = '',
} = {}) => {
  const input = project?.input_content || initialPrompt || '';

  const legacyIntent = interpretBuilderIntent(input, {
    projectId: project?.project_id || project?.id,
    route: project?.route,
    projectStatus: project?.status,
  });

  try {
    const hub = orchestrateInitialBuilderHub({
      input,
      project,
    });

    const hubSummary = getBuilderHubSummary(hub);

    const lifecycle = resolveLifecycleForAgent({
      userInput: input,
      currentState: null,
      project,
      context: {},
      hub,
      hubSummary,
    });

    const question = buildLifecycleQuestion({
      lifecycle,
    });

    return {
      intent: buildHubIntentAdapter({
        userInput: input,
        legacyIntent,
        hub,
        hubSummary,
        lifecycle,
      }),
      text: cleanText(
        getFallbackText({
          lifecycle,
          mode: 'initial',
        })
      ),
      question,
      confidence: resolveHubConfidence({
        hub,
        fallbackConfidence: legacyIntent.confidence || 'medium',
      }),
      shouldAsk: Boolean(question),
      summary: buildLifecycleSummaryText({
        lifecycle,
        hubSummary,
        legacySummary: summarizeBuilderIntent(legacyIntent),
      }),

      hub,
      hubSummary,
      lifecycle,
      delta: hub?.iteration?.delta || null,
      operation: {
        requiredAgents: hubSummary.requiredAgents || [],
        primaryCTA: hubSummary.primaryCTA || '',
        primaryPlaybook: hubSummary.primaryPlaybook || '',
        secondaryPlaybooks: hubSummary.secondaryPlaybooks || [],
        operationalFocus: hubSummary.operationalFocus || '',
        visiblePlan: hubSummary.visiblePlan || {},
        agentInstruction:
          hubSummary.agentInstruction ||
          hub?.agent?.instruction ||
          '',
        lifecycleAction:
          lifecycle?.primaryAction?.lifecycleActionId ||
          lifecycle?.primaryAction?.id ||
          '',
        lifecycleStage: lifecycle?.targetStageId || '',
        readinessScore: lifecycle?.readinessScore || 0,
      },
      source: 'builder_lifecycle',
    };
  } catch (error) {
    const lifecycle = resolveLifecycleForAgent({
      userInput: input,
      project,
    });

    const question = buildLifecycleQuestion({
      lifecycle,
    });

    return {
      intent: {
        ...legacyIntent,
        source: 'builder_lifecycle_initial_fallback',
        readinessScore: lifecycle?.readinessScore || 0,
        currentStage: lifecycle?.currentStage?.id,
        nextStage: lifecycle?.nextStage?.id,
      },
      text: cleanText(
        getFallbackText({
          lifecycle,
          mode: 'initial',
        })
      ),
      question,
      confidence: legacyIntent.confidence || 'medium',
      shouldAsk: Boolean(question),
      summary: buildLifecycleSummaryText({
        lifecycle,
        legacySummary: summarizeBuilderIntent(legacyIntent),
      }),

      hub: null,
      hubSummary: null,
      lifecycle,
      delta: null,
      operation: {
        lifecycleAction:
          lifecycle?.primaryAction?.lifecycleActionId ||
          lifecycle?.primaryAction?.id ||
          '',
        lifecycleStage: lifecycle?.targetStageId || '',
        readinessScore: lifecycle?.readinessScore || 0,
      },
      error: {
        source: 'builder_lifecycle_initial',
        message: error?.message || 'Error desconocido en Builder lifecycle.',
      },
      source: 'builder_lifecycle_initial_fallback',
    };
  }
};

export const composeBuilderPhaseMessage = ({
  phase = '',
  progress = 0,
  project = null,
} = {}) => {
  const safeProgress = Number(progress) || 0;

  if (safeProgress < 20) {
    return 'Leyendo entrada, clasificando proyecto y detectando objetivo comercial.';
  }

  if (safeProgress < 40) {
    return 'Preparando primera version visible con estructura, CTA y secciones principales.';
  }

  if (safeProgress < 60) {
    return 'Sincronizando preview, codigo y estructura inicial del proyecto.';
  }

  if (safeProgress < 80) {
    return 'Refinando conversion, confianza y continuidad hacia la siguiente accion.';
  }

  if (safeProgress < 100) {
    return 'Preparando el siguiente paso del recorrido de maduracion.';
  }

  if (phase === 'complete') {
    return `Primera version lista para iterar${project?.title ? `: ${project.title}` : ''}.`;
  }

  return 'Builder listo para la siguiente mejora.';
};

export const composeAgentStatusLabel = ({
  isBuilding = false,
  pendingQuestion = null,
  error = null,
} = {}) => {
  if (error) return 'Agente revisando error';
  if (isBuilding) return 'Agente construyendo';
  if (pendingQuestion) return 'Agente esperando decision';

  return 'Agente listo';
};

export default composeBuilderAgentResponse;