export const API_BASE = '/api';

export const FEATURE_LABELS = {
  diagnosis: 'Diagnóstico',
  route: 'Ruta recomendada',
  blueprint: 'Blueprint',
  priorities: 'Prioridades',
  continuity: 'Continuidad guiada',
  deployment: 'Activación y despliegue',
  support: 'Soporte prioritario',
  opportunities: 'Oportunidades'
};

export const PLAN_VISUAL_META = {
  free: {
    borderClass: 'border-white/5',
    badgeClass: 'bg-[#202020] text-[#D4D4D4]',
    ctaClass: 'bg-[#262626] text-white hover:bg-[#363636]',
    surfaceClass: 'bg-[#171717]',
    eyebrow: 'Entrada',
    accentLineClass: 'from-white/0 via-white/10 to-white/0'
  },
  blueprint: {
    borderClass: 'border-[#0F5257]',
    badgeClass: 'bg-[#0F5257] text-white',
    ctaClass: 'bg-[#0F5257] text-white hover:bg-[#136970]',
    surfaceClass: 'bg-[linear-gradient(180deg,#171717_0%,#131a1b_100%)]',
    eyebrow: 'Entrada seria',
    accentLineClass: 'from-[#0F5257]/0 via-[#0F5257]/40 to-[#0F5257]/0'
  },
  sistema: {
    borderClass: 'border-[#2F455A]',
    badgeClass: 'bg-[#1A2430] text-[#D6E6F5]',
    ctaClass: 'bg-[#2A3F55] text-white hover:bg-[#355169]',
    surfaceClass: 'bg-[linear-gradient(180deg,#171717_0%,#151a22_100%)]',
    eyebrow: 'Continuidad operativa',
    accentLineClass: 'from-[#2F455A]/0 via-[#2F455A]/35 to-[#2F455A]/0'
  },
  premium: {
    borderClass: 'border-[#4A3B61]',
    badgeClass: 'bg-[#1A1521] text-[#E4D8F7]',
    ctaClass: 'bg-[#2A1F3A] text-white hover:bg-[#34274A]',
    surfaceClass: 'bg-[linear-gradient(180deg,#171717_0%,#181320_100%)]',
    eyebrow: 'Capa superior',
    accentLineClass: 'from-[#4A3B61]/0 via-[#4A3B61]/35 to-[#4A3B61]/0'
  }
};

export const PLAN_SIGNAL_META = {
  free: {
    chips: ['Entrada', 'Claridad'],
    chipClass:
      'bg-[rgba(255,255,255,0.035)] text-[#DCE7E4] border border-[#0F5257]/14'
  },
  blueprint: {
    chips: ['Activación', 'Blueprint', 'Prioridades'],
    chipClass:
      'bg-[#0F5257]/10 text-[#8DE1D0] border border-[#0F5257]/20'
  },
  sistema: {
    chips: ['Growth', 'Optimización', 'Builder', 'Continuidad'],
    chipClass:
      'bg-[#2F455A]/12 text-[#D6E6F5] border border-[#2F455A]/22'
  },
  premium: {
    chips: ['CRO', 'AI Auditor', 'Architecture', 'Criterio'],
    chipClass:
      'bg-[#4A3B61]/12 text-[#E4D8F7] border border-[#4A3B61]/22'
  }
};

export const CURRENT_PLAN_BADGE_STYLES = {
  diagnosis: 'bg-[#0F5257]/15 text-[#8DE1D0]',
  route: 'bg-[#0F5257]/15 text-[#8DE1D0]',
  blueprint: 'bg-[#173329] text-[#8BE3A1]',
  priorities: 'bg-[#173329] text-[#8BE3A1]',
  continuity: 'bg-[#2A213C] text-[#D7C3FF]',
  deployment: 'bg-[#2A213C] text-[#D7C3FF]',
  support: 'bg-[#3A241A] text-[#FFC89A]',
  opportunities: 'bg-[#3A241A] text-[#FFC89A]'
};

export const ACTIVATION_LABELS = {
  exploration: 'Exploración',
  puntual: 'Puntual',
  base: 'Base',
  operational: 'Operativa',
  advanced: 'Avanzada'
};

export const BUILDER_ACCESS_LABELS = {
  none: 'Sin builder',
  base: 'Builder base',
  operational: 'Builder continuo',
  advanced: 'Builder avanzado'
};

export const EXPORT_ACCESS_LABELS = {
  not_included: 'No incluida',
  not_available: 'No disponible',
  quote_only_future: 'Valoración futura',
  quote_priority_future: 'Valoración prioritaria',
  advanced_quote_priority: 'Preparación seria',
  separate_quote: 'Valoración aparte',
  quoted_and_prioritized: 'Valoración priorizada'
};