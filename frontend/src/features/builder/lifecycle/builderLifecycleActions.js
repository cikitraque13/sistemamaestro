import {
  BUILDER_LIFECYCLE_STAGE_IDS,
  BUILDER_PROJECT_TYPE_IDS,
} from './builderProjectLifecycle';

export const BUILDER_LIFECYCLE_ACTION_IDS = {
  CONFIGURE_PRIMARY_CTA: 'configure_primary_cta',
  CONFIGURE_WHATSAPP: 'configure_whatsapp',
  CONFIGURE_SECTOR_FORM: 'configure_sector_form',
  CONFIGURE_QUOTE_FLOW: 'configure_quote_flow',
  CONFIGURE_BOOKING_FLOW: 'configure_booking_flow',
  CONFIGURE_ORDER_FLOW: 'configure_order_flow',
  CONFIGURE_DEMO_FLOW: 'configure_demo_flow',
  CONFIGURE_AFFILIATE_CTA: 'configure_affiliate_cta',

  ADD_TRUST_FAQ: 'add_trust_faq',
  ADD_SOCIAL_PROOF: 'add_social_proof',
  RESOLVE_OBJECTIONS: 'resolve_objections',

  ADD_OFFER_DEPTH: 'add_offer_depth',
  ADD_PRICING_OR_PLANS: 'add_pricing_or_plans',
  ADD_PRODUCTS_OR_SERVICES: 'add_products_or_services',

  APPLY_BRAND_IDENTITY: 'apply_brand_identity',
  ADD_LOGO_PLACEHOLDER: 'add_logo_placeholder',
  ADD_LOCAL_CONTEXT: 'add_local_context',
  ENABLE_FULLSCREEN_PREVIEW: 'enable_fullscreen_preview',

  PREPARE_FOLLOW_UP_FLOW: 'prepare_follow_up_flow',
  STABILIZE_CODE_STRUCTURE: 'stabilize_code_structure',
  PREPARE_EXPORT_PACKAGE: 'prepare_export_package',
  PREPARE_GITHUB_SYNC: 'prepare_github_sync',
  PREPARE_DEPLOY_PLAN: 'prepare_deploy_plan',

  CONFIGURE_BACKEND_API: 'configure_backend_api',
  CONFIGURE_AUTH_FLOW: 'configure_auth_flow',
  CONFIGURE_DASHBOARD_VIEW: 'configure_dashboard_view',
};

export const BUILDER_LIFECYCLE_CREDIT_TIERS = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  PREMIUM: 'premium',
};

export const BUILDER_LIFECYCLE_ACTION_CATEGORIES = {
  CONVERSION: 'conversion',
  TRUST: 'trust',
  OFFER: 'offer',
  BRAND: 'brand',
  FOLLOW_UP: 'follow_up',
  TECHNICAL_EXIT: 'technical_exit',
  TECHNICAL_INTERNAL: 'technical_internal',
};

const SIMPLE_WEB_PROJECTS = [
  BUILDER_PROJECT_TYPE_IDS.COMMERCIAL_LANDING,
  BUILDER_PROJECT_TYPE_IDS.SERVICE_WEBSITE,
  BUILDER_PROJECT_TYPE_IDS.BOOKING_WEBSITE,
  BUILDER_PROJECT_TYPE_IDS.LOCAL_SERVICE_QUOTE,
  BUILDER_PROJECT_TYPE_IDS.RETAIL_CATALOG,
  BUILDER_PROJECT_TYPE_IDS.AFFILIATE_CONTENT,
  BUILDER_PROJECT_TYPE_IDS.PORTFOLIO_BRAND,
];

const TECHNICAL_PROJECTS = [
  BUILDER_PROJECT_TYPE_IDS.SAAS_APP,
  BUILDER_PROJECT_TYPE_IDS.INTERNAL_TOOL,
  BUILDER_PROJECT_TYPE_IDS.AUTOMATION_SYSTEM,
  BUILDER_PROJECT_TYPE_IDS.COMMUNITY_MEMBERSHIP,
];

const ALL_PROJECTS = [
  ...SIMPLE_WEB_PROJECTS,
  ...TECHNICAL_PROJECTS,
  BUILDER_PROJECT_TYPE_IDS.UNKNOWN,
];

const defineAction = (action) => ({
  requiresInput: [],
  expectedPreviewDelta: [],
  expectedCodeDelta: [],
  expectedStructureDelta: [],
  blockedUntilTechnicalExit: false,
  requiresExplicitIntent: false,
  repeatable: false,
  ...action,
});

export const BUILDER_LIFECYCLE_ACTIONS = {
  [BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_PRIMARY_CTA]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_PRIMARY_CTA,
    label: 'Configurar CTA principal',
    prompt:
      'Configura el CTA principal para que el usuario entienda que hacer y que ocurre despues.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.CONVERSION,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.CONVERSION,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.LOW,
    scoreGain: 8,
    sequenceIndex: 10,
    expectedPreviewDelta: [
      'CTA principal',
      'microcopy de continuidad',
      'bloque de cierre',
    ],
    expectedCodeDelta: [
      'ctaConfig',
      'primaryAction',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_QUOTE_FLOW]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_QUOTE_FLOW,
    label: 'Configurar solicitud de presupuesto',
    prompt:
      'Convierte el CTA en una solicitud de presupuesto con campos, urgencia y mensaje de confirmacion.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.CONVERSION,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.CONVERSION,
    projectTypes: [
      BUILDER_PROJECT_TYPE_IDS.LOCAL_SERVICE_QUOTE,
      BUILDER_PROJECT_TYPE_IDS.SERVICE_WEBSITE,
      BUILDER_PROJECT_TYPE_IDS.COMMERCIAL_LANDING,
    ],
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.MEDIUM,
    scoreGain: 10,
    sequenceIndex: 11,
    expectedPreviewDelta: [
      'bloque de presupuesto',
      'campos de servicio',
      'confirmacion',
    ],
    expectedCodeDelta: [
      'quoteForm',
      'quoteRequestModel',
    ],
    expectedStructureDelta: [
      'src/components/forms/QuoteRequestForm.jsx',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BOOKING_FLOW]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BOOKING_FLOW,
    label: 'Configurar reserva',
    prompt:
      'Convierte la landing en una experiencia de reserva clara con fecha, servicio, datos y confirmacion.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.CONVERSION,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.CONVERSION,
    projectTypes: [
      BUILDER_PROJECT_TYPE_IDS.BOOKING_WEBSITE,
      BUILDER_PROJECT_TYPE_IDS.COMMERCIAL_LANDING,
    ],
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.MEDIUM,
    scoreGain: 10,
    sequenceIndex: 12,
    expectedPreviewDelta: [
      'bloque de reserva',
      'campos de cita',
      'mensaje de confirmacion',
    ],
    expectedCodeDelta: [
      'bookingForm',
      'bookingAction',
    ],
    expectedStructureDelta: [
      'src/components/forms/BookingForm.jsx',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_ORDER_FLOW]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_ORDER_FLOW,
    label: 'Configurar pedido',
    prompt:
      'Prepara una ruta de pedido con producto, cantidad, entrega o recogida y confirmacion.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.CONVERSION,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.CONVERSION,
    projectTypes: [
      BUILDER_PROJECT_TYPE_IDS.RETAIL_CATALOG,
    ],
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.MEDIUM,
    scoreGain: 10,
    sequenceIndex: 13,
    expectedPreviewDelta: [
      'bloque de pedido',
      'catalogo inicial',
      'entrega o recogida',
    ],
    expectedCodeDelta: [
      'orderForm',
      'catalogItems',
    ],
    expectedStructureDelta: [
      'src/components/forms/OrderForm.jsx',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_DEMO_FLOW]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_DEMO_FLOW,
    label: 'Configurar demo o prueba',
    prompt:
      'Prepara la ruta para solicitar demo, probar la herramienta o activar el primer caso de uso.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.CONVERSION,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.CONVERSION,
    projectTypes: [
      BUILDER_PROJECT_TYPE_IDS.SAAS_APP,
    ],
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.MEDIUM,
    scoreGain: 10,
    sequenceIndex: 14,
    expectedPreviewDelta: [
      'CTA de demo',
      'caso de uso',
      'bloque de activacion',
    ],
    expectedCodeDelta: [
      'demoRequestForm',
      'onboardingCTA',
    ],
    expectedStructureDelta: [
      'src/components/forms/DemoRequestForm.jsx',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_AFFILIATE_CTA]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_AFFILIATE_CTA,
    label: 'Configurar CTA de afiliado',
    prompt:
      'Prepara el CTA externo con recomendacion clara, criterio de eleccion y continuidad editorial.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.CONVERSION,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.CONVERSION,
    projectTypes: [
      BUILDER_PROJECT_TYPE_IDS.AFFILIATE_CONTENT,
    ],
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.LOW,
    scoreGain: 8,
    sequenceIndex: 15,
    expectedPreviewDelta: [
      'CTA externo',
      'recomendacion',
      'criterios de eleccion',
    ],
    expectedCodeDelta: [
      'affiliateCTA',
      'externalLinkModel',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_WHATSAPP]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_WHATSAPP,
    label: 'Configurar WhatsApp',
    prompt:
      'Prepara WhatsApp como canal de contacto con mensaje inicial, CTA visible y continuidad despues del clic.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.CONVERSION,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.CONVERSION,
    projectTypes: SIMPLE_WEB_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.LOW,
    scoreGain: 7,
    sequenceIndex: 16,
    requiresInput: [
      'whatsappNumber',
    ],
    expectedPreviewDelta: [
      'boton WhatsApp',
      'mensaje preparado',
      'bloque de contacto directo',
    ],
    expectedCodeDelta: [
      'whatsappHref',
      'contactAction',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_SECTOR_FORM]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_SECTOR_FORM,
    label: 'Configurar formulario del sector',
    prompt:
      'Adapta el formulario al negocio con campos utiles y una promesa clara de respuesta.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.CONVERSION,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.CONVERSION,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.LOW,
    scoreGain: 8,
    sequenceIndex: 17,
    expectedPreviewDelta: [
      'formulario sectorial',
      'campos especificos',
      'mensaje de respuesta',
    ],
    expectedCodeDelta: [
      'formFields',
      'submitCopy',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.ADD_TRUST_FAQ,
    label: 'Anadir FAQ y confianza',
    prompt:
      'Anade preguntas frecuentes, garantias, objeciones resueltas y senales de confianza.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.TRUST,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.TRUST,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.LOW,
    scoreGain: 8,
    sequenceIndex: 20,
    expectedPreviewDelta: [
      'FAQ',
      'garantias',
      'objeciones resueltas',
    ],
    expectedCodeDelta: [
      'faqItems',
      'trustSection',
    ],
    expectedStructureDelta: [
      'src/components/sections/FaqSection.jsx',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.ADD_SOCIAL_PROOF]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.ADD_SOCIAL_PROOF,
    label: 'Anadir prueba social',
    prompt:
      'Anade resenas, casos, resultados o senales de autoridad para reforzar decision.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.TRUST,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.TRUST,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.LOW,
    scoreGain: 7,
    sequenceIndex: 21,
    expectedPreviewDelta: [
      'resenas',
      'casos',
      'senales de autoridad',
    ],
    expectedCodeDelta: [
      'testimonials',
      'socialProof',
    ],
    expectedStructureDelta: [
      'src/components/sections/SocialProofSection.jsx',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.RESOLVE_OBJECTIONS]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.RESOLVE_OBJECTIONS,
    label: 'Resolver objeciones',
    prompt:
      'Anade respuestas a dudas sobre precio, tiempo, confianza, garantias o siguiente paso.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.TRUST,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.TRUST,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.LOW,
    scoreGain: 6,
    sequenceIndex: 22,
    expectedPreviewDelta: [
      'objeciones',
      'respuestas',
      'reduccion de friccion',
    ],
    expectedCodeDelta: [
      'objectionBlocks',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.ADD_OFFER_DEPTH,
    label: 'Profundizar oferta',
    prompt:
      'Haz la oferta mas concreta con servicios, productos, packs, categorias, beneficios o comparativas.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.OFFER,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.OFFER,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.MEDIUM,
    scoreGain: 8,
    sequenceIndex: 30,
    expectedPreviewDelta: [
      'servicios concretos',
      'beneficios',
      'bloques de oferta',
    ],
    expectedCodeDelta: [
      'offerSections',
      'serviceCards',
    ],
    expectedStructureDelta: [
      'src/components/sections/OfferSection.jsx',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRODUCTS_OR_SERVICES]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRODUCTS_OR_SERVICES,
    label: 'Anadir productos o servicios destacados',
    prompt:
      'Anade una seccion mas especifica de productos, servicios, categorias o soluciones principales.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.OFFER,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.OFFER,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.LOW,
    scoreGain: 7,
    sequenceIndex: 31,
    expectedPreviewDelta: [
      'productos',
      'servicios',
      'categorias',
    ],
    expectedCodeDelta: [
      'productOrServiceCards',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRICING_OR_PLANS]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.ADD_PRICING_OR_PLANS,
    label: 'Anadir planes o packs',
    prompt:
      'Anade planes, packs, niveles de servicio o rangos de precio si ayudan a decidir.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.OFFER,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.OFFER,
    projectTypes: [
      BUILDER_PROJECT_TYPE_IDS.SAAS_APP,
      BUILDER_PROJECT_TYPE_IDS.BOOKING_WEBSITE,
      BUILDER_PROJECT_TYPE_IDS.SERVICE_WEBSITE,
      BUILDER_PROJECT_TYPE_IDS.RETAIL_CATALOG,
      BUILDER_PROJECT_TYPE_IDS.COMMUNITY_MEMBERSHIP,
    ],
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.MEDIUM,
    scoreGain: 7,
    sequenceIndex: 32,
    expectedPreviewDelta: [
      'planes',
      'packs',
      'comparativa de opciones',
    ],
    expectedCodeDelta: [
      'pricingCards',
      'planOptions',
    ],
    expectedStructureDelta: [
      'src/components/sections/PricingSection.jsx',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.APPLY_BRAND_IDENTITY,
    label: 'Personalizar marca',
    prompt:
      'Personaliza nombre visual, tono, colores, claim y sensacion de marca para que deje de parecer plantilla.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.BRAND,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.BRAND,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.MEDIUM,
    scoreGain: 8,
    sequenceIndex: 40,
    requiresInput: [
      'brandTone',
    ],
    expectedPreviewDelta: [
      'colores',
      'claim',
      'tono de marca',
    ],
    expectedCodeDelta: [
      'brandTheme',
      'brandCopy',
    ],
    expectedStructureDelta: [
      'src/theme/brandTheme.js',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.ADD_LOGO_PLACEHOLDER]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.ADD_LOGO_PLACEHOLDER,
    label: 'Anadir logo o marca provisional',
    prompt:
      'Anade un area de logo o marca provisional hasta que el usuario suba el logo definitivo.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.BRAND,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.BRAND,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.LOW,
    scoreGain: 5,
    sequenceIndex: 41,
    expectedPreviewDelta: [
      'logo provisional',
      'cabecera de marca',
    ],
    expectedCodeDelta: [
      'brandLogo',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.ADD_LOCAL_CONTEXT]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.ADD_LOCAL_CONTEXT,
    label: 'Anadir contexto local',
    prompt:
      'Anade ubicacion, horarios, zona de servicio o contexto local para reforzar confianza y cercania.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.BRAND,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.BRAND,
    projectTypes: SIMPLE_WEB_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.LOW,
    scoreGain: 6,
    sequenceIndex: 42,
    expectedPreviewDelta: [
      'ubicacion',
      'horarios',
      'zona de servicio',
    ],
    expectedCodeDelta: [
      'localBusinessInfo',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.ENABLE_FULLSCREEN_PREVIEW]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.ENABLE_FULLSCREEN_PREVIEW,
    label: 'Ampliar preview',
    prompt:
      'Activa una vista ampliada para revisar la web como cliente real sin cortes visuales.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.BRAND,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.BRAND,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.NONE,
    scoreGain: 3,
    sequenceIndex: 43,
    expectedPreviewDelta: [
      'preview ampliada',
      'revision visual completa',
    ],
    expectedCodeDelta: [
      'fullscreenPreviewState',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_FOLLOW_UP_FLOW]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_FOLLOW_UP_FLOW,
    label: 'Preparar seguimiento',
    prompt:
      'Prepara confirmacion, aviso interno, clasificacion del lead y seguimiento posterior.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.TECHNICAL_EXIT,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.FOLLOW_UP,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.MEDIUM,
    scoreGain: 8,
    sequenceIndex: 50,
    expectedPreviewDelta: [
      'bloque de seguimiento',
      'que ocurre despues',
    ],
    expectedCodeDelta: [
      'followUpFlow',
      'leadStatus',
    ],
    expectedStructureDelta: [
      'src/lib/followUpFlow.js',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.STABILIZE_CODE_STRUCTURE]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.STABILIZE_CODE_STRUCTURE,
    label: 'Estabilizar codigo y estructura',
    prompt:
      'Ordena archivos, componentes, rutas y estructura para que el proyecto sea exportable.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.TECHNICAL_EXIT,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.TECHNICAL_EXIT,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.HIGH,
    scoreGain: 8,
    sequenceIndex: 51,
    blockedUntilTechnicalExit: true,
    expectedCodeDelta: [
      'componentStructure',
      'routes',
      'dataModels',
    ],
    expectedStructureDelta: [
      'src/pages',
      'src/components',
      'src/lib',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_EXPORT_PACKAGE]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_EXPORT_PACKAGE,
    label: 'Preparar exportacion',
    prompt:
      'Prepara el proyecto para exportarlo con estructura, archivos y checklist de salida.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.TECHNICAL_EXIT,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.TECHNICAL_EXIT,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.PREMIUM,
    scoreGain: 6,
    sequenceIndex: 52,
    blockedUntilTechnicalExit: true,
    expectedCodeDelta: [
      'exportChecklist',
    ],
    expectedStructureDelta: [
      'export/README.md',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_GITHUB_SYNC]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_GITHUB_SYNC,
    label: 'Preparar GitHub',
    prompt:
      'Prepara sincronizacion con GitHub cuando la estructura ya este validada.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.TECHNICAL_EXIT,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.TECHNICAL_EXIT,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.PREMIUM,
    scoreGain: 4,
    sequenceIndex: 53,
    blockedUntilTechnicalExit: true,
    expectedCodeDelta: [
      'githubPlan',
    ],
    expectedStructureDelta: [
      '.github',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_DEPLOY_PLAN]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.PREPARE_DEPLOY_PLAN,
    label: 'Preparar deploy',
    prompt:
      'Prepara plan de deploy, dominio y entorno solo cuando el proyecto este listo para salir.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.TECHNICAL_EXIT,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.TECHNICAL_EXIT,
    projectTypes: ALL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.PREMIUM,
    scoreGain: 4,
    sequenceIndex: 54,
    blockedUntilTechnicalExit: true,
    expectedCodeDelta: [
      'deployPlan',
    ],
    expectedStructureDelta: [
      'deploy.config',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BACKEND_API]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_BACKEND_API,
    label: 'Configurar backend/API',
    prompt:
      'Prepara backend o API solo si el proyecto necesita datos, usuarios, persistencia o integracion real.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.TECHNICAL_EXIT,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.TECHNICAL_INTERNAL,
    projectTypes: TECHNICAL_PROJECTS,
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.HIGH,
    scoreGain: 8,
    sequenceIndex: 60,
    requiresExplicitIntent: true,
    expectedCodeDelta: [
      'apiRoutes',
      'backendServices',
    ],
    expectedStructureDelta: [
      'backend/app/routers',
      'backend/app/services',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_AUTH_FLOW]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_AUTH_FLOW,
    label: 'Configurar autenticacion',
    prompt:
      'Prepara login o autenticacion solo si el proyecto requiere usuarios, cuenta o area privada.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.TECHNICAL_EXIT,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.TECHNICAL_INTERNAL,
    projectTypes: [
      BUILDER_PROJECT_TYPE_IDS.SAAS_APP,
      BUILDER_PROJECT_TYPE_IDS.INTERNAL_TOOL,
      BUILDER_PROJECT_TYPE_IDS.COMMUNITY_MEMBERSHIP,
    ],
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.HIGH,
    scoreGain: 8,
    sequenceIndex: 61,
    requiresExplicitIntent: true,
    expectedCodeDelta: [
      'authFlow',
      'protectedRoutes',
    ],
    expectedStructureDelta: [
      'src/features/auth',
    ],
  }),

  [BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_DASHBOARD_VIEW]: defineAction({
    id: BUILDER_LIFECYCLE_ACTION_IDS.CONFIGURE_DASHBOARD_VIEW,
    label: 'Configurar dashboard',
    prompt:
      'Prepara dashboard solo si el proyecto es app, SaaS, herramienta interna o sistema operativo.',
    stageId: BUILDER_LIFECYCLE_STAGE_IDS.TECHNICAL_EXIT,
    category: BUILDER_LIFECYCLE_ACTION_CATEGORIES.TECHNICAL_INTERNAL,
    projectTypes: [
      BUILDER_PROJECT_TYPE_IDS.SAAS_APP,
      BUILDER_PROJECT_TYPE_IDS.INTERNAL_TOOL,
      BUILDER_PROJECT_TYPE_IDS.AUTOMATION_SYSTEM,
    ],
    creditTier: BUILDER_LIFECYCLE_CREDIT_TIERS.HIGH,
    scoreGain: 8,
    sequenceIndex: 62,
    requiresExplicitIntent: true,
    expectedPreviewDelta: [
      'dashboard si procede',
    ],
    expectedCodeDelta: [
      'dashboardPage',
      'metricCards',
    ],
    expectedStructureDelta: [
      'src/features/dashboard',
    ],
  }),
};

export const getBuilderLifecycleAction = (actionId) =>
  BUILDER_LIFECYCLE_ACTIONS[actionId] || null;

export const getAllBuilderLifecycleActions = () =>
  Object.values(BUILDER_LIFECYCLE_ACTIONS);

export const getBuilderLifecycleActionsByStage = (stageId) =>
  getAllBuilderLifecycleActions().filter((action) => action.stageId === stageId);

export const getBuilderLifecycleActionsByProjectType = (projectType) =>
  getAllBuilderLifecycleActions().filter((action) =>
    action.projectTypes.includes(projectType)
  );

export const sortBuilderLifecycleActions = (actions = []) =>
  [...actions].sort((a, b) => {
    const aIndex = Number.isFinite(a.sequenceIndex) ? a.sequenceIndex : 999;
    const bIndex = Number.isFinite(b.sequenceIndex) ? b.sequenceIndex : 999;

    return aIndex - bIndex;
  });