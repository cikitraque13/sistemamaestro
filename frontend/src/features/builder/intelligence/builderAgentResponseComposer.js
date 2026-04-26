import {
  interpretBuilderIntent,
  summarizeBuilderIntent,
} from './builderIntentInterpreter';

import {
  buildCtaState,
  resolveCtaGoal,
} from '../presets/builderCtaPresets';

import {
  getVisualPreset,
  resolveVisualPresetId,
} from '../presets/builderVisualPresets';

import {
  buildInlineQuestionMessage,
  shouldAskBuilderQuestion,
} from '../presets/builderQuestionPresets';

import {
  BUILDER_HUB_STATUS,
  orchestrateBuilderIterationHub,
  orchestrateInitialBuilderHub,
  getBuilderHubSummary,
} from './builderHubOrchestrator';

const includesAny = (value = '', terms = []) => {
  const text = String(value).toLowerCase();

  return terms.some((term) => text.includes(term));
};

const describeVisualDirection = (visualDirection) => {
  const descriptions = {
    premium_dark:
      'elevo percepciÃ³n premium con fondo oscuro, mÃ¡s aire visual, jerarquÃ­a limpia y CTA con mayor prioridad.',
    warm_orange:
      'llevo la interfaz a una direcciÃ³n cÃ¡lida con negro y naranja estratÃ©gico para aumentar energÃ­a visual y foco de acciÃ³n.',
    clean_light:
      'simplifico la lectura con una direcciÃ³n clara, limpia y menos densa.',
    high_conversion:
      'priorizo conversiÃ³n con CTA mÃ¡s dominante, menor ruido visual y recorrido mÃ¡s directo.',
    editorial_sober:
      'aplico una direcciÃ³n mÃ¡s sobria, editorial y seria para reforzar autoridad.',
    tech_cyan:
      'refuerzo la sensaciÃ³n tecnolÃ³gica con cian, verde, precisiÃ³n visual y sistema vivo.',
    balanced:
      'mantengo una direcciÃ³n equilibrada sin romper la estructura actual.',
  };

  return descriptions[visualDirection] || descriptions.balanced;
};

const describeConversionGoal = (conversionGoal) => {
  const descriptions = {
    reservations:
      'oriento la pÃ¡gina hacia reservas con acciÃ³n directa y menos fricciÃ³n.',
    whatsapp:
      'oriento la pÃ¡gina hacia conversaciÃ³n por WhatsApp con CTA claro y visible.',
    calls:
      'oriento la pÃ¡gina hacia llamadas con una acciÃ³n principal mÃ¡s evidente.',
    leads:
      'oriento la pÃ¡gina hacia captaciÃ³n de leads con promesa clara y siguiente paso visible.',
    sales:
      'oriento la pÃ¡gina hacia venta con recorrido mÃ¡s corto y CTA mÃ¡s fuerte.',
    signup:
      'oriento la pÃ¡gina hacia registro con menor fricciÃ³n inicial.',
    activation:
      'mantengo foco en activaciÃ³n inicial y claridad del siguiente paso.',
  };

  return descriptions[conversionGoal] || descriptions.activation;
};

const buildChangeSummary = (intent = {}) => {
  const changes = [];

  if (intent.requestedChanges?.ctas) {
    changes.push('CTAs');
  }

  if (intent.requestedChanges?.cards) {
    changes.push('tarjetas');
  }

  if (intent.requestedChanges?.colors) {
    changes.push('color');
  }

  if (intent.requestedChanges?.background) {
    changes.push('fondo');
  }

  if (intent.requestedChanges?.copy) {
    changes.push('copy');
  }

  if (intent.requestedChanges?.layout) {
    changes.push('estructura');
  }

  if (!changes.length) {
    changes.push('direcciÃ³n general');
  }

  return changes.join(', ');
};

const buildSafetyPrefix = (intent = {}) => {
  if (intent.confidence === 'low') {
    return 'Necesito afinar la direcciÃ³n antes de aplicar un cambio fuerte.';
  }

  if (intent.confidence === 'medium') {
    return 'Tengo una direcciÃ³n razonable.';
  }

  return 'La instrucciÃ³n es clara.';
};

const composeDirectExecutionText = (intent = {}) => {
  const visualText = describeVisualDirection(intent.visualDirection);
  const conversionText = describeConversionGoal(intent.conversionGoal);
  const changeSummary = buildChangeSummary(intent);
  const safetyPrefix = buildSafetyPrefix(intent);

  return `${safetyPrefix} Voy a trabajar sobre ${changeSummary}: ${visualText} AdemÃ¡s, ${conversionText}`;
};

const composeCtaChangeText = (intent = {}) => {
  const ctaGoal = resolveCtaGoal(intent);
  const ctaState = buildCtaState(intent);

  return [
    'Entendido. Esto afecta a prioridad de clic y conversiÃ³n.',
    `Reoriento los CTAs hacia ${ctaGoal}: "${ctaState.primaryCta}", "${ctaState.secondaryCta}" y "${ctaState.finalCta}".`,
    'El objetivo es que la acciÃ³n principal no compita con elementos secundarios.',
  ].join(' ');
};

const composeVisualChangeText = (intent = {}) => {
  const visualPresetId = resolveVisualPresetId(intent);
  const visualPreset = getVisualPreset(visualPresetId);

  return [
    `Entendido. Aplico direcciÃ³n visual "${visualPreset.label}".`,
    visualPreset.description,
    'AjustarÃ© contraste, tarjetas, fondo y prioridad del CTA sin romper la estructura base.',
  ].join(' ');
};

const composeCardChangeText = () => [
  'Entendido. Voy a mejorar las tarjetas como piezas de lectura y conversiÃ³n.',
  'ReducirÃ© ruido, reforzarÃ© jerarquÃ­a, darÃ© mÃ¡s profundidad visual y harÃ© que cada tarjeta empuje una idea concreta.',
].join(' ');

const composeCopyChangeText = () => [
  'Entendido. Voy a ajustar el mensaje.',
  'No cambiarÃ© solo palabras: reforzarÃ© promesa, beneficio principal, claridad de lectura y continuidad hacia la acciÃ³n.',
].join(' ');

const composeAmbiguousText = (intent = {}) => {
  const question = buildInlineQuestionMessage(intent);

  return {
    text:
      'La peticiÃ³n es Ãºtil, pero demasiado abierta para aplicar un cambio fuerte sin riesgo. Te propongo decidir una direcciÃ³n antes de tocar el diseÃ±o.',
    question,
  };
};

const composeLegacyBuilderAgentResponse = ({
  userInput = '',
  currentState = null,
  project = null,
  context = {},
} = {}) => {
  const intent = interpretBuilderIntent(userInput, {
    projectId: currentState?.projectId || project?.project_id || project?.id,
    previousMode: currentState?.mode,
    previousTemplateType: currentState?.templateType,
    previousDirection: currentState?.direction,
    previousConversionGoal: currentState?.conversionGoal,
    ...context,
  });

  if (shouldAskBuilderQuestion(intent)) {
    const ambiguous = composeAmbiguousText(intent);

    return {
      intent,
      text: ambiguous.text,
      question: ambiguous.question,
      confidence: intent.confidence,
      shouldAsk: true,
      summary: summarizeBuilderIntent(intent),

      hub: null,
      hubSummary: null,
      delta: null,
      operation: null,
      source: 'legacy_fallback',
    };
  }

  let text = composeDirectExecutionText(intent);

  if (intent.requestedChanges?.ctas) {
    text = composeCtaChangeText(intent);
  } else if (
    intent.requestedChanges?.colors ||
    intent.requestedChanges?.background ||
    intent.requestedChanges?.visual
  ) {
    text = composeVisualChangeText(intent);
  } else if (intent.requestedChanges?.cards) {
    text = composeCardChangeText(intent);
  } else if (intent.requestedChanges?.copy) {
    text = composeCopyChangeText(intent);
  } else if (
    includesAny(userInput, ['premium', 'elegante', 'sofisticado']) ||
    intent.visualDirection === 'premium_dark'
  ) {
    text =
      'Entendido. Voy a elevar percepciÃ³n premium: mÃ¡s aire visual, mejor jerarquÃ­a, CTA mÃ¡s fino y una secciÃ³n de confianza mÃ¡s sÃ³lida.';
  } else if (
    includesAny(userInput, [
      'vende',
      'vender',
      'conversion',
      'conversiÃ³n',
      'captar',
    ])
  ) {
    text =
      'Entendido. Voy a orientar la versiÃ³n hacia conversiÃ³n: promesa mÃ¡s clara, CTA mÃ¡s visible, tarjetas con menos ruido y cierre mÃ¡s accionable.';
  }

  return {
    intent,
    text,
    question: null,
    confidence: intent.confidence,
    shouldAsk: false,
    summary: summarizeBuilderIntent(intent),

    hub: null,
    hubSummary: null,
    delta: null,
    operation: null,
    source: 'legacy_fallback',
  };
};

const HUB_DECISION_ENGINE_GOLD = Object.freeze({
  restaurant: {
    base: [
      {
        label: 'Destacar carta y platos recomendados',
        prompt: 'Mejora esta landing de restaurante destacando carta, platos recomendados y motivos claros para reservar.',
        expectedPreviewDelta: ['carta', 'platos destacados', 'CTA de reserva'],
        expectedCodeDelta: ['cards', 'sectionTitle', 'primaryCTA'],
        creditTier: 'medium',
      },
      {
        label: 'Añadir reservas por WhatsApp',
        prompt: 'Añade reservas por WhatsApp como acción principal, con CTA visible y copy orientado a reserva rápida.',
        expectedPreviewDelta: ['CTA WhatsApp', 'bloque de reservas', 'canal directo'],
        expectedCodeDelta: ['primaryCTA', 'secondaryCTA', 'reservationBlock'],
        creditTier: 'medium',
      },
      {
        label: 'Mostrar reseñas y confianza local',
        prompt: 'Añade reseñas, prueba social y señales de confianza local para aumentar reservas.',
        expectedPreviewDelta: ['reseñas', 'confianza local', 'prueba social'],
        expectedCodeDelta: ['trustSection', 'cards', 'sectionText'],
        creditTier: 'medium',
      },
      {
        label: 'Mejorar fotos y ambiente',
        prompt: 'Refuerza la parte visual del restaurante con fotos, ambiente, platos y experiencia.',
        expectedPreviewDelta: ['galería', 'ambiente', 'platos'],
        expectedCodeDelta: ['visualDirection', 'cards', 'heroSupportingCopy'],
        creditTier: 'medium',
      },
      {
        label: 'Añadir ubicación y horarios',
        prompt: 'Añade ubicación, horarios y contexto local para que el usuario sepa cuándo y dónde reservar.',
        expectedPreviewDelta: ['ubicación', 'horarios', 'CTA local'],
        expectedCodeDelta: ['locationSection', 'footerCTA', 'cards'],
        creditTier: 'low',
      },
    ],
    afterReservations: [
      {
        label: 'Crear mensaje automático de WhatsApp',
        prompt: 'Prepara un mensaje automático de WhatsApp para reservas con fecha, hora, personas y nombre.',
        expectedPreviewDelta: ['mensaje prellenado', 'CTA WhatsApp', 'fricción reducida'],
        expectedCodeDelta: ['whatsappMessage', 'primaryCTA', 'ctaHref'],
        creditTier: 'medium',
      },
      {
        label: 'Añadir botón fijo en móvil',
        prompt: 'Añade un botón fijo en móvil para reservar por WhatsApp mientras el usuario navega la landing.',
        expectedPreviewDelta: ['CTA sticky móvil', 'reserva rápida'],
        expectedCodeDelta: ['stickyCTA', 'mobileCTA', 'primaryCTA'],
        creditTier: 'medium',
      },
      {
        label: 'Separar comida y cena',
        prompt: 'Divide la reserva entre comida y cena para aumentar claridad y reducir fricción.',
        expectedPreviewDelta: ['opciones comida/cena', 'horarios claros'],
        expectedCodeDelta: ['reservationOptions', 'cards'],
        creditTier: 'medium',
      },
      {
        label: 'Crear CTA para grupos y eventos',
        prompt: 'Añade una llamada específica para reservas de grupos, cumpleaños o eventos privados.',
        expectedPreviewDelta: ['eventos', 'grupos', 'CTA específico'],
        expectedCodeDelta: ['eventSection', 'secondaryCTA'],
        creditTier: 'medium',
      },
      {
        label: 'Añadir menú del día',
        prompt: 'Crea una sección de menú del día como gancho de conversión para visitas recurrentes.',
        expectedPreviewDelta: ['menú del día', 'precio orientativo', 'gancho local'],
        expectedCodeDelta: ['menuSection', 'cards'],
        creditTier: 'medium',
      },
    ],
  },

  clinic: {
    base: [
      {
        label: 'Captar citas cualificadas',
        prompt: 'Optimiza esta landing de clínica para captar citas cualificadas con CTA claro y confianza médica.',
        expectedPreviewDelta: ['CTA cita', 'beneficio clínico', 'confianza'],
        expectedCodeDelta: ['primaryCTA', 'heroCopy', 'trustSection'],
        creditTier: 'medium',
      },
      {
        label: 'Añadir doctores y confianza médica',
        prompt: 'Añade equipo médico, experiencia, reseñas y señales de autoridad para aumentar confianza.',
        expectedPreviewDelta: ['doctores', 'autoridad', 'reseñas'],
        expectedCodeDelta: ['teamSection', 'trustCards'],
        creditTier: 'medium',
      },
      {
        label: 'Explicar tratamiento principal',
        prompt: 'Explica el tratamiento principal de forma clara, con pasos, beneficio y siguiente acción.',
        expectedPreviewDelta: ['tratamiento', 'pasos', 'beneficio'],
        expectedCodeDelta: ['processSection', 'cards', 'sectionText'],
        creditTier: 'medium',
      },
      {
        label: 'Resolver objeciones frecuentes',
        prompt: 'Añade objeciones frecuentes sobre precio, dolor, tiempo, garantías y resultados.',
        expectedPreviewDelta: ['FAQ', 'objeciones', 'seguridad'],
        expectedCodeDelta: ['faqSection', 'trustSection'],
        creditTier: 'medium',
      },
      {
        label: 'Añadir WhatsApp para pedir cita',
        prompt: 'Añade WhatsApp como canal directo para pedir cita y resolver dudas rápidas.',
        expectedPreviewDelta: ['CTA WhatsApp', 'pedir cita', 'contacto rápido'],
        expectedCodeDelta: ['primaryCTA', 'secondaryCTA', 'contactBlock'],
        creditTier: 'medium',
      },
    ],
  },

  automation: {
    base: [
      {
        label: 'Mapear proceso actual',
        prompt: 'Mapea el proceso actual, identifica pasos, responsables, herramientas y puntos de fricción.',
        expectedPreviewDelta: ['mapa de proceso', 'pasos', 'fricción'],
        expectedCodeDelta: ['processSection', 'cards', 'sectionTitle'],
        creditTier: 'medium',
      },
      {
        label: 'Definir entradas y datos necesarios',
        prompt: 'Define entradas, formularios, datos, emails, clientes, documentos y pagos necesarios para automatizar.',
        expectedPreviewDelta: ['entradas', 'datos', 'fuentes'],
        expectedCodeDelta: ['inputsSection', 'cards'],
        creditTier: 'medium',
      },
      {
        label: 'Diseñar flujo automatizado',
        prompt: 'Diseña el flujo automatizado con etapas, condiciones, responsables, herramientas y salidas.',
        expectedPreviewDelta: ['flujo automatizado', 'etapas', 'salidas'],
        expectedCodeDelta: ['workflowSection', 'cards', 'technicalNotes'],
        creditTier: 'high',
      },
      {
        label: 'Añadir herramientas y responsables',
        prompt: 'Añade herramientas como Make, Zapier, CRM, formularios y responsables por cada etapa.',
        expectedPreviewDelta: ['herramientas', 'responsables', 'integraciones'],
        expectedCodeDelta: ['toolsSection', 'cards'],
        creditTier: 'medium',
      },
      {
        label: 'Detectar errores y puntos de control',
        prompt: 'Añade puntos de control, errores posibles, alertas y seguimiento del proceso automatizado.',
        expectedPreviewDelta: ['controles', 'errores', 'alertas'],
        expectedCodeDelta: ['controlSection', 'cards'],
        creditTier: 'medium',
      },
    ],
    afterFlow: [
      {
        label: 'Definir triggers del flujo',
        prompt: 'Define qué evento inicia el flujo y qué condiciones debe cumplir para ejecutarse.',
        expectedPreviewDelta: ['trigger', 'condiciones', 'inicio del flujo'],
        expectedCodeDelta: ['triggerSection', 'workflowRules'],
        creditTier: 'medium',
      },
      {
        label: 'Añadir condiciones y bifurcaciones',
        prompt: 'Añade bifurcaciones según tipo de cliente, prioridad, pago, estado o responsable.',
        expectedPreviewDelta: ['condiciones', 'rutas alternativas', 'decisiones'],
        expectedCodeDelta: ['branchesSection', 'workflowRules'],
        creditTier: 'high',
      },
      {
        label: 'Crear alertas y seguimiento',
        prompt: 'Añade alertas, responsables y seguimiento para que el proceso no quede sin control.',
        expectedPreviewDelta: ['alertas', 'seguimiento', 'responsables'],
        expectedCodeDelta: ['alertsSection', 'cards'],
        creditTier: 'medium',
      },
      {
        label: 'Conectar CRM o base de datos',
        prompt: 'Define cómo se conectaría el flujo con CRM, base de datos o tabla operativa.',
        expectedPreviewDelta: ['CRM', 'base de datos', 'registro'],
        expectedCodeDelta: ['integrationSection', 'technicalNotes'],
        creditTier: 'high',
      },
      {
        label: 'Crear dashboard de control',
        prompt: 'Añade una vista de dashboard para medir estado, tareas, errores y resultados del proceso.',
        expectedPreviewDelta: ['dashboard', 'KPIs', 'estado operativo'],
        expectedCodeDelta: ['dashboardSection', 'metricsCards'],
        creditTier: 'high',
      },
    ],
  },

  ecommerce: {
    base: [
      {
        label: 'Mejorar presentación del producto',
        prompt: 'Optimiza la presentación del producto con beneficio, deseo, prueba social y CTA claro.',
        expectedPreviewDelta: ['producto', 'beneficios', 'CTA compra'],
        expectedCodeDelta: ['productSection', 'primaryCTA', 'cards'],
        creditTier: 'medium',
      },
      {
        label: 'Crear oferta más clara',
        prompt: 'Crea una oferta más clara con pack, urgencia, beneficio y reducción de objeciones.',
        expectedPreviewDelta: ['oferta', 'pack', 'urgencia'],
        expectedCodeDelta: ['offerSection', 'cards'],
        creditTier: 'medium',
      },
      {
        label: 'Añadir garantías y envíos',
        prompt: 'Añade garantías, envíos, devoluciones y seguridad de pago para reducir miedo a comprar.',
        expectedPreviewDelta: ['garantía', 'envío', 'seguridad'],
        expectedCodeDelta: ['trustSection', 'faqSection'],
        creditTier: 'medium',
      },
      {
        label: 'Reducir fricción de compra',
        prompt: 'Reduce fricción antes de comprar y mejora el recorrido hacia carrito o checkout.',
        expectedPreviewDelta: ['checkout claro', 'menos fricción', 'CTA compra'],
        expectedCodeDelta: ['primaryCTA', 'checkoutSection'],
        creditTier: 'medium',
      },
      {
        label: 'Reforzar reseñas y seguridad',
        prompt: 'Añade reseñas, prueba social, métodos de pago seguros y garantías visibles.',
        expectedPreviewDelta: ['reseñas', 'pagos seguros', 'confianza'],
        expectedCodeDelta: ['reviewsSection', 'trustBadges'],
        creditTier: 'medium',
      },
    ],
  },

  saas: {
    base: [
      {
        label: 'Explicar caso de uso principal',
        prompt: 'Explica el caso de uso principal del SaaS con problema, solución, resultado y CTA.',
        expectedPreviewDelta: ['caso de uso', 'resultado', 'CTA demo'],
        expectedCodeDelta: ['useCaseSection', 'heroCopy', 'primaryCTA'],
        creditTier: 'medium',
      },
      {
        label: 'Añadir demo o prueba gratuita',
        prompt: 'Añade demo, prueba gratuita o primera activación clara para reducir fricción.',
        expectedPreviewDelta: ['demo', 'prueba gratuita', 'activación'],
        expectedCodeDelta: ['primaryCTA', 'demoSection'],
        creditTier: 'medium',
      },
      {
        label: 'Ordenar features por valor',
        prompt: 'Ordena las funciones por valor real para el usuario, no por lista técnica.',
        expectedPreviewDelta: ['features por valor', 'beneficios', 'claridad'],
        expectedCodeDelta: ['featuresSection', 'cards'],
        creditTier: 'medium',
      },
      {
        label: 'Mejorar onboarding inicial',
        prompt: 'Crea una primera experiencia de onboarding para que el usuario entienda qué hacer.',
        expectedPreviewDelta: ['onboarding', 'primer paso', 'activación'],
        expectedCodeDelta: ['onboardingSection', 'steps'],
        creditTier: 'medium',
      },
      {
        label: 'Añadir comparativa o prueba social',
        prompt: 'Añade comparativa, casos de uso, logos o prueba social para aumentar confianza.',
        expectedPreviewDelta: ['comparativa', 'logos', 'casos'],
        expectedCodeDelta: ['comparisonSection', 'trustSection'],
        creditTier: 'medium',
      },
    ],
  },

  service: {
    base: [
      {
        label: 'Aterrizar sector y cliente objetivo',
        prompt: 'Aterriza el sector, cliente objetivo, problema principal y resultado esperado antes de seguir construyendo.',
        expectedPreviewDelta: ['sector', 'cliente objetivo', 'problema'],
        expectedCodeDelta: ['heroCopy', 'sectionTitle', 'cards'],
        creditTier: 'low',
      },
      {
        label: 'Reforzar promesa principal',
        prompt: 'Refuerza la promesa principal con resultado, especificidad y motivo para actuar ahora.',
        expectedPreviewDelta: ['promesa', 'resultado', 'CTA'],
        expectedCodeDelta: ['headline', 'subheadline', 'primaryCTA'],
        creditTier: 'medium',
      },
      {
        label: 'Ajustar CTA al objetivo real',
        prompt: 'Ajusta el CTA al objetivo real del negocio y mejora su continuidad en toda la landing.',
        expectedPreviewDelta: ['CTA principal', 'acción clara', 'continuidad'],
        expectedCodeDelta: ['primaryCTA', 'secondaryCTA', 'finalCTA'],
        creditTier: 'medium',
      },
      {
        label: 'Añadir confianza y prueba social',
        prompt: 'Añade confianza, autoridad, casos, reseñas u objeciones resueltas.',
        expectedPreviewDelta: ['confianza', 'autoridad', 'prueba social'],
        expectedCodeDelta: ['trustSection', 'cards'],
        creditTier: 'medium',
      },
      {
        label: 'Ordenar estructura de conversión',
        prompt: 'Ordena la estructura para que hero, beneficios, prueba social, CTA y cierre trabajen juntos.',
        expectedPreviewDelta: ['estructura', 'beneficios', 'cierre'],
        expectedCodeDelta: ['layoutSections', 'cards', 'finalCTA'],
        creditTier: 'medium',
      },
    ],
  },
});

const getHubQuestionContext = (hubSummary = {}) =>
  [
    hubSummary.category,
    hubSummary.projectType,
    hubSummary.businessModel,
    hubSummary.primaryPlaybook,
    hubSummary.operationalFocus,
    hubSummary.conversionTarget,
    hubSummary.primaryCTA,
    hubSummary.firstQuestion,
    ...(hubSummary.secondaryPlaybooks || []),
    ...(hubSummary.affectedLayers || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const hasContextSignal = (context = '', signals = []) =>
  signals.some((signal) => context.includes(signal));

const pickHubDecisionBranch = ({
  context = '',
  category = '',
  projectType = '',
} = {}) => {
  const isRestaurant =
    hasContextSignal(context, [
      'restaurante',
      'restaurant',
      'hosteler',
      'carta',
      'mesa',
      'reserva',
      'menú',
      'menu',
      'platos',
    ]) ||
    projectType === 'local_reservation_page';

  if (isRestaurant) {
    if (
      hasContextSignal(context, [
        'whatsapp',
        'reserv',
        'mesa',
        'horario',
        'grupo',
        'evento',
      ])
    ) {
      return HUB_DECISION_ENGINE_GOLD.restaurant.afterReservations;
    }

    return HUB_DECISION_ENGINE_GOLD.restaurant.base;
  }

  const isClinic =
    hasContextSignal(context, [
      'clínica',
      'clinica',
      'dental',
      'salud',
      'cita',
      'doctor',
      'tratamiento',
      'implante',
      'ortodoncia',
    ]);

  if (isClinic) {
    return HUB_DECISION_ENGINE_GOLD.clinic.base;
  }

  const isAutomation =
    hasContextSignal(context, [
      'automatización',
      'automatizacion',
      'automation',
      'workflow',
      'flujo',
      'make',
      'zapier',
      'crm',
      'proceso',
    ]) ||
    category === 'automation' ||
    projectType === 'automation_workflow';

  if (isAutomation) {
    if (
      hasContextSignal(context, [
        'mapear',
        'flujo',
        'trigger',
        'condición',
        'condicion',
        'herramienta',
        'responsable',
        'crm',
        'make',
        'zapier',
      ])
    ) {
      return HUB_DECISION_ENGINE_GOLD.automation.afterFlow;
    }

    return HUB_DECISION_ENGINE_GOLD.automation.base;
  }

  const isEcommerce =
    hasContextSignal(context, [
      'ecommerce',
      'tienda',
      'producto',
      'comprar',
      'checkout',
      'carrito',
      'envío',
      'envio',
    ]) ||
    category === 'commerce';

  if (isEcommerce) {
    return HUB_DECISION_ENGINE_GOLD.ecommerce.base;
  }

  const isSaas =
    hasContextSignal(context, [
      'saas',
      'software',
      'herramienta digital',
      'ai tool',
      'demo',
      'registro',
      'onboarding',
    ]) ||
    projectType === 'saas_landing' ||
    projectType === 'ai_tool';

  if (isSaas) {
    return HUB_DECISION_ENGINE_GOLD.saas.base;
  }

  return HUB_DECISION_ENGINE_GOLD.service.base;
};

const getHubQuestionOptions = ({
  hubSummary = {},
} = {}) => {
  const decisions = pickHubDecisionBranch({
    context: getHubQuestionContext(hubSummary),
    category: hubSummary.category,
    projectType: hubSummary.projectType,
  });

  return decisions
    .slice(0, 5)
    .map((decision) => decision.label);
};

const buildHubQuestionMessage = ({
  hubSummary = {},
  fallbackText = '',
} = {}) => {
  const text =
    hubSummary.firstQuestion ||
    fallbackText ||
    'Elige la siguiente mejora para seguir construyendo el proyecto.';

  return {
    role: 'decision',
    label: 'Siguiente decisión',
    text,
    options: getHubQuestionOptions({
      hubSummary,
    }),
  };
};
const buildHubIntentAdapter = ({
  userInput = '',
  legacyIntent = null,
  hub = null,
  hubSummary = {},
} = {}) => ({
  ...(legacyIntent || {}),
  source: 'builder_hub',
  rawInput: userInput,
  hubStatus: hub?.status,
  hubMode: hub?.mode,
  projectType: hubSummary.projectType,
  category: hubSummary.category,
  businessModel: hubSummary.businessModel,
  conversionTarget: hubSummary.conversionTarget,
  primaryPlaybook: hubSummary.primaryPlaybook,
  secondaryPlaybooks: hubSummary.secondaryPlaybooks || [],
  primaryCTA: hubSummary.primaryCTA,
  firstQuestion: hubSummary.firstQuestion,
  operationalFocus: hubSummary.operationalFocus,
  iterationIntent: hubSummary.iterationIntent,
  affectedLayers: hubSummary.affectedLayers || [],
  requiredAgents: hubSummary.requiredAgents || [],
});

const buildHubSummaryText = ({
  hubSummary = {},
  legacySummary = '',
} = {}) => {
  const parts = [
    hubSummary.primaryPlaybook
      ? `Playbook principal: ${hubSummary.primaryPlaybook}`
      : '',
    hubSummary.operationalFocus
      ? `Foco: ${hubSummary.operationalFocus}`
      : '',
    hubSummary.primaryCTA
      ? `CTA: ${hubSummary.primaryCTA}`
      : '',
  ].filter(Boolean);

  if (parts.length) return parts.join(' Â· ');

  return legacySummary || 'Hub Builder activo.';
};

const resolveHubConfidence = ({
  hub = null,
  iterationSummary = null,
  fallbackConfidence = 'medium',
} = {}) => {
  if (hub?.status === BUILDER_HUB_STATUS.LOW_CONFIDENCE) return 'low';
  if (hub?.status === BUILDER_HUB_STATUS.NEEDS_CLARIFICATION) return 'medium';

  if (iterationSummary?.confidence) return iterationSummary.confidence;

  return fallbackConfidence;
};

const composeHubBuilderAgentResponse = ({
  userInput = '',
  currentState = null,
  project = null,
  context = {},
  legacyResponse = null,
} = {}) => {
  const hub = orchestrateBuilderIterationHub({
    message: userInput,
    project,
    currentSelection: context?.currentSelection || currentState?.currentSelection || null,
    explicitUserLevel: context?.explicitUserLevel || '',
  });

  const hubSummary = getBuilderHubSummary(hub);
  const iterationSummary = hub?.iterationSummary || null;

  const shouldAsk = Boolean(
    hubSummary?.visiblePlan?.shouldShowClarifyingQuestion ||
      hub?.status === BUILDER_HUB_STATUS.NEEDS_CLARIFICATION ||
      iterationSummary?.shouldAskClarification
  );

  const question = shouldAsk
    ? buildHubQuestionMessage({
        hubSummary,
        fallbackText: iterationSummary?.clarifyingQuestion,
      })
    : null;

  const confidence = resolveHubConfidence({
    hub,
    iterationSummary,
    fallbackConfidence: legacyResponse?.confidence,
  });

  const intent = buildHubIntentAdapter({
    userInput,
    legacyIntent: legacyResponse?.intent,
    hub,
    hubSummary,
  });

  const text =
    hubSummary.agentMessage ||
    hub?.agent?.message ||
    legacyResponse?.text ||
    'Entendido. Voy a interpretar la mejora con el Hub del Builder antes de aplicar cambios visibles.';

  return {
    intent,
    text,
    question,
    confidence,
    shouldAsk,
    summary: buildHubSummaryText({
      hubSummary,
      legacySummary: legacyResponse?.summary,
    }),

    hub,
    hubSummary,
    delta: hub?.iteration?.delta || null,
    operation: {
      requiredAgents: hubSummary.requiredAgents || [],
      primaryCTA: hubSummary.primaryCTA || '',
      primaryPlaybook: hubSummary.primaryPlaybook || '',
      secondaryPlaybooks: hubSummary.secondaryPlaybooks || [],
      firstQuestion: hubSummary.firstQuestion || '',
      operationalFocus: hubSummary.operationalFocus || '',
      visiblePlan: hubSummary.visiblePlan || {},
      agentInstruction: hubSummary.agentInstruction || hub?.agent?.instruction || '',
    },
    source: 'builder_hub',
  };
};

export const composeBuilderAgentResponse = ({
  userInput = '',
  currentState = null,
  project = null,
  context = {},
} = {}) => {
  const legacyResponse = composeLegacyBuilderAgentResponse({
    userInput,
    currentState,
    project,
    context,
  });

  try {
    return composeHubBuilderAgentResponse({
      userInput,
      currentState,
      project,
      context,
      legacyResponse,
    });
  } catch (error) {
    return {
      ...legacyResponse,
      error: {
        source: 'builder_hub',
        message: error?.message || 'Error desconocido en Builder Hub.',
      },
      source: 'legacy_fallback_after_hub_error',
    };
  }
};

export const composeInitialBuilderAgentMessage = ({
  project = null,
  initialPrompt = '',
} = {}) => {
  const input = project?.input_content || initialPrompt || '';

  const legacyIntent = interpretBuilderIntent(input, {
    projectId: project?.project_id || project?.id,
    route: project?.route,
    projectStatus: project?.status,
  });

  const legacyText = [
    legacyIntent.mode === 'transform'
      ? 'Voy a analizar esta entrada como una mejora de una web o activo existente.'
      : 'Voy a convertir esta entrada en una primera versiÃ³n visual y estructural.',
    describeVisualDirection(legacyIntent.visualDirection),
    describeConversionGoal(legacyIntent.conversionGoal),
  ].join(' ');

  try {
    const hub = orchestrateInitialBuilderHub({
      input,
      project,
    });

    const hubSummary = getBuilderHubSummary(hub);

    return {
      intent: buildHubIntentAdapter({
        userInput: input,
        legacyIntent,
        hub,
        hubSummary,
      }),
      text:
        hubSummary.agentMessage ||
        hub?.agent?.message ||
        legacyText,
      summary: buildHubSummaryText({
        hubSummary,
        legacySummary: summarizeBuilderIntent(legacyIntent),
      }),

      hub,
      hubSummary,
      source: 'builder_hub',
    };
  } catch (error) {
    return {
      intent: legacyIntent,
      text: legacyText,
      summary: summarizeBuilderIntent(legacyIntent),
      hub: null,
      hubSummary: null,
      error: {
        source: 'builder_hub_initial',
        message: error?.message || 'Error desconocido en Builder Hub inicial.',
      },
      source: 'legacy_fallback_after_hub_error',
    };
  }
};

export const composeBuilderPhaseMessage = ({
  mode = 'create',
  progress = 0,
} = {}) => {
  if (progress < 15) {
    return mode === 'transform'
      ? 'Leyendo entrada, clasificando contexto y detectando intenciÃ³n comercial.'
      : 'Leyendo intenciÃ³n, activando Hub y preparando estructura inicial.';
  }

  if (progress < 35) {
    return 'Clasificando proyecto, playbook principal, CTA y objetivo de conversiÃ³n.';
  }

  if (progress < 55) {
    return 'Ordenando estructura, copy, jerarquÃ­a visual y capas de salida.';
  }

  if (progress < 75) {
    return 'Montando preview y sincronizando cambios visibles con el cÃ³digo.';
  }

  if (progress < 95) {
    return 'Refinando CTA, confianza, tarjetas y continuidad hacia la siguiente acciÃ³n.';
  }

  return 'Primera versiÃ³n lista para iterar con contexto del Hub.';
};

export const composeAgentStatusLabel = ({
  isRunning = false,
  progress = 0,
  pendingQuestion = null,
} = {}) => {
  if (pendingQuestion) return 'Agente esperando direcciÃ³n';
  if (!isRunning && progress >= 100) return 'Agente esperando respuesta';
  if (!isRunning) return 'Agente preparado';
  if (progress < 25) return 'Hub interpretando proyecto';
  if (progress < 55) return 'Agente construyendo';
  if (progress < 80) return 'Agente sincronizando preview';

  return 'Agente afinando resultado';
};

export default composeBuilderAgentResponse;
