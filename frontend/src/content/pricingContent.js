const pricingContent = {
  section: {
    eyebrow: 'Planes y acceso',
    title: 'Empieza con claridad. Construye con continuidad.',
    description:
      'La estructura de precios no debe vender por ruido. Debe acompañar una progresión lógica: explorar, validar, activar, construir, continuar y, si conviene, sacar el proyecto fuera del sistema.',
    microNote:
      'Cada nivel responde a una intensidad distinta de intervención. La suscripción da acceso al sistema, la construcción intensiva se apoya en créditos y la exportación se valora aparte.'
  },

  architecture: {
    model: 'ladder',
    principle: 'No vender más por acumulación. Vender mejor por cambio real de nivel.',
    layers: [
      'Exploración',
      'Validación puntual',
      'Activación base',
      'Continuidad operativa',
      'Activación avanzada'
    ]
  },

  entryOffer: {
    id: 'single_report',
    type: 'one_time_offer',
    backendId: 'single_report',
    visible: true,
    name: 'Informe puntual',
    shortName: '6,99',
    badge: 'Bloque puente',
    price: 6.99,
    priceLabel: '6,99 €',
    periodLabel: 'PAGO ÚNICO',
    headline: 'Valida una oportunidad antes de entrar al sistema.',
    description:
      'Compra puntual para convertir una idea, una URL o una oportunidad en una lectura más seria y una primera dirección útil.',
    bestFor:
      'Encaja cuando el usuario todavía no necesita continuidad, pero sí una validación mejor enfocada antes de decidir si sube al sistema.',
    valuePromise:
      'No compras una suscripción. Compras una validación breve y útil que reduce dudas y prepara el siguiente paso.',
    features: [
      'Informe breve con más criterio',
      'Lectura más concreta de la oportunidad',
      'Enfoque inicial de mejora o monetización',
      '1 prompt accionable de avance'
    ],
    promptLayer: {
      label: 'Prompt de avance',
      description:
        'Incluye un prompt práctico para seguir trabajando la idea o el activo analizado con una dirección mejor.'
    },
    psychology: {
      role: 'micro_bridge',
      perceptionGoal:
        'Reducir fricción de primera compra y demostrar valor antes de la entrada seria al sistema.',
      narrative:
        'Es el paso entre curiosear y empezar a tomarse el proyecto en serio.'
    },
    visual: {
      role: 'bridge_block',
      emphasis: 'entry_offer',
      recommendedPlacement: 'between_free_and_pro',
      note:
        'No debe presentarse como una quinta suscripción. Debe verse como un puente transaccional.'
    },
    cta: {
      label: 'Comprar informe',
      variant: 'bridge',
      target: 'billing',
      itemType: 'one_time_offer',
      itemId: 'single_report'
    },
    conceptualGraphic: {
      type: 'progress_steps',
      steps: ['Explorar', 'Validar', 'Activar', 'Continuar', 'Escalar'],
      activeStep: 'Validar',
      stepDetails: {
        Explorar: 'Gratis',
        Validar: '6,99 € ahora',
        Activar: '29 € Pro',
        Continuar: '79 € Growth',
        Escalar: '199 € AI Master'
      },
      note:
        'La gráfica debe ser conceptual, no estadística. No inventar métricas.'
    },
    strategicRole: {
      activationLevel: 'puntual',
      builderAccess: 'none',
      creditsIncluded: 0,
      exportAccess: 'not_included'
    }
  },

  plans: [
    {
      id: 'free',
      type: 'plan',
      backendId: 'free',
      internalName: 'Gratis',
      visibleName: 'Gratis',
      backendName: 'Gratis',
      badge: 'Entrada',
      category: 'exploration',
      activationLevel: 'exploration',
      builderAccess: 'none',
      exportAccess: 'not_included',
      creditsIncluded: 0,
      creditsLabel: 'Sin créditos incluidos',
      price: 0,
      priceLabel: 'Gratis',
      periodLabel: '',
      headline: 'Explora el sistema y detecta si merece avanzar.',
      description:
        'Puerta de entrada para entender tu necesidad, clasificarla bien y recibir una primera lectura sin fricción.',
      bestFor:
        'Usuario que aún está explorando una idea, una URL o una oportunidad y no necesita todavía una capa seria de activación.',
      valuePromise:
        'Rompe la inercia, abre claridad y permite probar el sistema sin entrar aún en continuidad.',
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
      visualRole: 'entry',
      strategicRole: {
        includedCredits: 0,
        builderMode: 'none',
        exportPolicy: 'not_available'
      }
    },

    {
      id: 'blueprint',
      type: 'plan',
      backendId: 'blueprint',
      internalName: 'Blueprint',
      visibleName: 'Pro',
      backendName: 'Blueprint',
      badge: 'Entrada seria',
      category: 'activation_base',
      activationLevel: 'base',
      builderAccess: 'base',
      exportAccess: 'quote_only_future',
      creditsIncluded: null,
      creditsLabel: 'Bolsa inicial de créditos incluida',
      price: 29,
      priceLabel: '29 €',
      periodLabel: '/ mes',
      headline: 'Pasa del análisis a una base real de activación.',
      description:
        'Es la entrada seria al sistema para quien ya no solo quiere entender mejor su caso, sino empezar a trabajar con una base estructural y una primera lógica de ejecución.',
      bestFor:
        'Usuario que ya detecta una oportunidad y quiere una activación base, una estructura clara y una primera experiencia real dentro del sistema.',
      valuePromise:
        'Aquí empieza la transición importante del producto: activación base, blueprint, ruta de trabajo y una primera bolsa de capacidad operativa.',
      features: [
        'Todo lo del nivel Gratis',
        'Blueprint estructural',
        'Activación base del proyecto',
        'Prioridades claras',
        'Stack y ruta inicial sugeridos',
        'Prompts estructurales iniciales',
        'Bolsa inicial de créditos'
      ],
      promptLayer: {
        label: 'Prompts estructurales base',
        description:
          'Desbloquea prompts para arquitectura inicial, monetización base, blueprint y primeros pasos de activación.'
      },
      prompts: [
        'Prompt de arquitectura inicial',
        'Prompt de validación de idea',
        'Prompt de monetización base',
        'Prompt de blueprint inicial'
      ],
      perceptionGoal:
        'Hacer sentir al usuario que ya no solo entiende mejor su caso: ahora tiene una base real para empezar.',
      cta: {
        label: 'Entrar en Pro',
        variant: 'primary'
      },
      highlight: true,
      isPrimaryPlan: true,
      unlocksNext: 'sistema',
      upgradeNarrative:
        'Este es el bloque que más conviene empujar visualmente. Debe ser la decisión natural para la mayoría de usuarios serios.',
      visualRole: 'primary',
      strategicRole: {
        includedCredits: 'pending_numeric_lock',
        builderMode: 'base',
        exportPolicy: 'separate_quote'
      }
    },

    {
      id: 'sistema',
      type: 'plan',
      backendId: 'sistema',
      internalName: 'Sistema',
      visibleName: 'Growth',
      backendName: 'Sistema',
      badge: 'Núcleo operativo',
      category: 'operational_continuity',
      activationLevel: 'operational',
      builderAccess: 'operational',
      exportAccess: 'quote_priority_future',
      creditsIncluded: null,
      creditsLabel: 'Bolsa superior de créditos incluida',
      price: 79,
      priceLabel: '79 €',
      periodLabel: '/ mes',
      headline: 'Convierte el sistema en continuidad operativa real.',
      description:
        'Capa central para proyectos que ya no están probando. Aquí el sistema pasa de activación base a continuidad seria, construcción con más recorrido y mejora operativa real.',
      bestFor:
        'Usuario con proyecto en marcha o con intención clara de construir, iterar y mejorar con más continuidad dentro del sistema.',
      valuePromise:
        'No es un Pro más caro. Es el núcleo operativo del producto: más activación, más continuidad, más ejecución visible y más capacidad para seguir construyendo.',
      features: [
        'Todo lo del Pro',
        'Activación operativa',
        'Continuidad más profunda',
        'Construcción visible con más recorrido',
        'CRO y mejora de propuesta',
        'Growth y priorización táctica',
        'Bolsa superior de créditos'
      ],
      promptLayer: {
        label: 'Prompts de continuidad y optimización',
        description:
          'Secuencias y prompts para CRO, growth, mejora de propuesta, continuidad del proyecto y trabajo más serio dentro del sistema.'
      },
      prompts: [
        'Prompt de optimización de conversión',
        'Prompt de growth estructural',
        'Prompt de mejora de propuesta',
        'Prompt de priorización táctica'
      ],
      perceptionGoal:
        'Hacer sentir al usuario que ha entrado en la capa donde el sistema ya no solo orienta: ahora acompaña construcción, continuidad y mejora real.',
      cta: {
        label: 'Entrar en Growth',
        variant: 'accent'
      },
      highlight: false,
      unlocksNext: 'premium',
      upgradeNarrative:
        'Puede comprarse directamente, pero también debe presentarse como ascenso natural desde el Pro cuando el usuario quiere continuidad operativa real.',
      visualRole: 'operational',
      strategicRole: {
        includedCredits: 'pending_numeric_lock',
        builderMode: 'operational',
        exportPolicy: 'separate_quote'
      }
    },

    {
      id: 'premium',
      type: 'plan',
      backendId: 'premium',
      internalName: 'Premium',
      visibleName: 'AI Master 199',
      backendName: 'Premium',
      badge: 'Capa superior',
      category: 'advanced_activation',
      activationLevel: 'advanced',
      builderAccess: 'advanced',
      exportAccess: 'advanced_quote_priority',
      creditsIncluded: null,
      creditsLabel: 'Mayor capacidad operativa incluida',
      price: 199,
      priceLabel: '199 €',
      periodLabel: '/ mes',
      headline: 'Activa la capa maestra para casos complejos y salidas serias.',
      description:
        'Categoría superior para proyectos, negocios u oportunidades que necesitan criterio fuerte, profundidad estratégica, activación avanzada y capacidad real para transformar un caso complejo en algo activable y lanzable.',
      bestFor:
        'Usuario que necesita intervención superior en monetización, growth, CRO, arquitectura, operadores de terceros o preparación seria de salida y transferencia.',
      valuePromise:
        'No vende lujo ni más soporte. Vende una capa maestra de criterio, protección del sistema, activación avanzada y capacidad real para elevar proyectos complejos.',
      features: [
        'Todo lo de Growth',
        'Activación avanzada',
        'CRO, growth y monetización senior',
        'Capacidad superior para operador o consultor',
        'Preparación seria de salida o exportación',
        'Prompt 99 y prompts maestros por rol',
        'Mayor capacidad operativa dentro del sistema'
      ],
      promptLayer: {
        label: 'Prompt 99 y capa maestra',
        description:
          'Desbloquea prompts maestros, estructuras por roles, criterio superior de sistema y una capa más fuerte de activación avanzada.'
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
        'Hacer sentir al usuario que entra en una capa de criterio fuerte, activación avanzada y capacidad superior, no en un premium decorativo.',
      cta: {
        label: 'Acceder a AI Master 199',
        variant: 'strategic'
      },
      highlight: false,
      isStrategicPlan: true,
      visualRole: 'strategic',
      strategicRole: {
        includedCredits: 'pending_numeric_lock',
        builderMode: 'advanced',
        exportPolicy: 'quoted_and_prioritized'
      }
    }
  ],

  upgradeLogic: {
    primaryVisualPlanId: 'blueprint',
    entryBridgeId: 'single_report',
    optimizationPlanId: 'sistema',
    strategicPlanId: 'premium',
    progressionModel: 'earned_or_direct',
    principle:
      'El sistema debe ayudar al usuario a entrar, activar, construir, continuar y, si conviene, exportar.',
    proToGrowth: {
      from: 'blueprint',
      to: 'sistema',
      narrative:
        'El usuario puede entrar directamente a Growth, pero la narrativa principal debe mostrar que también puede llegar por madurez y necesidad de continuidad operativa real.',
      exactHandoffRuleV1: {
        ruleName: 'first_project_closed',
        description:
          'La invitación principal al 79 € se activa cuando el usuario cierra su primera fase seria dentro del Pro y necesita más continuidad, construcción y créditos.',
        stateWhenUnlocked: 'eligible_for_upgrade',
        activePlanRequired: 'blueprint',
        completedProjectsRequired: 1,
        oneTimeTrigger: true
      },
      technicalStatus: 'frontend_narrative_only_for_now',
      note:
        'La narrativa queda preparada en frontend aunque backend todavía no tenga implementado el milestone real.'
    }
  },

  outputDoctrine: {
    principle:
      'La IA no debe devolver informes blandos. Debe elevar percepción, detectar potencial real, activar una base de trabajo y preparar continuidad dentro del sistema.',
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
        'El sistema también debe servir para detectar oportunidades reales en negocios locales y convertirlas en propuestas accionables rápidas o en bases de reconstrucción vendibles.',
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
    single_report: 'Convertir curiosidad en primera compra útil, sin darle protagonismo de sistema completo.',
    blueprint: 'Presentarse como la entrada seria al sistema y a la activación base.',
    sistema: 'Transmitir continuidad operativa, construcción con más recorrido y mejora real.',
    premium:
      'Transmitir activación avanzada, criterio maestro, complejidad superior y capacidad real para operador o salida seria.'
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
        single_report: 'Validar',
        free: 'Explorar',
        blueprint: 'Activar',
        sistema: 'Continuar',
        premium: 'Escalar'
      }
    },
    {
      label: 'Capa de activación',
      values: {
        single_report: 'Puntual',
        free: 'Inicial',
        blueprint: 'Base',
        sistema: 'Operativa',
        premium: 'Avanzada'
      }
    },
    {
      label: 'Créditos',
      values: {
        single_report: 'No incluidos',
        free: 'No incluidos',
        blueprint: 'Bolsa inicial',
        sistema: 'Bolsa superior',
        premium: 'Mayor capacidad'
      }
    },
    {
      label: 'Salida del sistema',
      values: {
        single_report: 'No incluida',
        free: 'No incluida',
        blueprint: 'Valoración futura',
        sistema: 'Valoración futura',
        premium: 'Preparación seria'
      }
    }
  ],

  trustSignals: [
    'Escalera de valor clara',
    'Activación como capa real del producto',
    'Créditos preparados como economía operativa',
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
