import {
  BUILDER_LIFECYCLE_STAGE_IDS,
  BUILDER_READINESS_LIMITS,
  clampReadinessScore,
  getBuilderLifecycleStageByScore,
  getNextBuilderLifecycleStage,
} from './builderProjectLifecycle';

import {
  getBuilderLifecycleAction,
} from './builderLifecycleActions';

const unique = (items = []) =>
  Array.from(new Set(items.filter(Boolean)));

export const normalizeAppliedLifecycleActions = (value = []) => {
  if (!Array.isArray(value)) return [];

  return unique(
    value
      .map((item) => {
        if (typeof item === 'string') return item;

        return item?.id || item?.actionId || item?.lifecycleActionId || '';
      })
      .filter(Boolean)
  );
};

export const getBuilderStateFromIntelligence = (builderIntelligence = {}) =>
  builderIntelligence?.builderBuildState ||
  builderIntelligence?.builderKernelResult?.state ||
  {};

export const getBuilderOutputFromIntelligence = (builderIntelligence = {}) =>
  builderIntelligence?.builderKernelOutput ||
  builderIntelligence?.builderKernelResult?.output ||
  {};

export const getAppliedLifecycleActionsFromIntelligence = (
  builderIntelligence = {}
) => {
  const state = getBuilderStateFromIntelligence(builderIntelligence);
  const output = getBuilderOutputFromIntelligence(builderIntelligence);

  return normalizeAppliedLifecycleActions(
    state.lifecycle?.appliedActions ||
      state.appliedLifecycleActions ||
      output.lifecycle?.appliedActions ||
      builderIntelligence?.appliedLifecycleActions ||
      []
  );
};

export const inferBaseReadinessScore = ({
  project = null,
  builderIntelligence = {},
} = {}) => {
  const state = getBuilderStateFromIntelligence(builderIntelligence);
  const output = getBuilderOutputFromIntelligence(builderIntelligence);

  const explicitScore =
    state.lifecycle?.readinessScore ||
    state.readinessScore ||
    output.lifecycle?.readinessScore ||
    builderIntelligence?.readinessScore;

  if (typeof explicitScore === 'number') {
    return clampReadinessScore(explicitScore);
  }

  const summary =
    builderIntelligence?.builderBuildSummary ||
    output?.summary ||
    {};

  const hasPreview =
    Boolean(output?.preview) ||
    Boolean(output?.landing) ||
    Boolean(output?.sections);

  const hasCode =
    Boolean(output?.code) ||
    Boolean(output?.files) ||
    Boolean(summary?.filesCount);

  const hasStructure =
    Boolean(output?.structure) ||
    Boolean(summary?.foldersCount);

  if (hasPreview && hasCode && hasStructure) {
    return 42;
  }

  if (hasPreview && hasCode) {
    return 40;
  }

  if (hasPreview) {
    return 36;
  }

  if (project) {
    return 24;
  }

  return 12;
};

export const calculateReadinessScore = ({
  baseScore = 0,
  appliedActions = [],
} = {}) => {
  const actionScore = normalizeAppliedLifecycleActions(appliedActions).reduce(
    (total, actionId) => {
      const action = getBuilderLifecycleAction(actionId);

      return total + (action?.scoreGain || 0);
    },
    0
  );

  return clampReadinessScore(baseScore + actionScore);
};

export const buildLifecycleState = ({
  project = null,
  builderIntelligence = {},
  appliedActions = null,
} = {}) => {
  const normalizedAppliedActions =
    appliedActions ||
    getAppliedLifecycleActionsFromIntelligence(builderIntelligence);

  const baseScore = inferBaseReadinessScore({
    project,
    builderIntelligence,
  });

  const readinessScore = calculateReadinessScore({
    baseScore,
    appliedActions: normalizedAppliedActions,
  });

  const currentStage = getBuilderLifecycleStageByScore(readinessScore);
  const nextStage = getNextBuilderLifecycleStage(currentStage.id);

  return {
    readinessScore,
    baseScore,
    appliedActions: normalizedAppliedActions,
    appliedActionsCount: normalizedAppliedActions.length,
    currentStage,
    nextStage,
    isReadyForTechnicalExit:
      readinessScore >= BUILDER_READINESS_LIMITS.TECHNICAL_EXIT_ALLOWED,
    isComplete: readinessScore >= BUILDER_READINESS_LIMITS.MAX,
  };
};

export const hasAppliedLifecycleAction = ({
  actionId,
  lifecycleState = {},
} = {}) =>
  normalizeAppliedLifecycleActions(lifecycleState.appliedActions).includes(
    actionId
  );

export const getPendingLifecycleActions = ({
  actionIds = [],
  lifecycleState = {},
} = {}) =>
  actionIds.filter(
    (actionId) =>
      !hasAppliedLifecycleAction({
        actionId,
        lifecycleState,
      })
  );

export const applyLifecycleActionToState = ({
  lifecycleState = {},
  actionId,
} = {}) => {
  const appliedActions = unique([
    ...(lifecycleState.appliedActions || []),
    actionId,
  ]);

  const readinessScore = calculateReadinessScore({
    baseScore: lifecycleState.baseScore || 0,
    appliedActions,
  });

  const currentStage = getBuilderLifecycleStageByScore(readinessScore);

  return {
    ...lifecycleState,
    readinessScore,
    appliedActions,
    appliedActionsCount: appliedActions.length,
    currentStage,
    nextStage: getNextBuilderLifecycleStage(currentStage.id),
    isReadyForTechnicalExit:
      readinessScore >= BUILDER_READINESS_LIMITS.TECHNICAL_EXIT_ALLOWED,
    isComplete: readinessScore >= BUILDER_READINESS_LIMITS.MAX,
  };
};

export const buildLifecyclePatchForAction = ({
  lifecycleState = {},
  actionId,
} = {}) => {
  const nextState = applyLifecycleActionToState({
    lifecycleState,
    actionId,
  });

  return {
    lifecycle: {
      readinessScore: nextState.readinessScore,
      currentStageId: nextState.currentStage?.id || BUILDER_LIFECYCLE_STAGE_IDS.UNDERSTANDING,
      nextStageId: nextState.nextStage?.id || BUILDER_LIFECYCLE_STAGE_IDS.BASE_BUILD,
      appliedActions: nextState.appliedActions,
      appliedActionsCount: nextState.appliedActionsCount,
      isReadyForTechnicalExit: nextState.isReadyForTechnicalExit,
      isComplete: nextState.isComplete,
    },
  };
};

export const getLifecycleStageProgressLabel = (lifecycleState = {}) => {
  const stage = lifecycleState.currentStage;

  if (!stage) return 'Proyecto en preparacion';

  if (stage.id === BUILDER_LIFECYCLE_STAGE_IDS.TECHNICAL_EXIT) {
    return `Salida tecnica · ${lifecycleState.readinessScore || 0}/100`;
  }

  return `${stage.label} · ${lifecycleState.readinessScore || 0}/100`;
};

export const getLifecycleNextStepLabel = (lifecycleState = {}) => {
  if (lifecycleState.isComplete) {
    return 'Proyecto listo';
  }

  if (lifecycleState.isReadyForTechnicalExit) {
    return 'Preparar salida tecnica';
  }

  return lifecycleState.nextStage?.label || 'Siguiente mejora';
};