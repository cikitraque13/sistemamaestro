import {
  normalizeBuilderText,
} from '../playbooks';

import {
  getBuilderPlaybookSelectionSummary,
  selectBuilderPlaybooks,
} from './builderPlaybookSelector';

export const BUILDER_ITERATION_INTENT_IDS = Object.freeze({
  PREMIUMIZE: 'premiumize',
  CLARIFY: 'clarify',
  INCREASE_CONVERSION: 'increase_conversion',
  CHANGE_CTA: 'change_cta',
  CHANGE_COLOR: 'change_color',
  REWRITE_COPY: 'rewrite_copy',
  CHANGE_STRUCTURE: 'change_structure',
  CHANGE_SECTOR_CONTEXT: 'change_sector_context',
  ADD_TRUST: 'add_trust',
  SIMPLIFY: 'simplify',
  AUTOMATION_DETAIL: 'automation_detail',
  TECHNICAL_OUTPUT: 'technical_output',
  GENERAL_IMPROVEMENT: 'general_improvement',
  UNKNOWN: 'unknown',
});

export const BUILDER_ITERATION_LAYER_IDS = Object.freeze({
  HUB: 'hub',
  VISUAL: 'visual',
  COPY: 'copy',
  CTA: 'cta',
  STRUCTURE: 'structure',
  CONVERSION: 'conversion',
  TRUST: 'trust',
  AUTOMATION: 'automation',
  TECHNICAL: 'technical',
});

export const BUILDER_ITERATION_CONFIDENCE = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
});

export const BUILDER_ITERATION_ACTION_TYPES = Object.freeze({
  APPLY_DIRECTLY: 'apply_directly',
  ASK_ONE_QUESTION: 'ask_one_question',
  HOLD_AND_CLARIFY: 'hold_and_clarify',
});

const INTENT_KEYWORDS = Object.freeze({
  [BUILDER_ITERATION_INTENT_IDS.PREMIUMIZE]: [
    'premium',
    'más premium',
    'mas premium',
    'elegante',
    'lujoso',
    'alto nivel',
    'más serio',
    'mas serio',
    'más profesional',
    'mas profesional',
    'sofisticado',
    'exclusivo',
    'high ticket',
    'alto ticket',
  ],

  [BUILDER_ITERATION_INTENT_IDS.CLARIFY]: [
    'más claro',
    'mas claro',
    'claridad',
    'se entiende mejor',
    'simplifica el mensaje',
    'no se entiende',
    'hazlo entendible',
    'más directo',
    'mas directo',
    'explica mejor',
  ],

  [BUILDER_ITERATION_INTENT_IDS.INCREASE_CONVERSION]: [
    'más conversión',
    'mas conversion',
    'convierte más',
    'convierte mas',
    'mejorar conversión',
    'mejorar conversion',
    'optimiza',
    'optimizar',
    'cro',
    'vende más',
    'vende mas',
    'captar más',
    'captar mas',
    'más leads',
    'mas leads',
  ],

  [BUILDER_ITERATION_INTENT_IDS.CHANGE_CTA]: [
    'cta',
    'botón',
    'boton',
    'botones',
    'llamada a la acción',
    'llamada a la accion',
    'cambia el botón',
    'cambia el boton',
    'texto del botón',
    'texto del boton',
    'reservar',
    'comprar',
    'diagnóstico',
    'diagnostico',
    'whatsapp',
  ],

  [BUILDER_ITERATION_INTENT_IDS.CHANGE_COLOR]: [
    'color',
    'colores',
    'naranja',
    'verde',
    'azul',
    'dorado',
    'negro',
    'blanco',
    'claro',
    'oscuro',
    'fondo',
    'gradiente',
    'degradado',
    'contraste',
  ],

  [BUILDER_ITERATION_INTENT_IDS.REWRITE_COPY]: [
    'copy',
    'texto',
    'titular',
    'subtítulo',
    'subtitulo',
    'beneficios',
    'promesa',
    'reescribe',
    'cambia el texto',
    'mejora el texto',
    'más persuasivo',
    'mas persuasivo',
  ],

  [BUILDER_ITERATION_INTENT_IDS.CHANGE_STRUCTURE]: [
    'estructura',
    'secciones',
    'bloques',
    'añade bloque',
    'anade bloque',
    'quita bloque',
    'orden',
    'reordena',
    'más secciones',
    'mas secciones',
    'menos secciones',
  ],

  [BUILDER_ITERATION_INTENT_IDS.CHANGE_SECTOR_CONTEXT]: [
    'restaurante',
    'cafetería',
    'cafeteria',
    'bar',
    'abogado',
    'gestoría',
    'gestoria',
    'clínica',
    'clinica',
    'agencia',
    'escuela',
    'ecommerce',
    'inmobiliaria',
    'oficina',
    'tienda',
  ],

  [BUILDER_ITERATION_INTENT_IDS.ADD_TRUST]: [
    'confianza',
    'autoridad',
    'testimonios',
    'reseñas',
    'resenas',
    'casos',
    'prueba social',
    'garantía',
    'garantia',
    'seguridad',
    'credibilidad',
    'objeciones',
  ],

  [BUILDER_ITERATION_INTENT_IDS.SIMPLIFY]: [
    'más simple',
    'mas simple',
    'simplifica',
    'menos cargado',
    'menos texto',
    'menos bloques',
    'limpio',
    'minimalista',
    'más limpio',
    'mas limpio',
  ],

  [BUILDER_ITERATION_INTENT_IDS.AUTOMATION_DETAIL]: [
    'automatizar',
    'automatización',
    'automatizacion',
    'flujo',
    'workflow',
    'crm',
    'zapier',
    'make',
    'emails',
    'herramientas',
    'proceso',
    'tareas',
  ],

  [BUILDER_ITERATION_INTENT_IDS.TECHNICAL_OUTPUT]: [
    'código',
    'codigo',
    'github',
    'deploy',
    'exportar',
    'backend',
    'frontend',
    'api',
    'base de datos',
    'integración',
    'integracion',
    'html',
    'css',
    'javascript',
    'python',
  ],

  [BUILDER_ITERATION_INTENT_IDS.GENERAL_IMPROVEMENT]: [
    'mejora',
    'mejorar',
    'eleva',
    'sube nivel',
    'hazlo mejor',
    'dale más fuerza',
    'dale mas fuerza',
    'más potente',
    'mas potente',
    'más bonito',
    'mas bonito',
  ],
});

const INTENT_PRIORITY = Object.freeze([
  BUILDER_ITERATION_INTENT_IDS.CHANGE_SECTOR_CONTEXT,
  BUILDER_ITERATION_INTENT_IDS.AUTOMATION_DETAIL,
  BUILDER_ITERATION_INTENT_IDS.TECHNICAL_OUTPUT,
  BUILDER_ITERATION_INTENT_IDS.CHANGE_CTA,
  BUILDER_ITERATION_INTENT_IDS.INCREASE_CONVERSION,
  BUILDER_ITERATION_INTENT_IDS.PREMIUMIZE,
  BUILDER_ITERATION_INTENT_IDS.CHANGE_COLOR,
  BUILDER_ITERATION_INTENT_IDS.REWRITE_COPY,
  BUILDER_ITERATION_INTENT_IDS.CHANGE_STRUCTURE,
  BUILDER_ITERATION_INTENT_IDS.ADD_TRUST,
  BUILDER_ITERATION_INTENT_IDS.CLARIFY,
  BUILDER_ITERATION_INTENT_IDS.SIMPLIFY,
  BUILDER_ITERATION_INTENT_IDS.GENERAL_IMPROVEMENT,
]);

const INTENT_LAYER_MAP = Object.freeze({
  [BUILDER_ITERATION_INTENT_IDS.PREMIUMIZE]: [
    BUILDER_ITERATION_LAYER_IDS.VISUAL,
    BUILDER_ITERATION_LAYER_IDS.COPY,
    BUILDER_ITERATION_LAYER_IDS.TRUST,
    BUILDER_ITERATION_LAYER_IDS.CTA,
  ],
  [BUILDER_ITERATION_INTENT_IDS.CLARIFY]: [
    BUILDER_ITERATION_LAYER_IDS.COPY,
    BUILDER_ITERATION_LAYER_IDS.STRUCTURE,
    BUILDER_ITERATION_LAYER_IDS.CTA,
  ],
  [BUILDER_ITERATION_INTENT_IDS.INCREASE_CONVERSION]: [
    BUILDER_ITERATION_LAYER_IDS.CONVERSION,
    BUILDER_ITERATION_LAYER_IDS.CTA,
    BUILDER_ITERATION_LAYER_IDS.STRUCTURE,
    BUILDER_ITERATION_LAYER_IDS.TRUST,
  ],
  [BUILDER_ITERATION_INTENT_IDS.CHANGE_CTA]: [
    BUILDER_ITERATION_LAYER_IDS.CTA,
    BUILDER_ITERATION_LAYER_IDS.CONVERSION,
    BUILDER_ITERATION_LAYER_IDS.COPY,
  ],
  [BUILDER_ITERATION_INTENT_IDS.CHANGE_COLOR]: [
    BUILDER_ITERATION_LAYER_IDS.VISUAL,
    BUILDER_ITERATION_LAYER_IDS.CTA,
  ],
  [BUILDER_ITERATION_INTENT_IDS.REWRITE_COPY]: [
    BUILDER_ITERATION_LAYER_IDS.COPY,
    BUILDER_ITERATION_LAYER_IDS.CONVERSION,
  ],
  [BUILDER_ITERATION_INTENT_IDS.CHANGE_STRUCTURE]: [
    BUILDER_ITERATION_LAYER_IDS.STRUCTURE,
    BUILDER_ITERATION_LAYER_IDS.CONVERSION,
  ],
  [BUILDER_ITERATION_INTENT_IDS.CHANGE_SECTOR_CONTEXT]: [
    BUILDER_ITERATION_LAYER_IDS.HUB,
    BUILDER_ITERATION_LAYER_IDS.STRUCTURE,
    BUILDER_ITERATION_LAYER_IDS.VISUAL,
    BUILDER_ITERATION_LAYER_IDS.CTA,
  ],
  [BUILDER_ITERATION_INTENT_IDS.ADD_TRUST]: [
    BUILDER_ITERATION_LAYER_IDS.TRUST,
    BUILDER_ITERATION_LAYER_IDS.COPY,
    BUILDER_ITERATION_LAYER_IDS.STRUCTURE,
  ],
  [BUILDER_ITERATION_INTENT_IDS.SIMPLIFY]: [
    BUILDER_ITERATION_LAYER_IDS.STRUCTURE,
    BUILDER_ITERATION_LAYER_IDS.COPY,
    BUILDER_ITERATION_LAYER_IDS.VISUAL,
  ],
  [BUILDER_ITERATION_INTENT_IDS.AUTOMATION_DETAIL]: [
    BUILDER_ITERATION_LAYER_IDS.AUTOMATION,
    BUILDER_ITERATION_LAYER_IDS.STRUCTURE,
    BUILDER_ITERATION_LAYER_IDS.TECHNICAL,
  ],
  [BUILDER_ITERATION_INTENT_IDS.TECHNICAL_OUTPUT]: [
    BUILDER_ITERATION_LAYER_IDS.TECHNICAL,
    BUILDER_ITERATION_LAYER_IDS.STRUCTURE,
  ],
  [BUILDER_ITERATION_INTENT_IDS.GENERAL_IMPROVEMENT]: [
    BUILDER_ITERATION_LAYER_IDS.HUB,
    BUILDER_ITERATION_LAYER_IDS.VISUAL,
    BUILDER_ITERATION_LAYER_IDS.COPY,
    BUILDER_ITERATION_LAYER_IDS.CONVERSION,
  ],
  [BUILDER_ITERATION_INTENT_IDS.UNKNOWN]: [
    BUILDER_ITERATION_LAYER_IDS.HUB,
  ],
});

const countKeywordHits = (normalizedText = '', keywords = []) =>
  keywords.reduce((score, keyword) => {
    const candidate = normalizeBuilderText(keyword);

    if (!candidate) return score;

    return normalizedText.includes(candidate) ? score + 1 : score;
  }, 0);

const unique = (items = []) =>
  Array.from(new Set(items.filter(Boolean)));

const compact = (items = []) => items.filter(Boolean);

const getPriorityIndex = (intentId = '') => {
  const index = INTENT_PRIORITY.indexOf(intentId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

export const scoreBuilderIterationIntents = (message = '') => {
  const normalizedText = normalizeBuilderText(message);

  return Object.entries(INTENT_KEYWORDS).reduce((acc, [intentId, keywords]) => {
    acc[intentId] = countKeywordHits(normalizedText, keywords);
    return acc;
  }, {});
};

export const resolveBuilderIterationIntent = (message = '') => {
  const normalizedText = normalizeBuilderText(message);
  const scores = scoreBuilderIterationIntents(normalizedText);

  const matches = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return getPriorityIndex(a[0]) - getPriorityIndex(b[0]);
    });

  const primaryIntent = matches[0]?.[0] || BUILDER_ITERATION_INTENT_IDS.UNKNOWN;

  const secondaryIntents = matches
    .slice(1, 4)
    .map(([intentId]) => intentId);

  const confidence =
    matches[0]?.[1] >= 2
      ? BUILDER_ITERATION_CONFIDENCE.HIGH
      : matches[0]?.[1] === 1
        ? BUILDER_ITERATION_CONFIDENCE.MEDIUM
        : BUILDER_ITERATION_CONFIDENCE.LOW;

  return {
    primaryIntent,
    secondaryIntents,
    scores,
    confidence,
  };
};

export const resolveBuilderIterationLayers = ({
  primaryIntent = BUILDER_ITERATION_INTENT_IDS.UNKNOWN,
  secondaryIntents = [],
} = {}) => {
  const layers = [
    ...(INTENT_LAYER_MAP[primaryIntent] || []),
    ...secondaryIntents.flatMap((intentId) => INTENT_LAYER_MAP[intentId] || []),
  ];

  return unique(layers);
};

const resolveRequestedTone = (normalizedText = '') => {
  if (normalizedText.includes('premium') || normalizedText.includes('alto ticket')) {
    return 'premium';
  }

  if (normalizedText.includes('directo') || normalizedText.includes('agresivo')) {
    return 'direct';
  }

  if (normalizedText.includes('cercano') || normalizedText.includes('humano')) {
    return 'warm';
  }

  if (normalizedText.includes('serio') || normalizedText.includes('sobrio')) {
    return 'serious';
  }

  if (normalizedText.includes('simple') || normalizedText.includes('limpio')) {
    return 'simple';
  }

  return 'contextual';
};

const resolveRequestedPalette = (normalizedText = '') => {
  const paletteSignals = [
    'naranja',
    'verde',
    'azul',
    'dorado',
    'negro',
    'blanco',
    'oscuro',
    'claro',
    'rojo',
    'violeta',
    'cyan',
    'turquesa',
  ];

  return paletteSignals.filter((signal) => normalizedText.includes(signal));
};

const resolveRequestedCTA = ({
  normalizedText = '',
  selectionSummary = {},
} = {}) => {
  const ctaCandidates = [
    {
      signal: 'diagnostico',
      value: 'Solicitar diagnóstico',
    },
    {
      signal: 'diagnóstico',
      value: 'Solicitar diagnóstico',
    },
    {
      signal: 'reservar',
      value: 'Reservar ahora',
    },
    {
      signal: 'mesa',
      value: 'Reservar mesa',
    },
    {
      signal: 'comprar',
      value: 'Comprar ahora',
    },
    {
      signal: 'whatsapp',
      value: 'Enviar WhatsApp',
    },
    {
      signal: 'llamada',
      value: 'Reservar llamada',
    },
    {
      signal: 'demo',
      value: 'Ver demo',
    },
    {
      signal: 'registro',
      value: 'Crear mi cuenta',
    },
    {
      signal: 'probar',
      value: 'Probar gratis',
    },
    {
      signal: 'automatizacion',
      value: 'Diseñar automatización',
    },
    {
      signal: 'automatización',
      value: 'Diseñar automatización',
    },
  ];

  const matched = ctaCandidates.find((item) =>
    normalizedText.includes(normalizeBuilderText(item.signal))
  );

  return matched?.value || selectionSummary.primaryCTA || 'Solicitar diagnóstico';
};

const buildVisualDelta = ({
  primaryIntent,
  normalizedText,
  selectionSummary,
} = {}) => {
  const palette = resolveRequestedPalette(normalizedText);
  const tone = resolveRequestedTone(normalizedText);

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.PREMIUMIZE) {
    return {
      tone: 'premium',
      direction:
        'Aumentar sensación de valor con más aire, jerarquía sobria, CTA cualificado, contraste elegante y bloques menos genéricos.',
      palette,
      shouldIncreaseWhitespace: true,
      shouldReduceNoise: true,
      shouldStrengthenHero: true,
    };
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.CHANGE_COLOR) {
    return {
      tone,
      direction:
        'Ajustar paleta visual y contraste de CTAs sin romper jerarquía ni legibilidad.',
      palette,
      shouldIncreaseWhitespace: false,
      shouldReduceNoise: false,
      shouldStrengthenHero: false,
    };
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.SIMPLIFY) {
    return {
      tone: 'simple',
      direction:
        'Reducir carga visual, agrupar información, simplificar bloques y dejar más espacio funcional.',
      palette,
      shouldIncreaseWhitespace: true,
      shouldReduceNoise: true,
      shouldStrengthenHero: false,
    };
  }

  return {
    tone,
    direction:
      selectionSummary.operationalFocus
        ? `Ajustar estética al foco operativo: ${selectionSummary.operationalFocus}.`
        : 'Ajustar dirección visual según el contexto detectado por el Hub.',
    palette,
    shouldIncreaseWhitespace: false,
    shouldReduceNoise: false,
    shouldStrengthenHero: true,
  };
};

const buildCopyDelta = ({
  primaryIntent,
  selectionSummary,
} = {}) => {
  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.CLARIFY) {
    return {
      headlineStrategy:
        'Reescribir titular para hacerlo más específico, directo y reconocible.',
      subheadlineStrategy:
        'Reducir abstracción y explicar resultado, público y acción siguiente.',
      bodyStrategy:
        'Convertir textos largos en beneficios concretos y escaneables.',
    };
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.PREMIUMIZE) {
    return {
      headlineStrategy:
        'Elevar el titular hacia autoridad, especificidad y resultado de alto valor.',
      subheadlineStrategy:
        'Explicar el mecanismo o proceso sin sonar genérico.',
      bodyStrategy:
        'Usar lenguaje más selectivo, menos promocional y más orientado a confianza.',
    };
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.INCREASE_CONVERSION) {
    return {
      headlineStrategy:
        'Conectar promesa con dolor, resultado y acción concreta.',
      subheadlineStrategy:
        'Eliminar ambigüedad y reforzar motivo para actuar.',
      bodyStrategy:
        'Reordenar beneficios, prueba y objeciones antes del CTA.',
    };
  }

  return {
    headlineStrategy:
      `Adaptar copy al foco ${selectionSummary.operationalFocus || 'del proyecto'}.`,
    subheadlineStrategy:
      'Mantener claridad entre promesa, público y siguiente acción.',
    bodyStrategy:
      'Evitar texto genérico y usar bloques con función de conversión.',
  };
};

const buildCTADelta = ({
  primaryIntent,
  normalizedText,
  selectionSummary,
} = {}) => {
  const recommendedCTA = resolveRequestedCTA({
    normalizedText,
    selectionSummary,
  });

  return {
    primaryCTA: recommendedCTA,
    secondaryCTA:
      primaryIntent === BUILDER_ITERATION_INTENT_IDS.CHANGE_CTA
        ? 'Ver cómo funciona'
        : selectionSummary.secondaryPlaybooks?.length
          ? 'Ver enfoque recomendado'
          : 'Ver detalles',
    strategy:
      primaryIntent === BUILDER_ITERATION_INTENT_IDS.INCREASE_CONVERSION
        ? 'Hacer el CTA más dominante, específico y coherente con la conversión esperada.'
        : primaryIntent === BUILDER_ITERATION_INTENT_IDS.PREMIUMIZE
          ? 'Usar CTA cualificado, menos genérico y más alineado con valor percibido.'
          : 'Alinear CTA con el objetivo operativo detectado.',
  };
};

const buildStructureDelta = ({
  primaryIntent,
  selectionSummary,
} = {}) => {
  const immediateChanges = selectionSummary.immediateChanges || [];

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.CHANGE_STRUCTURE) {
    return {
      strategy:
        'Reorganizar secciones para que hero, confianza, beneficios y CTA sigan una secuencia de decisión más clara.',
      blocksToPrioritize: immediateChanges.map((item) => item.label).slice(0, 4),
      shouldReorder: true,
    };
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.ADD_TRUST) {
    return {
      strategy:
        'Añadir o reforzar bloques de autoridad, prueba social, proceso, garantías u objeciones.',
      blocksToPrioritize: [
        'Autoridad',
        'Prueba social',
        'Proceso',
        'Objeciones',
      ],
      shouldReorder: true,
    };
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.SIMPLIFY) {
    return {
      strategy:
        'Reducir bloques redundantes y dejar solo secciones con función clara.',
      blocksToPrioritize: [
        'Hero',
        'Beneficios',
        'Confianza',
        'CTA final',
      ],
      shouldReorder: true,
    };
  }

  return {
    strategy:
      immediateChanges[0]?.action ||
      'Ajustar estructura al playbook principal y al objetivo de conversión.',
    blocksToPrioritize: immediateChanges.map((item) => item.label).slice(0, 4),
    shouldReorder: false,
  };
};

const buildTechnicalDelta = ({
  primaryIntent,
  selectionSummary,
} = {}) => {
  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.TECHNICAL_OUTPUT) {
    return {
      shouldExposeCode: true,
      shouldPrepareExport: true,
      shouldMentionDeploy: true,
      strategy:
        'Preparar salida técnica progresiva: estructura, código visible, GitHub/exportación y posible deploy posterior.',
    };
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.AUTOMATION_DETAIL) {
    return {
      shouldExposeCode: false,
      shouldPrepareExport: false,
      shouldMentionDeploy: false,
      strategy:
        'Mapear flujo antes de generar código: entrada, herramientas, condiciones, salida y errores.',
    };
  }

  return {
    shouldExposeCode: false,
    shouldPrepareExport: false,
    shouldMentionDeploy: false,
    strategy:
      `Mantener la salida técnica alineada con ${selectionSummary.operationalFocus || 'el proyecto'}.`,
  };
};

const buildAutomationDelta = ({
  primaryIntent,
} = {}) => {
  if (primaryIntent !== BUILDER_ITERATION_INTENT_IDS.AUTOMATION_DETAIL) {
    return null;
  }

  return {
    trigger: 'pendiente de confirmar',
    tools: 'pendiente de confirmar',
    output: 'pendiente de confirmar',
    exceptionHandling:
      'El flujo debe contemplar errores, datos incompletos y revisión humana.',
    strategy:
      'No construir automatización genérica; primero mapear proceso real y primer flujo accionable.',
  };
};

const resolveActionType = ({
  confidence,
  primaryIntent,
} = {}) => {
  if (confidence === BUILDER_ITERATION_CONFIDENCE.LOW) {
    return BUILDER_ITERATION_ACTION_TYPES.ASK_ONE_QUESTION;
  }

  if (
    primaryIntent === BUILDER_ITERATION_INTENT_IDS.UNKNOWN ||
    primaryIntent === BUILDER_ITERATION_INTENT_IDS.CHANGE_SECTOR_CONTEXT
  ) {
    return BUILDER_ITERATION_ACTION_TYPES.ASK_ONE_QUESTION;
  }

  return BUILDER_ITERATION_ACTION_TYPES.APPLY_DIRECTLY;
};

const buildClarifyingQuestion = ({
  primaryIntent,
  selectionSummary,
} = {}) => {
  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.CHANGE_SECTOR_CONTEXT) {
    return '¿Quieres que adapte toda la estructura al nuevo sector o solo el estilo visual y los CTAs?';
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.AUTOMATION_DETAIL) {
    return '¿Qué evento inicia la automatización y qué herramienta interviene primero?';
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.UNKNOWN) {
    return selectionSummary.firstQuestion ||
      '¿Quieres priorizar diseño, copy, CTA, estructura o conversión?';
  }

  return selectionSummary.firstQuestion ||
    '¿Quieres que aplique esta mejora al hero, a los CTAs o a toda la página?';
};

const buildAppliedChangeSummary = ({
  primaryIntent,
  layers,
  ctaDelta,
  visualDelta,
  structureDelta,
} = {}) => {
  const changes = [];

  if (layers.includes(BUILDER_ITERATION_LAYER_IDS.CTA)) {
    changes.push(`CTA principal orientado a “${ctaDelta.primaryCTA}”`);
  }

  if (layers.includes(BUILDER_ITERATION_LAYER_IDS.VISUAL)) {
    changes.push(`dirección visual ajustada a ${visualDelta.tone}`);
  }

  if (layers.includes(BUILDER_ITERATION_LAYER_IDS.STRUCTURE)) {
    changes.push(structureDelta.strategy);
  }

  if (layers.includes(BUILDER_ITERATION_LAYER_IDS.TRUST)) {
    changes.push('refuerzo de confianza, autoridad u objeciones');
  }

  if (layers.includes(BUILDER_ITERATION_LAYER_IDS.CONVERSION)) {
    changes.push('mejora de jerarquía de conversión');
  }

  if (!changes.length) {
    changes.push(`mejora interpretada como ${primaryIntent}`);
  }

  return changes.slice(0, 4);
};

const buildAgentOperationalResponse = ({
  primaryIntent,
  actionType,
  appliedChangeSummary,
  selectionSummary,
  clarifyingQuestion,
} = {}) => {
  const focus = selectionSummary.operationalFocus || 'el objetivo detectado';

  if (actionType === BUILDER_ITERATION_ACTION_TYPES.ASK_ONE_QUESTION) {
    return [
      `He interpretado la mejora, pero antes de cambiar demasiado necesito cerrar una decisión para no aplicar una plantilla genérica.`,
      `Foco actual: ${focus}.`,
      clarifyingQuestion,
    ].join(' ');
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.PREMIUMIZE) {
    return [
      `Entendido. Voy a elevar la versión sin decorar por decorar.`,
      `Aplicaré más autoridad visual, copy más selectivo, CTA cualificado y mejor jerarquía de confianza.`,
      `Cambios previstos: ${appliedChangeSummary.join('; ')}.`,
    ].join(' ');
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.INCREASE_CONVERSION) {
    return [
      `Entendido. No voy a tocar solo estética.`,
      `Aplicaré una mejora de conversión sobre promesa, CTA, confianza y orden de bloques.`,
      `Cambios previstos: ${appliedChangeSummary.join('; ')}.`,
    ].join(' ');
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.CHANGE_CTA) {
    return [
      `Entendido. Voy a ajustar los CTAs para que la acción principal sea más clara y coherente con el objetivo.`,
      `Cambios previstos: ${appliedChangeSummary.join('; ')}.`,
    ].join(' ');
  }

  if (primaryIntent === BUILDER_ITERATION_INTENT_IDS.AUTOMATION_DETAIL) {
    return [
      `Entendido. Lo trato como ajuste de automatización, no como landing genérica.`,
      `Voy a mapear entrada, herramientas, pasos, salidas y puntos de control.`,
      `Cambios previstos: ${appliedChangeSummary.join('; ')}.`,
    ].join(' ');
  }

  return [
    `Entendido. Clasifico la mejora y la aplico al contexto real del proyecto.`,
    `Foco operativo: ${focus}.`,
    `Cambios previstos: ${appliedChangeSummary.join('; ')}.`,
  ].join(' ');
};

export const interpretBuilderIteration = ({
  message = '',
  project = null,
  currentSelection = null,
  explicitUserLevel = '',
} = {}) => {
  const normalizedText = normalizeBuilderText(message);

  const selection =
    currentSelection ||
    selectBuilderPlaybooks({
      text: message,
      project,
      explicitUserLevel,
    });

  const selectionSummary = getBuilderPlaybookSelectionSummary(selection);

  const intent = resolveBuilderIterationIntent(message);

  const layers = resolveBuilderIterationLayers({
    primaryIntent: intent.primaryIntent,
    secondaryIntents: intent.secondaryIntents,
  });

  const visualDelta = buildVisualDelta({
    primaryIntent: intent.primaryIntent,
    normalizedText,
    selectionSummary,
  });

  const copyDelta = buildCopyDelta({
    primaryIntent: intent.primaryIntent,
    selectionSummary,
  });

  const ctaDelta = buildCTADelta({
    primaryIntent: intent.primaryIntent,
    normalizedText,
    selectionSummary,
  });

  const structureDelta = buildStructureDelta({
    primaryIntent: intent.primaryIntent,
    selectionSummary,
  });

  const technicalDelta = buildTechnicalDelta({
    primaryIntent: intent.primaryIntent,
    selectionSummary,
  });

  const automationDelta = buildAutomationDelta({
    primaryIntent: intent.primaryIntent,
  });

  const actionType = resolveActionType({
    confidence: intent.confidence,
    primaryIntent: intent.primaryIntent,
  });

  const clarifyingQuestion = buildClarifyingQuestion({
    primaryIntent: intent.primaryIntent,
    selectionSummary,
  });

  const appliedChangeSummary = buildAppliedChangeSummary({
    primaryIntent: intent.primaryIntent,
    layers,
    ctaDelta,
    visualDelta,
    structureDelta,
  });

  const agentResponse = buildAgentOperationalResponse({
    primaryIntent: intent.primaryIntent,
    actionType,
    appliedChangeSummary,
    selectionSummary,
    clarifyingQuestion,
  });

  return {
    input: {
      raw: message,
      normalized: normalizedText,
    },

    intent: {
      primary: intent.primaryIntent,
      secondary: intent.secondaryIntents,
      confidence: intent.confidence,
      scores: intent.scores,
    },

    action: {
      type: actionType,
      shouldAskClarification:
        actionType !== BUILDER_ITERATION_ACTION_TYPES.APPLY_DIRECTLY,
      clarifyingQuestion,
    },

    context: {
      selection,
      selectionSummary,
      affectedLayers: layers,
    },

    delta: {
      visual: visualDelta,
      copy: copyDelta,
      cta: ctaDelta,
      structure: structureDelta,
      technical: technicalDelta,
      automation: automationDelta,
    },

    output: {
      appliedChangeSummary,
      agentResponse,
      nextQuestion:
        actionType === BUILDER_ITERATION_ACTION_TYPES.APPLY_DIRECTLY
          ? selectionSummary.firstQuestion
          : clarifyingQuestion,
    },
  };
};

export const getBuilderIterationSummary = (iteration = {}) => ({
  primaryIntent: iteration.intent?.primary || BUILDER_ITERATION_INTENT_IDS.UNKNOWN,
  confidence:
    iteration.intent?.confidence || BUILDER_ITERATION_CONFIDENCE.LOW,
  affectedLayers: iteration.context?.affectedLayers || [],
  actionType:
    iteration.action?.type || BUILDER_ITERATION_ACTION_TYPES.ASK_ONE_QUESTION,
  shouldAskClarification: Boolean(iteration.action?.shouldAskClarification),
  clarifyingQuestion: iteration.action?.clarifyingQuestion || '',
  appliedChangeSummary: iteration.output?.appliedChangeSummary || [],
  agentResponse: iteration.output?.agentResponse || '',
  cta: iteration.delta?.cta?.primaryCTA || '',
  visualTone: iteration.delta?.visual?.tone || '',
  operationalFocus:
    iteration.context?.selectionSummary?.operationalFocus || '',
});