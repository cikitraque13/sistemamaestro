import {
  interpretBuilderIntent,
  summarizeBuilderIntent,
} from '../../intelligence/builderIntentInterpreter';

import {
  buildCtaState,
  applyCtaOverride,
} from '../../presets/builderCtaPresets';

import {
  getVisualPreset,
  resolveVisualPresetId,
} from '../../presets/builderVisualPresets';

import {
  buildInlineQuestionMessage,
  shouldAskBuilderQuestion,
} from '../../presets/builderQuestionPresets';

export const BUILDER_WORKSPACE_STATUS = {
  IDLE: 'idle',
  THINKING: 'thinking',
  BUILDING: 'building',
  WAITING: 'waiting',
  ITERATING: 'iterating',
  READY: 'ready',
  ERROR: 'error',
};

export const DEFAULT_BUILDER_CREDIT_ESTIMATE = {
  min: 8,
  max: 18,
  label: '8–18 créditos',
};

const nowId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getProjectId = (project) => project?.project_id || project?.id || 'project_pending';

const getProjectInput = (project, initialPrompt = '') => {
  const input = project?.input_content || project?.prompt || initialPrompt;

  if (typeof input === 'string' && input.trim()) {
    return input.trim();
  }

  return 'Sin prompt inicial.';
};

const createMessage = ({ role, label, text, options = null, meta = {} }) => ({
  id: nowId(role || 'message'),
  role,
  label,
  text,
  options,
  meta,
  createdAt: new Date().toISOString(),
});

export const createUserMessage = (text, meta = {}) =>
  createMessage({
    role: 'user',
    label: 'Usuario',
    text,
    meta,
  });

export const createAgentMessage = (text, meta = {}) =>
  createMessage({
    role: 'agent',
    label: 'Agente',
    text,
    meta,
  });

export const createSystemMessage = (text, meta = {}) =>
  createMessage({
    role: 'system',
    label: 'Sistema',
    text,
    meta,
  });

export const createDecisionMessage = ({ label = 'Decisión', text, options = [], meta = {} }) =>
  createMessage({
    role: 'decision',
    label,
    text,
    options,
    meta,
  });

export const getCreditEstimateForIntent = (intent = {}) => {
  if (intent.templateType === 'gpt_hub_landing') {
    return {
      min: 12,
      max: 24,
      label: '12–24 créditos',
    };
  }

  if (intent.mode === 'transform') {
    return {
      min: 10,
      max: 22,
      label: '10–22 créditos',
    };
  }

  if (
    intent.requestedChanges?.colors ||
    intent.requestedChanges?.background ||
    intent.requestedChanges?.cards ||
    intent.requestedChanges?.ctas
  ) {
    return {
      min: 4,
      max: 10,
      label: '4–10 créditos',
    };
  }

  return DEFAULT_BUILDER_CREDIT_ESTIMATE;
};

export const resolveBuilderVisualState = (intent = {}) => {
  const visualPresetId = resolveVisualPresetId(intent);
  const visualPreset = getVisualPreset(visualPresetId);

  return {
    visualPresetId,
    visualPreset,
  };
};

export const resolveBuilderCtaState = (intent = {}, previousCtaState = null) => {
  const nextCtaState = buildCtaState(intent);

  if (!previousCtaState) {
    return nextCtaState;
  }

  return {
    ...previousCtaState,
    ...nextCtaState,
  };
};

export const buildInitialBuilderMessages = ({ project, initialPrompt, intent }) => {
  const input = getProjectInput(project, initialPrompt);
  const summary = summarizeBuilderIntent(intent);
  const messages = [
    createUserMessage(input, {
      source: 'initial_prompt',
    }),
    createAgentMessage(
      intent.mode === 'transform'
        ? 'Entendido. Voy a tratar esta entrada como una oportunidad de mejora: claridad, confianza, CTA y conversión.'
        : 'Entendido. Voy a convertir esta entrada en una primera versión estructurada con preview, código y criterio de conversión.',
      {
        source: 'initial_agent_ack',
        intentSummary: summary,
      }
    ),
  ];

  const question = shouldAskBuilderQuestion(intent)
    ? buildInlineQuestionMessage(intent)
    : null;

  if (question) {
    messages.push({
      ...question,
      id: nowId(question.id || 'decision'),
      createdAt: new Date().toISOString(),
      meta: {
        source: 'initial_clarifying_question',
      },
    });
  }

  return messages;
};

export const createBuilderWorkspaceState = ({
  project = null,
  initialPrompt = '',
  activeWorkspaceTab = 'preview',
  activeCodeTab = 'tsx',
} = {}) => {
  const rawInput = getProjectInput(project, initialPrompt);
  const intent = interpretBuilderIntent(rawInput, {
    projectId: getProjectId(project),
    route: project?.route,
    projectStatus: project?.status,
  });

  const { visualPresetId, visualPreset } = resolveBuilderVisualState(intent);
  const ctaState = resolveBuilderCtaState(intent);
  const creditEstimate = getCreditEstimateForIntent(intent);

  return {
    projectId: getProjectId(project),
    project,
    rawInput,
    intent,
    intentSummary: summarizeBuilderIntent(intent),

    mode: intent.mode,
    templateType: intent.templateType,

    status: BUILDER_WORKSPACE_STATUS.IDLE,
    progress: 0,
    isRunning: false,

    activeWorkspaceTab,
    activeCodeTab,

    direction: intent.visualDirection || 'balanced',
    conversionGoal: intent.conversionGoal || 'activation',

    visualPresetId,
    visualPreset,
    ctaState,
    creditEstimate,

    messages: buildInitialBuilderMessages({
      project,
      initialPrompt,
      intent,
    }),

    lastInstruction: null,
    lastAppliedChange: null,
    pendingQuestion: shouldAskBuilderQuestion(intent)
      ? buildInlineQuestionMessage(intent)
      : null,

    error: null,
  };
};

export const startBuilderWorkspace = (state) => ({
  ...state,
  status: BUILDER_WORKSPACE_STATUS.BUILDING,
  isRunning: true,
  progress: state.progress > 0 ? state.progress : 4,
  messages: [
    ...state.messages,
    createSystemMessage('Iniciando construcción progresiva: intención, estructura, código y preview.', {
      source: 'builder_start',
    }),
  ],
});

export const stopBuilderWorkspace = (state) => ({
  ...state,
  status: BUILDER_WORKSPACE_STATUS.READY,
  isRunning: false,
  progress: 100,
});

export const advanceBuilderProgress = (state, amount = 3) => {
  const nextProgress = Math.min(100, Math.max(0, state.progress + amount));

  return {
    ...state,
    progress: nextProgress,
    status:
      nextProgress >= 100
        ? BUILDER_WORKSPACE_STATUS.READY
        : state.status === BUILDER_WORKSPACE_STATUS.IDLE
          ? BUILDER_WORKSPACE_STATUS.BUILDING
          : state.status,
    isRunning: nextProgress < 100,
  };
};

export const setBuilderWorkspaceTab = (state, activeWorkspaceTab) => ({
  ...state,
  activeWorkspaceTab,
});

export const setBuilderCodeTab = (state, activeCodeTab) => ({
  ...state,
  activeCodeTab,
});

export const applyBuilderIntentToState = (state, intent, options = {}) => {
  const { preserveCtas = false } = options;
  const { visualPresetId, visualPreset } = resolveBuilderVisualState(intent);
  const nextCtaState = preserveCtas
    ? state.ctaState
    : resolveBuilderCtaState(intent, state.ctaState);
  const creditEstimate = getCreditEstimateForIntent(intent);
  const question = shouldAskBuilderQuestion(intent)
    ? buildInlineQuestionMessage(intent)
    : null;

  return {
    ...state,
    intent,
    intentSummary: summarizeBuilderIntent(intent),
    mode: intent.mode,
    templateType: intent.templateType,
    direction: intent.visualDirection || state.direction || 'balanced',
    conversionGoal: intent.conversionGoal || state.conversionGoal || 'activation',
    visualPresetId,
    visualPreset,
    ctaState: nextCtaState,
    creditEstimate,
    pendingQuestion: question,
  };
};

const extractDirectCtaOverride = (text) => {
  const normalized = String(text || '').trim();

  if (!normalized) return null;

  const lower = normalized.toLowerCase();

  if (!lower.includes('cta') && !lower.includes('botón') && !lower.includes('boton')) {
    return null;
  }

  if (lower.includes('whatsapp')) {
    return {
      primaryCta: 'Escribir por WhatsApp',
      secondaryCta: 'Ver servicios',
      finalCta: 'Hablar ahora',
    };
  }

  if (lower.includes('reserv')) {
    return {
      primaryCta: 'Reservar ahora',
      secondaryCta: 'Ver disponibilidad',
      finalCta: 'Confirmar reserva',
    };
  }

  if (lower.includes('url')) {
    return {
      primaryCta: 'Analizar una URL',
      secondaryCta: 'Ver ejemplo',
      finalCta: 'Probar análisis',
    };
  }

  if (lower.includes('crear') || lower.includes('proyecto')) {
    return {
      primaryCta: 'Crear mi primer proyecto',
      secondaryCta: 'Ver cómo funciona',
      finalCta: 'Entrar en Sistema Maestro',
    };
  }

  if (lower.includes('pro') || lower.includes('premium')) {
    return {
      primaryCta: 'Entrar en Pro',
      secondaryCta: 'Ver método',
      finalCta: 'Activar versión premium',
    };
  }

  return null;
};

export const applyBuilderUserInstruction = (state, instruction, response = null) => {
  const intent = interpretBuilderIntent(instruction, {
    projectId: state.projectId,
    previousMode: state.mode,
    previousTemplateType: state.templateType,
    previousDirection: state.direction,
    previousConversionGoal: state.conversionGoal,
  });

  const directCtaOverride = extractDirectCtaOverride(instruction);
  const nextState = applyBuilderIntentToState(state, intent, {
    preserveCtas: Boolean(directCtaOverride),
  });

  const ctaState = directCtaOverride
    ? applyCtaOverride(nextState.ctaState, directCtaOverride)
    : nextState.ctaState;

  const userMessage = createUserMessage(instruction, {
    source: 'manual_instruction',
  });

  const agentMessage = createAgentMessage(
    response?.text ||
      'Entendido. Voy a interpretar la mejora, ajustar la dirección visual y sincronizar el preview sin romper la estructura.',
    {
      source: 'agent_response',
      confidence: intent.confidence,
      visualDirection: intent.visualDirection,
      conversionGoal: intent.conversionGoal,
    }
  );

  const question = response?.question || nextState.pendingQuestion;

  const messages = [
    ...state.messages,
    userMessage,
    agentMessage,
  ];

  if (question && intent.confidence === 'low') {
    messages.push({
      ...question,
      id: nowId(question.id || 'decision'),
      createdAt: new Date().toISOString(),
      meta: {
        source: 'manual_clarifying_question',
      },
    });
  }

  return {
    ...nextState,
    ctaState,
    status: BUILDER_WORKSPACE_STATUS.ITERATING,
    isRunning: true,
    progress: 18,
    messages,
    lastInstruction: instruction,
    lastAppliedChange: {
      intent,
      ctaOverride: directCtaOverride,
      visualPresetId: nextState.visualPresetId,
      createdAt: new Date().toISOString(),
    },
    error: null,
  };
};

export const applyBuilderDecision = (state, option, response = null) => {
  return applyBuilderUserInstruction(state, option, response);
};

export const setBuilderWorkspaceError = (state, error) => ({
  ...state,
  status: BUILDER_WORKSPACE_STATUS.ERROR,
  isRunning: false,
  error: error?.message || String(error || 'Error desconocido'),
});

export default createBuilderWorkspaceState;