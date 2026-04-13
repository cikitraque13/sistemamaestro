const pricingContent = {
  section: {
    eyebrow: 'Planes y acceso',
    title: 'Empieza sin fricción. Escala con criterio.',
    description:
      'La estructura de precios no debe vender por ruido. Debe acompañar una progresión lógica: explorar, validar, construir, optimizar y dirigir.',
    microNote:
      'Cada bloque responde a un momento distinto del usuario y a una intensidad de intervención concreta.'
  },

  architecture: {
    model: 'ladder',
    principle: 'No vender más por acumulación. Vender mejor por cambio real de nivel.',
    layers: [
      'Exploración',
      'Validación',
      'Construcción',
      'Optimización',
      'Dirección estratégica'
    ]
  },

  entryOffer: {
    id: 'single_report',
    type: 'one_time_offer',
    visible: true,
    name: 'Informe puntual',
    shortName: '6,99',
    badge: 'Primer paso real',
    price: 6.99,
    priceLabel: '6,99 €',
    periodLabel: 'pago único',
    headline: 'Valida una oportunidad antes de escalar.',
    description:
      'Una microoferta transaccional para convertir una idea, una URL o una oportunidad real en una lectura más útil, más concreta y más accionable.',
    bestFor:
      'Encaja cuando el usuario todavía no entra en continuidad, pero sí quiere una primera validación seria.',
    valuePromise:
      'No compras una suscripción. Compras una validación premium inicial que reduce dudas, ordena la oportunidad y prepara el siguiente paso.',
    features: [
      'Informe breve con más criterio',
      'Lectura más concreta de la oportunidad',
      'Enfoque inicial de monetización o mejora',
      '1 prompt accionable de avance'
    ],
    promptLayer: {
      label: 'Prompt de avance inmediato',
      description:
        'Incluye un prompt práctico para seguir trabajando la idea o el activo analizado con mejor dirección.'
    },
    psychology: {
      role: 'micro_bridge',
      perceptionGoal:
        'Reducir miedo, activar compra fácil y demostrar valor antes del 29 €.',
      narrative:
        'Es el paso entre curiosear y tomarse el proyecto en serio.'
    },
    visual: {
      role: 'bridge_block',
      emphasis: 'entry_offer',
      recommendedPlacement: 'between_free_and_pro',
      note:
        'No debe presentarse como una quinta suscripción. Debe verse como bloque puente.'
    },
    cta: {
      label: 'Comprar informe',
      variant: 'bridge'
    },
    conceptualGraphic: {
      type: 'progress_steps',
      steps: ['Explorar', 'Validar', 'Construir', 'Optimizar', 'Dirigir'],
      activeStep: 'Validar',
      note:
        'La gráfica debe ser conceptual, no estadística. No inventar métricas.'
    }
  },

  plans: [
    {
      id: 'free',
      type: 'plan',
      backendId: 'free',
      visibleName: 'Gratis',
      backendName: 'Gratis',
      badge: 'Entrada',
      category: 'exploration',
      price: 0,
      priceLabel: 'Gratis',
      periodLabel: '',
      headline: 'Explora el sistema y detecta si merece avanzar.',
      description:
        'Puerta de entrada para entender tu necesidad, clasificarla bien y recibir una primera lectura.',
      bestFor:
        'Usuario que aún está explorando una idea, una URL o una oportunidad y no necesita todavía una capa estructural.',
      valuePromise:
        'Rompe la inercia, abre claridad y permite probar el sistema sin fricción.',
      features: [
        'Diagnóstico inicial',
        'Ruta recomendada',
        'Resultado resumido',
        'Primer marco de decisión'
      ],
      promptLayer: {
        label: 'Mini prompt base',
        description:
          'Activa una plantilla simple de entrada para seguir pensando la oportunidad.'
      },
      prompts: [
        'Prompt de clarificación inicial',
        'Prompt base para reformular la necesidad'
      ],
      perceptionGoal:
        'Hacer sentir al usuario que sí hay una vía y que no parte de cero.',
      cta: {
        label: 'Empezar gratis',
        variant: 'secondary'
      },
      highlight: false,
      unlocksNext: 'single_report',
      visualRole: 'entry'
    },

    {
      id: 'blueprint',
      type: 'plan',
      backendId: 'blueprint',
      visibleName: 'Pro',
      backendName: 'Blueprint',
      badge: 'Plan principal',
      category: 'build',
      price: 29,
      priceLabel: '29 €',
      periodLabel: '/ mes',
      headline: 'Convierte claridad en estructura de trabajo real.',
      description:
        'Es la opción principal para quien quiere pasar de una lectura inicial a una base seria de trabajo, organización y avance.',
      bestFor:
        'Usuario que ya ve una oportunidad y quiere construir con más criterio, sin entrar todavía en una capa de optimización avanzada.',
      valuePromise:
        'Aquí empieza la conversión principal del sistema: estructura, prioridades y una base sólida para avanzar.',
      features: [
        'Todo lo del nivel Gratis',
        'Blueprint estructural',
        'Prioridades claras',
        'Base de monetización o mejora',
        'Prompts estructurales iniciales'
      ],
      promptLayer: {
        label: 'Prompts estructurales base',
        description:
          'Desbloquea prompts para arquitectura de proyecto, monetización inicial, blueprint y organización con IA.'
      },
      prompts: [
        'Prompt de arquitectura inicial',
        'Prompt de validación de idea',
        'Prompt de monetización base',
        'Prompt de blueprint inicial'
      ],
      perceptionGoal:
        'Hacer sentir al usuario que ya no solo entiende mejor su caso: ahora tiene base real para trabajar.',
      cta: {
        label: 'Entrar al Pro',
        variant: 'primary'
      },
      highlight: true,
      isPrimaryPlan: true,
      unlocksNext: 'sistema',
      upgradeNarrative:
        'Este es el bloque que más conviene empujar visualmente. Debe ser la decisión natural para la mayoría.',
      visualRole: 'primary'
    },

    {
      id: 'sistema',
      type: 'plan',
      backendId: 'sistema',
      visibleName: 'Growth',
      backendName: 'Sistema',
      badge: 'Optimización',
      category: 'optimize',
      price: 79,
      priceLabel: '79 €',
      periodLabel: '/ mes',
      headline: 'Optimiza rendimiento, crecimiento y secuencia de trabajo.',
      description:
        'Capa intermedia de optimización para proyectos que ya no están probando, pero todavía no necesitan intervención maestra completa.',
      bestFor:
        'Usuario con proyecto en marcha que necesita más criterio de growth, CRO, priorización y sistema.',
      valuePromise:
        'No es un Pro más caro. Es una capa de optimización real entre construcción continua y dirección estratégica.',
      features: [
        'Todo lo del Pro',
        'Continuidad más profunda',
        'Lectura de growth y conversión',
        'Mayor criterio de priorización',
        'Prompts de optimización y sistema'
      ],
      promptLayer: {
        label: 'Prompts de optimización',
        description:
          'Secuencias y prompts para growth, CRO, mejora del proyecto, estructura y priorización.'
      },
      prompts: [
        'Prompt de optimización de conversión',
        'Prompt de growth estructural',
        'Prompt de mejora de propuesta',
        'Prompt de priorización táctica'
      ],
      perceptionGoal:
        'Hacer sentir al usuario que ha entrado en una capa más seria de mejora del rendimiento.',
      cta: {
        label: 'Entrar en Growth',
        variant: 'accent'
      },
      highlight: false,
      unlocksNext: 'premium',
      upgradeNarrative:
        'Puede comprarse directamente, pero también debe presentarse como ascenso natural desde el Pro.',
      visualRole: 'optimization'
    },

    {
      id: 'premium',
      type: 'plan',
      backendId: 'premium',
      visibleName: 'AI Master 199',
      backendName: 'Premium',
      badge: 'Dirección estratégica',
      category: 'strategic_direction',
      price: 199,
      priceLabel: '199 €',
      periodLabel: '/ mes',
      headline: 'Dirección, auditoría y arquitectura senior del sistema.',
      description:
        'Categoría superior para proyectos, negocios u oportunidades con suficiente peso comercial como para necesitar criterio fuerte y estructura de alto nivel.',
      bestFor:
        'Usuario que necesita intervención senior en monetización, growth, CRO, prompts maestros, arquitectura de trabajo y decisiones críticas.',
      valuePromise:
        'No vende lujo. Vende criterio, protección del sistema, diseño de mejores decisiones y capacidad real de elevar proyectos.',
      features: [
        'Todo lo de Growth',
        'Lógica CRO y growth senior',
        'Auditoría maestra del sistema',
        'AI Product Manager',
        'AI Assurance Leader',
        'AI Solutions Architect / Strategist',
        'Prompts maestros y sistemas de trabajo'
      ],
      promptLayer: {
        label: 'Prompt 99 y capa maestra',
        description:
          'Desbloquea prompts maestros, estructuras por roles, asistentes, sistemas de trabajo y arquitectura de prompts.'
      },
      prompts: [
        'Prompt 99',
        'Prompts maestros por rol',
        'Prompts para asistentes y arquitectura',
        'Prompts de auditoría senior',
        'Prompts de systems thinking con IA'
      ],
      strategicLogic: [
        'CRO',
        'Growth',
        'Auditor Maestro',
        'AI Product Manager',
        'AI Assurance Leader',
        'AI Solutions Architect / Strategist'
      ],
      perceptionGoal:
        'Hacer sentir al usuario que entra en una capa de criterio fuerte, no en un simple premium decorativo.',
      cta: {
        label: 'Acceder a AI Master 199',
        variant: 'strategic'
      },
      highlight: false,
      isStrategicPlan: true,
      visualRole: 'strategic'
    }
  ],

  upgradeLogic: {
    primaryVisualPlanId: 'blueprint',
    entryBridgeId: 'single_report',
    optimizationPlanId: 'sistema',
    strategicPlanId: 'premium',
    progressionModel: 'earned_or_direct',
    principle:
      'El sistema debe ayudar al usuario a crecer. No solo a pagar más.',
    proToGrowth: {
      from: 'blueprint',
      to: 'sistema',
      narrative:
        'El usuario puede entrar directamente a Growth, pero la narrativa principal debe mostrar que también puede llegar por madurez y progreso.',
      exactHandoffRuleV1: {
        ruleName: 'first_project_closed',
        description:
          'La invitación principal al 79 € se activa cuando el usuario cierra su primer proyecto dentro del Pro.',
        stateWhenUnlocked: 'eligible_for_upgrade',
        activePlanRequired: 'blueprint',
        completedProjectsRequired: 1,
        oneTimeTrigger: true
      },
      technicalStatus:
        'frontend_narrative_only_for_now',
      note:
        'La narrativa queda preparada en frontend aunque backend todavía no tenga el milestone implementado.'
    }
  },

  outputDoctrine: {
    principle:
      'La IA no debe devolver informes blandos. Debe elevar percepción, detectar potencial real y proponer una base de trabajo accionable.',
    ideaAnalysis: {
      goals: [
        'Detectar potencial real',
        'Justificar por qué la idea puede tener recorrido',
        'Abrir opciones de monetización',
        'Reducir niebla mental',
        'Dejar un siguiente paso claro'
      ],
      userFeeling:
        'El usuario debe sentir que su idea no es humo y que existe una vía concreta para trabajarla mejor.'
    },
    urlAnalysis: {
      goals: [
        'Detectar punto débil comercial',
        'Mostrar oportunidad de mejora',
        'Dar lectura de conversión',
        'Priorizar siguiente acción',
        'Preparar propuesta o mejora accionable'
      ],
      userFeeling:
        'El usuario debe sentir que el sistema ve cosas útiles, concretas y vendibles.'
    },
    localBusinessUseCases: {
      principle:
        'El sistema también debe servir para detectar oportunidades reales en negocios locales y convertirlas en propuestas accionables rápidas.',
      examples: [
        'Restaurantes',
        'Peluquerías',
        'Estudios de tatuaje',
        'Comercios de barrio',
        'Talleres',
        'Fuerzas de ventas',
        'Servicios locales'
      ],
      outputs: [
        'Mini informe de mejora',
        'Propuesta de estructura web',
        'Base de captación',
        'Orden operativo',
        'Tabla o sistema de organización',
        'Prompt de propuesta rápida para cliente'
      ]
    }
  },

  messagingRules: {
    free: 'Reducir fricción y abrir posibilidad.',
    single_report: 'Convertir curiosidad en primera compra útil.',
    blueprint: 'Ser la decisión natural para la mayoría de usuarios serios.',
    sistema: 'Transmitir optimización, crecimiento y mejora real del rendimiento.',
    premium:
      'Transmitir autoridad, auditoría, criterio y sistemas maestros de trabajo con IA.'
  },

  comparisonRows: [
    {
      label: 'Tipo de acceso',
      values: {
        single_report: 'Pago único',
        free: 'Gratis',
        blueprint: 'Mensual',
        sistema: 'Mensual',
        premium: 'Mensual'
      }
    },
    {
      label: 'Función principal',
      values: {
        single_report: 'Validación',
        free: 'Explorar',
        blueprint: 'Construir',
        sistema: 'Optimizar',
        premium: 'Dirigir'
      }
    },
    {
      label: 'Prompts',
      values: {
        single_report: '1 prompt accionable',
        free: 'Mini prompt base',
        blueprint: 'Prompts estructurales',
        sistema: 'Prompts de optimización',
        premium: 'Prompt 99 y capa maestra'
      }
    },
    {
      label: 'Tipo de intervención',
      values: {
        single_report: 'Puntual',
        free: 'Inicial',
        blueprint: 'Estructural',
        sistema: 'Growth / mejora',
        premium: 'Estratégica senior'
      }
    }
  ],

  trustSignals: [
    'Escalera de valor clara',
    'Prompts integrados como activos reales',
    'De idea o URL a base de trabajo accionable',
    'Útil tanto para proyectos propios como para oportunidades de negocio real'
  ]
};

export const pricingSection = pricingContent.section;
export const entryOffer = pricingContent.entryOffer;
export const pricingPlans = pricingContent.plans;
export const pricingPlansMap = Object.fromEntries(
  pricingContent.plans.map((plan) => [plan.id, plan])
);
export const pricingUpgradeLogic = pricingContent.upgradeLogic;
export const pricingOutputDoctrine = pricingContent.outputDoctrine;
export const pricingComparisonRows = pricingContent.comparisonRows;
export const pricingTrustSignals = pricingContent.trustSignals;
export const pricingMessagingRules = pricingContent.messagingRules;

export const getPricingPlanById = (id) => pricingPlansMap[id] || null;

export default pricingContent;
