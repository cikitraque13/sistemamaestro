const getArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const toId = (value = '', fallback = 'item') =>
  String(value || fallback)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;

const normalizeSection = (section = {}, index = 0) => {
  const id = section.id || toId(section.title || section.label || `section-${index + 1}`, `section-${index + 1}`);
  const type = section.type || 'section';
  const title = section.title || section.label || `Bloque ${index + 1}`;
  const subtitle = section.subtitle || section.description || '';
  const items = getArray(section.items || section.content || section.points);

  return {
    id,
    type,
    label: section.label || title,
    props: {
      title,
      subtitle,
      badge: section.badge || '',
      buttonLabel: section.cta || section.buttonLabel || '',
      points: items,
      items,
    },
  };
};

const normalizeFile = (file = {}, index = 0) => ({
  path: file.path || file.file || `src/generated-${index + 1}.jsx`,
  content: file.content || file.code || '',
});

const normalizeNode = (node = {}, index = 0) => ({
  id: node.id || toId(node.label || node.title || `node-${index + 1}`, `node-${index + 1}`),
  label: node.label || node.title || node.name || `Nodo ${index + 1}`,
  type: node.type || 'section',
  children: getArray(node.children),
});

const createFallbackSection = (builderAIOutput = {}) => ({
  id: 'builder-ai-generated',
  type: 'hero',
  label: builderAIOutput.projectKind || 'Proyecto generado',
  props: {
    title: builderAIOutput.intent || 'Primera versión construida',
    subtitle:
      builderAIOutput.objective ||
      builderAIOutput.assistantMessage ||
      'Sistema Maestro ha generado una primera estructura visible.',
    buttonLabel: builderAIOutput.previewModelPatch?.cta || 'Continuar',
    points: [
      builderAIOutput.sector ? `Sector: ${builderAIOutput.sector}` : '',
      builderAIOutput.tone ? `Tono: ${builderAIOutput.tone}` : '',
      builderAIOutput.objective ? `Objetivo: ${builderAIOutput.objective}` : '',
    ].filter(Boolean),
  },
});

export function adaptBuilderAIOutputToKernelResult({
  builderAIOutput = {},
  currentBuildState = null,
  previousKernelOutput = null,
  project = null,
  userInput = '',
} = {}) {
  const previewPatch = builderAIOutput.previewModelPatch || {};
  const codePatch = builderAIOutput.codeModelPatch || {};
  const structurePatch = builderAIOutput.structureModelPatch || {};

  const previousPreview = previousKernelOutput?.preview || {};
  const previousCode = previousKernelOutput?.code || {};
  const previousStructure = previousKernelOutput?.structure || {};

  const rawSections = getArray(
    previewPatch.sections ||
      previewPatch.blocks ||
      previewPatch.items
  );

  const sections = rawSections.length
    ? rawSections.map(normalizeSection)
    : getArray(previousPreview.sections).length
      ? getArray(previousPreview.sections)
      : [createFallbackSection(builderAIOutput)];

  const files = getArray(codePatch.files).map(normalizeFile);
  const entryFile =
    codePatch.entryFile ||
    files[0]?.path ||
    previousCode.entryFile ||
    'src/App.jsx';

  const code = {
    ...previousCode,
    language: codePatch.language || previousCode.language || 'jsx',
    entryFile,
    files: files.length ? files : getArray(previousCode.files),
    content:
      codePatch.content ||
      codePatch.code ||
      files[0]?.content ||
      previousCode.content ||
      '',
  };

  const nodes = getArray(
    structurePatch.nodes ||
      structurePatch.items ||
      structurePatch.tree
  ).map(normalizeNode);

  const structure = {
    ...previousStructure,
    nodes: nodes.length ? nodes : getArray(previousStructure.nodes),
  };

  const preview = {
    ...previousPreview,
    layout:
      previewPatch.layout ||
      previousPreview.layout ||
      builderAIOutput.projectKind ||
      'builder_ai_layout',
    activeSectionId:
      previewPatch.activeSectionId ||
      sections[sections.length - 1]?.id ||
      previousPreview.activeSectionId ||
      null,
    sections,
  };

  const mutations = getArray(builderAIOutput.mutations);

  const summary = {
    source: 'builder_ai_openai',
    projectKind: builderAIOutput.projectKind || 'unknown',
    sector: builderAIOutput.sector || '',
    objective: builderAIOutput.objective || '',
    tone: builderAIOutput.tone || '',
    blocksCount: sections.length,
    filesCount: code.files?.length || 0,
    structureCount: structure.nodes?.length || 0,
    mutationsCount: mutations.length,
  };

  const nextAction = builderAIOutput.nextAction || '';

  const decisionMessage = nextAction
    ? {
        id: `builder-ai-next-${Date.now()}`,
        role: 'decision',
        label: 'Siguiente mejora',
        text: nextAction,
        options: [
          {
            id: 'builder-ai-next-action',
            label: nextAction,
            prompt: nextAction,
            source: 'builder_ai',
            creditTier: 'medium',
          },
        ],
      }
    : null;

  const state = {
    ...(currentBuildState || {}),
    source: 'builder_ai_openai',
    project,
    lastUserInput: userInput,
    previewModel: preview,
    codeModel: code,
    structureModel: structure,
    builderAI: {
      intent: builderAIOutput.intent || '',
      projectKind: builderAIOutput.projectKind || 'unknown',
      sector: builderAIOutput.sector || '',
      objective: builderAIOutput.objective || '',
      tone: builderAIOutput.tone || '',
      assistantMessage: builderAIOutput.assistantMessage || '',
      nextAction,
      warnings: getArray(builderAIOutput.warnings),
    },
    updatedAt: new Date().toISOString(),
  };

  return {
    ok: true,
    source: 'builder_ai_openai',
    state,
    output: {
      preview,
      code,
      structure,
      summary,
    },
    decisionMessage,
    summary,
    mutationTypes: mutations.map((mutation) => mutation?.type).filter(Boolean),
    raw: builderAIOutput,
  };
}

export default adaptBuilderAIOutputToKernelResult;