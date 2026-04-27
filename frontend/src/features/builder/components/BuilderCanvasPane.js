import React, { useMemo } from 'react';

import BuilderExtractionPanel from '../panels/BuilderExtractionPanel';

import {
  BUILDER_CODE_TABS,
  getBuilderCodeLines,
  getVisibleCodeLines,
} from '../utils/builderCodeTemplates';

import {
  getArray,
} from '../utils/builderLandingCopy';

const INTERNAL_PREVIEW_TERMS = [
  'sistema maestro',
  'builder',
  'gema maestra',
  'preview conectada',
  'estado vivo',
  'primera versión generada',
  'cambios reales',
  'estructura exportable',
  'código coherente',
  'proceso visible',
  'dashboard',
  'flujo de autenticación',
  'github',
  'deploy',
  'créditos',
  'salida técnica',
  'siguientes decisiones',
];

const truncateText = (value = '', max = 92) => {
  const text = String(value || '').trim();

  if (!text) return '';
  if (text.length <= max) return text;

  return `${text.slice(0, max - 1).trim()}…`;
};

const normalizeText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const includesAny = (text = '', terms = []) => {
  const normalized = normalizeText(text);

  return terms.some((term) => normalized.includes(normalizeText(term)));
};

const isInternalPreviewText = (value = '') => {
  const normalized = normalizeText(value);

  if (!normalized) return false;

  return INTERNAL_PREVIEW_TERMS.some((term) =>
    normalized.includes(normalizeText(term))
  );
};

const safeLandingText = (value = '', fallback = '') => {
  const text = String(value || '').trim();

  if (!text) return fallback;
  if (isInternalPreviewText(text)) return fallback;

  return text;
};

const getBuilderKernelOutput = (builderIntelligence = {}) =>
  builderIntelligence?.builderKernelOutput ||
  builderIntelligence?.builderKernelResult?.output ||
  {};

const getBuilderIntelligenceParts = (builderIntelligence = {}) => {
  const hubSummary = builderIntelligence?.hubSummary || {};
  const lastDelta = builderIntelligence?.lastDelta || {};
  const lastOperation = builderIntelligence?.lastOperation || {};
  const builderKernelOutput = getBuilderKernelOutput(builderIntelligence);
  const previewSnapshot = builderKernelOutput?.preview || null;
  const codeSnapshot = builderKernelOutput?.code || null;
  const structureSnapshot = builderKernelOutput?.structure || null;
  const buildSummary =
    builderIntelligence?.builderBuildSummary ||
    builderKernelOutput?.summary ||
    null;

  const visiblePlan =
    hubSummary?.visiblePlan ||
    lastOperation?.visiblePlan ||
    builderIntelligence?.hubState?.visiblePlan ||
    {};

  return {
    hubSummary,
    lastDelta,
    lastOperation,
    visiblePlan,
    builderKernelOutput,
    previewSnapshot,
    codeSnapshot,
    structureSnapshot,
    buildSummary,
  };
};

const getKernelSections = (builderIntelligence = {}) => {
  const { previewSnapshot } = getBuilderIntelligenceParts(builderIntelligence);

  return getArray(previewSnapshot?.sections);
};

const getProjectContextText = ({
  copy,
  project,
  builderIntelligence,
} = {}) => {
  const {
    hubSummary,
    previewSnapshot,
  } = getBuilderIntelligenceParts(builderIntelligence);

  return [
    project?.input_content,
    project?.prompt,
    project?.title,
    project?.summary,
    copy?.eyebrow,
    copy?.headline,
    copy?.subheadline,
    copy?.sectionTitle,
    copy?.sectionText,
    hubSummary?.projectType,
    hubSummary?.category,
    hubSummary?.businessModel,
    hubSummary?.primaryPlaybook,
    hubSummary?.operationalFocus,
    hubSummary?.conversionTarget,
    hubSummary?.primaryCTA,
    previewSnapshot?.layout,
    ...getArray(previewSnapshot?.sections).flatMap((section) => [
      section?.label,
      section?.type,
      section?.props?.title,
      section?.props?.subtitle,
    ]),
  ]
    .filter(Boolean)
    .join(' ');
};

const extractCity = (contextText = '') => {
  const normalized = normalizeText(contextText);

  const cities = [
    'Madrid',
    'Barcelona',
    'Valencia',
    'Sevilla',
    'Málaga',
    'Zaragoza',
    'Bilbao',
    'Alicante',
    'Murcia',
    'Valladolid',
  ];

  return cities.find((city) => normalized.includes(normalizeText(city))) || 'Madrid';
};

const createDentalProfile = (city = 'Madrid') => ({
  id: 'dental-premium',
  tone: 'premium',
  businessName: `Clínica Dental Aurora ${city}`,
  eyebrow: `Clínica dental premium en ${city}`,
  headline: 'Sonríe con confianza desde la primera visita',
  subheadline:
    'Odontología avanzada, estética dental y atención cercana para pacientes que buscan seguridad, precisión y una experiencia cómoda.',
  primaryCTA: 'Reservar cita',
  secondaryCTA: 'Ver tratamientos',
  sectionTitle: 'Tratamientos dentales pensados para generar confianza',
  sectionText:
    'Una landing preparada para captar pacientes, explicar servicios clave y convertir visitas en reservas reales.',
  services: [
    {
      title: 'Implantes dentales',
      text: 'Planificación precisa, diagnóstico claro y seguimiento profesional en cada fase.',
    },
    {
      title: 'Estética dental',
      text: 'Blanqueamiento, carillas y diseño de sonrisa con enfoque natural y elegante.',
    },
    {
      title: 'Ortodoncia invisible',
      text: 'Tratamientos discretos para alinear tu sonrisa sin alterar tu día a día.',
    },
  ],
  trust: [
    'Equipo médico especializado',
    'Primera valoración personalizada',
    'Tecnología de diagnóstico avanzada',
    'Explicación clara antes de cada tratamiento',
  ],
  technology: [
    'Escáner intraoral',
    'Planificación digital',
    'Recordatorios automáticos',
    'Seguimiento post-tratamiento',
  ],
  testimonials: [
    {
      quote:
        'Me explicaron todo con claridad y salí con un plan de tratamiento que entendía perfectamente.',
      author: 'Paciente de estética dental',
    },
    {
      quote:
        'La reserva fue rápida, la atención muy profesional y el resultado superó mis expectativas.',
      author: 'Paciente de implantología',
    },
  ],
  booking: {
    title: 'Reserva tu valoración inicial',
    text:
      'Completa tus datos y el equipo de la clínica te contactará para confirmar día, hora y tratamiento.',
    fields: ['Nombre', 'Teléfono', 'Tratamiento', 'Fecha preferida'],
    buttonLabel: 'Solicitar cita',
  },
  automation: {
    title: 'Sistema de citas preparado para vender',
    text:
      'La landing puede conectarse después con email, recordatorios, CRM y seguimiento automático de pacientes.',
    items: [
      'Confirmación de cita por email',
      'Aviso interno al equipo comercial',
      'Segmentación por tratamiento',
      'Seguimiento automático si no reserva',
    ],
  },
});

const createBeautyProfile = (city = 'Madrid') => ({
  id: 'beauty-premium',
  tone: 'premium',
  businessName: `Clínica Estética Aura ${city}`,
  eyebrow: `Clínica estética premium en ${city}`,
  headline: 'Tratamientos estéticos con criterio médico y resultado natural',
  subheadline:
    'Una experiencia premium para pacientes que buscan confianza, asesoramiento experto y resultados visibles sin perder naturalidad.',
  primaryCTA: 'Reservar valoración',
  secondaryCTA: 'Ver tratamientos',
  sectionTitle: 'Servicios de estética preparados para convertir',
  sectionText:
    'La landing presenta servicios, autoridad médica y una ruta clara hacia la reserva.',
  services: [
    {
      title: 'Medicina estética facial',
      text: 'Tratamientos personalizados para mejorar expresión, textura y luminosidad.',
    },
    {
      title: 'Rejuvenecimiento',
      text: 'Protocolos avanzados para piel, firmeza y prevención del envejecimiento.',
    },
    {
      title: 'Diagnóstico personalizado',
      text: 'Valoración inicial para recomendar el tratamiento más adecuado.',
    },
  ],
  trust: [
    'Equipo médico colegiado',
    'Resultados naturales',
    'Diagnóstico personalizado',
    'Seguimiento posterior al tratamiento',
  ],
  technology: [
    'Historia clínica digital',
    'Recordatorios automáticos',
    'Segmentación por tratamiento',
    'Seguimiento de pacientes',
  ],
  testimonials: [
    {
      quote:
        'Buscaba un cambio natural y el equipo entendió exactamente lo que necesitaba.',
      author: 'Paciente de medicina estética',
    },
    {
      quote:
        'La experiencia fue clara, profesional y muy cuidada desde la primera cita.',
      author: 'Paciente de rejuvenecimiento',
    },
  ],
  booking: {
    title: 'Reserva tu diagnóstico estético',
    text:
      'El equipo revisará tu caso y te propondrá una valoración inicial adaptada a tus objetivos.',
    fields: ['Nombre', 'Teléfono', 'Tratamiento', 'Fecha preferida'],
    buttonLabel: 'Solicitar valoración',
  },
  automation: {
    title: 'Seguimiento comercial preparado',
    text:
      'La landing puede alimentar campañas, formularios, email y recordatorios de citas.',
    items: [
      'Lead por tratamiento',
      'Confirmación automática',
      'Recordatorio de cita',
      'Reactivación de pacientes',
    ],
  },
});

const createRestaurantProfile = (city = 'Madrid') => ({
  id: 'restaurant-booking',
  tone: 'warm',
  businessName: `Restaurante Brasa Norte ${city}`,
  eyebrow: `Restaurante con reserva online en ${city}`,
  headline: 'Reserva una experiencia gastronómica memorable',
  subheadline:
    'Una landing diseñada para mostrar propuesta, carta, ambiente y reserva directa en pocos pasos.',
  primaryCTA: 'Reservar mesa',
  secondaryCTA: 'Ver carta',
  sectionTitle: 'Una experiencia clara desde el primer vistazo',
  sectionText:
    'El objetivo es reducir fricción, enseñar valor y llevar al usuario a reservar.',
  services: [
    {
      title: 'Carta seleccionada',
      text: 'Platos principales, menús y especialidades presentadas con jerarquía clara.',
    },
    {
      title: 'Reserva rápida',
      text: 'Formulario simple para elegir día, hora y número de personas.',
    },
    {
      title: 'Eventos privados',
      text: 'Captación de grupos, empresas y celebraciones con seguimiento comercial.',
    },
  ],
  trust: [
    'Reserva en menos de un minuto',
    'Confirmación automática',
    'Opciones para grupos',
    'Ubicación y horarios visibles',
  ],
  technology: [
    'Confirmación por email',
    'Aviso interno al restaurante',
    'Segmentación por tipo de reserva',
    'Lista de espera futura',
  ],
  testimonials: [
    {
      quote:
        'Reservar fue muy fácil y la experiencia estuvo a la altura de lo prometido.',
      author: 'Cliente de cena',
    },
    {
      quote:
        'La página deja claro el ambiente, la carta y cómo reservar sin complicaciones.',
      author: 'Cliente de grupo',
    },
  ],
  booking: {
    title: 'Reserva tu mesa',
    text:
      'Indica día, hora y número de personas. El equipo confirmará tu reserva.',
    fields: ['Nombre', 'Teléfono', 'Fecha', 'Personas'],
    buttonLabel: 'Confirmar reserva',
  },
  automation: {
    title: 'Reservas y seguimiento',
    text:
      'La landing puede conectarse con confirmaciones, recordatorios y campañas para clientes recurrentes.',
    items: [
      'Confirmación automática',
      'Recordatorio de reserva',
      'Captación de grupos',
      'Campañas para clientes frecuentes',
    ],
  },
});

const createDefaultServiceProfile = (city = 'Madrid') => ({
  id: 'local-service',
  tone: 'direct',
  businessName: `Servicio Premium ${city}`,
  eyebrow: `Servicio profesional en ${city}`,
  headline: 'Convierte visitas en solicitudes reales',
  subheadline:
    'Una landing clara, directa y preparada para explicar el servicio, generar confianza y activar contacto.',
  primaryCTA: 'Solicitar información',
  secondaryCTA: 'Ver servicios',
  sectionTitle: 'Una estructura comercial lista para vender',
  sectionText:
    'El contenido se organiza para que el usuario entienda la propuesta, confíe y dé el siguiente paso.',
  services: [
    {
      title: 'Servicio principal',
      text: 'Presentación clara del valor principal y del resultado que obtiene el cliente.',
    },
    {
      title: 'Atención personalizada',
      text: 'Explicación sencilla del proceso y de cómo se adapta al caso del usuario.',
    },
    {
      title: 'Seguimiento comercial',
      text: 'Formulario y CTA preparados para responder y convertir oportunidades.',
    },
  ],
  trust: [
    'Respuesta rápida',
    'Proceso claro',
    'Atención profesional',
    'Seguimiento personalizado',
  ],
  technology: [
    'Formulario conectado',
    'Confirmación automática',
    'Segmentación por necesidad',
    'Seguimiento posterior',
  ],
  testimonials: [
    {
      quote:
        'La propuesta se entiende rápido y facilita pedir información sin fricción.',
      author: 'Cliente interesado',
    },
    {
      quote:
        'La landing transmite confianza y deja claro el siguiente paso.',
      author: 'Usuario cualificado',
    },
  ],
  booking: {
    title: 'Solicita una primera valoración',
    text:
      'Déjanos tus datos y el equipo te contactará con una propuesta adaptada.',
    fields: ['Nombre', 'Email', 'Teléfono', 'Servicio'],
    buttonLabel: 'Enviar solicitud',
  },
  automation: {
    title: 'Captación y seguimiento automático',
    text:
      'La landing queda preparada para conectar formularios, emails, avisos internos y seguimiento comercial.',
    items: [
      'Email de confirmación',
      'Aviso al equipo',
      'Clasificación del lead',
      'Seguimiento automático',
    ],
  },
});

const detectBusinessProfile = (contextText = '') => {
  const city = extractCity(contextText);

  if (
    includesAny(contextText, [
      'dental',
      'dentista',
      'odontologia',
      'odontología',
      'implante',
      'ortodoncia',
      'clinica dental',
      'clínica dental',
    ])
  ) {
    return createDentalProfile(city);
  }

  if (
    includesAny(contextText, [
      'estetica',
      'estética',
      'belleza',
      'medicina estetica',
      'medicina estética',
      'botox',
      'rejuvenecimiento',
      'facial',
    ])
  ) {
    return createBeautyProfile(city);
  }

  if (
    includesAny(contextText, [
      'restaurante',
      'reserva mesa',
      'gastronomia',
      'gastronomía',
      'carta',
      'menú',
      'menu',
      'comida',
      'cena',
    ])
  ) {
    return createRestaurantProfile(city);
  }

  return createDefaultServiceProfile(city);
};

const resolvePreviewTone = (builderIntelligence = {}, profileTone = 'contextual') => {
  const {
    hubSummary,
    lastDelta,
    previewSnapshot,
  } = getBuilderIntelligenceParts(builderIntelligence);

  const visualTone = lastDelta?.visual?.tone;
  const category = hubSummary?.category;
  const projectType = hubSummary?.projectType;
  const businessModel = hubSummary?.businessModel;
  const intent = hubSummary?.iterationIntent;
  const layout = previewSnapshot?.layout;

  if (profileTone) return profileTone;
  if (visualTone) return visualTone;

  if (
    intent === 'premiumize' ||
    businessModel === 'high_ticket' ||
    projectType === 'high_ticket_page'
  ) {
    return 'premium';
  }

  if (
    intent === 'increase_conversion' ||
    intent === 'change_cta'
  ) {
    return 'direct';
  }

  if (
    category === 'local_business' ||
    projectType === 'local_reservation_page' ||
    layout === 'restaurant_landing'
  ) {
    return 'warm';
  }

  if (
    category === 'automation' ||
    projectType === 'automation_workflow'
  ) {
    return 'system';
  }

  if (
    category === 'saas_ai_tool' ||
    projectType === 'ai_tool' ||
    layout === 'app_dashboard'
  ) {
    return 'tech';
  }

  if (intent === 'simplify') return 'simple';

  return 'contextual';
};

const getPreviewSurfaceClass = (tone = 'contextual') => {
  const classes = {
    premium:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(251,191,36,0.18),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(255,255,255,0.09),transparent_34%),linear-gradient(135deg,#060507_0%,#0D0B12_56%,#070707_100%)]',
    direct:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(251,146,60,0.2),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(34,211,238,0.12),transparent_32%),linear-gradient(135deg,#050607_0%,#0B0A08_56%,#050505_100%)]',
    warm:
      'bg-[radial-gradient(circle_at_82%_0%,rgba(251,146,60,0.22),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(245,158,11,0.13),transparent_32%),linear-gradient(135deg,#080604_0%,#120C08_58%,#060504_100%)]',
    system:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.13),transparent_32%),linear-gradient(135deg,#030607_0%,#061012_58%,#030404_100%)]',
    tech:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(74,222,128,0.11),transparent_32%),linear-gradient(135deg,#030507_0%,#071018_58%,#020405_100%)]',
    simple:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(34,211,238,0.08),transparent_32%),linear-gradient(135deg,#07080A_0%,#0B0D10_58%,#050607_100%)]',
    serious:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(148,163,184,0.16),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(255,255,255,0.07),transparent_32%),linear-gradient(135deg,#050507_0%,#0B0C10_58%,#050505_100%)]',
    contextual:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.13),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(251,191,36,0.11),transparent_32%),linear-gradient(135deg,#050608_0%,#09080D_58%,#050505_100%)]',
  };

  return classes[tone] || classes.contextual;
};

const getAccentClass = (tone = 'contextual') => {
  const classes = {
    premium: 'border-amber-200/25 bg-amber-200/[0.09] text-amber-100',
    direct: 'border-orange-300/25 bg-orange-300/[0.09] text-orange-100',
    warm: 'border-orange-200/25 bg-orange-200/[0.09] text-orange-100',
    system: 'border-cyan-300/25 bg-cyan-300/[0.09] text-cyan-100',
    tech: 'border-cyan-300/25 bg-cyan-300/[0.09] text-cyan-100',
    simple: 'border-white/15 bg-white/[0.06] text-zinc-100',
    serious: 'border-slate-300/20 bg-slate-300/[0.08] text-slate-100',
    contextual: 'border-amber-200/20 bg-amber-200/[0.08] text-amber-100',
  };

  return classes[tone] || classes.contextual;
};

const getPrimaryButtonClass = (tone = 'contextual') => {
  const classes = {
    premium:
      'bg-gradient-to-r from-amber-200 via-white to-amber-100 text-black shadow-[0_18px_45px_rgba(251,191,36,0.16)]',
    direct:
      'bg-gradient-to-r from-orange-400 via-amber-200 to-white text-black shadow-[0_18px_45px_rgba(251,146,60,0.18)]',
    warm:
      'bg-gradient-to-r from-orange-300 via-amber-200 to-white text-black shadow-[0_18px_45px_rgba(251,146,60,0.16)]',
    system:
      'bg-gradient-to-r from-cyan-300 via-emerald-200 to-white text-black shadow-[0_18px_45px_rgba(34,211,238,0.16)]',
    tech:
      'bg-gradient-to-r from-cyan-300 via-white to-emerald-200 text-black shadow-[0_18px_45px_rgba(34,211,238,0.16)]',
    simple:
      'bg-white text-black shadow-[0_18px_45px_rgba(255,255,255,0.08)]',
    serious:
      'bg-gradient-to-r from-slate-100 via-white to-zinc-200 text-black shadow-[0_18px_45px_rgba(148,163,184,0.12)]',
    contextual:
      'bg-gradient-to-r from-amber-200 via-white to-amber-100 text-black shadow-[0_18px_45px_rgba(251,191,36,0.14)]',
  };

  return classes[tone] || classes.contextual;
};

const getPanelClass = (tone = 'contextual') => {
  const classes = {
    premium: 'border-amber-200/15 bg-amber-200/[0.045]',
    direct: 'border-orange-300/15 bg-orange-300/[0.045]',
    warm: 'border-orange-200/15 bg-orange-200/[0.045]',
    system: 'border-cyan-300/15 bg-cyan-300/[0.045]',
    tech: 'border-cyan-300/15 bg-cyan-300/[0.045]',
    simple: 'border-white/[0.08] bg-white/[0.035]',
    serious: 'border-slate-300/15 bg-slate-300/[0.045]',
    contextual: 'border-white/[0.08] bg-white/[0.035]',
  };

  return classes[tone] || classes.contextual;
};

const getSafeKernelLandingSections = (builderIntelligence = {}) => {
  const blockedTypes = [
    'auth',
    'dashboard',
    'credits',
    'github',
    'deploy',
    'builder',
    'system',
    'internal',
  ];

  return getKernelSections(builderIntelligence).filter((section) => {
    const label = [
      section?.id,
      section?.type,
      section?.label,
      section?.props?.title,
      section?.props?.subtitle,
      section?.props?.buttonLabel,
    ]
      .filter(Boolean)
      .join(' ');

    if (!label) return false;
    if (blockedTypes.includes(normalizeText(section?.type))) return false;
    if (isInternalPreviewText(label)) return false;

    return true;
  });
};

const buildLandingModel = ({
  copy,
  project,
  builderIntelligence,
} = {}) => {
  const contextText = getProjectContextText({
    copy,
    project,
    builderIntelligence,
  });

  const profile = detectBusinessProfile(contextText);
  const {
    hubSummary,
    lastDelta,
    lastOperation,
  } = getBuilderIntelligenceParts(builderIntelligence);

  const safeSections = getSafeKernelLandingSections(builderIntelligence);
  const safeHeroSection = safeSections.find((section) =>
    ['hero', 'header', 'landing_hero'].includes(normalizeText(section?.type))
  );

  const heroProps = safeHeroSection?.props || {};

  const headline = safeLandingText(
    heroProps.title ||
      lastDelta?.copy?.headline ||
      copy?.headline,
    profile.headline
  );

  const subheadline = safeLandingText(
    heroProps.subtitle ||
      lastDelta?.copy?.subheadline ||
      copy?.subheadline,
    profile.subheadline
  );

  const primaryCTA = safeLandingText(
    heroProps.buttonLabel ||
      lastDelta?.cta?.primaryCTA ||
      lastOperation?.primaryCTA ||
      hubSummary?.primaryCTA ||
      copy?.primaryCta,
    profile.primaryCTA
  );

  const secondaryCTA = safeLandingText(
    lastDelta?.cta?.secondaryCTA ||
      copy?.secondaryCta,
    profile.secondaryCTA
  );

  const eyebrow = safeLandingText(
    heroProps.badge ||
      heroProps.eyebrow ||
      copy?.eyebrow,
    profile.eyebrow
  );

  const kernelServices = safeSections
    .filter((section) =>
      ['services', 'service', 'features', 'benefits'].includes(normalizeText(section?.type))
    )
    .flatMap((section) => {
      const props = section?.props || {};
      const items = getArray(props.items || props.points || props.services);

      if (!items.length && props.title) {
        return [
          {
            title: props.title,
            text: props.subtitle || 'Servicio preparado para presentar valor de forma clara.',
          },
        ];
      }

      return items.map((item) =>
        typeof item === 'string'
          ? {
              title: item,
              text: 'Servicio destacado para reforzar la propuesta comercial.',
            }
          : {
              title: item?.title || item?.label || 'Servicio',
              text: item?.text || item?.description || item?.subtitle || '',
            }
      );
    })
    .filter((item) => !isInternalPreviewText(`${item.title} ${item.text}`));

  const services = kernelServices.length >= 3
    ? kernelServices.slice(0, 3)
    : profile.services;

  return {
    ...profile,
    eyebrow,
    headline,
    subheadline,
    primaryCTA,
    secondaryCTA,
    sectionTitle: safeLandingText(copy?.sectionTitle, profile.sectionTitle),
    sectionText: safeLandingText(copy?.sectionText, profile.sectionText),
    services,
  };
};

const LandingHero = ({
  model,
  tone,
  progress,
}) => (
  <section className="px-6 py-9 md:px-10 md:py-12">
    <div
      className={`inline-flex rounded-full border px-4 py-2 transition-all duration-700 ${getAccentClass(tone)} ${
        progress >= 18 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-20'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
        {model.eyebrow}
      </p>
    </div>

    <div className="mt-7 grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
      <div>
        <p
          className={`text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400 transition-all duration-700 ${
            progress >= 24 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-20'
          }`}
        >
          {model.businessName}
        </p>

        <h1
          className={`mt-4 max-w-5xl text-4xl font-semibold tracking-[-0.075em] text-white transition-all duration-700 md:text-6xl ${
            progress >= 34 ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-20'
          }`}
        >
          {model.headline}
        </h1>

        <p
          className={`mt-6 max-w-3xl text-base leading-8 text-zinc-300 transition-all duration-700 md:text-lg ${
            progress >= 48 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-20'
          }`}
        >
          {model.subheadline}
        </p>

        <div
          className={`mt-8 flex flex-wrap gap-3 transition-all duration-700 ${
            progress >= 62 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-20'
          }`}
        >
          <button className={`rounded-2xl px-6 py-3.5 text-sm font-semibold ${getPrimaryButtonClass(tone)}`}>
            {model.primaryCTA}
          </button>

          <button className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white">
            {model.secondaryCTA}
          </button>
        </div>
      </div>

      <div
        className={`rounded-[28px] border p-5 transition-all duration-700 ${getPanelClass(tone)} ${
          progress >= 56 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-20'
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
          Reserva rápida
        </p>

        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
          {model.booking.title}
        </h2>

        <p className="mt-3 text-sm leading-7 text-zinc-400">
          {model.booking.text}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {model.booking.fields.slice(0, 4).map((field) => (
            <input
              key={field}
              readOnly
              value=""
              placeholder={field}
              className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-zinc-400 outline-none"
            />
          ))}

          <button className={`rounded-2xl px-5 py-3 text-sm font-semibold sm:col-span-2 ${getPrimaryButtonClass(tone)}`}>
            {model.booking.buttonLabel}
          </button>
        </div>
      </div>
    </div>
  </section>
);

const LandingServices = ({
  model,
  tone,
  progress,
}) => (
  <section
    className={`border-t border-white/[0.08] px-6 py-8 transition-all duration-700 md:px-10 ${
      progress >= 68 ? 'opacity-100' : 'opacity-20'
    }`}
  >
    <div className="max-w-3xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
        Tratamientos y servicios
      </p>

      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-white">
        {model.sectionTitle}
      </h2>

      <p className="mt-4 text-sm leading-7 text-zinc-400">
        {model.sectionText}
      </p>
    </div>

    <div className="mt-7 grid gap-4 lg:grid-cols-3">
      {model.services.map((service, index) => (
        <article
          key={`${service.title}-${index}`}
          className={`rounded-[26px] border p-5 transition-all duration-700 ${getPanelClass(tone)} ${
            progress >= 72 + index * 4 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-20'
          }`}
        >
          <div className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold ${getAccentClass(tone)}`}>
            {index + 1}
          </div>

          <h3 className="text-xl font-semibold tracking-[-0.04em] text-white">
            {truncateText(service.title, 56)}
          </h3>

          <p className="mt-4 text-sm leading-7 text-zinc-400">
            {service.text}
          </p>
        </article>
      ))}
    </div>
  </section>
);

const LandingTrustTechnology = ({
  model,
  tone,
  progress,
}) => (
  <section
    className={`border-t border-white/[0.08] px-6 py-8 transition-all duration-700 md:px-10 ${
      progress >= 78 ? 'opacity-100' : 'opacity-20'
    }`}
  >
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <article className={`rounded-[28px] border p-6 ${getPanelClass(tone)}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
          Confianza médica
        </p>

        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
          Seguridad antes de reservar
        </h2>

        <div className="mt-6 grid gap-3">
          {model.trust.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm text-zinc-300"
            >
              {item}
            </div>
          ))}
        </div>
      </article>

      <article className={`rounded-[28px] border p-6 ${getPanelClass(tone)}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
          Tecnología y seguimiento
        </p>

        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
          Un sistema preparado para captar y atender mejor
        </h2>

        <p className="mt-4 text-sm leading-7 text-zinc-400">
          La landing presenta valor al paciente y deja preparada una evolución comercial hacia reservas, emails, automatizaciones y seguimiento.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {model.technology.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm text-zinc-300"
            >
              {item}
            </div>
          ))}
        </div>
      </article>
    </div>
  </section>
);

const LandingTestimonials = ({
  model,
  tone,
  progress,
}) => (
  <section
    className={`border-t border-white/[0.08] px-6 py-8 transition-all duration-700 md:px-10 ${
      progress >= 86 ? 'opacity-100' : 'opacity-20'
    }`}
  >
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
          Prueba social
        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-white">
          Pacientes que entienden el valor antes de llamar
        </h2>
      </div>

      <span className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${getAccentClass(tone)}`}>
        Testimonios preparados
      </span>
    </div>

    <div className="mt-7 grid gap-4 lg:grid-cols-2">
      {model.testimonials.map((testimonial, index) => (
        <article
          key={`${testimonial.author}-${index}`}
          className={`rounded-[26px] border p-6 ${getPanelClass(tone)}`}
        >
          <p className="text-lg leading-8 text-white">
            “{testimonial.quote}”
          </p>

          <p className="mt-5 text-sm font-semibold text-zinc-400">
            {testimonial.author}
          </p>
        </article>
      ))}
    </div>
  </section>
);

const LandingAutomationCTA = ({
  model,
  tone,
  progress,
}) => (
  <section
    className={`border-t border-white/[0.08] px-6 py-8 transition-all duration-700 md:px-10 ${
      progress >= 92 ? 'opacity-100' : 'opacity-20'
    }`}
  >
    <div className={`rounded-[30px] border p-6 md:p-8 ${getPanelClass(tone)}`}>
      <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Captación automatizable
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-white">
            {model.automation.title}
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            {model.automation.text}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button className={`rounded-2xl px-6 py-3.5 text-sm font-semibold ${getPrimaryButtonClass(tone)}`}>
              {model.primaryCTA}
            </button>

            <button className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white">
              Solicitar demo del sistema
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {model.automation.items.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-4 text-sm text-zinc-300"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const ClientLandingPreview = ({
  copy,
  project,
  progress,
  builderIntelligence,
}) => {
  const model = useMemo(
    () =>
      buildLandingModel({
        copy,
        project,
        builderIntelligence,
      }),
    [
      copy,
      project,
      builderIntelligence,
    ]
  );

  const tone = resolvePreviewTone(builderIntelligence, model.tone);

  return (
    <div className={`h-full overflow-y-auto ${getPreviewSurfaceClass(tone)}`}>
      <LandingHero
        model={model}
        tone={tone}
        progress={progress}
      />

      <LandingServices
        model={model}
        tone={tone}
        progress={progress}
      />

      <LandingTrustTechnology
        model={model}
        tone={tone}
        progress={progress}
      />

      <LandingTestimonials
        model={model}
        tone={tone}
        progress={progress}
      />

      <LandingAutomationCTA
        model={model}
        tone={tone}
        progress={progress}
      />
    </div>
  );
};

const CodeCanvas = ({
  copy,
  project,
  progress,
  activeCodeTab,
  onCodeTabChange,
  intent = {},
  visualState = {},
  codeSnapshot = null,
}) => {
  const lines = useMemo(
    () =>
      getBuilderCodeLines({
        tab: activeCodeTab,
        copy,
        project,
        intent,
        visualState,
        codeSnapshot,
      }),
    [
      activeCodeTab,
      copy,
      project,
      intent,
      visualState,
      codeSnapshot,
    ]
  );

  const visibleLines = useMemo(
    () => getVisibleCodeLines(lines, progress),
    [
      lines,
      progress,
    ]
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#020405] font-mono">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Código del proyecto
          </p>

          {codeSnapshot?.entryFile && (
            <p className="mt-1 text-[10px] text-cyan-200/80">
              {codeSnapshot.entryFile}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {BUILDER_CODE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onCodeTabChange(tab.id)}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                activeCodeTab === tab.id
                  ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100'
                  : 'border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 text-xs leading-6 text-zinc-300">
        {visibleLines.map((line, index) => (
          <div
            key={`${line}-${index}`}
            className="grid grid-cols-[34px_1fr] gap-3"
          >
            <span className="select-none text-right text-zinc-700">
              {index + 1}
            </span>

            <span
              className={
                line.includes('button') ||
                line.includes('h1') ||
                line.includes('CTA') ||
                line.includes('primary')
                  ? 'text-cyan-200'
                  : line.includes('const') ||
                      line.includes('export') ||
                      line.includes('def ') ||
                      line.includes('class ')
                    ? 'text-emerald-200'
                    : line.includes('{') || line.includes('}')
                      ? 'text-amber-100'
                      : 'text-zinc-300'
              }
            >
              {line || ' '}
            </span>
          </div>
        ))}

        {progress < 100 && (
          <div className="grid grid-cols-[34px_1fr] gap-3">
            <span className="select-none text-right text-zinc-700">
              {visibleLines.length + 1}
            </span>

            <span className="text-cyan-300">
              <span className="inline-block h-4 w-[7px] translate-y-[2px] animate-pulse bg-cyan-300" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const BlueprintCompact = ({ project }) => {
  const blueprint = project?.blueprint;
  const priorities = getArray(blueprint?.priorities);
  const components = getArray(blueprint?.architecture?.components);
  const steps = getArray(blueprint?.deployment_steps);

  return (
    <div className="h-full overflow-y-auto p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
        Blueprint
      </p>

      <h2 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.05em] text-white">
        {blueprint?.title || 'Blueprint pendiente'}
      </h2>

      <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-400">
        {blueprint?.summary ||
          'El blueprint queda como base interna para informe, PDF y preparación estructural. Builder mantiene foco en construcción.'}
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-white">Prioridades</p>

          <ul className="mt-4 space-y-3">
            {(priorities.length ? priorities : ['Pendiente']).map((item) => (
              <li key={item} className="text-sm leading-6 text-zinc-400">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-white">Componentes</p>

          <ul className="mt-4 space-y-3">
            {(components.length ? components : ['Pendiente']).map((item) => (
              <li key={item} className="text-sm leading-6 text-zinc-400">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-white">Salida</p>

          <ul className="mt-4 space-y-3">
            {(steps.length ? steps : ['Pendiente de motor Builder']).map((item) => (
              <li key={item} className="text-sm leading-6 text-zinc-400">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const BuilderStructureCompact = ({ project, builderIntelligence }) => {
  const { structureSnapshot, buildSummary } = getBuilderIntelligenceParts(builderIntelligence);

  const folders = getArray(structureSnapshot?.folders);
  const files = getArray(structureSnapshot?.files);
  const routes = getArray(structureSnapshot?.routes);
  const apiRoutes = getArray(structureSnapshot?.apiRoutes);

  const hasStructure =
    folders.length ||
    files.length ||
    routes.length ||
    apiRoutes.length;

  if (!hasStructure) {
    return <BlueprintCompact project={project} />;
  }

  const groups = [
    {
      label: 'Carpetas',
      items: folders,
    },
    {
      label: 'Archivos',
      items: files,
    },
    {
      label: 'Rutas',
      items: routes,
    },
    {
      label: 'API',
      items: apiRoutes,
    },
  ].filter((group) => group.items.length);

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Estructura viva
          </p>

          <h2 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.05em] text-white">
            Carpetas, archivos y rutas generadas por el Builder
          </h2>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-400">
            Esta estructura sale del estado de construcción y permite preparar una salida técnica coherente.
          </p>
        </div>

        {buildSummary && (
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] px-4 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
              Estado
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {buildSummary.filesCount || 0} archivos · {buildSummary.foldersCount || 0} carpetas
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
          <section
            key={group.label}
            className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5"
          >
            <p className="text-sm font-semibold text-white">
              {group.label}
            </p>

            <div className="mt-4 space-y-2">
              {group.items.slice(0, 12).map((item, index) => (
                <div
                  key={`${group.label}-${item}-${index}`}
                  className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3 font-mono text-xs text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

const DeployPanel = ({ project, kind = 'deploy' }) => (
  <div className="h-full overflow-y-auto p-5">
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
      {kind === 'github' ? 'GitHub' : 'Deploy'}
    </p>

    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
      {kind === 'github'
        ? 'Conexión GitHub pendiente del motor Builder'
        : 'Salida técnica pendiente del motor Builder'}
    </h2>

    <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
      El proyecto {project?.project_id || 'actual'} ya tiene diagnóstico. La siguiente fase debe generar archivos reales antes de activar salida técnica.
    </p>

    <div className="mt-5 grid gap-4 md:grid-cols-3">
      {(kind === 'github'
        ? ['Generar archivos', 'Crear repositorio', 'Sincronizar cambios']
        : ['Generar archivos', 'Preparar entorno', 'Publicar versión']
      ).map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5"
        >
          <p className="text-sm font-semibold text-white">{item}</p>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Pendiente de salida técnica validada.
          </p>
        </div>
      ))}
    </div>
  </div>
);

export default function BuilderCanvasPane({
  activeWorkspaceTab = 'preview',
  copy,
  project,
  progress,
  activeCodeTab,
  onCodeTabChange,
  builderIntelligence = null,
}) {
  const landingCopy = useMemo(
    () =>
      buildLandingModel({
        copy,
        project,
        builderIntelligence,
      }),
    [
      copy,
      project,
      builderIntelligence,
    ]
  );

  const {
    hubSummary,
    lastDelta,
    codeSnapshot,
  } = getBuilderIntelligenceParts(builderIntelligence);

  if (activeWorkspaceTab === 'code') {
    return (
      <CodeCanvas
        copy={landingCopy}
        project={project}
        progress={progress}
        activeCodeTab={activeCodeTab}
        onCodeTabChange={onCodeTabChange}
        intent={hubSummary}
        visualState={lastDelta?.visual || {}}
        codeSnapshot={codeSnapshot}
      />
    );
  }

  if (activeWorkspaceTab === 'extract') {
    return (
      <BuilderExtractionPanel
        copy={landingCopy}
        project={project}
        progress={progress}
        builderIntelligence={builderIntelligence}
      />
    );
  }

  if (activeWorkspaceTab === 'structure') {
    return (
      <BuilderStructureCompact
        project={project}
        builderIntelligence={builderIntelligence}
      />
    );
  }

  if (activeWorkspaceTab === 'deploy') {
    return <DeployPanel project={project} kind="deploy" />;
  }

  if (activeWorkspaceTab === 'github') {
    return <DeployPanel project={project} kind="github" />;
  }

  return (
    <ClientLandingPreview
      copy={copy}
      project={project}
      progress={progress}
      builderIntelligence={builderIntelligence}
    />
  );
}