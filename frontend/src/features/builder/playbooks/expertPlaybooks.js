export const EXPERT_PLAYBOOK_IDS = Object.freeze({
  CRO_RESCUE: 'cro_rescue',
  HIGH_TICKET_AUTHORITY: 'high_ticket_authority',
  LOCAL_CONVERSION: 'local_conversion',
  SAAS_ACTIVATION: 'saas_activation',
  AI_TOOL_MONETIZATION: 'ai_tool_monetization',
  AUTOMATION_ARCHITECT: 'automation_architect',
  AGENCY_OPERATOR: 'agency_operator',
});

export const DEFAULT_EXPERT_PLAYBOOK_ID = EXPERT_PLAYBOOK_IDS.CRO_RESCUE;

export const EXPERT_PLAYBOOKS = Object.freeze({
  [EXPERT_PLAYBOOK_IDS.CRO_RESCUE]: {
    id: EXPERT_PLAYBOOK_IDS.CRO_RESCUE,
    label: 'CRO Rescue',
    description:
      'Playbook experto para rescatar páginas, landings o flujos que tienen visitas, interés o potencial, pero no convierten bien.',
    suitableFor: [
      'landing con baja conversión',
      'web con CTA débil',
      'página confusa',
      'oferta mal explicada',
      'embudo roto',
      'proyecto que no genera leads suficientes',
    ],
    primaryObjective:
      'Detectar fugas de conversión y aplicar cambios visibles que aumenten claridad, confianza y acción.',
    coreDiagnosis: [
      'hero poco específico',
      'CTA principal débil o escondido',
      'exceso de texto sin jerarquía',
      'beneficios genéricos',
      'falta de prueba social o autoridad',
      'objeciones sin resolver',
      'demasiadas acciones compitiendo',
    ],
    interventionSequence: [
      {
        id: 'clarify-offer',
        label: 'Clarificar oferta',
        action:
          'Reescribir titular, subtítulo y promesa para que el usuario entienda qué obtiene y por qué importa.',
      },
      {
        id: 'strengthen-cta',
        label: 'Reforzar CTA',
        action:
          'Hacer visible una acción principal dominante y reducir CTAs secundarios que distraen.',
      },
      {
        id: 'reorder-sections',
        label: 'Reordenar secciones',
        action:
          'Mover confianza, beneficios y objeciones al lugar donde más ayudan a decidir.',
      },
      {
        id: 'reduce-friction',
        label: 'Reducir fricción',
        action:
          'Simplificar textos, formularios, pasos, navegación y decisiones innecesarias.',
      },
      {
        id: 'add-proof',
        label: 'Añadir prueba',
        action:
          'Incorporar señales de confianza: casos, reseñas, método, garantías, datos o experiencia.',
      },
    ],
    conversionRules: [
      'Toda sección debe acercar al usuario a una decisión.',
      'El CTA principal debe ser reconocible en menos de tres segundos.',
      'El primer bloque debe responder qué es, para quién es y qué acción tomar.',
      'Una mejora de conversión debe cambiar copy, jerarquía o CTA; no solo color.',
      'Si el usuario pide “más conversión”, el sistema debe actuar sobre promesa, fricción, confianza y CTA.',
    ],
    visualRules: [
      'Aumentar contraste del CTA principal.',
      'Reducir ruido visual en bloques secundarios.',
      'Jerarquizar beneficios con tarjetas o bullets escaneables.',
      'Usar espacio para separar decisión, prueba y acción.',
      'Evitar decoración que no aporte claridad comercial.',
    ],
    smartQuestions: [
      '¿Quieres optimizar para más leads, más reservas, más ventas o más llamadas?',
      '¿El usuario llega frío o ya conoce la oferta?',
      '¿La mayor fricción está en confianza, precio, claridad o urgencia?',
    ],
    agentResponsePattern:
      'Detecto una oportunidad CRO. Voy a reforzar promesa, CTA, confianza y jerarquía para que la página conduzca mejor a la acción principal.',
  },

  [EXPERT_PLAYBOOK_IDS.HIGH_TICKET_AUTHORITY]: {
    id: EXPERT_PLAYBOOK_IDS.HIGH_TICKET_AUTHORITY,
    label: 'High-Ticket Authority',
    description:
      'Playbook experto para vender servicios premium, consultoría, mentorías, transformación B2B o proyectos de alto valor.',
    suitableFor: [
      'servicio premium',
      'consultoría high-ticket',
      'mentorías caras',
      'diagnóstico estratégico',
      'programa selectivo',
      'servicio B2B',
      'proyectos a medida',
    ],
    primaryObjective:
      'Elevar percepción de valor, confianza y cualificación antes de pedir contacto o diagnóstico.',
    coreDiagnosis: [
      'oferta percibida como genérica',
      'precio alto sin suficiente justificación',
      'falta de autoridad visible',
      'proceso poco claro',
      'CTA demasiado barato o poco cualificado',
      'promesa sin mecanismo',
      'falta de filtro para leads no adecuados',
    ],
    interventionSequence: [
      {
        id: 'authority-hero',
        label: 'Hero de autoridad',
        action:
          'Crear una promesa específica con resultado, tipo de cliente y mecanismo diferencial.',
      },
      {
        id: 'diagnostic-entry',
        label: 'Entrada por diagnóstico',
        action:
          'Convertir el CTA en una acción cualificada: diagnóstico, evaluación, aplicación o llamada estratégica.',
      },
      {
        id: 'method-section',
        label: 'Método visible',
        action:
          'Explicar el proceso en fases para justificar valor y reducir incertidumbre.',
      },
      {
        id: 'risk-reduction',
        label: 'Reducción de riesgo',
        action:
          'Añadir prueba, señales de autoridad, objeciones y criterios de encaje.',
      },
      {
        id: 'qualified-close',
        label: 'Cierre cualificado',
        action:
          'Cerrar con una acción que filtre y eleve percepción, no con un CTA genérico.',
      },
    ],
    conversionRules: [
      'No usar CTAs baratos como “Comprar ahora” si el ticket exige confianza.',
      'El diagnóstico debe parecer valioso, no un formulario cualquiera.',
      'La autoridad debe aparecer antes de pedir compromiso.',
      'El método debe justificar por qué el servicio vale más.',
      'La página debe filtrar clientes, no atraer cualquier lead.',
    ],
    visualRules: [
      'Diseño sobrio, controlado y premium.',
      'Menos saturación visual y más jerarquía.',
      'CTA con presencia fuerte, pero sin agresividad ecommerce.',
      'Bloques de autoridad y método con mucho aire.',
      'Evitar efectos excesivos que reduzcan seriedad.',
    ],
    smartQuestions: [
      '¿El diagnóstico será gratuito, de pago o una llamada de filtro?',
      '¿El cliente debe percibir exclusividad, autoridad o transformación?',
      '¿Quieres captar volumen de leads o pocos leads muy cualificados?',
    ],
    agentResponsePattern:
      'Clasifico esto como oferta high-ticket. Voy a reforzar autoridad, diagnóstico inicial, método, confianza y CTA cualificado para elevar percepción de valor.',
  },

  [EXPERT_PLAYBOOK_IDS.LOCAL_CONVERSION]: {
    id: EXPERT_PLAYBOOK_IDS.LOCAL_CONVERSION,
    label: 'Local Conversion',
    description:
      'Playbook experto para convertir webs de negocios físicos en páginas orientadas a reserva, visita, llamada o WhatsApp.',
    suitableFor: [
      'restaurante',
      'bar',
      'cafetería',
      'clínica',
      'peluquería',
      'centro de estética',
      'gimnasio',
      'taller',
      'tienda local',
      'negocio de proximidad',
    ],
    primaryObjective:
      'Transformar atención local en acción inmediata: reservar, llamar, pedir cita, ver carta o llegar al local.',
    coreDiagnosis: [
      'ubicación poco visible',
      'CTA local débil',
      'falta de fotos reales',
      'horarios escondidos',
      'reseñas poco presentes',
      'servicios o carta poco claros',
      'exceso de lenguaje corporativo',
    ],
    interventionSequence: [
      {
        id: 'local-action-hero',
        label: 'Hero con acción local',
        action:
          'Mostrar qué es el negocio, dónde está y qué acción tomar: reservar, llamar o pedir cita.',
      },
      {
        id: 'visual-trust',
        label: 'Confianza visual',
        action:
          'Dar peso a fotos, ambiente, producto, equipo, local o resultado.',
      },
      {
        id: 'operational-info',
        label: 'Información operativa',
        action:
          'Hacer visibles horarios, ubicación, contacto, carta, servicios o disponibilidad.',
      },
      {
        id: 'social-proof',
        label: 'Prueba local',
        action:
          'Añadir reseñas, valoraciones, años, clientes o señales de cercanía.',
      },
      {
        id: 'instant-contact',
        label: 'Contacto rápido',
        action:
          'Priorizar WhatsApp, llamada, reserva, pedir cita o cómo llegar.',
      },
    ],
    conversionRules: [
      'Un negocio local no debe esconder contacto, ubicación ni horario.',
      'La acción principal debe responder a un comportamiento real: llamar, reservar, llegar o pedir cita.',
      'Las fotos reales aumentan confianza más que bloques abstractos.',
      'Las reseñas deben aparecer antes de cerrar la acción.',
      'El copy debe ser claro y cercano, no institucional vacío.',
    ],
    visualRules: [
      'Usar más imagen y menos abstracción.',
      'Diseño escaneable en móvil.',
      'CTA visible arriba y al final.',
      'Ubicación y horarios con lectura rápida.',
      'Tarjetas simples para servicios, carta o citas.',
    ],
    smartQuestions: [
      '¿La conversión principal será llamada, WhatsApp, reserva o visita física?',
      '¿Tienes fotos reales del local, producto o equipo?',
      '¿El usuario necesita ver carta, precios, horarios o ubicación antes de decidir?',
    ],
    agentResponsePattern:
      'Clasifico esto como conversión local. Voy a priorizar ubicación, fotos, confianza, horarios y CTA directo para reserva, llamada o WhatsApp.',
  },

  [EXPERT_PLAYBOOK_IDS.SAAS_ACTIVATION]: {
    id: EXPERT_PLAYBOOK_IDS.SAAS_ACTIVATION,
    label: 'SaaS Activation',
    description:
      'Playbook experto para herramientas SaaS, apps, plataformas y productos digitales que necesitan activar usuarios rápido.',
    suitableFor: [
      'SaaS',
      'app',
      'dashboard',
      'herramienta IA',
      'plataforma',
      'generador',
      'analizador',
      'producto con onboarding',
      'sistema con registro',
    ],
    primaryObjective:
      'Hacer que el usuario entienda el valor, pruebe el producto y llegue rápido al primer resultado.',
    coreDiagnosis: [
      'producto explicado de forma abstracta',
      'no se ve el resultado',
      'onboarding confuso',
      'CTA sin activación clara',
      'pricing prematuro',
      'casos de uso poco concretos',
      'demasiada explicación antes de probar',
    ],
    interventionSequence: [
      {
        id: 'value-first',
        label: 'Valor inmediato',
        action:
          'Explicar en el hero qué problema resuelve y qué resultado obtiene el usuario.',
      },
      {
        id: 'demo-visible',
        label: 'Demo o preview visible',
        action:
          'Mostrar una pantalla, resultado, flujo o ejemplo antes de pedir registro fuerte.',
      },
      {
        id: 'use-case-routing',
        label: 'Casos de uso',
        action:
          'Guiar por perfiles o situaciones para que el usuario reconozca su caso.',
      },
      {
        id: 'activation-path',
        label: 'Ruta de activación',
        action:
          'Diseñar un primer paso claro: probar, analizar, crear, importar o generar.',
      },
      {
        id: 'retention-hook',
        label: 'Gancho de continuidad',
        action:
          'Mostrar qué podrá iterar, guardar, exportar, conectar o mejorar después.',
      },
    ],
    conversionRules: [
      'El primer resultado debe aparecer antes de una explicación larga.',
      'El CTA debe activar una acción de producto, no solo “saber más”.',
      'Cada caso de uso debe tener una salida tangible.',
      'El onboarding debe reducir tiempo hasta valor.',
      'Si hay registro, debe quedar claro qué gana al registrarse.',
    ],
    visualRules: [
      'Mostrar interfaz, preview, output o flujo.',
      'Usar bloques por caso de uso.',
      'Destacar primer resultado o demo.',
      'Evitar hero demasiado corporativo.',
      'Usar microcopy para explicar pasos y estados.',
    ],
    smartQuestions: [
      '¿Qué primer resultado debe obtener el usuario en menos de un minuto?',
      '¿El CTA debe abrir demo, registro, análisis o creación directa?',
      '¿El producto se entiende mejor con dashboard, ejemplo, output o flujo paso a paso?',
    ],
    agentResponsePattern:
      'Clasifico esto como SaaS o producto digital. Voy a priorizar activación rápida, demo visible, casos de uso y primer resultado claro.',
  },

  [EXPERT_PLAYBOOK_IDS.AI_TOOL_MONETIZATION]: {
    id: EXPERT_PLAYBOOK_IDS.AI_TOOL_MONETIZATION,
    label: 'AI Tool Monetization',
    description:
      'Playbook experto para productos, herramientas o sistemas con IA que necesitan explicar valor, créditos, límites y monetización.',
    suitableFor: [
      'herramienta IA',
      'sistema con créditos',
      'builder con IA',
      'asistente especializado',
      'analizador IA',
      'generador IA',
      'producto low-ticket',
      'plataforma freemium',
      'sistema de informes IA',
    ],
    primaryObjective:
      'Convertir utilidad IA en valor monetizable claro, con límites, créditos, salidas tangibles y upgrade natural.',
    coreDiagnosis: [
      'promesa de IA demasiado vaga',
      'no se explica qué consume créditos',
      'no se ve salida tangible',
      'pricing desconectado del valor',
      'upgrade poco justificado',
      'demasiadas funciones sin ruta',
      'falta de confianza en el resultado',
    ],
    interventionSequence: [
      {
        id: 'tangible-output',
        label: 'Salida tangible',
        action:
          'Mostrar qué genera la IA: informe, web, código, análisis, plan, automatización o contenido.',
      },
      {
        id: 'credit-logic',
        label: 'Lógica de créditos',
        action:
          'Explicar cuándo se consumen créditos y qué obtiene el usuario a cambio.',
      },
      {
        id: 'usage-ladder',
        label: 'Escalera de uso',
        action:
          'Diferenciar prueba, creación, iteración, exportación, deploy y planes superiores.',
      },
      {
        id: 'trust-layer',
        label: 'Capa de confianza',
        action:
          'Mostrar límites, revisión, control del usuario, privacidad y trazabilidad.',
      },
      {
        id: 'upgrade-trigger',
        label: 'Momento de upgrade',
        action:
          'Vincular planes o compra de créditos a valor real, no a bloqueo arbitrario.',
      },
    ],
    conversionRules: [
      'La IA debe prometer salidas concretas, no magia abstracta.',
      'Los créditos deben sentirse como energía operativa, no castigo.',
      'El usuario debe entender qué pasa gratis, qué consume y qué desbloquea.',
      'Cada upgrade debe corresponder a más profundidad, salida o continuidad.',
      'El sistema debe explicar límites antes de generar frustración.',
    ],
    visualRules: [
      'Mostrar cápsulas de créditos o energía operativa.',
      'Usar estados de construcción, análisis o generación.',
      'Mostrar salida parcial para aumentar percepción de valor.',
      'Evitar promesas absolutas sin control.',
      'Mantener estética premium pero funcional.',
    ],
    smartQuestions: [
      '¿La monetización principal será suscripción, créditos, pago puntual o exportación?',
      '¿Qué acciones deben consumir créditos y cuáles deben ser gratuitas?',
      '¿La salida principal será informe, código, web, automatización o contenido?',
    ],
    agentResponsePattern:
      'Clasifico esto como herramienta IA monetizable. Voy a priorizar salida tangible, créditos claros, activación visible y una ruta natural hacia continuidad o upgrade.',
  },

  [EXPERT_PLAYBOOK_IDS.AUTOMATION_ARCHITECT]: {
    id: EXPERT_PLAYBOOK_IDS.AUTOMATION_ARCHITECT,
    label: 'Automation Architect',
    description:
      'Playbook experto para diseñar automatizaciones, flujos internos, integraciones, operaciones y sistemas de trabajo con control.',
    suitableFor: [
      'automatización de oficina',
      'emails automáticos',
      'CRM',
      'Make',
      'Zapier',
      'webhooks',
      'soporte',
      'facturación',
      'reservas',
      'procesos administrativos',
      'operaciones internas',
    ],
    primaryObjective:
      'Convertir una necesidad operativa en un flujo claro con entradas, salidas, herramientas, validaciones y excepciones.',
    coreDiagnosis: [
      'proceso no mapeado',
      'entradas indefinidas',
      'salidas poco claras',
      'herramientas sin responsabilidad',
      'errores no contemplados',
      'exceso de automatización sin control',
      'ausencia de revisión humana',
    ],
    interventionSequence: [
      {
        id: 'map-process',
        label: 'Mapear proceso',
        action:
          'Definir qué ocurre hoy, qué dispara el flujo, quién interviene y dónde hay fricción.',
      },
      {
        id: 'define-inputs',
        label: 'Definir entradas',
        action:
          'Identificar formularios, emails, clientes, documentos, pagos, eventos o registros.',
      },
      {
        id: 'design-workflow',
        label: 'Diseñar flujo',
        action:
          'Ordenar pasos, condiciones, herramientas, automatismos y puntos de decisión.',
      },
      {
        id: 'define-outputs',
        label: 'Definir salidas',
        action:
          'Establecer qué se crea: tareas, emails, avisos, informes, registros o respuestas.',
      },
      {
        id: 'control-exceptions',
        label: 'Controlar excepciones',
        action:
          'Añadir validaciones, errores, revisiones humanas y límites de automatización.',
      },
    ],
    conversionRules: [
      'No automatizar sin entender el proceso real.',
      'Toda automatización debe tener entrada, transformación, salida y control.',
      'Debe quedar claro qué revisa una persona y qué hace el sistema.',
      'Las excepciones son parte del diseño, no un añadido posterior.',
      'La primera versión debe resolver un flujo concreto, no toda la empresa.',
    ],
    visualRules: [
      'Representar el flujo por pasos.',
      'Usar conectores, estados y responsables.',
      'Separar entradas, acciones, decisiones y salidas.',
      'No convertir automatización en texto largo.',
      'Mostrar tablero o mapa operativo si aporta claridad.',
    ],
    smartQuestions: [
      '¿Qué evento inicia el proceso?',
      '¿Qué herramientas intervienen hoy?',
      '¿Qué debe pasar si falta información, hay error o se necesita revisión humana?',
    ],
    agentResponsePattern:
      'Clasifico esto como automatización. Voy a mapear entradas, pasos, herramientas, salidas y excepciones antes de proponer el flujo.',
  },

  [EXPERT_PLAYBOOK_IDS.AGENCY_OPERATOR]: {
    id: EXPERT_PLAYBOOK_IDS.AGENCY_OPERATOR,
    label: 'Agency Operator',
    description:
      'Playbook experto para agencias, consultores, operadores digitales y usuarios avanzados que quieren crear sistemas replicables para clientes.',
    suitableFor: [
      'agencia',
      'consultor',
      'freelance avanzado',
      'operador digital',
      'servicio para clientes',
      'sistema white-label futuro',
      'entrega rápida',
      'plantillas comerciales',
      'informes vendibles',
    ],
    primaryObjective:
      'Convertir el proyecto en un sistema replicable, vendible y operativo para entregar a terceros con menos fricción.',
    coreDiagnosis: [
      'solución poco replicable',
      'entrega manual excesiva',
      'falta de plantilla base',
      'no hay salida exportable clara',
      'no hay estructura por cliente',
      'no hay proceso de diagnóstico',
      'no hay control de iteraciones',
    ],
    interventionSequence: [
      {
        id: 'client-use-case',
        label: 'Caso de cliente',
        action:
          'Definir para qué tipo de cliente se crea el sistema y qué resultado se promete.',
      },
      {
        id: 'repeatable-template',
        label: 'Plantilla replicable',
        action:
          'Separar estructura fija, variables de cliente y componentes reutilizables.',
      },
      {
        id: 'delivery-flow',
        label: 'Flujo de entrega',
        action:
          'Ordenar diagnóstico, propuesta, construcción, revisión, exportación y despliegue.',
      },
      {
        id: 'monetization-package',
        label: 'Paquete vendible',
        action:
          'Convertir la salida en oferta: informe, landing, automatización, builder, mantenimiento o pack.',
      },
      {
        id: 'scale-layer',
        label: 'Capa de escala',
        action:
          'Preparar variantes, documentación, plantillas, créditos, roles o white-label futuro.',
      },
    ],
    conversionRules: [
      'Toda solución para agencia debe ser replicable.',
      'El sistema debe separar plantilla, cliente y salida final.',
      'La entrega debe poder explicarse como producto, no como improvisación.',
      'Debe existir un flujo claro de revisión e iteración.',
      'La monetización debe estar unida a resultado entregable.',
    ],
    visualRules: [
      'Mostrar proceso y entregables.',
      'Usar módulos reutilizables.',
      'Diferenciar diagnóstico, construcción y salida.',
      'Evitar diseños demasiado personalizados que rompan escala.',
      'Crear estructura que pueda copiarse por cliente.',
    ],
    smartQuestions: [
      '¿Esto se usará para tu propio negocio o para clientes?',
      '¿La salida será informe, web, automatización, código, deploy o pack comercial?',
      '¿Necesitas una plantilla replicable o una solución totalmente a medida?',
    ],
    agentResponsePattern:
      'Clasifico esto como sistema para operador o agencia. Voy a priorizar replicabilidad, entrega clara, monetización por paquete y salida reutilizable.',
  },
});

export const EXPERT_PLAYBOOK_ALIASES = Object.freeze({
  [EXPERT_PLAYBOOK_IDS.CRO_RESCUE]: [
    'cro',
    'conversion',
    'conversión',
    'no convierte',
    'mejorar conversion',
    'mejorar conversión',
    'optimizar',
    'embudo',
    'funnel',
    'cta debil',
    'cta débil',
    'rescate',
  ],
  [EXPERT_PLAYBOOK_IDS.HIGH_TICKET_AUTHORITY]: [
    'alto ticket',
    'high ticket',
    'premium',
    'servicio caro',
    'consultoria',
    'consultoría',
    'diagnostico',
    'diagnóstico',
    'autoridad',
    'llamada estrategica',
    'llamada estratégica',
    'aplicacion',
    'aplicación',
  ],
  [EXPERT_PLAYBOOK_IDS.LOCAL_CONVERSION]: [
    'negocio local',
    'reservas',
    'whatsapp',
    'llamadas',
    'como llegar',
    'cómo llegar',
    'horarios',
    'reseñas',
    'bar',
    'cafeteria',
    'cafetería',
    'restaurante',
    'clinica',
    'clínica',
  ],
  [EXPERT_PLAYBOOK_IDS.SAAS_ACTIVATION]: [
    'saas',
    'activar usuario',
    'activacion',
    'activación',
    'onboarding',
    'demo',
    'registro',
    'trial',
    'herramienta',
    'dashboard',
    'app',
    'software',
  ],
  [EXPERT_PLAYBOOK_IDS.AI_TOOL_MONETIZATION]: [
    'ia',
    'inteligencia artificial',
    'creditos',
    'créditos',
    'monetizar',
    'monetizacion',
    'monetización',
    'freemium',
    'builder',
    'gemas',
    'gpt',
    'asistente ia',
    'sistema maestro',
  ],
  [EXPERT_PLAYBOOK_IDS.AUTOMATION_ARCHITECT]: [
    'automatizar',
    'automatizacion',
    'automatización',
    'workflow',
    'flujo',
    'make',
    'zapier',
    'webhook',
    'crm',
    'emails',
    'procesos',
    'oficina',
    'tareas',
  ],
  [EXPERT_PLAYBOOK_IDS.AGENCY_OPERATOR]: [
    'agencia',
    'cliente',
    'clientes',
    'freelance',
    'consultor',
    'operador',
    'white label',
    'replicable',
    'plantilla',
    'entrega',
    'pack',
    'vender a terceros',
  ],
});

export const EXPERT_PLAYBOOK_PRIORITY = Object.freeze([
  EXPERT_PLAYBOOK_IDS.HIGH_TICKET_AUTHORITY,
  EXPERT_PLAYBOOK_IDS.CRO_RESCUE,
  EXPERT_PLAYBOOK_IDS.AI_TOOL_MONETIZATION,
  EXPERT_PLAYBOOK_IDS.SAAS_ACTIVATION,
  EXPERT_PLAYBOOK_IDS.AUTOMATION_ARCHITECT,
  EXPERT_PLAYBOOK_IDS.AGENCY_OPERATOR,
  EXPERT_PLAYBOOK_IDS.LOCAL_CONVERSION,
]);

export const listExpertPlaybooks = () => Object.values(EXPERT_PLAYBOOKS);

export const getExpertPlaybook = (playbookId = DEFAULT_EXPERT_PLAYBOOK_ID) =>
  EXPERT_PLAYBOOKS[playbookId] || EXPERT_PLAYBOOKS[DEFAULT_EXPERT_PLAYBOOK_ID];

export const getExpertPlaybookAliases = (playbookId = DEFAULT_EXPERT_PLAYBOOK_ID) =>
  EXPERT_PLAYBOOK_ALIASES[playbookId] || [];

export const findExpertPlaybookIdByAlias = (normalizedText = '') => {
  const value = String(normalizedText || '').toLowerCase();

  if (!value) return DEFAULT_EXPERT_PLAYBOOK_ID;

  const matches = Object.entries(EXPERT_PLAYBOOK_ALIASES)
    .map(([playbookId, aliases]) => {
      const score = aliases.reduce((total, alias) => {
        const candidate = String(alias || '').toLowerCase();
        return value.includes(candidate) ? total + 1 : total;
      }, 0);

      return {
        playbookId,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      return (
        EXPERT_PLAYBOOK_PRIORITY.indexOf(a.playbookId) -
        EXPERT_PLAYBOOK_PRIORITY.indexOf(b.playbookId)
      );
    });

  return matches[0]?.playbookId || DEFAULT_EXPERT_PLAYBOOK_ID;
};

export const getExpertPlaybookSummary = (playbookId = DEFAULT_EXPERT_PLAYBOOK_ID) => {
  const playbook = getExpertPlaybook(playbookId);

  return {
    id: playbook.id,
    label: playbook.label,
    primaryObjective: playbook.primaryObjective,
    agentResponsePattern: playbook.agentResponsePattern,
    smartQuestions: playbook.smartQuestions,
    conversionRules: playbook.conversionRules,
  };
};