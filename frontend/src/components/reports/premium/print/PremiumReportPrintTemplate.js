import React, { useMemo } from 'react';
import {
  CheckCircle,
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

const isMeaningfulText = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length < 10) return false;
  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
};

const dedupeTexts = (items, maxItems = null) => {
  const result = [];

  for (const item of items) {
    if (!isMeaningfulText(item)) continue;
    if (result.includes(item)) continue;
    result.push(item);
    if (maxItems && result.length >= maxItems) break;
  }

  return result;
};

const normalizeReportView = (project) => {
  const diagnosis = project?.diagnosis;
  if (!diagnosis) return null;

  const strengths = dedupeTexts(ensureArray(diagnosis.strengths), 3);
  const weaknesses = dedupeTexts(ensureArray(diagnosis.weaknesses), 4);
  const quickWins = dedupeTexts(ensureArray(diagnosis.quick_wins), 4);

  const executiveSummaryRaw =
    diagnosis.executive_summary && typeof diagnosis.executive_summary === 'object'
      ? diagnosis.executive_summary
      : {};

  const coreDiagnosisRaw =
    diagnosis.core_diagnosis && typeof diagnosis.core_diagnosis === 'object'
      ? diagnosis.core_diagnosis
      : {};

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

  const executiveSummary = {
    understanding:
      executiveSummaryRaw.understanding || understanding,
    mainTension:
      executiveSummaryRaw.main_tension || weaknesses[0] || '',
    commercialImportance:
      executiveSummaryRaw.commercial_importance || '',
    bottomLine:
      executiveSummaryRaw.bottom_line || quickWins[0] || ''
  };

  const coreDiagnosis = {
    mainFinding,
    mainWeakness,
    mainLeverage
  };

  const priorityActions = rawPriorityActions
    .filter((action) => action && typeof action === 'object')
    .filter((action) => isMeaningfulText(action.title) || isMeaningfulText(action.why_it_matters))
    .slice(0, 3);

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
  } else if (quickWins.length > 0) {
    immediateAction = {
      title: 'Aplicar quick win prioritario',
      description: quickWins[0]
    };
  }

  const continuityRecommendation =
    continuityRecommendationRaw &&
    (isMeaningfulText(continuityRecommendationRaw.reason) ||
      isMeaningfulText(continuityRecommendationRaw.cta_label))
      ? continuityRecommendationRaw
      : null;

  return {
    strengths,
    weaknesses,
    quickWins,
    executiveSummary,
    coreDiagnosis,
    priorityActions,
    immediateAction,
    continuityRecommendation
  };
};

const buildAdvancePrompt = ({ project, routeLabel, reportView }) => {
  const context = project?.input_content || 'Sin contexto';
  const entryType = project?.input_type === 'url' ? 'URL' : 'idea o descripción';
  const immediateTitle =
    reportView?.immediateAction?.title ||
    reportView?.coreDiagnosis?.mainLeverage ||
    'Definir el siguiente paso prioritario';

  return [
    'Actúa como estratega digital senior y transforma este caso en un siguiente paso ejecutable.',
    '',
    `Contexto analizado: ${context}`,
    `Tipo de entrada: ${entryType}`,
    `Ruta detectada: ${routeLabel}`,
    `Hallazgo principal: ${reportView?.coreDiagnosis?.mainFinding || 'No disponible'}`,
    `Palanca principal: ${reportView?.coreDiagnosis?.mainLeverage || 'No disponible'}`,
    `Primer foco de mejora: ${immediateTitle}`,
    '',
    'Devuélveme:',
    '1. El objetivo inmediato correcto para este caso.',
    '2. La estructura o enfoque recomendado para moverlo sin dispersión.',
    '3. Las 3 acciones prioritarias más concretas.',
    '4. Qué copy, elementos o bloques debería implementar primero.',
    '5. Qué errores o desvíos debería evitar en este caso.',
    '',
    'Condiciones:',
    '- No generalices.',
    '- No improvises soluciones vagas.',
    '- Prioriza claridad, conversión y continuidad.',
    '- Responde con enfoque profesional y accionable.'
  ].join('\n');
};

const PdfSection = ({ title, icon, children, noBorder = false }) => (
  <section
    className={`pdf-section px-8 py-8 sm:px-10 sm:py-9 ${noBorder ? '' : 'border-t border-slate-200'}`}
    style={{ pageBreakInside: 'avoid' }}
  >
    {title && (
      <div className="flex items-center gap-2 mb-5">
        {icon}
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {title}
        </h2>
      </div>
    )}

    {children}
  </section>
);

const MetricCard = ({ eyebrow, value, accent = 'default' }) => {
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

const SoftCard = ({ eyebrow, value }) => (
  <div
    className="pdf-soft-card rounded-2xl border border-slate-200 bg-white p-5"
    style={{ pageBreakInside: 'avoid' }}
  >
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
      {eyebrow}
    </p>
    <p className="text-slate-800 leading-relaxed">{value}</p>
  </div>
);

const BulletList = ({ title, items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div
      className="pdf-soft-card rounded-2xl border border-slate-200 bg-white p-5"
      style={{ pageBreakInside: 'avoid' }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
        {title}
      </p>

      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}-${String(item).substring(0, 24)}`}
            className="text-slate-800 text-sm flex items-start gap-2"
          >
            <CheckCircle size={14} className="text-teal-600 mt-1 flex-shrink-0" weight="fill" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const PremiumReportPrintTemplate = ({
  project,
  brandName = 'Sistema Maestro',
  documentTitle = 'Informe Puntual',
  showSystemFooter = true
}) => {
  const reportView = useMemo(() => normalizeReportView(project), [project]);

  const routeLabel = ROUTE_NAMES[project?.route] || project?.route || 'Sin clasificar';
  const issueDate = formatDate(project?.created_at);

  const advancePrompt = useMemo(() => {
    if (!project || !reportView) return '';
    return buildAdvancePrompt({ project, routeLabel, reportView });
  }, [project, reportView, routeLabel]);

  if (!project || !reportView) {
    return (
      <div className="max-w-[920px] mx-auto rounded-2xl border border-slate-200 bg-white p-8 text-slate-800">
        No hay datos suficientes para renderizar el informe.
      </div>
    );
  }

  const validationLead =
    reportView.executiveSummary.bottomLine ||
    reportView.executiveSummary.commercialImportance ||
    reportView.executiveSummary.understanding ||
    reportView.coreDiagnosis.mainFinding;

  const firstFocus =
    reportView.immediateAction?.title ||
    reportView.coreDiagnosis.mainLeverage ||
    'Definir el siguiente foco de mejora';

  return (
    <div className="max-w-[920px] mx-auto">
      <style>{`
        @media print {
          html, body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
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
          .pdf-soft-card,
          .pdf-context-card,
          .pdf-meta-card,
          .pdf-prompt-box {
            box-shadow: none !important;
          }

          .pdf-section,
          .pdf-card,
          .pdf-soft-card,
          .pdf-prompt-box {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="pdf-document-shell bg-white text-slate-900 rounded-[28px] overflow-hidden border border-slate-200 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
        <PdfSection noBorder>
          <div className="pdf-hero-band pb-8 border-b border-slate-200 -mx-8 -mt-8 px-8 pt-8 sm:-mx-10 sm:-mt-9 sm:px-10 sm:pt-9 bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)]">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-sm font-medium mb-4">
                  <Sparkle size={14} weight="fill" />
                  {documentTitle}
                </div>

                <h1 className="text-3xl sm:text-[2.3rem] font-semibold text-slate-900 mb-3 leading-tight">
                  Informe puntual de validación
                </h1>

                <p className="text-slate-600 max-w-3xl leading-relaxed">
                  Validación puntual, lectura útil, primer foco de mejora y prompt de avance para mover el caso con más criterio.
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

            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                eyebrow="Hallazgo principal"
                value={reportView.coreDiagnosis.mainFinding}
                accent="teal"
              />
              <MetricCard
                eyebrow="Palanca principal"
                value={reportView.coreDiagnosis.mainLeverage}
                accent="amber"
              />
              <MetricCard
                eyebrow="Primer foco de mejora"
                value={firstFocus}
                accent="violet"
              />
            </div>
          </div>
        </PdfSection>

        <PdfSection
          title="Validación puntual"
          icon={<CheckCircle size={18} className="text-teal-600" weight="fill" />}
        >
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4 mb-4">
            <div
              className="pdf-soft-card rounded-2xl border border-slate-200 bg-slate-50 p-5"
              style={{ pageBreakInside: 'avoid' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
                Lectura de validación
              </p>
              <p className="text-slate-800 leading-relaxed">
                {validationLead}
              </p>
            </div>

            <div className="grid gap-4">
              <MetricCard
                eyebrow="Fricción central"
                value={reportView.coreDiagnosis.mainWeakness || reportView.executiveSummary.mainTension || 'Sin fricción central disponible.'}
                accent="default"
              />
            </div>
          </div>
        </PdfSection>

        <PdfSection
          title="Lectura útil del caso"
          icon={<Lightning size={18} className="text-amber-600" weight="fill" />}
        >
          <div className="grid md:grid-cols-2 gap-4">
            {isMeaningfulText(reportView.executiveSummary.understanding) && (
              <SoftCard
                eyebrow="Comprensión"
                value={reportView.executiveSummary.understanding}
              />
            )}

            {isMeaningfulText(reportView.executiveSummary.mainTension) && (
              <SoftCard
                eyebrow="Tensión principal"
                value={reportView.executiveSummary.mainTension}
              />
            )}

            {isMeaningfulText(reportView.executiveSummary.commercialImportance) && (
              <SoftCard
                eyebrow="Importancia comercial"
                value={reportView.executiveSummary.commercialImportance}
              />
            )}

            {isMeaningfulText(reportView.executiveSummary.bottomLine) && (
              <SoftCard
                eyebrow="Conclusión ejecutiva"
                value={reportView.executiveSummary.bottomLine}
              />
            )}
          </div>
        </PdfSection>

        <PdfSection
          title="Primer foco de mejora"
          icon={<Sparkle size={18} className="text-teal-600" weight="fill" />}
        >
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-4 mb-4">
            <div className="grid gap-4">
              {reportView.immediateAction && (
                <div
                  className="pdf-soft-card rounded-2xl border border-teal-200 bg-teal-50 p-5"
                  style={{ pageBreakInside: 'avoid' }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 mb-3">
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

              <BulletList
                title="Acciones prioritarias"
                items={reportView.priorityActions.map((action) => action.title).filter(Boolean)}
              />
            </div>

            <div className="grid gap-4">
              <BulletList
                title="Fortalezas detectadas"
                items={reportView.strengths}
              />

              <BulletList
                title="Quick wins"
                items={reportView.quickWins}
              />
            </div>
          </div>
        </PdfSection>

        <PdfSection
          title="Prompt de avance"
          icon={<Lightning size={18} className="text-amber-600" weight="fill" />}
        >
          <div
            className="pdf-prompt-box rounded-2xl border border-slate-200 bg-slate-50 p-5"
            style={{ pageBreakInside: 'avoid' }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
              Prompt listo para copiar
            </p>

            <pre className="whitespace-pre-wrap break-words text-[13px] leading-6 text-slate-800 font-mono">
              {advancePrompt}
            </pre>
          </div>

          {reportView.continuityRecommendation && isMeaningfulText(reportView.continuityRecommendation.reason) && (
            <div
              className="pdf-soft-card rounded-2xl border border-slate-200 bg-white p-5 mt-4"
              style={{ pageBreakInside: 'avoid' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
                Nota de continuidad
              </p>
              <p className="text-slate-800 leading-relaxed">
                {reportView.continuityRecommendation.reason}
              </p>
            </div>
          )}
        </PdfSection>

        {showSystemFooter && (
          <div className="px-8 py-5 sm:px-10 border-t border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
              <p className="text-slate-700">
                {brandName} · Informe puntual de validación
              </p>
              <p className="text-slate-500">
                Documento final orientado a lectura útil y acción inmediata
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumReportPrintTemplate;
