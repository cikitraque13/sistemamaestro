import { normalizeBuildState } from "./builderBuildState";

export const BUILDER_STRUCTURE_REGISTRY_VERSION = "builder-structure-registry-v1";

const unique = (items = []) => Array.from(new Set(items.filter(Boolean)));

const dirname = (path = "") => {
  const parts = String(path).split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
};

const toTreeNode = (path, type = "folder") => ({
  id: `${type}-${String(path).replace(/[^a-zA-Z0-9]+/g, "-")}`,
  path,
  name: String(path).split("/").filter(Boolean).pop() || path,
  type,
});

export function deriveBuilderFoldersFromFiles(files = []) {
  const folders = [];

  files.forEach((file) => {
    const dir = dirname(file.path || file);
    if (!dir) return;

    const parts = dir.split("/");
    let current = "";

    parts.forEach((part) => {
      current = current ? `${current}/${part}` : part;
      folders.push(current);
    });
  });

  return unique(folders);
}

export function normalizeBuilderStructure(buildState = {}) {
  const state = normalizeBuildState(buildState);

  const filePaths = unique(state.files.map((file) => file.path));
  const derivedFolders = deriveBuilderFoldersFromFiles(filePaths);

  const folders = unique([
    ...state.folders.map((folder) => folder.path),
    ...derivedFolders,
    ...(state.structureModel?.folders || []),
  ]);

  const files = unique([
    ...filePaths,
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
    version: BUILDER_STRUCTURE_REGISTRY_VERSION,
    folders,
    files,
    routes,
    apiRoutes,
    components: state.components,
    hasFrontend: folders.some((folder) => folder.startsWith("src")),
    hasBackend: folders.some((folder) => folder.startsWith("backend")),
    hasAuth: folders.some((folder) => folder.includes("auth")),
    hasExport: folders.some((folder) => folder.startsWith("export")),
    updatedAt: state.updatedAt,
  };
}

export function createBuilderStructureTree(buildState = {}) {
  const structure = normalizeBuilderStructure(buildState);

  return {
    version: BUILDER_STRUCTURE_REGISTRY_VERSION,
    nodes: [
      ...structure.folders.map((path) => toTreeNode(path, "folder")),
      ...structure.files.map((path) => toTreeNode(path, "file")),
      ...structure.routes.map((path) => toTreeNode(path, "route")),
      ...structure.apiRoutes.map((path) => toTreeNode(path, "api_route")),
    ],
    summary: {
      foldersCount: structure.folders.length,
      filesCount: structure.files.length,
      routesCount: structure.routes.length,
      apiRoutesCount: structure.apiRoutes.length,
    },
  };
}

export function hasBuilderStructureOutput(buildState = {}) {
  const structure = normalizeBuilderStructure(buildState);

  return (
    structure.folders.length > 0 ||
    structure.files.length > 0 ||
    structure.routes.length > 0 ||
    structure.apiRoutes.length > 0
  );
}

export default normalizeBuilderStructure;