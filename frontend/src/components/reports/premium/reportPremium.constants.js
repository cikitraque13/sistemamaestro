export const ROUTE_NAMES = {
  improve: 'Mejorar algo existente',
  sell: 'Vender y cobrar',
  automate: 'Automatizar operacion',
  idea: 'Idea a proyecto',
  improve_existing: 'Mejorar algo existente',
  sell_and_charge: 'Vender y cobrar',
  automate_operation: 'Automatizar operacion',
  idea_to_project: 'Idea a proyecto'
};

export const DIMENSION_STATUS_META = {
  strong: {
    label: 'Fuerte',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
    cardClass: 'border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(10,10,10,1))]'
  },
  improvable: {
    label: 'Mejorable',
    badgeClass: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
    cardClass: 'border-sky-500/20 bg-[linear-gradient(180deg,rgba(14,165,233,0.06),rgba(10,10,10,1))]'
  },
  priority: {
    label: 'Prioritario',
    badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
    cardClass: 'border-amber-500/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(10,10,10,1))]'
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

export const CONTINUITY_META = {
  stay: {
    label: 'Seguir analizando',
    badgeClass: 'bg-[#262626] text-[#D4D4D4]'
  },
  blueprint: {
    label: 'Entrar en Pro',
    badgeClass: 'bg-[#0F5257]/20 text-[#8DE1D0]'
  },
  sistema: {
    label: 'Entrar en Growth',
    badgeClass: 'bg-amber-500/20 text-amber-300'
  },
  premium: {
    label: 'Acceder a AI Master 199',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300'
  }
};

export const PLACEHOLDER_PATTERNS = [
  /^sin .*disponible/i,
  /^sin .*datos/i,
  /^sin recomendacion/i,
  /^sin accion/i,
  /^no se ha/i,
  /^no hay/i,
  /^lectura pendiente/i,
  /^pendiente/i
];

export const REPORT_SECTION_KEYS = {
  hero: 'hero',
  summary: 'summary',
  dimensions: 'dimensions',
  actions: 'actions',
  closing: 'closing'
};

export const REPORT_COPY = {
  emptyState: 'No hay datos suficientes para renderizar el informe.',
  documentLabel: 'Documento',
  dateLabel: 'Fecha:',
  routeLabel: 'Ruta:',
  inputLabel: 'Entrada:',
  inputUrlLabel: 'URL',
  inputDescriptionLabel: 'Descripcion',
  contextTitle: 'Contexto analizado',
  heroTitle: 'Lectura premium estructurada',
  heroDescription:
    'Validacion breve y accionable para entender el caso, detectar la friccion principal y ordenar el siguiente paso correcto dentro del sistema.',
  summaryTitle: 'Resumen ejecutivo',
  coreDiagnosisTitle: 'Diagnostico central',
  dimensionsTitle: 'Lectura por dimensiones',
  actionsTitle: 'Acciones prioritarias',
  immediateActionTitle: 'Accion inmediata',
  continuityTitle: 'Continuidad recomendada',
  signalsTitle: 'Senales complementarias',
  continuityAndSignalsTitle: 'Continuidad y senales complementarias',
  continuityCtaTitle: 'CTA de continuidad',
  footerLeft: 'Validacion breve y accionable',
  footerRight: 'Documento preparado para vista premium y futura exportacion PDF',
  closingWithContinuity:
    'Con esta lectura ya puedes ver el caso con mas claridad. Si quieres activarlo dentro del sistema, el siguiente paso correcto es',
  closingWithoutContinuity:
    'Con esta lectura ya puedes ver el caso con mas claridad. El siguiente paso correcto es reforzar la parte mas debil del caso antes de ampliar intensidad.'
};