export const BUILDER_SECTOR_PROFILE_IDS = {
  FITNESS_MEMBERSHIP: 'fitness_membership',
  HEALTH_CLINIC: 'health_clinic',
  LOCAL_SERVICE_QUOTE: 'local_service_quote',
  PROFESSIONAL_SERVICES: 'professional_services',
  RETAIL_LOCAL_SHOP: 'retail_local_shop',
  HOSPITALITY_BOOKING: 'hospitality_booking',
  DIGITAL_PRODUCT_OR_SAAS: 'digital_product_or_saas',
  AFFILIATE_CONTENT: 'affiliate_content',
  AUTOMATION_SERVICE: 'automation_service',
  GENERIC_BUSINESS_LANDING: 'generic_business_landing',
};

export const DEFAULT_SECTOR_PROFILE_ID =
  BUILDER_SECTOR_PROFILE_IDS.GENERIC_BUSINESS_LANDING;

export const BUILDER_SECTOR_PROFILES = {
  [BUILDER_SECTOR_PROFILE_IDS.FITNESS_MEMBERSHIP]: {
    id: BUILDER_SECTOR_PROFILE_IDS.FITNESS_MEMBERSHIP,
    label: 'Fitness / gimnasio',
    tone: 'premium',
    matchers: [
      'gimnasio',
      'fitness',
      'crossfit',
      'pilates',
      'yoga',
      'entrenador',
      'entrenamiento personal',
      'clases dirigidas',
      'socios',
      'membresia',
      'membresía',
    ],
    defaultBusinessName: 'Atlas Fit Studio',
    audienceLabel: 'socios',
    offerLabel: 'clases y entrenamiento',
    heroEyebrow: 'Centro fitness premium',
    headline: 'Entrena mejor desde tu primera clase',
    subheadline:
      'Clases dirigidas, entrenamiento personal y seguimiento real para personas que quieren mejorar su forma física con acompañamiento profesional.',
    primaryCTA: 'Reservar clase de prueba',
    secondaryCTA: 'Hablar por WhatsApp',
    servicesTitle: 'Programas pensados para activar nuevos socios',
    servicesIntro:
      'Una landing preparada para explicar la oferta, captar interesados y convertir visitas en pruebas gratuitas.',
    services: [
      {
        title: 'Clases dirigidas',
        text: 'Sesiones dinámicas para entrenar en grupo con energía, planificación y acompañamiento.',
      },
      {
        title: 'Entrenamiento personal',
        text: 'Planes individualizados para objetivos concretos: fuerza, pérdida de grasa, movilidad o rendimiento.',
      },
      {
        title: 'Planes flexibles',
        text: 'Opciones de acceso adaptadas a distintos niveles, horarios y objetivos de entrenamiento.',
      },
    ],
    trustTitle: 'Confianza antes de apuntarte',
    trustPoints: [
      'Entrenadores certificados',
      'Seguimiento personalizado',
      'Ambiente premium',
      'Prueba gratuita sin compromiso',
    ],
    processTitle: 'Cómo empezar',
    processSteps: [
      'Reserva una clase de prueba.',
      'Te orientamos según tu objetivo.',
      'Eliges el plan que mejor encaja contigo.',
    ],
    formTitle: 'Reserva tu clase de prueba',
    formText:
      'Deja tus datos y el equipo te contactará para confirmar horario, tipo de clase y disponibilidad.',
    formFields: ['Nombre', 'Teléfono', 'Objetivo', 'Horario preferido'],
    formButtonLabel: 'Solicitar prueba gratuita',
    testimonialTitle: 'Socios que ya entrenan mejor',
    testimonialLabel: 'Prueba social',
    testimonials: [
      {
        quote:
          'Me ayudaron a volver a entrenar con constancia y con un plan claro desde el primer día.',
        author: 'Socio de entrenamiento personal',
      },
      {
        quote:
          'La clase de prueba fue fácil de reservar y el ambiente me convenció al momento.',
        author: 'Nueva socia de clases dirigidas',
      },
    ],
    automationTitle: 'Después de reservar tu prueba',
    automationText:
      'Recibes confirmación, orientación inicial y un seguimiento para que llegues preparado a tu primera clase.',
    automationItems: [
      'Confirmación por WhatsApp o email',
      'Recordatorio de la clase',
      'Orientación según objetivo',
      'Seguimiento si quieres apuntarte',
    ],
    finalCTA: 'Reservar clase de prueba',
  },

  [BUILDER_SECTOR_PROFILE_IDS.HEALTH_CLINIC]: {
    id: BUILDER_SECTOR_PROFILE_IDS.HEALTH_CLINIC,
    label: 'Clínica / salud / estética',
    tone: 'premium',
    matchers: [
      'clinica',
      'clínica',
      'dental',
      'dentista',
      'odontologia',
      'odontología',
      'fisioterapia',
      'fisio',
      'psicologia',
      'psicología',
      'nutricion',
      'nutrición',
      'estetica',
      'estética',
      'medicina estetica',
      'tratamiento',
      'paciente',
    ],
    defaultBusinessName: 'Clínica Aurora',
    audienceLabel: 'pacientes',
    offerLabel: 'tratamientos',
    heroEyebrow: 'Clínica especializada',
    headline: 'Atención profesional desde la primera cita',
    subheadline:
      'Servicios especializados, diagnóstico claro y una experiencia cuidada para pacientes que buscan seguridad, confianza y resultados.',
    primaryCTA: 'Reservar cita',
    secondaryCTA: 'Solicitar valoración',
    servicesTitle: 'Tratamientos explicados con claridad',
    servicesIntro:
      'Una landing diseñada para presentar servicios, resolver dudas y convertir visitas en citas reales.',
    services: [
      {
        title: 'Valoración inicial',
        text: 'Primera revisión para entender el caso, explicar opciones y definir el siguiente paso.',
      },
      {
        title: 'Tratamientos especializados',
        text: 'Servicios presentados con claridad, beneficios, proceso y expectativas realistas.',
      },
      {
        title: 'Seguimiento profesional',
        text: 'Acompañamiento antes, durante y después del tratamiento para reforzar confianza.',
      },
    ],
    trustTitle: 'Confianza profesional',
    trustPoints: [
      'Equipo especializado',
      'Diagnóstico claro',
      'Tecnología avanzada',
      'Seguimiento cercano',
    ],
    processTitle: 'Cómo será tu primera cita',
    processSteps: [
      'Indicas el tratamiento o problema.',
      'El equipo revisa tu caso.',
      'Confirmamos cita y próximos pasos.',
    ],
    formTitle: 'Reserva tu valoración inicial',
    formText:
      'Completa tus datos y el equipo contactará contigo para confirmar día, hora y motivo de consulta.',
    formFields: ['Nombre', 'Teléfono', 'Tratamiento', 'Fecha preferida'],
    formButtonLabel: 'Solicitar cita',
    testimonialTitle: 'Pacientes que llegan con más confianza',
    testimonialLabel: 'Prueba social',
    testimonials: [
      {
        quote:
          'Me explicaron todas las opciones con claridad y pude decidir con tranquilidad.',
        author: 'Paciente de primera valoración',
      },
      {
        quote:
          'La reserva fue rápida y la atención transmitió mucha confianza desde el principio.',
        author: 'Paciente de tratamiento especializado',
      },
    ],
    automationTitle: 'Después de solicitar tu cita',
    automationText:
      'Recibes confirmación, recordatorio y seguimiento para que la experiencia sea clara desde el primer contacto.',
    automationItems: [
      'Confirmación de cita',
      'Recordatorio automático',
      'Segmentación por tratamiento',
      'Seguimiento si no confirma',
    ],
    finalCTA: 'Reservar cita',
  },

  [BUILDER_SECTOR_PROFILE_IDS.LOCAL_SERVICE_QUOTE]: {
    id: BUILDER_SECTOR_PROFILE_IDS.LOCAL_SERVICE_QUOTE,
    label: 'Servicio local / presupuesto',
    tone: 'direct',
    matchers: [
      'taller',
      'mecanico',
      'mecánico',
      'fontanero',
      'electricista',
      'reformas',
      'cerrajero',
      'limpieza',
      'mantenimiento',
      'reparacion',
      'reparación',
      'diagnosis',
      'presupuesto',
    ],
    defaultBusinessName: 'Servicio Técnico Local',
    audienceLabel: 'clientes',
    offerLabel: 'servicios',
    heroEyebrow: 'Servicio local profesional',
    headline: 'Solicita presupuesto sin complicaciones',
    subheadline:
      'Servicio rápido, diagnóstico claro y contacto directo para clientes que necesitan resolver un problema con confianza.',
    primaryCTA: 'Solicitar presupuesto',
    secondaryCTA: 'Enviar WhatsApp',
    servicesTitle: 'Servicios preparados para captar solicitudes',
    servicesIntro:
      'La landing explica qué haces, por qué confiar y cómo pedir presupuesto en pocos pasos.',
    services: [
      {
        title: 'Diagnóstico inicial',
        text: 'Recogida de datos para entender el problema y orientar la solución adecuada.',
      },
      {
        title: 'Servicio especializado',
        text: 'Presentación clara de reparaciones, trabajos o soluciones principales.',
      },
      {
        title: 'Presupuesto guiado',
        text: 'Formulario y CTA pensados para convertir visitas en solicitudes cualificadas.',
      },
    ],
    trustTitle: 'Confianza para pedir presupuesto',
    trustPoints: [
      'Respuesta rápida',
      'Trabajo con garantía',
      'Presupuesto claro',
      'Atención cercana',
    ],
    processTitle: 'Cómo funciona el servicio',
    processSteps: [
      'Describes el problema.',
      'El equipo revisa la solicitud.',
      'Recibes presupuesto o siguiente paso.',
    ],
    formTitle: 'Solicita presupuesto',
    formText:
      'Déjanos tus datos y una descripción del servicio que necesitas. Te contactaremos para confirmar detalles.',
    formFields: ['Nombre', 'Teléfono', 'Servicio', 'Descripción'],
    formButtonLabel: 'Pedir presupuesto',
    testimonialTitle: 'Clientes que resolvieron su problema',
    testimonialLabel: 'Opiniones',
    testimonials: [
      {
        quote:
          'Respondieron rápido, explicaron el trabajo y el presupuesto fue claro desde el principio.',
        author: 'Cliente de servicio local',
      },
      {
        quote:
          'La solicitud fue sencilla y recibí orientación sin tener que llamar varias veces.',
        author: 'Cliente con urgencia',
      },
    ],
    automationTitle: 'Después de pedir presupuesto',
    automationText:
      'El negocio recibe el aviso, clasifica la solicitud y puede hacer seguimiento de cada oportunidad.',
    automationItems: [
      'Aviso interno al equipo',
      'Clasificación por servicio',
      'Confirmación automática',
      'Seguimiento de presupuesto',
    ],
    finalCTA: 'Solicitar presupuesto',
  },

  [BUILDER_SECTOR_PROFILE_IDS.PROFESSIONAL_SERVICES]: {
    id: BUILDER_SECTOR_PROFILE_IDS.PROFESSIONAL_SERVICES,
    label: 'Servicios profesionales',
    tone: 'serious',
    matchers: [
      'gestoria',
      'gestoría',
      'asesoria',
      'asesoría',
      'abogado',
      'legal',
      'consultora',
      'consultoria',
      'consultoría',
      'agencia',
      'freelance',
      'autonomos',
      'autónomos',
      'empresa',
      'empresas',
    ],
    defaultBusinessName: 'Estudio Profesional',
    audienceLabel: 'clientes',
    offerLabel: 'asesoría',
    heroEyebrow: 'Servicios profesionales',
    headline: 'Convierte dudas en decisiones claras',
    subheadline:
      'Asesoramiento experto, proceso simple y una vía directa para que empresas, autónomos o clientes particulares pidan una consulta.',
    primaryCTA: 'Agendar consulta',
    secondaryCTA: 'Solicitar asesoría',
    servicesTitle: 'Servicios claros para captar clientes cualificados',
    servicesIntro:
      'Una landing orientada a explicar especialidad, autoridad y siguiente paso sin saturar al visitante.',
    services: [
      {
        title: 'Consulta inicial',
        text: 'Primer contacto para entender el caso y orientar el mejor camino.',
      },
      {
        title: 'Acompañamiento experto',
        text: 'Servicio profesional con estructura, seguimiento y criterio especializado.',
      },
      {
        title: 'Solución a medida',
        text: 'Propuesta adaptada al tipo de cliente, urgencia y objetivo del proyecto.',
      },
    ],
    trustTitle: 'Autoridad y confianza',
    trustPoints: [
      'Experiencia demostrable',
      'Proceso claro',
      'Atención personalizada',
      'Seguimiento profesional',
    ],
    processTitle: 'Cómo empieza la consulta',
    processSteps: [
      'Explicas tu situación.',
      'Revisamos el caso inicial.',
      'Agendamos consulta o propuesta.',
    ],
    formTitle: 'Solicita una consulta inicial',
    formText:
      'Cuéntanos tu caso y te indicaremos el siguiente paso más adecuado.',
    formFields: ['Nombre', 'Email', 'Teléfono', 'Motivo de consulta'],
    formButtonLabel: 'Agendar consulta',
    testimonialTitle: 'Clientes que tomaron mejores decisiones',
    testimonialLabel: 'Confianza',
    testimonials: [
      {
        quote:
          'Me ayudaron a ordenar la situación y saber exactamente qué pasos dar.',
        author: 'Cliente profesional',
      },
      {
        quote:
          'La consulta inicial fue clara, directa y muy útil para decidir.',
        author: 'Autónomo asesorado',
      },
    ],
    automationTitle: 'Después de solicitar consulta',
    automationText:
      'La solicitud queda ordenada para responder mejor, priorizar casos y hacer seguimiento comercial.',
    automationItems: [
      'Recepción de consulta',
      'Clasificación por necesidad',
      'Email de confirmación',
      'Seguimiento de oportunidad',
    ],
    finalCTA: 'Agendar consulta',
  },

  [BUILDER_SECTOR_PROFILE_IDS.RETAIL_LOCAL_SHOP]: {
    id: BUILDER_SECTOR_PROFILE_IDS.RETAIL_LOCAL_SHOP,
    label: 'Tienda local / producto físico',
    tone: 'warm',
    matchers: [
      'tienda',
      'fruteria',
      'frutería',
      'panaderia',
      'panadería',
      'floristeria',
      'floristería',
      'producto fresco',
      'reparto',
      'catalogo',
      'catálogo',
      'pedido',
      'pedidos',
      'ecommerce',
      'comercio',
    ],
    defaultBusinessName: 'Tienda Local Premium',
    audienceLabel: 'clientes',
    offerLabel: 'productos',
    heroEyebrow: 'Comercio local',
    headline: 'Haz tu pedido de forma fácil y cercana',
    subheadline:
      'Productos seleccionados, atención cercana y una experiencia preparada para recibir pedidos, consultas y clientes recurrentes.',
    primaryCTA: 'Hacer pedido',
    secondaryCTA: 'Ver catálogo',
    servicesTitle: 'Productos destacados para vender mejor',
    servicesIntro:
      'La landing muestra catálogo, confianza, reparto y contacto directo para aumentar pedidos.',
    services: [
      {
        title: 'Producto destacado',
        text: 'Selección principal presentada con beneficios, calidad y motivo de compra.',
      },
      {
        title: 'Pedido rápido',
        text: 'CTA directo para pedir por formulario, WhatsApp o catálogo.',
      },
      {
        title: 'Reparto o recogida',
        text: 'Información clara sobre entrega, horarios y disponibilidad.',
      },
    ],
    trustTitle: 'Compra con confianza',
    trustPoints: [
      'Producto de calidad',
      'Atención cercana',
      'Pedidos sencillos',
      'Entrega o recogida flexible',
    ],
    processTitle: 'Cómo hacer un pedido',
    processSteps: [
      'Elige productos o consulta catálogo.',
      'Envía tu pedido o pregunta.',
      'Confirmamos disponibilidad y entrega.',
    ],
    formTitle: 'Haz tu pedido',
    formText:
      'Indica qué necesitas y te responderemos con disponibilidad, precio y opciones de entrega.',
    formFields: ['Nombre', 'Teléfono', 'Producto', 'Entrega o recogida'],
    formButtonLabel: 'Enviar pedido',
    testimonialTitle: 'Clientes que compran con confianza',
    testimonialLabel: 'Opiniones locales',
    testimonials: [
      {
        quote:
          'Hacer el pedido fue rápido y me confirmaron disponibilidad enseguida.',
        author: 'Cliente local',
      },
      {
        quote:
          'La página deja claro qué ofrecen y cómo contactar sin complicaciones.',
        author: 'Cliente recurrente',
      },
    ],
    automationTitle: 'Después de enviar tu pedido',
    automationText:
      'El comercio confirma disponibilidad, prepara el pedido y puede recuperar clientes recurrentes.',
    automationItems: [
      'Confirmación de pedido',
      'Aviso interno',
      'Segmentación por producto',
      'Reactivación de clientes',
    ],
    finalCTA: 'Hacer pedido',
  },

  [BUILDER_SECTOR_PROFILE_IDS.HOSPITALITY_BOOKING]: {
    id: BUILDER_SECTOR_PROFILE_IDS.HOSPITALITY_BOOKING,
    label: 'Restaurante / hostelería',
    tone: 'warm',
    matchers: [
      'restaurante',
      'bar',
      'cafeteria',
      'cafetería',
      'hotel',
      'carta',
      'menu',
      'menú',
      'mesa',
      'reservar mesa',
      'gastronomia',
      'gastronomía',
    ],
    defaultBusinessName: 'Restaurante Brasa Norte',
    audienceLabel: 'clientes',
    offerLabel: 'experiencia gastronómica',
    heroEyebrow: 'Reserva gastronómica',
    headline: 'Reserva una experiencia memorable',
    subheadline:
      'Carta cuidada, ambiente atractivo y reserva directa para convertir visitas en mesas ocupadas.',
    primaryCTA: 'Reservar mesa',
    secondaryCTA: 'Ver carta',
    servicesTitle: 'Motivos claros para reservar',
    servicesIntro:
      'La landing presenta carta, ambiente, ubicación y reserva rápida.',
    services: [
      {
        title: 'Carta destacada',
        text: 'Platos, menús o especialidades organizadas para despertar deseo.',
      },
      {
        title: 'Reserva rápida',
        text: 'Formulario sencillo para elegir día, hora y número de personas.',
      },
      {
        title: 'Eventos y grupos',
        text: 'Captación de cenas, celebraciones, empresas y grupos.',
      },
    ],
    trustTitle: 'Confianza antes de reservar',
    trustPoints: [
      'Ubicación visible',
      'Horarios claros',
      'Confirmación de reserva',
      'Opiniones de clientes',
    ],
    processTitle: 'Cómo reservar',
    processSteps: [
      'Elige día y hora.',
      'Indica número de personas.',
      'Recibe confirmación del equipo.',
    ],
    formTitle: 'Reserva tu mesa',
    formText:
      'Indica día, hora y número de personas. El equipo confirmará la reserva.',
    formFields: ['Nombre', 'Teléfono', 'Fecha', 'Personas'],
    formButtonLabel: 'Confirmar reserva',
    testimonialTitle: 'Clientes que ya reservaron',
    testimonialLabel: 'Prueba social',
    testimonials: [
      {
        quote:
          'Reservar fue sencillo y la experiencia estuvo a la altura de lo prometido.',
        author: 'Cliente de cena',
      },
      {
        quote:
          'La web deja claro el ambiente, la carta y cómo reservar.',
        author: 'Cliente de grupo',
      },
    ],
    automationTitle: 'Después de reservar',
    automationText:
      'La reserva puede confirmarse automáticamente, recordarse antes de la visita y activar campañas para clientes recurrentes.',
    automationItems: [
      'Confirmación automática',
      'Recordatorio de reserva',
      'Captación de grupos',
      'Campañas recurrentes',
    ],
    finalCTA: 'Reservar mesa',
  },

  [BUILDER_SECTOR_PROFILE_IDS.DIGITAL_PRODUCT_OR_SAAS]: {
    id: BUILDER_SECTOR_PROFILE_IDS.DIGITAL_PRODUCT_OR_SAAS,
    label: 'SaaS / producto digital',
    tone: 'tech',
    matchers: [
      'saas',
      'software',
      'app',
      'aplicacion',
      'aplicación',
      'herramienta',
      'plataforma',
      'dashboard',
      'ia',
      'ai',
      'demo',
      'onboarding',
    ],
    defaultBusinessName: 'Digital Product',
    audienceLabel: 'usuarios',
    offerLabel: 'producto digital',
    heroEyebrow: 'Producto digital',
    headline: 'Activa usuarios con una propuesta clara',
    subheadline:
      'Landing preparada para explicar problema, solución, caso de uso y activar demos o pruebas del producto.',
    primaryCTA: 'Solicitar demo',
    secondaryCTA: 'Probar herramienta',
    servicesTitle: 'Funciones explicadas por valor',
    servicesIntro:
      'La landing ordena la propuesta para que el usuario entienda qué resuelve y por qué probarlo.',
    services: [
      {
        title: 'Caso de uso principal',
        text: 'Explicación clara del problema y del resultado que obtiene el usuario.',
      },
      {
        title: 'Activación rápida',
        text: 'Ruta simple para probar, solicitar demo o empezar onboarding.',
      },
      {
        title: 'Beneficio medible',
        text: 'Ventaja concreta en productividad, ahorro, control o crecimiento.',
      },
    ],
    trustTitle: 'Confianza para probar',
    trustPoints: [
      'Onboarding claro',
      'Caso de uso visible',
      'Beneficio medible',
      'Soporte inicial',
    ],
    processTitle: 'Cómo empieza el usuario',
    processSteps: [
      'Entiende el caso de uso.',
      'Solicita demo o prueba.',
      'Activa el primer resultado.',
    ],
    formTitle: 'Solicita una demo',
    formText:
      'Déjanos tus datos y te mostraremos cómo aplicar el producto a tu caso.',
    formFields: ['Nombre', 'Email', 'Empresa', 'Caso de uso'],
    formButtonLabel: 'Pedir demo',
    testimonialTitle: 'Usuarios que entienden el valor rápido',
    testimonialLabel: 'Casos de uso',
    testimonials: [
      {
        quote:
          'La propuesta se entiende rápido y facilita decidir si probar la herramienta.',
        author: 'Usuario de producto digital',
      },
      {
        quote:
          'El onboarding inicial ayuda a llegar antes al primer resultado.',
        author: 'Cliente SaaS',
      },
    ],
    automationTitle: 'Después de solicitar demo',
    automationText:
      'La solicitud puede conectarse con CRM, onboarding y seguimiento de usuarios interesados.',
    automationItems: [
      'Solicitud de demo',
      'Segmentación por caso de uso',
      'Email de activación',
      'Seguimiento comercial',
    ],
    finalCTA: 'Solicitar demo',
  },

  [BUILDER_SECTOR_PROFILE_IDS.AFFILIATE_CONTENT]: {
    id: BUILDER_SECTOR_PROFILE_IDS.AFFILIATE_CONTENT,
    label: 'Afiliados / comparativa',
    tone: 'simple',
    matchers: [
      'afiliados',
      'afiliado',
      'comparativa',
      'review',
      'reviews',
      'recomendacion',
      'recomendación',
      'mejores',
      'ranking',
      'nicho',
      'amazon',
      'enlace externo',
    ],
    defaultBusinessName: 'Guía Comparativa',
    audienceLabel: 'lectores',
    offerLabel: 'recomendaciones',
    heroEyebrow: 'Comparativa especializada',
    headline: 'Compara opciones y elige mejor',
    subheadline:
      'Contenido estructurado para explicar diferencias, beneficios, criterios de elección y llevar al usuario hacia la mejor recomendación.',
    primaryCTA: 'Ver recomendación',
    secondaryCTA: 'Comparar opciones',
    servicesTitle: 'Bloques preparados para convertir lectores',
    servicesIntro:
      'La landing organiza análisis, ventajas, criterios y CTA externo sin parecer una lista genérica.',
    services: [
      {
        title: 'Comparativa clara',
        text: 'Opciones organizadas por uso, precio, ventaja principal o tipo de usuario.',
      },
      {
        title: 'Criterios de elección',
        text: 'Explicación de qué mirar antes de decidir y qué opción encaja mejor.',
      },
      {
        title: 'CTA de recomendación',
        text: 'Llamadas a la acción orientadas a visitar la opción recomendada.',
      },
    ],
    trustTitle: 'Confianza editorial',
    trustPoints: [
      'Criterios transparentes',
      'Pros y contras visibles',
      'Recomendación justificada',
      'Contenido fácil de comparar',
    ],
    processTitle: 'Cómo elegir',
    processSteps: [
      'Revisa las opciones principales.',
      'Compara criterios clave.',
      'Elige la recomendación que encaja contigo.',
    ],
    formTitle: 'Recibe la guía completa',
    formText:
      'Déjanos tu email y te enviaremos la comparativa o futuras actualizaciones del nicho.',
    formFields: ['Nombre', 'Email', 'Interés', 'Presupuesto aproximado'],
    formButtonLabel: 'Recibir guía',
    testimonialTitle: 'Lectores que eligieron mejor',
    testimonialLabel: 'Confianza',
    testimonials: [
      {
        quote:
          'La comparativa me ayudó a entender qué opción tenía más sentido para mi caso.',
        author: 'Lector de guía',
      },
      {
        quote:
          'Los criterios estaban claros y la recomendación no parecía aleatoria.',
        author: 'Usuario comparando opciones',
      },
    ],
    automationTitle: 'Después de pedir la guía',
    automationText:
      'El lector recibe contenido útil y puede volver cuando haya nuevas opciones o actualizaciones.',
    automationItems: [
      'Captación de email',
      'Enlace de recomendación',
      'Actualización de ranking',
      'Segmentación por interés',
    ],
    finalCTA: 'Ver recomendación',
  },

  [BUILDER_SECTOR_PROFILE_IDS.AUTOMATION_SERVICE]: {
    id: BUILDER_SECTOR_PROFILE_IDS.AUTOMATION_SERVICE,
    label: 'Automatización / procesos',
    tone: 'system',
    matchers: [
      'automatizacion',
      'automatización',
      'workflow',
      'proceso',
      'crm',
      'make',
      'zapier',
      'automatizar',
      'formularios',
      'seguimiento automatico',
      'seguimiento automático',
    ],
    defaultBusinessName: 'Sistema Automatizado',
    audienceLabel: 'clientes',
    offerLabel: 'automatización',
    heroEyebrow: 'Automatización comercial',
    headline: 'Convierte procesos manuales en seguimiento automático',
    subheadline:
      'Una landing para captar solicitudes, explicar el flujo y mostrar cómo el negocio puede responder más rápido y vender mejor.',
    primaryCTA: 'Solicitar automatización',
    secondaryCTA: 'Ver flujo',
    servicesTitle: 'Automatizaciones que reducen trabajo manual',
    servicesIntro:
      'La página muestra el problema, el flujo propuesto y el resultado operativo para el negocio.',
    services: [
      {
        title: 'Captación de solicitudes',
        text: 'Formularios conectados a avisos internos y clasificación inicial.',
      },
      {
        title: 'Seguimiento automático',
        text: 'Emails, recordatorios y estados para no perder oportunidades.',
      },
      {
        title: 'Control del proceso',
        text: 'Vista clara de entradas, responsables, estado y siguiente acción.',
      },
    ],
    trustTitle: 'Confianza operativa',
    trustPoints: [
      'Menos tareas manuales',
      'Respuesta más rápida',
      'Seguimiento consistente',
      'Control de oportunidades',
    ],
    processTitle: 'Cómo se activa el flujo',
    processSteps: [
      'El usuario deja una solicitud.',
      'El sistema clasifica y avisa.',
      'El negocio responde y hace seguimiento.',
    ],
    formTitle: 'Solicita tu flujo automatizado',
    formText:
      'Cuéntanos qué proceso quieres ordenar y te mostraremos una primera versión funcional.',
    formFields: ['Nombre', 'Email', 'Proceso a automatizar', 'Herramientas actuales'],
    formButtonLabel: 'Solicitar flujo',
    testimonialTitle: 'Negocios que responden mejor',
    testimonialLabel: 'Resultado operativo',
    testimonials: [
      {
        quote:
          'Ahora cada solicitud llega ordenada y sabemos cuál es el siguiente paso.',
        author: 'Equipo comercial',
      },
      {
        quote:
          'El seguimiento automático redujo pérdidas de oportunidades.',
        author: 'Responsable de operaciones',
      },
    ],
    automationTitle: 'Después de recibir una solicitud',
    automationText:
      'El flujo puede enviar confirmación, avisar al equipo, clasificar la oportunidad y programar seguimiento.',
    automationItems: [
      'Confirmación automática',
      'Aviso interno',
      'Clasificación del lead',
      'Seguimiento programado',
    ],
    finalCTA: 'Solicitar automatización',
  },

  [BUILDER_SECTOR_PROFILE_IDS.GENERIC_BUSINESS_LANDING]: {
    id: BUILDER_SECTOR_PROFILE_IDS.GENERIC_BUSINESS_LANDING,
    label: 'Landing genérica de negocio',
    tone: 'contextual',
    matchers: [],
    defaultBusinessName: 'Negocio Premium',
    audienceLabel: 'clientes',
    offerLabel: 'servicio',
    heroEyebrow: 'Landing profesional',
    headline: 'Convierte visitas en oportunidades reales',
    subheadline:
      'Una landing clara, específica y preparada para explicar valor, generar confianza y activar el siguiente paso.',
    primaryCTA: 'Solicitar información',
    secondaryCTA: 'Ver servicios',
    servicesTitle: 'Servicios presentados para convertir',
    servicesIntro:
      'El contenido se organiza para que el visitante entienda qué ofreces, por qué confiar y cómo actuar.',
    services: [
      {
        title: 'Propuesta principal',
        text: 'Explica el servicio o producto más importante con claridad y orientación comercial.',
      },
      {
        title: 'Beneficio clave',
        text: 'Conecta la oferta con el resultado que el cliente quiere conseguir.',
      },
      {
        title: 'Siguiente paso simple',
        text: 'Reduce fricción con un formulario, CTA o contacto directo.',
      },
    ],
    trustTitle: 'Confianza para dar el paso',
    trustPoints: [
      'Proceso claro',
      'Atención profesional',
      'Respuesta rápida',
      'Seguimiento personalizado',
    ],
    processTitle: 'Cómo funciona',
    processSteps: [
      'El usuario entiende la propuesta.',
      'Deja sus datos o contacta.',
      'El negocio responde con el siguiente paso.',
    ],
    formTitle: 'Solicita información',
    formText:
      'Déjanos tus datos y te contactaremos con una respuesta adaptada a lo que necesitas.',
    formFields: ['Nombre', 'Email', 'Teléfono', 'Mensaje'],
    formButtonLabel: 'Enviar solicitud',
    testimonialTitle: 'Clientes que entendieron el valor',
    testimonialLabel: 'Prueba social',
    testimonials: [
      {
        quote:
          'La propuesta se entiende rápido y facilita contactar sin fricción.',
        author: 'Cliente interesado',
      },
      {
        quote:
          'La página transmite confianza y deja claro el siguiente paso.',
        author: 'Usuario cualificado',
      },
    ],
    automationTitle: 'Después de enviar la solicitud',
    automationText:
      'La landing puede confirmar recepción, avisar al equipo y ordenar el seguimiento comercial.',
    automationItems: [
      'Email de confirmación',
      'Aviso al equipo',
      'Clasificación del lead',
      'Seguimiento automático',
    ],
    finalCTA: 'Solicitar información',
  },
};

export const getBuilderSectorProfile = (
  profileId = DEFAULT_SECTOR_PROFILE_ID
) =>
  BUILDER_SECTOR_PROFILES[profileId] ||
  BUILDER_SECTOR_PROFILES[DEFAULT_SECTOR_PROFILE_ID];

export const getAllBuilderSectorProfiles = () =>
  Object.values(BUILDER_SECTOR_PROFILES);