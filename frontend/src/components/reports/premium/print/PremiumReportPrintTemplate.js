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

const PrintSection = ({ page, title, icon, children, noBorder = false }) => (
  <section
    className={`px-10 py-9 ${noBorder ? '' : 'border-b border-zinc-200'}`}
    style={{
      pageBreakInside: 'avoid',
      breakInside: 'avoid'
    }}
  >
    {(page || title) && (
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {icon}

          {title && (
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {title}
            </h2>
          )}
        </div>

        {page && (
          <div className="rounded-full border border-zinc-200 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            {page}
          </div>
        )}
      </div>
    )}

    {children}
  </section>
);

const PrintSnapshotCard = ({ eyebrow, value, accent = 'default' }) => {
  const accentMap = {
    teal: 'border-teal-200 bg-teal-50',
    amber: 'border-amber-200 bg-amber-50',
    violet: 'border-fuchsia-200 bg-fuchsia-50',
    default: 'border-zinc-200 bg-white'
  };

  const accentClass = accentMap[accent] || accentMap.default;

  return (
    <div
      className={`rounded-2xl border p-5 ${accentClass}`}
      style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid'
      }}
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {toSafeText(eyebrow)}
      </p>

      <p className="text-sm font-medium leading-6 text-zinc-950">
        {toSafeText(value)}
      </p>
    </div>
  );
};

const PrintSignalList = ({ title, items }) => (
  <div
    className="rounded-2xl border border-zinc-200 bg-white p-5"
    style={{
      pageBreakInside: 'avoid',
      breakInside: 'avoid'
    }}
  >
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
      {toSafeText(title)}
    </p>

    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${title}-${index}-${String(item).substring(0, 24)}`}
          className="flex items-start gap-2 text-sm leading-6 text-zinc-900"
        >
          <CheckCircle
            size={14}
            className="mt-1 flex-shrink-0 text-teal-700"
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
    <div className="-mx-10 -mt-9 border-b border-zinc-200 bg-[radial-gradient(circle_at_top_right,rgba(15,82,87,0.10),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f6f7f7_100%)] px-10 pb-9 pt-9">
      <div className="mb-8 flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            <Sparkle weight="fill" />
            {toSafeText(documentTitle)}
          </div>

          <h1 className="mb-3 text-[2.3rem] font-semibold leading-tight tracking-tight text-zinc-950">
            {REPORT_COPY.heroTitle}
          </h1>

          <p className="max-w-3xl text-base leading-7 text-zinc-700">
            {REPORT_COPY.heroDescription}
          </p>
        </div>

        <div className="w-[260px] shrink-0 rounded-2xl border border-zinc-200 bg-white px-5 py-5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {REPORT_COPY.documentLabel}
          </p>

          <p className="mb-4 font-semibold text-zinc-950">
            {toSafeText(brandName)}
          </p>

          <div className="space-y-2 text-sm text-zinc-700">
            <p>
              <span className="font-medium text-zinc-500">
                {REPORT_COPY.dateLabel}
              </span>{' '}
              {issueDate || 'Sin fecha'}
            </p>

            <p>
              <span className="font-medium text-zinc-500">
                {REPORT_COPY.routeLabel}
              </span>{' '}
              {routeLabel}
            </p>

            <p>
              <span className="font-medium text-zinc-500">
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
        className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5"
        style={{
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {REPORT_COPY.contextTitle}
        </p>

        <p className="break-words text-sm leading-6 text-zinc-950">
          {toSafeText(project.input_content)}
        </p>
      </div>

      {heroCards.length > 0 && (
        <div className={`grid gap-4 ${getGridClass(heroCards.length)}`}>
          {heroCards.map((card) => (
            <PrintSnapshotCard
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

const PrintSummarySection = ({ reportView, page }) => (
  <PrintSection
    page={page}
    title={REPORT_COPY.summaryTitle}
    icon={<DiamondsFour size={17} className="text-amber-600" weight="fill" />}
  >
    {reportView.executiveCards.length > 0 && (
      <div className="grid gap-4 md:grid-cols-2">
        {reportView.executiveCards.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-zinc-200 bg-white p-5"
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {item.label}
            </p>

            <p className="text-sm leading-6 text-zinc-950">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    )}

    {reportView.coreDiagnosisCards.length > 0 && (
      <div className={reportView.executiveCards.length > 0 ? 'mt-6' : ''}>
        <div className="mb-4 flex items-center gap-2">
          <Lightning size={17} className="text-teal-700" weight="fill" />

          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {REPORT_COPY.coreDiagnosisTitle}
          </h3>
        </div>

        <div className={`grid gap-4 ${getGridClass(reportView.coreDiagnosisCards.length)}`}>
          {reportView.coreDiagnosisCards.map((item) => {
            const accentClass =
              item.accent === 'teal'
                ? 'border-teal-200 bg-teal-50'
                : item.accent === 'amber'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-zinc-200 bg-white';

            return (
              <div
                key={item.key}
                className={`rounded-2xl border p-5 ${accentClass}`}
                style={{
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }}
              >
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {item.label}
                </p>

                <p className="text-sm font-medium leading-6 text-zinc-950">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </PrintSection>
);

const PrintDimensionsSection = ({ reportView, dimensionCounters, page }) => (
  <PrintSection
    page={page}
    title={REPORT_COPY.dimensionsTitle}
    icon={<Flag size={17} className="text-teal-700" weight="fill" />}
  >
    <div className="mb-5 flex flex-wrap gap-2">
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
        {dimensionCounters.strong} fuertes
      </span>

      <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
        {dimensionCounters.improvable} mejorables
      </span>

      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
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
            className="rounded-2xl border border-zinc-200 bg-white p-5"
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="font-semibold text-zinc-950">
                {dimension.label}
              </p>

              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-600">
                {statusMeta.label}
              </span>
            </div>

            <p className="mb-4 text-sm leading-6 text-zinc-700">
              {dimension.reading}
            </p>

            <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-medium text-zinc-600">
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
    icon={<CheckCircle size={17} className="text-teal-700" weight="fill" />}
  >
    {reportView.priorityActions.length > 0 && (
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {reportView.priorityActions.map((action, index) => {
          const intensityMeta =
            PRIORITY_META[action.intensity] || PRIORITY_META.medium;

          return (
            <div
              key={action.id || `${action.title}-${index}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5"
              style={{
                pageBreakInside: 'avoid',
                breakInside: 'avoid'
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-800">
                  {index + 1}
                </div>

                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-medium text-zinc-600">
                  {intensityMeta.label}
                </span>
              </div>

              <p className="mb-2 font-semibold text-zinc-950">
                {action.title}
              </p>

              {isMeaningfulText(action.why_it_matters) && (
                <p className="text-sm leading-6 text-zinc-700">
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
        className="rounded-2xl border border-zinc-200 bg-white p-5"
        style={{
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {REPORT_COPY.immediateActionTitle}
        </p>

        <p className="mb-2 font-semibold text-zinc-950">
          {reportView.immediateAction.title}
        </p>

        {isMeaningfulText(reportView.immediateAction.description) && (
          <p className="text-sm leading-6 text-zinc-700">
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
      icon={<Sparkle size={17} className="text-teal-700" weight="fill" />}
    >
      <div className={`grid gap-4 ${
        reportView.continuityRecommendation && signalGroups.length > 0
          ? 'lg:grid-cols-[1.05fr_0.95fr]'
          : 'grid-cols-1'
      }`}
      >
        {reportView.continuityRecommendation && continuityMeta && (
          <div
            className="rounded-2xl border border-teal-200 bg-teal-50 p-5"
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-teal-200 bg-white px-3 py-1 text-sm font-medium text-teal-800">
                {continuityMeta.label}
              </span>
            </div>

            {isMeaningfulText(reportView.continuityRecommendation.reason) && (
              <p className="mb-4 text-sm leading-6 text-zinc-950">
                {reportView.continuityRecommendation.reason}
              </p>
            )}

            {isMeaningfulText(reportView.continuityRecommendation.cta_label) && (
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {REPORT_COPY.continuityCtaTitle}
                </p>

                <p className="font-medium text-zinc-950">
                  {reportView.continuityRecommendation.cta_label}
                </p>
              </div>
            )}
          </div>
        )}

        {signalGroups.length > 0 && (
          <div
            className="rounded-2xl border border-zinc-200 bg-white p-5"
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {REPORT_COPY.signalsTitle}
            </p>

            <div className="grid gap-4">
              {signalGroups.map((group) => (
                <PrintSignalList
                  key={group.title}
                  title={group.title}
                  items={group.items}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {continuityMeta?.label && (
        <div
          className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-5"
          style={{
            pageBreakInside: 'avoid',
            breakInside: 'avoid'
          }}
        >
          <p className="text-sm leading-6 text-zinc-950">
            {reportView.continuityRecommendation ? (
              <>
                {REPORT_COPY.closingWithContinuity}{' '}
                <span className="font-semibold text-teal-800">
                  {continuityMeta.label}
                </span>.
              </>
            ) : (
              REPORT_COPY.closingWithoutContinuity
            )}
          </p>
        </div>
      )}
    </PrintSection>
  );
};

const PremiumReportPrintTemplate = ({
  project,
  brandName = 'Sistema Maestro',
  documentTitle = 'Informe Puntual',
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
      <div className="mx-auto max-w-[920px] rounded-2xl border border-zinc-200 bg-white p-8 text-zinc-950">
        {REPORT_COPY.emptyState}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[920px] bg-white text-zinc-950">
      <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <PrintHeroSection
          project={project}
          brandName={brandName}
          documentTitle={documentTitle}
          routeLabel={routeLabel}
          issueDate={issueDate}
          heroCards={heroCards}
          page={pageMap[REPORT_SECTION_KEYS.hero]}
        />

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
          <div className="border-t border-zinc-200 bg-zinc-50 px-10 py-5">
            <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <p className="text-zinc-700">
                {toSafeText(brandName)} - {REPORT_COPY.footerLeft}
              </p>

              <p className="text-zinc-500">
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