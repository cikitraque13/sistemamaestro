import { api } from '../../../../lib/apiClient';
import { validatedProjectIdentity, requireOutputIdentity } from '../../state/projectIdentity.mjs';
import { staticTrustDecision } from '../../state/staticSectionMutation.mjs';
import useDurableLandingTransaction from './useDurableLandingTransaction';
import { parseLandingChange } from '../../command/parseLandingChange.mjs';
import {
  PREVIEW_STREAM_COPY,
  loadLandingPreview,
  previewErrorMessage,
  previewStreamStalled,
  stepNeedsPatience,
  streamLandingPreview,
  streamTerminalState,
  streamWatchdog,
} from '../../api/builderPreviewClient';

const autoPreviewJobs = new Map();
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';

import {
  buildLandingCopy,
  resolveDirection,
} from '../../utils/builderLandingCopy';

import {
  buildPhaseMessages,
  getAgentStatusFromBuildPhase,
} from '../../data/builderBuildPhases';

import {
  composeBuilderAgentResponse,
  composeInitialBuilderAgentMessage,
} from '../../intelligence/builderAgentResponseComposer';

import {
  runBuilderBuildKernel,
  runBuilderDecisionMutation,
} from '../../state/builderBuildKernel';

import {
  getBuildStateSummary,
} from '../../state/builderBuildState';

import {
  createBuilderOutputMap,
} from '../../state/builderOutputMap';

import {
  getBuilderCodeLines,
} from '../../utils/builderCodeTemplates';



import {
  buildWithBuilderAI,
} from '../../api/builderAiClient';

import {
  adaptBuilderAIOutputToKernelResult,
} from '../../api/builderAiAdapter';

import {
  BUILDER_MUTATION_TYPES,
} from '../../state/builderMutationRegistry';

import {
  BUILDER_COMMAND_V2_ENABLED,
  parseAtomicBuilderCommand,
} from '../../command/parseAtomicBuilderCommand.mjs';

import {
  applyAtomicBuilderCommandToState,
  isAtomicBuilderCommandAllowed,
  verifyAtomicBuilderCommandDelta,
} from '../../command/applyAtomicBuilderCommand.mjs';

const createStableProjectKey = ({
  projectId = '',
  fallbackId = '',
  inputType = '',
  inputContent = '',
  route = '',
  status = '',
} = {}) => {
  const parts = [
    projectId,
    fallbackId,
    inputType,
    inputContent,
    route,
    status,
  ].filter(Boolean);

  return parts.length ? parts.join('|') : 'no-project';
};

const normalizeRuntimeText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const includesAny = (text = '', terms = []) =>
  terms.some((term) => text.includes(normalizeRuntimeText(term)));


const buildAtomicCommandKernelResult = ({
  command = null,
  currentState = null,
  previousKernelOutput = null,
  project = null,
  input = '',
} = {}) => {
  const state = applyAtomicBuilderCommandToState(command, currentState || previousKernelOutput?.buildState || {});
  const output = createBuilderOutputMap(state, {
    knowledge: {
      iterationSummary: {
        primaryIntent: 'atomic_mutation',
        cta: command?.expectedDelta?.primaryCTA || '',
      },
    },
  });
  const codeLines = getBuilderCodeLines({
    tab: 'json',
    copy: {
      primaryCTA: state.primaryCTA,
      primaryCta: state.primaryCTA,
      visualAccent: state.visualAccent,
    },
    project,
    visualState: {
      visualAccent: state.visualAccent,
      ctaState: {
        primaryCta: state.primaryCTA,
        visualAccent: state.visualAccent,
      },
    },
  });
  const deltaVerified = verifyAtomicBuilderCommandDelta({
    command,
    output,
    codeLines,
  });

  return {
    version: 'builder-build-kernel-v1',
    ok: deltaVerified,
    input,
    previousState: currentState,
    state: {
      ...state,
      commandStatus: deltaVerified ? 'delta_verified' : 'blocked_delta_not_verified',
    },
    mutations: command ? [command] : [],
    mutationTypes: [
      command?.mutation?.type,
      command?.visual?.accent ? 'update_visual_accent' : '',
    ].filter(Boolean),
    command,
    output: deltaVerified
      ? output
      : createBuilderOutputMap({
          ...state,
          commandStatus: 'blocked_delta_not_verified',
        }),
    structure: output.structure,
    decisionMessage: null,
    summary: getBuildStateSummary(state),
    deltaVerified,
    builderAISkipped: true,
    creditConsumed: false,
  };
};

const createUserMessage = (text) => ({
  id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role: 'user',
  label: 'Usuario',
  text,
});

const createAgentMessage = (text, meta = {}) => ({
  id: `agent-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role: 'agent',
  label: 'Agente',
  text,
  meta,
});

const createDecisionOption = ({
  id,
  label,
  title,
  description = '',
  impact = 'Mejora directa del Builder',
  prompt,
  source = 'runtime_context',
  creditTier = 'medium',
  mutationType = BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
  mutationAction = '',
} = {}) => ({
  id,
  label: label || title,
  title: title || label,
  description,
  impact,
  prompt: prompt || description || label || title,
  source,
  creditTier,
  type: mutationType || mutationAction,
  mutationType: mutationType || mutationAction,
  mutationAction: mutationAction || mutationType,
});

const createDecisionMessage = ({
  projectId = '',
  text = '',
  options = [],
  onDecision,
} = {}) => ({
  id: `decision-runtime-${projectId || 'project'}-${Date.now()}`,
  role: 'decision',
  label: 'Siguiente mejora',
  text,
  options,
  onDecision,
});

const attachDecisionHandler = (message, onDecision) => {
  if (!message) return null;

  return {
    ...message,
    onDecision,
    options: (message.options || []).map((option) => ({
      ...option,
      onDecision,
    })),
  };
};

const getRuntimeContextText = ({
  project = null,
  initialPrompt = '',
  copy = {},
  hubSummary = {},
} = {}) =>
  normalizeRuntimeText(
    [
      project?.input_content,
      project?.prompt,
      project?.title,
      project?.summary,
      initialPrompt,
      copy?.eyebrow,
      copy?.headline,
      copy?.subheadline,
      copy?.sectionTitle,
      hubSummary?.projectType,
      hubSummary?.category,
      hubSummary?.businessModel,
      hubSummary?.primaryPlaybook,
      hubSummary?.operationalFocus,
      hubSummary?.conversionTarget,
      hubSummary?.primaryCTA,
      ...(hubSummary?.secondaryPlaybooks || []),
    ]
      .filter(Boolean)
      .join(' ')
  );


const buildSafeFallbackDecisionOptions = () => [
  createDecisionOption({
    id: 'fallback-add-trust',
    label: 'Añadir confianza',
    description: 'Incorpora prueba social, autoridad y objeciones resueltas.',
    impact: 'Aumenta credibilidad y reduce fricción',
    mutationType: BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
    creditTier: 'low',
  }),
  createDecisionOption({
    id: 'fallback-improve-conversion',
    label: 'Mejorar conversión',
    description: 'Refuerza CTA, jerarquía visual y continuidad comercial.',
    impact: 'Mejora claridad y acción principal',
    mutationType: BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
    creditTier: 'medium',
  }),
  createDecisionOption({
    id: 'fallback-prepare-followup',
    label: 'Preparar seguimiento',
    description: 'Añade captura de leads para continuar la relación.',
    impact: 'Activa seguimiento y oportunidad comercial',
    mutationType: BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
    creditTier: 'low',
  }),
];

const getDecisionMutationKey = (option = {}) =>
  option?.mutationType || option?.mutationAction || option?.type || option?.id || '';

const resolveVisibleDecisionOptions = ({ options = [], appliedDecisionTypes = [] } = {}) => {
  const applied = new Set(appliedDecisionTypes.filter(Boolean));
  const seen = new Set();
  const candidates = [
    ...(options || []),
    ...buildSafeFallbackDecisionOptions(),
  ];

  return candidates
    .filter(Boolean)
    .filter((option) => {
      const key = getDecisionMutationKey(option);

      if (!key || applied.has(key) || seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .slice(0, 3);
};

const buildSistemaMaestroDecisionOptions = () => [
  createDecisionOption({
    id: 'sm-hero',
    label: 'Crear hero de Sistema Maestro',
    prompt:
      'Construye un hero especÃƒÂ­fico para Sistema Maestro con titular potente, promesa clara, subtÃƒÂ­tulo breve y CTAs Ã¢â‚¬Å“Entrar en Sistema MaestroÃ¢â‚¬Â y Ã¢â‚¬Å“Ver cÃƒÂ³mo funcionaÃ¢â‚¬Â.',
    creditTier: 'medium',
  }),
  createDecisionOption({
    id: 'sm-google-access',
    label: 'AÃƒÂ±adir acceso con Google',
    prompt:
      'AÃƒÂ±ade un recuadro premium de acceso con Ã¢â‚¬Å“Entrar con GoogleÃ¢â‚¬Â y Ã¢â‚¬Å“SuscribirmeÃ¢â‚¬Â, conectado al mensaje de activaciÃƒÂ³n del usuario.',
    creditTier: 'medium',
  }),
  createDecisionOption({
    id: 'sm-live-builder',
    label: 'Explicar Builder en vivo',
    prompt:
      'Crea una secciÃƒÂ³n que explique que Sistema Maestro construye en vivo con cÃƒÂ³digo, preview, agente y mejoras iterativas.',
    creditTier: 'medium',
  }),
  createDecisionOption({
    id: 'sm-gema',
    label: 'Mostrar Gema Maestra y crÃƒÂ©ditos',
    prompt:
      'Añade una sección de Gema Maestra y de créditos. No es una tabla de precios. No habla de exportación ni de publicación.',
    creditTier: 'medium',
  }),
  createDecisionOption({
    id: 'sm-how-it-works',
    label: 'Crear secciÃƒÂ³n CÃƒÂ³mo funciona',
    prompt:
      'Añade una sección «Cómo funciona» con tres pasos: describe la idea, el Builder prepara la preview, revisas el borrador.',
    creditTier: 'medium',
  }),
];

const buildRestaurantDecisionOptions = () => [
  createDecisionOption({
    id: 'restaurant-reservations',
    label: 'Activar reservas directas',
    prompt:
      'Optimiza la landing para reservas directas con CTA claro, WhatsApp, horario, ubicaciÃƒÂ³n y reducciÃƒÂ³n de fricciÃƒÂ³n.',
  }),
  createDecisionOption({
    id: 'restaurant-menu',
    label: 'Destacar carta y platos',
    prompt:
      'AÃƒÂ±ade una secciÃƒÂ³n de carta, platos recomendados, fotos y motivos para reservar.',
  }),
  createDecisionOption({
    id: 'restaurant-trust',
    label: 'AÃƒÂ±adir reseÃƒÂ±as locales',
    prompt:
      'AÃƒÂ±ade reseÃƒÂ±as, confianza local, ubicaciÃƒÂ³n y prueba social para aumentar reservas.',
  }),
];

const buildAutomationDecisionOptions = () => [
  createDecisionOption({
    id: 'automation-map',
    label: 'Mapear proceso',
    prompt:
      'Mapea el proceso actual con pasos, responsables, herramientas, entradas, salidas y puntos de fricciÃƒÂ³n.',
  }),
  createDecisionOption({
    id: 'automation-flow',
    label: 'DiseÃƒÂ±ar flujo automatizado',
    prompt:
      'DiseÃƒÂ±a un flujo automatizado con triggers, condiciones, herramientas, responsables y seguimiento.',
    creditTier: 'high',
  }),
  createDecisionOption({
    id: 'automation-dashboard',
    label: 'Crear dashboard de control',
    prompt:
      'AÃƒÂ±ade una vista de dashboard para controlar estado, tareas, errores, mÃƒÂ©tricas y resultados del proceso.',
    creditTier: 'high',
  }),
];

const buildSaasDecisionOptions = () => [
  createDecisionOption({
    id: 'saas-use-case',
    label: 'Explicar caso de uso',
    prompt:
      'Explica el caso de uso principal con problema, soluciÃƒÂ³n, resultado y CTA de activaciÃƒÂ³n.',
  }),
  createDecisionOption({
    id: 'saas-onboarding',
    label: 'Mejorar onboarding',
    prompt:
      'AÃƒÂ±ade una primera experiencia de onboarding para que el usuario entienda quÃƒÂ© hacer en menos de un minuto.',
  }),
  createDecisionOption({
    id: 'saas-features',
    label: 'Ordenar funciones por valor',
    prompt:
      'Ordena las funciones por valor real para el usuario, no como lista tÃƒÂ©cnica genÃƒÂ©rica.',
  }),
];

const buildGenericDecisionOptions = ({
  primaryCTA = '',
} = {}) => [
  createDecisionOption({
    id: 'generic-promise',
    mutationType: BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
    label: 'Reforzar promesa principal',
    prompt:
      'Refuerza la promesa principal con resultado concreto, especificidad y motivo claro para actuar ahora.',
  }),
  createDecisionOption({
    id: 'generic-cta',
    mutationType: BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
    label: primaryCTA ? `Ajustar CTA: ${primaryCTA}` : 'Ajustar CTA principal',
    prompt: primaryCTA
      ? `Ajusta el CTA principal hacia Ã¢â‚¬Å“${primaryCTA}Ã¢â‚¬Â y mejora su continuidad en hero, bloques y cierre.`
      : 'Ajusta el CTA principal para que sea mÃƒÂ¡s claro, accionable y coherente con el objetivo real del proyecto.',
  }),
  createDecisionOption({
    id: 'generic-trust',
    mutationType: BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
    label: 'AÃƒÂ±adir confianza',
    prompt:
      'AÃƒÂ±ade seÃƒÂ±ales de confianza, autoridad, prueba social y objeciones resueltas sin recargar la interfaz.',
  }),
  createDecisionOption({
    id: 'generic-structure',
    mutationType: BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
    label: 'Ordenar estructura',
    prompt:
      'Ordena la estructura para que hero, beneficios, prueba social, CTA y cierre trabajen juntos.',
  }),
];

const buildRuntimeDecisionOptions = ({
  project = null,
  initialPrompt = '',
  copy = {},
  hubSummary = {},
} = {}) => {
  const context = getRuntimeContextText({
    project,
    initialPrompt,
    copy,
    hubSummary,
  });

  const isSistemaMaestro = includesAny(context, [
    'sistema maestro',
    'builder en vivo',
    'gema maestra',
    'ideas urls prompts',
    'ideas url prompts',
    'proyectos reales con ia',
    'entrar con google',
    'suscribirme',
  ]);

  if (isSistemaMaestro) {
    return buildSistemaMaestroDecisionOptions();
  }

  const isRestaurant = includesAny(context, [
    'restaurante',
    'hosteleria',
    'carta',
    'mesa',
    'reserva',
    'platos',
  ]);

  if (isRestaurant) {
    return buildRestaurantDecisionOptions();
  }

  const isAutomation = includesAny(context, [
    'automatizacion',
    'automation',
    'workflow',
    'flujo',
    'make',
    'zapier',
    'crm',
    'proceso',
  ]);

  if (isAutomation) {
    return buildAutomationDecisionOptions();
  }

  const isSaas = includesAny(context, [
    'saas',
    'software',
    'herramienta digital',
    'ai tool',
    'ia',
    'dashboard',
    'plataforma',
    'onboarding',
  ]);

  if (isSaas) {
    return buildSaasDecisionOptions();
  }

  return buildGenericDecisionOptions({
    primaryCTA: hubSummary?.primaryCTA || copy?.primaryCta || '',
  });
};

const buildRuntimeDecisionMessage = ({
  progress = 0,
  project = null,
  initialPrompt = '',
  copy = {},
  hubSummary = {},
  onDecision,
  appliedDecisionTypes = [],
} = {}) => {
  if (progress < 96) return null;

  const options = resolveVisibleDecisionOptions({
    options: buildRuntimeDecisionOptions({
      project,
      initialPrompt,
      copy,
      hubSummary,
    }),
    appliedDecisionTypes,
  });

  return createDecisionMessage({
    projectId: project?.project_id || project?.id || '',
    text:
      hubSummary?.firstQuestion ||
      'Elige una mejora para seguir construyendo esta versiÃƒÂ³n.',
    options,
    onDecision,
  });
};

const createInitialMessages = ({
  copy,
  projectInput,
  initialPrompt,
  initialAgentText = '',
  initialAgentSummary = '',
  initialHubSummary = null,
}) => {
  const input =
    projectInput ||
    initialPrompt ||
    'Sin prompt inicial.';

  const fallbackText =
    copy.mode === 'transform'
      ? 'Entendido. Voy a tratar esta entrada como una oportunidad de mejora: claridad, confianza, CTA y conversiÃƒÂ³n.'
      : 'Entendido. Voy a convertir esta entrada en una primera versiÃƒÂ³n estructurada con preview, cÃƒÂ³digo y criterio de conversiÃƒÂ³n.';

  return [
    createUserMessage(input),
    createAgentMessage(
      initialAgentText || fallbackText,
      {
        source: initialAgentText ? 'initial_builder_hub' : 'initial_agent_ack',
        summary: initialAgentSummary,
        hubSummary: initialHubSummary,
      }
    ),
  ];
};

const mergeMessagesWithPhases = ({
  baseMessages,
  copy,
  progress,
  onDecision,
}) => {
  const phaseMessages = buildPhaseMessages({
    mode: copy.mode,
    templateType: copy.templateType,
    progress,
    onDecision,
  }).filter((message) => message?.role !== 'decision');

  return [
    ...baseMessages,
    ...phaseMessages,
  ];
};

export default function useBuilderWorkspaceRuntime({
  ownerId = null,
  project = null,
  initialPrompt = '',
  autoStart = false,
  loadingProject = false,
  projectError = '',
} = {}) {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('tsx');
  const [direction, setDirection] = useState('balanced');
  const [manualMessages, setManualMessages] = useState([]);

  const [hubState, setHubState] = useState(null);
  const [hubSummary, setHubSummary] = useState(null);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [lastDelta, setLastDelta] = useState(null);
  const [lastOperation, setLastOperation] = useState(null);

  const [builderBuildState, setBuilderBuildState] = useState(null);
  const [builderKernelResult, setBuilderKernelResult] = useState(null);
  const [builderKernelOutput, setBuilderKernelOutput] = useState(null);
  const [builderDecisionMessage, setBuilderDecisionMessage] = useState(null);
  const [builderBuildSummary, setBuilderBuildSummary] = useState(null);
  const [appliedDecisionTypes, setAppliedDecisionTypes] = useState([]);
  const [generatedPreview, setGeneratedPreview] = useState(null);
  const [previewNotice, setPreviewNotice] = useState('');
  const [streamProgressAt, setStreamProgressAt] = useState(0);
  const [previewPhase, setPreviewPhase] = useState(autoStart ? 'working' : '');
  const [executorPhase, setExecutorPhase] = useState(autoStart ? 'construyendo' : 'idle');
  const [executorMessage, setExecutorMessage] = useState(autoStart ? 'Construyendo tu página.' : 'El ejecutor está listo.');
  const [executorSteps, setExecutorSteps] = useState([]);
  const [executorLog, setExecutorLog] = useState([]);
  const [partialHtml, setPartialHtml] = useState('');
  const [slowStep, setSlowStep] = useState(false);

  let identity = null;
  try { identity = validatedProjectIdentity(project, ownerId, project?.project_id); } catch { /* fail closed */ }
  const liveIdentity = useRef(null);
  liveIdentity.current = identity && JSON.stringify(identity);
  useEffect(() => () => { liveIdentity.current = null; }, []);
  const binding = identity && { ...identity, verify: async () => {
    const response = await api.get(`/projects/${encodeURIComponent(identity.projectId)}`);
    return validatedProjectIdentity(response.data, identity.ownerId, identity.projectId).serverRevision;
  }};
  const projectId = project?.project_id || '';
  const fallbackId = project?.id || '';
  const projectInputType = project?.input_type || '';
  const projectPrompt = project?.prompt || '';
  const projectInputContent = project?.input_content || projectPrompt || '';
  const projectRoute = project?.route || '';
  const projectStatus = project?.status || '';
  const projectTitle = project?.title || '';
  const projectSummary = project?.summary || '';

  const projectKey = useMemo(
    () =>
      createStableProjectKey({
        projectId,
        fallbackId,
        inputType: projectInputType,
        inputContent: projectInputContent,
        route: projectRoute,
        status: projectStatus,
      }),
    [
      projectId,
      fallbackId,
      projectInputType,
      projectInputContent,
      projectRoute,
      projectStatus,
    ]
  );

  const projectReady = Boolean(
    Boolean(identity) && projectKey !== 'no-project' &&
    !loadingProject &&
    !projectError
  );

  const projectSnapshot = useMemo(
    () => {
      if (!projectReady) return null;

      return {
        project_id: projectId,
        id: fallbackId,
        input_type: projectInputType,
        input_content: projectInputContent,
        prompt: projectPrompt,
        route: projectRoute,
        status: projectStatus,
        title: projectTitle,
        summary: projectSummary,
      };
    },
    [
      projectReady,
      projectId,
      fallbackId,
      projectInputType,
      projectInputContent,
      projectPrompt,
      projectRoute,
      projectStatus,
      projectTitle,
      projectSummary,
    ]
  );

  const copy = useMemo(
    () => buildLandingCopy(project, initialPrompt, direction),
    [
      project,
      initialPrompt,
      direction,
    ]
  );

  const applyKernelResult = useCallback((kernelResult) => {
    const nextState = kernelResult?.state || null;

    setBuilderKernelResult(kernelResult || null);
    setBuilderBuildState(nextState);
    setBuilderKernelOutput(kernelResult?.output || null);
    setBuilderDecisionMessage(kernelResult?.decisionMessage || null);
    setBuilderBuildSummary(kernelResult?.summary || null);

    // Unbound legacy caches are preserved on disk, never implicitly recovered.
  }, [projectId]);

  const commitLanding = useCallback((state) => {
    applyKernelResult({ ok: true, state, output: createBuilderOutputMap(state), summary: getBuildStateSummary(state) });
  }, [applyKernelResult]);
  const landingTransaction = useDurableLandingTransaction(builderBuildState, commitLanding, ownerId, binding);

  const startBuild = useCallback(() => {
    setProgress(4);
    setIsRunning(true);
  }, []);

  const applyExecutorEvent = useCallback((event) => {
    if (!event || event.type === 'heartbeat') return;
    setStreamProgressAt(Date.now());
    const outcome = streamTerminalState(event);
    if (outcome && !outcome.terminal) {
      setPreviewNotice(outcome.notice);
      setExecutorMessage(outcome.message);
      setExecutorLog((current) => [...current, { role: 'agent', text: outcome.notice }]);
      return;
    }
    if (outcome?.terminal && outcome.phase === 'error') {
      setPreviewNotice(outcome.notice);
      setPreviewPhase('error');
      setExecutorPhase('error');
      setExecutorMessage(outcome.message);
      setPartialHtml('');
      return;
    }
    if (event.type === 'state') {
      setExecutorPhase(event.phase || 'construyendo');
      setExecutorMessage(event.message || '');
      if (event.phase === 'construyendo' || event.phase === 'iterando') setPreviewPhase('working');
      if (event.phase === 'completado') setPreviewPhase('ready');
      if (event.phase === 'error') setPreviewPhase('error');
    }
    if (event.type === 'step') {
      setExecutorSteps((current) => {
        const index = current.findIndex((item) => item.id === event.id);
        const previous = index >= 0 ? current[index] : null;
        const startedAt = event.status === 'in_progress' ? Date.now() : previous?.startedAt;
        const item = { ...event, startedAt };
        if (index < 0) return [...current, item];
        return current.map((entry, position) => (position === index ? item : entry));
      });
    }
    if (event.type === 'section' && event.html) setPartialHtml(event.html);
    if (event.type === 'done') {
      setGeneratedPreview(event);
      setPartialHtml('');
      setExecutorPhase('completado');
      setExecutorMessage(event.summary || PREVIEW_STREAM_COPY.done);
      setPreviewPhase('ready');
      setPreviewNotice((current) => (
        typeof current === 'string' && current.includes(PREVIEW_STREAM_COPY.pending) ? current : ''
      ));
      if (event.summary) setExecutorLog((current) => [...current, { role: 'agent', text: event.summary }]);
    }
  }, []);

  useEffect(() => {
    const active = executorPhase === 'construyendo' || executorPhase === 'iterando';
    if (!active) return undefined;
    const startedAt = streamProgressAt || Date.now();
    const wait = Math.max(0, streamWatchdog.ms - (Date.now() - startedAt));
    const timer = window.setTimeout(() => {
      if (!previewStreamStalled(startedAt, Date.now(), streamWatchdog.ms)) return;
      const stalled = streamTerminalState({ type: 'timeout' });
      setPreviewNotice(stalled.notice);
      setPreviewPhase('error');
      setExecutorPhase('error');
      setExecutorMessage(stalled.message);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [executorPhase, streamProgressAt]);

  const activeExecutorStep = executorSteps.find((step) => step.status === 'in_progress');
  useEffect(() => {
    if (!activeExecutorStep?.startedAt) {
      setSlowStep(false);
      return undefined;
    }
    const wait = Math.max(0, 20000 - (Date.now() - activeExecutorStep.startedAt));
    setSlowStep(stepNeedsPatience(activeExecutorStep.startedAt));
    const timer = window.setTimeout(() => setSlowStep(true), wait);
    return () => window.clearTimeout(timer);
  }, [activeExecutorStep?.id, activeExecutorStep?.status, activeExecutorStep?.startedAt]);

  const runPreview = useCallback(async (projectValue, instruction, pace) => {
    const iterating = Boolean(generatedPreview?.html);
    setExecutorPhase(iterating ? 'iterando' : 'construyendo');
    setExecutorMessage(iterating ? 'Iterando sobre la versión guardada.' : 'Construyendo tu página.');
    setPreviewPhase('working');
    setPreviewNotice('');
    setPartialHtml('');
    setExecutorSteps([]);
    setExecutorLog((current) => [...current, { role: 'user', text: instruction }]);
    const preview = await streamLandingPreview(projectValue, instruction, applyExecutorEvent, { pace });
    if (!preview?.html) {
      setPreviewPhase('error');
      setExecutorPhase('error');
      setExecutorMessage('No se ha podido preparar la preview. No se ha publicado nada.');
      setPartialHtml('');
      return preview;
    }
    setGeneratedPreview(preview);
    setPreviewPhase('ready');
    setExecutorPhase('completado');
    setPreviewNotice((current) => (
      typeof current === 'string' && current.includes(PREVIEW_STREAM_COPY.pending) ? current : ''
    ));
    return preview;
  }, [applyExecutorEvent, generatedPreview?.html]);

  const submitMessage = useCallback(
    async (text, pace) => {
      const value = String(text || '').trim();

      if (!value || !projectReady) return;
      if (project?.project_id && builderBuildState?.projectKind === 'landing') {
        try {
          const operations = parseLandingChange(value);
          if (operations) {
            if (!ownerId || landingTransaction.status !== 'ready') {
              landingTransaction.reject('Workspace no disponible. Espera a la recuperación o recarga.');
              return;
            }
            await landingTransaction.propose(operations);
            return;
          }
        } catch {
          // The text mentions a local control but is not a supported edit.
          // The saved preview pipeline writes the page instead.
        }
      }
      if (project?.project_id) {
        try {
          await runPreview(project, value, pace);
        } catch (error) {
          const message = previewErrorMessage(error);
          setPreviewNotice(message);
          setPreviewPhase('error');
          setExecutorPhase('error');
          setExecutorMessage(message);
        }
        return;
      }
      const requestIdentity = liveIdentity.current;
      if (builderBuildState?.projectKind === 'landing') {
        if (!ownerId || landingTransaction.status !== 'ready') {
          landingTransaction.reject('Workspace no disponible. Espera a la recuperación o recarga.');
          return;
        }
        try {
          const operations = parseLandingChange(value);
          if (operations) { await landingTransaction.propose(operations); return; }
        } catch (error) { landingTransaction.reject(error.message); return; }
        landingTransaction.reject('Este workspace admite cambios locales de CTA y acento. Otros cambios requieren un contrato validado.');
        return;
      }

      const nextDirection = resolveDirection(value);

      const response = composeBuilderAgentResponse({
        userInput: value,
        project,
        currentState: {
          progress,
          isRunning,
          direction,
          mode: copy.mode,
          templateType: copy.templateType,
          currentSelection,
          hubSummary,
          lastDelta,
          lastOperation,
          builderBuildState,
          builderBuildSummary,
        },
        context: {
          currentSelection,
          hubSummary,
          lastDelta,
          lastOperation,
          builderBuildState,
          builderKernelOutput,
        },
      });

      let builderAiResult = null;
      let builderAiError = null;
      let kernelResult = null;
      const candidateAtomicCommand = BUILDER_COMMAND_V2_ENABLED
        ? parseAtomicBuilderCommand(value, { enabled: BUILDER_COMMAND_V2_ENABLED })
        : null;
      const projectIdForAtomicCommand =
        projectSnapshot?.project_id ||
        projectSnapshot?.id ||
        project?.project_id ||
        project?.id ||
        '';
      const atomicCommand = isAtomicBuilderCommandAllowed({
        command: candidateAtomicCommand,
        projectId: projectIdForAtomicCommand,
        input: value,
        enabled: BUILDER_COMMAND_V2_ENABLED,
      })
        ? candidateAtomicCommand
        : null;

      if (atomicCommand) {
        kernelResult = buildAtomicCommandKernelResult({
          command: atomicCommand,
          currentState: builderBuildState,
          previousKernelOutput: builderKernelOutput,
          project: projectSnapshot || project,
          input: value,
        });
      }

      try {
        if (!atomicCommand) {
          builderAiResult = await buildWithBuilderAI({
          userInput: value,
          currentBuildState: {
            builderBuildState,
            builderKernelOutput,
            builderBuildSummary,
            hubSummary,
            lastDelta,
            lastOperation,
          },
          projectId:
            projectSnapshot?.project_id ||
            projectSnapshot?.id ||
            project?.project_id ||
            project?.id ||
            null,
          userId: null,
          serverRevision: identity.serverRevision,
          mode: builderBuildState ? 'iterate' : 'build',
          contextUse: projectId ? 'project_overview' : 'formatting_only',
        });

          if (liveIdentity.current !== requestIdentity) return;
          requireOutputIdentity(builderAiResult, identity);
          kernelResult = adaptBuilderAIOutputToKernelResult({
            builderAIOutput: builderAiResult,
            currentBuildState: builderBuildState,
            previousKernelOutput: builderKernelOutput,
            project: projectSnapshot || project,
            userInput: value,
          });
        }
      } catch (error) {
        builderAiError = error;
        if (!atomicCommand) { landingTransaction.reject(error.message); return; }

        if (atomicCommand) {
          kernelResult = kernelResult || buildAtomicCommandKernelResult({
            command: atomicCommand,
            currentState: builderBuildState,
            previousKernelOutput: builderKernelOutput,
            project: projectSnapshot || project,
            input: value,
          });
        } else {
          kernelResult = runBuilderBuildKernel({
          input: value,
          message: value,
          project: projectSnapshot || project,
          initialPrompt,
          currentState: builderBuildState,
          currentSelection: response.hub?.selection || currentSelection || null,
          source: 'user_fallback',
        });
        }
      }

      if (liveIdentity.current !== requestIdentity) return;
      setDirection(nextDirection);

      setHubState(response.hub || null);
      setHubSummary(response.hubSummary || null);
      setCurrentSelection(response.hub?.selection || currentSelection || null);
      setLastDelta(response.delta || null);
      setLastOperation(response.operation || null);

      applyKernelResult(kernelResult);

      setManualMessages((current) => {
        const nextMessages = [
          ...current,
          createUserMessage(value),
          createAgentMessage(
            atomicCommand
              ? (kernelResult?.deltaVerified ? 'Cambio aplicado.' : 'No aplicado: delta no verificable.')
              : builderAiResult?.assistantMessage || response.text,
            {
            confidence: response.confidence,
            shouldAsk: response.shouldAsk,
            summary: response.summary,
            source: atomicCommand ? 'builder_command_contract_v2' : builderAiResult ? 'builder_ai' : response.source,
            hubSummary: response.hubSummary || null,
            delta: response.delta || null,
            operation: response.operation || null,
            builderKernel: {
              ok: kernelResult?.ok,
              mutationTypes: kernelResult?.mutationTypes || [],
              summary: kernelResult?.summary || null,
              builderAI: builderAiResult
                ? {
                    ok: true,
                    projectKind: builderAiResult.projectKind,
                    sector: builderAiResult.sector,
                    objective: builderAiResult.objective,
                    tone: builderAiResult.tone,
                  }
                : {
                    ok: false,
                    fallback: true,
                    error: builderAiError?.message || '',
                  },
            },
          }),
        ];

        if (response.question) {
          nextMessages.push({
            ...response.question,
            id: `decision-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            onDecision: (option) => submitMessage(option),
          });
        }

        return nextMessages;
      });

      setProgress(18);
      setIsRunning(true);
    },
    [
      applyKernelResult,
      landingTransaction,
      ownerId,
      builderBuildState,
      builderBuildSummary,
      builderKernelOutput,
      copy.mode,
      copy.templateType,
      currentSelection,
      direction,
      hubSummary,
      initialPrompt,
      isRunning,
      lastDelta,
      lastOperation,
      progress,
      project,
      projectSnapshot,
      runPreview,
    ]
  );

  const reloadPreview = useCallback(async () => {
    if (!project?.project_id || !projectReady) return null;
    try {
      const loaded = await loadLandingPreview(project.project_id);
      if (!loaded?.html) {
        const message = 'No hay una vista previa guardada para reanudar.';
        setPreviewNotice(message);
        setPreviewPhase('error');
        setExecutorMessage(message);
        return null;
      }
      setGeneratedPreview(loaded);
      setPreviewPhase('ready');
      setPreviewNotice('');
      return loaded;
    } catch (error) {
      const message = previewErrorMessage(error);
      setPreviewNotice(message);
      setPreviewPhase('error');
      setExecutorPhase('error');
      setExecutorMessage(message);
      return null;
    }
  }, [project, projectReady]);

  const retryPreview = useCallback(async () => {
    const instruction = String(initialPrompt || project?.input_content || '').trim();
    if (!instruction || !project?.project_id || !projectReady) return;
    try {
      await runPreview(project, instruction);
    } catch (error) {
      const message = previewErrorMessage(error);
      setPreviewNotice(message);
      setPreviewPhase('error');
      setExecutorPhase('error');
      setExecutorMessage(message);
    }
  }, [initialPrompt, project, projectReady, runPreview]);

  const handleDecision = useCallback(
    (option) => {
      if (option?.type === 'add_trust_section' && builderBuildState?.projectKind === 'landing') return landingTransaction.propose(staticTrustDecision(builderBuildState));
      if (builderBuildState?.projectKind === 'landing') { landingTransaction.reject('Esta decisión requiere una propuesta validada antes de aplicar.'); return; }
      if (option && typeof option === 'object' && (option.type || option.mutationType || option.mutationAction)) {
        const kernelResult = runBuilderDecisionMutation({
          action: option,
          currentState: builderBuildState,
          project: projectSnapshot || project,
          initialPrompt,
        });

        applyKernelResult(kernelResult);
        setAppliedDecisionTypes((current) => [
          getDecisionMutationKey(option),
          ...current.filter((item) => item !== getDecisionMutationKey(option)),
        ].filter(Boolean).slice(0, 3));
        setManualMessages((current) => [
          ...current,
          createAgentMessage(`Cambio aplicado: ${option.label || option.type}`, {
            source: 'builder_decision_loop_v1',
            builderKernel: {
              ok: kernelResult?.ok,
              mutationTypes: kernelResult?.mutationTypes || [],
              summary: kernelResult?.summary || null,
            },
          }),
        ]);
        setProgress(96);
        setIsRunning(false);
        return;
      }

      const prompt =
        typeof option === 'string'
          ? option
          : option?.prompt || option?.label || '';

      submitMessage(prompt);
    },
    [
      applyKernelResult,
      landingTransaction,
      builderBuildState,
      initialPrompt,
      project,
      projectSnapshot,
      submitMessage,
    ]
  );

  const baseMessages = useMemo(
    () => [
      ...createInitialMessages({
        copy,
        projectInput: projectInputContent,
        initialPrompt,
        initialAgentText: hubSummary?.agentMessage || '',
        initialAgentSummary: hubSummary?.operationalFocus || '',
        initialHubSummary: hubSummary,
      }),
      ...manualMessages,
    ],
    [
      copy,
      projectInputContent,
      initialPrompt,
      hubSummary,
      manualMessages,
    ]
  );

  const messages = useMemo(
    () => {
      const mergedMessages = mergeMessagesWithPhases({
        baseMessages,
        copy,
        progress,
        onDecision: handleDecision,
        appliedDecisionTypes,
      });

      const kernelDecision =
        progress >= 96 && builderDecisionMessage
          ? attachDecisionHandler(
              {
                ...builderDecisionMessage,
                options: resolveVisibleDecisionOptions({
                  options: builderDecisionMessage.options || [],
                  appliedDecisionTypes,
                }),
              },
              handleDecision
            )
          : null;

      const fallbackRuntimeDecision = buildRuntimeDecisionMessage({
        progress,
        project: projectSnapshot,
        initialPrompt,
        copy,
        hubSummary,
        onDecision: handleDecision,
        appliedDecisionTypes,
      });

      const runtimeDecision = kernelDecision || fallbackRuntimeDecision;

      return runtimeDecision
        ? [
            ...mergedMessages,
            runtimeDecision,
          ]
        : mergedMessages;
    },
    [
      baseMessages,
      copy,
      progress,
      handleDecision,
      builderDecisionMessage,
      projectSnapshot,
      initialPrompt,
      hubSummary,
      appliedDecisionTypes,
    ]
  );

  const agentStatus = useMemo(
    () =>
      getAgentStatusFromBuildPhase({
        mode: copy.mode,
        templateType: copy.templateType,
        progress,
        isRunning,
      }),
    [
      copy.mode,
      copy.templateType,
      progress,
      isRunning,
    ]
  );

  useEffect(() => {
    if (!projectReady) return;

    const initialAgent = composeInitialBuilderAgentMessage({
      project: projectSnapshot,
      initialPrompt,
    });

    const seededKernelResult = runBuilderBuildKernel({
      input: projectInputContent || initialPrompt,
      message: '',
      project: projectSnapshot,
      initialPrompt,
      currentState: null,
      currentSelection: initialAgent.hub?.selection || null,
      source: 'initial_runtime',
    });
    const restoredBuildState = null; // Preserve unbound legacy cache without recovery.
    const initialKernelResult = restoredBuildState && restoredBuildState.projectKind !== 'landing'
      ? {
          version: 'builder-build-kernel-v1',
          ok: true,
          input: projectInputContent || initialPrompt,
          previousState: null,
          state: restoredBuildState,
          mutations: [],
          mutationTypes: [],
          knowledge: null,
          knowledgeSummary: null,
          output: createBuilderOutputMap(restoredBuildState),
          structure: null,
          decisionMessage: null,
          summary: getBuildStateSummary(restoredBuildState),
        }
      : seededKernelResult;

    setProgress(4);
    setIsRunning(false);
    setManualMessages([]);
    setActiveCodeTab('tsx');
    setDirection('balanced');

    setHubState(initialAgent.hub || null);
    setHubSummary(initialAgent.hubSummary || null);
    setCurrentSelection(initialAgent.hub?.selection || null);
    setLastDelta(null);
    setLastOperation(null);
    setAppliedDecisionTypes([]);
    setGeneratedPreview(null);
    setPreviewNotice('');

    applyKernelResult(initialKernelResult);
    const requestIdentity = JSON.stringify(identity);
    loadLandingPreview(projectId).then((preview) => {
      if (liveIdentity.current === requestIdentity && preview?.html) {
        setGeneratedPreview(preview);
        setPreviewPhase('ready');
      }
    }).catch(() => {});
  }, [
    applyKernelResult,
    projectId,
    projectKey,
    projectReady,
    projectSnapshot,
    projectInputContent,
    initialPrompt,
  ]);

  useEffect(() => {
    if (!autoStart || !projectReady || !project?.project_id) return undefined;
    const instruction = String(initialPrompt || project.input_content || '').trim();
    if (!instruction) return undefined;
    const currentProjectId = project.project_id;
    let cancelled = false;
    setPreviewPhase('working');
    setPreviewNotice('');
    const job = autoPreviewJobs.get(currentProjectId) || (async () => {
      const existing = await loadLandingPreview(currentProjectId);
      if (existing?.html) return { preview: existing };
      setExecutorPhase('construyendo');
      setExecutorMessage('Construyendo tu página.');
      setExecutorLog((current) => [...current, { role: 'user', text: instruction }]);
      const created = await streamLandingPreview(project, instruction, applyExecutorEvent);
      return { preview: created };
    })();
    if (!autoPreviewJobs.has(currentProjectId)) autoPreviewJobs.set(currentProjectId, job);
    job.then((result) => {
      if (cancelled) return;
      setGeneratedPreview(result.preview);
      setPreviewNotice((current) => {
        if (typeof current === 'string' && current.includes(PREVIEW_STREAM_COPY.pending)) return current;
        return result.preview?.html ? '' : 'No se ha podido preparar la preview. No se ha publicado nada.';
      });
      setPreviewPhase(result.preview?.html ? 'ready' : 'error');
      if (result.preview?.html) setExecutorPhase('completado');
    }).catch((error) => {
      if (cancelled) return;
      const message = previewErrorMessage(error);
      setPreviewNotice(message);
      setPreviewPhase('error');
      setExecutorPhase('error');
      setExecutorMessage(message);
      setPartialHtml('');
    });
    return () => { cancelled = true; };
  }, [autoStart, projectReady, project, initialPrompt]);

  return {
    landingTransaction,
    generatedPreview,
    previewNotice,
    previewPhase,
    retryPreview,
    reloadPreview,
    executor: {
      phase: executorPhase,
      message: executorMessage,
      steps: executorSteps,
      log: executorLog,
      partialHtml,
      slow: slowStep || stepNeedsPatience(activeExecutorStep?.startedAt),
    },
    copy,
    progress,
    isRunning,
    activeCodeTab,
    setActiveCodeTab,
    direction,
    setDirection,
    manualMessages,
    setManualMessages,
    messages,
    agentStatus,
    startBuild,
    submitMessage,
    handleDecision,

    hubState,
    hubSummary,
    currentSelection,
    lastDelta,
    lastOperation,

    builderBuildState,
    builderKernelResult,
    builderKernelOutput,
    builderDecisionMessage,
    builderBuildSummary,

    builderIntelligence: {
      hubState,
      hubSummary,
      currentSelection,
      lastDelta,
      lastOperation,
      builderBuildState,
      builderKernelResult,
      builderKernelOutput,
      builderDecisionMessage,
      builderBuildSummary,
    },
  };
}
