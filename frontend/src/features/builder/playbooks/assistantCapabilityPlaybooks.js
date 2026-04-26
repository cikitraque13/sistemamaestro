export const ASSISTANT_CAPABILITY_IDS = Object.freeze({
  OFFER_CREATION: 'offer_creation',
  LANDING_CONVERSION: 'landing_conversion',
  ADS_CREATION: 'ads_creation',
  EMAIL_SEQUENCE: 'email_sequence',
  DM_WHATSAPP_SALES: 'dm_whatsapp_sales',
  SEO_CLUSTER_BRIEFS: 'seo_cluster_briefs',
  AUTOMATION_FLOW: 'automation_flow',
  IDEA_VALIDATION: 'idea_validation',
});

export const DEFAULT_ASSISTANT_CAPABILITY_ID = ASSISTANT_CAPABILITY_IDS.LANDING_CONVERSION;

export const ASSISTANT_CAPABILITY_PLAYBOOKS = Object.freeze({
  [ASSISTANT_CAPABILITY_IDS.OFFER_CREATION]: {
    id: ASSISTANT_CAPABILITY_IDS.OFFER_CREATION,
    label: 'Oferta irresistible',
    description:
      'Capacidad para convertir un producto, servicio o idea en una oferta clara, vendible y orientada a conversión.',
    derivedFrom:
      'Asistente de creación de oferta: producto, cliente ideal, propuesta de valor, beneficios, reducción de riesgo y oportunidad.',
    suitableFor: [
      'servicio profesional',
      'producto digital',
      'consultoría',
      'mentoría',
      'curso',
      'servicio high-ticket',
      'producto físico',
      'herramienta IA',
    ],
    requiredInputs: [
      {
        id: 'product',
        label: 'Producto o servicio',
        purpose:
          'Entender qué se vende y cuál es el resultado principal que promete.',
      },
      {
        id: 'idealCustomer',
        label: 'Cliente ideal',
        purpose:
          'Definir a quién va dirigida la oferta y qué problema necesita resolver.',
      },
      {
        id: 'mainPain',
        label: 'Dolor principal',
        purpose:
          'Detectar el problema que hace que la oferta sea relevante.',
      },
      {
        id: 'desiredOutcome',
        label: 'Resultado deseado',
        purpose:
          'Transformar características en resultado visible para el comprador.',
      },
    ],
    outputStructure: [
      'propuesta de valor',
      'beneficios principales',
      'mecanismo de diferenciación',
      'reducción de riesgo',
      'bonos o elementos de valor',
      'CTA recomendado',
      'ángulo de venta principal',
    ],
    conversionRules: [
      'La oferta debe explicar resultado, público y mecanismo.',
      'No vender solo características; traducir a transformación o beneficio.',
      'Toda oferta debe reducir riesgo percibido.',
      'El CTA debe corresponder al nivel de ticket.',
      'Si el ticket es alto, priorizar diagnóstico o aplicación antes que compra directa.',
    ],
    smartQuestions: [
      '¿La oferta es de bajo ticket, medio ticket o alto ticket?',
      '¿El comprador necesita confiar, entender o actuar rápido?',
      '¿La oferta debe venderse por compra directa, llamada, diagnóstico o solicitud?',
    ],
    agentCue:
      'Activaré la capacidad de oferta: propuesta de valor, beneficio principal, reducción de riesgo, diferenciación y CTA adecuado.',
  },

  [ASSISTANT_CAPABILITY_IDS.LANDING_CONVERSION]: {
    id: ASSISTANT_CAPABILITY_IDS.LANDING_CONVERSION,
    label: 'Landing que convierte',
    description:
      'Capacidad para estructurar una landing con titular, subtítulo, beneficios, prueba social, objeciones y CTA final.',
    derivedFrom:
      'Asistente de landing optimizada para conversión: objetivo, beneficios, audiencia y llamada a la acción.',
    suitableFor: [
      'landing de captación',
      'landing de venta',
      'landing high-ticket',
      'landing de curso',
      'landing SaaS',
      'landing de producto',
      'lista de espera',
      'landing de diagnóstico',
    ],
    requiredInputs: [
      {
        id: 'goal',
        label: 'Objetivo de la landing',
        purpose:
          'Determinar si la página debe captar leads, vender, reservar llamada, validar o activar registro.',
      },
      {
        id: 'audience',
        label: 'Audiencia objetivo',
        purpose:
          'Adaptar lenguaje, objeciones, CTA y prueba social al usuario correcto.',
      },
      {
        id: 'benefits',
        label: 'Beneficios principales',
        purpose:
          'Construir la promesa y las secciones de valor.',
      },
      {
        id: 'conversionAction',
        label: 'Acción principal',
        purpose:
          'Definir el CTA dominante y reducir dispersión.',
      },
    ],
    outputStructure: [
      'hero',
      'subtítulo',
      'problema',
      'solución',
      'beneficios',
      'prueba social',
      'objeciones',
      'CTA final',
    ],
    conversionRules: [
      'El hero debe explicar qué es, para quién es y qué acción tomar.',
      'La landing debe tener una acción principal dominante.',
      'La prueba social debe aparecer antes del cierre si hay riesgo percibido.',
      'Las objeciones deben resolverse antes del CTA final.',
      'No convertir la landing en un informe; debe conducir a acción.',
    ],
    smartQuestions: [
      '¿La acción principal debe ser registro, compra, reserva, diagnóstico o WhatsApp?',
      '¿El usuario llega frío o ya conoce la oferta?',
      '¿Quieres una landing más directa, más premium o más educativa?',
    ],
    agentCue:
      'Activaré la capacidad de landing: hero claro, estructura de decisión, beneficios, confianza y CTA final.',
  },

  [ASSISTANT_CAPABILITY_IDS.ADS_CREATION]: {
    id: ASSISTANT_CAPABILITY_IDS.ADS_CREATION,
    label: 'Anuncios Meta / TikTok',
    description:
      'Capacidad para generar ángulos creativos, mensajes de anuncio y variantes para captación o venta en redes.',
    derivedFrom:
      'Asistente de anuncios para Meta/TikTok: producto, beneficio principal y objetivo de campaña.',
    suitableFor: [
      'campaña Meta Ads',
      'campaña TikTok',
      'captación de leads',
      'venta de producto',
      'lanzamiento',
      'promoción de curso',
      'servicio local',
      'contenido UGC',
    ],
    requiredInputs: [
      {
        id: 'product',
        label: 'Producto o servicio',
        purpose:
          'Definir qué se anuncia.',
      },
      {
        id: 'mainBenefit',
        label: 'Beneficio principal',
        purpose:
          'Convertir la ventaja en gancho publicitario.',
      },
      {
        id: 'campaignGoal',
        label: 'Objetivo de campaña',
        purpose:
          'Ajustar mensaje según tráfico, leads, ventas, reservas o reconocimiento.',
      },
      {
        id: 'audience',
        label: 'Audiencia',
        purpose:
          'Adaptar tono, dolor, deseo y formato del anuncio.',
      },
    ],
    outputStructure: [
      'ángulos creativos',
      'hooks',
      'copy corto',
      'copy medio',
      'CTA de anuncio',
      'objeciones atacadas',
      'variantes de prueba',
    ],
    conversionRules: [
      'Cada anuncio debe tener un solo ángulo principal.',
      'El primer segundo debe activar atención o identificación.',
      'El copy debe conectar dolor, deseo y acción.',
      'No usar claims demasiado absolutos sin soporte.',
      'Las variantes deben probar ángulos distintos, no solo cambiar palabras.',
    ],
    smartQuestions: [
      '¿La campaña busca leads, ventas, reservas o tráfico?',
      '¿El anuncio debe ser más directo, educativo, aspiracional o demostrativo?',
      '¿El público conoce ya la marca o es tráfico frío?',
    ],
    agentCue:
      'Activaré la capacidad de anuncios: ángulos, hooks, variantes, objeciones y CTA por objetivo de campaña.',
  },

  [ASSISTANT_CAPABILITY_IDS.EMAIL_SEQUENCE]: {
    id: ASSISTANT_CAPABILITY_IDS.EMAIL_SEQUENCE,
    label: 'Secuencia de emails de venta',
    description:
      'Capacidad para crear secuencias de emails de 3 a 5 piezas orientadas a conversión, nutrición o cierre.',
    derivedFrom:
      'Asistente de secuencia de emails: producto, beneficios, audiencia y conversión de suscriptores en clientes.',
    suitableFor: [
      'newsletter comercial',
      'lanzamiento',
      'curso',
      'producto digital',
      'servicio profesional',
      'recuperación de leads',
      'onboarding',
      'venta por email',
    ],
    requiredInputs: [
      {
        id: 'product',
        label: 'Producto o servicio',
        purpose:
          'Definir qué se vende o activa.',
      },
      {
        id: 'benefits',
        label: 'Beneficios principales',
        purpose:
          'Construir argumentos de valor por email.',
      },
      {
        id: 'audience',
        label: 'Audiencia',
        purpose:
          'Ajustar tono, nivel de conciencia y objeciones.',
      },
      {
        id: 'sequenceGoal',
        label: 'Objetivo de la secuencia',
        purpose:
          'Determinar si la secuencia educa, vende, reactiva, lanza o cierra.',
      },
    ],
    outputStructure: [
      'email 1: contexto y promesa',
      'email 2: problema y oportunidad',
      'email 3: prueba o método',
      'email 4: objeciones',
      'email 5: cierre y CTA',
    ],
    conversionRules: [
      'Cada email debe tener una función dentro de la secuencia.',
      'No intentar vender todo en el primer email si el lead está frío.',
      'El CTA debe ser coherente con el momento de decisión.',
      'La secuencia debe tratar objeciones antes del cierre.',
      'El asunto debe prometer valor, no solo abrir por curiosidad vacía.',
    ],
    smartQuestions: [
      '¿La secuencia es para leads fríos, leads templados o usuarios ya registrados?',
      '¿El CTA final debe ser compra, llamada, reserva, diagnóstico o respuesta al email?',
      '¿Quieres una secuencia más educativa, más directa o más premium?',
    ],
    agentCue:
      'Activaré la capacidad de emails: secuencia por intención, objeciones, prueba, cierre y CTA progresivo.',
  },

  [ASSISTANT_CAPABILITY_IDS.DM_WHATSAPP_SALES]: {
    id: ASSISTANT_CAPABILITY_IDS.DM_WHATSAPP_SALES,
    label: 'DM / WhatsApp de cierre natural',
    description:
      'Capacidad para crear mensajes de venta conversacional en DM o WhatsApp, manejando objeciones sin sonar agresivo.',
    derivedFrom:
      'Asistente de DM/WhatsApp: producto, cliente, objeciones y cierre natural.',
    suitableFor: [
      'venta por WhatsApp',
      'negocio local',
      'servicio profesional',
      'coaching',
      'curso',
      'inmobiliaria',
      'clínica',
      'agencia',
      'venta consultiva',
    ],
    requiredInputs: [
      {
        id: 'product',
        label: 'Producto o servicio',
        purpose:
          'Entender qué se ofrece en la conversación.',
      },
      {
        id: 'customerContext',
        label: 'Contexto del cliente',
        purpose:
          'Saber qué necesita, qué duda tiene y en qué fase está.',
      },
      {
        id: 'objections',
        label: 'Objeciones',
        purpose:
          'Preparar respuestas naturales a precio, confianza, tiempo o decisión.',
      },
      {
        id: 'desiredAction',
        label: 'Acción deseada',
        purpose:
          'Definir si se busca llamada, reserva, pago, visita o respuesta.',
      },
    ],
    outputStructure: [
      'mensaje de apertura',
      'pregunta de diagnóstico',
      'respuesta a objeción',
      'refuerzo de valor',
      'cierre natural',
      'seguimiento si no responde',
    ],
    conversionRules: [
      'El mensaje debe sonar humano y específico.',
      'No cerrar antes de entender la objeción.',
      'El CTA debe ser una acción simple y conversacional.',
      'Evitar presión artificial si el producto requiere confianza.',
      'Usar preguntas cortas para avanzar la conversación.',
    ],
    smartQuestions: [
      '¿El cliente ya pidió información o es un primer contacto?',
      '¿La objeción principal es precio, confianza, tiempo o comparación?',
      '¿Quieres llevarlo a llamada, reserva, pago o visita?',
    ],
    agentCue:
      'Activaré la capacidad de DM/WhatsApp: conversación natural, objeciones, refuerzo de valor y cierre simple.',
  },

  [ASSISTANT_CAPABILITY_IDS.SEO_CLUSTER_BRIEFS]: {
    id: ASSISTANT_CAPABILITY_IDS.SEO_CLUSTER_BRIEFS,
    label: 'SEO: cluster + briefs',
    description:
      'Capacidad para generar clusters de contenido, briefs, títulos, estructura y FAQs para captación orgánica.',
    derivedFrom:
      'Asistente SEO: tema principal, objetivo del contenido, clusters, briefs, títulos, estructura y FAQs.',
    suitableFor: [
      'blog monetizable',
      'SEO nicho',
      'contenido de autoridad',
      'página de servicios',
      'ecommerce',
      'SaaS',
      'educación',
      'marca personal',
      'estrategia de contenidos',
    ],
    requiredInputs: [
      {
        id: 'topic',
        label: 'Tema principal',
        purpose:
          'Definir el nicho o área semántica.',
      },
      {
        id: 'contentGoal',
        label: 'Objetivo del contenido',
        purpose:
          'Distinguir si se busca informar, captar leads, vender o apoyar autoridad.',
      },
      {
        id: 'audience',
        label: 'Audiencia',
        purpose:
          'Ajustar intención de búsqueda, profundidad y lenguaje.',
      },
      {
        id: 'businessModel',
        label: 'Modelo de negocio',
        purpose:
          'Conectar contenido con monetización, servicios, afiliación, captación o producto.',
      },
    ],
    outputStructure: [
      'cluster principal',
      'subclusters',
      'briefs de artículos',
      'títulos SEO',
      'intención de búsqueda',
      'estructura H2/H3',
      'FAQs',
      'CTA contextual',
    ],
    conversionRules: [
      'El SEO no debe vivir separado de la conversión.',
      'Cada contenido debe tener una intención y una acción siguiente.',
      'Los clusters deben evitar canibalización.',
      'El brief debe indicar público, objetivo y CTA.',
      'Las FAQs deben responder dudas reales antes de convertir.',
    ],
    smartQuestions: [
      '¿El contenido busca tráfico, leads, ventas, autoridad o afiliación?',
      '¿Quieres atacar un nicho amplio o un cluster muy específico?',
      '¿El CTA del contenido será registro, compra, consulta, newsletter o recurso?',
    ],
    agentCue:
      'Activaré la capacidad SEO: cluster, intención, briefs, estructura, FAQs y CTA contextual.',
  },

  [ASSISTANT_CAPABILITY_IDS.AUTOMATION_FLOW]: {
    id: ASSISTANT_CAPABILITY_IDS.AUTOMATION_FLOW,
    label: 'Automatización Make / Zapier',
    description:
      'Capacidad para diseñar flujos automáticos con pasos, herramientas, entradas, salidas y validaciones.',
    derivedFrom:
      'Asistente de automatización: proceso a automatizar, herramientas implicadas, pasos y prompts necesarios.',
    suitableFor: [
      'automatización de emails',
      'CRM',
      'formularios',
      'calendario',
      'facturas',
      'notificaciones',
      'soporte',
      'lead management',
      'Make',
      'Zapier',
      'webhooks',
    ],
    requiredInputs: [
      {
        id: 'process',
        label: 'Proceso a automatizar',
        purpose:
          'Detectar el flujo real que se quiere mejorar.',
      },
      {
        id: 'tools',
        label: 'Herramientas implicadas',
        purpose:
          'Identificar sistemas conectados: CRM, email, sheets, formularios, calendario, WhatsApp, etc.',
      },
      {
        id: 'trigger',
        label: 'Evento de inicio',
        purpose:
          'Definir qué dispara la automatización.',
      },
      {
        id: 'expectedOutput',
        label: 'Salida esperada',
        purpose:
          'Determinar qué debe producir el sistema al final.',
      },
    ],
    outputStructure: [
      'trigger',
      'pasos del flujo',
      'herramientas',
      'condiciones',
      'validaciones',
      'salidas',
      'errores posibles',
      'revisión humana',
    ],
    conversionRules: [
      'No diseñar automatización sin entrada y salida claras.',
      'Cada paso debe tener una herramienta o responsable.',
      'Las excepciones deben definirse desde el inicio.',
      'La revisión humana debe aparecer cuando haya riesgo.',
      'El primer flujo debe ser concreto, no una automatización total indefinida.',
    ],
    smartQuestions: [
      '¿Qué evento inicia la automatización?',
      '¿Qué herramientas deben conectarse?',
      '¿Qué debe ocurrir si falta información o hay un error?',
    ],
    agentCue:
      'Activaré la capacidad de automatización: trigger, herramientas, pasos, condiciones, salidas y control de errores.',
  },

  [ASSISTANT_CAPABILITY_IDS.IDEA_VALIDATION]: {
    id: ASSISTANT_CAPABILITY_IDS.IDEA_VALIDATION,
    label: 'Validador de idea monetizable',
    description:
      'Capacidad para evaluar si una idea de producto, servicio o proyecto tiene potencial comercial y qué siguiente paso conviene.',
    derivedFrom:
      'Asistente de validación: idea, mercado objetivo, monetización y siguientes pasos.',
    suitableFor: [
      'idea de negocio',
      'producto digital',
      'SaaS',
      'servicio nuevo',
      'contenido premium',
      'comunidad',
      'plantilla',
      'herramienta IA',
      'startup',
      'side project',
    ],
    requiredInputs: [
      {
        id: 'idea',
        label: 'Idea',
        purpose:
          'Entender qué quiere crear el usuario.',
      },
      {
        id: 'market',
        label: 'Mercado objetivo',
        purpose:
          'Determinar quién podría pagar, usar o recomendar la solución.',
      },
      {
        id: 'pain',
        label: 'Problema',
        purpose:
          'Validar si existe una necesidad real.',
      },
      {
        id: 'monetization',
        label: 'Monetización prevista',
        purpose:
          'Distinguir entre suscripción, pago puntual, servicios, afiliación, créditos o venta directa.',
      },
    ],
    outputStructure: [
      'potencial de mercado',
      'cliente objetivo',
      'problema real',
      'riesgos',
      'modelo de monetización',
      'MVP recomendado',
      'primer CTA',
      'siguiente prueba',
    ],
    conversionRules: [
      'No validar una idea solo por parecer interesante.',
      'Debe existir usuario, problema, solución y forma de monetizar.',
      'El MVP debe ser pequeño y comprobable.',
      'La primera landing debe capturar señal real: lead, pago, reserva o respuesta.',
      'Si la idea es ambigua, pedir una decisión de mercado o caso de uso.',
    ],
    smartQuestions: [
      '¿Quién pagaría por esta idea?',
      '¿Qué problema urgente o caro resuelve?',
      '¿Quieres validarla con landing, lista de espera, preventa o entrevista?',
    ],
    agentCue:
      'Activaré la capacidad de validación: mercado, problema, monetización, MVP y primera prueba real.',
  },
});

export const ASSISTANT_CAPABILITY_ALIASES = Object.freeze({
  [ASSISTANT_CAPABILITY_IDS.OFFER_CREATION]: [
    'oferta',
    'oferta irresistible',
    'propuesta de valor',
    'producto',
    'servicio',
    'beneficios',
    'cliente ideal',
    'buyer persona',
    'garantia',
    'garantía',
    'precio',
  ],
  [ASSISTANT_CAPABILITY_IDS.LANDING_CONVERSION]: [
    'landing',
    'landing page',
    'pagina de venta',
    'página de venta',
    'captar leads',
    'convertir',
    'conversion',
    'conversión',
    'cta',
    'llamada a la accion',
    'llamada a la acción',
  ],
  [ASSISTANT_CAPABILITY_IDS.ADS_CREATION]: [
    'anuncios',
    'meta ads',
    'facebook ads',
    'instagram ads',
    'tiktok',
    'campaña',
    'campana',
    'trafico',
    'tráfico',
    'creativos',
    'hooks',
  ],
  [ASSISTANT_CAPABILITY_IDS.EMAIL_SEQUENCE]: [
    'emails',
    'email',
    'secuencia',
    'newsletter',
    'suscriptores',
    'email marketing',
    'venta por email',
    'lanzamiento',
    'seguimiento',
  ],
  [ASSISTANT_CAPABILITY_IDS.DM_WHATSAPP_SALES]: [
    'dm',
    'whatsapp',
    'mensaje',
    'mensajes',
    'cerrar ventas',
    'objeciones',
    'cierre natural',
    'chat',
    'conversacion',
    'conversación',
  ],
  [ASSISTANT_CAPABILITY_IDS.SEO_CLUSTER_BRIEFS]: [
    'seo',
    'cluster',
    'brief',
    'briefs',
    'palabras clave',
    'keywords',
    'articulos',
    'artículos',
    'blog',
    'faqs',
    'contenido seo',
  ],
  [ASSISTANT_CAPABILITY_IDS.AUTOMATION_FLOW]: [
    'automatizacion',
    'automatización',
    'automatizar',
    'make',
    'zapier',
    'workflow',
    'flujo',
    'crm',
    'webhook',
    'herramientas',
    'proceso',
  ],
  [ASSISTANT_CAPABILITY_IDS.IDEA_VALIDATION]: [
    'validar idea',
    'validacion',
    'validación',
    'idea monetizable',
    'monetizable',
    'mvp',
    'mercado',
    'preventa',
    'lista de espera',
    'startup',
    'side project',
  ],
});

export const ASSISTANT_CAPABILITY_PRIORITY = Object.freeze([
  ASSISTANT_CAPABILITY_IDS.LANDING_CONVERSION,
  ASSISTANT_CAPABILITY_IDS.OFFER_CREATION,
  ASSISTANT_CAPABILITY_IDS.IDEA_VALIDATION,
  ASSISTANT_CAPABILITY_IDS.AUTOMATION_FLOW,
  ASSISTANT_CAPABILITY_IDS.SEO_CLUSTER_BRIEFS,
  ASSISTANT_CAPABILITY_IDS.EMAIL_SEQUENCE,
  ASSISTANT_CAPABILITY_IDS.ADS_CREATION,
  ASSISTANT_CAPABILITY_IDS.DM_WHATSAPP_SALES,
]);

export const listAssistantCapabilityPlaybooks = () =>
  Object.values(ASSISTANT_CAPABILITY_PLAYBOOKS);

export const getAssistantCapabilityPlaybook = (
  capabilityId = DEFAULT_ASSISTANT_CAPABILITY_ID
) =>
  ASSISTANT_CAPABILITY_PLAYBOOKS[capabilityId] ||
  ASSISTANT_CAPABILITY_PLAYBOOKS[DEFAULT_ASSISTANT_CAPABILITY_ID];

export const getAssistantCapabilityAliases = (
  capabilityId = DEFAULT_ASSISTANT_CAPABILITY_ID
) => ASSISTANT_CAPABILITY_ALIASES[capabilityId] || [];

export const findAssistantCapabilityIdByAlias = (normalizedText = '') => {
  const value = String(normalizedText || '').toLowerCase();

  if (!value) return DEFAULT_ASSISTANT_CAPABILITY_ID;

  const matches = Object.entries(ASSISTANT_CAPABILITY_ALIASES)
    .map(([capabilityId, aliases]) => {
      const score = aliases.reduce((total, alias) => {
        const candidate = String(alias || '').toLowerCase();
        return value.includes(candidate) ? total + 1 : total;
      }, 0);

      return {
        capabilityId,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      return (
        ASSISTANT_CAPABILITY_PRIORITY.indexOf(a.capabilityId) -
        ASSISTANT_CAPABILITY_PRIORITY.indexOf(b.capabilityId)
      );
    });

  return matches[0]?.capabilityId || DEFAULT_ASSISTANT_CAPABILITY_ID;
};

export const getAssistantCapabilitySummary = (
  capabilityId = DEFAULT_ASSISTANT_CAPABILITY_ID
) => {
  const playbook = getAssistantCapabilityPlaybook(capabilityId);

  return {
    id: playbook.id,
    label: playbook.label,
    description: playbook.description,
    suitableFor: playbook.suitableFor,
    requiredInputs: playbook.requiredInputs,
    outputStructure: playbook.outputStructure,
    conversionRules: playbook.conversionRules,
    smartQuestions: playbook.smartQuestions,
    agentCue: playbook.agentCue,
  };
};