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

const PRIORITY_META = {
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

const CONTINUITY_META = {
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

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const SnapshotCard = ({ eyebrow, value, accent = 'default' }) => {
  const accentMap = {
    teal: 'border-[#0F5257]/20 bg-[#0F5257]/8 text-[#8DE1D0]',
    amber: 'border-amber-500/20 bg-amber-500/8 text-amber-300',
    violet: 'border-fuchsia-500/20 bg-fuchsia-500/8 text-fuchsia-300',
    default: 'border-white/5 bg-[#0A0A0A] text-white'
  };

  const accentClass = accentMap[accent] || accentMap.default;

  return (
    <div className={`rounded-xl border p-5 ${accentClass}`}>
      <p className="text-[11px] uppercase tracking-wide mb-2 opacity-80">{eyebrow}</p>
      <p className="text-white font-medium leading-relaxed">{value}</p>
    </div>
  );
};

const SignalList = ({ title, items }) => (
  <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/5">
    <p className="text-sm text-[#A3A3A3] mb-3">{title}</p>
    {items.length > 0 ? (
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}-${String(item).substring(0, 24)}`}
            className="text-white text-sm flex items-start gap-2"
          >
            <CheckCircle size={14} className="text-[#0F5257] mt-1 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-[#A3A3A3] text-sm">Sin datos.</p>
    )}
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

  const dimensionReview = ensureArray(diagnosis.dimension_review);
  const priorityActions = ensureArray(diagnosis.priority_actions);

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

const PremiumReportPdfTemplate = ({
  project,
  brandName = 'Sistema Maestro',
  documentTitle = 'Informe Puntual',
  showSystemFooter = true
}) => {
  const reportView = useMemo(() => normalizeReportView(project), [project]);

  const routeLabel = ROUTE_NAMES[project?.route] || project?.route || 'Sin clasificar';
  const issueDate = formatDate(project?.created_at);
  const continuityPath = reportView?.continuityRecommendation?.recommended_path || 'stay';
  const continuityMeta = CONTINUITY_META[continuityPath] || CONTINUITY_META.stay;

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

  if (!project || !reportView) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#111111] p-8 text-white">
        No hay datos suficientes para renderizar el informe.
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] text-white rounded-[28px] overflow-hidden border border-white/5">
      <div className="px-8 py-8 sm:px-10 sm:py-10 border-b border-white/5 bg-[radial-gradient(circle_at_top_right,rgba(15,82,87,0.16),transparent_35%)]">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F5257]/15 text-[#8DE1D0] text-sm font-medium mb-4">
              <Sparkle weight="fill" />
              {documentTitle}
            </div>

            <h1 className="text-3xl sm:text-4xl font-light text-white mb-3">
              Lectura premium estructurada
            </h1>

            <p className="text-[#CFCFCF] max-w-3xl leading-relaxed">
              Validación breve y accionable para entender el caso, detectar la fricción principal
              y ordenar el siguiente paso correcto dentro del sistema.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#111111] px-5 py-5 min-w-[260px]">
            <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
              Documento
            </p>
            <p className="text-white font-medium mb-3">{brandName}</p>

            <div className="space-y-2 text-sm">
              <p className="text-[#D4D4D4]">
                <span className="text-[#A3A3A3]">Fecha:</span> {issueDate || 'Sin fecha'}
              </p>
              <p className="text-[#D4D4D4]">
                <span className="text-[#A3A3A3]">Ruta:</span> {routeLabel}
              </p>
              <p className="text-[#D4D4D4]">
                <span className="text-[#A3A3A3]">Entrada:</span>{' '}
                {project.input_type === 'url' ? 'URL' : 'Descripción'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-5">
          <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-2">
            Contexto analizado
          </p>
          <p className="text-white leading-relaxed break-words">{project.input_content}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mt-6">
          <SnapshotCard
            eyebrow="Hallazgo principal"
            value={reportView.coreDiagnosis.mainFinding}
            accent="teal"
          />
          <SnapshotCard
            eyebrow="Palanca principal"
            value={reportView.coreDiagnosis.mainLeverage}
            accent="amber"
          />
          <SnapshotCard
            eyebrow="Continuidad recomendada"
            value={continuityMeta.label}
            accent="violet"
          />
        </div>
      </div>

      <div className="px-8 py-8 sm:px-10 sm:py-10 border-b border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <DiamondsFour size={18} className="text-amber-300" weight="fill" />
          <h2 className="text-sm uppercase tracking-wide text-[#A3A3A3]">
            Resumen ejecutivo
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5">
            <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wide">
              Comprensión
            </p>
            <p className="text-white">{reportView.executiveSummary.understanding}</p>
          </div>

          <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5">
            <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wide">
              Tensión principal
            </p>
            <p className="text-white">{reportView.executiveSummary.mainTension}</p>
          </div>

          <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5">
            <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wide">
              Importancia comercial
            </p>
            <p className="text-white">{reportView.executiveSummary.commercialImportance}</p>
          </div>

          <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5">
            <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wide">
              Conclusión ejecutiva
            </p>
            <p className="text-white">{reportView.executiveSummary.bottomLine}</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 sm:px-10 sm:py-10 border-b border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Lightning size={18} className="text-[#8DE1D0]" weight="fill" />
          <h2 className="text-sm uppercase tracking-wide text-[#A3A3A3]">
            Diagnóstico central
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl p-5 border border-[#0F5257]/20 bg-[#0F5257]/8">
            <p className="text-xs text-[#8DE1D0] mb-2 uppercase tracking-wide">
              Hallazgo principal
            </p>
            <p className="text-white font-medium">{reportView.coreDiagnosis.mainFinding}</p>
          </div>

          <div className="rounded-xl p-5 border border-white/5 bg-[#0A0A0A]">
            <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wide">
              Debilidad principal
            </p>
            <p className="text-white">{reportView.coreDiagnosis.mainWeakness}</p>
          </div>

          <div className="rounded-xl p-5 border border-amber-500/20 bg-amber-500/8">
            <p className="text-xs text-amber-300 mb-2 uppercase tracking-wide">
              Palanca principal
            </p>
            <p className="text-white">{reportView.coreDiagnosis.mainLeverage}</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 sm:px-10 sm:py-10 border-b border-white/5">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-[#8DE1D0]" weight="fill" />
            <h2 className="text-sm uppercase tracking-wide text-[#A3A3A3]">
              Lectura por dimensiones
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs ${DIMENSION_STATUS_META.strong.badgeClass}`}>
              {dimensionCounters.strong} fuertes
            </span>
            <span className={`px-3 py-1 rounded-full text-xs ${DIMENSION_STATUS_META.improvable.badgeClass}`}>
              {dimensionCounters.improvable} mejorables
            </span>
            <span className={`px-3 py-1 rounded-full text-xs ${DIMENSION_STATUS_META.priority.badgeClass}`}>
              {dimensionCounters.priority} prioritarias
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
          {reportView.dimensionReview.map((dimension) => {
            const statusMeta =
              DIMENSION_STATUS_META[dimension.status] || DIMENSION_STATUS_META.improvable;
            const priorityMeta =
              PRIORITY_META[dimension.priority] || PRIORITY_META.medium;

            return (
              <div
                key={dimension.id}
                className={`rounded-xl border p-4 ${statusMeta.cardClass}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-white font-medium">{dimension.label}</p>
                  <span className={`px-2 py-1 rounded-full text-[11px] ${statusMeta.badgeClass}`}>
                    {statusMeta.label}
                  </span>
                </div>

                <p className="text-sm text-[#D4D4D4] leading-relaxed mb-4">
                  {dimension.reading}
                </p>

                <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] ${priorityMeta.badgeClass}`}>
                  Prioridad {priorityMeta.label.toLowerCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-8 py-8 sm:px-10 sm:py-10 border-b border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={18} className="text-[#8DE1D0]" weight="fill" />
          <h2 className="text-sm uppercase tracking-wide text-[#A3A3A3]">
            Acciones prioritarias
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {reportView.priorityActions.map((action, index) => {
            const intensityMeta =
              PRIORITY_META[action.intensity] || PRIORITY_META.medium;

            return (
              <div
                key={action.id}
                className="rounded-xl border border-white/5 bg-[#0A0A0A] p-5"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#0F5257]/15 text-[#8DE1D0] flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] ${intensityMeta.badgeClass}`}>
                    {intensityMeta.label}
                  </span>
                </div>

                <p className="text-white font-medium mb-2">{action.title}</p>
                <p className="text-sm text-[#D4D4D4] leading-relaxed">
                  {action.why_it_matters}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-8 py-8 sm:px-10 sm:py-10 border-b border-white/5">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-4">
          <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-5">
            <p className="text-sm uppercase tracking-wide text-[#A3A3A3] mb-3">
              Acción inmediata
            </p>

            {reportView.immediateAction ? (
              <>
                <p className="text-white font-medium mb-2">
                  {reportView.immediateAction.title}
                </p>
                <p className="text-[#D4D4D4] leading-relaxed">
                  {reportView.immediateAction.description}
                </p>
              </>
            ) : (
              <p className="text-[#A3A3A3]">Sin acción inmediata disponible.</p>
            )}
          </div>

          <div className="rounded-xl border border-[#0F5257]/20 bg-[#0F5257]/8 p-5">
            <p className="text-sm uppercase tracking-wide text-[#8DE1D0] mb-3">
              Recomendación de continuidad
            </p>

            {reportView.continuityRecommendation ? (
              <>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm ${continuityMeta.badgeClass}`}>
                    {continuityMeta.label}
                  </span>
                </div>

                <p className="text-white mb-4 leading-relaxed">
                  {reportView.continuityRecommendation.reason}
                </p>

                <div className="rounded-xl border border-white/5 bg-[#111111] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
                    CTA de continuidad
                  </p>
                  <p className="text-white">
                    {reportView.continuityRecommendation.cta_label || continuityMeta.label}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-[#A3A3A3]">Sin recomendación de continuidad disponible.</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 py-8 sm:px-10 sm:py-10">
        <h2 className="text-sm uppercase tracking-wide text-[#A3A3A3] mb-4">
          Señales complementarias
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          <SignalList title="Fortalezas" items={reportView.strengths} />
          <SignalList title="Debilidades" items={reportView.weaknesses} />
          <SignalList title="Quick wins" items={reportView.quickWins} />
        </div>
      </div>

      {showSystemFooter && (
        <div className="px-8 py-5 sm:px-10 border-t border-white/5 bg-[#0B0B0B]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <p className="text-[#D4D4D4]">
              Con esta lectura ya puedes ver el caso con más claridad.
            </p>
            <p className="text-[#A3A3A3]">
              {brandName} · Validación breve y accionable
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumReportPdfTemplate;
