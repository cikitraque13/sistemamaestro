export const BASIC_PLAYBOOK_IDS = Object.freeze({
  LOCAL_BUSINESS: 'local_business',
  CONVERSION_LANDING: 'conversion_landing',
  PROFESSIONAL_SERVICE: 'professional_service',
  COMMERCE: 'commerce',
  EDUCATION: 'education',
  SAAS_AI_TOOL: 'saas_ai_tool',
  AUTOMATION_WORKFLOW: 'automation_workflow',
  GPT_HUB_LANDING: 'gpt_hub_landing',
});

export const DEFAULT_BASIC_PLAYBOOK_ID = BASIC_PLAYBOOK_IDS.CONVERSION_LANDING;

export const BASIC_PLAYBOOKS = Object.freeze({
  [BASIC_PLAYBOOK_IDS.LOCAL_BUSINESS]: {
    id: BASIC_PLAYBOOK_IDS.LOCAL_BUSINESS,
    label: 'Negocio local',
    description:
      'Playbook para bares, cafeterías, restaurantes, peluquerías, clínicas, gimnasios, talleres, tiendas físicas y negocios de proximidad.',
    projectTypes: [
      'web de negocio local',
      'landing local',
      'página de reservas',
      'página de contacto',
      'web informativa con conversión rápida',
    ],
    commonSectors: [
      'restaurante',
      'bar',
      'cafetería',
      'peluquería',
      'clínica',
      'estética',
      'gimnasio',
      'taller',
      'tienda física',
      'centro local',
    ],
    primaryGoals: [
      'conseguir reservas',
      'recibir llamadas',
      'activar WhatsApp',
      'aumentar visitas',
      'mostrar ubicación',
      'generar confianza rápida',
    ],
    recommendedStructure: [
      {
        id: 'hero',
        label: 'Hero local claro',
        purpose:
          'Explicar qué ofrece el negocio, dónde está y por qué conviene contactar o reservar.',
      },
      {
        id: 'visual-proof',
        label: 'Fotos y prueba visual',
        purpose:
          'Mostrar el local, producto, ambiente, equipo o resultado para generar confianza inmediata.',
      },
      {
        id: 'services',
        label: 'Servicios o carta',
        purpose:
          'Hacer visible qué puede contratar, pedir, reservar o visitar el usuario.',
      },
      {
        id: 'trust',
        label: 'Reseñas y señales de confianza',
        purpose:
          'Reducir dudas mediante opiniones, experiencia, años, especialidad o garantías.',
      },
      {
        id: 'location',
        label: 'Ubicación y horarios',
        purpose:
          'Eliminar fricción operativa: dónde está, cuándo abre y cómo llegar.',
      },
      {
        id: 'final-cta',
        label: 'CTA final directo',
        purpose:
          'Cerrar con una acción clara: reservar, llamar, WhatsApp o pedir cita.',
      },
    ],
    primaryCtas: [
      'Reservar ahora',
      'Pedir cita',
      'Llamar',
      'Enviar WhatsApp',
      'Ver carta',
      'Cómo llegar',
    ],
    visualDirection: {
      defaultMood: 'cercano, claro y confiable',
      layout:
        'hero con acción directa, bloques visuales, tarjetas simples y CTA persistente o muy visible',
      colorLogic:
        'usar contraste suficiente; evitar estética corporativa fría si el negocio depende de cercanía',
      imageLogic:
        'priorizar fotos reales o placeholders que indiquen claramente qué imagen falta',
    },
    conversionRules: [
      'No ocultar teléfono, WhatsApp, ubicación ni reserva.',
      'El CTA principal debe aparecer en el hero y repetirse al final.',
      'La propuesta debe entenderse en menos de cinco segundos.',
      'Si el negocio depende de visitas, la ubicación debe ser visible pronto.',
      'Si depende de confianza, las reseñas deben aparecer antes del CTA final.',
    ],
    commonMistakes: [
      'Hero demasiado abstracto.',
      'CTA genérico como “Saber más”.',
      'No mostrar horarios ni ubicación.',
      'No enseñar fotos del negocio o resultado.',
      'Usar lenguaje de gran empresa para un negocio de proximidad.',
    ],
    smartQuestions: [
      '¿La acción principal debe ser reservar, llamar, WhatsApp o pedir cita?',
      '¿El negocio depende más de ubicación, confianza, precio o experiencia?',
      '¿Quieres una estética más cercana, más premium o más directa a reserva?',
    ],
    defaultAgentMessage:
      'Clasifico esto como negocio local. Voy a priorizar claridad inmediata, ubicación, confianza visual y un CTA directo para reservar, llamar o contactar.',
  },

  [BASIC_PLAYBOOK_IDS.CONVERSION_LANDING]: {
    id: BASIC_PLAYBOOK_IDS.CONVERSION_LANDING,
    label: 'Landing de conversión',
    description:
      'Playbook base para crear una landing orientada a captar leads, vender una oferta, validar una idea o llevar a una acción concreta.',
    projectTypes: [
      'landing page',
      'landing de captación',
      'landing de venta',
      'landing de validación',
      'landing de lista de espera',
      'landing de servicio',
    ],
    commonSectors: [
      'consultoría',
      'servicios',
      'formación',
      'producto digital',
      'software',
      'marca personal',
      'agencia',
      'negocio online',
    ],
    primaryGoals: [
      'captar leads',
      'explicar una oferta',
      'generar registros',
      'activar una prueba',
      'llevar a diagnóstico',
      'validar interés',
    ],
    recommendedStructure: [
      {
        id: 'hero',
        label: 'Promesa principal',
        purpose:
          'Explicar el resultado que obtiene el usuario y mostrar una acción principal clara.',
      },
      {
        id: 'problem',
        label: 'Problema o fricción',
        purpose:
          'Hacer evidente por qué el usuario necesita actuar ahora o considerar la solución.',
      },
      {
        id: 'solution',
        label: 'Solución propuesta',
        purpose:
          'Presentar el mecanismo, servicio, herramienta o sistema que resuelve el problema.',
      },
      {
        id: 'benefits',
        label: 'Beneficios concretos',
        purpose:
          'Traducir características en mejoras visibles para el usuario.',
      },
      {
        id: 'trust',
        label: 'Confianza',
        purpose:
          'Añadir autoridad, prueba social, garantías, proceso o señales de seguridad.',
      },
      {
        id: 'cta',
        label: 'Cierre de conversión',
        purpose:
          'Repetir la acción principal con menor fricción y mayor claridad.',
      },
    ],
    primaryCtas: [
      'Empezar ahora',
      'Solicitar diagnóstico',
      'Reservar llamada',
      'Probar gratis',
      'Unirme a la lista',
      'Ver cómo funciona',
    ],
    visualDirection: {
      defaultMood: 'claro, enfocado y orientado a acción',
      layout:
        'hero fuerte, bloques secuenciales, jerarquía clara, CTA repetido y cierre limpio',
      colorLogic:
        'usar un color de acción dominante; no repartir demasiados colores entre CTAs',
      imageLogic:
        'usar mockups, capturas, iconos funcionales o visuales que expliquen el resultado',
    },
    conversionRules: [
      'El hero debe responder qué es, para quién es y qué acción tomar.',
      'Solo debe haber una acción principal dominante.',
      'Cada sección debe empujar hacia la conversión, no decorar.',
      'Las objeciones principales deben tratarse antes del CTA final.',
      'La landing no debe parecer un informe; debe conducir a una acción.',
    ],
    commonMistakes: [
      'Titular bonito pero poco específico.',
      'Demasiados CTAs con objetivos distintos.',
      'Beneficios genéricos sin resultado concreto.',
      'No explicar el siguiente paso.',
      'Diseño visual potente pero sin lógica comercial.',
    ],
    smartQuestions: [
      '¿La landing debe captar leads, vender, reservar llamada o validar una idea?',
      '¿El usuario llega frío, templado o ya conoce la oferta?',
      '¿Quieres un enfoque más directo, más premium o más educativo?',
    ],
    defaultAgentMessage:
      'Clasifico esto como landing de conversión. Voy a priorizar promesa clara, estructura de decisión, CTA visible, beneficios concretos y cierre orientado a acción.',
  },

  [BASIC_PLAYBOOK_IDS.PROFESSIONAL_SERVICE]: {
    id: BASIC_PLAYBOOK_IDS.PROFESSIONAL_SERVICE,
    label: 'Servicio profesional',
    description:
      'Playbook para abogados, gestorías, consultores, asesores, clínicas, arquitectos, terapeutas, agencias y expertos que necesitan confianza y contacto cualificado.',
    projectTypes: [
      'web de servicio profesional',
      'landing de consulta',
      'landing de diagnóstico',
      'web de despacho',
      'página de especialidad',
      'captación profesional',
    ],
    commonSectors: [
      'abogado',
      'gestoría',
      'consultor',
      'asesor',
      'arquitecto',
      'clínica',
      'terapeuta',
      'coach',
      'agencia',
      'especialista',
    ],
    primaryGoals: [
      'conseguir consultas',
      'captar leads cualificados',
      'generar confianza',
      'explicar especialidad',
      'filtrar clientes',
      'activar diagnóstico',
    ],
    recommendedStructure: [
      {
        id: 'hero',
        label: 'Especialidad y resultado',
        purpose:
          'Explicar con precisión qué problema resuelve el profesional y para quién.',
      },
      {
        id: 'authority',
        label: 'Autoridad profesional',
        purpose:
          'Mostrar experiencia, método, credenciales, casos o enfoque diferencial.',
      },
      {
        id: 'process',
        label: 'Proceso de trabajo',
        purpose:
          'Reducir incertidumbre explicando cómo será el contacto, diagnóstico o servicio.',
      },
      {
        id: 'proof',
        label: 'Confianza y prueba',
        purpose:
          'Incluir testimonios, casos, garantías, años de experiencia o señales de seriedad.',
      },
      {
        id: 'faq',
        label: 'Objeciones frecuentes',
        purpose:
          'Resolver dudas antes de pedir una consulta.',
      },
      {
        id: 'qualified-cta',
        label: 'CTA cualificado',
        purpose:
          'Llevar al usuario a solicitar consulta, diagnóstico o evaluación.',
      },
    ],
    primaryCtas: [
      'Solicitar consulta',
      'Solicitar diagnóstico',
      'Evaluar mi caso',
      'Hablar con un especialista',
      'Reservar llamada',
    ],
    visualDirection: {
      defaultMood: 'sobrio, confiable y profesional',
      layout:
        'hero con autoridad, secciones limpias, proceso visible y CTA cualificado',
      colorLogic:
        'priorizar sobriedad, contraste y sensación de seguridad; evitar exceso de efectos',
      imageLogic:
        'usar retratos, despacho, equipo, capturas de método o iconografía sobria',
    },
    conversionRules: [
      'La especialidad debe quedar clara antes de hablar de beneficios.',
      'La confianza pesa más que la agresividad comercial.',
      'El CTA debe filtrar y cualificar, no parecer barato.',
      'El proceso debe reducir miedo a contactar.',
      'Las objeciones deben responderse con precisión.',
    ],
    commonMistakes: [
      'Usar copy demasiado genérico.',
      'No explicar especialidad ni tipo de cliente.',
      'Poner un CTA débil o poco cualificado.',
      'Diseño demasiado promocional para un servicio serio.',
      'No mostrar señales de autoridad.',
    ],
    smartQuestions: [
      '¿El objetivo es consulta gratuita, diagnóstico de pago o llamada de filtro?',
      '¿Qué especialidad debe quedar más visible?',
      '¿La web debe transmitir más autoridad, cercanía o exclusividad?',
    ],
    defaultAgentMessage:
      'Clasifico esto como servicio profesional. Voy a priorizar especialidad, autoridad, confianza, proceso claro y un CTA cualificado para consulta o diagnóstico.',
  },

  [BASIC_PLAYBOOK_IDS.COMMERCE]: {
    id: BASIC_PLAYBOOK_IDS.COMMERCE,
    label: 'Comercio y venta de producto',
    description:
      'Playbook para tiendas, catálogos, productos físicos, productos digitales, fichas de producto y páginas de venta simple.',
    projectTypes: [
      'tienda online',
      'catálogo',
      'landing de producto',
      'ficha de producto',
      'página de colección',
      'venta por WhatsApp',
      'producto digital',
    ],
    commonSectors: [
      'moda',
      'gadget',
      'decoración',
      'alimentación',
      'cosmética',
      'producto digital',
      'artesanía',
      'tienda especializada',
      'catálogo local',
    ],
    primaryGoals: [
      'vender producto',
      'mostrar catálogo',
      'aumentar confianza',
      'llevar a compra',
      'recibir pedidos',
      'consultar disponibilidad',
    ],
    recommendedStructure: [
      {
        id: 'product-hero',
        label: 'Producto principal',
        purpose:
          'Mostrar qué se vende, para quién es y por qué conviene comprar o consultar.',
      },
      {
        id: 'benefits',
        label: 'Beneficios del producto',
        purpose:
          'Explicar resultados, usos, ventajas y motivos de compra.',
      },
      {
        id: 'visual-gallery',
        label: 'Galería o demostración',
        purpose:
          'Reducir dudas mostrando el producto, variantes o uso real.',
      },
      {
        id: 'trust',
        label: 'Garantías y prueba social',
        purpose:
          'Aumentar seguridad con reseñas, envíos, devoluciones, garantías o testimonios.',
      },
      {
        id: 'comparison',
        label: 'Comparativa o diferenciación',
        purpose:
          'Explicar por qué elegir este producto frente a alternativas.',
      },
      {
        id: 'purchase-cta',
        label: 'CTA de compra o consulta',
        purpose:
          'Cerrar hacia compra, carrito, WhatsApp o disponibilidad.',
      },
    ],
    primaryCtas: [
      'Comprar ahora',
      'Ver producto',
      'Añadir al carrito',
      'Consultar disponibilidad',
      'Pedir por WhatsApp',
      'Ver catálogo',
    ],
    visualDirection: {
      defaultMood: 'visual, claro y orientado a producto',
      layout:
        'producto visible arriba, beneficios cerca, prueba social y CTA de compra repetido',
      colorLogic:
        'el color de CTA debe destacar sobre producto y fondo; no competir con imágenes',
      imageLogic:
        'priorizar imagen de producto, contexto de uso, detalle y comparación',
    },
    conversionRules: [
      'El producto debe verse antes de pedir compra.',
      'El CTA debe estar cerca del beneficio principal.',
      'Las garantías deben aparecer antes del cierre.',
      'La página debe reducir dudas de precio, entrega, uso y confianza.',
      'Si no hay checkout, WhatsApp debe ser una acción clara.',
    ],
    commonMistakes: [
      'Ocultar producto o precio.',
      'Usar demasiada explicación antes de mostrar valor.',
      'No resolver envío, garantía o disponibilidad.',
      'CTA poco visible.',
      'No diferenciar el producto de alternativas.',
    ],
    smartQuestions: [
      '¿La venta será por checkout, WhatsApp, formulario o contacto?',
      '¿El producto necesita más explicación, más imagen o más prueba social?',
      '¿Quieres una página de producto único, catálogo o tienda inicial?',
    ],
    defaultAgentMessage:
      'Clasifico esto como comercio o venta de producto. Voy a priorizar producto visible, beneficios claros, confianza de compra y CTA directo a compra o consulta.',
  },

  [BASIC_PLAYBOOK_IDS.EDUCATION]: {
    id: BASIC_PLAYBOOK_IDS.EDUCATION,
    label: 'Formación y educación',
    description:
      'Playbook para cursos, academias, escuelas online, mentorías, programas formativos, masterclass y comunidades educativas.',
    projectTypes: [
      'landing de curso',
      'escuela online',
      'programa formativo',
      'masterclass',
      'mentoría',
      'academia',
      'comunidad educativa',
      'LMS inicial',
    ],
    commonSectors: [
      'educación',
      'IA',
      'marketing',
      'negocios',
      'idiomas',
      'habilidades digitales',
      'formación profesional',
      'coaching',
      'creadores',
    ],
    primaryGoals: [
      'captar alumnos',
      'vender curso',
      'activar inscripción',
      'explicar programa',
      'crear comunidad',
      'mostrar ruta de aprendizaje',
    ],
    recommendedStructure: [
      {
        id: 'student-result',
        label: 'Resultado del alumno',
        purpose:
          'Explicar qué podrá hacer o conseguir el alumno después de la formación.',
      },
      {
        id: 'program',
        label: 'Programa o ruta',
        purpose:
          'Mostrar módulos, fases, contenidos o metodología.',
      },
      {
        id: 'method',
        label: 'Método de aprendizaje',
        purpose:
          'Explicar cómo se aprende, practica, acompaña o evalúa.',
      },
      {
        id: 'authority',
        label: 'Autoridad docente',
        purpose:
          'Mostrar quién enseña, experiencia, casos o credenciales.',
      },
      {
        id: 'fit',
        label: 'Para quién es',
        purpose:
          'Filtrar alumnos y mejorar calidad de inscripción.',
      },
      {
        id: 'enrollment',
        label: 'Inscripción',
        purpose:
          'Cerrar con plaza, acceso, programa, llamada o registro.',
      },
    ],
    primaryCtas: [
      'Ver programa',
      'Reservar plaza',
      'Empezar formación',
      'Solicitar acceso',
      'Apuntarme a la masterclass',
      'Entrar en la comunidad',
    ],
    visualDirection: {
      defaultMood: 'educativo, claro y progresivo',
      layout:
        'resultado arriba, ruta por módulos, autoridad y CTA de inscripción',
      colorLogic:
        'usar acentos que indiquen progreso, aprendizaje y claridad; evitar saturar',
      imageLogic:
        'usar mockups de módulos, capturas de plataforma, instructor o progreso',
    },
    conversionRules: [
      'El resultado del alumno debe aparecer antes del temario.',
      'La ruta de aprendizaje debe ser fácil de entender.',
      'Debe quedar claro para quién es y para quién no.',
      'La autoridad docente debe reducir riesgo percibido.',
      'El CTA debe indicar si es inscripción, acceso, plaza o diagnóstico.',
    ],
    commonMistakes: [
      'Empezar por temario sin promesa.',
      'No explicar nivel necesario.',
      'No mostrar método ni acompañamiento.',
      'CTA ambiguo.',
      'Prometer transformación sin ruta visible.',
    ],
    smartQuestions: [
      '¿La formación es curso, mentoría, escuela, masterclass o comunidad?',
      '¿El alumno compra acceso directo o solicita plaza?',
      '¿El enfoque debe ser más práctico, más académico o más premium?',
    ],
    defaultAgentMessage:
      'Clasifico esto como formación. Voy a priorizar resultado del alumno, ruta de aprendizaje, autoridad, claridad de inscripción y CTA educativo.',
  },

  [BASIC_PLAYBOOK_IDS.SAAS_AI_TOOL]: {
    id: BASIC_PLAYBOOK_IDS.SAAS_AI_TOOL,
    label: 'SaaS, app o herramienta IA',
    description:
      'Playbook para software, herramientas digitales, dashboards, productos con IA, generadores, analizadores y plataformas con registro.',
    projectTypes: [
      'SaaS',
      'app',
      'herramienta IA',
      'dashboard',
      'generador',
      'analizador',
      'plataforma',
      'sistema con créditos',
      'producto digital interactivo',
    ],
    commonSectors: [
      'IA',
      'software',
      'productividad',
      'marketing',
      'ventas',
      'educación',
      'operaciones',
      'analytics',
      'automatización',
    ],
    primaryGoals: [
      'activar registro',
      'mostrar demo',
      'explicar utilidad',
      'generar prueba gratuita',
      'activar créditos',
      'llevar a onboarding',
    ],
    recommendedStructure: [
      {
        id: 'problem-solution',
        label: 'Problema y solución',
        purpose:
          'Explicar qué problema resuelve la herramienta y qué resultado obtiene el usuario.',
      },
      {
        id: 'live-demo',
        label: 'Demo o resultado visible',
        purpose:
          'Mostrar el producto funcionando o el resultado que genera.',
      },
      {
        id: 'use-cases',
        label: 'Casos de uso',
        purpose:
          'Ayudar al usuario a reconocerse en situaciones concretas.',
      },
      {
        id: 'workflow',
        label: 'Cómo funciona',
        purpose:
          'Reducir incertidumbre explicando pasos, créditos, entrada y salida.',
      },
      {
        id: 'trust',
        label: 'Confianza y control',
        purpose:
          'Explicar límites, privacidad, calidad, exportación o soporte.',
      },
      {
        id: 'activation',
        label: 'Activación',
        purpose:
          'Llevar a registro, prueba, demo, crédito inicial o primer proyecto.',
      },
    ],
    primaryCtas: [
      'Probar gratis',
      'Crear mi cuenta',
      'Ver demo',
      'Empezar proyecto',
      'Analizar mi caso',
      'Usar créditos iniciales',
    ],
    visualDirection: {
      defaultMood: 'tecnológico, operativo y premium',
      layout:
        'hero con demo, bloques de casos de uso, workflow claro y activación rápida',
      colorLogic:
        'usar acentos tecnológicos con CTA muy visible; evitar parecer una plantilla genérica',
      imageLogic:
        'priorizar preview de producto, dashboard, flujo o resultado generado',
    },
    conversionRules: [
      'El usuario debe ver rápido qué puede hacer con la herramienta.',
      'La activación debe sentirse inmediata.',
      'Si hay créditos, deben explicarse sin fricción.',
      'El primer resultado debe ser visible antes de pedir demasiado compromiso.',
      'Debe quedar claro qué pasa después de registrarse.',
    ],
    commonMistakes: [
      'Hablar de IA de forma vaga.',
      'No mostrar resultado concreto.',
      'No explicar créditos o límites.',
      'CTA demasiado genérico.',
      'Ocultar demo o primer paso.',
    ],
    smartQuestions: [
      '¿La herramienta debe activar registro, demo, análisis o primer proyecto?',
      '¿El valor principal es ahorrar tiempo, mejorar conversión, crear contenido o automatizar?',
      '¿Quieres mostrar créditos, preview, dashboard o resultado generado?',
    ],
    defaultAgentMessage:
      'Clasifico esto como SaaS o herramienta IA. Voy a priorizar utilidad inmediata, demo visible, casos de uso, activación rápida y CTA de registro o prueba.',
  },

  [BASIC_PLAYBOOK_IDS.AUTOMATION_WORKFLOW]: {
    id: BASIC_PLAYBOOK_IDS.AUTOMATION_WORKFLOW,
    label: 'Automatización y procesos internos',
    description:
      'Playbook para automatizar emails, CRM, reservas, facturas, tareas administrativas, atención al cliente, documentos y flujos de oficina.',
    projectTypes: [
      'automatización interna',
      'flujo operativo',
      'CRM básico',
      'automatización de emails',
      'sistema de reservas',
      'gestión administrativa',
      'panel de operaciones',
      'workflow Make/Zapier',
    ],
    commonSectors: [
      'oficina',
      'servicios profesionales',
      'agencia',
      'ventas',
      'soporte',
      'administración',
      'ecommerce',
      'formación',
      'clínica',
      'inmobiliaria',
    ],
    primaryGoals: [
      'ahorrar tiempo',
      'reducir errores',
      'automatizar seguimiento',
      'ordenar procesos',
      'conectar herramientas',
      'crear alertas',
    ],
    recommendedStructure: [
      {
        id: 'current-process',
        label: 'Proceso actual',
        purpose:
          'Entender qué pasa hoy, quién interviene, dónde se pierde tiempo y qué errores aparecen.',
      },
      {
        id: 'inputs',
        label: 'Entradas del sistema',
        purpose:
          'Definir formularios, emails, documentos, clientes, leads o eventos que activan el flujo.',
      },
      {
        id: 'workflow',
        label: 'Flujo automatizado',
        purpose:
          'Describir pasos, condiciones, herramientas y decisiones automáticas.',
      },
      {
        id: 'outputs',
        label: 'Salidas y resultados',
        purpose:
          'Explicar qué se genera: emails, tareas, avisos, registros, informes o respuestas.',
      },
      {
        id: 'exceptions',
        label: 'Excepciones y control',
        purpose:
          'Evitar automatizaciones frágiles definiendo errores, validaciones y revisión humana.',
      },
      {
        id: 'activation',
        label: 'Activación del flujo',
        purpose:
          'Llevar a mapear proceso, conectar herramientas o crear primera automatización.',
      },
    ],
    primaryCtas: [
      'Mapear proceso',
      'Diseñar automatización',
      'Crear flujo',
      'Conectar herramientas',
      'Automatizar emails',
      'Ver flujo propuesto',
    ],
    visualDirection: {
      defaultMood: 'operativo, claro y sistemático',
      layout:
        'mapa de flujo, pasos conectados, paneles de entrada/salida y CTA de implementación',
      colorLogic:
        'usar colores para estados, pasos y prioridades; evitar decoración sin función',
      imageLogic:
        'usar diagramas, tarjetas de proceso, conectores, dashboards o timeline',
    },
    conversionRules: [
      'No prometer automatización sin mapear el proceso.',
      'Siempre deben existir entradas, pasos, salidas y excepciones.',
      'Debe quedar claro qué herramienta se conecta y qué resultado produce.',
      'El usuario debe sentir control, no caja negra.',
      'La primera automatización debe ser concreta y accionable.',
    ],
    commonMistakes: [
      'Hablar de automatización de forma genérica.',
      'No definir quién valida errores.',
      'No identificar entrada inicial.',
      'No distinguir tareas humanas y automáticas.',
      'No explicar salida útil.',
    ],
    smartQuestions: [
      '¿Qué proceso quieres automatizar primero?',
      '¿Qué herramientas intervienen: email, CRM, hojas, formularios, WhatsApp o calendario?',
      '¿Qué debe ocurrir automáticamente y qué debe revisar una persona?',
    ],
    defaultAgentMessage:
      'Clasifico esto como automatización interna. Voy a mapear proceso, entradas, salidas, herramientas, excepciones y primer flujo accionable.',
  },

  [BASIC_PLAYBOOK_IDS.GPT_HUB_LANDING]: {
    id: BASIC_PLAYBOOK_IDS.GPT_HUB_LANDING,
    label: 'GPT Hub Landing',
    description:
      'Playbook para crear una landing o hub con tarjetas de GPTs, asistentes personalizados, herramientas IA o agentes especializados.',
    projectTypes: [
      'hub de GPTs',
      'landing de asistentes',
      'biblioteca de herramientas IA',
      'página de GPTs personalizados',
      'directorio de agentes',
      'pack de asistentes',
      'hub de productividad IA',
    ],
    commonSectors: [
      'IA',
      'formación',
      'marketing',
      'agencia',
      'productividad',
      'creadores',
      'educación',
      'consultoría',
      'operaciones',
    ],
    primaryGoals: [
      'dar acceso a asistentes',
      'presentar casos de uso',
      'captar usuarios',
      'vender pack',
      'activar herramientas',
      'ordenar recursos IA',
    ],
    recommendedStructure: [
      {
        id: 'hub-promise',
        label: 'Promesa del hub',
        purpose:
          'Explicar qué puede hacer el usuario con los asistentes y por qué le ahorra tiempo.',
      },
      {
        id: 'assistant-grid',
        label: 'Tarjetas de asistentes',
        purpose:
          'Mostrar cada GPT o asistente con nombre, caso de uso, descripción y CTA.',
      },
      {
        id: 'use-cases',
        label: 'Casos de uso',
        purpose:
          'Agrupar asistentes por objetivo: marketing, ventas, automatización, estudio, negocio.',
      },
      {
        id: 'level-fit',
        label: 'Nivel de usuario',
        purpose:
          'Indicar qué asistentes son básicos, avanzados o expertos.',
      },
      {
        id: 'activation',
        label: 'Acceso o desbloqueo',
        purpose:
          'Llevar a abrir un GPT, registrarse, comprar pack o usar plantilla.',
      },
      {
        id: 'final-cta',
        label: 'CTA global',
        purpose:
          'Cerrar con una acción general: explorar hub, crear mi hub o desbloquear pack.',
      },
    ],
    primaryCtas: [
      'Abrir asistente',
      'Usar este GPT',
      'Explorar herramientas',
      'Crear mi hub',
      'Desbloquear pack',
      'Ver asistentes',
    ],
    visualDirection: {
      defaultMood: 'tecnológico, ordenado y accionable',
      layout:
        'hero con promesa, grid de tarjetas, filtros por uso, niveles y CTA claro por asistente',
      colorLogic:
        'usar acentos por categoría sin romper coherencia; CTA global debe dominar',
      imageLogic:
        'usar iconos funcionales, tarjetas, avatares abstractos o señales de agente especializado',
    },
    conversionRules: [
      'Cada tarjeta debe tener un caso de uso concreto.',
      'No mostrar solo nombres de GPT; explicar utilidad real.',
      'El CTA de cada asistente debe ser directo.',
      'El hub debe agrupar por objetivo, no solo por lista.',
      'Debe quedar claro si el acceso es gratuito, externo, desbloqueable o premium.',
    ],
    commonMistakes: [
      'Listar asistentes sin explicar cuándo usarlos.',
      'Demasiadas tarjetas sin jerarquía.',
      'No distinguir niveles de usuario.',
      'CTA ambiguo.',
      'No conectar el hub con un objetivo de negocio.',
    ],
    smartQuestions: [
      '¿Los GPTs serán gratuitos, privados, de pago o enlaces externos?',
      '¿Quieres agruparlos por marketing, ventas, operaciones, formación o productividad?',
      '¿El objetivo es captar usuarios, vender un pack o crear una biblioteca interna?',
    ],
    defaultAgentMessage:
      'Clasifico esto como GPT Hub Landing. Voy a crear una estructura con promesa clara, tarjetas de asistentes, casos de uso, niveles y CTA por herramienta.',
  },
});

export const BASIC_PLAYBOOK_ALIASES = Object.freeze({
  [BASIC_PLAYBOOK_IDS.LOCAL_BUSINESS]: [
    'negocio local',
    'bar',
    'cafeteria',
    'cafetería',
    'restaurante',
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
    'cita',
  ],
  [BASIC_PLAYBOOK_IDS.CONVERSION_LANDING]: [
    'landing',
    'landing page',
    'captar leads',
    'captacion',
    'captación',
    'vender servicio',
    'lista de espera',
    'diagnostico',
    'diagnóstico',
    'pagina de venta',
    'página de venta',
  ],
  [BASIC_PLAYBOOK_IDS.PROFESSIONAL_SERVICE]: [
    'servicio profesional',
    'abogado',
    'gestoria',
    'gestoría',
    'consultor',
    'asesor',
    'despacho',
    'consulta',
    'arquitecto',
    'terapeuta',
    'coach',
    'agencia',
  ],
  [BASIC_PLAYBOOK_IDS.COMMERCE]: [
    'tienda',
    'ecommerce',
    'comercio',
    'producto',
    'catalogo',
    'catálogo',
    'comprar',
    'carrito',
    'ficha de producto',
    'venta online',
  ],
  [BASIC_PLAYBOOK_IDS.EDUCATION]: [
    'curso',
    'formacion',
    'formación',
    'escuela',
    'academia',
    'masterclass',
    'mentoria',
    'mentoría',
    'alumnos',
    'programa',
    'lms',
  ],
  [BASIC_PLAYBOOK_IDS.SAAS_AI_TOOL]: [
    'saas',
    'app',
    'aplicacion',
    'aplicación',
    'herramienta',
    'herramienta ia',
    'dashboard',
    'software',
    'plataforma',
    'creditos',
    'créditos',
    'analizador',
    'generador',
  ],
  [BASIC_PLAYBOOK_IDS.AUTOMATION_WORKFLOW]: [
    'automatizar',
    'automatizacion',
    'automatización',
    'emails',
    'oficina',
    'crm',
    'zapier',
    'make',
    'flujo',
    'workflow',
    'tareas',
    'facturas',
    'procesos',
  ],
  [BASIC_PLAYBOOK_IDS.GPT_HUB_LANDING]: [
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
});

export const listBasicPlaybooks = () => Object.values(BASIC_PLAYBOOKS);

export const getBasicPlaybook = (playbookId = DEFAULT_BASIC_PLAYBOOK_ID) =>
  BASIC_PLAYBOOKS[playbookId] || BASIC_PLAYBOOKS[DEFAULT_BASIC_PLAYBOOK_ID];

export const getBasicPlaybookAliases = (playbookId = DEFAULT_BASIC_PLAYBOOK_ID) =>
  BASIC_PLAYBOOK_ALIASES[playbookId] || [];

export const findBasicPlaybookIdByAlias = (normalizedText = '') => {
  const value = String(normalizedText || '').toLowerCase();

  if (!value) return DEFAULT_BASIC_PLAYBOOK_ID;

  const match = Object.entries(BASIC_PLAYBOOK_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => value.includes(String(alias).toLowerCase()))
  );

  return match?.[0] || DEFAULT_BASIC_PLAYBOOK_ID;
};