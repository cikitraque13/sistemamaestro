export const BUILDER_VISUAL_PRESETS = {
  premium_dark: {
    id: 'premium_dark',
    label: 'Premium oscuro',
    description: 'Oscuro elegante, alto contraste, aire visual y percepción de valor.',
    backgroundClass:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.13),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(251,191,36,0.10),transparent_32%),#07090C]',
    surfaceClass: 'bg-white/[0.035] border-white/[0.08]',
    primaryCtaClass:
      'bg-gradient-to-r from-amber-200 via-white to-amber-100 text-black border-amber-200/60 shadow-[0_18px_45px_rgba(251,191,36,0.14)]',
    secondaryCtaClass: 'bg-white/[0.04] text-white border-white/10',
    cardClass: 'bg-white/[0.035] border-white/[0.08]',
    accentClass: 'text-amber-100 border-amber-200/20 bg-amber-200/[0.08]',
    glowClass: 'shadow-[0_0_50px_rgba(251,191,36,0.08)]',
  },

  warm_orange: {
    id: 'warm_orange',
    label: 'Negro + naranja estratégico',
    description: 'Fondo oscuro con acentos cálidos para reforzar energía, cercanía y acción.',
    backgroundClass:
      'bg-[radial-gradient(circle_at_75%_0%,rgba(249,115,22,0.20),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(253,186,116,0.12),transparent_32%),#080706]',
    surfaceClass: 'bg-orange-300/[0.045] border-orange-200/15',
    primaryCtaClass:
      'bg-gradient-to-r from-orange-300 via-amber-200 to-white text-black border-orange-200/60 shadow-[0_18px_45px_rgba(249,115,22,0.18)]',
    secondaryCtaClass: 'bg-orange-300/[0.06] text-orange-50 border-orange-200/15',
    cardClass: 'bg-orange-300/[0.04] border-orange-200/12',
    accentClass: 'text-orange-100 border-orange-200/20 bg-orange-300/[0.08]',
    glowClass: 'shadow-[0_0_54px_rgba(249,115,22,0.12)]',
  },

  clean_light: {
    id: 'clean_light',
    label: 'Claro limpio',
    description: 'Mayor claridad, menor densidad visual y lectura rápida.',
    backgroundClass:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(125,211,252,0.18),transparent_34%),linear-gradient(180deg,#f8fafc,#e5e7eb)]',
    surfaceClass: 'bg-white/80 border-black/10',
    primaryCtaClass:
      'bg-black text-white border-black shadow-[0_18px_45px_rgba(0,0,0,0.12)]',
    secondaryCtaClass: 'bg-white text-black border-black/10',
    cardClass: 'bg-white/80 border-black/10 text-black',
    accentClass: 'text-black border-black/10 bg-white/70',
    glowClass: 'shadow-[0_0_54px_rgba(15,23,42,0.08)]',
  },

  high_conversion: {
    id: 'high_conversion',
    label: 'Alta conversión',
    description: 'Contraste fuerte, CTA dominante, menor ruido y prioridad de clic.',
    backgroundClass:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(52,211,153,0.18),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(253,230,138,0.12),transparent_32%),#050807]',
    surfaceClass: 'bg-emerald-300/[0.045] border-emerald-200/15',
    primaryCtaClass:
      'bg-gradient-to-r from-emerald-200 via-cyan-100 to-amber-100 text-black border-emerald-200/70 shadow-[0_18px_45px_rgba(52,211,153,0.18)]',
    secondaryCtaClass: 'bg-white/[0.04] text-white border-white/10',
    cardClass: 'bg-emerald-300/[0.04] border-emerald-200/12',
    accentClass: 'text-emerald-100 border-emerald-200/20 bg-emerald-300/[0.08]',
    glowClass: 'shadow-[0_0_54px_rgba(52,211,153,0.12)]',
  },

  editorial_sober: {
    id: 'editorial_sober',
    label: 'Editorial sobrio',
    description: 'Seriedad, lectura pausada, autoridad y estructura clara.',
    backgroundClass:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(148,163,184,0.12),transparent_34%),#070707]',
    surfaceClass: 'bg-white/[0.03] border-white/[0.07]',
    primaryCtaClass:
      'bg-white text-black border-white shadow-[0_18px_45px_rgba(255,255,255,0.08)]',
    secondaryCtaClass: 'bg-transparent text-white border-white/15',
    cardClass: 'bg-white/[0.025] border-white/[0.08]',
    accentClass: 'text-zinc-200 border-white/10 bg-white/[0.04]',
    glowClass: 'shadow-[0_0_44px_rgba(255,255,255,0.04)]',
  },

  tech_cyan: {
    id: 'tech_cyan',
    label: 'Tecnológico cian',
    description: 'IA, sistema vivo, precisión técnica y sensación de herramienta avanzada.',
    backgroundClass:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.12),transparent_32%),#05080A]',
    surfaceClass: 'bg-cyan-300/[0.04] border-cyan-200/12',
    primaryCtaClass:
      'bg-gradient-to-r from-cyan-200 via-emerald-100 to-white text-black border-cyan-200/70 shadow-[0_18px_45px_rgba(34,211,238,0.18)]',
    secondaryCtaClass: 'bg-cyan-300/[0.055] text-cyan-50 border-cyan-200/15',
    cardClass: 'bg-cyan-300/[0.035] border-cyan-200/12',
    accentClass: 'text-cyan-100 border-cyan-200/20 bg-cyan-300/[0.08]',
    glowClass: 'shadow-[0_0_54px_rgba(34,211,238,0.12)]',
  },
};

export const DEFAULT_VISUAL_PRESET_ID = 'premium_dark';

export const getVisualPreset = (presetId = DEFAULT_VISUAL_PRESET_ID) =>
  BUILDER_VISUAL_PRESETS[presetId] || BUILDER_VISUAL_PRESETS[DEFAULT_VISUAL_PRESET_ID];

export const resolveVisualPresetId = (intent = {}) => {
  if (intent.visualDirection && BUILDER_VISUAL_PRESETS[intent.visualDirection]) {
    return intent.visualDirection;
  }

  if (intent.conversionGoal && ['sales', 'leads', 'signup'].includes(intent.conversionGoal)) {
    return 'high_conversion';
  }

  return DEFAULT_VISUAL_PRESET_ID;
};

export default BUILDER_VISUAL_PRESETS;