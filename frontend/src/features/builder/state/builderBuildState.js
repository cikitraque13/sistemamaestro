export const BUILDER_BUILD_STATE_VERSION = "builder-build-state-v1";

export const BUILD_STATUS = {
  IDLE: "idle",
  INTERPRETING: "interpreting",
  PLANNING: "planning",
  MUTATING: "mutating",
  BUILDING: "building",
  PREVIEW_READY: "preview_ready",
  CODE_READY: "code_ready",
  STRUCTURE_READY: "structure_ready",
  AWAITING_USER_DECISION: "awaiting_user_decision",
  FAILED: "failed",
};

const DEFAULT_MODELS = {
  previewModel: {
    layout: "landing",
    sections: [],
    activeSectionId: null,
    updatedAt: null,
  },
  codeModel: {
    framework: "react",
    language: "javascript",
    files: [],
    entryFile: "src/App.jsx",
    updatedAt: null,
  },
  structureModel: {
    folders: [],
    files: [],
    components: [],
    routes: [],
    apiRoutes: [],
    updatedAt: null,
  },
};

function nowIso() {
  return new Date().toISOString();
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function text(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stableId(prefix, value) {
  return text(value, `${prefix}-${Date.now()}`)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/^$/, `${prefix}-${Date.now()}`);
}

function mergeByKey(current = [], next = [], key = "id") {
  const map = new Map();

  toArray(current).forEach((item) => {
    if (!isObject(item)) return;

    const itemKey = item[key] || item.path || item.name || item.type || item.label;
    if (itemKey) {
      map.set(String(itemKey), item);
    }
  });

  toArray(next).forEach((item) => {
    if (!isObject(item)) return;

    const itemKey = item[key] || item.path || item.name || item.type || item.label;
    if (itemKey) {
      map.set(String(itemKey), item);
    }
  });

  return Array.from(map.values());
}

function normalizeBlock(block, index = 0) {
  if (!isObject(block)) return null;

  const type = text(block.type, "section");
  const label = text(block.label || block.title, type);
  const id = text(block.id, stableId("block", `${type}-${label}`));

  return {
    id,
    type,
    label,
    order: Number.isFinite(block.order) ? block.order : index,
    status: text(block.status, "active"),
    source: text(block.source, "builder"),
    props: isObject(block.props) ? block.props : {},
    createdAt: block.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

function normalizeComponent(component) {
  if (!isObject(component)) return null;

  const name = text(component.name || component.id, "GeneratedComponent");
  const id = text(component.id, stableId("component", name));

  return {
    id,
    name,
    type: text(component.type, "component"),
    filePath: text(component.filePath || component.path, ""),
    props: isObject(component.props) ? component.props : {},
    createdAt: component.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

function normalizeFile(file) {
  if (!isObject(file)) return null;

  const path = text(file.path || file.filePath, "");
  if (!path) return null;

  return {
    path,
    type: text(file.type, "file"),
    language: text(file.language, "javascript"),
    description: text(file.description, ""),
    content: typeof file.content === "string" ? file.content : "",
    createdAt: file.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

function normalizeFolder(folder) {
  if (typeof folder === "string") {
    return {
      path: folder,
      type: "folder",
      description: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }

  if (!isObject(folder)) return null;

  const path = text(folder.path || folder.name, "");
  if (!path) return null;

  return {
    path,
    type: "folder",
    description: text(folder.description, ""),
    createdAt: folder.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

function normalizeRoute(route) {
  if (typeof route === "string") {
    return {
      path: route,
      label: route,
      component: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }

  if (!isObject(route)) return null;

  const path = text(route.path, "");
  if (!path) return null;

  return {
    path,
    label: text(route.label, path),
    component: text(route.component, ""),
    createdAt: route.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

function normalizeCta(cta) {
  if (!isObject(cta)) return null;

  const label = text(cta.label, "Crear");
  const id = text(cta.id, stableId("cta", label));

  return {
    id,
    label,
    href: text(cta.href, "#"),
    intent: text(cta.intent, "primary"),
    target: text(cta.target, "_self"),
    createdAt: cta.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

function normalizeAction(action) {
  if (!isObject(action)) return null;

  const type = text(action.type || action.mutationType || action.id, "");
  if (!type) return null;

  return {
    id: text(action.id, stableId("action", type)),
    type,
    label: text(action.label, type),
    source: text(action.source, "user"),
    creditTier: text(action.creditTier || action.credit_tier, "none"),
    priority: Number.isFinite(action.priority) ? action.priority : 50,
    meta: isObject(action.meta) ? action.meta : {},
    createdAt: action.createdAt || nowIso(),
  };
}

export function createInitialBuildState(input = {}) {
  const timestamp = nowIso();
  const projectId = text(input.projectId || input.project_id, "local-builder-project");

  return {
    version: BUILDER_BUILD_STATE_VERSION,
    projectId,
    buildStateId: text(
      input.buildStateId || input.build_state_id,
      stableId("build-state", `${projectId}-${timestamp}`)
    ),
    projectKind: text(input.projectKind || input.project_kind, "landing"),
    mode: text(input.mode, "guided"),
    status: text(input.status, BUILD_STATUS.IDLE),
    sourceType: text(input.sourceType || input.source_type, "idea"),
    userIntent: text(input.userIntent || input.user_intent, ""),
    sector: text(input.sector, "generic"),
    objective: text(input.objective, "conversion"),
    userLevel: text(input.userLevel || input.user_level, "mixed"),
    theme: isObject(input.theme) ? input.theme : {},
    blocks: [],
    components: [],
    pages: [],
    routes: [],
    apiRoutes: [],
    folders: [],
    files: [],
    ctas: [],
    appliedActions: [],
    availableActions: [],
    creditEstimate: {
      tier: "none",
      credits: 0,
      reason: "initial_state",
    },
    trace: [],
    errors: [],
    ...DEFAULT_MODELS,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function normalizeBuildState(state = {}) {
  const base = createInitialBuildState(state);

  return {
    ...base,
    ...state,
    version: BUILDER_BUILD_STATE_VERSION,
    projectId: text(state.projectId || state.project_id, base.projectId),
    buildStateId: text(state.buildStateId || state.build_state_id, base.buildStateId),
    projectKind: text(state.projectKind || state.project_kind, base.projectKind),
    mode: text(state.mode, base.mode),
    status: text(state.status, base.status),
    sourceType: text(state.sourceType || state.source_type, base.sourceType),
    userIntent: text(state.userIntent || state.user_intent, base.userIntent),
    sector: text(state.sector, base.sector),
    objective: text(state.objective, base.objective),
    userLevel: text(state.userLevel || state.user_level, base.userLevel),
    theme: isObject(state.theme) ? state.theme : base.theme,
    blocks: toArray(state.blocks).map(normalizeBlock).filter(Boolean),
    components: toArray(state.components).map(normalizeComponent).filter(Boolean),
    pages: toArray(state.pages).map(normalizeRoute).filter(Boolean),
    routes: toArray(state.routes).map(normalizeRoute).filter(Boolean),
    apiRoutes: toArray(state.apiRoutes || state.api_routes).map(normalizeRoute).filter(Boolean),
    folders: toArray(state.folders).map(normalizeFolder).filter(Boolean),
    files: toArray(state.files).map(normalizeFile).filter(Boolean),
    ctas: toArray(state.ctas).map(normalizeCta).filter(Boolean),
    appliedActions: toArray(state.appliedActions || state.applied_actions)
      .map(normalizeAction)
      .filter(Boolean),
    availableActions: toArray(state.availableActions || state.available_actions)
      .map(normalizeAction)
      .filter(Boolean),
    previewModel: isObject(state.previewModel || state.preview_model)
      ? state.previewModel || state.preview_model
      : DEFAULT_MODELS.previewModel,
    codeModel: isObject(state.codeModel || state.code_model)
      ? state.codeModel || state.code_model
      : DEFAULT_MODELS.codeModel,
    structureModel: isObject(state.structureModel || state.structure_model)
      ? state.structureModel || state.structure_model
      : DEFAULT_MODELS.structureModel,
    creditEstimate: isObject(state.creditEstimate || state.credit_estimate)
      ? state.creditEstimate || state.credit_estimate
      : base.creditEstimate,
    trace: toArray(state.trace),
    errors: toArray(state.errors),
    createdAt: state.createdAt || state.created_at || base.createdAt,
    updatedAt: state.updatedAt || state.updated_at || nowIso(),
  };
}

export function hasAppliedAction(state, actionType) {
  const normalizedState = normalizeBuildState(state);
  const type = text(actionType);

  if (!type) return false;

  return normalizedState.appliedActions.some((action) => action.type === type);
}

export function applyBuildMutation(currentState, mutation = {}) {
  const state = normalizeBuildState(currentState);
  const timestamp = nowIso();

  if (!isObject(mutation)) {
    return createBuildStateFailure(state, {
      type: "invalid_mutation",
      message: "Mutation must be an object.",
    });
  }

  const mutationType = text(mutation.type || mutation.mutationType || mutation.id, "");
  const appliedAction = normalizeAction({
    id: mutation.id,
    type: mutationType,
    label: mutation.label,
    source: mutation.source || "user",
    creditTier: mutation.creditTier || mutation.credit_tier,
    meta: mutation.meta,
  });

  const nextBlocks = toArray(mutation.blocks).map(normalizeBlock).filter(Boolean);
  const nextComponents = toArray(mutation.components).map(normalizeComponent).filter(Boolean);
  const nextPages = toArray(mutation.pages).map(normalizeRoute).filter(Boolean);
  const nextRoutes = toArray(mutation.routes).map(normalizeRoute).filter(Boolean);
  const nextApiRoutes = toArray(mutation.apiRoutes || mutation.api_routes)
    .map(normalizeRoute)
    .filter(Boolean);
  const nextFolders = toArray(mutation.folders).map(normalizeFolder).filter(Boolean);
  const nextFiles = toArray(mutation.files).map(normalizeFile).filter(Boolean);
  const nextCtas = toArray(mutation.ctas).map(normalizeCta).filter(Boolean);
  const nextAvailableActions = toArray(mutation.availableActions || mutation.available_actions)
    .map(normalizeAction)
    .filter(Boolean);

  return {
    ...state,
    status: text(mutation.nextStatus || mutation.next_status, BUILD_STATUS.AWAITING_USER_DECISION),
    projectKind: text(mutation.projectKind || mutation.project_kind, state.projectKind),
    mode: text(mutation.mode, state.mode),
    sector: text(mutation.sector, state.sector),
    objective: text(mutation.objective, state.objective),
    theme: isObject(mutation.theme) ? { ...state.theme, ...mutation.theme } : state.theme,
    blocks: mergeByKey(state.blocks, nextBlocks, "id"),
    components: mergeByKey(state.components, nextComponents, "id"),
    pages: mergeByKey(state.pages, nextPages, "path"),
    routes: mergeByKey(state.routes, nextRoutes, "path"),
    apiRoutes: mergeByKey(state.apiRoutes, nextApiRoutes, "path"),
    folders: mergeByKey(state.folders, nextFolders, "path"),
    files: mergeByKey(state.files, nextFiles, "path"),
    ctas: mergeByKey(state.ctas, nextCtas, "id"),
    appliedActions: appliedAction
      ? mergeByKey(state.appliedActions, [appliedAction], "type")
      : state.appliedActions,
    availableActions: nextAvailableActions.length
      ? mergeByKey(nextAvailableActions, state.availableActions, "type")
      : state.availableActions,
    previewModel: isObject(mutation.previewModel || mutation.preview_model)
      ? {
          ...state.previewModel,
          ...(mutation.previewModel || mutation.preview_model),
          updatedAt: timestamp,
        }
      : state.previewModel,
    codeModel: isObject(mutation.codeModel || mutation.code_model)
      ? {
          ...state.codeModel,
          ...(mutation.codeModel || mutation.code_model),
          updatedAt: timestamp,
        }
      : state.codeModel,
    structureModel: isObject(mutation.structureModel || mutation.structure_model)
      ? {
          ...state.structureModel,
          ...(mutation.structureModel || mutation.structure_model),
          updatedAt: timestamp,
        }
      : state.structureModel,
    creditEstimate: isObject(mutation.creditEstimate || mutation.credit_estimate)
      ? mutation.creditEstimate || mutation.credit_estimate
      : state.creditEstimate,
    trace: [
      ...state.trace,
      {
        type: mutationType || "unknown_mutation",
        label: text(mutation.label, mutationType || "Mutation"),
        source: text(mutation.source, "user"),
        affectedBlocks: nextBlocks.map((block) => block.id),
        affectedComponents: nextComponents.map((component) => component.id),
        affectedFiles: nextFiles.map((file) => file.path),
        affectedRoutes: nextRoutes.map((route) => route.path),
        createdAt: timestamp,
      },
    ],
    updatedAt: timestamp,
  };
}

export function createBuildStateFailure(state, error = {}) {
  const normalizedState = normalizeBuildState(state);
  const timestamp = nowIso();

  return {
    ...normalizedState,
    status: BUILD_STATUS.FAILED,
    errors: [
      ...normalizedState.errors,
      {
        type: text(error.type, "builder_state_error"),
        message: text(error.message, "Unknown builder state error."),
        meta: isObject(error.meta) ? error.meta : {},
        createdAt: timestamp,
      },
    ],
    updatedAt: timestamp,
  };
}

export function getBuildStateSummary(state = {}) {
  const normalizedState = normalizeBuildState(state);

  return {
    projectId: normalizedState.projectId,
    buildStateId: normalizedState.buildStateId,
    projectKind: normalizedState.projectKind,
    status: normalizedState.status,
    sector: normalizedState.sector,
    objective: normalizedState.objective,
    blocksCount: normalizedState.blocks.length,
    componentsCount: normalizedState.components.length,
    filesCount: normalizedState.files.length,
    foldersCount: normalizedState.folders.length,
    routesCount: normalizedState.routes.length,
    appliedActionsCount: normalizedState.appliedActions.length,
    availableActionsCount: normalizedState.availableActions.length,
    updatedAt: normalizedState.updatedAt,
  };
}