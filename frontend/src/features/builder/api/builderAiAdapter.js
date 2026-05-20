import {
  resolveBuilderLifecycle,
  buildLifecycleDecisionMessage,
} from '../lifecycle/builderLifecycleResolver';

import {
  applyBuildMutation,
  normalizeBuildState,
  getBuildStateSummary,
} from '../state/builderBuildState';

import {
  createBuilderOutputMap,
} from '../state/builderOutputMap';

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

const asString = (value = '') => String(value || '').trim();

const pickFirstString = (...values) =>
  values.map(asString).find(Boolean) || '';

const buildFallbackAppCode = ({
  title = 'Proyecto generado',
  subtitle = 'Primera version preparada por el Builder.',
  cta = 'Solicitar informacion',
} = {}) => `export default function App() {
  return (
    <main className="project-landing">
      <section className="hero">
        <p>Proyecto generado</p>
        <h1>${title}</h1>
        <p>${subtitle}</p>
        <button>${cta}</button>
      </section>
    </main>
  );
}
`;

const normalizeCopy = ({
  builderAIOutput = {},
  project = null,
  userInput = '',
} = {}) => {
  const copy = asObject(builderAIOutput.copy);
  const landing = asObject(builderAIOutput.landing);
  const preview = asObject(builderAIOutput.preview);

  const title = pickFirstString(
    copy.title,
    copy.headline,
    landing.title,
    landing.headline,
    preview.title,
    preview.headline,
    builderAIOutput.title,
    builderAIOutput.headline,
    project?.title,
    project?.name,
    'Proyecto generado'
  );

  const subtitle = pickFirstString(
    copy.subtitle,
    copy.description,
    landing.subtitle,
    landing.description,
    preview.subtitle,
    preview.description,
    builderAIOutput.subtitle,
    builderAIOutput.description,
    userInput,
    'Primera version visible preparada para seguir mejorando.'
  );

  const primaryCTA = pickFirstString(
    copy.primaryCTA,
    copy.cta,
    landing.primaryCTA,
    landing.cta,
    preview.primaryCTA,
    preview.cta,
    builderAIOutput.primaryCTA,
    builderAIOutput.cta,
    'Solicitar informacion'
  );

  return {
    ...copy,
    title,
    headline: title,
    subtitle,
    description: subtitle,
    primaryCTA,
    cta: primaryCTA,
  };
};

const normalizePreview = ({
  builderAIOutput = {},
  copy = {},
} = {}) => {
  const previewPatch = asObject(builderAIOutput.previewModelPatch);
  const preview = asObject(builderAIOutput.preview);
  const landing = asObject(builderAIOutput.landing);
  const patchSections = asArray(previewPatch.sections);

  return {
    ...landing,
    ...preview,
    ...previewPatch,
    title: pickFirstString(previewPatch.title, previewPatch.headline, preview.title, landing.title, copy.title),
    headline: pickFirstString(previewPatch.headline, previewPatch.title, preview.headline, landing.headline, copy.headline),
    subtitle: pickFirstString(previewPatch.subtitle, previewPatch.description, preview.subtitle, landing.subtitle, copy.subtitle),
    description: pickFirstString(
      previewPatch.description,
      previewPatch.subtitle,
      preview.description,
      landing.description,
      copy.description
    ),
    primaryCTA: pickFirstString(
      previewPatch.primaryCTA,
      previewPatch.cta,
      preview.primaryCTA,
      landing.primaryCTA,
      copy.primaryCTA
    ),
    cta: pickFirstString(
      previewPatch.cta,
      previewPatch.primaryCTA,
      preview.cta,
      landing.cta,
      copy.cta
    ),
    sections: patchSections.length
      ? patchSections
      : asArray(preview.sections).length
        ? preview.sections
        : asArray(landing.sections),
  };
};

const normalizeCode = ({
  builderAIOutput = {},
  previousKernelOutput = null,
  copy = {},
} = {}) => {
  const previousCode = asObject(previousKernelOutput?.code);
  const codePatch = asObject(builderAIOutput.codeModelPatch);
  const patchFiles = asArray(codePatch.files);
  const incomingCode = builderAIOutput.code;

  if (patchFiles.length) {
    const codeFromPatch = patchFiles.reduce((acc, file) => {
      const path = asString(file?.path);
      const content = typeof file?.content === 'string' ? file.content : '';

      if (path && content) {
        acc[path] = content;

        if (path === 'src/App.jsx') {
          acc.tsx = content;
          acc['src/App.jsx'] = content;
        }
      }

      return acc;
    }, {});

    return {
      ...previousCode,
      ...codeFromPatch,
    };
  }

  if (incomingCode && typeof incomingCode === 'object' && !Array.isArray(incomingCode)) {
    return {
      ...previousCode,
      ...incomingCode,
    };
  }

  if (typeof incomingCode === 'string' && incomingCode.trim()) {
    return {
      ...previousCode,
      tsx: incomingCode,
      'src/App.jsx': incomingCode,
    };
  }

  const fallbackCode = buildFallbackAppCode({
    title: copy.headline || copy.title,
    subtitle: copy.subtitle || copy.description,
    cta: copy.primaryCTA || copy.cta,
  });

  return {
    ...previousCode,
    tsx: previousCode.tsx || previousCode['src/App.jsx'] || fallbackCode,
    'src/App.jsx': previousCode['src/App.jsx'] || previousCode.tsx || fallbackCode,
  };
};

const normalizeStructure = ({
  builderAIOutput = {},
  previousKernelOutput = null,
} = {}) => {
  const previousStructure = asObject(previousKernelOutput?.structure);
  const structurePatch = asObject(builderAIOutput.structureModelPatch);
  const patchNodes = asArray(structurePatch.nodes);
  const patchFolders = asArray(structurePatch.folders);
  const patchFiles = asArray(structurePatch.files);
  const patchRoutes = asArray(structurePatch.routes);
  const patchApiRoutes = asArray(structurePatch.apiRoutes);
  const incomingStructure = builderAIOutput.structure;

  if (
    patchNodes.length ||
    patchFolders.length ||
    patchFiles.length ||
    patchRoutes.length ||
    patchApiRoutes.length
  ) {
    return {
      ...previousStructure,
      ...structurePatch,
      ...(patchNodes.length ? { nodes: patchNodes } : {}),
      ...(patchFolders.length ? { folders: patchFolders } : {}),
      ...(patchFiles.length ? { files: patchFiles } : {}),
      ...(patchRoutes.length ? { routes: patchRoutes } : {}),
      ...(patchApiRoutes.length ? { apiRoutes: patchApiRoutes } : {}),
    };
  }

  if (
    incomingStructure &&
    typeof incomingStructure === 'object' &&
    !Array.isArray(incomingStructure)
  ) {
    return {
      ...previousStructure,
      ...incomingStructure,
    };
  }

  const files = asArray(builderAIOutput.files);

  if (files.length) {
    return {
      ...previousStructure,
      files,
    };
  }

  return {
    folders:
      previousStructure.folders ||
      [
        'src',
        'src/components',
        'src/components/sections',
        'src/components/forms',
        'src/theme',
      ],
    files:
      previousStructure.files ||
      [
        'src/App.jsx',
        'src/components/sections/HeroSection.jsx',
        'src/components/forms/LeadForm.jsx',
        'src/theme/brandTheme.js',
      ],
  };
};

const buildSummary = ({
  builderAIOutput = {},
  output = {},
  lifecycle = null,
} = {}) => {
  const incomingSummary = asObject(builderAIOutput.summary);
  const structure = asObject(output.structure);

  const files = asArray(structure.files);
  const folders = asArray(structure.folders);
  const sections = asArray(output.preview?.sections);

  return {
    status: 'adapted_from_builder_ai',
    source: 'builder_ai_openai',
    projectKind: builderAIOutput.projectKind || '',
    sector: builderAIOutput.sector || '',
    objective: builderAIOutput.objective || '',
    tone: builderAIOutput.tone || '',
    filesCount: files.length || incomingSummary.filesCount || 0,
    foldersCount: folders.length || incomingSummary.foldersCount || 0,
    sectionsCount: sections.length || incomingSummary.sectionsCount || 0,
    readinessScore: lifecycle?.readinessScore || incomingSummary.readinessScore || 0,
    lifecycleStage: lifecycle?.targetStageId || incomingSummary.lifecycleStage || '',
    ...incomingSummary,
  };
};

const mapSectionsToBlocks = (sections = []) =>
  asArray(sections).map((section, index) => {
    const title = pickFirstString(section.title, section.headline, section.label, section.type, `Sección ${index + 1}`);
    const subtitle = pickFirstString(section.subtitle, section.description);
    const ctaLabel = pickFirstString(section.cta, section.primaryCTA, section.buttonLabel);

    return {
      id: pickFirstString(section.id, `builder-ai-section-${index + 1}`),
      type: pickFirstString(section.type, 'section'),
      label: title,
      order: Number.isFinite(section.order) ? section.order : 10 + index * 10,
      source: 'builder_ai_openai',
      props: {
        ...asObject(section.props),
        title,
        subtitle,
        description: subtitle,
        ...(ctaLabel ? { cta: ctaLabel, buttonLabel: ctaLabel } : {}),
        items: asArray(section.items),
      },
    };
  });

const mapCodePatchToFiles = (codePatch = {}) =>
  asArray(codePatch.files)
    .map((file) => ({
      path: asString(file?.path),
      type: asString(file?.type) || 'file',
      language: asString(file?.language) || asString(codePatch.language) || 'javascript',
      description: asString(file?.description),
      content: typeof file?.content === 'string' ? file.content : '',
    }))
    .filter((file) => file.path);

const mapStructureNodes = (structurePatch = {}, targetType = '') =>
  asArray(structurePatch.nodes)
    .filter((node) => asString(node?.type) === targetType)
    .map((node) => ({ path: pickFirstString(node.path, node.label, node.id) }))
    .filter((item) => item.path);

const buildBuilderAIMutation = ({
  builderAIOutput = {},
  preview = {},
  copy = {},
  userInput = '',
} = {}) => {
  const previewPatch = asObject(builderAIOutput.previewModelPatch);
  const codePatch = asObject(builderAIOutput.codeModelPatch);
  const structurePatch = asObject(builderAIOutput.structureModelPatch);
  const sections = asArray(preview.sections).length ? preview.sections : previewPatch.sections;
  const files = mapCodePatchToFiles(codePatch);
  const folders = [
    ...asArray(structurePatch.folders).map((folder) => (typeof folder === 'string' ? { path: folder } : folder)),
    ...mapStructureNodes(structurePatch, 'folder'),
  ].filter((folder) => asString(folder?.path));
  const structureFiles = [
    ...asArray(structurePatch.files).map((file) => (typeof file === 'string' ? { path: file } : file)),
    ...mapStructureNodes(structurePatch, 'file'),
  ].filter((file) => asString(file?.path));
  const primaryCTA = pickFirstString(copy.primaryCTA, copy.cta, preview.primaryCTA, preview.cta);

  return {
    id: 'builder-ai-output',
    type: 'builder_ai_output',
    label: builderAIOutput.intent || builderAIOutput.assistantMessage || 'Builder AI output',
    source: 'builder_ai_openai',
    projectKind: builderAIOutput.projectKind || undefined,
    sector: builderAIOutput.sector || undefined,
    objective: builderAIOutput.objective || undefined,
    blocks: mapSectionsToBlocks(sections),
    files,
    folders,
    ctas: primaryCTA ? [{ id: 'builder-ai-primary-cta', label: primaryCTA, href: '#', intent: 'primary' }] : [],
    previewModel: {
      ...previewPatch,
      layout: preview.layout || previewPatch.layout || builderAIOutput.projectKind || 'landing',
      activeSectionId: preview.activeSectionId || asArray(sections).at(-1)?.id || null,
    },
    codeModel: {
      ...codePatch,
      files: files.map((file) => file.path),
      entryFile: codePatch.entryFile || files[0]?.path || 'src/App.jsx',
      language: codePatch.language || 'javascript',
    },
    structureModel: {
      ...structurePatch,
      folders: folders.map((folder) => folder.path),
      files: [...structureFiles.map((file) => file.path), ...files.map((file) => file.path)].filter(Boolean),
      routes: asArray(structurePatch.routes),
      apiRoutes: asArray(structurePatch.apiRoutes),
    },
    meta: { userInput },
  };
};

export const adaptBuilderAIOutputToKernelResult = ({
  builderAIOutput = {},
  currentBuildState = null,
  previousKernelOutput = null,
  project = null,
  userInput = '',
} = {}) => {
  const safeOutput = asObject(builderAIOutput);

  const copy = normalizeCopy({
    builderAIOutput: safeOutput,
    project,
    userInput,
  });

  const preview = normalizePreview({
    builderAIOutput: safeOutput,
    copy,
  });

  const code = normalizeCode({
    builderAIOutput: safeOutput,
    previousKernelOutput,
    copy,
  });

  const structure = normalizeStructure({
    builderAIOutput: safeOutput,
    previousKernelOutput,
  });

  const baseOutput = {
    ...(asObject(previousKernelOutput) || {}),
    source: 'builder_ai_openai',
    copy,
    preview,
    code,
    structure,
    builderAI: {
      ok: true,
      projectKind: safeOutput.projectKind || '',
      sector: safeOutput.sector || '',
      objective: safeOutput.objective || '',
      tone: safeOutput.tone || '',
      nextAction: safeOutput.nextAction || '',
      assistantMessage: safeOutput.assistantMessage || '',
    },
  };

  const lifecycle = resolveBuilderLifecycle({
    copy,
    project,
    userInput,
    builderIntelligence: {
      builderBuildState: currentBuildState,
      builderKernelOutput: baseOutput,
      builderBuildSummary: previousKernelOutput?.summary || {},
      appliedLifecycleActions:
        currentBuildState?.lifecycle?.appliedActions ||
        currentBuildState?.appliedLifecycleActions ||
        [],
    },
  });

  const mutation = buildBuilderAIMutation({
    builderAIOutput: safeOutput,
    preview,
    copy,
    userInput,
  });

  const state = applyBuildMutation(
    currentBuildState ? normalizeBuildState(currentBuildState) : {},
    mutation
  );

  const outputMap = createBuilderOutputMap(state, {
    knowledge: {
      hubSummary: baseOutput.builderAI,
      iterationSummary: {
        primaryIntent: safeOutput.intent || '',
        cta: copy.primaryCTA || copy.cta || '',
      },
    },
  });

  const summary = {
    ...buildSummary({
      builderAIOutput: safeOutput,
      output: outputMap,
      lifecycle,
    }),
    ...getBuildStateSummary(state),
    source: 'builder_ai_openai',
  };

  const output = {
    ...outputMap,
    builderAI: baseOutput.builderAI,
    legacy: {
      copy,
      preview,
      code,
      structure,
    },
    summary,
    lifecycle,
  };

  const lifecycleDecisionMessage = buildLifecycleDecisionMessage({
    lifecycle,
  });

  return {
    ok: true,
    source: 'builder_ai_openai',
    input: userInput,
    output,
    state,
    summary,
    lifecycle,
    decisionMessage: lifecycleDecisionMessage,
    messages: lifecycleDecisionMessage ? [lifecycleDecisionMessage] : [],
    raw: safeOutput,
  };
};

export default adaptBuilderAIOutputToKernelResult;
