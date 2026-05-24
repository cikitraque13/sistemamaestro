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
  runBuilderDecisionMutation,
} from '../../state/builderBuildKernel';

import {
  getBuildStateSummary,
} from '../../state/builderBuildState';

import {
  createBuilderOutputMap,
} from '../../state/builderOutputMap';

import {
  BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID,
  persistBuilderBuildState,
  restoreBuilderBuildState,
} from '../../state/builderBuildStateStorage';

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
      'AÃƒÂ±ade una secciÃƒÂ³n clara de Gema Maestra, crÃƒÂ©ditos, iteraciones, exportaciÃƒÂ³n y deploy sin parecer una tabla de precios agresiva.',
    creditTier: 'medium',
  }),
  createDecisionOption({
    id: 'sm-how-it-works',
    label: 'Crear secciÃƒÂ³n CÃƒÂ³mo funciona',
    prompt:
      'AÃƒÂ±ade una secciÃƒÂ³n Ã¢â‚¬Å“CÃƒÂ³mo funcionaÃ¢â‚¬Â con tres pasos: describe tu idea, el Builder construye, iteras/exportas/despliegas.',
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
  const [appliedDecisionTypes, setAppliedDecisionTypes] = useState([]);

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
    const nextState = kernelResult?.state || null;

    setBuilderKernelResult(kernelResult || null);
    setBuilderBuildState(nextState);
    setBuilderKernelOutput(kernelResult?.output || null);
    setBuilderDecisionMessage(kernelResult?.decisionMessage || null);
    setBuilderBuildSummary(kernelResult?.summary || null);

    if (nextState && projectId) {
      persistBuilderBuildState({
        projectId,
        templateId: BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID,
        state: nextState,
      });
    }
  }, [projectId]);

  const startBuild = useCallback(() => {
    setProgress(4);
    setIsRunning(true);
  }, []);

  const submitMessage = useCallback(
    async (text) => {
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

      let builderAiResult = null;
      let builderAiError = null;
      let kernelResult = null;
      const atomicCommand = BUILDER_COMMAND_V2_ENABLED
        ? parseAtomicBuilderCommand(value, { enabled: BUILDER_COMMAND_V2_ENABLED })
        : null;

      try {
        if (atomicCommand) {
          throw new Error('Command Contract V2 no activo para aplicación real.');
        }

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
          mode: builderBuildState ? 'iterate' : 'build',
        });

        kernelResult = adaptBuilderAIOutputToKernelResult({
          builderAIOutput: builderAiResult,
          currentBuildState: builderBuildState,
          previousKernelOutput: builderKernelOutput,
          project: projectSnapshot || project,
          userInput: value,
        });
      } catch (error) {
        builderAiError = error;

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
          createAgentMessage(builderAiResult?.assistantMessage || response.text, {
            confidence: response.confidence,
            shouldAsk: response.shouldAsk,
            summary: response.summary,
            source: builderAiResult ? 'builder_ai_openai' : response.source,
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

    const restoredBuildState = restoreBuilderBuildState({
      projectId,
      templateId: BUILDER_BUILD_STATE_STORAGE_TEMPLATE_ID,
    });

    const initialKernelResult = restoredBuildState
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
      : runBuilderBuildKernel({
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
    setAppliedDecisionTypes([]);

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