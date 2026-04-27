import {
  resolveBuilderLifecycle,
  buildLifecycleDecisionMessage,
} from '../lifecycle/builderLifecycleResolver';

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
  const preview = asObject(builderAIOutput.preview);
  const landing = asObject(builderAIOutput.landing);

  return {
    ...landing,
    ...preview,
    title: pickFirstString(preview.title, landing.title, copy.title),
    headline: pickFirstString(preview.headline, landing.headline, copy.headline),
    subtitle: pickFirstString(preview.subtitle, landing.subtitle, copy.subtitle),
    description: pickFirstString(
      preview.description,
      landing.description,
      copy.description
    ),
    primaryCTA: pickFirstString(
      preview.primaryCTA,
      landing.primaryCTA,
      copy.primaryCTA
    ),
    sections: asArray(preview.sections).length
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
  const incomingCode = builderAIOutput.code;

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
  const incomingStructure = builderAIOutput.structure;

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

const buildBuilderAIState = ({
  currentBuildState = null,
  builderAIOutput = {},
  lifecycle = null,
  userInput = '',
} = {}) => {
  const previousState = asObject(currentBuildState);

  return {
    ...previousState,
    source: 'builder_ai_openai',
    lastInput: userInput,
    builderAI: {
      ok: true,
      projectKind: builderAIOutput.projectKind || '',
      sector: builderAIOutput.sector || '',
      objective: builderAIOutput.objective || '',
      tone: builderAIOutput.tone || '',
      nextAction: builderAIOutput.nextAction || '',
    },
    lifecycle: {
      readinessScore: lifecycle?.readinessScore || 0,
      currentStageId: lifecycle?.currentStage?.id || '',
      nextStageId: lifecycle?.nextStage?.id || '',
      targetStageId: lifecycle?.targetStageId || '',
      appliedActions:
        previousState.lifecycle?.appliedActions ||
        previousState.appliedLifecycleActions ||
        [],
      projectType: lifecycle?.projectType || '',
      sectorProfileId: lifecycle?.sectorProfileId || '',
      businessName: lifecycle?.businessName || '',
    },
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

  const summary = buildSummary({
    builderAIOutput: safeOutput,
    output: baseOutput,
    lifecycle,
  });

  const output = {
    ...baseOutput,
    summary,
    lifecycle,
  };

  const state = buildBuilderAIState({
    currentBuildState,
    builderAIOutput: safeOutput,
    lifecycle,
    userInput,
  });

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