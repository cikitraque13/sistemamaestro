import { pricingPlans } from './pricingContent';

// HomePlansPanel renders these same rules from pricingContent and does not
// import this module: features/home stays unchanged. Facturación imports it.
// planCopyParity.test.js renders both views and checks they still match.
const PLAN_BADGE_LABELS = {
  sistema: 'Núcleo',
  premium: 'Superior'
};

const PLAN_TAGLINE_OVERRIDE = {
  premium: 'Casos complejos y operador serio.'
};

const HIDDEN_PLAN_HIGHLIGHTS = ['Ruta recomendada', 'Preparación de salida'];

export const HIGHLIGHT_PLAN_ID = 'sistema';

export const PLAN_DISPLAY_IDS = ['free', 'blueprint', 'sistema', 'premium'];

export function getPlanDisplayCopy(plan) {
  const bullets = (plan?.billingHighlights || []).filter(
    (point) => !HIDDEN_PLAN_HIGHLIGHTS.includes(point)
  );
  const gemsLine = bullets.find((point) => /gemas/i.test(point)) || '';

  return {
    id: plan.id,
    name: plan.visibleName,
    tagline: PLAN_TAGLINE_OVERRIDE[plan.id] || plan.bestForShort || plan.description,
    badge: PLAN_BADGE_LABELS[plan.id] || null,
    highlighted: plan.id === HIGHLIGHT_PLAN_ID,
    gemsLine,
    bullets,
    creditsIncluded: plan.creditsIncluded,
    price: plan.price,
    priceLabel: plan.priceLabel,
    periodLabel: plan.periodLabel
  };
}

export const planDisplayCopy = pricingPlans
  .filter((plan) => PLAN_DISPLAY_IDS.includes(plan.id))
  .map(getPlanDisplayCopy);

export const planDisplayCopyById = Object.fromEntries(
  planDisplayCopy.map((plan) => [plan.id, plan])
);
