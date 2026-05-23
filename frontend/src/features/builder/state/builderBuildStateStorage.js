import {
  BUILD_STATUS,
  normalizeBuildState,
} from './builderBuildState';

export const BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID = 'opp_001';
export const BUILDER_BUILD_STATE_STORAGE_PREFIX = 'sistemamaestro:builderBuildState:v1';

const isBrowserStorageAvailable = () =>
  typeof window !== 'undefined' && Boolean(window.localStorage);

const isRealProjectId = (projectId = '') => {
  const value = String(projectId || '').trim();

  return Boolean(value) && value !== 'local-builder-project';
};

const hasTraceContract = (state = {}) => {
  const hasRevision = state.revision === undefined || Number(state.revision) >= 1;
  const hasTraceId = !state.traceId || typeof state.traceId === 'string';
  const hasLastCommandId = !state.lastCommandId || typeof state.lastCommandId === 'string';
  const hasTemplateId = !state.templateId || state.templateId === BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID;

  return hasRevision && hasTraceId && hasLastCommandId && hasTemplateId;
};

const isPersistableBuildState = ({ projectId = '', templateId = '', state = null } = {}) => {
  if (!isRealProjectId(projectId)) return false;
  if (templateId !== BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID) return false;
  if (!state || typeof state !== 'object') return false;
  if (state.status === BUILD_STATUS.FAILED || state.status === 'failed') return false;

  const normalizedState = normalizeBuildState(state);

  if (normalizedState.projectId !== projectId) return false;
  if (state.templateId && state.templateId !== templateId) return false;

  return hasTraceContract(state);
};

export function getBuilderBuildStateStorageKey(projectId = '', templateId = BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID) {
  if (!isRealProjectId(projectId)) return '';
  if (templateId !== BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID) return '';

  return `${BUILDER_BUILD_STATE_STORAGE_PREFIX}:${projectId}:${templateId}`;
}

export function persistBuilderBuildState({ projectId = '', templateId = BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID, state = null } = {}) {
  if (!isBrowserStorageAvailable()) return false;
  if (!isPersistableBuildState({ projectId, templateId, state })) return false;

  const key = getBuilderBuildStateStorageKey(projectId, templateId);

  if (!key) return false;

  try {
    const normalizedState = normalizeBuildState({
      ...state,
      projectId,
      templateId,
    });

    window.localStorage.setItem(key, JSON.stringify(normalizedState));
    return true;
  } catch {
    return false;
  }
}

export function clearPersistedBuilderBuildState({ projectId = '', templateId = BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID } = {}) {
  if (!isBrowserStorageAvailable()) return false;

  const key = getBuilderBuildStateStorageKey(projectId, templateId);

  if (!key) return false;

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function restoreBuilderBuildState({ projectId = '', templateId = BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID } = {}) {
  if (!isBrowserStorageAvailable()) return null;

  const key = getBuilderBuildStateStorageKey(projectId, templateId);

  if (!key) return null;

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const normalizedState = normalizeBuildState(parsed);

    if (!isPersistableBuildState({ projectId, templateId, state: normalizedState })) {
      clearPersistedBuilderBuildState({ projectId, templateId });
      return null;
    }

    return normalizedState;
  } catch {
    clearPersistedBuilderBuildState({ projectId, templateId });
    return null;
  }
}
