export const BUILDER_CODE_TABS = [
  { id: 'tsx', label: 'TSX' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'py', label: 'PY' },
  { id: 'json', label: 'JSON' },
];

const safeString = (value = '') =>
  JSON.stringify(String(value || '')).replace(/^"|"$/g, '');

const getProjectId = (project) =>
  project?.project_id || project?.id || 'project_pending';

const getCopyValue = (copy = {}, key, fallback = '') =>
  copy?.[key] || fallback;

const getArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const normalizePath = (value = '') => String(value || '').toLowerCase();

const splitContent = (content = '') =>
  String(content || '')
    .replace(/\r\n/g, '\n')
    .split('\n');

const getSnapshotFileScore = (file = {}, tab = 'tsx', entryFile = '') => {
  const path = normalizePath(file.path);
  const language = normalizePath(file.language);
  const type = normalizePath(file.type);
  const isEntry = entryFile && path === normalizePath(entryFile);

  let score = isEntry ? 20 : 0;

  if (tab === 'tsx') {
    if (path.endsWith('.tsx') || path.endsWith('.jsx') || path.endsWith('.js')) score += 10;
    if (language.includes('javascript') || language.includes('typescript') || language.includes('react')) score += 8;
    if (type.includes('component') || type.includes('page') || type.includes('entry')) score += 4;
  }

  if (tab === 'html') {
    if (path.endsWith('.html')) score += 10;
    if (language.includes('html')) score += 8;
  }

  if (tab === 'css') {
    if (path.endsWith('.css')) score += 10;
    if (language.includes('css')) score += 8;
  }

  if (tab === 'py') {
    if (path.endsWith('.py')) score += 10;
    if (language.includes('python')) score += 8;
    if (type.includes('api')) score += 4;
  }

  if (tab === 'json') {
    if (path.endsWith('.json')) score += 10;
    if (language.includes('json')) score += 8;
    if (type.includes('documentation')) score += 2;
  }

  return score;
};

const getBestSnapshotFileForTab = ({
  tab = 'tsx',
  codeSnapshot = {},
} = {}) => {
  const files = getArray(codeSnapshot.files);
  const entryFile = codeSnapshot.entryFile || '';

  if (!files.length) return null;

  const scored = files
    .map((file) => ({
      file,
      score: getSnapshotFileScore(file, tab, entryFile),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.file || (tab === 'tsx' ? files[0] : null);
};

const buildSnapshotTemplate = ({
  tab = 'tsx',
  codeSnapshot = {},
} = {}) => {
  const file = getBestSnapshotFileForTab({
    tab,
    codeSnapshot,
  });

  if (!file) return null;

  if (typeof file.content === 'string' && file.content.trim()) {
    return splitContent(file.content);
  }

  return [
    `// ${file.path || codeSnapshot.entryFile || 'generated-file'}`,
    `// ${file.description || 'Archivo generado desde BuilderBuildState.'}`,
    '',
    tab === 'py'
      ? 'def generated_handler():'
      : 'export default function GeneratedComponent() {',
    tab === 'py'
      ? '    return {"status": "ready"}'
      : '  return <main>Proyecto generado por Sistema Maestro</main>;',
    tab === 'py' ? '' : '}',
  ].filter((line) => line !== '');
};

const buildGptHubCards = () => [
  {
    title: 'CifraGPT',
    useCase: 'Números, métricas y lectura financiera',
    cta: 'Abrir CifraGPT',
  },
  {
    title: 'SEO GPT',
    useCase: 'Estructura semántica y captación orgánica',
    cta: 'Abrir SEO GPT',
  },
  {
    title: 'CRO GPT',
    useCase: 'Mejoras de conversión y CTAs',
    cta: 'Abrir CRO GPT',
  },
  {
    title: 'Landing GPT',
    useCase: 'Estructura de páginas de captación',
    cta: 'Abrir Landing GPT',
  },
];

const buildTsxTemplate = ({ copy = {}, project = {}, visualState = {} }) => {
  const projectId = getProjectId(project);
  const mode = copy.mode || 'create';
  const templateType = copy.templateType || visualState.templateType || 'generic_landing';

  if (templateType === 'gpt_hub_landing') {
    return [
      'export default function GptHubLanding() {',
      `  const projectId = "${safeString(projectId)}";`,
      '  const gpts = [',
      ...buildGptHubCards().map(
        (card) =>
          `    { title: "${safeString(card.title)}", useCase: "${safeString(card.useCase)}", cta: "${safeString(card.cta)}" },`
      ),
      '  ];',
      '',
      '  return (',
      '    <main className="sm-gpt-hub">',
      '      <Hero',
      '        eyebrow="Sistema Maestro"',
      '        headline="Un hub de GPTs especializados para trabajar mejor con IA"',
      '        primaryCTA="Abrir GPT recomendado"',
      '      />',
      '      <section className="gpt-grid">',
      '        {gpts.map((gpt) => (',
      '          <article key={gpt.title} className="gpt-card">',
      '            <h3>{gpt.title}</h3>',
      '            <p>{gpt.useCase}</p>',
      '            <button>{gpt.cta}</button>',
      '          </article>',
      '        ))}',
      '      </section>',
      '    </main>',
      '  );',
      '}',
    ];
  }

  if (mode === 'transform') {
    return [
      'export default function WebsiteTransformation() {',
      `  const projectId = "${safeString(projectId)}";`,
      `  const originalWebsite = "${safeString(copy.originalLabel || 'web actual')}";`,
      `  const primaryCTA = "${safeString(copy.primaryCta || 'Aplicar rediseño')}";`,
      '',
      '  return (',
      '    <main className="sm-transformation-runtime">',
      '      <CurrentWebsiteSnapshot source={originalWebsite} />',
      '      <OptimizedWebsitePreview',
      `        headline="${safeString(copy.headline || 'Nueva versión optimizada')}"`,
      '        primaryCTA={primaryCTA}',
      '      />',
      '      <ConversionBlocks />',
      '      <TrustLayer />',
      '      <ActionFooter />',
      '    </main>',
      '  );',
      '}',
    ];
  }

  return [
    'export default function LandingRuntime() {',
    `  const projectId = "${safeString(projectId)}";`,
    `  const primaryCTA = "${safeString(copy.primaryCta || 'Crear mi primer proyecto')}";`,
    '',
    '  return (',
    '    <main className="sm-premium-landing">',
    '      <Hero',
    `        eyebrow="${safeString(copy.eyebrow || 'Sistema Maestro')}"`,
    `        headline="${safeString(copy.headline || 'Convierte una idea en un sistema digital')}"`,
    '        primaryCTA={primaryCTA}',
    `        secondaryCTA="${safeString(copy.secondaryCta || 'Analizar una URL')}"`,
    '      />',
    '      <ValueSystem />',
    '      <PlanLayer />',
    '      <FinalCTA />',
    '    </main>',
    '  );',
    '}',
  ];
};

const buildHtmlTemplate = ({ copy = {}, visualState = {} }) => {
  const templateType = copy.templateType || visualState.templateType || 'generic_landing';

  if (templateType === 'gpt_hub_landing') {
    return [
      '<main class="sm-gpt-hub">',
      '  <section class="hero">',
      '    <p class="eyebrow">Sistema Maestro</p>',
      '    <h1>Un hub de GPTs especializados para trabajar mejor con IA</h1>',
      '    <p>Accede a asistentes configurados para casos concretos y vuelve al Builder para crear tu propio sistema.</p>',
      '    <button>Abrir GPT recomendado</button>',
      '  </section>',
      '',
      '  <section class="gpt-grid">',
      '    <article class="gpt-card">',
      '      <h3>CifraGPT</h3>',
      '      <p>Números, métricas y lectura financiera.</p>',
      '      <button>Abrir CifraGPT</button>',
      '    </article>',
      '  </section>',
      '</main>',
    ];
  }

  if (copy.mode === 'transform') {
    return [
      '<main class="sm-transformation-runtime">',
      '  <section class="before-after">',
      '    <article class="before">',
      '      <p>Web actual detectada</p>',
      '      <h2>Mensaje disperso</h2>',
      '      <button>CTA poco visible</button>',
      '    </article>',
      '',
      '    <article class="after">',
      `      <p>${copy.eyebrow || 'Rediseño asistido'}</p>`,
      `      <h1>${copy.headline || 'Nueva versión optimizada'}</h1>`,
      `      <p>${copy.subheadline || 'Estructura más clara y orientada a conversión.'}</p>`,
      `      <button>${copy.primaryCta || 'Aplicar rediseño'}</button>`,
      '    </article>',
      '  </section>',
      '</main>',
    ];
  }

  return [
    '<main class="sm-premium-landing">',
    '  <section class="hero">',
    `    <p class="eyebrow">${copy.eyebrow || 'Sistema Maestro'}</p>`,
    `    <h1>${copy.headline || 'Convierte una idea en un sistema digital'}</h1>`,
    `    <p>${copy.subheadline || 'Crea, analiza y mejora proyectos digitales con IA.'}</p>`,
    '    <div class="actions">',
    `      <button>${copy.primaryCta || 'Crear mi primer proyecto'}</button>`,
    `      <button>${copy.secondaryCta || 'Analizar una URL'}</button>`,
    '    </div>',
    '  </section>',
    '</main>',
  ];
};

const buildCssTemplate = ({ visualState = {} }) => {
  const preset = visualState.visualPreset || {};
  const direction = visualState.visualPresetId || 'premium_dark';

  return [
    ':root {',
    `  --sm-direction: "${direction}";`,
    '  --sm-radius: 28px;',
    '  --sm-border: rgba(255, 255, 255, 0.10);',
    '}',
    '',
    '.sm-premium-landing,',
    '.sm-transformation-runtime,',
    '.sm-gpt-hub {',
    '  min-height: 100vh;',
    '  color: #fff;',
    '  font-family: Inter, system-ui, sans-serif;',
    '  background: #07090c;',
    '}',
    '',
    '.hero,',
    '.before-after,',
    '.gpt-grid {',
    '  padding: clamp(48px, 7vw, 96px);',
    '  border: 1px solid var(--sm-border);',
    '  border-radius: var(--sm-radius);',
    '}',
    '',
    '.actions button:first-child,',
    '.hero button,',
    '.gpt-card button {',
    '  border-radius: 18px;',
    '  padding: 14px 20px;',
    '  font-weight: 700;',
    '  background: linear-gradient(90deg, #bbf7d0, #67e8f9, #fde68a);',
    '  color: #050505;',
    '}',
    '',
    '.gpt-grid {',
    '  display: grid;',
    '  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));',
    '  gap: 16px;',
    '}',
    '',
    '.gpt-card {',
    '  border: 1px solid var(--sm-border);',
    '  border-radius: 24px;',
    '  padding: 20px;',
    '  background: rgba(255,255,255,0.04);',
    '}',
    '',
    `/* Preset activo: ${preset.label || direction} */`,
  ];
};

const buildPythonTemplate = ({ copy = {}, project = {}, intent = {} }) => {
  const projectId = getProjectId(project);

  return [
    'from dataclasses import dataclass',
    '',
    '@dataclass',
    'class BuilderRuntimePlan:',
    '    project_id: str',
    '    mode: str',
    '    template_type: str',
    '    objective: str',
    '    visual_direction: str',
    '    estimated_credits: tuple[int, int]',
    '',
    'def prepare_builder_runtime(project):',
    `    mode = "${copy.mode || intent.mode || 'create'}"`,
    `    template_type = "${copy.templateType || intent.templateType || 'generic_landing'}"`,
    `    visual_direction = "${intent.visualDirection || 'premium_dark'}"`,
    '    return BuilderRuntimePlan(',
    `        project_id="${safeString(projectId)}",`,
    '        mode=mode,',
    '        template_type=template_type,',
    `        objective="${safeString(copy.headline || 'Construir una primera versión operativa')}",`,
    '        visual_direction=visual_direction,',
    '        estimated_credits=(8, 18),',
    '    )',
  ];
};

const buildJsonTemplate = ({ copy = {}, project = {}, intent = {}, visualState = {} }) => {
  const projectId = getProjectId(project);

  return [
    '{',
    `  "project_id": "${safeString(projectId)}",`,
    `  "mode": "${copy.mode || intent.mode || 'create'}",`,
    `  "template_type": "${copy.templateType || intent.templateType || 'generic_landing'}",`,
    `  "visual_direction": "${visualState.visualPresetId || intent.visualDirection || 'premium_dark'}",`,
    `  "headline": "${safeString(copy.headline || '')}",`,
    `  "primary_cta": "${safeString(copy.primaryCta || visualState?.ctaState?.primaryCta || '')}",`,
    `  "secondary_cta": "${safeString(copy.secondaryCta || visualState?.ctaState?.secondaryCta || '')}",`,
    '  "estimated_credits": {',
    '    "min": 8,',
    '    "max": 18',
    '  },',
    '  "next_actions": [',
    '    "iterate_copy",',
    '    "improve_visual_layer",',
    '    "prepare_export",',
    '    "connect_deploy"',
    '  ]',
    '}',
  ];
};

export const buildBuilderCodeTemplates = ({
  copy = {},
  project = {},
  intent = {},
  visualState = {},
  codeSnapshot = null,
} = {}) => {
  const fallbackTemplates = {
    tsx: buildTsxTemplate({ copy, project, intent, visualState }),
    html: buildHtmlTemplate({ copy, project, intent, visualState }),
    css: buildCssTemplate({ copy, project, intent, visualState }),
    py: buildPythonTemplate({ copy, project, intent, visualState }),
    json: buildJsonTemplate({ copy, project, intent, visualState }),
  };

  if (!codeSnapshot?.files?.length) {
    return fallbackTemplates;
  }

  return BUILDER_CODE_TABS.reduce((acc, tab) => {
    acc[tab.id] =
      buildSnapshotTemplate({
        tab: tab.id,
        codeSnapshot,
      }) || fallbackTemplates[tab.id];

    return acc;
  }, {});
};

export const getBuilderCodeLines = ({
  tab = 'tsx',
  copy = {},
  project = {},
  intent = {},
  visualState = {},
  codeSnapshot = null,
} = {}) => {
  const templates = buildBuilderCodeTemplates({
    copy,
    project,
    intent,
    visualState,
    codeSnapshot,
  });

  return templates[tab] || templates.tsx;
};

export const getVisibleCodeLines = (lines = [], progress = 0) => {
  const visibleCount = Math.max(5, Math.ceil((progress / 100) * lines.length));

  return lines.slice(0, visibleCount);
};

export default buildBuilderCodeTemplates;