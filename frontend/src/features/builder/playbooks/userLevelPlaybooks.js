export const USER_LEVELS = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
});

export const DEFAULT_USER_LEVEL = USER_LEVELS.MEDIUM;

export const USER_LEVEL_PLAYBOOKS = Object.freeze({
  [USER_LEVELS.LOW]: {
    id: USER_LEVELS.LOW,
    label: 'Usuario inicial',
    description:
      'Usuario con poca claridad técnica o estratégica. Necesita guía simple, opciones cerradas y decisiones fáciles.',
    communicationStyle: {
      tone: 'directo, simple y guiado',
      density: 'baja',
      explanationDepth: 'mínima necesaria',
      technicalLanguage: 'evitar',
    },
    priorities: [
      'reducir fricción',
      'evitar sobrecarga',
      'proponer opciones claras',
      'traducir decisiones técnicas a beneficios visibles',
      'guiar hacia una primera versión útil',
    ],
    questionStrategy: {
      maxQuestionsPerStep: 1,
      preferredFormat: 'opciones cerradas',
      examples: [
        '¿Quieres una web para conseguir clientes, reservas o ventas?',
        '¿Prefieres un diseño claro y sencillo o más premium?',
        '¿El botón principal debe llevar a WhatsApp, llamada o formulario?',
      ],
    },
    builderBehavior: {
      shouldExplainClassification: true,
      shouldOfferPresets: true,
      shouldAvoidComplexAlternatives: true,
      shouldSurfaceTechnicalDetails: false,
    },
    responsePattern: {
      opening:
        'He entendido el objetivo principal y voy a convertirlo en una primera versión clara y fácil de avanzar.',
      decision:
        'Voy a priorizar estructura simple, CTA visible y una explicación fácil de entender.',
      nextStep:
        'Después podrás ajustar colores, textos, secciones o llamada a la acción sin entrar en parte técnica.',
    },
  },

  [USER_LEVELS.MEDIUM]: {
    id: USER_LEVELS.MEDIUM,
    label: 'Usuario operativo',
    description:
      'Usuario con una idea razonablemente clara, pero que necesita estructura, enfoque de conversión y orden.',
    communicationStyle: {
      tone: 'profesional, claro y orientado a acción',
      density: 'media',
      explanationDepth: 'breve pero suficiente',
      technicalLanguage: 'solo cuando aporte claridad',
    },
    priorities: [
      'clasificar el proyecto',
      'definir objetivo de conversión',
      'ordenar hero, secciones y CTA',
      'proponer una primera arquitectura',
      'mostrar cambios visibles en cada iteración',
    ],
    questionStrategy: {
      maxQuestionsPerStep: 2,
      preferredFormat: 'pregunta guiada con alternativas',
      examples: [
        '¿Quieres captar leads, vender directamente o llevar a una llamada?',
        '¿El proyecto debe sentirse más premium, más directo o más cercano?',
        '¿La acción principal será diagnóstico, reserva, compra o contacto?',
      ],
    },
    builderBehavior: {
      shouldExplainClassification: true,
      shouldOfferPresets: true,
      shouldAvoidComplexAlternatives: false,
      shouldSurfaceTechnicalDetails: false,
    },
    responsePattern: {
      opening:
        'Clasifico este proyecto y voy a construir una primera versión orientada a conversión.',
      decision:
        'Voy a priorizar promesa clara, estructura comercial, CTA visible y bloques de confianza.',
      nextStep:
        'Después podremos iterar diseño, copy, colores, secciones o enfoque de conversión.',
    },
  },

  [USER_LEVELS.ADVANCED]: {
    id: USER_LEVELS.ADVANCED,
    label: 'Usuario avanzado',
    description:
      'Usuario con criterio de negocio, marketing, producto o IA. Necesita más precisión estratégica y menos explicación básica.',
    communicationStyle: {
      tone: 'estratégico, específico y orientado a rendimiento',
      density: 'media-alta',
      explanationDepth: 'táctica',
      technicalLanguage: 'moderado',
    },
    priorities: [
      'identificar palanca de conversión',
      'definir ángulo de oferta',
      'reducir objeciones',
      'optimizar jerarquía visual',
      'preparar iteraciones con intención medible',
      'diferenciar captación, activación y monetización',
    ],
    questionStrategy: {
      maxQuestionsPerStep: 2,
      preferredFormat: 'decisión estratégica',
      examples: [
        '¿Quieres optimizar para leads fríos, leads cualificados o venta directa?',
        '¿La oferta debe apoyarse más en autoridad, urgencia, prueba social o diagnóstico?',
        '¿Priorizamos claridad comercial, premium visual o activación rápida?',
      ],
    },
    builderBehavior: {
      shouldExplainClassification: true,
      shouldOfferPresets: false,
      shouldAvoidComplexAlternatives: false,
      shouldSurfaceTechnicalDetails: true,
    },
    responsePattern: {
      opening:
        'Clasifico el proyecto y activo una lectura estratégica de conversión, oferta y estructura.',
      decision:
        'Voy a ajustar propuesta de valor, jerarquía visual, CTA y bloques según el objetivo comercial.',
      nextStep:
        'La siguiente iteración puede ir a copy, CRO, pricing, autoridad, objeciones o salida técnica.',
    },
  },

  [USER_LEVELS.EXPERT]: {
    id: USER_LEVELS.EXPERT,
    label: 'Usuario experto',
    description:
      'Usuario técnico, operador digital, agencia, consultor o empresa. Necesita arquitectura, escalabilidad y control.',
    communicationStyle: {
      tone: 'técnico-estratégico, preciso y sin relleno',
      density: 'alta',
      explanationDepth: 'arquitectónica',
      technicalLanguage: 'permitido si reduce ambigüedad',
    },
    priorities: [
      'separar capas',
      'evitar deuda técnica',
      'definir arquitectura reusable',
      'preparar integración con datos, APIs o deploy',
      'documentar decisiones',
      'alinear conversión, operación y escalabilidad',
    ],
    questionStrategy: {
      maxQuestionsPerStep: 3,
      preferredFormat: 'decisión de arquitectura o trade-off',
      examples: [
        '¿Este sistema debe ser landing, herramienta operativa, dashboard o flujo automatizado?',
        '¿La prioridad es conversión inmediata, escalabilidad o integración técnica?',
        '¿La salida esperada es preview, código exportable, GitHub, deploy o documentación?',
      ],
    },
    builderBehavior: {
      shouldExplainClassification: false,
      shouldOfferPresets: false,
      shouldAvoidComplexAlternatives: false,
      shouldSurfaceTechnicalDetails: true,
    },
    responsePattern: {
      opening:
        'Clasifico la entrada como sistema digital y separo objetivo, arquitectura, conversión y salida técnica.',
      decision:
        'Voy a priorizar estructura modular, trazabilidad de cambios, CTA operativo y capacidad de iteración.',
      nextStep:
        'La siguiente capa puede conectar preview, código, datos, automatización, GitHub o deploy.',
    },
  },
});

const LEVEL_KEYWORDS = Object.freeze({
  [USER_LEVELS.LOW]: [
    'no sé',
    'no entiendo',
    'ayúdame',
    'hazlo fácil',
    'principiante',
    'básico',
    'sencillo',
    'sin complicarme',
  ],
  [USER_LEVELS.MEDIUM]: [
    'quiero una web',
    'quiero una landing',
    'necesito vender',
    'captar clientes',
    'reservas',
    'servicio',
    'negocio',
  ],
  [USER_LEVELS.ADVANCED]: [
    'conversión',
    'monetización',
    'embudo',
    'lead',
    'alto ticket',
    'seo',
    'cro',
    'anuncios',
    'campaña',
    'pricing',
  ],
  [USER_LEVELS.EXPERT]: [
    'api',
    'backend',
    'frontend',
    'github',
    'deploy',
    'automatización',
    'crm',
    'dashboard',
    'arquitectura',
    'webhook',
    'integración',
    'pipeline',
  ],
});

export const normalizeBuilderText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const detectUserLevelFromText = (text = '') => {
  const normalized = normalizeBuilderText(text);

  if (!normalized) return DEFAULT_USER_LEVEL;

  const scores = Object.entries(LEVEL_KEYWORDS).reduce((acc, [level, keywords]) => {
    const score = keywords.reduce((total, keyword) => {
      const normalizedKeyword = normalizeBuilderText(keyword);
      return normalized.includes(normalizedKeyword) ? total + 1 : total;
    }, 0);

    return {
      ...acc,
      [level]: score,
    };
  }, {});

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (!ranked.length || ranked[0][1] === 0) return DEFAULT_USER_LEVEL;

  return ranked[0][0];
};

export const getUserLevelPlaybook = (level = DEFAULT_USER_LEVEL) =>
  USER_LEVEL_PLAYBOOKS[level] || USER_LEVEL_PLAYBOOKS[DEFAULT_USER_LEVEL];

export const resolveUserLevel = ({
  text = '',
  explicitLevel = '',
} = {}) => {
  if (explicitLevel && USER_LEVEL_PLAYBOOKS[explicitLevel]) {
    return explicitLevel;
  }

  return detectUserLevelFromText(text);
};