export const BUILDER_PROJECT_TYPE_IDS = {
  COMMERCIAL_LANDING: 'commercial_landing',
  SERVICE_WEBSITE: 'service_website',
  BOOKING_WEBSITE: 'booking_website',
  LOCAL_SERVICE_QUOTE: 'local_service_quote',
  RETAIL_CATALOG: 'retail_catalog',
  AFFILIATE_CONTENT: 'affiliate_content',
  SAAS_APP: 'saas_app',
  INTERNAL_TOOL: 'internal_tool',
  AUTOMATION_SYSTEM: 'automation_system',
  COMMUNITY_MEMBERSHIP: 'community_membership',
  PORTFOLIO_BRAND: 'portfolio_brand',
  UNKNOWN: 'unknown',
};

export const BUILDER_LIFECYCLE_STAGE_IDS = {
  UNDERSTANDING: 'understanding',
  BASE_BUILD: 'base_build',
  CONVERSION: 'conversion',
  TRUST: 'trust',
  OFFER: 'offer',
  BRAND: 'brand',
  TECHNICAL_EXIT: 'technical_exit',
};

export const BUILDER_READINESS_LIMITS = {
  MIN: 0,
  UNDERSTOOD: 20,
  BASE_PREVIEW_READY: 40,
  CONVERSION_READY: 55,
  TRUST_READY: 70,
  OFFER_READY: 82,
  BRAND_READY: 92,
  TECHNICAL_EXIT_ALLOWED: 92,
  MAX: 100,
};

export const BUILDER_LIFECYCLE_STAGES = [
  {
    id: BUILDER_LIFECYCLE_STAGE_IDS.UNDERSTANDING,
    label: 'Proyecto entendido',
    range: [0, 20],
    objective:
      'Clasificar tipo de proyecto, sector, objetivo comercial, CTA principal y salida esperada.',
    userPromise:
      'Entiendo que quieres construir y preparo la primera version visible.',
    visibleOutcome: [
      'tipo de proyecto',
      'sector',
      'objetivo',
      'CTA principal',
      'primera estructura',
    ],
  },
  {
    id: BUILDER_LIFECYCLE_STAGE_IDS.BASE_BUILD,
    label: 'Primera version construida',
    range: [21, 40],
    objective:
      'Construir preview inicial con hero, propuesta, secciones, CTA, formulario y confianza basica.',
    userPromise:
      'Ya tienes una primera version visible sobre la que podemos mejorar.',
    visibleOutcome: [
      'hero',
      'secciones principales',
      'CTA',
      'formulario o accion',
      'confianza basica',
    ],
  },
  {
    id: BUILDER_LIFECYCLE_STAGE_IDS.CONVERSION,
    label: 'Conversion configurada',
    range: [41, 55],
    objective:
      'Configurar CTA principal, formulario, WhatsApp, reserva, presupuesto, pedido, demo o recomendacion.',
    userPromise:
      'Hago que la web tenga una accion clara para convertir visitas en oportunidades.',
    visibleOutcome: [
      'CTA configurado',
      'formulario sectorial',
      'WhatsApp o canal principal',
      'mensaje de confirmacion',
    ],
  },
  {
    id: BUILDER_LIFECYCLE_STAGE_IDS.TRUST,
    label: 'Confianza reforzada',
    range: [56, 70],
    objective:
      'Anadir FAQ, garantias, resenas, objeciones resueltas, prueba social y senales de autoridad.',
    userPromise:
      'Refuerzo la confianza para que el visitante se sienta seguro antes de actuar.',
    visibleOutcome: [
      'FAQ',
      'garantias',
      'prueba social',
      'objeciones resueltas',
      'senales de autoridad',
    ],
  },
  {
    id: BUILDER_LIFECYCLE_STAGE_IDS.OFFER,
    label: 'Oferta profundizada',
    range: [71, 82],
    objective:
      'Aterrizar servicios, productos, packs, planes, categorias, comparativas o beneficios especificos.',
    userPromise:
      'Hago que la oferta parezca mas concreta, vendible y adaptada al negocio.',
    visibleOutcome: [
      'servicios concretos',
      'productos destacados',
      'packs o planes',
      'beneficios especificos',
    ],
  },
  {
    id: BUILDER_LIFECYCLE_STAGE_IDS.BRAND,
    label: 'Marca personalizada',
    range: [83, 92],
    objective:
      'Personalizar logo, colores, tono, claim, ubicacion, horarios, bloque local y percepcion de marca.',
    userPromise:
      'Hago que deje de parecer una plantilla y empiece a parecer una marca real.',
    visibleOutcome: [
      'logo o marca provisional',
      'colores',
      'claim',
      'ubicacion',
      'tono visual',
      'preview ampliada',
    ],
  },
  {
    id: BUILDER_LIFECYCLE_STAGE_IDS.TECHNICAL_EXIT,
    label: 'Salida tecnica',
    range: [93, 100],
    objective:
      'Preparar estructura final, codigo coherente, exportacion, GitHub, deploy, dominio o backend si procede.',
    userPromise:
      'Preparo la salida tecnica cuando el proyecto ya esta maduro.',
    visibleOutcome: [
      'estructura final',
      'codigo coherente',
      'exportacion',
      'GitHub',
      'deploy',
      'dominio',
    ],
  },
];

export const TECHNICAL_PROJECT_TYPES = [
  BUILDER_PROJECT_TYPE_IDS.SAAS_APP,
  BUILDER_PROJECT_TYPE_IDS.INTERNAL_TOOL,
  BUILDER_PROJECT_TYPE_IDS.AUTOMATION_SYSTEM,
  BUILDER_PROJECT_TYPE_IDS.COMMUNITY_MEMBERSHIP,
];

export const SIMPLE_PROJECT_TYPES = [
  BUILDER_PROJECT_TYPE_IDS.COMMERCIAL_LANDING,
  BUILDER_PROJECT_TYPE_IDS.SERVICE_WEBSITE,
  BUILDER_PROJECT_TYPE_IDS.BOOKING_WEBSITE,
  BUILDER_PROJECT_TYPE_IDS.LOCAL_SERVICE_QUOTE,
  BUILDER_PROJECT_TYPE_IDS.RETAIL_CATALOG,
  BUILDER_PROJECT_TYPE_IDS.AFFILIATE_CONTENT,
  BUILDER_PROJECT_TYPE_IDS.PORTFOLIO_BRAND,
];

export const PROJECT_TYPE_LABELS = {
  [BUILDER_PROJECT_TYPE_IDS.COMMERCIAL_LANDING]: 'Landing comercial',
  [BUILDER_PROJECT_TYPE_IDS.SERVICE_WEBSITE]: 'Web de servicios',
  [BUILDER_PROJECT_TYPE_IDS.BOOKING_WEBSITE]: 'Web de reservas',
  [BUILDER_PROJECT_TYPE_IDS.LOCAL_SERVICE_QUOTE]: 'Servicio con presupuesto',
  [BUILDER_PROJECT_TYPE_IDS.RETAIL_CATALOG]: 'Tienda o catalogo',
  [BUILDER_PROJECT_TYPE_IDS.AFFILIATE_CONTENT]: 'Afiliados o contenido',
  [BUILDER_PROJECT_TYPE_IDS.SAAS_APP]: 'SaaS o app',
  [BUILDER_PROJECT_TYPE_IDS.INTERNAL_TOOL]: 'Herramienta interna',
  [BUILDER_PROJECT_TYPE_IDS.AUTOMATION_SYSTEM]: 'Sistema automatizado',
  [BUILDER_PROJECT_TYPE_IDS.COMMUNITY_MEMBERSHIP]: 'Comunidad o membresia',
  [BUILDER_PROJECT_TYPE_IDS.PORTFOLIO_BRAND]: 'Portfolio o marca personal',
  [BUILDER_PROJECT_TYPE_IDS.UNKNOWN]: 'Proyecto web',
};

export const clampReadinessScore = (score = 0) =>
  Math.max(
    BUILDER_READINESS_LIMITS.MIN,
    Math.min(BUILDER_READINESS_LIMITS.MAX, Number(score) || 0)
  );

export const getBuilderLifecycleStageByScore = (score = 0) => {
  const safeScore = clampReadinessScore(score);

  return (
    BUILDER_LIFECYCLE_STAGES.find((stage) => {
      const [min, max] = stage.range;
      return safeScore >= min && safeScore <= max;
    }) || BUILDER_LIFECYCLE_STAGES[0]
  );
};

export const getBuilderLifecycleStage = (stageId) =>
  BUILDER_LIFECYCLE_STAGES.find((stage) => stage.id === stageId) ||
  BUILDER_LIFECYCLE_STAGES[0];

export const getNextBuilderLifecycleStage = (stageId) => {
  const index = BUILDER_LIFECYCLE_STAGES.findIndex(
    (stage) => stage.id === stageId
  );

  if (index < 0) return BUILDER_LIFECYCLE_STAGES[0];

  return (
    BUILDER_LIFECYCLE_STAGES[index + 1] ||
    BUILDER_LIFECYCLE_STAGES[BUILDER_LIFECYCLE_STAGES.length - 1]
  );
};

export const getProjectTypeLabel = (projectType) =>
  PROJECT_TYPE_LABELS[projectType] || PROJECT_TYPE_LABELS[BUILDER_PROJECT_TYPE_IDS.UNKNOWN];

export const isTechnicalProjectType = (projectType) =>
  TECHNICAL_PROJECT_TYPES.includes(projectType);

export const isSimpleProjectType = (projectType) =>
  SIMPLE_PROJECT_TYPES.includes(projectType);

export const canEnterTechnicalExit = ({
  readinessScore = 0,
  projectType = BUILDER_PROJECT_TYPE_IDS.UNKNOWN,
  explicitTechnicalIntent = false,
} = {}) =>
  readinessScore >= BUILDER_READINESS_LIMITS.TECHNICAL_EXIT_ALLOWED ||
  explicitTechnicalIntent ||
  isTechnicalProjectType(projectType);

const normalizeProjectText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const inferProjectTypeFromContext = ({
  contextText = '',
  sectorProfileId = '',
} = {}) => {
  const text = normalizeProjectText(contextText);

  if (
    sectorProfileId === 'digital_product_or_saas' ||
    /\b(saas|software|app|aplicacion|herramienta|plataforma|demo|onboarding)\b/.test(text)
  ) {
    return BUILDER_PROJECT_TYPE_IDS.SAAS_APP;
  }

  if (
    sectorProfileId === 'automation_service' ||
    /\b(automatizacion|workflow|crm|make|zapier|proceso interno|flujo operativo)\b/.test(text)
  ) {
    return BUILDER_PROJECT_TYPE_IDS.AUTOMATION_SYSTEM;
  }

  if (/\b(dashboard|panel interno|backoffice|operaciones internas)\b/.test(text)) {
    return BUILDER_PROJECT_TYPE_IDS.INTERNAL_TOOL;
  }

  if (/\b(comunidad|membresia|miembros|suscriptores|newsletter privada)\b/.test(text)) {
    return BUILDER_PROJECT_TYPE_IDS.COMMUNITY_MEMBERSHIP;
  }

  if (sectorProfileId === 'affiliate_content') {
    return BUILDER_PROJECT_TYPE_IDS.AFFILIATE_CONTENT;
  }

  if (sectorProfileId === 'retail_local_shop') {
    return BUILDER_PROJECT_TYPE_IDS.RETAIL_CATALOG;
  }

  if (
    sectorProfileId === 'hospitality_booking' ||
    sectorProfileId === 'fitness_membership' ||
    sectorProfileId === 'health_clinic'
  ) {
    return BUILDER_PROJECT_TYPE_IDS.BOOKING_WEBSITE;
  }

  if (sectorProfileId === 'local_service_quote') {
    return BUILDER_PROJECT_TYPE_IDS.LOCAL_SERVICE_QUOTE;
  }

  if (sectorProfileId === 'professional_services') {
    return BUILDER_PROJECT_TYPE_IDS.SERVICE_WEBSITE;
  }

  if (/\b(portfolio|marca personal|curriculum|cv|freelance personal)\b/.test(text)) {
    return BUILDER_PROJECT_TYPE_IDS.PORTFOLIO_BRAND;
  }

  if (/\b(web|landing|negocio|servicio|clientes|captar|vender|reservar|contacto)\b/.test(text)) {
    return BUILDER_PROJECT_TYPE_IDS.COMMERCIAL_LANDING;
  }

  return BUILDER_PROJECT_TYPE_IDS.UNKNOWN;
};