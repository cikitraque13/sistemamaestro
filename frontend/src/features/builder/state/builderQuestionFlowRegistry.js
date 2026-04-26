import {
  BUILDER_QUESTION_PRESETS,
  buildInlineQuestionMessage,
} from "../presets/builderQuestionPresets";

import {
  BUILDER_MUTATION_TYPES,
  getBuilderMutation,
  getBuilderMutationCreditTier,
  getBuilderMutationLabel,
} from "./builderMutationRegistry";

import {
  hasAppliedAction,
  normalizeBuildState,
} from "./builderBuildState";

export const BUILDER_QUESTION_FLOW_VERSION = "builder-question-flow-v1";

const priorityActions = [
  BUILDER_MUTATION_TYPES.ADD_GOOGLE_ACCESS,
  BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX,
  BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
  BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS,
  BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
  BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
  BUILDER_MUTATION_TYPES.ADD_DASHBOARD,
  BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW,
  BUILDER_MUTATION_TYPES.ADD_API_LAYER,
  BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
  BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN,
];

const actionToPrompt = {
  [BUILDER_MUTATION_TYPES.ADD_GOOGLE_ACCESS]:
    "Añade acceso con Google visible en la landing y prepara componente de autenticación.",
  [BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX]:
    "Añade un bloque de suscripción con email y CTA claro.",
  [BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION]:
    "Añade una sección de confianza con autoridad, prueba social y objeciones resueltas.",
  [BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS]:
    "Añade una sección Cómo funciona con tres pasos claros.",
  [BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW]:
    "Añade flujo de reservas con formulario, CTA y estructura.",
  [BUILDER_MUTATION_TYPES.ADD_LEADS_FORM]:
    "Añade formulario de captación de leads.",
  [BUILDER_MUTATION_TYPES.ADD_DASHBOARD]:
    "Añade dashboard inicial con widgets de actividad, proyectos y créditos.",
  [BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW]:
    "Añade flujo de login, registro y acceso.",
  [BUILDER_MUTATION_TYPES.ADD_API_LAYER]:
    "Añade capa API inicial con backend, rutas y servicios.",
  [BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE]:
    "Genera estructura de carpetas frontend/backend coherente.",
  [BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN]:
    "Prepara plan de exportación profesional sin ejecutar salida todavía.",
};

const createOptionFromMutation = (type, index = 0) => ({
  id: `flow-${type}`,
  type,
  label: getBuilderMutationLabel(type),
  prompt: actionToPrompt[type] || getBuilderMutation(type)?.description || getBuilderMutationLabel(type),
  source: "builder_question_flow",
  creditTier: getBuilderMutationCreditTier(type),
  priority: 10 + index,
});

const uniqueByType = (items = []) => {
  const map = new Map();

  items.forEach((item) => {
    if (!item?.type) return;
    if (!map.has(item.type)) map.set(item.type, item);
  });

  return Array.from(map.values());
};

export function resolveBuilderNextActions(buildState = {}, context = {}) {
  const state = normalizeBuildState(buildState);

  const availableFromState = state.availableActions
    .filter((action) => !hasAppliedAction(state, action.type))
    .map((action, index) => ({
      ...createOptionFromMutation(action.type, index),
      ...action,
    }));

  const suggestedByContext = [];

  const sector = state.sector || context.knowledge?.classificationSummary?.category;
  const objective = state.objective || context.knowledge?.classificationSummary?.primaryGoal;

  if (sector === "restaurant" || objective === "reservations") {
    suggestedByContext.push(
      createOptionFromMutation(BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW, 1),
      createOptionFromMutation(BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION, 2)
    );
  }

  if (state.projectKind === "app" || context.knowledge?.hubSummary?.projectType === "ai_tool") {
    suggestedByContext.push(
      createOptionFromMutation(BUILDER_MUTATION_TYPES.ADD_DASHBOARD, 1),
      createOptionFromMutation(BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW, 2),
      createOptionFromMutation(BUILDER_MUTATION_TYPES.ADD_API_LAYER, 3)
    );
  }

  const fallback = priorityActions.map(createOptionFromMutation);

  return uniqueByType([
    ...availableFromState,
    ...suggestedByContext,
    ...fallback,
  ])
    .filter((option) => !hasAppliedAction(state, option.type))
    .slice(0, 4);
}

export function resolveBuilderQuestionPreset(buildState = {}, context = {}) {
  const state = normalizeBuildState(buildState);

  if (state.sector === "restaurant" || state.objective === "reservations") {
    return BUILDER_QUESTION_PRESETS.local_business_goal;
  }

  if (state.appliedActions.length === 0 && context.knowledge?.intent) {
    return buildInlineQuestionMessage(context.knowledge.intent);
  }

  if (state.blocks.length > 0 && state.files.length === 0) {
    return BUILDER_QUESTION_PRESETS.output_next_step;
  }

  return null;
}

export function createBuilderDecisionMessage(buildState = {}, context = {}) {
  const state = normalizeBuildState(buildState);
  const options = resolveBuilderNextActions(state, context);
  const preset = resolveBuilderQuestionPreset(state, context);

  return {
    id: `builder-decision-${state.buildStateId}-${state.appliedActions.length}`,
    role: "decision",
    label: preset?.label || "Siguiente mejora",
    text:
      preset?.text ||
      preset?.question ||
      "¿Qué quieres construir ahora sobre esta base?",
    options,
    meta: {
      source: "builder_question_flow",
      buildStateId: state.buildStateId,
      appliedActions: state.appliedActions.map((action) => action.type),
    },
  };
}

export default createBuilderDecisionMessage;