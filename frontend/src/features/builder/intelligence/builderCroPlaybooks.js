const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const CRO_PLAYBOOK_IDS = {
  ACTIVATION: 'activation',
  LEADS: 'leads',
  SALES: 'sales',
  SIGNUP: 'signup',
  RESERVATIONS: 'reservations',
  WHATSAPP: 'whatsapp',
  CALLS: 'calls',
  LOCAL_BUSINESS: 'local_business',
  GPT_HUB: 'gpt_hub',
  SAAS: 'saas',
  EDUCATION: 'education',
};

export const CRO_PRIORITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const BUILDER_CRO_PLAYBOOKS = {
  activation: {
    id: CRO_PLAYBOOK_IDS.ACTIVATION,
    label: 'Activación inicial',
    objective: 'Convertir intención inicial en una primera acción clara.',
    primaryMetric: 'inicio de proyecto',
    recommendedCtas: ['Crear mi primer proyecto', 'Analizar una URL', 'Ver cómo funciona'],
    principles: [
      'Promesa clara en el primer impacto.',
      'CTA principal visible sin competir con opciones secundarias.',
      'Explicar rápido qué ocurre después del clic.',
      'Reducir miedo a empezar.',
    ],
    quickWins: [
      'Reforzar headline con resultado concreto.',
      'Usar un CTA de acción directa.',
      'Añadir microcopy de continuidad debajo del CTA.',
    ],
  },

  leads: {
    id: CRO_PLAYBOOK_IDS.LEADS,
    label: 'Captación de leads',
    objective: 'Convertir visitas en contactos o solicitudes.',
    primaryMetric: 'lead generado',
    recommendedCtas: ['Solicitar diagnóstico', 'Recibir propuesta', 'Dejar mis datos'],
    principles: [
      'Mostrar beneficio antes de pedir datos.',
      'Reducir campos innecesarios.',
      'Dar una razón concreta para contactar.',
      'Añadir señales de confianza cercanas al formulario.',
    ],
    quickWins: [
      'Cambiar CTA genérico por CTA de valor.',
      'Añadir prueba de confianza cerca del formulario.',
      'Clarificar qué recibirá el usuario después.',
    ],
  },

  sales: {
    id: CRO_PLAYBOOK_IDS.SALES,
    label: 'Venta directa',
    objective: 'Guiar al usuario hacia compra o contratación.',
    primaryMetric: 'compra o checkout',
    recommendedCtas: ['Empezar ahora', 'Ver planes', 'Activar sistema'],
    principles: [
      'Mostrar valor antes del precio.',
      'Eliminar fricción antes del pago.',
      'Separar plan recomendado de planes secundarios.',
      'Resolver objeciones antes del CTA final.',
    ],
    quickWins: [
      'Destacar un plan recomendado.',
      'Añadir garantía, prueba o explicación del valor.',
      'Evitar demasiados CTAs con el mismo peso.',
    ],
  },

  signup: {
    id: CRO_PLAYBOOK_IDS.SIGNUP,
    label: 'Registro',
    objective: 'Reducir fricción para crear cuenta.',
    primaryMetric: 'cuenta creada',
    recommendedCtas: ['Crear cuenta', 'Empezar gratis', 'Probar ahora'],
    principles: [
      'No pedir demasiada información antes de enseñar valor.',
      'Mostrar qué obtiene el usuario al registrarse.',
      'Usar CTA claro y sin ambigüedad.',
    ],
    quickWins: [
      'Añadir beneficio inmediato junto al CTA.',
      'Evitar copy largo antes del registro.',
      'Mostrar continuidad después de crear cuenta.',
    ],
  },

  reservations: {
    id: CRO_PLAYBOOK_IDS.RESERVATIONS,
    label: 'Reservas',
    objective: 'Transformar visitas en reservas.',
    primaryMetric: 'reserva iniciada',
    recommendedCtas: ['Reservar ahora', 'Ver disponibilidad', 'Confirmar reserva'],
    principles: [
      'Mostrar acción de reserva sin buscar demasiado.',
      'Reforzar confianza antes del CTA.',
      'Reducir pasos para reservar.',
      'Hacer visible disponibilidad, horario o contacto.',
    ],
    quickWins: [
      'Mover reserva al hero.',
      'Añadir botón fijo o bloque final de reserva.',
      'Separar carta/servicios de acción principal.',
    ],
  },

  whatsapp: {
    id: CRO_PLAYBOOK_IDS.WHATSAPP,
    label: 'WhatsApp',
    objective: 'Convertir intención en conversación directa.',
    primaryMetric: 'clic a WhatsApp',
    recommendedCtas: ['Escribir por WhatsApp', 'Hablar ahora', 'Pedir información'],
    principles: [
      'El CTA debe indicar conversación directa.',
      'El usuario debe saber qué preguntar o pedir.',
      'El botón no debe competir con acciones secundarias.',
    ],
    quickWins: [
      'Cambiar CTA principal a WhatsApp.',
      'Añadir microcopy: “respuesta rápida” o “te orientamos”.',
      'Repetir CTA al cierre con contexto.',
    ],
  },

  calls: {
    id: CRO_PLAYBOOK_IDS.CALLS,
    label: 'Llamadas',
    objective: 'Generar llamadas cualificadas.',
    primaryMetric: 'clic de llamada',
    recommendedCtas: ['Llamar ahora', 'Solicitar llamada', 'Hablar con un especialista'],
    principles: [
      'Mostrar número o acción sin fricción.',
      'Explicar cuándo conviene llamar.',
      'Usar confianza antes de pedir llamada.',
    ],
    quickWins: [
      'CTA de llamada en hero.',
      'Horario visible cerca del CTA.',
      'Bloque de dudas frecuentes antes del cierre.',
    ],
  },

  local_business: {
    id: CRO_PLAYBOOK_IDS.LOCAL_BUSINESS,
    label: 'Negocio local',
    objective: 'Convertir visitas en reservas, llamadas o contacto local.',
    primaryMetric: 'contacto local',
    recommendedCtas: ['Reservar ahora', 'Llamar ahora', 'Ver ubicación'],
    principles: [
      'Priorizar acción local inmediata.',
      'Mostrar confianza, cercanía y disponibilidad.',
      'Evitar estructuras demasiado corporativas.',
      'Hacer visibles servicios, horarios y contacto.',
    ],
    quickWins: [
      'Hero con acción directa.',
      'Bloque de confianza local.',
      'CTA repetido al final con contacto claro.',
    ],
  },

  gpt_hub: {
    id: CRO_PLAYBOOK_IDS.GPT_HUB,
    label: 'Hub de GPTs',
    objective: 'Guiar al usuario hacia el GPT correcto y abrir continuidad con Sistema Maestro.',
    primaryMetric: 'clic a GPT o activación del Builder',
    recommendedCtas: ['Abrir GPT recomendado', 'Ver todos los GPTs', 'Crear mi propio hub IA'],
    principles: [
      'Cada tarjeta debe resolver un caso de uso claro.',
      'El usuario debe entender qué GPT abrir primero.',
      'No saturar con demasiadas opciones iguales.',
      'Mantener CTA de regreso a Sistema Maestro.',
    ],
    quickWins: [
      'Agrupar GPTs por uso.',
      'Destacar uno recomendado.',
      'Añadir CTA final hacia Builder o plantilla propia.',
    ],
  },

  saas: {
    id: CRO_PLAYBOOK_IDS.SAAS,
    label: 'SaaS / herramienta',
    objective: 'Convertir interés en prueba, registro o demo.',
    primaryMetric: 'trial, demo o registro',
    recommendedCtas: ['Probar ahora', 'Ver demo', 'Crear cuenta'],
    principles: [
      'Explicar problema, solución y resultado rápido.',
      'Mostrar producto antes de texto largo.',
      'Reducir fricción inicial.',
      'Diferenciar planes sin saturar.',
    ],
    quickWins: [
      'Hero con resultado concreto.',
      'Captura o preview del producto.',
      'CTA principal de prueba.',
    ],
  },

  education: {
    id: CRO_PLAYBOOK_IDS.EDUCATION,
    label: 'Educación / formación',
    objective: 'Captar alumnos o solicitudes de información.',
    primaryMetric: 'solicitud o inscripción',
    recommendedCtas: ['Solicitar información', 'Ver programa', 'Reservar plaza'],
    principles: [
      'Clarificar transformación del alumno.',
      'Mostrar confianza y método.',
      'Reducir incertidumbre sobre nivel, duración y salida.',
      'CTA claro hacia información o inscripción.',
    ],
    quickWins: [
      'Promesa concreta para el alumno.',
      'Bloque de método.',
      'CTA de solicitud visible.',
    ],
  },
};

export const CRO_AUDIT_AREAS = {
  HERO: {
    id: 'hero',
    label: 'Hero',
    priority: CRO_PRIORITY_LEVELS.CRITICAL,
    checks: [
      '¿La promesa se entiende en menos de 5 segundos?',
      '¿El CTA principal está visible?',
      '¿El usuario sabe qué pasa después del clic?',
    ],
  },

  CTA: {
    id: 'cta',
    label: 'CTA',
    priority: CRO_PRIORITY_LEVELS.CRITICAL,
    checks: [
      '¿Hay una acción principal clara?',
      '¿El CTA usa verbo de acción?',
      '¿Los CTAs secundarios no compiten con el principal?',
    ],
  },

  TRUST: {
    id: 'trust',
    label: 'Confianza',
    priority: CRO_PRIORITY_LEVELS.HIGH,
    checks: [
      '¿Hay señales de confianza cerca de la acción?',
      '¿Se reduce el riesgo percibido?',
      '¿El usuario entiende por qué confiar?',
    ],
  },

  FRICTION: {
    id: 'friction',
    label: 'Fricción',
    priority: CRO_PRIORITY_LEVELS.HIGH,
    checks: [
      '¿Hay demasiadas decisiones simultáneas?',
      '¿El recorrido tiene pasos innecesarios?',
      '¿La lectura se corta antes de la acción?',
    ],
  },

  VISUAL_HIERARCHY: {
    id: 'visual_hierarchy',
    label: 'Jerarquía visual',
    priority: CRO_PRIORITY_LEVELS.HIGH,
    checks: [
      '¿El ojo va primero a la promesa?',
      '¿El CTA destaca con claridad?',
      '¿Las tarjetas no compiten entre sí?',
    ],
  },

  MONETIZATION: {
    id: 'monetization',
    label: 'Monetización',
    priority: CRO_PRIORITY_LEVELS.MEDIUM,
    checks: [
      '¿Está claro el siguiente nivel de valor?',
      '¿Hay continuidad hacia plan, créditos, informe o Builder?',
      '¿El usuario entiende por qué avanzar?',
    ],
  },
};

export const resolveCroPlaybookId = (intent = {}) => {
  if (intent.templateType === 'gpt_hub_landing') return CRO_PLAYBOOK_IDS.GPT_HUB;
  if (intent.templateType === 'local_business_landing') return CRO_PLAYBOOK_IDS.LOCAL_BUSINESS;
  if (intent.templateType === 'education_landing') return CRO_PLAYBOOK_IDS.EDUCATION;
  if (intent.templateType === 'saas_landing') return CRO_PLAYBOOK_IDS.SAAS;

  if (intent.conversionGoal && BUILDER_CRO_PLAYBOOKS[intent.conversionGoal]) {
    return intent.conversionGoal;
  }

  return CRO_PLAYBOOK_IDS.ACTIVATION;
};

export const getCroPlaybook = (playbookId = CRO_PLAYBOOK_IDS.ACTIVATION) =>
  BUILDER_CRO_PLAYBOOKS[playbookId] || BUILDER_CRO_PLAYBOOKS[CRO_PLAYBOOK_IDS.ACTIVATION];

export const buildCroRecommendations = (intent = {}) => {
  const playbookId = resolveCroPlaybookId(intent);
  const playbook = getCroPlaybook(playbookId);

  const recommendations = [
    {
      id: `${playbook.id}-primary-cta`,
      area: 'CTA',
      priority: CRO_PRIORITY_LEVELS.CRITICAL,
      title: 'Reforzar acción principal',
      recommendation: `Usar un CTA principal alineado con "${playbook.recommendedCtas[0]}".`,
      reason: 'El usuario necesita una acción dominante para avanzar sin fricción.',
    },
    {
      id: `${playbook.id}-hero`,
      area: 'Hero',
      priority: CRO_PRIORITY_LEVELS.CRITICAL,
      title: 'Clarificar promesa inicial',
      recommendation: 'Hacer que el primer bloque explique resultado, usuario y siguiente paso.',
      reason: 'El primer impacto determina si el usuario entiende el valor o abandona mentalmente.',
    },
    {
      id: `${playbook.id}-trust`,
      area: 'Confianza',
      priority: CRO_PRIORITY_LEVELS.HIGH,
      title: 'Añadir señal de confianza',
      recommendation: 'Colocar una prueba, explicación breve o garantía de continuidad cerca del CTA.',
      reason: 'La confianza reduce resistencia antes de pedir acción.',
    },
  ];

  if (intent.requestedChanges?.cards) {
    recommendations.push({
      id: `${playbook.id}-cards`,
      area: 'Tarjetas',
      priority: CRO_PRIORITY_LEVELS.HIGH,
      title: 'Ordenar tarjetas por intención',
      recommendation: 'Convertir cada tarjeta en una decisión clara: problema, solución o siguiente paso.',
      reason: 'Las tarjetas deben guiar, no decorar.',
    });
  }

  if (intent.requestedChanges?.colors || intent.requestedChanges?.background) {
    recommendations.push({
      id: `${playbook.id}-visual`,
      area: 'Dirección visual',
      priority: CRO_PRIORITY_LEVELS.HIGH,
      title: 'Alinear color con conversión',
      recommendation: 'Usar color para jerarquía, no solo estética.',
      reason: 'El color debe ayudar al ojo a encontrar la acción principal.',
    });
  }

  if (intent.templateType === 'gpt_hub_landing') {
    recommendations.push({
      id: 'gpt-hub-routing',
      area: 'Arquitectura GPT',
      priority: CRO_PRIORITY_LEVELS.HIGH,
      title: 'Destacar GPT recomendado',
      recommendation: 'No mostrar todos los GPTs con el mismo peso; destacar uno o agrupar por caso de uso.',
      reason: 'Demasiadas opciones iguales reducen decisión.',
    });
  }

  return recommendations;
};

export const buildCroAudit = (intent = {}) => {
  const playbookId = resolveCroPlaybookId(intent);
  const playbook = getCroPlaybook(playbookId);
  const recommendations = buildCroRecommendations(intent);

  return {
    playbookId,
    playbook,
    auditAreas: Object.values(CRO_AUDIT_AREAS),
    recommendations,
    summary: `Playbook activo: ${playbook.label}. Objetivo: ${playbook.objective}`,
  };
};

export const getCroActionCopy = (intent = {}) => {
  const playbookId = resolveCroPlaybookId(intent);
  const playbook = getCroPlaybook(playbookId);
  const normalizedInput = normalizeText(intent.rawInput || intent.normalizedInput || '');

  if (normalizedInput.includes('premium')) {
    return 'Elevo percepción de valor sin perder prioridad de clic.';
  }

  if (normalizedInput.includes('color') || normalizedInput.includes('colores')) {
    return 'Ajusto color con criterio de jerarquía visual y conversión.';
  }

  if (normalizedInput.includes('tarjeta') || normalizedInput.includes('tarjetas')) {
    return 'Reordeno tarjetas para que cada una empuje una decisión clara.';
  }

  if (normalizedInput.includes('cta') || normalizedInput.includes('boton') || normalizedInput.includes('botones')) {
    return `Reoriento CTAs hacia "${playbook.recommendedCtas[0]}" como acción principal.`;
  }

  return `Aplico criterio CRO del playbook "${playbook.label}" para reducir fricción y reforzar acción.`;
};

export default BUILDER_CRO_PLAYBOOKS;