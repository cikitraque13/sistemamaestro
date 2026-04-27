import {
  REPORT_SECTION_KEYS,
  ROUTE_NAMES
} from './reportPremium.constants';

import {
  areTooSimilar,
  dedupeKeyValueBlocks,
  dedupeTexts,
  ensureArray,
  formatDate,
  isMeaningfulText,
  toSafeText
} from './reportPremium.utils';

const BUILDER_CONTINUITY_META = {
  label: 'Construir en Builder',
  badgeClass: 'bg-[#0F5257]/20 text-[#8DE1D0]'
};

const BUILDER_CONTINUITY_RECOMMENDATION = {
  recommended_path: 'builder',
  reason:
    'El informe ya ordeno el punto de partida. El siguiente paso correcto es convertir esta lectura en una primera version visible dentro de Sistema Maestro Builder.',
  cta_label: 'Construir este proyecto en Builder'
};

const getPlainObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
};

const buildPriorityActions = (rawPriorityActions) =>
  ensureArray(rawPriorityActions)
    .filter((action) => action && typeof action === 'object')
    .map((action) => ({
      ...action,
      id: toSafeText(action.id),
      title: toSafeText(action.title),
      why_it_matters: toSafeText(action.why_it_matters),
      intensity: toSafeText(action.intensity) || 'medium'
    }))
    .filter((action) => isMeaningfulText(action.title) || isMeaningfulText(action.why_it_matters))
    .filter((action, index, list) =>
      list.findIndex((candidate) => {
        const sameTitle = areTooSimilar(candidate.title, action.title);
        const sameWhy = areTooSimilar(candidate.why_it_matters, action.why_it_matters);

        return sameTitle || sameWhy;
      }) === index
    );

const buildDimensionReview = (rawDimensionReview) =>
  ensureArray(rawDimensionReview)
    .filter((dimension) => dimension && typeof dimension === 'object')
    .map((dimension, index) => ({
      ...dimension,
      id: toSafeText(dimension.id || dimension.key || `dimension-${index + 1}`),
      label: toSafeText(dimension.label || dimension.dimension || 'Dimension'),
      reading: toSafeText(dimension.reading),
      status: toSafeText(dimension.status) || 'improvable',
      priority: toSafeText(dimension.priority) || 'medium'
    }))
    .filter((dimension) => isMeaningfulText(dimension.reading));

const buildImmediateAction = ({
  immediateActionRaw,
  priorityActions,
  quickWins
}) => {
  const immediateTitle = toSafeText(immediateActionRaw?.title);
  const immediateDescription = toSafeText(immediateActionRaw?.description);

  if (isMeaningfulText(immediateTitle) || isMeaningfulText(immediateDescription)) {
    return {
      title: isMeaningfulText(immediateTitle)
        ? immediateTitle
        : 'Siguiente accion inmediata',
      description: isMeaningfulText(immediateDescription)
        ? immediateDescription
        : ''
    };
  }

  if (priorityActions.length > 0) {
    return {
      title: priorityActions[0].title || 'Aplicar accion prioritaria',
      description: priorityActions[0].why_it_matters || ''
    };
  }

  if (quickWins.length > 0 && isMeaningfulText(quickWins[0])) {
    return {
      title: 'Aplicar quick win prioritario',
      description: quickWins[0]
    };
  }

  return null;
};

const buildContinuityRecommendation = () => BUILDER_CONTINUITY_RECOMMENDATION;

export const normalizeReportView = (project) => {
  const diagnosis = getPlainObject(project?.diagnosis);
  if (!Object.keys(diagnosis).length) return null;

  const strengths = ensureArray(diagnosis.strengths).map(toSafeText);
  const weaknesses = ensureArray(diagnosis.weaknesses).map(toSafeText);
  const quickWins = ensureArray(diagnosis.quick_wins).map(toSafeText);

  const executiveSummaryRaw = getPlainObject(diagnosis.executive_summary);
  const coreDiagnosisRaw = getPlainObject(diagnosis.core_diagnosis);

  const understanding = toSafeText(
    diagnosis.understanding ||
      diagnosis.summary ||
      executiveSummaryRaw.understanding ||
      ''
  );

  const mainFinding = toSafeText(
    diagnosis.main_finding ||
      coreDiagnosisRaw.main_finding ||
      weaknesses[0] ||
      strengths[0] ||
      diagnosis.summary ||
      ''
  );

  const mainWeakness = toSafeText(
    coreDiagnosisRaw.main_weakness ||
      weaknesses[0] ||
      ''
  );

  const mainLeverage = toSafeText(
    diagnosis.opportunity ||
      coreDiagnosisRaw.main_leverage ||
      quickWins[0] ||
      ''
  );

  const executiveCards = dedupeKeyValueBlocks([
    {
      key: 'understanding',
      label: 'Comprension',
      value: executiveSummaryRaw.understanding || understanding
    },
    {
      key: 'main_tension',
      label: 'Tension principal',
      value: executiveSummaryRaw.main_tension || weaknesses[0] || ''
    },
    {
      key: 'commercial_importance',
      label: 'Importancia comercial',
      value: executiveSummaryRaw.commercial_importance || ''
    },
    {
      key: 'bottom_line',
      label: 'Conclusion ejecutiva',
      value: executiveSummaryRaw.bottom_line || quickWins[0] || ''
    }
  ]);

  const coreDiagnosisCards = dedupeKeyValueBlocks([
    {
      key: 'main_finding',
      label: 'Hallazgo principal',
      value: coreDiagnosisRaw.main_finding || mainFinding,
      accent: 'teal'
    },
    {
      key: 'main_weakness',
      label: 'Debilidad principal',
      value: coreDiagnosisRaw.main_weakness || mainWeakness,
      accent: 'default'
    },
    {
      key: 'main_leverage',
      label: 'Palanca principal',
      value: coreDiagnosisRaw.main_leverage || mainLeverage,
      accent: 'amber'
    }
  ]);

  const dimensionReview = buildDimensionReview(diagnosis.dimension_review);
  const priorityActions = buildPriorityActions(diagnosis.priority_actions);

  const immediateAction = buildImmediateAction({
    immediateActionRaw: getPlainObject(diagnosis.immediate_action),
    priorityActions,
    quickWins
  });

  const continuityRecommendation = buildContinuityRecommendation();

  const avoidSignals = [
    ...executiveCards.map((item) => item.value),
    ...coreDiagnosisCards.map((item) => item.value),
    immediateAction?.title || '',
    immediateAction?.description || ''
  ];

  return {
    strengths: dedupeTexts(strengths, avoidSignals, 3),
    weaknesses: dedupeTexts(weaknesses, avoidSignals, 4),
    quickWins: dedupeTexts(quickWins, avoidSignals, 4),
    executiveCards,
    coreDiagnosisCards,
    dimensionReview,
    priorityActions,
    immediateAction,
    continuityRecommendation
  };
};

export const buildDimensionCounters = (reportView) => {
  const counters = {
    strong: 0,
    improvable: 0,
    priority: 0
  };

  ensureArray(reportView?.dimensionReview).forEach((item) => {
    if (item?.status && counters[item.status] !== undefined) {
      counters[item.status] += 1;
    }
  });

  return counters;
};

export const resolveContinuityMeta = () => BUILDER_CONTINUITY_META;

export const buildHeroCards = (reportView, continuityMeta) => {
  const cards = [];

  if (reportView?.coreDiagnosisCards?.[0]?.value) {
    cards.push({
      eyebrow: reportView.coreDiagnosisCards[0].label,
      value: reportView.coreDiagnosisCards[0].value,
      accent: 'teal'
    });
  }

  const leverageCard = reportView?.coreDiagnosisCards?.find(
    (item) => item.key === 'main_leverage'
  );

  if (leverageCard?.value) {
    cards.push({
      eyebrow: leverageCard.label,
      value: leverageCard.value,
      accent: 'amber'
    });
  }

  if (continuityMeta?.label) {
    cards.push({
      eyebrow: 'Continuidad recomendada',
      value: continuityMeta.label,
      accent: 'violet'
    });
  }

  return cards;
};

export const buildSignalGroups = (reportView) => {
  const groups = [];

  if (reportView?.strengths?.length > 0) {
    groups.push({
      title: 'Fortalezas',
      items: reportView.strengths
    });
  }

  if (reportView?.weaknesses?.length > 0) {
    groups.push({
      title: 'Debilidades',
      items: reportView.weaknesses
    });
  }

  if (reportView?.quickWins?.length > 0) {
    groups.push({
      title: 'Quick wins',
      items: reportView.quickWins
    });
  }

  return groups;
};

export const buildVisibleSections = (reportView, signalGroups) => {
  const sections = [REPORT_SECTION_KEYS.hero];

  const hasSummary =
    (reportView?.executiveCards?.length || 0) > 0 ||
    (reportView?.coreDiagnosisCards?.length || 0) > 0;

  if (hasSummary) sections.push(REPORT_SECTION_KEYS.summary);

  const hasDimensions = (reportView?.dimensionReview?.length || 0) > 0;
  if (hasDimensions) sections.push(REPORT_SECTION_KEYS.dimensions);

  const hasActions =
    (reportView?.priorityActions?.length || 0) > 0 ||
    !!reportView?.immediateAction;

  if (hasActions) sections.push(REPORT_SECTION_KEYS.actions);

  const hasClosing =
    !!reportView?.continuityRecommendation ||
    ensureArray(signalGroups).length > 0;

  if (hasClosing) sections.push(REPORT_SECTION_KEYS.closing);

  return sections;
};

export const buildPageMap = (visibleSections) => {
  const map = {};

  ensureArray(visibleSections).forEach((section, index) => {
    map[section] = `Pagina ${index + 1}`;
  });

  return map;
};

export const buildReportPremiumModel = (project) => {
  const reportView = normalizeReportView(project);

  if (!project || !reportView) {
    return {
      reportView: null,
      routeLabel: '',
      issueDate: '',
      dimensionCounters: {
        strong: 0,
        improvable: 0,
        priority: 0
      },
      continuityMeta: null,
      heroCards: [],
      signalGroups: [],
      visibleSections: [],
      pageMap: {}
    };
  }

  const continuityMeta = resolveContinuityMeta(reportView);
  const signalGroups = buildSignalGroups(reportView);
  const visibleSections = buildVisibleSections(reportView, signalGroups);

  return {
    reportView,
    routeLabel: toSafeText(
      ROUTE_NAMES[project?.route] || project?.route || 'Sin clasificar'
    ),
    issueDate: formatDate(project?.created_at),
    dimensionCounters: buildDimensionCounters(reportView),
    continuityMeta,
    heroCards: buildHeroCards(reportView, continuityMeta),
    signalGroups,
    visibleSections,
    pageMap: buildPageMap(visibleSections)
  };
};