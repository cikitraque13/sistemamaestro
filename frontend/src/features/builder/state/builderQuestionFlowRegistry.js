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

const actionToImpact = {
  [BUILDER_MUTATION_TYPES.ADD_GOOGLE_ACCESS]: "Acceso",
  [BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX]: "Seguimiento",
  [BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION]: "Confianza",
  [BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS]: "Claridad",
  [BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW]: "Conversión",
  [BUILDER_MUTATION_TYPES.ADD_LEADS_FORM]: "Captación",
  [BUILDER_MUTATION_TYPES.ADD_DASHBOARD]: "Producto",
  [BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW]: "Activación",
  [BUILDER_MUTATION_TYPES.ADD_API_LAYER]: "Arquitectura",
  [BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE]: "Estructura",
  [BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN]: "Extracción",
};

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
  mutationType: type,
  mutationAction: type,
  label: getBuilderMutationLabel(type),
  description: getBuilderMutation(type)?.description || "",
  prompt: actionToPrompt[type] || getBuilderMutation(type)?.description || getBuilderMutationLabel(type),
  phase: "decisión_guiada",
  impact: actionToImpact[type] || "Construcción",
  source: "builder_question_flow",
  creditTier: getBuilderMutationCreditTier(type),
  priority: 10 + index,
});


const LANDING_CAPTURE_PHASES = [
  {
    id: "promesa_hero",
    label: "Promesa / hero",
    types: [
      BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
      BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS,
      BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
    ],
  },
  {
    id: "conversion_formulario",
    label: "Conversión / formulario",
    types: [
      BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
      BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
      BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX,
    ],
  },
  {
    id: "confianza_objeciones",
    label: "Confianza / objeciones",
    types: [
      BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
      BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS,
      BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
    ],
  },
  {
    id: "seguimiento_export_ready",
    label: "Seguimiento / export-ready",
    types: [
      BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
      BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
      BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN,
    ],
  },
];

const landingActionMeta = {
  [BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION]: {
    label: "Afinar promesa",
    description: "Hero, CTA y mensaje principal más claros.",
    impact: "Promesa",
  },
  [BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS]: {
    label: "Explicar pasos",
    description: "Tres pasos para entender la oferta rápido.",
    impact: "Claridad",
  },
  [BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION]: {
    label: "Resolver objeciones",
    description: "Prueba, autoridad y seguridad visibles.",
    impact: "Confianza",
  },
  [BUILDER_MUTATION_TYPES.ADD_LEADS_FORM]: {
    label: "Capturar lead",
    description: "Formulario simple para convertir visitas.",
    impact: "Captación",
  },
  [BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW]: {
    label: "Activar reserva",
    description: "CTA y flujo directo de solicitud.",
    impact: "Conversión",
  },
  [BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX]: {
    label: "Preparar seguimiento",
    description: "Email y continuidad comercial básica.",
    impact: "Seguimiento",
  },
  [BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE]: {
    label: "Ordenar estructura",
    description: "Carpetas y archivos listos para salida.",
    impact: "Estructura",
  },
  [BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN]: {
    label: "Preparar export",
    description: "Plan técnico sin desbloquear deploy.",
    impact: "Export-ready",
  },
};

const resolveLandingCapturePhase = (state) =>
  LANDING_CAPTURE_PHASES.find((phase) =>
    phase.types.some((type) => !hasAppliedAction(state, type))
  ) || LANDING_CAPTURE_PHASES[LANDING_CAPTURE_PHASES.length - 1];

const createLandingCaptureOption = (type, phase, index = 0) => ({
  ...createOptionFromMutation(type, index),
  ...(landingActionMeta[type] || {}),
  id: `landing-${phase.id}-${type}`,
  phase: phase.label,
  source: "builder_question_flow",
  priority: 10 + index,
});

const resolveLandingCaptureActions = (state) => {
  const phase = resolveLandingCapturePhase(state);

  return phase.types
    .filter((type) => !hasAppliedAction(state, type))
    .map((type, index) => createLandingCaptureOption(type, phase, index))
    .slice(0, 3);
};

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
  const landingCaptureActions = resolveLandingCaptureActions(state);

  if (landingCaptureActions.length) {
    return landingCaptureActions;
  }

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
    .slice(0, 3);
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
    label: preset?.label || "Landing captación V1",
    text:
      preset?.text ||
      preset?.question ||
      "Elige el siguiente paso para terminar esta landing de captación.",
    options,
    meta: {
      source: "builder_question_flow",
      buildStateId: state.buildStateId,
      appliedActions: state.appliedActions.map((action) => action.type),
    },
  };
}

export default createBuilderDecisionMessage;