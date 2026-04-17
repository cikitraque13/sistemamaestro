import React, { useMemo } from 'react';
import {
  CheckCircle,
  DiamondsFour,
  Flag,
  Lightning,
  Sparkle
} from '@phosphor-icons/react';

const ROUTE_NAMES = {
  improve: 'Mejorar algo existente',
  sell: 'Vender y cobrar',
  automate: 'Automatizar operación',
  idea: 'Idea a proyecto',
  improve_existing: 'Mejorar algo existente',
  sell_and_charge: 'Vender y cobrar',
  automate_operation: 'Automatizar operación',
  idea_to_project: 'Idea a proyecto'
};

const DIMENSION_STATUS_META = {
  strong: {
    label: 'Fuerte',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    cardClass: 'border-emerald-200 bg-emerald-50'
  },
  improvable: {
    label: 'Mejorable',
    badgeClass: 'bg-sky-50 text-sky-700 border border-sky-200',
    cardClass: 'border-sky-200 bg-sky-50'
  },
  priority: {
    label: 'Prioritario',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
    cardClass: 'border-amber-200 bg-amber-50'
  }
};

const PRIORITY_META = {
  high: {
    label: 'Alta',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200'
  },
  medium: {
    label: 'Media',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200'
  },
  low: {
    label: 'Baja',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  }
};

const CONTINUITY_META = {
  stay: {
    label: 'Seguir analizando',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200'
  },
  blueprint: {
    label: 'Entrar en Pro',
    badgeClass: 'bg-teal-50 text-teal-700 border border-teal-200'
  },
  sistema: {
    label: 'Entrar en Growth',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200'
  },
  premium: {
    label: 'Acceder a AI Master 199',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'
  }
};

const PLACEHOLDER_PATTERNS = [
  /^sin .*disponible/i,
  /^sin .*datos/i,
  /^sin recomendaci[oó]n/i,
  /^sin acci[oó]n/i,
  /^no se ha/i,
  /^no hay/i,
  /^lectura pendiente/i,
  /^pendiente/i
];

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '';
  }
};

const normalizeText = (value) => {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isMeaningfulText = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length < 12) return false;

  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
};

const tokenSet = (value) => {
  const stopwords = new Set([
    'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'u',
    'a', 'ante', 'bajo', 'con', 'contra', 'desde', 'durante', 'en', 'entre',
    'hacia', 'hasta', 'para', 'por', 'segun', 'sin', 'sobre', 'tras',
    'que', 'como', 'del', 'al', 'se', 'su', 'sus', 'es', 'son', 'ha', 'han',
    'muy', 'mas', 'menos', 'ya', 'hoy', 'real', 'principal', 'importante',
    'caso', 'lectura', 'sistema', 'proyecto', 'negocio', 'usuario', 'usuarios',
    'web', 'pagina', 'sitio', 'mensaje', 'landing', 'propuesta', 'valor',
    'conversion', 'captacion', 'claridad', 'estructura', 'continuidad',
    'mejora', 'oportunidad', 'accion', 'principal', 'comercial'
  ]);

  return new Set(
    normalizeText(value)
      .split(' ')
      .filter((token) => token.length > 2 && !stopwords.has(token))
  );
};

const areTooSimilar = (a, b) => {
  if (!isMeaningfulText(a) || !isMeaningfulText(b)) return false;

  const normA = normalizeText(a);
  const normB = normalizeText(b);

  if (normA === normB) return true;
  if (normA.length > 32 && normB.length > 32 && (normA.includes(normB) || normB.includes(normA))) {
    return true;
  }

  const tokensA = tokenSet(a);
  const tokensB = tokenSet(b);
  if (!tokensA.size || !tokensB.size) return false;

  const intersection = [...tokensA].filter((token) => tokensB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  if (!union) return false;

  return intersection / union >= 0.72;
};

const dedupeTexts = (items, avoid = [], maxItems = null) => {
  const result = [];

  for (const item of items) {
    if (!isMeaningfulText(item)) continue;
    if (avoid.some((blocked) => areTooSimilar(item, blocked))) continue;
    if (result.some((existing) => areTooSimilar(item, existing))) continue;

    result.push(item);

    if (maxItems && result.length >= maxItems) {
      break;
    }
  }

  return result;
};

const dedupeKeyValueBlocks = (items, maxItems = null) => {
  const result = [];

  for (const item of items) {
    if (!item || !isMeaningfulText(item.value)) continue;
    if (result.some((existing) => areTooSimilar(item.value, existing.value))) continue;

    result.push(item);

    if (maxItems && result.length >= maxItems) {
      break;
    }
  }

  return result;
};

const getGridClass = (count) => {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'md:grid-cols-2';
  return 'md:grid-cols-3';
};

const PdfSection = ({ label, title, icon, children, noBorder = false }) => (
  <section
    className={`pdf-section px-8 py-8 sm:px-10 sm:py-9 ${noBorder ? '' : 'border-t border-slate-200'}`}
    style={{ pageBreakInside: 'avoid' }}
  >
    {(label || title) && (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </h2>
        </div>

        {label && (
          <div className="inline-flex items-center self-start px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            {label}
          </div>
        )}
      </div>
    )}

    {children}
  </section>
);

const SnapshotCard = ({ eyebrow, value, accent = 'default' }) => {
  const accentMap = {
    teal: 'border-teal-200 bg-teal-50',
    amber: 'border-amber-200 bg-amber-50',
    violet: 'border-fuchsia-200 bg-fuchsia-50',
    default: 'border-slate-200 bg-slate-50'
  };

  return (
    <div
      className={`pdf-card rounded-2xl border p-5 ${accentMap[accent] || accentMap.default}`}
      style={{ pageBreakInside: 'avoid' }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
        {eyebrow}
      </p>
      <p className="text-slate-900 font-medium leading-relaxed">
        {value}
      </p>
    </div>
  );
};

const SignalList = ({ title, items }) => (
  <div
    className="pdf-signal-list rounded-2xl border border-slate-200 bg-white p-4"
    style={{ pageBreakInside: 'avoid' }}
  >
    <p className="text-sm font-medium text-slate-700 mb-3">{title}</p>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${title}-${index}-${String(item).substring(0, 24)}`}
          className="text-slate-700 text-sm flex items-start gap-2"
        >
          <CheckCircle size={14} className="text-teal-600 mt-1 flex-shrink-0" weight="fill" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const normalizeReportView = (project) => {
  const diagnosis = project?.diagnosis;
  if (!diagnosis) return null;

  const strengths = ensureArray(diagnosis.strengths);
  const weaknesses = ensureArray(diagnosis.weaknesses);
  const quickWins = ensureArray(diagnosis.quick_wins);

  const executiveSummaryRaw =
    diagnosis.executive_summary && typeof diagnosis.executive_summary === 'object'
      ? diagnosis.executive_summary
      : {};

  const coreDiagnosisRaw =
    diagnosis.core_diagnosis && typeof diagnosis.core_diagnosis === 'object'
      ? diagnosis.core_diagnosis
      : {};

  const rawDimensionReview = ensureArray(diagnosis.dimension_review);
  const rawPriorityActions = ensureArray(diagnosis.priority_actions);

  const immediateActionRaw =
    diagnosis.immediate_action && typeof diagnosis.immediate_action === 'object'
      ? diagnosis.immediate_action
      : null;

  const continuityRecommendationRaw =
    diagnosis.continuity_recommendation && typeof diagnosis.continuity_recommendation === 'object'
      ? diagnosis.continuity_recommendation
      : null;

  const understanding =
    diagnosis.understanding ||
    diagnosis.summary ||
    executiveSummaryRaw.understanding ||
    '';

  const mainFinding =
    diagnosis.main_finding ||
    coreDiagnosisRaw.main_finding ||
    weaknesses[0] ||
    strengths[0] ||
    diagnosis.summary ||
    '';

  const mainWeakness =
    coreDiagnosisRaw.main_weakness ||
    weaknesses[0] ||
    '';

  const mainLeverage =
    diagnosis.opportunity ||
    coreDiagnosisRaw.main_leverage ||
    quickWins[0] ||
    '';

  const executiveCards = dedupeKeyValueBlocks([
    {
      key: 'understanding',
      label: 'Comprensión',
      value: executiveSummaryRaw.understanding || understanding
    },
    {
      key: 'main_tension',
      label: 'Tensión principal',
      value: executiveSummaryRaw.main_tension || weaknesses[0] || ''
    },
    {
      key: 'commercial_importance',
      label: 'Importancia comercial',
      value: executiveSummaryRaw.commercial_importance || ''
    },
    {
      key: 'bottom_line',
      label: 'Conclusión ejecutiva',
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

  const dimensionReview = rawDimensionReview.filter((dimension) => {
    if (!dimension || typeof dimension !== 'object') return false;
    return isMeaningfulText(dimension.reading);
  });

  const priorityActions = rawPriorityActions
    .filter((action) => action && typeof action === 'object')
    .filter((action) => isMeaningfulText(action.title) || isMeaningfulText(action.why_it_matters))
    .filter((action, index, list) =>
      list.findIndex((candidate) => {
        const sameTitle = areTooSimilar(candidate.title, action.title);
        const sameWhy = areTooSimilar(candidate.why_it_matters, action.why_it_matters);
        return sameTitle || sameWhy;
      }) === index
    );

  let immediateAction = null;

  if (
    immediateActionRaw &&
    (isMeaningfulText(immediateActionRaw.title) || isMeaningfulText(immediateActionRaw.description))
  ) {
    immediateAction = {
      title: isMeaningfulText(immediateActionRaw.title)
        ? immediateActionRaw.title
        : 'Siguiente acción inmediata',
      description: isMeaningfulText(immediateActionRaw.description)
        ? immediateActionRaw.description
        : ''
    };
  } else if (priorityActions.length > 0) {
    immediateAction = {
      title: priorityActions[0].title || 'Aplicar acción prioritaria',
      description: priorityActions[0].why_it_matters || ''
    };
  } else if (quickWins.length > 0 && isMeaningfulText(quickWins[0])) {
    immediateAction = {
      title: 'Aplicar quick win prioritario',
      description: quickWins[0]
    };
  }

  let continuityRecommendation = null;
  if (
    continuityRecommendationRaw &&
    (
      isMeaningfulText(continuityRecommendationRaw.reason) ||
      (continuityRecommendationRaw.recommended_path &&
        continuityRecommendationRaw.recommended_path !== 'stay')
    )
  ) {
    continuityRecommendation = continuityRecommendationRaw;
  }

  const avoidSignals = [
    ...executiveCards.map((item) => item.value),
    ...coreDiagnosisCards.map((item) => item.value),
    immediateAction?.title || '',
    immediateAction?.description || ''
  ];

  const filteredStrengths = dedupeTexts(strengths, avoidSignals, 3);
  const filteredWeaknesses = dedupeTexts(weaknesses, avoidSignals, 4);
  const filteredQuickWins = dedupeTexts(quickWins, avoidSignals, 4);

  return {
    strengths: filteredStrengths,
    weaknesses: filteredWeaknesses,
    quickWins: filteredQuickWins,
    executiveCards,
    coreDiagnosisCards,
    dimensionReview,
    priorityActions,
    immediateAction,
    continuityRecommendation
  };
};

const PremiumReportPdfTemplate = ({
  project,
  brandName = 'Sistema Maestro',
  documentTitle = 'Informe Puntual',
  showSystemFooter = true
}) => {
  const reportView = useMemo(() => normalizeReportView(project), [project]);

  const routeLabel = ROUTE_NAMES[project?.route] || project?.route || 'Sin clasificar';
  const issueDate = formatDate(project?.created_at);

  const dimensionCounters = useMemo(() => {
    const counters = { strong: 0, improvable: 0, priority: 0 };
    const items = reportView?.dimensionReview || [];

    items.forEach((item) => {
      if (item?.status && counters[item.status] !== undefined) {
        counters[item.status] += 1;
      }
    });

    return counters;
  }, [reportView]);

  const continuityPath = reportView?.continuityRecommendation?.recommended_path || null;
  const continuityMeta = reportView?.continuityRecommendation
    ? (
        CONTINUITY_META[continuityPath] || {
          label: 'Continuidad recomendada',
          badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200'
        }
      )
    : null;

  const heroCards = useMemo(() => {
    const cards = [];

    if (reportView?.coreDiagnosisCards?.[0]?.value) {
      cards.push({
        eyebrow: reportView.coreDiagnosisCards[0].label,
        value: reportView.coreDiagnosisCards[0].value,
        accent: 'teal'
      });
    }

    const leverageCard = reportView?.coreDiagnosisCards?.find((item) => item.key === 'main_leverage');
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
  }, [reportView, continuityMeta]);

  const signalGroups = useMemo(() => {
    const groups = [];

    if (reportView?.strengths?.length > 0) {
      groups.push({ title: 'Fortalezas', items: reportView.strengths });
    }
    if (reportView?.weaknesses?.length > 0) {
      groups.push({ title: 'Debilidades', items: reportView.weaknesses });
    }
    if (reportView?.quickWins?.length > 0) {
      groups.push({ title: 'Quick wins', items: reportView.quickWins });
    }

    return groups;
  }, [reportView]);

  const visibleSections = useMemo(() => {
    const sections = ['hero'];

    const hasSummary =
      (reportView?.executiveCards?.length || 0) > 0 ||
      (reportView?.coreDiagnosisCards?.length || 0) > 0;
    if (hasSummary) sections.push('summary');

    const hasDimensions = (reportView?.dimensionReview?.length || 0) > 0;
    if (hasDimensions) sections.push('dimensions');

    const hasActions =
      (reportView?.priorityActions?.length || 0) > 0 ||
      !!reportView?.immediateAction;
    if (hasActions) sections.push('actions');

    const hasContinuityOrSignals =
      !!reportView?.continuityRecommendation ||
      signalGroups.length > 0;
    if (hasContinuityOrSignals) sections.push('closing');

    return sections;
  }, [reportView, signalGroups]);

  const sectionMap = useMemo(() => {
    const map = {};
    visibleSections.forEach((section, index) => {
      map[section] = `Bloque ${index + 1}`;
    });
    return map;
  }, [visibleSections]);

  if (!project || !reportView) {
    return (
      <div className="max-w-[920px] mx-auto rounded-2xl border border-slate-200 bg-white p-8 text-slate-800">
        No hay datos suficientes para renderizar el informe.
      </div>
    );
  }

  return (
    <div className="max-w-[920px] mx-auto">
      <style>{`
        @media print {
          #print-report-root,
          #print-report-root * {
            color: inherit !important;
          }

          .pdf-document-shell {
            background: #ffffff !important;
            color: #0f172a !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            max-width: none !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          .pdf-hero-band,
          .pdf-card,
          .pdf-signal-list,
          .pdf-soft-card,
          .pdf-meta-card,
          .pdf-context-card,
          .pdf-footer-card {
            background: #ffffff !important;
            box-shadow: none !important;
          }

          .pdf-section,
          .pdf-card,
          .pdf-signal-list,
          .pdf-soft-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="pdf-document-shell bg-white text-slate-900 rounded-[28px] overflow-hidden border border-slate-200 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
        <PdfSection label={sectionMap.hero} noBorder>
          <div className="pdf-hero-band pb-8 border-b border-slate-200 -mx-8 -mt-8 px-8 pt-8 sm:-mx-10 sm:-mt-9 sm:px-10 sm:pt-9 bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)]">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-sm font-medium mb-4">
                  <Sparkle size={14} weight="fill" />
                  {documentTitle}
                </div>

                <h1 className="text-3xl sm:text-[2.3rem] font-semibold text-slate-900 mb-3 leading-tight">
                  Lectura premium estructurada
                </h1>

                <p className="text-slate-600 max-w-3xl leading-relaxed">
                  Vista base del informe canónico: comprensión, diagnóstico central,
                  dimensiones, prioridades y recomendación de continuidad.
                </p>
              </div>

              <div className="pdf-meta-card rounded-2xl border border-slate-200 bg-white px-5 py-5 min-w-[260px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1">
                  Documento
                </p>
                <p className="text-slate-900 font-medium mb-3">{brandName}</p>

                <div className="space-y-2 text-sm">
                  <p className="text-slate-700">
                    <span className="text-slate-500">Fecha:</span> {issueDate || 'Sin fecha'}
                  </p>
                  <p className="text-slate-700">
                    <span className="text-slate-500">Ruta:</span> {routeLabel}
                  </p>
                  <p className="text-slate-700">
                    <span className="text-slate-500">Entrada:</span>{' '}
                    {project.input_type === 'url' ? 'URL' : 'Idea / descripción'}
                  </p>
                  {project.project_id && (
                    <p className="text-slate-700 break-all">
                      <span className="text-slate-500">Proyecto:</span> {project.project_id}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div
              className="pdf-context-card rounded-2xl border border-slate-200 bg-white p-5 mb-6"
              style={{ pageBreakInside: 'avoid' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
                Contexto analizado
              </p>
              <p className="text-slate-800 leading-relaxed break-words">{project.input_content}</p>
            </div>

            {heroCards.length > 0 && (
              <div className={`grid gap-4 ${getGridClass(heroCards.length)}`}>
                {heroCards.map((card) => (
                  <SnapshotCard
                    key={`${card.eyebrow}-${card.value.substring(0, 24)}`}
                    eyebrow={card.eyebrow}
                    value={card.value}
                    accent={card.accent}
                  />
                ))}
              </div>
            )}
          </div>
        </PdfSection>

        {visibleSections.includes('summary') && (
          <PdfSection
            label={sectionMap.summary}
            title="Resumen ejecutivo"
            icon={<DiamondsFour size={18} className="text-amber-600" weight="fill" />}
          >
            {reportView.executiveCards.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {reportView.executiveCards.map((item) => (
                  <div
                    key={item.key}
                    className="pdf-soft-card rounded-2xl border border-slate-200 bg-white p-5"
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
                      {item.label}
                    </p>
                    <p className="text-slate-800 leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {reportView.coreDiagnosisCards.length > 0 && (
              <div className={`${reportView.executiveCards.length > 0 ? 'mt-6' : ''}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Lightning size={18} className="text-teal-600" weight="fill" />
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Diagnóstico central
                  </h3>
                </div>

                <div className={`grid gap-4 ${getGridClass(reportView.coreDiagnosisCards.length)}`}>
                  {reportView.coreDiagnosisCards.map((item) => {
                    const accentClass =
                      item.accent === 'teal'
                        ? 'border-teal-200 bg-teal-50'
                        : item.accent === 'amber'
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-slate-200 bg-slate-50';

                    const eyebrowClass =
                      item.accent === 'teal'
                        ? 'text-teal-700'
                        : item.accent === 'amber'
                          ? 'text-amber-700'
                          : 'text-slate-500';

                    return (
                      <div
                        key={item.key}
                        className={`pdf-card rounded-2xl border p-5 ${accentClass}`}
                        style={{ pageBreakInside: 'avoid' }}
                      >
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] mb-2 ${eyebrowClass}`}>
                          {item.label}
                        </p>
                        <p className="text-slate-900 font-medium leading-relaxed">{item.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </PdfSection>
        )}

        {visibleSections.includes('dimensions') && (
          <PdfSection
            label={sectionMap.dimensions}
            title="Lectura por dimensiones"
            icon={<Flag size={18} className="text-teal-600" weight="fill" />}
          >
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${DIMENSION_STATUS_META.strong.badgeClass}`}>
                {dimensionCounters.strong} fuertes
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${DIMENSION_STATUS_META.improvable.badgeClass}`}>
                {dimensionCounters.improvable} mejorables
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${DIMENSION_STATUS_META.priority.badgeClass}`}>
                {dimensionCounters.priority} prioritarias
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {reportView.dimensionReview.map((dimension) => {
                const statusMeta =
                  DIMENSION_STATUS_META[dimension.status] || DIMENSION_STATUS_META.improvable;
                const priorityMeta =
                  PRIORITY_META[dimension.priority] || PRIORITY_META.medium;

                return (
                  <div
                    key={dimension.id}
                    className={`pdf-card rounded-2xl border p-4 ${statusMeta.cardClass}`}
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-slate-900 font-medium">{dimension.label}</p>
                      <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed mb-4">
                      {dimension.reading}
                    </p>

                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${priorityMeta.badgeClass}`}>
                      Prioridad {priorityMeta.label.toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </PdfSection>
        )}

        {visibleSections.includes('actions') && (
          <PdfSection
            label={sectionMap.actions}
            title="Acciones prioritarias"
            icon={<CheckCircle size={18} className="text-teal-600" weight="fill" />}
          >
            {reportView.priorityActions.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {reportView.priorityActions.map((action, index) => {
                  const intensityMeta =
                    PRIORITY_META[action.intensity] || PRIORITY_META.medium;

                  return (
                    <div
                      key={action.id || `${action.title}-${index}`}
                      className="pdf-card rounded-2xl border border-slate-200 bg-white p-5"
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${intensityMeta.badgeClass}`}>
                          {intensityMeta.label}
                        </span>
                      </div>

                      <p className="text-slate-900 font-medium mb-2 leading-relaxed">{action.title}</p>
                      {isMeaningfulText(action.why_it_matters) && (
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {action.why_it_matters}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {reportView.immediateAction && (
              <div
                className="pdf-soft-card rounded-2xl border border-slate-200 bg-slate-50 p-5"
                style={{ pageBreakInside: 'avoid' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
                  Acción inmediata
                </p>

                <p className="text-slate-900 font-medium mb-2">
                  {reportView.immediateAction.title}
                </p>

                {isMeaningfulText(reportView.immediateAction.description) && (
                  <p className="text-slate-700 leading-relaxed">
                    {reportView.immediateAction.description}
                  </p>
                )}
              </div>
            )}
          </PdfSection>
        )}

        {visibleSections.includes('closing') && (
          <PdfSection
            label={sectionMap.closing}
            title={
              reportView.continuityRecommendation && signalGroups.length > 0
                ? 'Continuidad y señales complementarias'
                : reportView.continuityRecommendation
                  ? 'Continuidad recomendada'
                  : 'Señales complementarias'
            }
            icon={<Sparkle size={18} className="text-teal-600" weight="fill" />}
          >
            <div className={`grid gap-4 ${reportView.continuityRecommendation && signalGroups.length > 0 ? 'lg:grid-cols-[1.05fr_0.95fr]' : 'grid-cols-1'}`}>
              {reportView.continuityRecommendation && continuityMeta && (
                <div
                  className="pdf-soft-card rounded-2xl border border-teal-200 bg-teal-50 p-5"
                  style={{ pageBreakInside: 'avoid' }}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${continuityMeta.badgeClass}`}>
                      {continuityMeta.label}
                    </span>
                  </div>

                  {isMeaningfulText(reportView.continuityRecommendation.reason) && (
                    <p className="text-slate-800 leading-relaxed mb-4">
                      {reportView.continuityRecommendation.reason}
                    </p>
                  )}

                  {isMeaningfulText(reportView.continuityRecommendation.cta_label) && (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1">
                        CTA de continuidad
                      </p>
                      <p className="text-slate-900">
                        {reportView.continuityRecommendation.cta_label}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {signalGroups.length > 0 && (
                <div
                  className="pdf-soft-card rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  style={{ pageBreakInside: 'avoid' }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
                    Señales complementarias
                  </p>

                  <div className="grid gap-4">
                    {signalGroups.map((group) => (
                      <SignalList key={group.title} title={group.title} items={group.items} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {continuityMeta?.label && (
              <div
                className="pdf-footer-card rounded-2xl border border-slate-200 bg-white px-5 py-5 mt-6"
                style={{ pageBreakInside: 'avoid' }}
              >
                <p className="text-slate-800 leading-relaxed">
                  Con esta lectura ya puedes ver el caso con más claridad.
                  {reportView.continuityRecommendation ? (
                    <>
                      {' '}Si quieres activarlo dentro del sistema, el siguiente paso correcto es{' '}
                      <span className="text-teal-700 font-semibold">{continuityMeta.label}</span>.
                    </>
                  ) : (
                    <>
                      {' '}El siguiente paso correcto es reforzar la parte más débil del caso antes de ampliar intensidad.
                    </>
                  )}
                </p>
              </div>
            )}
          </PdfSection>
        )}

        {showSystemFooter && (
          <div className="px-8 py-5 sm:px-10 border-t border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
              <p className="text-slate-700">
                {brandName} · Validación breve y accionable
              </p>
              <p className="text-slate-500">
                Documento preparado para vista premium y futura exportación PDF
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumReportPdfTemplate;
