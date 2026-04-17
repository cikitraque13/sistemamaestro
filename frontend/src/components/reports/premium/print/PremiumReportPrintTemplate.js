import React, { useMemo } from 'react';
import {
  CheckCircle,
  DiamondsFour,
  Flag,
  FileText,
  Lightning,
  Sparkle,
  ArrowRight
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
    'mejora', 'oportunidad', 'accion', 'comercial'
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

const PrintSection = ({ label, title, icon, children, noBorder = false }) => (
  <section
    className={`print-section px-8 py-8 sm:px-10 sm:py-9 ${noBorder ? '' : 'border-t border-slate-200'}`}
    style={{ pageBreakInside: 'avoid' }}
  >
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

    {children}
  </section>
);

const SummaryCard = ({ eyebrow, value, tone = 'default' }) => {
  const toneMap = {
    teal: 'border-teal-200 bg-teal-50',
    amber: 'border-amber-200 bg-amber-50',
    slate: 'border-slate-200 bg-slate-50',
    default: 'border-slate-200 bg-white'
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${toneMap[tone] || toneMap.default}`}
      style={{ pageBreakInside: 'avoid' }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
        {eyebrow}
      </p>
      <p className="text-slate-900 leading-relaxed">{value}</p>
    </div>
  );
};

const BulletList = ({ title, items }) => (
  <div
    className="rounded-2xl border border-slate-200 bg-white p-5"
    style={{ pageBreakInside: 'avoid' }}
  >
    <p className="text-sm font-medium text-slate-700 mb-3">{title}</p>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${title}-${index}-${String(item).substring(0, 20)}`}
          className="text-slate-700 text-sm flex items-start gap-2"
        >
          <CheckCircle size={14} className="text-teal-600 mt-1 flex-shrink-0" weight="fill" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const normalizePrintView = (project) => {
  const diagnosis = project?.diagnosis;
  if (!diagnosis) return null;

  const strengths = ensureArray(diagnosis.strengths);
  const weaknesses = ensureArray(diagnosis.weaknesses);
  const quickWins = ensureArray(diagnosis.quick_wins);
  const rawPriorityActions = ensureArray(diagnosis.priority_actions);

  const executiveSummaryRaw =
    diagnosis.executive_summary && typeof diagnosis.executive_summary === 'object'
      ? diagnosis.executive_summary
      : {};

  const coreDiagnosisRaw =
    diagnosis.core_diagnosis && typeof diagnosis.core_diagnosis === 'object'
      ? diagnosis.core_diagnosis
      : {};

  const immediateActionRaw =
    diagnosis.immediate_action && typeof diagnosis.immediate_action === 'object'
      ? diagnosis.immediate_action
      : null;

  const understanding =
    diagnosis.understanding ||
    diagnosis.summary ||
    executiveSummaryRaw.understanding ||
    '';

  const tension =
    executiveSummaryRaw.main_tension ||
    weaknesses[0] ||
    '';

  const commercialImportance =
    executiveSummaryRaw.commercial_importance ||
    '';

  const executiveConclusion =
    executiveSummaryRaw.bottom_line ||
    quickWins[0] ||
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

  const executiveBlocks = dedupeKeyValueBlocks([
    { key: 'understanding', label: 'Comprensión del caso', value: understanding },
    { key: 'tension', label: 'Tensión principal', value: tension },
    { key: 'importance', label: 'Por qué importa', value: commercialImportance },
    { key: 'conclusion', label: 'Lectura más útil', value: executiveConclusion }
  ], 4);

  const focusBlocks = dedupeKeyValueBlocks([
    { key: 'finding', label: 'Hallazgo principal', value: mainFinding, tone: 'teal' },
    { key: 'weakness', label: 'Debilidad detectada', value: mainWeakness, tone: 'slate' },
    { key: 'leverage', label: 'Primer foco de mejora', value: mainLeverage, tone: 'amber' }
  ], 3);

  const priorityActions = rawPriorityActions
    .filter((action) => action && typeof action === 'object')
    .filter((action) => isMeaningfulText(action.title) || isMeaningfulText(action.why_it_matters))
    .filter((action, index, list) =>
      list.findIndex((candidate) => {
        const sameTitle = areTooSimilar(candidate.title, action.title);
        const sameWhy = areTooSimilar(candidate.why_it_matters, action.why_it_matters);
        return sameTitle || sameWhy;
      }) === index
    )
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
  } else if (quickWins.length > 0 && isMeaningfulText(quickWins[0])) {
    immediateAction = {
      title: 'Aplicar quick win prioritario',
      description: quickWins[0]
    };
  }

  const avoidSignals = [
    ...executiveBlocks.map((item) => item.value),
    ...focusBlocks.map((item) => item.value),
    immediateAction?.title || '',
    immediateAction?.description || ''
  ];

  const filteredStrengths = dedupeTexts(strengths, avoidSignals, 2);
  const filteredWeaknesses = dedupeTexts(weaknesses, avoidSignals, 2);
  const filteredQuickWins = dedupeTexts(quickWins, avoidSignals, 3);

  const promptContext = dedupeTexts([
    understanding,
    mainFinding,
    mainWeakness,
    mainLeverage,
    immediateAction?.description || '',
    executiveConclusion
  ], [], 4);

  return {
    executiveBlocks,
    focusBlocks,
    priorityActions,
    immediateAction,
    strengths: filteredStrengths,
    weaknesses: filteredWeaknesses,
    quickWins: filteredQuickWins,
    promptContext
  };
};

const buildAdvancePrompt = ({ project, routeLabel, view }) => {
  const contextLines = view.promptContext
    .filter(isMeaningfulText)
    .slice(0, 4)
    .map((line) => `- ${line}`);

  const immediateTitle = isMeaningfulText(view.immediateAction?.title)
    ? view.immediateAction.title
    : 'No definido todavía';

  const prompt = [
    `Actúa como consultor estratégico senior y ayúdame a avanzar este caso sin dispersión.`,
    ``,
    `CONTEXTO`,
    `- Tipo de entrada: ${project?.input_type === 'url' ? 'URL' : 'Idea / descripción'}`,
    `- Ruta del sistema: ${routeLabel}`,
    `- Caso analizado: ${project?.input_content || 'Sin contexto visible'}`,
    ``,
    `VALIDACIÓN PUNTUAL YA REALIZADA`,
    ...contextLines,
    ``,
    `PRIMER FOCO DE MEJORA`,
    `- ${immediateTitle}`,
    ``,
    `LO QUE NECESITO AHORA`,
    `1. Reformula el problema central en una frase clara.`,
    `2. Indica qué debería tocar primero y por qué.`,
    `3. Dame una secuencia de 3 pasos concretos y ordenados para avanzar.`,
    `4. Señala qué error debería evitar para no perder tiempo ni valor.`,
    ``,
    `RESPUESTA PEDIDA`,
    `- clara`,
    `- priorizada`,
    `- sin relleno`,
    `- orientada a acción`
  ].join('\n');

  return prompt;
};

const PremiumReportPrintTemplate = ({
  project,
  brandName = 'Sistema Maestro',
  documentTitle = 'Validación puntual exportable',
  showSystemFooter = true
}) => {
  const view = useMemo(() => normalizePrintView(project), [project]);

  const routeLabel = ROUTE_NAMES[project?.route] || project?.route || 'Sin clasificar';
  const issueDate = formatDate(project?.created_at);

  const pageLabels = {
    hero: 'Página 1',
    reading: 'Página 2',
    focus: 'Página 3',
    actions: 'Página 4',
    prompt: 'Página 5',
    closing: 'Página 6'
  };

  const promptText = useMemo(() => {
    if (!project || !view) return '';
    return buildAdvancePrompt({ project, routeLabel, view });
  }, [project, routeLabel, view]);

  if (!project || !view) {
    return (
      <div className="max-w-[920px] mx-auto rounded-2xl border border-slate-200 bg-white p-8 text-slate-800">
        No hay datos suficientes para renderizar el documento.
      </div>
    );
  }

  return (
    <div className="max-w-[920px] mx-auto">
      <style>{`
        @media print {
          .print-document-shell {
            background: #ffffff !important;
            color: #0f172a !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            max-width: none !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          .print-section,
          .print-card,
          .print-soft-card,
          .print-prompt-box,
          .print-footer-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="print-document-shell bg-white text-slate-900 rounded-[28px] overflow-hidden border border-slate-200 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
        <PrintSection
          label={pageLabels.hero}
          title="Validación puntual"
          icon={<Sparkle size={18} className="text-teal-600" weight="fill" />}
          noBorder
        >
          <div className="pb-8 border-b border-slate-200 -mx-8 -mt-8 px-8 pt-8 sm:-mx-10 sm:-mt-9 sm:px-10 sm:pt-9 bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)]">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-sm font-medium mb-4">
                  <FileText size={14} weight="fill" />
                  {documentTitle}
                </div>

                <h1 className="text-3xl sm:text-[2.2rem] font-semibold text-slate-900 mb-3 leading-tight">
                  Validación puntual exportable
                </h1>

                <p className="text-slate-600 max-w-3xl leading-relaxed">
                  Documento breve y accionable con lectura más útil del caso, primer foco de mejora
                  y prompt de avance para continuar sin fricción.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 min-w-[260px]">
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
              className="rounded-2xl border border-slate-200 bg-white p-5 mb-6"
              style={{ pageBreakInside: 'avoid' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
                Contexto analizado
              </p>
              <p className="text-slate-800 leading-relaxed break-words">{project.input_content}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {view.focusBlocks.map((item) => (
                <SummaryCard
                  key={item.key}
                  eyebrow={item.label}
                  value={item.value}
                  tone={item.tone}
                />
              ))}
            </div>
          </div>
        </PrintSection>

        <PrintSection
          label={pageLabels.reading}
          title="Lectura más útil"
          icon={<DiamondsFour size={18} className="text-amber-600" weight="fill" />}
        >
          <div className="grid md:grid-cols-2 gap-4">
            {view.executiveBlocks.map((item) => (
              <div
                key={item.key}
                className="print-soft-card rounded-2xl border border-slate-200 bg-white p-5"
                style={{ pageBreakInside: 'avoid' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
                  {item.label}
                </p>
                <p className="text-slate-800 leading-relaxed">{item.value}</p>
              </div>
            ))}
          </div>
        </PrintSection>

        <PrintSection
          label={pageLabels.focus}
          title="Primer foco de mejora"
          icon={<Flag size={18} className="text-teal-600" weight="fill" />}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {view.focusBlocks.map((item) => (
              <div
                key={`focus-${item.key}`}
                className={`print-card rounded-2xl border p-5 ${
                  item.tone === 'teal'
                    ? 'border-teal-200 bg-teal-50'
                    : item.tone === 'amber'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-slate-200 bg-slate-50'
                }`}
                style={{ pageBreakInside: 'avoid' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
                  {item.label}
                </p>
                <p className="text-slate-900 font-medium leading-relaxed">{item.value}</p>
              </div>
            ))}
          </div>

          {view.immediateAction && (
            <div
              className="print-soft-card rounded-2xl border border-slate-200 bg-slate-50 p-5 mt-6"
              style={{ pageBreakInside: 'avoid' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
                Acción inmediata recomendada
              </p>
              <p className="text-slate-900 font-medium mb-2">{view.immediateAction.title}</p>
              {isMeaningfulText(view.immediateAction.description) && (
                <p className="text-slate-700 leading-relaxed">
                  {view.immediateAction.description}
                </p>
              )}
            </div>
          )}
        </PrintSection>

        <PrintSection
          label={pageLabels.actions}
          title="Acciones iniciales"
          icon={<CheckCircle size={18} className="text-teal-600" weight="fill" />}
        >
          {view.priorityActions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {view.priorityActions.map((action, index) => (
                <div
                  key={action.id || `${action.title}-${index}`}
                  className="print-card rounded-2xl border border-slate-200 bg-white p-5"
                  style={{ pageBreakInside: 'avoid' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <p className="text-slate-900 font-medium">{action.title}</p>
                  </div>

                  {isMeaningfulText(action.why_it_matters) && (
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {action.why_it_matters}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="print-soft-card rounded-2xl border border-slate-200 bg-slate-50 p-5"
              style={{ pageBreakInside: 'avoid' }}
            >
              <p className="text-slate-700 leading-relaxed">
                No hay una secuencia amplia cargada todavía, pero ya puedes avanzar con el foco principal
                y el prompt de avance de este documento.
              </p>
            </div>
          )}
        </PrintSection>

        <PrintSection
          label={pageLabels.prompt}
          title="Prompt de avance"
          icon={<Lightning size={18} className="text-amber-600" weight="fill" />}
        >
          <div
            className="print-prompt-box rounded-2xl border border-slate-200 bg-slate-50 p-5"
            style={{ pageBreakInside: 'avoid' }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
              Úsalo para seguir avanzando
            </p>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 overflow-x-auto">
              <pre className="text-[13px] leading-relaxed text-slate-800 whitespace-pre-wrap font-mono">
                {promptText}
              </pre>
            </div>
          </div>
        </PrintSection>

        <PrintSection
          label={pageLabels.closing}
          title="Cierre"
          icon={<ArrowRight size={18} className="text-teal-600" weight="fill" />}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {view.strengths.length > 0 && (
              <BulletList title="Fortalezas detectadas" items={view.strengths} />
            )}

            {view.weaknesses.length > 0 && (
              <BulletList title="Debilidades detectadas" items={view.weaknesses} />
            )}

            {view.quickWins.length > 0 && (
              <BulletList title="Quick wins iniciales" items={view.quickWins} />
            )}
          </div>

          <div
            className="print-footer-card rounded-2xl border border-slate-200 bg-white px-5 py-5 mt-6"
            style={{ pageBreakInside: 'avoid' }}
          >
            <p className="text-slate-800 leading-relaxed">
              Esta validación puntual te da una lectura más útil del caso, un primer foco de mejora
              y un prompt de avance para seguir sin dispersión. El objetivo de este documento no es
              sustituir una capa superior, sino ayudarte a tomar el siguiente paso correcto con más claridad.
            </p>
          </div>
        </PrintSection>

        {showSystemFooter && (
          <div className="px-8 py-5 sm:px-10 border-t border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
              <p className="text-slate-700">
                {brandName} · Validación puntual exportable
              </p>
              <p className="text-slate-500">
                Documento breve, útil y preparado para guardado en PDF
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumReportPrintTemplate;
