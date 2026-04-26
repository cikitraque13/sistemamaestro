import {
  resolveBuilderPlaybookContext,
  normalizeBuilderText,
} from '../playbooks';

export const BUILDER_INPUT_NATURES = Object.freeze({
  IDEA: 'idea',
  URL: 'url',
  IMPROVEMENT: 'improvement',
  AUTOMATION: 'automation',
  CONTENT: 'content',
  UNKNOWN: 'unknown',
});

export const BUILDER_PROJECT_CATEGORIES = Object.freeze({
  WEB: 'web',
  LANDING: 'landing',
  LOCAL_BUSINESS: 'local_business',
  PROFESSIONAL_SERVICE: 'professional_service',
  COMMERCE: 'commerce',
  EDUCATION: 'education',
  SAAS_AI_TOOL: 'saas_ai_tool',
  AUTOMATION: 'automation',
  CONTENT: 'content',
  ASSISTANT_HUB: 'assistant_hub',
  UNKNOWN: 'unknown',
});

export const BUILDER_PROJECT_TYPES = Object.freeze({
  CONVERSION_LANDING: 'conversion_landing',
  BUSINESS_WEBSITE: 'business_website',
  SERVICE_PAGE: 'service_page',
  HIGH_TICKET_PAGE: 'high_ticket_page',
  LOCAL_RESERVATION_PAGE: 'local_reservation_page',
  PRODUCT_PAGE: 'product_page',
  ECOMMERCE_SITE: 'ecommerce_site',
  EDUCATION_LANDING: 'education_landing',
  SAAS_LANDING: 'saas_landing',
  AI_TOOL: 'ai_tool',
  AUTOMATION_WORKFLOW: 'automation_workflow',
  CONTENT_HUB: 'content_hub',
  GPT_HUB: 'gpt_hub',
  URL_REDESIGN: 'url_redesign',
  UNKNOWN: 'unknown',
});

export const BUILDER_BUSINESS_MODELS = Object.freeze({
  LEAD_GENERATION: 'lead_generation',
  HIGH_TICKET: 'high_ticket',
  LOCAL_SERVICE: 'local_service',
  RESERVATION: 'reservation',
  ECOMMERCE: 'ecommerce',
  SUBSCRIPTION: 'subscription',
  FREEMIUM: 'freemium',
  CREDITS: 'credits',
  EDUCATION_SALE: 'education_sale',
  CONTENT_MEMBERSHIP: 'content_membership',
  AUTOMATION_SERVICE: 'automation_service',
  UNKNOWN: 'unknown',
});

export const BUILDER_PRIMARY_GOALS = Object.freeze({
  CAPTURE_LEADS: 'capture_leads',
  QUALIFY_LEADS: 'qualify_leads',
  SELL_PRODUCT: 'sell_product',
  SELL_SERVICE: 'sell_service',
  BOOK_RESERVATION: 'book_reservation',
  BOOK_CALL: 'book_call',
  REQUEST_DIAGNOSIS: 'request_diagnosis',
  ACTIVATE_REGISTRATION: 'activate_registration',
  VALIDATE_IDEA: 'validate_idea',
  AUTOMATE_PROCESS: 'automate_process',
  EDUCATE_AUDIENCE: 'educate_audience',
  BUILD_AUTHORITY: 'build_authority',
  UNKNOWN: 'unknown',
});

export const BUILDER_COMPLEXITY_LEVELS = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  SYSTEM: 'system',
});

const URL_PATTERN = /(https?:\/\/|www\.)[^\s]+/i;

const KEYWORD_GROUPS = Object.freeze({
  url: [
    'http://',
    'https://',
    'www.',
    '.com',
    '.es',
    '.net',
    '.org',
    'url',
    'web actual',
    'mi web',
    'rediseñar',
    'redisenar',
    'mejorar mi web',
  ],

  landing: [
    'landing',
    'landing page',
    'pagina de venta',
    'página de venta',
    'captar leads',
    'captacion',
    'captación',
    'cta',
    'conversion',
    'conversión',
    'diagnostico',
    'diagnóstico',
    'lista de espera',
  ],

  highTicket: [
    'alto ticket',
    'high ticket',
    'premium',
    'servicio caro',
    'diagnostico inicial',
    'diagnóstico inicial',
    'llamada estrategica',
    'llamada estratégica',
    'consultoria',
    'consultoría',
    'programa premium',
    'aplicar',
  ],

  localBusiness: [
    'negocio local',
    'restaurante',
    'bar',
    'cafeteria',
    'cafetería',
    'peluqueria',
    'peluquería',
    'clinica',
    'clínica',
    'gimnasio',
    'taller',
    'tienda fisica',
    'tienda física',
    'reservas',
    'whatsapp',
    'pedir cita',
    'cómo llegar',
    'como llegar',
  ],

  professionalService: [
    'abogado',
    'abogada',
    'gestoria',
    'gestoría',
    'asesoria',
    'asesoría',
    'consultor',
    'asesor',
    'despacho',
    'arquitecto',
    'terapeuta',
    'coach',
    'agencia',
    'servicio profesional',
    'consulta',
  ],

  commerce: [
    'ecommerce',
    'tienda online',
    'tienda',
    'producto',
    'productos',
    'catalogo',
    'catálogo',
    'carrito',
    'checkout',
    'comprar',
    'venta online',
    'ficha de producto',
  ],

  education: [
    'curso',
    'formacion',
    'formación',
    'escuela',
    'academia',
    'masterclass',
    'mentoria',
    'mentoría',
    'alumnos',
    'lms',
    'programa educativo',
    'comunidad educativa',
  ],

  saasAi: [
    'saas',
    'app',
    'aplicacion',
    'aplicación',
    'software',
    'herramienta',
    'herramienta ia',
    'dashboard',
    'plataforma',
    'creditos',
    'créditos',
    'analizador',
    'generador',
    'builder',
    'inteligencia artificial',
    'ia',
  ],

  automation: [
    'automatizar',
    'automatizacion',
    'automatización',
    'workflow',
    'flujo',
    'crm',
    'make',
    'zapier',
    'webhook',
    'emails',
    'oficina',
    'facturas',
    'procesos',
    'tareas',
  ],

  content: [
    'blog',
    'newsletter',
    'contenido',
    'podcast',
    'comunidad',
    'membresia',
    'membresía',
    'marca personal',
    'recursos',
    'biblioteca',
    'seo',
    'cluster',
    'brief',
  ],

  assistantHub: [
    'gpt hub',
    'gpts',
    'gpt personalizados',
    'asistentes',
    'hub de asistentes',
    'herramientas ia',
    'biblioteca ia',
    'landing de gpts',
    'agentes',
  ],

  improvement: [
    'mejora',
    'mejorar',
    'cambia',
    'cambiar',
    'hazlo mas',
    'hazlo más',
    'optimiza',
    'optimizar',
    'sube',
    'eleva',
    'más premium',
    'mas premium',
    'más conversión',
    'mas conversion',
    'más claro',
    'mas claro',
  ],
});

const GOAL_KEYWORDS = Object.freeze({
  [BUILDER_PRIMARY_GOALS.CAPTURE_LEADS]: [
    'captar leads',
    'lead',
    'leads',
    'registro',
    'formulario',
    'contacto',
    'captacion',
    'captación',
  ],
  [BUILDER_PRIMARY_GOALS.QUALIFY_LEADS]: [
    'cualificar',
    'filtrar',
    'lead cualificado',
    'diagnostico',
    'diagnóstico',
    'evaluar mi caso',
    'aplicar',
  ],
  [BUILDER_PRIMARY_GOALS.SELL_PRODUCT]: [
    'comprar',
    'venta',
    'vender producto',
    'carrito',
    'checkout',
    'producto',
  ],
  [BUILDER_PRIMARY_GOALS.SELL_SERVICE]: [
    'vender servicio',
    'servicio profesional',
    'consultoria',
    'consultoría',
    'asesoria',
    'asesoría',
  ],
  [BUILDER_PRIMARY_GOALS.BOOK_RESERVATION]: [
    'reservar',
    'reserva',
    'reservas',
    'mesa',
    'pedir cita',
    'cita',
  ],
  [BUILDER_PRIMARY_GOALS.BOOK_CALL]: [
    'llamada',
    'reservar llamada',
    'agendar llamada',
    'call',
    'reunion',
    'reunión',
  ],
  [BUILDER_PRIMARY_GOALS.REQUEST_DIAGNOSIS]: [
    'diagnostico',
    'diagnóstico',
    'evaluacion',
    'evaluación',
    'analizar mi caso',
    'solicitar diagnostico',
    'solicitar diagnóstico',
  ],
  [BUILDER_PRIMARY_GOALS.ACTIVATE_REGISTRATION]: [
    'registro',
    'crear cuenta',
    'probar gratis',
    'demo',
    'trial',
    'empezar proyecto',
  ],
  [BUILDER_PRIMARY_GOALS.VALIDATE_IDEA]: [
    'validar idea',
    'validacion',
    'validación',
    'mvp',
    'preventa',
    'lista de espera',
  ],
  [BUILDER_PRIMARY_GOALS.AUTOMATE_PROCESS]: [
    'automatizar',
    'automatizacion',
    'automatización',
    'workflow',
    'flujo',
    'crm',
    'oficina',
  ],
  [BUILDER_PRIMARY_GOALS.EDUCATE_AUDIENCE]: [
    'educar',
    'formacion',
    'formación',
    'curso',
    'escuela',
    'alumnos',
    'contenido educativo',
  ],
  [BUILDER_PRIMARY_GOALS.BUILD_AUTHORITY]: [
    'autoridad',
    'marca personal',
    'confianza',
    'experto',
    'posicionamiento',
    'seo',
  ],
});

const scoreKeywordGroup = (normalizedText = '', keywords = []) =>
  keywords.reduce((score, keyword) => {
    const normalizedKeyword = normalizeBuilderText(keyword);

    if (!normalizedKeyword) return score;

    return normalizedText.includes(normalizedKeyword) ? score + 1 : score;
  }, 0);

const scoreAllGroups = (normalizedText = '') =>
  Object.entries(KEYWORD_GROUPS).reduce((acc, [group, keywords]) => {
    acc[group] = scoreKeywordGroup(normalizedText, keywords);
    return acc;
  }, {});

const getBestScoredKey = ({
  scores = {},
  fallback = '',
  priority = [],
} = {}) => {
  const matches = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];

      const aIndex = priority.indexOf(a[0]);
      const bIndex = priority.indexOf(b[0]);

      return (
        (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
        (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex)
      );
    });

  return matches[0]?.[0] || fallback;
};

export const detectBuilderInputNature = (text = '') => {
  const normalizedText = normalizeBuilderText(text);

  if (!normalizedText) return BUILDER_INPUT_NATURES.UNKNOWN;
  if (URL_PATTERN.test(text) || scoreKeywordGroup(normalizedText, KEYWORD_GROUPS.url) > 0) {
    return BUILDER_INPUT_NATURES.URL;
  }
  if (scoreKeywordGroup(normalizedText, KEYWORD_GROUPS.automation) > 0) {
    return BUILDER_INPUT_NATURES.AUTOMATION;
  }
  if (scoreKeywordGroup(normalizedText, KEYWORD_GROUPS.content) > 0) {
    return BUILDER_INPUT_NATURES.CONTENT;
  }
  if (scoreKeywordGroup(normalizedText, KEYWORD_GROUPS.improvement) > 0) {
    return BUILDER_INPUT_NATURES.IMPROVEMENT;
  }

  return BUILDER_INPUT_NATURES.IDEA;
};

export const detectBuilderProjectCategory = (text = '') => {
  const normalizedText = normalizeBuilderText(text);
  const scores = scoreAllGroups(normalizedText);

  const group = getBestScoredKey({
    scores: {
      localBusiness: scores.localBusiness,
      professionalService: scores.professionalService,
      commerce: scores.commerce,
      education: scores.education,
      saasAi: scores.saasAi,
      automation: scores.automation,
      content: scores.content,
      assistantHub: scores.assistantHub,
      landing: scores.landing,
    },
    fallback: 'landing',
    priority: [
      'assistantHub',
      'automation',
      'localBusiness',
      'professionalService',
      'commerce',
      'education',
      'saasAi',
      'content',
      'landing',
    ],
  });

  const map = {
    localBusiness: BUILDER_PROJECT_CATEGORIES.LOCAL_BUSINESS,
    professionalService: BUILDER_PROJECT_CATEGORIES.PROFESSIONAL_SERVICE,
    commerce: BUILDER_PROJECT_CATEGORIES.COMMERCE,
    education: BUILDER_PROJECT_CATEGORIES.EDUCATION,
    saasAi: BUILDER_PROJECT_CATEGORIES.SAAS_AI_TOOL,
    automation: BUILDER_PROJECT_CATEGORIES.AUTOMATION,
    content: BUILDER_PROJECT_CATEGORIES.CONTENT,
    assistantHub: BUILDER_PROJECT_CATEGORIES.ASSISTANT_HUB,
    landing: BUILDER_PROJECT_CATEGORIES.LANDING,
  };

  return map[group] || BUILDER_PROJECT_CATEGORIES.UNKNOWN;
};

export const detectBuilderProjectType = ({
  text = '',
  inputNature = BUILDER_INPUT_NATURES.UNKNOWN,
  category = BUILDER_PROJECT_CATEGORIES.UNKNOWN,
} = {}) => {
  const normalizedText = normalizeBuilderText(text);
  const scores = scoreAllGroups(normalizedText);

  if (inputNature === BUILDER_INPUT_NATURES.URL) {
    return BUILDER_PROJECT_TYPES.URL_REDESIGN;
  }

  if (scores.assistantHub > 0) {
    return BUILDER_PROJECT_TYPES.GPT_HUB;
  }

  if (scores.automation > 0 || category === BUILDER_PROJECT_CATEGORIES.AUTOMATION) {
    return BUILDER_PROJECT_TYPES.AUTOMATION_WORKFLOW;
  }

  if (scores.highTicket > 0) {
    return BUILDER_PROJECT_TYPES.HIGH_TICKET_PAGE;
  }

  if (category === BUILDER_PROJECT_CATEGORIES.LOCAL_BUSINESS) {
    return BUILDER_PROJECT_TYPES.LOCAL_RESERVATION_PAGE;
  }

  if (category === BUILDER_PROJECT_CATEGORIES.PROFESSIONAL_SERVICE) {
    return BUILDER_PROJECT_TYPES.SERVICE_PAGE;
  }

  if (category === BUILDER_PROJECT_CATEGORIES.COMMERCE) {
    return scores.commerce > 1
      ? BUILDER_PROJECT_TYPES.ECOMMERCE_SITE
      : BUILDER_PROJECT_TYPES.PRODUCT_PAGE;
  }

  if (category === BUILDER_PROJECT_CATEGORIES.EDUCATION) {
    return BUILDER_PROJECT_TYPES.EDUCATION_LANDING;
  }

  if (category === BUILDER_PROJECT_CATEGORIES.SAAS_AI_TOOL) {
    return scores.saasAi > 1
      ? BUILDER_PROJECT_TYPES.AI_TOOL
      : BUILDER_PROJECT_TYPES.SAAS_LANDING;
  }

  if (category === BUILDER_PROJECT_CATEGORIES.CONTENT) {
    return BUILDER_PROJECT_TYPES.CONTENT_HUB;
  }

  return BUILDER_PROJECT_TYPES.CONVERSION_LANDING;
};

export const detectBuilderBusinessModel = ({
  text = '',
  category = BUILDER_PROJECT_CATEGORIES.UNKNOWN,
  projectType = BUILDER_PROJECT_TYPES.UNKNOWN,
} = {}) => {
  const normalizedText = normalizeBuilderText(text);

  if (scoreKeywordGroup(normalizedText, KEYWORD_GROUPS.highTicket) > 0) {
    return BUILDER_BUSINESS_MODELS.HIGH_TICKET;
  }

  if (
    normalizedText.includes('creditos') ||
    normalizedText.includes('créditos') ||
    normalizedText.includes('gema') ||
    normalizedText.includes('gemas')
  ) {
    return BUILDER_BUSINESS_MODELS.CREDITS;
  }

  if (
    normalizedText.includes('suscripcion') ||
    normalizedText.includes('suscripción') ||
    normalizedText.includes('mensual') ||
    normalizedText.includes('membresia') ||
    normalizedText.includes('membresía')
  ) {
    return BUILDER_BUSINESS_MODELS.SUBSCRIPTION;
  }

  if (
    normalizedText.includes('freemium') ||
    normalizedText.includes('gratis') ||
    normalizedText.includes('probar gratis')
  ) {
    return BUILDER_BUSINESS_MODELS.FREEMIUM;
  }

  if (category === BUILDER_PROJECT_CATEGORIES.LOCAL_BUSINESS) {
    return projectType === BUILDER_PROJECT_TYPES.LOCAL_RESERVATION_PAGE
      ? BUILDER_BUSINESS_MODELS.RESERVATION
      : BUILDER_BUSINESS_MODELS.LOCAL_SERVICE;
  }

  if (category === BUILDER_PROJECT_CATEGORIES.COMMERCE) {
    return BUILDER_BUSINESS_MODELS.ECOMMERCE;
  }

  if (category === BUILDER_PROJECT_CATEGORIES.EDUCATION) {
    return BUILDER_BUSINESS_MODELS.EDUCATION_SALE;
  }

  if (category === BUILDER_PROJECT_CATEGORIES.CONTENT) {
    return BUILDER_BUSINESS_MODELS.CONTENT_MEMBERSHIP;
  }

  if (category === BUILDER_PROJECT_CATEGORIES.AUTOMATION) {
    return BUILDER_BUSINESS_MODELS.AUTOMATION_SERVICE;
  }

  if (category === BUILDER_PROJECT_CATEGORIES.SAAS_AI_TOOL) {
    return BUILDER_BUSINESS_MODELS.LEAD_GENERATION;
  }

  return BUILDER_BUSINESS_MODELS.LEAD_GENERATION;
};

export const detectBuilderPrimaryGoal = (text = '') => {
  const normalizedText = normalizeBuilderText(text);

  const scores = Object.entries(GOAL_KEYWORDS).reduce((acc, [goal, keywords]) => {
    acc[goal] = scoreKeywordGroup(normalizedText, keywords);
    return acc;
  }, {});

  return getBestScoredKey({
    scores,
    fallback: BUILDER_PRIMARY_GOALS.CAPTURE_LEADS,
    priority: [
      BUILDER_PRIMARY_GOALS.REQUEST_DIAGNOSIS,
      BUILDER_PRIMARY_GOALS.BOOK_RESERVATION,
      BUILDER_PRIMARY_GOALS.BOOK_CALL,
      BUILDER_PRIMARY_GOALS.AUTOMATE_PROCESS,
      BUILDER_PRIMARY_GOALS.SELL_PRODUCT,
      BUILDER_PRIMARY_GOALS.SELL_SERVICE,
      BUILDER_PRIMARY_GOALS.ACTIVATE_REGISTRATION,
      BUILDER_PRIMARY_GOALS.QUALIFY_LEADS,
      BUILDER_PRIMARY_GOALS.CAPTURE_LEADS,
    ],
  });
};

export const detectBuilderComplexity = ({
  text = '',
  category = BUILDER_PROJECT_CATEGORIES.UNKNOWN,
  projectType = BUILDER_PROJECT_TYPES.UNKNOWN,
} = {}) => {
  const normalizedText = normalizeBuilderText(text);

  const systemSignals = [
    'sistema',
    'plataforma',
    'dashboard',
    'api',
    'backend',
    'frontend',
    'github',
    'deploy',
    'crm',
    'webhook',
    'automatizar toda',
    'varios usuarios',
    'multiusuario',
    'roles',
    'creditos',
    'créditos',
  ];

  const highSignals = [
    'automatizacion',
    'automatización',
    'saas',
    'app',
    'herramienta ia',
    'alto ticket',
    'ecommerce',
    'checkout',
    'suscripcion',
    'suscripción',
    'integracion',
    'integración',
  ];

  const systemScore = scoreKeywordGroup(normalizedText, systemSignals);
  const highScore = scoreKeywordGroup(normalizedText, highSignals);

  if (
    systemScore >= 2 ||
    projectType === BUILDER_PROJECT_TYPES.AUTOMATION_WORKFLOW ||
    category === BUILDER_PROJECT_CATEGORIES.SAAS_AI_TOOL
  ) {
    return BUILDER_COMPLEXITY_LEVELS.SYSTEM;
  }

  if (highScore > 0) {
    return BUILDER_COMPLEXITY_LEVELS.HIGH;
  }

  if (
    category === BUILDER_PROJECT_CATEGORIES.LOCAL_BUSINESS ||
    category === BUILDER_PROJECT_CATEGORIES.CONTENT
  ) {
    return BUILDER_COMPLEXITY_LEVELS.MEDIUM;
  }

  return BUILDER_COMPLEXITY_LEVELS.MEDIUM;
};

export const resolveBuilderConversionTarget = ({
  primaryGoal = BUILDER_PRIMARY_GOALS.UNKNOWN,
  projectType = BUILDER_PROJECT_TYPES.UNKNOWN,
  playbookContext = null,
} = {}) => {
  if (primaryGoal === BUILDER_PRIMARY_GOALS.REQUEST_DIAGNOSIS) {
    return 'diagnóstico inicial';
  }

  if (primaryGoal === BUILDER_PRIMARY_GOALS.BOOK_RESERVATION) {
    return 'reserva o cita';
  }

  if (primaryGoal === BUILDER_PRIMARY_GOALS.BOOK_CALL) {
    return 'llamada cualificada';
  }

  if (primaryGoal === BUILDER_PRIMARY_GOALS.SELL_PRODUCT) {
    return 'compra o consulta de producto';
  }

  if (primaryGoal === BUILDER_PRIMARY_GOALS.AUTOMATE_PROCESS) {
    return 'flujo automatizado';
  }

  if (primaryGoal === BUILDER_PRIMARY_GOALS.ACTIVATE_REGISTRATION) {
    return 'registro o activación';
  }

  if (projectType === BUILDER_PROJECT_TYPES.HIGH_TICKET_PAGE) {
    return 'lead cualificado por diagnóstico';
  }

  return (
    playbookContext?.matches?.sector?.playbook?.conversionTarget ||
    'captación cualificada'
  );
};

export const buildBuilderClassificationConfidence = ({
  scores = {},
  playbookContext = null,
} = {}) => {
  const matchedLayers = [
    playbookContext?.matches?.basic?.matched,
    playbookContext?.matches?.expert?.matched,
    playbookContext?.matches?.sector?.matched,
    playbookContext?.matches?.assistantCapability?.matched,
  ].filter(Boolean).length;

  const totalScore = Object.values(scores).reduce((sum, value) => sum + value, 0);

  if (matchedLayers >= 3 || totalScore >= 6) return 'high';
  if (matchedLayers >= 2 || totalScore >= 3) return 'medium';

  return 'low';
};

export const classifyBuilderProject = ({
  text = '',
  project = null,
  explicitUserLevel = '',
} = {}) => {
  const projectText = [
    text,
    project?.input_content,
    project?.prompt,
    project?.title,
    project?.summary,
    project?.route,
  ]
    .filter(Boolean)
    .join(' ');

  const normalizedText = normalizeBuilderText(projectText);
  const scores = scoreAllGroups(normalizedText);
  const inputNature = detectBuilderInputNature(projectText);
  const category = detectBuilderProjectCategory(projectText);

  const projectType = detectBuilderProjectType({
    text: projectText,
    inputNature,
    category,
  });

  const businessModel = detectBuilderBusinessModel({
    text: projectText,
    category,
    projectType,
  });

  const primaryGoal = detectBuilderPrimaryGoal(projectText);

  const playbookContext = resolveBuilderPlaybookContext({
    text: projectText,
    explicitUserLevel,
  });

  const complexity = detectBuilderComplexity({
    text: projectText,
    category,
    projectType,
  });

  const conversionTarget = resolveBuilderConversionTarget({
    primaryGoal,
    projectType,
    playbookContext,
  });

  const confidence = buildBuilderClassificationConfidence({
    scores,
    playbookContext,
  });

  return {
    input: {
      raw: projectText,
      normalized: normalizedText,
      nature: inputNature,
    },
    classification: {
      category,
      projectType,
      businessModel,
      primaryGoal,
      conversionTarget,
      complexity,
      confidence,
      userLevel: playbookContext.userLevel.id,
    },
    scores,
    playbookContext,
    selectedPlaybooks: {
      userLevel: playbookContext.userLevel.playbook,
      basic: playbookContext.selected.basicPlaybook,
      expert: playbookContext.selected.expertPlaybook,
      sector: playbookContext.selected.sectorPlaybook,
      assistantCapability: playbookContext.selected.assistantCapability,
    },
    guidance: playbookContext.guidance,
  };
};

export const getBuilderClassificationSummary = (classificationResult = {}) => {
  const classification = classificationResult.classification || {};
  const selected = classificationResult.selectedPlaybooks || {};
  const guidance = classificationResult.guidance || {};

  return {
    category: classification.category || BUILDER_PROJECT_CATEGORIES.UNKNOWN,
    projectType: classification.projectType || BUILDER_PROJECT_TYPES.UNKNOWN,
    businessModel:
      classification.businessModel || BUILDER_BUSINESS_MODELS.UNKNOWN,
    primaryGoal: classification.primaryGoal || BUILDER_PRIMARY_GOALS.UNKNOWN,
    conversionTarget: classification.conversionTarget || 'captación cualificada',
    complexity:
      classification.complexity || BUILDER_COMPLEXITY_LEVELS.MEDIUM,
    confidence: classification.confidence || 'low',
    userLevel: classification.userLevel,
    labels: {
      basic: selected.basic?.label,
      expert: selected.expert?.label,
      sector: selected.sector?.label,
      capability: selected.assistantCapability?.label,
    },
    primaryCtas: guidance.primaryCtas || [],
    smartQuestions: guidance.smartQuestions || [],
    conversionRules: guidance.conversionRules || [],
    agentCues: guidance.agentCues || [],
  };
};