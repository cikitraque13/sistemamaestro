export const CTA_PRESETS = {
  activation: {
    primary: 'Crear mi primer proyecto',
    secondary: 'Analizar una URL',
    final: 'Entrar en Sistema Maestro',
  },

  leads: {
    primary: 'Solicitar diagnóstico',
    secondary: 'Ver cómo funciona',
    final: 'Captar más oportunidades',
  },

  sales: {
    primary: 'Empezar ahora',
    secondary: 'Ver planes',
    final: 'Activar sistema de venta',
  },

  signup: {
    primary: 'Crear cuenta',
    secondary: 'Ver ejemplo',
    final: 'Empezar gratis',
  },

  reservations: {
    primary: 'Reservar ahora',
    secondary: 'Ver disponibilidad',
    final: 'Confirmar reserva',
  },

  whatsapp: {
    primary: 'Escribir por WhatsApp',
    secondary: 'Ver servicios',
    final: 'Hablar ahora',
  },

  calls: {
    primary: 'Llamar ahora',
    secondary: 'Ver propuesta',
    final: 'Solicitar llamada',
  },

  premium: {
    primary: 'Entrar en nivel Pro',
    secondary: 'Ver método',
    final: 'Activar versión premium',
  },

  gpt_hub_landing: {
    primary: 'Abrir GPT recomendado',
    secondary: 'Ver todos los GPTs',
    final: 'Crear mi propio hub IA',
  },

  deploy: {
    primary: 'Preparar deploy',
    secondary: 'Revisar archivos',
    final: 'Publicar versión',
  },
};

export const getCtaPreset = (goal = 'activation') =>
  CTA_PRESETS[goal] || CTA_PRESETS.activation;

export const resolveCtaGoal = (intent = {}) => {
  if (intent.templateType === 'gpt_hub_landing') return 'gpt_hub_landing';
  if (intent.conversionGoal && CTA_PRESETS[intent.conversionGoal]) return intent.conversionGoal;
  if (intent.visualDirection === 'premium_dark') return 'premium';

  return 'activation';
};

export const buildCtaState = (intent = {}) => {
  const goal = resolveCtaGoal(intent);
  const preset = getCtaPreset(goal);

  return {
    goal,
    primaryCta: preset.primary,
    secondaryCta: preset.secondary,
    finalCta: preset.final,
  };
};

export const applyCtaOverride = (currentState = {}, override = {}) => ({
  ...currentState,
  primaryCta: override.primaryCta || currentState.primaryCta,
  secondaryCta: override.secondaryCta || currentState.secondaryCta,
  finalCta: override.finalCta || currentState.finalCta,
});

export default CTA_PRESETS;