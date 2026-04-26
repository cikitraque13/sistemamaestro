export const BUILDER_ROUTE_LABELS = {
  idea: 'Idea a proyecto',
  improve: 'Mejora existente',
  sell: 'Venta y cobro',
  automate: 'Automatización',
  improve_existing: 'Mejora existente',
  sell_and_charge: 'Venta y cobro',
  automate_operation: 'Automatización',
  idea_to_project: 'Idea a proyecto',
};

const URL_PATTERN = /https?:\/\/[^\s]+|www\.[^\s]+/i;

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const includesAny = (text, terms) => terms.some((term) => text.includes(term));

export const getText = (value, fallback = '') => {
  if (typeof value === 'string' && value.trim()) return value.trim();

  return fallback;
};

export const getArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export const getDiagnosis = (project) => project?.diagnosis || {};

export const getCoreDiagnosis = (project) => getDiagnosis(project)?.core_diagnosis || {};

export const getExecutiveSummary = (project) => getDiagnosis(project)?.executive_summary || {};

export const isUrlInput = (project, initialPrompt = '') => {
  const inputType = String(project?.input_type || '').toLowerCase();
  const text = String(project?.input_content || initialPrompt || '').trim();

  return inputType === 'url' || URL_PATTERN.test(text);
};

export const extractUrl = (project, initialPrompt = '') => {
  const text = String(project?.input_content || initialPrompt || '').trim();
  const match = text.match(URL_PATTERN);

  return match ? match[0] : 'web actual';
};

export const isSistemaMaestroProject = (project, initialPrompt = '') => {
  const text = normalizeText(
    [
      project?.input_content,
      project?.diagnosis?.summary,
      project?.blueprint?.title,
      initialPrompt,
    ]
      .filter(Boolean)
      .join(' ')
  );

  return text.includes('sistema maestro');
};

export const isGptHubProject = (project, initialPrompt = '') => {
  const text = normalizeText(
    [
      project?.input_content,
      project?.diagnosis?.summary,
      project?.blueprint?.title,
      initialPrompt,
    ]
      .filter(Boolean)
      .join(' ')
  );

  return includesAny(text, [
    'gpts personalizados',
    'gpt personalizado',
    'landing de gpts',
    'hub de gpts',
    'tarjetas gpt',
    'cifragpt',
  ]);
};

export const resolveDirection = (value = '') => {
  const text = normalizeText(value);

  if (includesAny(text, ['premium', 'elegante', 'sofisticado'])) return 'premium';
  if (includesAny(text, ['convers', 'vender', 'ventas', 'captar'])) return 'conversion';
  if (includesAny(text, ['claridad', 'claro', 'limpio'])) return 'clarity';
  if (includesAny(text, ['reserva', 'reservas'])) return 'reservations';
  if (includesAny(text, ['whatsapp', 'wasap'])) return 'whatsapp';
  if (includesAny(text, ['llamada', 'llamar', 'telefono', 'teléfono'])) return 'calls';

  return 'balanced';
};

export const buildRuntimeMode = (project, initialPrompt = '') => {
  return isUrlInput(project, initialPrompt) ? 'transform' : 'create';
};

const buildTransformCopy = ({ project, initialPrompt, direction }) => {
  const diagnosis = getDiagnosis(project);
  const core = getCoreDiagnosis(project);
  const url = extractUrl(project, initialPrompt);

  const intentMap = {
    reservations: {
      primaryCta: 'Reservar ahora',
      headline: 'Convierte más visitas en reservas con una web más clara y directa.',
    },
    whatsapp: {
      primaryCta: 'Escribir por WhatsApp',
      headline: 'Haz que cada visita encuentre rápido cómo contactar contigo.',
    },
    calls: {
      primaryCta: 'Llamar ahora',
      headline: 'Transforma tu web en una vía clara hacia llamadas y clientes reales.',
    },
    premium: {
      primaryCta: 'Ver propuesta premium',
      headline: 'Eleva tu web con una versión más sólida, elegante y orientada a confianza.',
    },
    conversion: {
      primaryCta: 'Aplicar mejora',
      headline: 'Reordena tu web para convertir mejor desde el primer impacto.',
    },
    clarity: {
      primaryCta: 'Ver versión clara',
      headline: 'Haz que tu web explique mejor qué ofreces y qué debe hacer el usuario.',
    },
    balanced: {
      primaryCta: 'Aplicar rediseño',
      headline: 'Tu web puede convertirse en una versión más clara, directa y orientada a conversión.',
    },
  };

  const selected = intentMap[direction] || intentMap.balanced;

  return {
    mode: 'transform',
    direction,
    templateType: 'website_transformation',
    eyebrow: 'Rediseño asistido',
    originalLabel: url,
    headline: selected.headline,
    subheadline:
      diagnosis?.summary ||
      'Sistema Maestro analiza la página existente, detecta fricción comercial y prepara una versión mejorada para iterar.',
    primaryCta: selected.primaryCta,
    secondaryCta: 'Ver cambios sugeridos',
    sectionTitle: core?.main_finding || 'Primera mejora: claridad, jerarquía y llamada a la acción',
    sectionText:
      core?.main_leverage ||
      diagnosis?.opportunity ||
      'La reconstrucción prioriza hero, propuesta de valor, confianza, CTA visible y estructura comercial simple.',
    cards: [
      {
        title: 'Antes',
        text: 'Mensaje disperso, CTA débil o estructura poco orientada a acción.',
      },
      {
        title: 'Después',
        text: 'Nueva versión con promesa clara, bloques ordenados y acción principal.',
      },
      {
        title: 'Salida',
        text: 'Iterar diseño, cambiar fotos, preparar deploy o exportar.',
      },
    ],
  };
};

const buildSistemaMaestroCopy = ({ direction }) => {
  const ctaMap = {
    premium: 'Entrar en Sistema Maestro',
    conversion: 'Crear mi primer proyecto',
    clarity: 'Ver cómo funciona',
    balanced: 'Crear mi primer proyecto',
  };

  return {
    mode: 'create',
    direction,
    templateType: 'generic_landing',
    eyebrow: 'Sistema Maestro',
    originalLabel: 'Proyecto nuevo',
    headline: 'Convierte una idea o una URL en un sistema digital listo para avanzar.',
    subheadline:
      'Analiza, estructura y prepara proyectos digitales con IA para reducir improvisación, acelerar decisiones y mejorar conversión.',
    primaryCta: ctaMap[direction] || ctaMap.balanced,
    secondaryCta: 'Analizar una URL',
    sectionTitle: 'Un sistema para pasar de intención a ejecución',
    sectionText:
      'Estrategia, arquitectura, conversión, diseño, automatización y salida técnica conectadas en una experiencia continua.',
    cards: [
      {
        title: 'Analiza',
        text: 'Convierte una URL o idea en diagnóstico estructural.',
      },
      {
        title: 'Construye',
        text: 'Activa Builder con preview, código y continuidad.',
      },
      {
        title: 'Escala',
        text: 'Itera con créditos, salida técnica y deploy.',
      },
    ],
  };
};

const buildGptHubCopy = ({ direction }) => {
  const ctaMap = {
    premium: 'Abrir GPT recomendado',
    conversion: 'Crear mi propio hub IA',
    clarity: 'Ver todos los GPTs',
    balanced: 'Abrir GPT recomendado',
  };

  return {
    mode: 'create',
    direction,
    templateType: 'gpt_hub_landing',
    eyebrow: 'Hub de GPTs',
    originalLabel: 'Landing de GPTs personalizados',
    headline: 'Un hub de GPTs especializados para resolver tareas concretas con IA.',
    subheadline:
      'Agrupa asistentes configurados por caso de uso, ayuda al usuario a elegir el GPT correcto y abre continuidad hacia Sistema Maestro.',
    primaryCta: ctaMap[direction] || ctaMap.balanced,
    secondaryCta: 'Ver todos los GPTs',
    sectionTitle: 'Cada GPT debe resolver una necesidad clara',
    sectionText:
      'El objetivo no es mostrar muchas tarjetas iguales, sino orientar al usuario hacia la herramienta correcta y mantener una salida hacia el Builder.',
    cards: [
      {
        title: 'CifraGPT',
        text: 'Lectura de números, métricas y análisis financiero básico.',
      },
      {
        title: 'SEO GPT',
        text: 'Estructura semántica, contenidos y captación orgánica.',
      },
      {
        title: 'CRO GPT',
        text: 'Mejoras de conversión, CTAs y jerarquía visual.',
      },
    ],
  };
};

const buildGenericCopy = ({ project, initialPrompt, direction }) => {
  const diagnosis = getDiagnosis(project);
  const executive = getExecutiveSummary(project);
  const core = getCoreDiagnosis(project);
  const blueprint = project?.blueprint;

  return {
    mode: 'create',
    direction,
    templateType: 'generic_landing',
    eyebrow: BUILDER_ROUTE_LABELS[project?.route] || 'Builder',
    originalLabel: 'Proyecto nuevo',
    headline:
      blueprint?.title ||
      executive?.bottom_line ||
      diagnosis?.summary ||
      'Primera versión preparada para construir.',
    subheadline:
      blueprint?.summary ||
      executive?.understanding ||
      diagnosis?.understanding ||
      project?.input_content ||
      initialPrompt ||
      'El sistema transforma la entrada inicial en una estructura visual lista para iterar.',
    primaryCta: project?.plan_recommendation?.cta_label || 'Continuar construcción',
    secondaryCta: 'Revisar estructura',
    sectionTitle: core?.main_finding || 'Base estructural preparada',
    sectionText:
      core?.main_leverage ||
      diagnosis?.opportunity ||
      'Builder organiza promesa, bloques, CTA y continuidad antes de pasar a salida técnica.',
    cards: [
      {
        title: 'Promesa',
        text: 'Mensaje principal definido para orientar el primer impacto.',
      },
      {
        title: 'Conversión',
        text: 'CTA y recorrido preparados para reducir fricción.',
      },
      {
        title: 'Salida',
        text: 'Base lista para iterar, generar archivos y preparar deploy.',
      },
    ],
  };
};

export const buildLandingCopy = (project, initialPrompt = '', direction = 'balanced') => {
  const mode = buildRuntimeMode(project, initialPrompt);

  if (mode === 'transform') {
    return buildTransformCopy({
      project,
      initialPrompt,
      direction,
    });
  }

  if (isGptHubProject(project, initialPrompt)) {
    return buildGptHubCopy({
      direction,
    });
  }

  if (isSistemaMaestroProject(project, initialPrompt)) {
    return buildSistemaMaestroCopy({
      direction,
    });
  }

  return buildGenericCopy({
    project,
    initialPrompt,
    direction,
  });
};

export default buildLandingCopy;