const pricingContent = {
  section: {
    eyebrow: 'Planes y acceso',
    title: 'Empieza con claridad. Escala con continuidad.',
    description:
      'La estructura de precios no debe vender por ruido. Debe acompañar una progresión real: explorar, validar, activar, continuar y, cuando convenga, preparar salida.',
    microNote:
      'La suscripción da acceso al sistema. La capacidad operativa se apoya en créditos. La exportación se valora aparte.'
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
      'Compra puntual para convertir una idea, una URL o una oportunidad en una lectura útil y una primera dirección seria.',
    bestFor:
      'Usuario que aún no necesita continuidad, pero sí una validación mejor enfocada.',
    valuePromise:
      'Reduce dudas, ordena el caso y prepara el siguiente paso.',
    features: [
      'Informe breve con criterio',
      'Lectura más concreta',
      'Enfoque inicial de mejora',
      '1 prompt accionable'
    ],
    billingHighlights: [
      'Validación puntual',
      'Lectura más útil',
      'Primer foco de mejora',
      '1 prompt de avance'
    ],
    promptLayer: {
      label: 'Prompt de avance',
      description:
        'Incluye un prompt práctico para seguir trabajando la idea o el activo analizado.'
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
      creditsLabel: 'Sin créditos',
      price: 0,
      priceLabel: 'Gratis',
      periodLabel: '',
      headline: 'Explora el caso y decide si merece avanzar.',
      description:
        'Entrada sin fricción para clasificar necesidad, URL u oportunidad y obtener una primera lectura útil.',
      bestFor:
        'Usuario que solo necesita claridad inicial.',
      bestForShort:
        'Exploración inicial sin continuidad.',
      valuePromise:
        'Abre claridad y rompe la inercia inicial.',
      features: [
        'Diagnóstico inicial',
        'Ruta recomendada',
        'Resultado resumido',
        'Primer marco de decisión'
      ],
      billingHighlights: [
        'Diagnóstico inicial',
        'Ruta recomendada',
        'Resultado resumido',
        'Primer criterio'
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
      creditsIncluded: 60,
      creditsLabel: '60 incluidos',
      price: 29,
      priceLabel: '29 €',
      periodLabel: '/ mes',
      headline: 'Activa una base real de trabajo.',
      description:
        'Entrada seria al sistema para pasar del análisis a una base estructural con primera capacidad operativa.',
      bestFor:
        'Usuario que ya ve una oportunidad y quiere empezar a trabajarla dentro del sistema.',
      bestForShort:
        'Primera activación seria dentro del sistema.',
      valuePromise:
        'Activa blueprint, ruta, prompts y una bolsa inicial de capacidad.',
      features: [
        'Todo lo del nivel Gratis',
        'Blueprint estructural',
        'Prioridades claras',
        'Bolsa inicial de créditos'
      ],
      billingHighlights: [
        'Blueprint estructural',
        'Prioridades claras',
        'Builder base',
        '60 créditos incluidos'
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
        'Hacer sentir al usuario que ya no solo entiende mejor su caso: ahora puede empezar.',
      cta: {
        label: 'Entrar en Pro',
        variant: 'primary'
      },
      highlight: true,
      isPrimaryPlan: true,
      unlocksNext: 'sistema',
      upgradeNarrative:
        'Debe ser la decisión natural para la mayoría de usuarios serios.',
      visualRole: 'primary',
      strategicRole: {
        includedCredits: 60,
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
      creditsIncluded: 220,
      creditsLabel: '220 incluidos',
      price: 79,
      priceLabel: '79 €',
      periodLabel: '/ mes',
      headline: 'Convierte el sistema en continuidad operativa.',
      description:
        'Capa central para proyectos que ya no están probando y necesitan más recorrido, iteración y capacidad real.',
      bestFor:
        'Usuario con proyecto en marcha que necesita continuidad y más construcción dentro del sistema.',
      bestForShort:
        'Continuidad seria y trabajo con más recorrido.',
      valuePromise:
        'No es un Pro más caro. Es la capa donde el sistema acompaña ejecución, continuidad y mejora.',
      features: [
        'Todo lo del Pro',
        'Continuidad operativa',
        'Construcción con más recorrido',
        'Bolsa superior de créditos'
      ],
      billingHighlights: [
        'Continuidad operativa',
        'Builder con continuidad',
        'Optimización y mejora',
        '220 créditos incluidos'
      ],
      promptLayer: {
        label: 'Prompts de continuidad y optimización',
        description:
          'Secuencias y prompts para CRO, growth, continuidad del proyecto y mejora más seria.'
      },
      prompts: [
        'Prompt de optimización de conversión',
        'Prompt de growth estructural',
        'Prompt de mejora de propuesta',
        'Prompt de priorización táctica'
      ],
      perceptionGoal:
        'Hacer sentir al usuario que el sistema ya no solo orienta: ahora sostiene trabajo real.',
      cta: {
        label: 'Entrar en Growth',
        variant: 'accent'
      },
      highlight: false,
      unlocksNext: 'premium',
      upgradeNarrative:
        'Debe presentarse como ascenso natural cuando el usuario pide continuidad operativa real.',
      visualRole: 'operational',
      strategicRole: {
        includedCredits: 220,
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
      creditsIncluded: 600,
      creditsLabel: '600 incluidos',
      price: 199,
      priceLabel: '199 €',
      periodLabel: '/ mes',
      headline: 'Activa la capa maestra para casos complejos.',
      description:
        'Nivel superior para casos de más complejidad, criterio fuerte, activación avanzada y preparación seria de salida.',
      bestFor:
        'Usuario que necesita criterio superior, operador serio o preparación real de transferencia.',
      bestForShort:
        'Casos complejos, operador serio y salida preparada.',
      valuePromise:
        'No vende lujo. Vende criterio, activación avanzada y mayor capacidad operativa.',
      features: [
        'Todo lo de Growth',
        'Activación avanzada',
        'Prompt 99 y capa maestra',
        'Mayor capacidad operativa'
      ],
      billingHighlights: [
        'Criterio maestro',
        'Builder avanzado',
        'Preparación de salida',
        '600 créditos incluidos'
      ],
      promptLayer: {
        label: 'Prompt 99 y capa maestra',
        description:
          'Desbloquea prompts maestros, estructuras por roles y criterio superior de sistema.'
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
        'Hacer sentir al usuario que entra en una capa de criterio fuerte y capacidad superior.',
      cta: {
        label: 'Acceder a AI Master 199',
        variant: 'strategic'
      },
      highlight: false,
      isStrategicPlan: true,
      visualRole: 'strategic',
      strategicRole: {
        includedCredits: 600,
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
      'El sistema debe ayudar al usuario a entrar, activar, continuar y, si conviene, preparar salida.',
    proToGrowth: {
      from: 'blueprint',
      to: 'sistema',
      narrative:
        'El usuario puede entrar directamente a Growth, pero la narrativa principal debe mostrar que también puede llegar por madurez y necesidad real de continuidad.',
      exactHandoffRuleV1: {
        ruleName: 'first_project_closed',
        description:
          'La invitación principal al 79 € se activa cuando el usuario cierra su primera fase seria dentro del Pro y necesita más continuidad y créditos.',
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
      'La IA no debe devolver informes blandos. Debe detectar potencial real, activar base de trabajo y preparar continuidad dentro del sistema.',
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
        'El sistema también debe servir para detectar oportunidades reales en negocios locales y convertirlas en propuestas accionables rápidas o bases de reconstrucción vendibles.',
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
    blueprint: 'Presentarse como la entrada seria al sistema.',
    sistema: 'Transmitir continuidad operativa y construcción real.',
    premium:
      'Transmitir activación avanzada, criterio maestro y capacidad superior.'
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
        blueprint: '60 incluidos',
        sistema: '220 incluidos',
        premium: '600 incluidos'
      }
    },
    {
      label: 'Salida del sistema',
      values: {
        single_report: 'No incluida',
        free: 'No incluida',
        blueprint: 'Valoración futura',
        sistema: 'Valoración prioritaria',
        premium: 'Preparación seria'
      }
    }
  ],

  trustSignals: [
    'Escalera de valor clara',
    'Activación como capa real del producto',
    'Créditos visibles como capacidad operativa',
    'De idea o URL a base de trabajo accionable',
    'Útil para proyecto propio u oportunidad real'
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
