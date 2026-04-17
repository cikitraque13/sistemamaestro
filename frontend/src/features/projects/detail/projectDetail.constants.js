export const ROUTE_NAMES = {
  improve: 'Mejorar algo existente',
  sell: 'Vender y cobrar',
  automate: 'Automatizar operación',
  idea: 'Idea a proyecto',
  improve_existing: 'Mejorar algo existente',
  sell_and_charge: 'Vender y cobrar',
  automate_operation: 'Automatizar operación',
  idea_to_project: 'Idea a proyecto'
};

export const PLAN_VISUALS = {
  blueprint: {
    label: '29',
    name: 'Blueprint',
    badgeClass: 'bg-[#0F5257]/20 text-[#8DE1D0]',
    borderClass: 'border-[#0F5257]/30',
    boxClass: 'bg-[#0F5257]/10'
  },
  sistema: {
    label: '79',
    name: 'Sistema',
    badgeClass: 'bg-amber-500/20 text-amber-300',
    borderClass: 'border-amber-500/30',
    boxClass: 'bg-amber-500/10'
  },
  premium: {
    label: '199',
    name: 'Premium',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300',
    borderClass: 'border-fuchsia-500/30',
    boxClass: 'bg-fuchsia-500/10'
  }
};

export const DIMENSION_STATUS_META = {
  strong: {
    label: 'Fuerte',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
    cardClass:
      'border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(10,10,10,1))]'
  },
  improvable: {
    label: 'Mejorable',
    badgeClass: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
    cardClass:
      'border-sky-500/20 bg-[linear-gradient(180deg,rgba(14,165,233,0.06),rgba(10,10,10,1))]'
  },
  priority: {
    label: 'Prioritario',
    badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
    cardClass:
      'border-amber-500/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(10,10,10,1))]'
  }
};

export const PRIORITY_META = {
  high: {
    label: 'Alta',
    badgeClass: 'bg-amber-500/15 text-amber-300'
  },
  medium: {
    label: 'Media',
    badgeClass: 'bg-[#262626] text-[#D4D4D4]'
  },
  low: {
    label: 'Baja',
    badgeClass: 'bg-[#1B2A20] text-[#8BE3A1]'
  }
};

export const CONTINUITY_PATH_META = {
  stay: {
    label: 'Seguir analizando',
    cta: null,
    badgeClass: 'bg-[#262626] text-[#D4D4D4]'
  },
  blueprint: {
    label: 'Entrar en Pro',
    cta: 'Entrar en Pro',
    badgeClass: 'bg-[#0F5257]/20 text-[#8DE1D0]'
  },
  sistema: {
    label: 'Entrar en Growth',
    cta: 'Entrar en Growth',
    badgeClass: 'bg-amber-500/20 text-amber-300'
  },
  premium: {
    label: 'Acceder a AI Master 199',
    cta: 'Acceder a AI Master 199',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300'
  }
};

export const CONTINUITY_PATH_TO_PLAN = {
  blueprint: 'blueprint',
  sistema: 'sistema',
  premium: 'premium'
};
