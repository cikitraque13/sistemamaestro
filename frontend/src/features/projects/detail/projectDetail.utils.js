import { PLAN_VISUALS } from './projectDetail.constants';

export const formatProjectDate = (dateString) => {
  if (!dateString) return '';

  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

export const buildPlanRecommendationView = (project) => {
  const rec = project?.plan_recommendation;
  if (!rec) return null;

  const planId = rec.recommended_plan_id;
  const visual = PLAN_VISUALS[planId] || PLAN_VISUALS.blueprint;

  return {
    planId,
    planName: rec.recommended_plan_name || visual.name,
    planPrice: rec.recommended_plan_price,
    planLabel: visual.label,
    badgeClass: visual.badgeClass,
    borderClass: visual.borderClass,
    boxClass: visual.boxClass,
    scoreTotal: rec.score_total,
    scores: rec.scores || {},
    reason: rec.reason,
    whyNotLower: rec.why_not_lower,
    unlocks: rec.unlocks,
    ctaLabel: rec.cta_label || 'Ver plan recomendado'
  };
};
