import {
  getVisualPreset,
  resolveVisualPresetId,
} from '../presets/builderVisualPresets';

import {
  buildCtaState,
  applyCtaOverride,
} from '../presets/builderCtaPresets';

import {
  buildCroAudit,
  getCroActionCopy,
} from './builderCroPlaybooks';

import {
  buildPolicyDecision,
  shouldAskBeforeExecuting,
} from './builderResponsePolicy';

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const includesAny = (text, terms) => terms.some((term) => text.includes(term));

export const VISUAL_DECISION_TYPES = {
  CTA: 'cta',
  CARDS: 'cards',
  BACKGROUND: 'background',
  COLOR: 'color',
  TYPOGRAPHY: 'typography',
  SPACING: 'spacing',
  TRUST: 'trust',
  FULL_DIRECTION: 'full_direction',
};

export const VISUAL_CONFIDENCE = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const DESIGN_INTENSITY = {
  SOBER: 'sober',
  BALANCED: 'balanced',
  STRONG: 'strong',
};

export const BUILDER_VISUAL_GUARDRAILS = [
  'El color debe reforzar jerarquía, no decorar sin función.',
  'El CTA principal debe destacar más que los secundarios.',
  'Las tarjetas deben guiar decisiones, no competir visualmente.',
  'El fondo no debe reducir legibilidad.',
  'La estética premium se consigue con aire, contraste y foco, no con más elementos.',
  'No prometer resultados medibles sin datos reales.',
];

const detectVisualTargets = (input) => {
  const text = normalizeText(input);

  return {
    cta: includesAny(text, ['cta', 'boton', 'botones', 'llamada a la accion', 'llamada a la acción']),
    cards: includesAny(text, ['tarjeta', 'tarjetas', 'cards', 'bloques']),
    background: includesAny(text, ['fondo', 'background', 'degradado', 'difuminado', 'glow']),
    color: includesAny(text, ['color', 'colores', 'naranja', 'verde', 'cian', 'azul', 'blanco', 'negro']),
    typography: includesAny(text, ['tipografia', 'tipografía', 'fuente', 'letra', 'texto']),
    spacing: includesAny(text, ['aire', 'espacio', 'espaciado', 'limpio', 'menos cargado']),
    trust: includesAny(text, ['confianza', 'autoridad', 'seguro', 'garantia', 'garantía', 'prueba']),
    fullDirection: includesAny(text, ['premium', 'moderno', 'elegante', 'sofisticado', 'bonito', 'profesional']),
  };
};

const detectDesignIntensity = (input) => {
  const text = normalizeText(input);

  if (includesAny(text, ['agresivo', 'fuerte', 'impactante', 'vende mas', 'vender mas', 'conversión', 'conversion'])) {
    return DESIGN_INTENSITY.STRONG;
  }

  if (includesAny(text, ['sobrio', 'serio', 'limpio', 'minimalista', 'suave'])) {
    return DESIGN_INTENSITY.SOBER;
  }

  return DESIGN_INTENSITY.BALANCED;
};

const resolvePresetFromText = (input, fallbackPresetId = null) => {
  const text = normalizeText(input);

  if (includesAny(text, ['naranja', 'calido', 'cálido', 'calidez'])) return 'warm_orange';
  if (includesAny(text, ['claro', 'blanco', 'limpio', 'minimalista'])) return 'clean_light';
  if (includesAny(text, ['conversion', 'conversión', 'vender', 'ventas', 'agresivo'])) return 'high_conversion';
  if (includesAny(text, ['sobrio', 'editorial', 'serio', 'institucional'])) return 'editorial_sober';
  if (includesAny(text, ['cian', 'verde', 'matrix', 'tecnologico', 'tecnológico', 'ia'])) return 'tech_cyan';
  if (includesAny(text, ['premium', 'elegante', 'oscuro', 'sofisticado'])) return 'premium_dark';

  return fallbackPresetId || 'premium_dark';
};

const resolveVisualConfidence = ({ intent, targets, input }) => {
  const text = normalizeText(input);
  const hasConcreteTarget =
    targets.cta ||
    targets.cards ||
    targets.background ||
    targets.color ||
    targets.typography ||
    targets.spacing ||
    targets.trust;

  if (hasConcreteTarget && intent?.confidence === 'high') return VISUAL_CONFIDENCE.HIGH;
  if (hasConcreteTarget) return VISUAL_CONFIDENCE.MEDIUM;

  if (includesAny(text, ['mas bonito', 'más bonito', 'mejoralo', 'mejóralo', 'no me convence'])) {
    return VISUAL_CONFIDENCE.LOW;
  }

  return intent?.confidence || VISUAL_CONFIDENCE.MEDIUM;
};

const buildVisualActions = ({ targets, preset, intensity }) => {
  const actions = [];

  if (targets.cta) {
    actions.push({
      type: VISUAL_DECISION_TYPES.CTA,
      label: 'Reforzar CTAs',
      description: 'Ajustar contraste, prioridad visual y lenguaje de acción.',
    });
  }

  if (targets.cards) {
    actions.push({
      type: VISUAL_DECISION_TYPES.CARDS,
      label: 'Reordenar tarjetas',
      description: 'Reducir ruido, aumentar jerarquía y hacer que cada tarjeta empuje una idea clara.',
    });
  }

  if (targets.background || targets.color) {
    actions.push({
      type: targets.background ? VISUAL_DECISION_TYPES.BACKGROUND : VISUAL_DECISION_TYPES.COLOR,
      label: 'Ajustar atmósfera visual',
      description: `Aplicar dirección "${preset.label}" con color al servicio de la acción principal.`,
    });
  }

  if (targets.typography || targets.spacing) {
    actions.push({
      type: targets.typography ? VISUAL_DECISION_TYPES.TYPOGRAPHY : VISUAL_DECISION_TYPES.SPACING,
      label: 'Mejorar lectura',
      description: 'Ajustar aire visual, densidad, ritmo y lectura para que el usuario entienda antes.',
    });
  }

  if (targets.trust) {
    actions.push({
      type: VISUAL_DECISION_TYPES.TRUST,
      label: 'Reforzar confianza',
      description: 'Añadir o elevar señales de confianza cerca de la acción principal.',
    });
  }

  if (!actions.length || targets.fullDirection) {
    actions.push({
      type: VISUAL_DECISION_TYPES.FULL_DIRECTION,
      label: 'Aplicar dirección visual completa',
      description: `Llevar la interfaz hacia "${preset.label}" con intensidad ${intensity}.`,
    });
  }

  return actions;
};

const buildCtaOverrideFromVisualDecision = ({ input, intent }) => {
  const text = normalizeText(input);

  if (!includesAny(text, ['cta', 'boton', 'botones', 'llamada'])) {
    return null;
  }

  if (includesAny(text, ['reservas', 'reserva'])) {
    return {
      primaryCta: 'Reservar ahora',
      secondaryCta: 'Ver disponibilidad',
      finalCta: 'Confirmar reserva',
    };
  }

  if (includesAny(text, ['whatsapp', 'wasap'])) {
    return {
      primaryCta: 'Escribir por WhatsApp',
      secondaryCta: 'Ver servicios',
      finalCta: 'Hablar ahora',
    };
  }

  if (includesAny(text, ['llamada', 'llamar', 'telefono', 'teléfono'])) {
    return {
      primaryCta: 'Llamar ahora',
      secondaryCta: 'Ver propuesta',
      finalCta: 'Solicitar llamada',
    };
  }

  if (includesAny(text, ['premium', 'pro'])) {
    return {
      primaryCta: 'Entrar en Pro',
      secondaryCta: 'Ver método',
      finalCta: 'Activar versión premium',
    };
  }

  if (intent?.templateType === 'gpt_hub_landing') {
    return {
      primaryCta: 'Abrir GPT recomendado',
      secondaryCta: 'Ver todos los GPTs',
      finalCta: 'Crear mi propio hub IA',
    };
  }

  return null;
};

export const analyzeBuilderVisualRequest = ({
  userInput = '',
  intent = {},
  currentState = null,
} = {}) => {
  const targets = detectVisualTargets(userInput);
  const fallbackPresetId = currentState?.visualPresetId || resolveVisualPresetId(intent);
  const visualPresetId = resolvePresetFromText(userInput, fallbackPresetId);
  const preset = getVisualPreset(visualPresetId);
  const intensity = detectDesignIntensity(userInput);
  const confidence = resolveVisualConfidence({ intent, targets, input: userInput });
  const actions = buildVisualActions({ targets, preset, intensity });
  const ctaOverride = buildCtaOverrideFromVisualDecision({ input: userInput, intent });
  const croAudit = buildCroAudit(intent);
  const policyDecision = buildPolicyDecision({
    intent,
    proposedResponse: getCroActionCopy(intent),
    currentState,
  });

  return {
    visualPresetId,
    preset,
    targets,
    actions,
    intensity,
    confidence,
    ctaOverride,
    croAudit,
    policyDecision,
    shouldAsk:
      confidence === VISUAL_CONFIDENCE.LOW ||
      shouldAskBeforeExecuting(intent),
  };
};

export const composeVisualDecisionResponse = ({
  visualDecision,
  intent = {},
} = {}) => {
  if (!visualDecision) {
    return 'Entendido. Voy a aplicar una mejora visual controlada sin romper la estructura.';
  }

  if (visualDecision.shouldAsk) {
    return 'La dirección visual es todavía abierta. Antes de aplicar un cambio fuerte, conviene elegir entre una versión más premium, más cálida o más orientada a conversión.';
  }

  const actionLabels = visualDecision.actions.map((action) => action.label).join(', ');

  if (visualDecision.ctaOverride) {
    return [
      `Entendido. Aplico "${visualDecision.preset.label}" y ajusto CTAs con criterio de conversión.`,
      `Acciones: ${actionLabels}.`,
      'El objetivo es que el usuario vea mejor la acción principal sin perder claridad visual.',
    ].join(' ');
  }

  if (intent?.requestedChanges?.colors || intent?.requestedChanges?.background) {
    return [
      `Entendido. Aplico dirección visual "${visualDecision.preset.label}".`,
      'El color se usará para jerarquía y foco de acción, no como decoración.',
      `Acciones: ${actionLabels}.`,
    ].join(' ');
  }

  return [
    `Entendido. Llevo la interfaz hacia "${visualDecision.preset.label}".`,
    visualDecision.preset.description,
    `Acciones: ${actionLabels}.`,
  ].join(' ');
};

export const applyVisualDecisionToPreviewState = ({
  previewState = {},
  visualDecision,
  intent = {},
} = {}) => {
  if (!visualDecision) return previewState;

  const baseCtaState = previewState.ctaState || buildCtaState(intent);
  const nextCtaState = visualDecision.ctaOverride
    ? applyCtaOverride(baseCtaState, visualDecision.ctaOverride)
    : baseCtaState;

  return {
    ...previewState,
    visualPresetId: visualDecision.visualPresetId,
    visualPreset: visualDecision.preset,
    ctaState: nextCtaState,
    visualTargets: visualDecision.targets,
    visualActions: visualDecision.actions,
    designIntensity: visualDecision.intensity,
    lastVisualDecision: {
      visualPresetId: visualDecision.visualPresetId,
      confidence: visualDecision.confidence,
      actions: visualDecision.actions.map((action) => action.type),
      createdAt: new Date().toISOString(),
    },
  };
};

export const buildPreviewThemeProps = (visualPresetId = 'premium_dark') => {
  const preset = getVisualPreset(visualPresetId);

  return {
    backgroundClass: preset.backgroundClass,
    surfaceClass: preset.surfaceClass,
    primaryCtaClass: preset.primaryCtaClass,
    secondaryCtaClass: preset.secondaryCtaClass,
    cardClass: preset.cardClass,
    accentClass: preset.accentClass,
    glowClass: preset.glowClass,
  };
};

export const getVisualDecisionOptions = () => [
  {
    id: 'premium_dark',
    label: 'Premium oscuro',
    description: 'Más valor percibido, menos ruido y CTA fino.',
  },
  {
    id: 'warm_orange',
    label: 'Negro + naranja',
    description: 'Más energía visual y acción cálida.',
  },
  {
    id: 'high_conversion',
    label: 'Alta conversión',
    description: 'CTA más dominante y recorrido más directo.',
  },
];

export const getBuilderVisualGuardrails = () => BUILDER_VISUAL_GUARDRAILS;

export default analyzeBuilderVisualRequest;