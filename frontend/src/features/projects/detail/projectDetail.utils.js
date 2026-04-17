import {
  CONTINUITY_PATH_META,
  CONTINUITY_PATH_TO_PLAN,
  PLAN_VISUALS
} from './projectDetail.constants';

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

export const buildReportView = (project) => {
  const diagnosis = project?.diagnosis;
  if (!diagnosis) return null;

  const strengths = Array.isArray(diagnosis.strengths) ? diagnosis.strengths : [];
  const weaknesses = Array.isArray(diagnosis.weaknesses) ? diagnosis.weaknesses : [];
  const quickWins = Array.isArray(diagnosis.quick_wins) ? diagnosis.quick_wins : [];

  const executiveSummaryRaw =
    diagnosis.executive_summary && typeof diagnosis.executive_summary === 'object'
      ? diagnosis.executive_summary
      : {};

  const coreDiagnosisRaw =
    diagnosis.core_diagnosis && typeof diagnosis.core_diagnosis === 'object'
      ? diagnosis.core_diagnosis
      : {};

  const dimensionReview = Array.isArray(diagnosis.dimension_review)
    ? diagnosis.dimension_review
    : [];

  const priorityActions = Array.isArray(diagnosis.priority_actions)
    ? diagnosis.priority_actions
    : [];

  const immediateAction =
    diagnosis.immediate_action && typeof diagnosis.immediate_action === 'object'
      ? diagnosis.immediate_action
      : null;

  const continuityRecommendation =
    diagnosis.continuity_recommendation && typeof diagnosis.continuity_recommendation === 'object'
      ? diagnosis.continuity_recommendation
      : null;

  const understanding =
    diagnosis.understanding ||
    diagnosis.summary ||
    executiveSummaryRaw.understanding ||
    'Diagnóstico generado correctamente, pendiente de ampliar visualización.';

  const mainFinding =
    diagnosis.main_finding ||
    coreDiagnosisRaw.main_finding ||
    weaknesses[0] ||
    strengths[0] ||
    diagnosis.summary ||
    'Sin hallazgo principal disponible.';

  const opportunity =
    diagnosis.opportunity ||
    coreDiagnosisRaw.main_leverage ||
    quickWins[0] ||
    'Sin oportunidad priorizada disponible.';

  return {
    understanding,
    mainFinding,
    opportunity,
    strengths,
    weaknesses,
    quickWins,
    executiveSummary: {
      understanding: executiveSummaryRaw.understanding || understanding,
      mainTension:
        executiveSummaryRaw.main_tension ||
        weaknesses[0] ||
        'No se ha precisado aún la tensión principal.',
      commercialImportance:
        executiveSummaryRaw.commercial_importance ||
        'La lectura debe conectar con captación, conversión, monetización o continuidad.',
      bottomLine:
        executiveSummaryRaw.bottom_line ||
        quickWins[0] ||
        'Hace falta priorizar la siguiente acción con más claridad.'
    },
    coreDiagnosis: {
      mainFinding: coreDiagnosisRaw.main_finding || mainFinding,
      mainWeakness:
        coreDiagnosisRaw.main_weakness ||
        weaknesses[0] ||
        'Sin debilidad principal disponible.',
      mainLeverage: coreDiagnosisRaw.main_leverage || opportunity
    },
    dimensionReview,
    priorityActions,
    immediateAction,
    continuityRecommendation
  };
};

export const buildDimensionCounters = (reportView) => {
  const counters = { strong: 0, improvable: 0, priority: 0 };
  const items = reportView?.dimensionReview || [];

  items.forEach((item) => {
    if (item?.status && counters[item.status] !== undefined) {
      counters[item.status] += 1;
    }
  });

  return counters;
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

export const buildContinuityView = (reportView, normalizedPlanRecommendation) => {
  const canonicalPlanId = normalizedPlanRecommendation?.planId || null;

  const continuityPath =
    canonicalPlanId ||
    reportView?.continuityRecommendation?.recommended_path ||
    'stay';

  const continuityMeta =
    CONTINUITY_PATH_META[continuityPath] || CONTINUITY_PATH_META.stay;

  const continuityPlanId =
    canonicalPlanId ||
    CONTINUITY_PATH_TO_PLAN[continuityPath] ||
    null;

  return {
    continuityPath,
    continuityMeta,
    continuityPlanId
  };
};
