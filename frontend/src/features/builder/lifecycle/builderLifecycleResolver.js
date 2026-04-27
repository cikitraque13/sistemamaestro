import {
  BUILDER_LIFECYCLE_STAGE_IDS,
  inferProjectTypeFromContext,
} from './builderProjectLifecycle';

import {
  BUILDER_LIFECYCLE_ACTION_IDS,
  getAllBuilderLifecycleActions,
  sortBuilderLifecycleActions,
} from './builderLifecycleActions';

import {
  filterAllowedLifecycleActions,
  filterBlockedLifecycleActions,
  hasExplicitTechnicalIntent,
} from './builderLifecycleGuards';

import {
  buildLifecycleState,
  hasAppliedLifecycleAction,
} from './builderLifecycleState';

import {
  resolveBuilderSectorProfile,
  collectBuilderSectorContext,
} from '../preview/builderSectorProfileResolver';

const MAX_VISIBLE_ACTIONS = 3;

const PROJECT_TYPE_ACTION_PRIORITY = {
  local_service_quote: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_QUOTE_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_WHATSAPP,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_SECTOR_FORM,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_SOCIAL_PROOF,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH,
    BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_FOLLOW_UP_FLOW,
  ],

  booking_website: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BOOKING_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_WHATSAPP,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_SECTOR_FORM,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_SOCIAL_PROOF,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRICING_OR_PLANS,
    BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_FOLLOW_UP_FLOW,
  ],

  service_website: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_SECTOR_FORM,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_WHATSAPP,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_PRIMARY_CTA,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_SOCIAL_PROOF,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRODUCTS_OR_SERVICES,
    BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_FOLLOW_UP_FLOW,
  ],

  retail_catalog: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_ORDER_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_WHATSAPP,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRODUCTS_OR_SERVICES,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH,
    BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_FOLLOW_UP_FLOW,
  ],

  affiliate_content: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_AFFILIATE_CTA,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_SOCIAL_PROOF,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH,
    BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_EXPORT_PACKAGE,
  ],

  saas_app: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_DEMO_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRICING_OR_PLANS,
    BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY,
    BUILDER_LIFECYCLE_ACTION_IDS.STABILIZE_CODE_STRUCTURE,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BACKEND_API,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_AUTH_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_DASHBOARD_VIEW,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_EXPORT_PACKAGE,
  ],

  automation_system: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_PRIMARY_CTA,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_FOLLOW_UP_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH,
    BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY,
    BUILDER_LIFECYCLE_ACTION_IDS.STABILIZE_CODE_STRUCTURE,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BACKEND_API,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_EXPORT_PACKAGE,
  ],

  internal_tool: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_PRIMARY_CTA,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_DASHBOARD_VIEW,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BACKEND_API,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_AUTH_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.STABILIZE_CODE_STRUCTURE,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_EXPORT_PACKAGE,
  ],

  community_membership: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_PRIMARY_CTA,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRICING_OR_PLANS,
    BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_AUTH_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.STABILIZE_CODE_STRUCTURE,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_EXPORT_PACKAGE,
  ],

  commercial_landing: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_PRIMARY_CTA,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_SECTOR_FORM,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_WHATSAPP,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_SOCIAL_PROOF,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH,
    BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_FOLLOW_UP_FLOW,
  ],

  portfolio_brand: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_PRIMARY_CTA,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_SOCIAL_PROOF,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH,
    BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_LOGO_PLACEHOLDER,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_EXPORT_PACKAGE,
  ],

  unknown: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_PRIMARY_CTA,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_SECTOR_FORM,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH,
    BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_EXPORT_PACKAGE,
  ],
};

const SECTOR_ACTION_PRIORITY = {
  fitness_membership: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BOOKING_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_WHATSAPP,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRICING_OR_PLANS,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_SOCIAL_PROOF,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_LOCAL_CONTEXT,
  ],

  health_clinic: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BOOKING_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_SECTOR_FORM,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_SOCIAL_PROOF,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_LOCAL_CONTEXT,
  ],

  local_service_quote: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_QUOTE_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_WHATSAPP,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_SECTOR_FORM,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_FOLLOW_UP_FLOW,
  ],

  professional_services: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_SECTOR_FORM,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_SOCIAL_PROOF,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRODUCTS_OR_SERVICES,
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_FOLLOW_UP_FLOW,
  ],

  retail_local_shop: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_ORDER_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_WHATSAPP,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRODUCTS_OR_SERVICES,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_LOCAL_CONTEXT,
  ],

  hospitality_booking: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BOOKING_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_WHATSAPP,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_SOCIAL_PROOF,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_LOCAL_CONTEXT,
  ],

  digital_product_or_saas: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_DEMO_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRICING_OR_PLANS,
    BUILDER_LIFECYCLE_ACTION_IDS.STABILIZE_CODE_STRUCTURE,
  ],

  affiliate_content: [
    BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_AFFILIATE_CTA,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH,
  ],

  automation_service: [
    BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_FOLLOW_UP_FLOW,
    BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    BUILDER_LIFECYCLE_ACTION_IDS.STABILIZE_CODE_STRUCTURE,
  ],
};

const getTargetStageId = (lifecycleState = {}) => {
  const currentStageId = lifecycleState.currentStage?.id;

  if (
    currentStageId === BUILDER_LIFECYCLE_STAGE_IDS.UNDERSTANDING ||
    currentStageId === BUILDER_LIFECYCLE_STAGE_IDS.BASE_BUILD
  ) {
    return BUILDER_LIFECYCLE_STAGE_IDS.CONVERSION;
  }

  return currentStageId || BUILDER_LIFECYCLE_STAGE_IDS.CONVERSION;
};

const getPriorityIndex = ({
  actionId,
  projectType,
  sectorProfileId,
} = {}) => {
  const sectorPriority = SECTOR_ACTION_PRIORITY[sectorProfileId] || [];
  const projectPriority = PROJECT_TYPE_ACTION_PRIORITY[projectType] || [];

  const sectorIndex = sectorPriority.includes(actionId)
    ? sectorPriority.indexOf(actionId)
    : 999;

  const projectIndex = projectPriority.includes(actionId)
    ? projectPriority.indexOf(actionId)
    : 999;

  return Math.min(sectorIndex, projectIndex);
};

const sortContextualActions = ({
  actions = [],
  projectType,
  sectorProfileId,
} = {}) =>
  sortBuilderLifecycleActions(actions).sort((a, b) => {
    const aPriority = getPriorityIndex({
      actionId: a.id,
      projectType,
      sectorProfileId,
    });

    const bPriority = getPriorityIndex({
      actionId: b.id,
      projectType,
      sectorProfileId,
    });

    if (aPriority !== bPriority) return aPriority - bPriority;

    return (a.sequenceIndex || 999) - (b.sequenceIndex || 999);
  });

const contextualizeLabel = ({
  action,
  projectType,
  sectorProfile,
} = {}) => {
  if (!action) return '';

  const sectorId = sectorProfile?.id || '';

  if (
    action.id === BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_QUOTE_FLOW ||
    (
      action.id === BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_PRIMARY_CTA &&
      projectType === 'local_service_quote'
    )
  ) {
    return 'Configurar solicitud de presupuesto';
  }

  if (
    action.id === BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BOOKING_FLOW &&
    sectorId === 'fitness_membership'
  ) {
    return 'Configurar clase de prueba';
  }

  if (
    action.id === BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BOOKING_FLOW &&
    sectorId === 'health_clinic'
  ) {
    return 'Configurar cita o valoracion';
  }

  if (
    action.id === BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BOOKING_FLOW &&
    sectorId === 'hospitality_booking'
  ) {
    return 'Configurar reserva';
  }

  if (action.id === BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_ORDER_FLOW) {
    return 'Configurar pedido';
  }

  if (action.id === BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_DEMO_FLOW) {
    return 'Configurar demo o prueba';
  }

  if (action.id === BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_AFFILIATE_CTA) {
    return 'Configurar recomendacion de afiliado';
  }

  if (
    action.id === BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ &&
    projectType === 'local_service_quote'
  ) {
    return 'Anadir garantias y FAQ';
  }

  if (
    action.id === BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_FOLLOW_UP_FLOW &&
    projectType === 'local_service_quote'
  ) {
    return 'Preparar seguimiento de presupuestos';
  }

  return action.label;
};

const contextualizePrompt = ({
  action,
  label,
  sectorProfile,
  businessName,
} = {}) => {
  const name =
    businessName ||
    sectorProfile?.defaultBusinessName ||
    'este proyecto';

  const previewDelta = action?.expectedPreviewDelta?.length
    ? ` Cambiara en preview: ${action.expectedPreviewDelta.join(', ')}.`
    : '';

  const codeDelta = action?.expectedCodeDelta?.length
    ? ` Cambiara en codigo: ${action.expectedCodeDelta.join(', ')}.`
    : '';

  const structureDelta = action?.expectedStructureDelta?.length
    ? ` Cambiara en estructura: ${action.expectedStructureDelta.join(', ')}.`
    : '';

  return `${label}. Aplicalo sobre ${name}.${previewDelta}${codeDelta}${structureDelta}`;
};

export const buildLifecycleDecisionOption = ({
  action,
  projectType,
  sectorProfile,
  businessName,
  index = 0,
} = {}) => {
  const label = contextualizeLabel({
    action,
    projectType,
    sectorProfile,
  });

  return {
    id: action.id || `lifecycle-action-${index}`,
    label,
    prompt: contextualizePrompt({
      action,
      label,
      sectorProfile,
      businessName,
    }),
    source: 'builder_lifecycle',
    lifecycleActionId: action.id,
    lifecycleStageId: action.stageId,
    creditTier: action.creditTier,
    scoreGain: action.scoreGain || 0,
    expectedPreviewDelta: action.expectedPreviewDelta || [],
    expectedCodeDelta: action.expectedCodeDelta || [],
    expectedStructureDelta: action.expectedStructureDelta || [],
  };
};

export const resolveBuilderLifecycle = ({
  copy = {},
  project = null,
  builderIntelligence = null,
  userInput = '',
  appliedActions = null,
} = {}) => {
  const contextText = collectBuilderSectorContext({
    copy,
    project,
    builderIntelligence,
  });

  const sectorResolution = resolveBuilderSectorProfile({
    copy,
    project,
    builderIntelligence,
  });

  const projectType = inferProjectTypeFromContext({
    contextText,
    sectorProfileId: sectorResolution.profileId,
  });

  const lifecycleState = buildLifecycleState({
    project,
    builderIntelligence,
    appliedActions,
  });

  const targetStageId = getTargetStageId(lifecycleState);

  const explicitTechnicalIntent = hasExplicitTechnicalIntent(
    `${userInput} ${contextText}`
  );

  const allActions = getAllBuilderLifecycleActions();

  const stageCandidateActions = allActions.filter((action) => {
    if (
      hasAppliedLifecycleAction({
        actionId: action.id,
        lifecycleState,
      }) &&
      !action.repeatable
    ) {
      return false;
    }

    return action.stageId === targetStageId;
  });

  const allowedActions = filterAllowedLifecycleActions({
    actions: stageCandidateActions,
    projectType,
    readinessScore: lifecycleState.readinessScore,
    userInput,
    explicitTechnicalIntent,
  });

  const blockedActions = filterBlockedLifecycleActions({
    actions: stageCandidateActions,
    projectType,
    readinessScore: lifecycleState.readinessScore,
    userInput,
    explicitTechnicalIntent,
  });

  const sortedActions = sortContextualActions({
    actions: allowedActions,
    projectType,
    sectorProfileId: sectorResolution.profileId,
  });

  const nextActions = sortedActions
    .slice(0, MAX_VISIBLE_ACTIONS)
    .map((action, index) =>
      buildLifecycleDecisionOption({
        action,
        projectType,
        sectorProfile: sectorResolution.profile,
        businessName: sectorResolution.businessName,
        index,
      })
    );

  const primaryAction = nextActions[0] || null;

  return {
    projectType,
    sectorProfile: sectorResolution.profile,
    sectorProfileId: sectorResolution.profileId,
    businessName: sectorResolution.businessName,
    contextText,
    lifecycleState,
    readinessScore: lifecycleState.readinessScore,
    currentStage: lifecycleState.currentStage,
    nextStage: lifecycleState.nextStage,
    targetStageId,
    nextActions,
    primaryAction,
    blockedActions,
    explicitTechnicalIntent,
  };
};

export const buildLifecycleDecisionMessage = ({
  lifecycle,
  onDecision,
} = {}) => {
  if (!lifecycle?.nextActions?.length) return null;

  const stageLabel = lifecycle.currentStage?.label || 'Proyecto en preparacion';
  const score = lifecycle.readinessScore || 0;

  return {
    id: `decision-lifecycle-${lifecycle.targetStageId || 'stage'}`,
    role: 'decision',
    label: 'Siguiente mejora',
    text:
      lifecycle.primaryAction?.label
        ? `${stageLabel} (${score}/100). Siguiente paso recomendado: ${lifecycle.primaryAction.label}.`
        : 'Elige la siguiente mejora para seguir madurando el proyecto.',
    options: lifecycle.nextActions.map((option) => ({
      ...option,
      onDecision,
    })),
    onDecision,
    meta: {
      source: 'builder_lifecycle',
      projectType: lifecycle.projectType,
      sectorProfileId: lifecycle.sectorProfileId,
      readinessScore: lifecycle.readinessScore,
      currentStage: lifecycle.currentStage?.id,
      nextStage: lifecycle.nextStage?.id,
      targetStageId: lifecycle.targetStageId,
    },
  };
};