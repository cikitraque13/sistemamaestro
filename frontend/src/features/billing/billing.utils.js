import {
  ACTIVATION_LABELS,
  BUILDER_ACCESS_LABELS,
  EXPORT_ACCESS_LABELS
} from './billing.constants';

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
  if (label === 'Créditos') {
    return {
      wrap: 'border-amber-500/20 bg-amber-500/5',
      label: 'text-amber-200/70',
      value: 'text-amber-300'
    };
  }

  if (label === 'Activación') {
    return {
      wrap: 'border-[#0F5257]/20 bg-[#0F5257]/5',
      label: 'text-[#8DE1D0]/75',
      value: 'text-white'
    };
  }

  if (label === 'Builder') {
    return {
      wrap: 'border-sky-500/15 bg-sky-500/5',
      label: 'text-sky-200/70',
      value: 'text-white'
    };
  }

  if (label === 'Exportación') {
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

export const getCreditsLabel = (plan) => {
  if (typeof plan?.creditsIncluded === 'number') {
    if (plan.creditsIncluded === 0) return 'Sin créditos';
    return `${formatCredits(plan.creditsIncluded)} incluidos`;
  }

  return plan?.creditsLabel || 'Pendiente';
};

export const buildOperationalItems = (plan, includedCreditsOverride = null) => {
  const creditText =
    typeof includedCreditsOverride === 'number'
      ? includedCreditsOverride === 0
        ? 'Sin créditos'
        : `${formatCredits(includedCreditsOverride)} incluidos`
      : getCreditsLabel(plan);

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
      label: 'Créditos',
      value: creditText
    }
  ];
};
