import {
  BUILDER_READINESS_LIMITS,
  canEnterTechnicalExit,
  isTechnicalProjectType,
} from './builderProjectLifecycle';

import {
  BUILDER_LIFECYCLE_ACTION_CATEGORIES,
  BUILDER_LIFECYCLE_ACTION_IDS,
} from './builderLifecycleActions';

const TECHNICAL_TERMS = [
  'backend',
  'api',
  'auth',
  'autenticacion',
  'login',
  'google',
  'dashboard',
  'panel',
  'github',
  'deploy',
  'dominio',
  'base de datos',
  'database',
  'usuarios',
  'cuentas',
  'area privada',
  'admin',
  'administrador',
];

const INTERNAL_FORBIDDEN_TERMS = [
  'gema maestra',
  'sistema maestro',
  'builder interno',
  'creditos internos',
  'runtime interno',
  'kernel interno',
];

export const TECHNICAL_ACTION_IDS = [
  BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BACKEND_API,
  BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_AUTH_FLOW,
  BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_DASHBOARD_VIEW,
  BUILDER_LIFECYCLE_ACTION_IDS.STABILIZE_CODE_STRUCTURE,
  BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_EXPORT_PACKAGE,
  BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_GITHUB_SYNC,
  BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_DEPLOY_PLAN,
];

export const normalizeLifecycleGuardText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const includesLifecycleTerm = (text = '', terms = []) => {
  const normalized = normalizeLifecycleGuardText(text);

  return terms.some((term) =>
    normalized.includes(normalizeLifecycleGuardText(term))
  );
};

export const hasExplicitTechnicalIntent = (text = '') =>
  includesLifecycleTerm(text, TECHNICAL_TERMS);

export const hasInternalForbiddenTerm = (text = '') =>
  includesLifecycleTerm(text, INTERNAL_FORBIDDEN_TERMS);

export const isTechnicalLifecycleAction = (action = {}) =>
  TECHNICAL_ACTION_IDS.includes(action.id) ||
  action.category === BUILDER_LIFECYCLE_ACTION_CATEGORIES.TECHNICAL_EXIT ||
  action.category === BUILDER_LIFECYCLE_ACTION_CATEGORIES.TECHNICAL_INTERNAL;

export const getLifecycleActionText = (action = {}) =>
  [
    action.id,
    action.label,
    action.prompt,
    action.category,
    action.stageId,
  ]
    .filter(Boolean)
    .join(' ');

export const isLifecycleActionAllowed = ({
  action,
  projectType,
  readinessScore = 0,
  userInput = '',
  explicitTechnicalIntent = false,
} = {}) => {
  if (!action) {
    return {
      allowed: false,
      reason: 'missing_action',
    };
  }

  const actionText = getLifecycleActionText(action);

  if (hasInternalForbiddenTerm(actionText)) {
    return {
      allowed: false,
      reason: 'internal_forbidden_term',
    };
  }

  if (!action.projectTypes?.includes(projectType)) {
    return {
      allowed: false,
      reason: 'project_type_not_allowed',
    };
  }

  const textTechnicalIntent =
    explicitTechnicalIntent || hasExplicitTechnicalIntent(userInput);

  const technicalProject = isTechnicalProjectType(projectType);
  const technicalAction = isTechnicalLifecycleAction(action);

  if (
    action.requiresExplicitIntent &&
    !textTechnicalIntent &&
    !technicalProject
  ) {
    return {
      allowed: false,
      reason: 'requires_explicit_technical_intent',
    };
  }

  if (
    action.blockedUntilTechnicalExit &&
    !canEnterTechnicalExit({
      readinessScore,
      projectType,
      explicitTechnicalIntent: textTechnicalIntent,
    })
  ) {
    return {
      allowed: false,
      reason: 'blocked_until_technical_exit',
    };
  }

  if (
    technicalAction &&
    readinessScore < BUILDER_READINESS_LIMITS.TECHNICAL_EXIT_ALLOWED &&
    !textTechnicalIntent &&
    !technicalProject
  ) {
    return {
      allowed: false,
      reason: 'technical_action_too_early',
    };
  }

  return {
    allowed: true,
    reason: 'allowed',
  };
};

export const filterAllowedLifecycleActions = ({
  actions = [],
  projectType,
  readinessScore = 0,
  userInput = '',
  explicitTechnicalIntent = false,
} = {}) =>
  actions
    .map((action) => ({
      action,
      guard: isLifecycleActionAllowed({
        action,
        projectType,
        readinessScore,
        userInput,
        explicitTechnicalIntent,
      }),
    }))
    .filter(({ guard }) => guard.allowed)
    .map(({ action }) => action);

export const filterBlockedLifecycleActions = ({
  actions = [],
  projectType,
  readinessScore = 0,
  userInput = '',
  explicitTechnicalIntent = false,
} = {}) =>
  actions
    .map((action) => ({
      action,
      guard: isLifecycleActionAllowed({
        action,
        projectType,
        readinessScore,
        userInput,
        explicitTechnicalIntent,
      }),
    }))
    .filter(({ guard }) => !guard.allowed);

export const explainBlockedLifecycleActions = ({
  actions = [],
  projectType,
  readinessScore = 0,
  userInput = '',
  explicitTechnicalIntent = false,
} = {}) =>
  filterBlockedLifecycleActions({
    actions,
    projectType,
    readinessScore,
    userInput,
    explicitTechnicalIntent,
  }).map(({ action, guard }) => ({
    id: action?.id,
    label: action?.label,
    reason: guard.reason,
  }));