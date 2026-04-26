const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const includesAny = (text, terms) => terms.some((term) => text.includes(term));

const detectMode = (text) => {
  if (URL_PATTERN.test(text)) return 'transform';

  if (
    includesAny(text, [
      'mi web',
      'web existente',
      'pagina actual',
      'pagina existente',
      'mejorar una web',
      'redisenar',
      'rediseñar',
      'auditar',
      'analizar url',
    ])
  ) {
    return 'transform';
  }

  return 'create';
};

const detectRequestedChanges = (text) => ({
  ctas: includesAny(text, ['cta', 'boton', 'botones', 'llamada a la accion', 'llamada a la acción']),
  cards: includesAny(text, ['tarjeta', 'tarjetas', 'cards', 'bloques']),
  colors: includesAny(text, ['color', 'colores', 'naranja', 'verde', 'cian', 'azul', 'blanco', 'negro', 'claro', 'oscuro']),
  background: includesAny(text, ['fondo', 'background', 'degradado', 'difuminado', 'glow']),
  copy: includesAny(text, ['texto', 'copy', 'mensaje', 'titulo', 'subtitulo', 'promesa']),
  layout: includesAny(text, ['estructura', 'maquetacion', 'maquetación', 'layout', 'ordenar', 'secciones']),
  visual: includesAny(text, ['premium', 'bonito', 'elegante', 'moderno', 'sofisticado', 'profesional']),
  conversion: includesAny(text, ['vender', 'conversion', 'conversión', 'captar', 'leads', 'clientes', 'reservas', 'whatsapp', 'llamadas']),
});

const detectVisualDirection = (text) => {
  if (includesAny(text, ['naranja', 'calido', 'cálido', 'energia', 'energía'])) return 'warm_orange';
  if (includesAny(text, ['claro', 'blanco', 'limpio', 'minimalista'])) return 'clean_light';
  if (includesAny(text, ['conversion', 'conversión', 'vende', 'ventas', 'agresivo'])) return 'high_conversion';
  if (includesAny(text, ['editorial', 'sobrio', 'serio', 'institucional'])) return 'editorial_sober';
  if (includesAny(text, ['cian', 'verde', 'tecnologico', 'tecnológico', 'ia', 'matrix'])) return 'tech_cyan';
  if (includesAny(text, ['premium', 'elegante', 'sofisticado', 'oscuro'])) return 'premium_dark';

  return 'balanced';
};

const detectConversionGoal = (text) => {
  if (includesAny(text, ['reserva', 'reservas', 'cita', 'citas'])) return 'reservations';
  if (includesAny(text, ['whatsapp', 'wasap'])) return 'whatsapp';
  if (includesAny(text, ['llamada', 'llamar', 'telefono', 'teléfono'])) return 'calls';
  if (includesAny(text, ['lead', 'leads', 'captar', 'formulario'])) return 'leads';
  if (includesAny(text, ['venta', 'vender', 'comprar', 'checkout', 'pago'])) return 'sales';
  if (includesAny(text, ['registro', 'registrar', 'cuenta'])) return 'signup';

  return 'activation';
};

const detectTemplateType = (text) => {
  if (includesAny(text, ['gpts personalizados', 'gpt personalizado', 'landing de gpts', 'hub de gpts', 'tarjetas gpt'])) {
    return 'gpt_hub_landing';
  }

  if (includesAny(text, ['restaurante', 'reservas', 'menu', 'menú', 'carta'])) {
    return 'local_business_landing';
  }

  if (includesAny(text, ['escuela', 'alumnos', 'curso', 'academia', 'formacion', 'formación'])) {
    return 'education_landing';
  }

  if (includesAny(text, ['saas', 'software', 'herramienta', 'plataforma'])) {
    return 'saas_landing';
  }

  return 'generic_landing';
};

const calculateConfidence = ({ text, requestedChanges, visualDirection, conversionGoal }) => {
  const hasSpecificTarget =
    requestedChanges.ctas ||
    requestedChanges.cards ||
    requestedChanges.colors ||
    requestedChanges.background ||
    requestedChanges.copy ||
    requestedChanges.layout;

  const isVeryVague = includesAny(text, ['mas bonito', 'más bonito', 'mejoralo', 'mejóralo', 'no me convence']);

  if (hasSpecificTarget && visualDirection !== 'balanced') return 'high';
  if (hasSpecificTarget || conversionGoal !== 'activation') return 'medium';
  if (isVeryVague) return 'low';

  return 'medium';
};

const buildClarifyingQuestion = ({ confidence, requestedChanges, visualDirection, conversionGoal }) => {
  if (confidence !== 'low') return null;

  if (requestedChanges.colors || requestedChanges.background) {
    return {
      id: 'visual_direction',
      question: '¿Qué dirección visual quieres aplicar?',
      options: ['Premium oscuro', 'Naranja cálido', 'Claro limpio'],
    };
  }

  if (conversionGoal === 'activation') {
    return {
      id: 'conversion_goal',
      question: '¿Qué acción quieres priorizar?',
      options: ['Captar leads', 'Vender más', 'Generar reservas'],
    };
  }

  if (visualDirection === 'balanced') {
    return {
      id: 'style_direction',
      question: '¿Qué estilo quieres reforzar?',
      options: ['Más premium', 'Más directo', 'Más conversión'],
    };
  }

  return null;
};

export const interpretBuilderIntent = (rawInput = '', context = {}) => {
  const text = normalizeText(rawInput);
  const mode = detectMode(text);
  const requestedChanges = detectRequestedChanges(text);
  const visualDirection = detectVisualDirection(text);
  const conversionGoal = detectConversionGoal(text);
  const templateType = detectTemplateType(text);

  const confidence = calculateConfidence({
    text,
    requestedChanges,
    visualDirection,
    conversionGoal,
  });

  const clarifyingQuestion = buildClarifyingQuestion({
    confidence,
    requestedChanges,
    visualDirection,
    conversionGoal,
  });

  return {
    rawInput,
    normalizedInput: text,
    mode,
    templateType,
    requestedChanges,
    visualDirection,
    conversionGoal,
    confidence,
    shouldAsk: Boolean(clarifyingQuestion),
    clarifyingQuestion,
    context,
  };
};

export const summarizeBuilderIntent = (intent) => {
  if (!intent) return 'Intención pendiente de interpretar.';

  const modeLabel = intent.mode === 'transform' ? 'mejorar una web existente' : 'crear una nueva pieza digital';
  const goalLabel = intent.conversionGoal || 'activation';
  const visualLabel = intent.visualDirection || 'balanced';

  return `El usuario quiere ${modeLabel}, con foco ${goalLabel} y dirección visual ${visualLabel}.`;
};

export default interpretBuilderIntent;