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

const ReportSection = ({ page, title, icon, children, noBorder = false }) => (
  <section
    className={`px-8 py-8 sm:px-10 sm:py-9 ${noBorder ? '' : 'border-b border-white/5'}`}
    style={{ pageBreakInside: 'avoid' }}
  >
    {(page || title) && (
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {icon}

          {title && (
            <h2 className="text-sm uppercase tracking-wide text-[#A3A3A3]">
              {title}
            </h2>
          )}
        </div>

        {page && (
          <div className="inline-flex self-start rounded-full border border-white/5 bg-[#141414] px-3 py-1 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
            {page}
          </div>
        )}
      </div>
    )}

    {children}
  </section>
);

const SnapshotCard = ({ eyebrow, value, accent = 'default' }) => {
  const accentMap = {
    teal: 'border-[#0F5257]/20 bg-[#0F5257]/10 text-[#8DE1D0]',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    violet: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300',
    default: 'border-white/5 bg-[#0A0A0A] text-white'
  };

  const accentClass = accentMap[accent] || accentMap.default;

  return (
    <div
      className={`rounded-xl border p-5 ${accentClass}`}
      style={{ pageBreakInside: 'avoid' }}
    >
      <p className="mb-2 text-[11px] uppercase tracking-wide opacity-80">
        {toSafeText(eyebrow)}
      </p>

      <p className="font-medium leading-relaxed text-white">
        {toSafeText(value)}
      </p>
    </div>
  );
};

const SignalList = ({ title, items }) => (
  <div
    className="rounded-xl border border-white/5 bg-[#0A0A0A] p-4"
    style={{ pageBreakInside: 'avoid' }}
  >
    <p className="mb-3 text-sm text-[#A3A3A3]">
      {toSafeText(title)}
    </p>

    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${title}-${index}-${String(item).substring(0, 24)}`}
          className="flex items-start gap-2 text-sm text-white"
        >
          <CheckCircle
            size={14}
            className="mt-1 flex-shrink-0 text-[#0F5257]"
          />

          <span>
            {toSafeText(item)}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const HeroSection = ({
  project,
  brandName,
  documentTitle,
  routeLabel,
  issueDate,
  heroCards,
  page
}) => (
  <ReportSection page={page} noBorder>
    <div className="-mx-8 -mt-8 border-b border-white/5 bg-[radial-gradient(circle_at_top_right,rgba(15,82,87,0.16),transparent_35%)] px-8 pb-8 pt-8 sm:-mx-10 sm:-mt-9 sm:px-10 sm:pt-9">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#0F5257]/15 px-3 py-1 text-sm font-medium text-[#8DE1D0]">
            <Sparkle weight="fill" />
            {toSafeText(documentTitle)}
          </div>

          <h1 className="mb-3 text-3xl font-light leading-tight text-white sm:text-[2.3rem]">
            {REPORT_COPY.heroTitle}
          </h1>

          <p className="max-w-3xl leading-relaxed text-[#CFCFCF]">
            {REPORT_COPY.heroDescription}
          </p>
        </div>

        <div className="min-w-[260px] rounded-2xl border border-white/5 bg-[#111111] px-5 py-5">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
            {REPORT_COPY.documentLabel}
          </p>

          <p className="mb-3 font-medium text-white">
            {toSafeText(brandName)}
          </p>

          <div className="space-y-2 text-sm">
            <p className="text-[#D4D4D4]">
              <span className="text-[#A3A3A3]">
                {REPORT_COPY.dateLabel}
              </span>{' '}
              {issueDate || 'Sin fecha'}
            </p>

            <p className="text-[#D4D4D4]">
              <span className="text-[#A3A3A3]">
                {REPORT_COPY.routeLabel}
              </span>{' '}
              {routeLabel}
            </p>

            <p className="text-[#D4D4D4]">
              <span className="text-[#A3A3A3]">
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
        className="mb-6 rounded-2xl border border-white/5 bg-[#0A0A0A] p-5"
        style={{ pageBreakInside: 'avoid' }}
      >
        <p className="mb-2 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
          {REPORT_COPY.contextTitle}
        </p>

        <p className="break-words leading-relaxed text-white">
          {toSafeText(project.input_content)}
        </p>
      </div>

      {heroCards.length > 0 && (
        <div className={`grid gap-4 ${getGridClass(heroCards.length)}`}>
          {heroCards.map((card) => (
            <SnapshotCard
              key={`${card.eyebrow}-${String(card.value).substring(0, 24)}`}
              eyebrow={card.eyebrow}
              value={card.value}
              accent={card.accent}
            />
          ))}
        </div>
      )}
    </div>
  </ReportSection>
);

const SummarySection = ({ reportView, page }) => (
  <ReportSection
    page={page}
    title={REPORT_COPY.summaryTitle}
    icon={<DiamondsFour size={18} className="text-amber-300" weight="fill" />}
  >
    {reportView.executiveCards.length > 0 && (
      <div className="grid gap-4 md:grid-cols-2">
        {reportView.executiveCards.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-white/5 bg-[#0A0A0A] p-5"
          >
            <p className="mb-2 text-xs uppercase tracking-wide text-[#A3A3A3]">
              {item.label}
            </p>

            <p className="text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    )}

    {reportView.coreDiagnosisCards.length > 0 && (
      <div className={reportView.executiveCards.length > 0 ? 'mt-6' : ''}>
        <div className="mb-4 flex items-center gap-2">
          <Lightning size={18} className="text-[#8DE1D0]" weight="fill" />

          <h3 className="text-sm uppercase tracking-wide text-[#A3A3A3]">
            {REPORT_COPY.coreDiagnosisTitle}
          </h3>
        </div>

        <div className={`grid gap-4 ${getGridClass(reportView.coreDiagnosisCards.length)}`}>
          {reportView.coreDiagnosisCards.map((item) => {
            const accentClass =
              item.accent === 'teal'
                ? 'border-[#0F5257]/20 bg-[#0F5257]/10'
                : item.accent === 'amber'
                  ? 'border-amber-500/20 bg-amber-500/10'
                  : 'border-white/5 bg-[#0A0A0A]';

            const eyebrowClass =
              item.accent === 'teal'
                ? 'text-[#8DE1D0]'
                : item.accent === 'amber'
                  ? 'text-amber-300'
                  : 'text-[#A3A3A3]';

            return (
              <div
                key={item.key}
                className={`rounded-xl border p-5 ${accentClass}`}
              >
                <p className={`mb-2 text-xs uppercase tracking-wide ${eyebrowClass}`}>
                  {item.label}
                </p>

                <p className="font-medium text-white">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </ReportSection>
);

const DimensionsSection = ({ reportView, dimensionCounters, page }) => (
  <ReportSection
    page={page}
    title={REPORT_COPY.dimensionsTitle}
    icon={<Flag size={18} className="text-[#8DE1D0]" weight="fill" />}
  >
    <div className="mb-4 flex flex-wrap gap-2">
      <span className={`rounded-full px-3 py-1 text-xs ${DIMENSION_STATUS_META.strong.badgeClass}`}>
        {dimensionCounters.strong} fuertes
      </span>

      <span className={`rounded-full px-3 py-1 text-xs ${DIMENSION_STATUS_META.improvable.badgeClass}`}>
        {dimensionCounters.improvable} mejorables
      </span>

      <span className={`rounded-full px-3 py-1 text-xs ${DIMENSION_STATUS_META.priority.badgeClass}`}>
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
            className={`rounded-xl border p-4 ${statusMeta.cardClass}`}
            style={{ pageBreakInside: 'avoid' }}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="font-medium text-white">
                {dimension.label}
              </p>

              <span className={`rounded-full px-2 py-1 text-[11px] ${statusMeta.badgeClass}`}>
                {statusMeta.label}
              </span>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-[#D4D4D4]">
              {dimension.reading}
            </p>

            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] ${priorityMeta.badgeClass}`}>
              Prioridad {priorityMeta.label.toLowerCase()}
            </span>
          </div>
        );
      })}
    </div>
  </ReportSection>
);

const ActionsSection = ({ reportView, page }) => (
  <ReportSection
    page={page}
    title={REPORT_COPY.actionsTitle}
    icon={<CheckCircle size={18} className="text-[#8DE1D0]" weight="fill" />}
  >
    {reportView.priorityActions.length > 0 && (
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {reportView.priorityActions.map((action, index) => {
          const intensityMeta =
            PRIORITY_META[action.intensity] || PRIORITY_META.medium;

          return (
            <div
              key={action.id || `${action.title}-${index}`}
              className="rounded-xl border border-white/5 bg-[#0A0A0A] p-5"
              style={{ pageBreakInside: 'avoid' }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F5257]/15 text-sm font-medium text-[#8DE1D0]">
                  {index + 1}
                </div>

                <span className={`rounded-full px-2.5 py-1 text-[11px] ${intensityMeta.badgeClass}`}>
                  {intensityMeta.label}
                </span>
              </div>

              <p className="mb-2 font-medium text-white">
                {action.title}
              </p>

              {isMeaningfulText(action.why_it_matters) && (
                <p className="text-sm leading-relaxed text-[#D4D4D4]">
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
        className="rounded-xl border border-white/5 bg-[#0A0A0A] p-5"
        style={{ pageBreakInside: 'avoid' }}
      >
        <p className="mb-3 text-sm uppercase tracking-wide text-[#A3A3A3]">
          {REPORT_COPY.immediateActionTitle}
        </p>

        <p className="mb-2 font-medium text-white">
          {reportView.immediateAction.title}
        </p>

        {isMeaningfulText(reportView.immediateAction.description) && (
          <p className="leading-relaxed text-[#D4D4D4]">
            {reportView.immediateAction.description}
          </p>
        )}
      </div>
    )}
  </ReportSection>
);

const ClosingSection = ({
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
    <ReportSection
      page={page}
      title={sectionTitle}
      icon={<Sparkle size={18} className="text-[#8DE1D0]" weight="fill" />}
    >
      <div className={`grid gap-4 ${
        reportView.continuityRecommendation && signalGroups.length > 0
          ? 'lg:grid-cols-[1.05fr_0.95fr]'
          : 'grid-cols-1'
      }`}
      >
        {reportView.continuityRecommendation && continuityMeta && (
          <div
            className="rounded-xl border border-[#0F5257]/20 bg-[#0F5257]/10 p-5"
            style={{ pageBreakInside: 'avoid' }}
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-sm ${continuityMeta.badgeClass}`}>
                {continuityMeta.label}
              </span>
            </div>

            {isMeaningfulText(reportView.continuityRecommendation.reason) && (
              <p className="mb-4 leading-relaxed text-white">
                {reportView.continuityRecommendation.reason}
              </p>
            )}

            {isMeaningfulText(reportView.continuityRecommendation.cta_label) && (
              <div className="rounded-xl border border-white/5 bg-[#111111] px-4 py-4">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
                  {REPORT_COPY.continuityCtaTitle}
                </p>

                <p className="text-white">
                  {reportView.continuityRecommendation.cta_label}
                </p>
              </div>
            )}
          </div>
        )}

        {signalGroups.length > 0 && (
          <div
            className="rounded-xl border border-white/5 bg-[#0A0A0A] p-5"
            style={{ pageBreakInside: 'avoid' }}
          >
            <p className="mb-3 text-sm uppercase tracking-wide text-[#A3A3A3]">
              {REPORT_COPY.signalsTitle}
            </p>

            <div className="grid gap-4">
              {signalGroups.map((group) => (
                <SignalList
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
          className="mt-6 rounded-2xl border border-white/5 bg-[#111111] px-5 py-5"
          style={{ pageBreakInside: 'avoid' }}
        >
          <p className="leading-relaxed text-white">
            {reportView.continuityRecommendation ? (
              <>
                {REPORT_COPY.closingWithContinuity}{' '}
                <span className="font-medium text-[#8DE1D0]">
                  {continuityMeta.label}
                </span>.
              </>
            ) : (
              REPORT_COPY.closingWithoutContinuity
            )}
          </p>
        </div>
      )}
    </ReportSection>
  );
};

const PremiumReportScreenTemplate = ({
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
      <div className="mx-auto max-w-[920px] rounded-2xl border border-white/5 bg-[#111111] p-8 text-white">
        {REPORT_COPY.emptyState}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[920px]">
      <div className="overflow-hidden rounded-[28px] border border-white/5 bg-[#0A0A0A] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <HeroSection
          project={project}
          brandName={brandName}
          documentTitle={documentTitle}
          routeLabel={routeLabel}
          issueDate={issueDate}
          heroCards={heroCards}
          page={pageMap[REPORT_SECTION_KEYS.hero]}
        />

        {visibleSections.includes(REPORT_SECTION_KEYS.summary) && (
          <SummarySection
            reportView={reportView}
            page={pageMap[REPORT_SECTION_KEYS.summary]}
          />
        )}

        {visibleSections.includes(REPORT_SECTION_KEYS.dimensions) && (
          <DimensionsSection
            reportView={reportView}
            dimensionCounters={dimensionCounters}
            page={pageMap[REPORT_SECTION_KEYS.dimensions]}
          />
        )}

        {visibleSections.includes(REPORT_SECTION_KEYS.actions) && (
          <ActionsSection
            reportView={reportView}
            page={pageMap[REPORT_SECTION_KEYS.actions]}
          />
        )}

        {visibleSections.includes(REPORT_SECTION_KEYS.closing) && (
          <ClosingSection
            reportView={reportView}
            signalGroups={signalGroups}
            continuityMeta={continuityMeta}
            page={pageMap[REPORT_SECTION_KEYS.closing]}
          />
        )}

        {showSystemFooter && (
          <div className="border-t border-white/5 bg-[#0B0B0B] px-8 py-5 sm:px-10">
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[#D4D4D4]">
                {toSafeText(brandName)} - {REPORT_COPY.footerLeft}
              </p>

              <p className="text-[#A3A3A3]">
                {REPORT_COPY.footerRight}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumReportScreenTemplate;