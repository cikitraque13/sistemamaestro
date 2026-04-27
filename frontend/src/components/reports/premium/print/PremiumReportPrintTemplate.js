import React, { useMemo } from 'react';
import {
  CheckCircle,
  DiamondsFour,
  Flag,
  Lightning,
  Sparkle
} from '@phosphor-icons/react';

import {
  DIMENSION_STATUS_META,
  PRIORITY_META,
  REPORT_BRAND_ASSETS,
  REPORT_COPY,
  REPORT_SECTION_KEYS
} from '../reportPremium.constants';

import {
  buildReportPremiumModel
} from '../reportPremiumViewModel';

import {
  getGridClass,
  isMeaningfulText,
  toSafeText
} from '../reportPremium.utils';

const goldText = 'text-amber-200';
const mutedText = 'text-zinc-400';
const bodyText = 'text-zinc-100';
const panelClass =
  'rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]';
const darkCardClass =
  'rounded-2xl border border-white/10 bg-black/25 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]';

const GoldLogoMark = ({ compact = false }) => (
  <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-amber-200/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_55%),linear-gradient(180deg,#17120B_0%,#050505_100%)] ${compact ? 'h-16 w-16' : 'h-24 w-24'}`}>
    <img
      src={REPORT_BRAND_ASSETS.goldLogo}
      alt={REPORT_BRAND_ASSETS.brandName}
      className="relative z-10 h-[88%] w-[88%] object-contain"
      draggable="false"
    />

    <div className="absolute inset-0 z-0 flex flex-col items-center justify-center">
      <span className={`font-semibold tracking-[0.14em] text-amber-300/70 ${compact ? 'text-sm' : 'text-xl'}`}>
        SM
      </span>
      <span className="mt-1 text-[8px] font-semibold tracking-[0.28em] text-amber-200/50">
        GOLD
      </span>
    </div>
  </div>
);

const PrintSection = ({ page, title, icon, children, noBorder = false }) => (
  <section
    className={`relative px-10 py-9 text-white ${noBorder ? '' : 'border-b border-white/10'}`}
    style={{
      pageBreakInside: 'avoid',
      breakInside: 'avoid',
      background:
        'radial-gradient(circle at top right, rgba(245, 158, 11, 0.09), transparent 28%), radial-gradient(circle at top left, rgba(15, 82, 87, 0.13), transparent 32%), linear-gradient(180deg, #090909 0%, #050505 100%)'
    }}
  >
    {(page || title) && (
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {icon}

          {title && (
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
              {title}
            </h2>
          )}
        </div>

        {page && (
          <div className="rounded-full border border-amber-200/20 bg-amber-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-100">
            {page}
          </div>
        )}
      </div>
    )}

    {children}
  </section>
);

const GoldInfoCard = ({ eyebrow, value, accent = 'default' }) => {
  const accentClass = {
    teal: 'border-teal-300/25 bg-teal-400/10',
    amber: 'border-amber-300/25 bg-amber-400/10',
    violet: 'border-fuchsia-300/20 bg-fuchsia-400/10',
    default: 'border-white/10 bg-white/[0.055]'
  }[accent] || 'border-white/10 bg-white/[0.055]';

  const eyebrowClass = {
    teal: 'text-teal-200',
    amber: 'text-amber-200',
    violet: 'text-fuchsia-200',
    default: 'text-zinc-400'
  }[accent] || 'text-zinc-400';

  return (
    <div
      className={`rounded-2xl border p-5 ${accentClass}`}
      style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid'
      }}
    >
      <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${eyebrowClass}`}>
        {toSafeText(eyebrow)}
      </p>

      <p className="text-sm font-medium leading-6 text-white">
        {toSafeText(value)}
      </p>
    </div>
  );
};

const GoldSignalList = ({ title, items }) => (
  <div
    className={`${darkCardClass} p-5`}
    style={{
      pageBreakInside: 'avoid',
      breakInside: 'avoid'
    }}
  >
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100">
      {toSafeText(title)}
    </p>

    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${title}-${index}-${String(item).substring(0, 24)}`}
          className="flex items-start gap-2 text-sm leading-6 text-zinc-100"
        >
          <CheckCircle
            size={14}
            className="mt-1 flex-shrink-0 text-teal-200"
          />

          <span>
            {toSafeText(item)}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const PrintHeroSection = ({
  project,
  brandName,
  documentTitle,
  routeLabel,
  issueDate,
  heroCards,
  page
}) => (
  <PrintSection page={page} noBorder>
    <div className="relative overflow-hidden rounded-[32px] border border-amber-200/15 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.20),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(15,82,87,0.18),transparent_34%),linear-gradient(180deg,#111111_0%,#050505_100%)] p-8">
      <div className="absolute right-[-120px] top-[-160px] h-[320px] w-[320px] rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute bottom-[-150px] left-[-120px] h-[300px] w-[300px] rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative z-10 mb-8 flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <div className="mb-7 flex items-center gap-5">
            <GoldLogoMark />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
                {REPORT_BRAND_ASSETS.brandName}
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
                <Sparkle weight="fill" />
                {toSafeText(documentTitle)}
              </div>
            </div>
          </div>

          <h1 className="mb-4 max-w-3xl text-[2.55rem] font-semibold leading-tight tracking-tight text-white">
            Informe Maestro Gold
          </h1>

          <p className="max-w-3xl text-base leading-7 text-zinc-200">
            Diagnostico inicial, blueprint de activacion y siguiente prompt recomendado
            para convertir esta lectura en un proyecto vivo dentro de Sistema Maestro Builder.
          </p>
        </div>

        <div className="w-[270px] shrink-0 rounded-2xl border border-white/10 bg-black/25 px-5 py-5">
          <p className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
            {REPORT_COPY.documentLabel}
          </p>

          <p className="mb-4 font-semibold text-white">
            {toSafeText(brandName)}
          </p>

          <div className="space-y-2 text-sm text-zinc-200">
            <p>
              <span className="font-medium text-zinc-400">
                {REPORT_COPY.dateLabel}
              </span>{' '}
              {issueDate || 'Sin fecha'}
            </p>

            <p>
              <span className="font-medium text-zinc-400">
                {REPORT_COPY.routeLabel}
              </span>{' '}
              {routeLabel}
            </p>

            <p>
              <span className="font-medium text-zinc-400">
                {REPORT_COPY.inputLabel}
              </span>{' '}
              {project.input_type === 'url'
                ? REPORT_COPY.inputUrlLabel
                : REPORT_COPY.inputDescriptionLabel}
            </p>
          </div>
        </div>
      </div>

      <div
        className="relative z-10 mb-6 rounded-2xl border border-white/10 bg-black/30 p-5"
        style={{
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {REPORT_COPY.contextTitle}
        </p>

        <p className="break-words text-sm leading-6 text-white">
          {toSafeText(project.input_content)}
        </p>
      </div>

      {heroCards.length > 0 && (
        <div className={`relative z-10 grid gap-4 ${getGridClass(heroCards.length)}`}>
          {heroCards.map((card) => (
            <GoldInfoCard
              key={`${card.eyebrow}-${String(card.value).substring(0, 24)}`}
              eyebrow={card.eyebrow}
              value={card.value}
              accent={card.accent}
            />
          ))}
        </div>
      )}
    </div>
  </PrintSection>
);

const PrintActivationBlueprintSection = ({ page }) => (
  <PrintSection
    page={page}
    title="Blueprint de activacion"
    icon={<Sparkle size={17} className="text-amber-200" weight="fill" />}
  >
    <div
      className={`${panelClass} p-6`}
      style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid'
      }}
    >
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
          Entrada al sistema
        </p>

        <h3 className="text-2xl font-semibold tracking-tight text-white">
          Tu lectura ya esta preparada para construir
        </h3>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
          Este informe no esta pensado para quedarse como documento estatico.
          Su funcion es darte una base clara para entrar en Builder con direccion,
          criterio y un primer prompt mejor orientado.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: '1. Punto de partida',
            text: 'El informe ordena el caso, detecta friccion principal y separa lo urgente de lo accesorio.'
          },
          {
            title: '2. Activacion',
            text: 'Builder convierte esta lectura en una primera version visible con preview, estructura y codigo.'
          },
          {
            title: '3. Maduracion',
            text: 'El chat propone mejoras sucesivas para llevar el proyecto hasta una salida mas completa.'
          }
        ].map((item) => (
          <div key={item.title} className={`${darkCardClass} p-5`}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100">
              {item.title}
            </p>

            <p className="text-sm leading-6 text-zinc-100">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.13)_0%,rgba(0,0,0,0.35)_100%)] p-5 text-white">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
          Prompt recomendado para empezar
        </p>

        <p className="text-sm leading-6 text-zinc-100">
          Quiero construir este proyecto a partir del diagnostico inicial. Usa la lectura del informe
          como punto de partida, crea una primera version visible, ordena la estructura principal,
          define el CTA prioritario y proponme la siguiente mejora exacta.
        </p>
      </div>
    </div>
  </PrintSection>
);

const PrintSummarySection = ({ reportView, page }) => (
  <PrintSection
    page={page}
    title={REPORT_COPY.summaryTitle}
    icon={<DiamondsFour size={17} className="text-amber-200" weight="fill" />}
  >
    {reportView.executiveCards.length > 0 && (
      <div className="grid gap-4 md:grid-cols-2">
        {reportView.executiveCards.map((item) => (
          <GoldInfoCard
            key={item.key}
            eyebrow={item.label}
            value={item.value}
            accent="default"
          />
        ))}
      </div>
    )}

    {reportView.coreDiagnosisCards.length > 0 && (
      <div className={reportView.executiveCards.length > 0 ? 'mt-6' : ''}>
        <div className="mb-4 flex items-center gap-2">
          <Lightning size={17} className="text-teal-200" weight="fill" />

          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300">
            {REPORT_COPY.coreDiagnosisTitle}
          </h3>
        </div>

        <div className={`grid gap-4 ${getGridClass(reportView.coreDiagnosisCards.length)}`}>
          {reportView.coreDiagnosisCards.map((item) => (
            <GoldInfoCard
              key={item.key}
              eyebrow={item.label}
              value={item.value}
              accent={item.accent}
            />
          ))}
        </div>
      </div>
    )}
  </PrintSection>
);

const PrintDimensionsSection = ({ reportView, dimensionCounters, page }) => (
  <PrintSection
    page={page}
    title={REPORT_COPY.dimensionsTitle}
    icon={<Flag size={17} className="text-teal-200" weight="fill" />}
  >
    <div className="mb-5 flex flex-wrap gap-2">
      <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
        {dimensionCounters.strong} fuertes
      </span>

      <span className="rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
        {dimensionCounters.improvable} mejorables
      </span>

      <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
        {dimensionCounters.priority} prioritarias
      </span>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      {reportView.dimensionReview.map((dimension, index) => {
        const statusMeta =
          DIMENSION_STATUS_META[dimension.status] || DIMENSION_STATUS_META.improvable;
        const priorityMeta =
          PRIORITY_META[dimension.priority] || PRIORITY_META.medium;

        return (
          <div
            key={`${dimension.id}-${index}`}
            className={`${darkCardClass} p-5`}
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="font-semibold text-white">
                {dimension.label}
              </p>

              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-zinc-200">
                {statusMeta.label}
              </span>
            </div>

            <p className="mb-4 text-sm leading-6 text-zinc-300">
              {dimension.reading}
            </p>

            <span className="inline-flex rounded-full border border-amber-200/15 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-100">
              Prioridad {priorityMeta.label.toLowerCase()}
            </span>
          </div>
        );
      })}
    </div>
  </PrintSection>
);

const PrintActionsSection = ({ reportView, page }) => (
  <PrintSection
    page={page}
    title={REPORT_COPY.actionsTitle}
    icon={<CheckCircle size={17} className="text-teal-200" weight="fill" />}
  >
    {reportView.priorityActions.length > 0 && (
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {reportView.priorityActions.map((action, index) => {
          const intensityMeta =
            PRIORITY_META[action.intensity] || PRIORITY_META.medium;

          return (
            <div
              key={action.id || `${action.title}-${index}`}
              className={`${darkCardClass} p-5`}
              style={{
                pageBreakInside: 'avoid',
                breakInside: 'avoid'
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-400/10 text-sm font-semibold text-teal-100">
                  {index + 1}
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-zinc-200">
                  {intensityMeta.label}
                </span>
              </div>

              <p className="mb-2 font-semibold text-white">
                {action.title}
              </p>

              {isMeaningfulText(action.why_it_matters) && (
                <p className="text-sm leading-6 text-zinc-300">
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
        className={`${panelClass} p-5`}
        style={{
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100">
          {REPORT_COPY.immediateActionTitle}
        </p>

        <p className="mb-2 font-semibold text-white">
          {reportView.immediateAction.title}
        </p>

        {isMeaningfulText(reportView.immediateAction.description) && (
          <p className="text-sm leading-6 text-zinc-300">
            {reportView.immediateAction.description}
          </p>
        )}
      </div>
    )}
  </PrintSection>
);

const PrintClosingSection = ({
  reportView,
  signalGroups,
  continuityMeta,
  page
}) => {
  const sectionTitle =
    reportView.continuityRecommendation && signalGroups.length > 0
      ? REPORT_COPY.continuityAndSignalsTitle
      : reportView.continuityRecommendation
        ? REPORT_COPY.continuityTitle
        : REPORT_COPY.signalsTitle;

  return (
    <PrintSection
      page={page}
      title={sectionTitle}
      icon={<Sparkle size={17} className="text-amber-200" weight="fill" />}
    >
      <div className={`grid gap-4 ${
        reportView.continuityRecommendation && signalGroups.length > 0
          ? 'lg:grid-cols-[1.05fr_0.95fr]'
          : 'grid-cols-1'
      }`}
      >
        {reportView.continuityRecommendation && continuityMeta && (
          <div
            className="rounded-2xl border border-teal-300/25 bg-teal-400/10 p-5"
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-teal-300/25 bg-black/20 px-3 py-1 text-sm font-medium text-teal-100">
                {continuityMeta.label}
              </span>
            </div>

            {isMeaningfulText(reportView.continuityRecommendation.reason) && (
              <p className="mb-4 text-sm leading-6 text-white">
                {reportView.continuityRecommendation.reason}
              </p>
            )}

            {isMeaningfulText(reportView.continuityRecommendation.cta_label) && (
              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  {REPORT_COPY.continuityCtaTitle}
                </p>

                <p className="font-medium text-white">
                  {reportView.continuityRecommendation.cta_label}
                </p>
              </div>
            )}
          </div>
        )}

        {signalGroups.length > 0 && (
          <div
            className={`${darkCardClass} p-5`}
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300">
              {REPORT_COPY.signalsTitle}
            </p>

            <div className="grid gap-4">
              {signalGroups.map((group) => (
                <GoldSignalList
                  key={group.title}
                  title={group.title}
                  items={group.items}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="mt-6 rounded-2xl border border-amber-200/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.14)_0%,rgba(0,0,0,0.35)_100%)] px-5 py-5 text-white"
        style={{
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100">
          {REPORT_COPY.builderNextStepTitle}
        </p>

        <p className="text-sm leading-6 text-zinc-100">
          {REPORT_COPY.builderNextStepDescription}
        </p>
      </div>
    </PrintSection>
  );
};

const PremiumReportPrintTemplate = ({
  project,
  brandName = REPORT_BRAND_ASSETS.brandName,
  documentTitle = 'Informe Maestro Gold',
  showSystemFooter = true
}) => {
  const model = useMemo(() => buildReportPremiumModel(project), [project]);

  const {
    reportView,
    routeLabel,
    issueDate,
    dimensionCounters,
    continuityMeta,
    heroCards,
    signalGroups,
    visibleSections,
    pageMap
  } = model;

  if (!project || !reportView) {
    return (
      <div className="mx-auto max-w-[920px] rounded-2xl border border-white/10 bg-[#090909] p-8 text-white">
        {REPORT_COPY.emptyState}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[920px] bg-[#050505] text-white">
      <div className="overflow-hidden rounded-[28px] border border-amber-200/10 bg-[#050505] shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <PrintHeroSection
          project={project}
          brandName={brandName}
          documentTitle={documentTitle}
          routeLabel={routeLabel}
          issueDate={issueDate}
          heroCards={heroCards}
          page={pageMap[REPORT_SECTION_KEYS.hero]}
        />

        <PrintActivationBlueprintSection page="Activacion" />

        {visibleSections.includes(REPORT_SECTION_KEYS.summary) && (
          <PrintSummarySection
            reportView={reportView}
            page={pageMap[REPORT_SECTION_KEYS.summary]}
          />
        )}

        {visibleSections.includes(REPORT_SECTION_KEYS.dimensions) && (
          <PrintDimensionsSection
            reportView={reportView}
            dimensionCounters={dimensionCounters}
            page={pageMap[REPORT_SECTION_KEYS.dimensions]}
          />
        )}

        {visibleSections.includes(REPORT_SECTION_KEYS.actions) && (
          <PrintActionsSection
            reportView={reportView}
            page={pageMap[REPORT_SECTION_KEYS.actions]}
          />
        )}

        {visibleSections.includes(REPORT_SECTION_KEYS.closing) && (
          <PrintClosingSection
            reportView={reportView}
            signalGroups={signalGroups}
            continuityMeta={continuityMeta}
            page={pageMap[REPORT_SECTION_KEYS.closing]}
          />
        )}

        {showSystemFooter && (
          <div className="border-t border-white/10 bg-black px-10 py-5 text-white">
            <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <p className="text-zinc-200">
                {toSafeText(brandName)} - {REPORT_COPY.footerLeft}
              </p>

              <p className="text-zinc-400">
                {REPORT_COPY.footerRight}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumReportPrintTemplate;