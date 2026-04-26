export const SECTOR_PLAYBOOK_IDS = Object.freeze({
  RESTAURANT: 'restaurant',
  CAFE_BAR: 'cafe_bar',
  LAW_FIRM: 'law_firm',
  ACCOUNTING_ADVISORY: 'accounting_advisory',
  CLINIC_HEALTH: 'clinic_health',
  AGENCY: 'agency',
  EDUCATION_SCHOOL: 'education_school',
  ECOMMERCE: 'ecommerce',
  REAL_ESTATE: 'real_estate',
  CREATOR_CONTENT: 'creator_content',
  OFFICE_OPERATIONS: 'office_operations',
});

export const DEFAULT_SECTOR_PLAYBOOK_ID = SECTOR_PLAYBOOK_IDS.AGENCY;

export const SECTOR_PLAYBOOKS = Object.freeze({
  [SECTOR_PLAYBOOK_IDS.RESTAURANT]: {
    id: SECTOR_PLAYBOOK_IDS.RESTAURANT,
    label: 'Restaurante',
    description:
      'Playbook sectorial para restaurantes, cocina local, experiencias gastronómicas, reservas y carta.',
    userIntent:
      'El usuario normalmente quiere atraer comensales, mostrar carta, generar reservas y transmitir apetito/confianza.',
    conversionTarget: 'reservar mesa',
    primaryCtas: [
      'Reservar mesa',
      'Ver carta',
      'Llamar',
      'Cómo llegar',
      'Pedir por WhatsApp',
    ],
    requiredBlocks: [
      'hero con foto gastronómica o ambiente',
      'carta o platos destacados',
      'reservas visibles',
      'horarios y ubicación',
      'reseñas o prueba social',
      'CTA final de reserva',
    ],
    visualDirection: {
      mood: 'apetecible, cercano y confiable',
      layout:
        'imagen fuerte, carta visible, reserva rápida, reseñas y ubicación sin fricción',
      colorLogic:
        'usar tonos cálidos, contraste suficiente y CTA muy visible sin parecer agresivo',
      imageLogic:
        'priorizar comida real, ambiente, equipo, interior del local o platos estrella',
    },
    conversionRules: [
      'La reserva debe estar visible desde el primer pantallazo.',
      'La carta o platos principales no deben quedar escondidos.',
      'La ubicación y horario deben aparecer antes del cierre.',
      'Las reseñas ayudan más que bloques abstractos.',
      'El CTA secundario puede ser “Ver carta” o “Cómo llegar”.',
    ],
    commonMistakes: [
      'Hero sin foto real o sin sensación gastronómica.',
      'CTA genérico como “Saber más”.',
      'No mostrar horarios.',
      'No mostrar carta.',
      'No indicar zona o ubicación.',
    ],
    smartQuestions: [
      '¿La acción principal debe ser reservar mesa, ver carta o llamar?',
      '¿El restaurante quiere transmitir cocina premium, cercana, tradicional o moderna?',
      '¿Hay fotos reales de platos, local o ambiente?',
    ],
    agentCue:
      'Lo trataré como restaurante: prioridad a reserva, carta, fotos, ubicación, horarios y prueba social.',
  },

  [SECTOR_PLAYBOOK_IDS.CAFE_BAR]: {
    id: SECTOR_PLAYBOOK_IDS.CAFE_BAR,
    label: 'Cafetería / bar',
    description:
      'Playbook sectorial para cafeterías, bares, desayunos, brunch, copas, tardeo, carta rápida y negocio de proximidad.',
    userIntent:
      'El usuario suele necesitar más visitas, reservas puntuales, llamadas, ubicación clara y una sensación visual atractiva.',
    conversionTarget: 'visita, reserva o contacto rápido',
    primaryCtas: [
      'Ver carta',
      'Cómo llegar',
      'Reservar',
      'Llamar',
      'Pedir por WhatsApp',
    ],
    requiredBlocks: [
      'hero local claro',
      'productos destacados',
      'ambiente o experiencia',
      'horarios',
      'ubicación',
      'reseñas',
      'CTA rápido',
    ],
    visualDirection: {
      mood: 'cercano, visual y dinámico',
      layout:
        'hero con propuesta local, bloques de carta/ambiente, horarios y CTA rápido',
      colorLogic:
        'permitir tonos cálidos o energéticos según tipo de local; CTA siempre dominante',
      imageLogic:
        'priorizar café, barra, terraza, ambiente, desayunos, copas o productos estrella',
    },
    conversionRules: [
      'Debe quedar claro qué ofrece el local y cuándo abre.',
      'Si hay terraza, brunch, desayunos o copas, debe aparecer pronto.',
      'La ubicación debe ser muy visible.',
      'WhatsApp o llamada pueden ser más eficaces que formularios.',
      'El diseño debe funcionar muy bien en móvil.',
    ],
    commonMistakes: [
      'Diseño demasiado corporativo.',
      'No mostrar producto ni ambiente.',
      'Horarios escondidos.',
      'No indicar zona.',
      'CTA poco útil para negocio local.',
    ],
    smartQuestions: [
      '¿La cafetería/bar quiere atraer desayunos, comidas, tardeo, copas o reservas?',
      '¿El CTA debe llevar a carta, reserva, llamada o ubicación?',
      '¿Quieres una estética más cálida, urbana, premium o familiar?',
    ],
    agentCue:
      'Lo trataré como cafetería/bar: prioridad a producto visual, ambiente, horarios, ubicación y acción rápida.',
  },

  [SECTOR_PLAYBOOK_IDS.LAW_FIRM]: {
    id: SECTOR_PLAYBOOK_IDS.LAW_FIRM,
    label: 'Despacho de abogados',
    description:
      'Playbook sectorial para abogados, despachos legales, asesoría jurídica, especialidades y captación de consultas.',
    userIntent:
      'El usuario necesita confianza, claridad jurídica, especialidad visible y una consulta cualificada.',
    conversionTarget: 'solicitar consulta',
    primaryCtas: [
      'Solicitar consulta',
      'Evaluar mi caso',
      'Hablar con un abogado',
      'Ver especialidades',
      'Reservar llamada',
    ],
    requiredBlocks: [
      'especialidad legal',
      'problema que resuelve',
      'autoridad del despacho',
      'proceso de consulta',
      'áreas legales',
      'preguntas frecuentes',
      'CTA de consulta',
    ],
    visualDirection: {
      mood: 'sobrio, confiable y profesional',
      layout:
        'hero de especialidad, autoridad, proceso, prueba de confianza y consulta final',
      colorLogic:
        'usar tonos sobrios, alto contraste y acentos discretos; evitar estética agresiva',
      imageLogic:
        'usar despacho, equipo, retrato profesional, documentos o iconografía legal sobria',
    },
    conversionRules: [
      'La especialidad debe quedar clara en el hero.',
      'El CTA debe sonar serio y cualificado.',
      'Evitar promesas legales absolutas.',
      'La autoridad y el proceso reducen miedo a contactar.',
      'Las FAQs deben resolver dudas comunes antes de la consulta.',
    ],
    commonMistakes: [
      'Lenguaje demasiado genérico.',
      'No diferenciar especialidades.',
      'CTA débil o demasiado comercial.',
      'Ausencia de autoridad.',
      'Diseño demasiado informal para un despacho.',
    ],
    smartQuestions: [
      '¿Qué especialidad legal debe priorizarse?',
      '¿La consulta inicial será gratuita, de pago o filtro previo?',
      '¿La marca debe transmitir autoridad, cercanía o máxima sobriedad?',
    ],
    agentCue:
      'Lo trataré como despacho legal: prioridad a especialidad, autoridad, confianza, proceso y consulta cualificada.',
  },

  [SECTOR_PLAYBOOK_IDS.ACCOUNTING_ADVISORY]: {
    id: SECTOR_PLAYBOOK_IDS.ACCOUNTING_ADVISORY,
    label: 'Gestoría / asesoría',
    description:
      'Playbook sectorial para gestorías, asesorías fiscales, laborales, contables y administrativas.',
    userIntent:
      'El usuario suele buscar captar autónomos, empresas o particulares que necesitan gestión clara, confianza y ahorro de tiempo.',
    conversionTarget: 'solicitar asesoramiento',
    primaryCtas: [
      'Solicitar asesoramiento',
      'Hablar con un asesor',
      'Pedir presupuesto',
      'Resolver mi caso',
      'Agendar consulta',
    ],
    requiredBlocks: [
      'servicios principales',
      'tipo de cliente',
      'beneficio operativo',
      'confianza y experiencia',
      'proceso de trabajo',
      'planes o paquetes',
      'CTA de asesoramiento',
    ],
    visualDirection: {
      mood: 'claro, fiable y ordenado',
      layout:
        'servicios visibles, perfiles de cliente, proceso simple y CTA de asesoría',
      colorLogic:
        'priorizar limpieza, legibilidad y confianza; evitar demasiada creatividad visual',
      imageLogic:
        'usar equipo, oficina, documentos, dashboards o iconografía administrativa clara',
    },
    conversionRules: [
      'El usuario debe entender rápido si la gestoría trabaja con autónomos, empresas o particulares.',
      'Los servicios deben aparecer como bloques claros.',
      'El valor debe traducirse en tiempo ahorrado, tranquilidad y control.',
      'El CTA debe conducir a presupuesto o consulta.',
      'Los paquetes pueden ayudar si el servicio es recurrente.',
    ],
    commonMistakes: [
      'Listar servicios sin explicar beneficios.',
      'No diferenciar tipos de cliente.',
      'CTA demasiado genérico.',
      'Diseño frío sin confianza humana.',
      'No explicar el proceso de alta o contacto.',
    ],
    smartQuestions: [
      '¿La asesoría se dirige a autónomos, pymes, empresas o particulares?',
      '¿El objetivo es presupuesto, llamada o alta directa?',
      '¿Quieres presentar servicios sueltos o paquetes mensuales?',
    ],
    agentCue:
      'Lo trataré como gestoría/asesoría: prioridad a servicios claros, confianza, ahorro de tiempo, proceso y CTA de consulta.',
  },

  [SECTOR_PLAYBOOK_IDS.CLINIC_HEALTH]: {
    id: SECTOR_PLAYBOOK_IDS.CLINIC_HEALTH,
    label: 'Clínica / salud / estética',
    description:
      'Playbook sectorial para clínicas, centros médicos, estética, fisioterapia, odontología, terapia y bienestar.',
    userIntent:
      'El usuario necesita confianza sanitaria/estética, servicios visibles, cita fácil y reducción de miedo o incertidumbre.',
    conversionTarget: 'pedir cita',
    primaryCtas: [
      'Pedir cita',
      'Reservar consulta',
      'Hablar con la clínica',
      'Ver tratamientos',
      'Solicitar valoración',
    ],
    requiredBlocks: [
      'servicio o especialidad',
      'beneficio para el paciente',
      'tratamientos principales',
      'equipo o especialistas',
      'confianza y seguridad',
      'ubicación y horarios',
      'CTA de cita',
    ],
    visualDirection: {
      mood: 'limpio, seguro y humano',
      layout:
        'especialidad arriba, tratamientos, equipo, confianza, cita y ubicación',
      colorLogic:
        'usar tonos limpios, sanitarios o premium según posicionamiento; CTA claro y no agresivo',
      imageLogic:
        'priorizar equipo, clínica, tratamiento, antes/después si procede y señales de seguridad',
    },
    conversionRules: [
      'La cita debe estar visible desde el hero.',
      'El equipo o especialistas aumentan confianza.',
      'Evitar promesas médicas absolutas.',
      'La ubicación y horarios son críticos.',
      'El usuario debe entender el tratamiento antes de contactar.',
    ],
    commonMistakes: [
      'Diseño demasiado frío o impersonal.',
      'No mostrar equipo o clínica.',
      'No explicar tratamientos.',
      'CTA escondido.',
      'No resolver miedo, seguridad o dudas.',
    ],
    smartQuestions: [
      '¿La conversión principal es cita, valoración o llamada?',
      '¿Qué tratamiento o especialidad debe destacar primero?',
      '¿La clínica debe sentirse más médica, estética, premium o cercana?',
    ],
    agentCue:
      'Lo trataré como clínica/salud: prioridad a especialidad, confianza, equipo, tratamientos y cita visible.',
  },

  [SECTOR_PLAYBOOK_IDS.AGENCY]: {
    id: SECTOR_PLAYBOOK_IDS.AGENCY,
    label: 'Agencia / consultoría digital',
    description:
      'Playbook sectorial para agencias de marketing, diseño, IA, desarrollo web, growth, SEO, publicidad o consultoría digital.',
    userIntent:
      'El usuario busca captar clientes, vender servicios, demostrar autoridad y diferenciarse de competidores.',
    conversionTarget: 'diagnóstico, llamada o propuesta',
    primaryCtas: [
      'Solicitar diagnóstico',
      'Reservar llamada',
      'Ver servicios',
      'Evaluar mi proyecto',
      'Pedir propuesta',
    ],
    requiredBlocks: [
      'especialidad de agencia',
      'problema que resuelve',
      'servicios principales',
      'casos o resultados',
      'método de trabajo',
      'diferenciación',
      'CTA de diagnóstico',
    ],
    visualDirection: {
      mood: 'estratégico, moderno y orientado a resultados',
      layout:
        'hero de resultado, servicios, método, casos, autoridad y CTA cualificado',
      colorLogic:
        'permitir estética más tecnológica o premium; CTA con alto contraste y jerarquía fuerte',
      imageLogic:
        'usar dashboards, resultados, mockups, equipo, proceso o visuales de sistema',
    },
    conversionRules: [
      'La agencia debe explicar qué resultado produce, no solo qué servicios ofrece.',
      'El CTA debe cualificar clientes si el servicio es alto valor.',
      'Casos, método y diferenciación son claves.',
      'Evitar parecer una agencia genérica.',
      'La oferta debe conectar diagnóstico, ejecución y resultado.',
    ],
    commonMistakes: [
      'Listado genérico de servicios.',
      'No mostrar método.',
      'No filtrar tipo de cliente.',
      'Promesas vagas de crecimiento.',
      'Diseño bonito sin argumento comercial.',
    ],
    smartQuestions: [
      '¿La agencia vende SEO, ads, IA, diseño, automatización, desarrollo o estrategia completa?',
      '¿El CTA debe ser diagnóstico, llamada o propuesta?',
      '¿Quieres transmitir más creatividad, autoridad, tecnología o conversión?',
    ],
    agentCue:
      'Lo trataré como agencia/consultoría: prioridad a resultado, método, diferenciación, prueba y CTA cualificado.',
  },

  [SECTOR_PLAYBOOK_IDS.EDUCATION_SCHOOL]: {
    id: SECTOR_PLAYBOOK_IDS.EDUCATION_SCHOOL,
    label: 'Escuela / formación',
    description:
      'Playbook sectorial para escuelas, academias, cursos, mentorías, comunidades formativas y programas educativos.',
    userIntent:
      'El usuario necesita captar alumnos, explicar el programa, transmitir autoridad y mostrar ruta de aprendizaje.',
    conversionTarget: 'inscripción o solicitud de acceso',
    primaryCtas: [
      'Ver programa',
      'Reservar plaza',
      'Solicitar acceso',
      'Empezar formación',
      'Unirme a la comunidad',
    ],
    requiredBlocks: [
      'resultado del alumno',
      'programa o módulos',
      'metodología',
      'para quién es',
      'autoridad docente',
      'testimonios',
      'CTA de inscripción',
    ],
    visualDirection: {
      mood: 'educativo, claro y progresivo',
      layout:
        'resultado arriba, módulos visibles, método, autoridad y CTA de inscripción',
      colorLogic:
        'usar acentos de progreso y claridad; evitar saturación de información',
      imageLogic:
        'usar plataforma, módulos, profesor, comunidad o progreso visual',
    },
    conversionRules: [
      'El resultado del alumno debe aparecer antes del temario.',
      'La ruta de aprendizaje debe ser clara.',
      'Debe quedar claro el nivel necesario.',
      'La autoridad docente reduce riesgo.',
      'La inscripción debe diferenciar plaza, acceso, curso o comunidad.',
    ],
    commonMistakes: [
      'Empezar por temario sin promesa.',
      'No decir para quién es.',
      'No mostrar método.',
      'CTA ambiguo.',
      'No transmitir transformación ni práctica.',
    ],
    smartQuestions: [
      '¿Es curso, escuela, mentoría, masterclass o comunidad?',
      '¿El usuario compra acceso directo o solicita plaza?',
      '¿La formación es básica, avanzada o profesional?',
    ],
    agentCue:
      'Lo trataré como escuela/formación: prioridad a resultado del alumno, programa, método, autoridad e inscripción.',
  },

  [SECTOR_PLAYBOOK_IDS.ECOMMERCE]: {
    id: SECTOR_PLAYBOOK_IDS.ECOMMERCE,
    label: 'Ecommerce / tienda online',
    description:
      'Playbook sectorial para ecommerce, producto físico, producto digital, catálogo, ficha de producto o venta por WhatsApp.',
    userIntent:
      'El usuario quiere vender productos, mejorar conversión, mostrar catálogo o llevar a compra/contacto.',
    conversionTarget: 'compra, carrito o consulta',
    primaryCtas: [
      'Comprar ahora',
      'Ver producto',
      'Añadir al carrito',
      'Consultar disponibilidad',
      'Ver catálogo',
      'Pedir por WhatsApp',
    ],
    requiredBlocks: [
      'producto visible',
      'beneficios',
      'galería',
      'precio o disponibilidad',
      'garantías',
      'reseñas',
      'CTA de compra',
    ],
    visualDirection: {
      mood: 'visual, comercial y confiable',
      layout:
        'producto protagonista, beneficios, prueba social, garantías y CTA de compra',
      colorLogic:
        'CTA dominante; colores de apoyo sin competir con la imagen del producto',
      imageLogic:
        'priorizar producto, contexto de uso, detalle, variantes y comparativas',
    },
    conversionRules: [
      'El producto debe verse pronto y con claridad.',
      'La compra o consulta debe estar cerca del producto.',
      'Garantía, envío y disponibilidad reducen fricción.',
      'El CTA no debe competir con demasiadas acciones.',
      'Las reseñas deben acompañar la decisión.',
    ],
    commonMistakes: [
      'No mostrar producto suficientemente.',
      'No explicar envío, garantía o disponibilidad.',
      'CTA escondido.',
      'Catálogo sin jerarquía.',
      'Copy centrado en características sin beneficios.',
    ],
    smartQuestions: [
      '¿La venta será por checkout, WhatsApp o formulario?',
      '¿El producto necesita más imagen, garantía o explicación?',
      '¿Quieres página de producto único, colección o catálogo completo?',
    ],
    agentCue:
      'Lo trataré como ecommerce: prioridad a producto visible, beneficios, confianza, garantías y CTA de compra.',
  },

  [SECTOR_PLAYBOOK_IDS.REAL_ESTATE]: {
    id: SECTOR_PLAYBOOK_IDS.REAL_ESTATE,
    label: 'Inmobiliaria',
    description:
      'Playbook sectorial para inmobiliarias, agentes, captación de propietarios, venta/alquiler de inmuebles y valoración.',
    userIntent:
      'El usuario puede querer captar compradores, propietarios, solicitudes de valoración o mostrar inmuebles.',
    conversionTarget: 'solicitar valoración, contacto o visita',
    primaryCtas: [
      'Solicitar valoración',
      'Ver inmuebles',
      'Agendar visita',
      'Hablar con un agente',
      'Vender mi vivienda',
    ],
    requiredBlocks: [
      'tipo de operación',
      'zona o especialidad',
      'inmuebles destacados',
      'valoración o captación',
      'confianza del agente',
      'proceso de venta/alquiler',
      'CTA de contacto',
    ],
    visualDirection: {
      mood: 'profesional, visual y confiable',
      layout:
        'hero con zona/resultado, inmuebles o valoración, confianza, proceso y CTA',
      colorLogic:
        'usar estilo premium o local según posicionamiento; CTA muy reconocible',
      imageLogic:
        'usar inmuebles, interiores, zona, agente, mapas o tarjetas de propiedad',
    },
    conversionRules: [
      'Debe quedar claro si se busca comprador, propietario o ambos.',
      'La zona o especialidad aumenta relevancia.',
      'La valoración es un CTA potente para captar propietarios.',
      'Las fotos de inmuebles deben tener jerarquía.',
      'El proceso de venta reduce incertidumbre.',
    ],
    commonMistakes: [
      'No diferenciar venta, alquiler o captación.',
      'No mostrar zona.',
      'CTA genérico.',
      'Inmuebles sin jerarquía.',
      'No explicar proceso ni confianza del agente.',
    ],
    smartQuestions: [
      '¿El objetivo es captar propietarios, compradores, alquileres o visitas?',
      '¿La inmobiliaria trabaja por zona, tipo de inmueble o servicio premium?',
      '¿El CTA principal debe ser valoración, visita o contacto?',
    ],
    agentCue:
      'Lo trataré como inmobiliaria: prioridad a zona, inmuebles, valoración, confianza y CTA de contacto o visita.',
  },

  [SECTOR_PLAYBOOK_IDS.CREATOR_CONTENT]: {
    id: SECTOR_PLAYBOOK_IDS.CREATOR_CONTENT,
    label: 'Creador / contenido / comunidad',
    description:
      'Playbook sectorial para creadores, newsletters, podcasts, comunidades, contenido premium, marca personal y recursos.',
    userIntent:
      'El usuario quiere captar audiencia, monetizar contenido, presentar una comunidad o vender recursos digitales.',
    conversionTarget: 'suscripción, comunidad o acceso',
    primaryCtas: [
      'Suscribirme',
      'Unirme a la comunidad',
      'Ver recursos',
      'Acceder al contenido',
      'Recibir la guía',
      'Explorar biblioteca',
    ],
    requiredBlocks: [
      'propuesta de contenido',
      'para quién es',
      'beneficio de seguir/suscribirse',
      'recursos o categorías',
      'prueba social',
      'modelo de acceso',
      'CTA de suscripción',
    ],
    visualDirection: {
      mood: 'personal, claro y orientado a comunidad',
      layout:
        'promesa de contenido, categorías, recursos, comunidad y CTA de suscripción',
      colorLogic:
        'permitir identidad más personal; CTA de acceso debe dominar',
      imageLogic:
        'usar retrato, portadas, recursos, newsletter, comunidad o tarjetas de contenido',
    },
    conversionRules: [
      'Debe quedar claro por qué seguir o suscribirse.',
      'El contenido debe agruparse por utilidad, no solo por formato.',
      'La comunidad necesita promesa y reglas de valor.',
      'El acceso premium debe justificar qué se desbloquea.',
      'El CTA debe ser de suscripción, acceso o comunidad.',
    ],
    commonMistakes: [
      'Hablar solo del creador sin explicar beneficio.',
      'No ordenar recursos.',
      'CTA débil.',
      'No diferenciar gratuito y premium.',
      'No explicar frecuencia, valor o temática.',
    ],
    smartQuestions: [
      '¿El objetivo es newsletter, comunidad, biblioteca, curso o contenido premium?',
      '¿El público viene por aprendizaje, entretenimiento, negocio o productividad?',
      '¿El acceso será gratuito, freemium, membresía o pago único?',
    ],
    agentCue:
      'Lo trataré como creador/contenido: prioridad a propuesta de valor, recursos, comunidad, acceso y suscripción.',
  },

  [SECTOR_PLAYBOOK_IDS.OFFICE_OPERATIONS]: {
    id: SECTOR_PLAYBOOK_IDS.OFFICE_OPERATIONS,
    label: 'Oficina / operaciones internas',
    description:
      'Playbook sectorial para automatizar procesos de oficina, emails, documentos, CRM, tareas, facturas, soporte o administración.',
    userIntent:
      'El usuario quiere ahorrar tiempo, reducir errores, ordenar procesos y automatizar tareas repetitivas.',
    conversionTarget: 'mapear o crear automatización',
    primaryCtas: [
      'Mapear proceso',
      'Diseñar automatización',
      'Crear flujo',
      'Conectar herramientas',
      'Automatizar emails',
    ],
    requiredBlocks: [
      'proceso actual',
      'fricciones',
      'entradas',
      'flujo automatizado',
      'salidas',
      'excepciones',
      'primer paso operativo',
    ],
    visualDirection: {
      mood: 'operativo, sistemático y claro',
      layout:
        'mapa de proceso, pasos, herramientas, responsables, salidas y control',
      colorLogic:
        'usar color para estados y prioridades; evitar decoración sin función',
      imageLogic:
        'usar diagramas, flujos, paneles, conectores, tablas o timeline operativo',
    },
    conversionRules: [
      'No automatizar sin mapear el proceso.',
      'Toda propuesta debe incluir entrada, transformación, salida y control.',
      'Debe diferenciar tareas humanas y automáticas.',
      'Las excepciones deben contemplarse desde el inicio.',
      'La primera versión debe resolver un flujo concreto.',
    ],
    commonMistakes: [
      'Automatización genérica sin proceso.',
      'No definir herramientas.',
      'No prever errores.',
      'No explicar qué se genera al final.',
      'Prometer automatizar toda la oficina de golpe.',
    ],
    smartQuestions: [
      '¿Qué proceso quieres automatizar primero?',
      '¿Qué herramientas intervienen hoy?',
      '¿Qué debe revisar una persona y qué puede hacer el sistema automáticamente?',
    ],
    agentCue:
      'Lo trataré como operaciones internas: prioridad a proceso, herramientas, flujo, salidas, excepciones y automatización controlada.',
  },
});

export const SECTOR_PLAYBOOK_ALIASES = Object.freeze({
  [SECTOR_PLAYBOOK_IDS.RESTAURANT]: [
    'restaurante',
    'restauracion',
    'restauración',
    'comida',
    'cocina',
    'carta',
    'menu',
    'menú',
    'reservar mesa',
    'mesa',
    'platos',
    'gastronomia',
    'gastronomía',
  ],
  [SECTOR_PLAYBOOK_IDS.CAFE_BAR]: [
    'cafeteria',
    'cafetería',
    'bar',
    'brunch',
    'desayunos',
    'terraza',
    'copas',
    'tardeo',
    'cafe',
    'café',
  ],
  [SECTOR_PLAYBOOK_IDS.LAW_FIRM]: [
    'abogado',
    'abogada',
    'despacho',
    'legal',
    'juridico',
    'jurídico',
    'ley',
    'derecho',
    'consulta legal',
    'divorcio',
    'laboral',
    'penal',
    'civil',
  ],
  [SECTOR_PLAYBOOK_IDS.ACCOUNTING_ADVISORY]: [
    'gestoria',
    'gestoría',
    'asesoria',
    'asesoría',
    'fiscal',
    'laboral',
    'contable',
    'autonomos',
    'autónomos',
    'impuestos',
    'declaracion',
    'declaración',
  ],
  [SECTOR_PLAYBOOK_IDS.CLINIC_HEALTH]: [
    'clinica',
    'clínica',
    'salud',
    'estetica',
    'estética',
    'fisioterapia',
    'fisio',
    'odontologia',
    'odontología',
    'dentista',
    'terapia',
    'psicologia',
    'psicología',
    'tratamiento',
    'cita medica',
    'cita médica',
  ],
  [SECTOR_PLAYBOOK_IDS.AGENCY]: [
    'agencia',
    'marketing',
    'seo',
    'publicidad',
    'ads',
    'diseño web',
    'desarrollo web',
    'consultoria digital',
    'consultoría digital',
    'growth',
    'cro',
    'estrategia digital',
  ],
  [SECTOR_PLAYBOOK_IDS.EDUCATION_SCHOOL]: [
    'escuela',
    'academia',
    'curso',
    'formacion',
    'formación',
    'mentoria',
    'mentoría',
    'masterclass',
    'alumnos',
    'lms',
    'programa educativo',
    'comunidad educativa',
  ],
  [SECTOR_PLAYBOOK_IDS.ECOMMERCE]: [
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
    'stock',
  ],
  [SECTOR_PLAYBOOK_IDS.REAL_ESTATE]: [
    'inmobiliaria',
    'inmueble',
    'vivienda',
    'piso',
    'casa',
    'alquiler',
    'venta vivienda',
    'propietarios',
    'valoracion',
    'valoración',
    'visita',
    'agente inmobiliario',
  ],
  [SECTOR_PLAYBOOK_IDS.CREATOR_CONTENT]: [
    'creador',
    'creator',
    'contenido',
    'newsletter',
    'podcast',
    'comunidad',
    'membresia',
    'membresía',
    'marca personal',
    'recursos',
    'biblioteca',
    'contenido premium',
  ],
  [SECTOR_PLAYBOOK_IDS.OFFICE_OPERATIONS]: [
    'oficina',
    'operaciones',
    'administracion',
    'administración',
    'procesos',
    'emails',
    'crm',
    'facturas',
    'documentos',
    'soporte',
    'automatizar tareas',
    'workflow',
  ],
});

export const SECTOR_PRIORITY = Object.freeze([
  SECTOR_PLAYBOOK_IDS.RESTAURANT,
  SECTOR_PLAYBOOK_IDS.CAFE_BAR,
  SECTOR_PLAYBOOK_IDS.LAW_FIRM,
  SECTOR_PLAYBOOK_IDS.ACCOUNTING_ADVISORY,
  SECTOR_PLAYBOOK_IDS.CLINIC_HEALTH,
  SECTOR_PLAYBOOK_IDS.AGENCY,
  SECTOR_PLAYBOOK_IDS.EDUCATION_SCHOOL,
  SECTOR_PLAYBOOK_IDS.ECOMMERCE,
  SECTOR_PLAYBOOK_IDS.REAL_ESTATE,
  SECTOR_PLAYBOOK_IDS.CREATOR_CONTENT,
  SECTOR_PLAYBOOK_IDS.OFFICE_OPERATIONS,
]);

export const listSectorPlaybooks = () => Object.values(SECTOR_PLAYBOOKS);

export const getSectorPlaybook = (sectorId = DEFAULT_SECTOR_PLAYBOOK_ID) =>
  SECTOR_PLAYBOOKS[sectorId] || SECTOR_PLAYBOOKS[DEFAULT_SECTOR_PLAYBOOK_ID];

export const getSectorPlaybookAliases = (sectorId = DEFAULT_SECTOR_PLAYBOOK_ID) =>
  SECTOR_PLAYBOOK_ALIASES[sectorId] || [];

export const findSectorPlaybookIdByAlias = (normalizedText = '') => {
  const value = String(normalizedText || '').toLowerCase();

  if (!value) return DEFAULT_SECTOR_PLAYBOOK_ID;

  const matches = Object.entries(SECTOR_PLAYBOOK_ALIASES)
    .map(([sectorId, aliases]) => {
      const score = aliases.reduce((total, alias) => {
        const candidate = String(alias || '').toLowerCase();
        return value.includes(candidate) ? total + 1 : total;
      }, 0);

      return {
        sectorId,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      return (
        SECTOR_PRIORITY.indexOf(a.sectorId) -
        SECTOR_PRIORITY.indexOf(b.sectorId)
      );
    });

  return matches[0]?.sectorId || DEFAULT_SECTOR_PLAYBOOK_ID;
};

export const getSectorPlaybookSummary = (sectorId = DEFAULT_SECTOR_PLAYBOOK_ID) => {
  const playbook = getSectorPlaybook(sectorId);

  return {
    id: playbook.id,
    label: playbook.label,
    conversionTarget: playbook.conversionTarget,
    primaryCtas: playbook.primaryCtas,
    requiredBlocks: playbook.requiredBlocks,
    visualDirection: playbook.visualDirection,
    conversionRules: playbook.conversionRules,
    smartQuestions: playbook.smartQuestions,
    agentCue: playbook.agentCue,
  };
};