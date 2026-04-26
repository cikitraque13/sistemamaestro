export const BUILDER_BUILD_PHASES = {
  create: [
    {
      id: 'received',
      threshold: 6,
      label: 'Orden recibida',
      agent: 'He recibido la entrada. Voy a convertirla en una primera estructura usable.',
    },
    {
      id: 'intent',
      threshold: 16,
      label: 'Leyendo intención',
      agent: 'Estoy separando promesa, usuario objetivo y acción principal para evitar una landing genérica.',
    },
    {
      id: 'structure',
      threshold: 30,
      label: 'Definiendo estructura',
      agent: 'Ahora preparo arquitectura visual: hero, CTA, bloques de valor y cierre.',
    },
    {
      id: 'code',
      threshold: 44,
      label: 'Escribiendo código',
      agent: 'Empiezo a montar componentes, estructura responsive y capas visuales.',
    },
    {
      id: 'preview',
      threshold: 58,
      label: 'Sincronizando preview',
      agent: 'La primera versión visual empieza a aparecer. Ajusto jerarquía y contraste.',
    },
    {
      id: 'decision',
      threshold: 72,
      label: 'Agente esperando dirección',
      agent: 'Antes de cerrar la versión, dime si quieres orientar el diseño a más premium, más claridad o más conversión.',
      options: ['Más premium', 'Más claridad', 'Más conversión'],
    },
    {
      id: 'conversion',
      threshold: 84,
      label: 'Ajustando conversión',
      agent: 'Refuerzo CTA principal y ordeno el recorrido para que el usuario sepa qué hacer.',
    },
    {
      id: 'ready',
      threshold: 96,
      label: 'Versión lista',
      agent: 'Primera versión lista. Puedes pedir una mejora visual, más conversión o preparar salida técnica.',
    },
  ],

  transform: [
    {
      id: 'received',
      threshold: 6,
      label: 'URL recibida',
      agent: 'He recibido la URL. Voy a analizar intención comercial y preparar una versión mejorada.',
    },
    {
      id: 'audit',
      threshold: 16,
      label: 'Auditando fricción',
      agent: 'Estoy detectando dónde la página puede perder contactos, reservas o confianza.',
    },
    {
      id: 'hero',
      threshold: 30,
      label: 'Reescribiendo hero',
      agent: 'Ahora priorizo mensaje principal, CTA visible y primera impresión.',
    },
    {
      id: 'visual',
      threshold: 44,
      label: 'Reordenando diseño',
      agent: 'Estoy preparando una versión más clara, con mejor jerarquía visual y menos ruido.',
    },
    {
      id: 'conversion',
      threshold: 58,
      label: 'Optimizando conversión',
      agent: 'Refuerzo llamada a la acción, confianza y continuidad hacia contacto, reserva o compra.',
    },
    {
      id: 'decision',
      threshold: 72,
      label: 'Agente esperando dirección',
      agent: 'Antes de cerrar esta reconstrucción, dime la prioridad comercial principal.',
      options: ['Reservas', 'WhatsApp', 'Llamadas'],
    },
    {
      id: 'preview',
      threshold: 84,
      label: 'Montando antes/después',
      agent: 'La nueva versión ya puede compararse con la estructura anterior.',
    },
    {
      id: 'ready',
      threshold: 96,
      label: 'Rediseño listo',
      agent: 'Primera reconstrucción lista. Puedes pedir cambios, mejorar fotos, reforzar CTA o preparar deploy.',
    },
  ],

  gpt_hub_landing: [
    {
      id: 'received',
      threshold: 6,
      label: 'Hub GPT recibido',
      agent: 'He recibido la idea. Voy a estructurar una landing con tarjetas de GPTs especializados.',
    },
    {
      id: 'intent',
      threshold: 16,
      label: 'Ordenando casos de uso',
      agent: 'Estoy agrupando los GPTs por utilidad para que el usuario sepa cuál abrir primero.',
    },
    {
      id: 'structure',
      threshold: 30,
      label: 'Diseñando hub',
      agent: 'Preparo hero, grid de tarjetas, CTA principal y retorno hacia Sistema Maestro.',
    },
    {
      id: 'code',
      threshold: 44,
      label: 'Escribiendo estructura',
      agent: 'Empiezo a montar tarjetas, enlaces externos, jerarquía visual y CTA final.',
    },
    {
      id: 'preview',
      threshold: 60,
      label: 'Sincronizando preview',
      agent: 'El hub empieza a verse. Ajusto peso visual de tarjetas y prioridad del GPT recomendado.',
    },
    {
      id: 'decision',
      threshold: 74,
      label: 'Agente esperando dirección',
      agent: 'Antes de cerrar el hub, dime si quieres destacar un GPT principal, agrupar por categorías o reforzar captación.',
      options: ['Destacar GPT principal', 'Agrupar por categorías', 'Reforzar captación'],
    },
    {
      id: 'conversion',
      threshold: 86,
      label: 'Ajustando captación',
      agent: 'Refuerzo CTA final para que el usuario vuelva al Builder o cree su propio hub.',
    },
    {
      id: 'ready',
      threshold: 96,
      label: 'Hub listo',
      agent: 'Primera versión del hub lista para iterar tarjetas, enlaces, categorías o salida técnica.',
    },
  ],
};

export const getBuildPhases = (mode = 'create', templateType = null) => {
  if (templateType && BUILDER_BUILD_PHASES[templateType]) {
    return BUILDER_BUILD_PHASES[templateType];
  }

  return BUILDER_BUILD_PHASES[mode] || BUILDER_BUILD_PHASES.create;
};

export const getActiveBuildPhase = ({ mode = 'create', progress = 0, templateType = null } = {}) => {
  const phases = getBuildPhases(mode, templateType);
  const active = phases.filter((phase) => progress >= phase.threshold).slice(-1)[0];

  return active || phases[0];
};

export const getVisibleBuildPhases = ({ mode = 'create', progress = 0, templateType = null } = {}) => {
  const phases = getBuildPhases(mode, templateType);

  return phases.filter((phase) => progress >= phase.threshold);
};

export const getAgentStatusFromBuildPhase = ({
  mode = 'create',
  progress = 0,
  isRunning = false,
  templateType = null,
} = {}) => {
  if (!isRunning && progress >= 100) return 'Agente esperando respuesta';
  if (!isRunning) return 'Agente preparado';

  const phase = getActiveBuildPhase({
    mode,
    progress,
    templateType,
  });

  if (phase.id === 'decision') return 'Agente esperando dirección';
  if (phase.id === 'preview') return 'Agente sincronizando preview';
  if (phase.id === 'code') return 'Agente construyendo código';
  if (phase.id === 'ready') return 'Agente listo para iterar';
  if (phase.id === 'conversion') return 'Agente afinando conversión';

  return 'Agente pensando';
};

export const buildPhaseMessages = ({
  mode = 'create',
  progress = 0,
  templateType = null,
  onDecision = () => {},
} = {}) => {
  const visiblePhases = getVisibleBuildPhases({
    mode,
    progress,
    templateType,
  });

  return visiblePhases.map((phase) => ({
    id: `phase-${phase.id}`,
    role: phase.options ? 'decision' : 'system',
    label: phase.label,
    text: phase.agent,
    options: phase.options,
    onDecision,
  }));
};

export default BUILDER_BUILD_PHASES;