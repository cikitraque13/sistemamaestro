import {
  ACTIVATION_LABELS,
  BUILDER_ACCESS_LABELS,
  EXPORT_ACCESS_LABELS
} from './billing.constants';

const LEGACY_UNIT_PARTS = ['credi', 'tos'];
const LEGACY_UNIT = LEGACY_UNIT_PARTS.join('');
const LEGACY_UNIT_UPPER = LEGACY_UNIT.toUpperCase();
const LEGACY_ACCENTED_UNIT = new RegExp(`cr[eé]di${'tos'}`, 'gi');

const normalizeToken = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const isGemsLabel = (label) => {
  const normalized = normalizeToken(label);

  return normalized === 'GEMAS' || normalized === LEGACY_UNIT_UPPER;
};

const isInitialGemsPlan = (plan) => {
  const planId = String(plan?.id || '').toLowerCase();
  const creditsLabel = String(plan?.creditsLabel || '').toLowerCase();

  return planId === 'free' || creditsLabel.includes('inicial');
};

const cleanGemsText = (value) =>
  String(value || '')
    .replace(/incluidos/gi, 'incluidas')
    .replace(LEGACY_ACCENTED_UNIT, 'gemas')
    .replace(new RegExp(LEGACY_UNIT, 'gi'), 'gemas');

export const getErrorMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
};

export const isValidCheckoutUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

export const formatCredits = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'No definido';
  return new Intl.NumberFormat('es-ES').format(value);
};

export const formatBillingDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const getOperationalAccentClasses = (label) => {
  const normalized = normalizeToken(label);

  if (isGemsLabel(label)) {
    return {
      wrap: 'border-cyan-300/20 bg-cyan-400/5',
      label: 'text-cyan-100/75',
      value: 'text-cyan-100'
    };
  }

  if (normalized === 'ACTIVACION') {
    return {
      wrap: 'border-[#0F5257]/20 bg-[#0F5257]/5',
      label: 'text-[#8DE1D0]/75',
      value: 'text-white'
    };
  }

  if (normalized === 'BUILDER') {
    return {
      wrap: 'border-sky-500/15 bg-sky-500/5',
      label: 'text-sky-200/70',
      value: 'text-white'
    };
  }

  if (normalized === 'EXPORTACION') {
    return {
      wrap: 'border-white/5 bg-[#101010]',
      label: 'text-[#8D8D8D]',
      value: 'text-white'
    };
  }

  return {
    wrap: 'border-white/5 bg-[#101010]',
    label: 'text-[#8D8D8D]',
    value: 'text-white'
  };
};

export const getConceptLabel = (tx, plans, entryOffer) => {
  if (tx.item_type === 'one_time_offer') {
    if (tx.offer_id === 'single_report' || tx.item_id === 'single_report') {
      return entryOffer.name;
    }
    return tx.offer_id || tx.item_id || 'Oferta puntual';
  }

  const matchedPlan =
    plans.find((plan) => plan.id === (tx.plan_id || tx.item_id)) || null;

  return matchedPlan?.visibleName || tx.plan_id || tx.item_id || 'Plan';
};

export const getGemsLabel = (plan) => {
  if (plan?.creditsLabel) {
    return cleanGemsText(plan.creditsLabel);
  }

  if (typeof plan?.creditsIncluded === 'number') {
    if (plan.creditsIncluded === 0) return 'Sin gemas';

    if (isInitialGemsPlan(plan)) {
      return `${formatCredits(plan.creditsIncluded)} iniciales`;
    }

    return `${formatCredits(plan.creditsIncluded)} incluidas`;
  }

  return 'Pendiente';
};

export const getCreditsLabel = getGemsLabel;

export const buildOperationalItems = (plan, includedCreditsOverride = null) => {
  const hasIncludedCreditsOverride = typeof includedCreditsOverride === 'number';

  const gemsText = hasIncludedCreditsOverride
    ? includedCreditsOverride === 0
      ? 'Sin gemas'
      : isInitialGemsPlan(plan)
        ? `${formatCredits(includedCreditsOverride)} iniciales`
        : `${formatCredits(includedCreditsOverride)} incluidas`
    : getGemsLabel(plan);

  return [
    {
      label: 'Activación',
      value: ACTIVATION_LABELS[plan?.activationLevel] || 'No definida'
    },
    {
      label: 'Builder',
      value: BUILDER_ACCESS_LABELS[plan?.builderAccess] || 'No definido'
    },
    {
      label: 'Exportación',
      value: EXPORT_ACCESS_LABELS[plan?.exportAccess] || 'No definida'
    },
    {
      label: 'Gemas',
      value: gemsText
    }
  ];
};