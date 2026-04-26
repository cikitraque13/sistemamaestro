import { useCallback, useEffect, useMemo, useState } from 'react';

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
} from '../../state/builderBuildKernel';

const DEFAULT_PROGRESS_STEP = 2;
const DEFAULT_PROGRESS_INTERVAL = 950;

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
  prompt,
  source = 'runtime_context',
  creditTier = 'medium',
} = {}) => ({
  id,
  label,
  prompt,
  source,
  creditTier,
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

const buildSistemaMaestroDecisionOptions = () => [
  createDecisionOption({
    id: 'sm-hero',
    label: 'Crear hero de Sistema Maestro',
    prompt:
      'Construye un hero específico para Sistema Maestro con titular potente, promesa clara, subtítulo breve y CTAs “Entrar en Sistema Maestro” y “Ver cómo funciona”.',
    creditTier: 'medium',
  }),
  createDecisionOption({
    id: 'sm-google-access',
    label: 'Añadir acceso con Google',
    prompt:
      'Añade un recuadro premium de acceso con “Entrar con Google” y “Suscribirme”, conectado al mensaje de activación del usuario.',
    creditTier: 'medium',
  }),
  createDecisionOption({
    id: 'sm-live-builder',
    label: 'Explicar Builder en vivo',
    prompt:
      'Crea una sección que explique que Sistema Maestro construye en vivo con código, preview, agente y mejoras iterativas.',
    creditTier: 'medium',
  }),
  createDecisionOption({
    id: 'sm-gema',
    label: 'Mostrar Gema Maestra y créditos',
    prompt:
      'Añade una sección clara de Gema Maestra, créditos, iteraciones, exportación y deploy sin parecer una tabla de precios agresiva.',
    creditTier: 'medium',
  }),
  createDecisionOption({
    id: 'sm-how-it-works',
    label: 'Crear sección Cómo funciona',
    prompt:
      'Añade una sección “Cómo funciona” con tres pasos: describe tu idea, el Builder construye, iteras/exportas/despliegas.',
    creditTier: 'medium',
  }),
];

const buildRestaurantDecisionOptions = () => [
  createDecisionOption({
    id: 'restaurant-reservations',
    label: 'Activar reservas directas',
    prompt:
      'Optimiza la landing para reservas directas con CTA claro, WhatsApp, horario, ubicación y reducción de fricción.',
  }),
  createDecisionOption({
    id: 'restaurant-menu',
    label: 'Destacar carta y platos',
    prompt:
      'Añade una sección de carta, platos recomendados, fotos y motivos para reservar.',
  }),
  createDecisionOption({
    id: 'restaurant-trust',
    label: 'Añadir reseñas locales',
    prompt:
      'Añade reseñas, confianza local, ubicación y prueba social para aumentar reservas.',
  }),
];

const buildAutomationDecisionOptions = () => [
  createDecisionOption({
    id: 'automation-map',
    label: 'Mapear proceso',
    prompt:
      'Mapea el proceso actual con pasos, responsables, herramientas, entradas, salidas y puntos de fricción.',
  }),
  createDecisionOption({
    id: 'automation-flow',
    label: 'Diseñar flujo automatizado',
    prompt:
      'Diseña un flujo automatizado con triggers, condiciones, herramientas, responsables y seguimiento.',
    creditTier: 'high',
  }),
  createDecisionOption({
    id: 'automation-dashboard',
    label: 'Crear dashboard de control',
    prompt:
      'Añade una vista de dashboard para controlar estado, tareas, errores, métricas y resultados del proceso.',
    creditTier: 'high',
  }),
];

const buildSaasDecisionOptions = () => [
  createDecisionOption({
    id: 'saas-use-case',
    label: 'Explicar caso de uso',
    prompt:
      'Explica el caso de uso principal con problema, solución, resultado y CTA de activación.',
  }),
  createDecisionOption({
    id: 'saas-onboarding',
    label: 'Mejorar onboarding',
    prompt:
      'Añade una primera experiencia de onboarding para que el usuario entienda qué hacer en menos de un minuto.',
  }),
  createDecisionOption({
    id: 'saas-features',
    label: 'Ordenar funciones por valor',
    prompt:
      'Ordena las funciones por valor real para el usuario, no como lista técnica genérica.',
  }),
];

const buildGenericDecisionOptions = ({
  primaryCTA = '',
} = {}) => [
  createDecisionOption({
    id: 'generic-promise',
    label: 'Reforzar promesa principal',
    prompt:
      'Refuerza la promesa principal con resultado concreto, especificidad y motivo claro para actuar ahora.',
  }),
  createDecisionOption({
    id: 'generic-cta',
    label: primaryCTA ? `Ajustar CTA: ${primaryCTA}` : 'Ajustar CTA principal',
    prompt: primaryCTA
      ? `Ajusta el CTA principal hacia “${primaryCTA}” y mejora su continuidad en hero, bloques y cierre.`
      : 'Ajusta el CTA principal para que sea más claro, accionable y coherente con el objetivo real del proyecto.',
  }),
  createDecisionOption({
    id: 'generic-trust',
    label: 'Añadir confianza',
    prompt:
      'Añade señales de confianza, autoridad, prueba social y objeciones resueltas sin recargar la interfaz.',
  }),
  createDecisionOption({
    id: 'generic-structure',
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
} = {}) => {
  if (progress < 96) return null;

  const options = buildRuntimeDecisionOptions({
    project,
    initialPrompt,
    copy,
    hubSummary,
  }).slice(0, 5);

  if (!options.length) return null;

  return createDecisionMessage({
    projectId: project?.project_id || project?.id || '',
    text:
      hubSummary?.firstQuestion ||
      'Elige una mejora para seguir construyendo esta versión.',
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
      ? 'Entendido. Voy a tratar esta entrada como una oportunidad de mejora: claridad, confianza, CTA y conversión.'
      : 'Entendido. Voy a convertir esta entrada en una primera versión estructurada con preview, código y criterio de conversión.';

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
  project = null,
  initialPrompt = '',
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
    projectKey !== 'no-project' &&
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
    setBuilderKernelResult(kernelResult || null);
    setBuilderBuildState(kernelResult?.state || null);
    setBuilderKernelOutput(kernelResult?.output || null);
    setBuilderDecisionMessage(kernelResult?.decisionMessage || null);
    setBuilderBuildSummary(kernelResult?.summary || null);
  }, []);

  const startBuild = useCallback(() => {
    setProgress(4);
    setIsRunning(true);
  }, []);

  const submitMessage = useCallback(
    (text) => {
      const value = String(text || '').trim();

      if (!value) return;

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

      const kernelResult = runBuilderBuildKernel({
        input: value,
        message: value,
        project: projectSnapshot || project,
        initialPrompt,
        currentState: builderBuildState,
        currentSelection: response.hub?.selection || currentSelection || null,
        source: 'user',
      });

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
          createAgentMessage(response.text, {
            confidence: response.confidence,
            shouldAsk: response.shouldAsk,
            summary: response.summary,
            source: response.source,
            hubSummary: response.hubSummary || null,
            delta: response.delta || null,
            operation: response.operation || null,
            builderKernel: {
              ok: kernelResult?.ok,
              mutationTypes: kernelResult?.mutationTypes || [],
              summary: kernelResult?.summary || null,
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
    ]
  );

  const handleDecision = useCallback(
    (option) => {
      const prompt =
        typeof option === 'string'
          ? option
          : option?.prompt || option?.label || '';

      submitMessage(prompt);
    },
    [
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
      });

      const kernelDecision =
        progress >= 96 && builderDecisionMessage
          ? attachDecisionHandler(builderDecisionMessage, handleDecision)
          : null;

      const fallbackRuntimeDecision = buildRuntimeDecisionMessage({
        progress,
        project: projectSnapshot,
        initialPrompt,
        copy,
        hubSummary,
        onDecision: handleDecision,
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

    const initialKernelResult = runBuilderBuildKernel({
      input: projectInputContent || initialPrompt,
      message: '',
      project: projectSnapshot,
      initialPrompt,
      currentState: null,
      currentSelection: initialAgent.hub?.selection || null,
      source: 'initial_runtime',
    });

    setProgress(4);
    setIsRunning(true);
    setManualMessages([]);
    setActiveCodeTab('tsx');
    setDirection('balanced');

    setHubState(initialAgent.hub || null);
    setHubSummary(initialAgent.hubSummary || null);
    setCurrentSelection(initialAgent.hub?.selection || null);
    setLastDelta(null);
    setLastOperation(null);

    applyKernelResult(initialKernelResult);
  }, [
    applyKernelResult,
    projectKey,
    projectReady,
    projectSnapshot,
    projectInputContent,
    initialPrompt,
  ]);

  useEffect(() => {
    if (!isRunning) return undefined;

    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + DEFAULT_PROGRESS_STEP, 100);

        if (next >= 100) {
          window.clearInterval(interval);
          setIsRunning(false);
        }

        return next;
      });
    }, DEFAULT_PROGRESS_INTERVAL);

    return () => window.clearInterval(interval);
  }, [
    isRunning,
  ]);

  return {
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