import {
  getBuildStateSummary,
  normalizeBuildState,
} from "./builderBuildState";

export const BUILDER_OUTPUT_MAP_VERSION = "builder-output-map-v1";

const sortByOrder = (items = []) =>
  [...items].sort((a, b) => {
    const left = Number.isFinite(a.order) ? a.order : 999;
    const right = Number.isFinite(b.order) ? b.order : 999;
    return left - right;
  });

const unique = (items = []) => Array.from(new Set(items.filter(Boolean)));

const createFallbackAppFile = (state) => {
  const sections = sortByOrder(state.blocks);

  const sectionLines = sections.length
    ? sections.map((section) => `      <section data-block="${section.id}"><h2>${section.label}</h2></section>`)
    : ["      <section><h2>Proyecto generado por Sistema Maestro</h2></section>"];

  return {
    path: state.codeModel?.entryFile || "src/App.jsx",
    type: "entry",
    language: "javascript",
    description: "Entrada generada desde BuilderBuildState.",
    content: [
      "export default function App() {",
      "  return (",
      "    <main>",
      ...sectionLines,
      "    </main>",
      "  );",
      "}",
    ].join("\n"),
  };
};

export function createBuilderPreviewSnapshot(buildState = {}) {
  const state = normalizeBuildState(buildState);
  const sections = sortByOrder(state.blocks).map((block) => ({
    id: block.id,
    type: block.type,
    label: block.label,
    status: block.status,
    props: block.props || {},
  }));

  return {
    version: BUILDER_OUTPUT_MAP_VERSION,
    layout: state.previewModel?.layout || state.projectKind || "landing",
    activeSectionId:
      state.previewModel?.activeSectionId ||
      sections[sections.length - 1]?.id ||
      null,
    sections,
    ctas: state.ctas,
    theme: state.theme,
    status: state.status,
    updatedAt: state.updatedAt,
  };
}

export function createBuilderCodeSnapshot(buildState = {}) {
  const state = normalizeBuildState(buildState);
  const files = state.files.length ? state.files : [createFallbackAppFile(state)];

  return {
    version: BUILDER_OUTPUT_MAP_VERSION,
    framework: state.codeModel?.framework || "react",
    language: state.codeModel?.language || "javascript",
    entryFile: state.codeModel?.entryFile || files[0]?.path || "src/App.jsx",
    files,
    visibleFiles: files.map((file) => file.path),
    updatedAt: state.updatedAt,
  };
}

export function createBuilderStructureSnapshot(buildState = {}) {
  const state = normalizeBuildState(buildState);

  const folders = unique([
    ...state.folders.map((folder) => folder.path),
    ...(state.structureModel?.folders || []),
  ]);

  const files = unique([
    ...state.files.map((file) => file.path),
    ...(state.structureModel?.files || []),
  ]);

  const routes = unique([
    ...state.routes.map((route) => route.path),
    ...(state.structureModel?.routes || []),
  ]);

  const apiRoutes = unique([
    ...state.apiRoutes.map((route) => route.path),
    ...(state.structureModel?.apiRoutes || []),
  ]);

  return {
    version: BUILDER_OUTPUT_MAP_VERSION,
    folders,
    files,
    components: state.components,
    routes,
    apiRoutes,
    updatedAt: state.updatedAt,
  };
}

export function createBuilderAgentSnapshot(buildState = {}, context = {}) {
  const state = normalizeBuildState(buildState);
  const lastTrace = state.trace[state.trace.length - 1] || null;

  return {
    version: BUILDER_OUTPUT_MAP_VERSION,
    status: state.status,
    lastAction: lastTrace,
    appliedActions: state.appliedActions,
    availableActions: state.availableActions,
    creditEstimate: state.creditEstimate,
    hubSummary: context.knowledge?.hubSummary || null,
    iterationSummary: context.knowledge?.iterationSummary || null,
    summary: getBuildStateSummary(state),
  };
}

export function createBuilderOutputMap(buildState = {}, context = {}) {
  const state = normalizeBuildState(buildState);

  return {
    version: BUILDER_OUTPUT_MAP_VERSION,
    buildState: state,
    summary: getBuildStateSummary(state),
    preview: createBuilderPreviewSnapshot(state),
    code: createBuilderCodeSnapshot(state),
    structure: createBuilderStructureSnapshot(state),
    agent: createBuilderAgentSnapshot(state, context),
  };
}

export default createBuilderOutputMap;