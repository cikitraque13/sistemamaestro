export const BUILDER_QUESTION_PRESETS = {
  visual_direction: {
    id: 'visual_direction',
    label: 'Dirección visual',
    question: '¿Qué dirección visual quieres aplicar?',
    options: ['Premium oscuro', 'Naranja cálido', 'Claro limpio'],
  },

  conversion_goal: {
    id: 'conversion_goal',
    label: 'Objetivo de conversión',
    question: '¿Qué acción quieres priorizar?',
    options: ['Captar leads', 'Vender más', 'Generar reservas'],
  },

  cta_priority: {
    id: 'cta_priority',
    label: 'Prioridad del CTA',
    question: '¿Qué debe empujar el CTA principal?',
    options: ['Crear cuenta', 'Analizar una URL', 'Hablar por WhatsApp'],
  },

  local_business_goal: {
    id: 'local_business_goal',
    label: 'Negocio local',
    question: '¿Qué prioridad tiene el negocio?',
    options: ['Reservas', 'WhatsApp', 'Llamadas'],
  },

  design_intensity: {
    id: 'design_intensity',
    label: 'Intensidad visual',
    question: '¿Qué intensidad quieres?',
    options: ['Sobria', 'Premium', 'Más agresiva'],
  },

  output_next_step: {
    id: 'output_next_step',
    label: 'Siguiente salida',
    question: '¿Qué quieres preparar ahora?',
    options: ['Iterar diseño', 'Ver código', 'Preparar deploy'],
  },
};

export const getQuestionPreset = (questionId) =>
  BUILDER_QUESTION_PRESETS[questionId] || null;

export const resolveQuestionPreset = (intent = {}) => {
  if (intent?.clarifyingQuestion?.id) {
    return {
      ...intent.clarifyingQuestion,
      label: BUILDER_QUESTION_PRESETS[intent.clarifyingQuestion.id]?.label || 'Decisión',
    };
  }

  if (intent.templateType === 'local_business_landing') {
    return BUILDER_QUESTION_PRESETS.local_business_goal;
  }

  if (intent.requestedChanges?.colors || intent.requestedChanges?.background) {
    return BUILDER_QUESTION_PRESETS.visual_direction;
  }

  if (intent.requestedChanges?.ctas || intent.requestedChanges?.conversion) {
    return BUILDER_QUESTION_PRESETS.conversion_goal;
  }

  if (intent.confidence === 'low') {
    return BUILDER_QUESTION_PRESETS.design_intensity;
  }

  return null;
};

export const shouldAskBuilderQuestion = (intent = {}) => {
  if (!intent) return false;
  if (intent.confidence === 'low') return true;
  if (intent.shouldAsk) return true;

  return false;
};

export const buildInlineQuestionMessage = (intent = {}) => {
  const preset = resolveQuestionPreset(intent);

  if (!preset) return null;

  return {
    id: `question-${preset.id}`,
    role: 'decision',
    label: preset.label || 'Decisión',
    text: preset.question,
    options: preset.options || [],
  };
};

export default BUILDER_QUESTION_PRESETS;