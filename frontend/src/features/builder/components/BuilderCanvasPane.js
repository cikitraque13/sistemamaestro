import React, { useMemo } from 'react';

import BuilderExtractionPanel from '../panels/BuilderExtractionPanel';

import {
  buildSectorLandingModel,
} from '../preview/builderSectorProfileResolver';

import {
  BUILDER_CODE_TABS,
  getBuilderCodeLines,
  getVisibleCodeLines,
} from '../utils/builderCodeTemplates';

import {
  getArray,
} from '../utils/builderLandingCopy';

const truncateText = (value = '', max = 92) => {
  const text = String(value || '').trim();

  if (!text) return '';
  if (text.length <= max) return text;

  return `${text.slice(0, max - 1).trim()}…`;
};

const getBuilderKernelOutput = (builderIntelligence = {}) =>
  builderIntelligence?.builderKernelOutput ||
  builderIntelligence?.builderKernelResult?.output ||
  {};

const getBuilderIntelligenceParts = (builderIntelligence = {}) => {
  const hubSummary = builderIntelligence?.hubSummary || {};
  const lastDelta = builderIntelligence?.lastDelta || {};
  const lastOperation = builderIntelligence?.lastOperation || {};
  const builderKernelOutput = getBuilderKernelOutput(builderIntelligence);
  const codeSnapshot = builderKernelOutput?.code || null;
  const structureSnapshot = builderKernelOutput?.structure || null;
  const buildSummary =
    builderIntelligence?.builderBuildSummary ||
    builderKernelOutput?.summary ||
    null;

  return {
    hubSummary,
    lastDelta,
    lastOperation,
    builderKernelOutput,
    codeSnapshot,
    structureSnapshot,
    buildSummary,
  };
};

const buildLandingModel = ({
  copy,
  project,
  builderIntelligence,
} = {}) =>
  buildSectorLandingModel({
    copy,
    project,
    builderIntelligence,
  });

const resolvePreviewTone = (builderIntelligence = {}, modelTone = 'contextual') => {
  const {
    hubSummary,
    lastDelta,
  } = getBuilderIntelligenceParts(builderIntelligence);

  const visualTone = lastDelta?.visual?.tone;
  const projectType = hubSummary?.projectType;
  const businessModel = hubSummary?.businessModel;
  const intent = hubSummary?.iterationIntent;

  if (modelTone) return modelTone;
  if (visualTone) return visualTone;

  if (
    intent === 'premiumize' ||
    businessModel === 'high_ticket' ||
    projectType === 'high_ticket_page'
  ) {
    return 'premium';
  }

  if (
    intent === 'increase_conversion' ||
    intent === 'change_cta'
  ) {
    return 'direct';
  }

  return 'contextual';
};

const getPreviewSurfaceClass = (tone = 'contextual') => {
  const classes = {
    premium:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(251,191,36,0.18),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(255,255,255,0.09),transparent_34%),linear-gradient(135deg,#060507_0%,#0D0B12_56%,#070707_100%)]',
    direct:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(251,146,60,0.2),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(34,211,238,0.12),transparent_32%),linear-gradient(135deg,#050607_0%,#0B0A08_56%,#050505_100%)]',
    warm:
      'bg-[radial-gradient(circle_at_82%_0%,rgba(251,146,60,0.22),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(245,158,11,0.13),transparent_32%),linear-gradient(135deg,#080604_0%,#120C08_58%,#060504_100%)]',
    system:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.13),transparent_32%),linear-gradient(135deg,#030607_0%,#061012_58%,#030404_100%)]',
    tech:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(74,222,128,0.11),transparent_32%),linear-gradient(135deg,#030507_0%,#071018_58%,#020405_100%)]',
    simple:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(34,211,238,0.08),transparent_32%),linear-gradient(135deg,#07080A_0%,#0B0D10_58%,#050607_100%)]',
    serious:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(148,163,184,0.16),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(255,255,255,0.07),transparent_32%),linear-gradient(135deg,#050507_0%,#0B0C10_58%,#050505_100%)]',
    contextual:
      'bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.13),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(251,191,36,0.11),transparent_32%),linear-gradient(135deg,#050608_0%,#09080D_58%,#050505_100%)]',
  };

  return classes[tone] || classes.contextual;
};

const getAccentClass = (tone = 'contextual') => {
  const classes = {
    premium: 'border-amber-200/25 bg-amber-200/[0.09] text-amber-100',
    direct: 'border-orange-300/25 bg-orange-300/[0.09] text-orange-100',
    warm: 'border-orange-200/25 bg-orange-200/[0.09] text-orange-100',
    system: 'border-cyan-300/25 bg-cyan-300/[0.09] text-cyan-100',
    tech: 'border-cyan-300/25 bg-cyan-300/[0.09] text-cyan-100',
    simple: 'border-white/15 bg-white/[0.06] text-zinc-100',
    serious: 'border-slate-300/20 bg-slate-300/[0.08] text-slate-100',
    contextual: 'border-amber-200/20 bg-amber-200/[0.08] text-amber-100',
  };

  return classes[tone] || classes.contextual;
};

const getPrimaryButtonClass = (tone = 'contextual') => {
  const classes = {
    premium:
      'bg-gradient-to-r from-amber-200 via-white to-amber-100 text-black shadow-[0_18px_45px_rgba(251,191,36,0.16)]',
    direct:
      'bg-gradient-to-r from-orange-400 via-amber-200 to-white text-black shadow-[0_18px_45px_rgba(251,146,60,0.18)]',
    warm:
      'bg-gradient-to-r from-orange-300 via-amber-200 to-white text-black shadow-[0_18px_45px_rgba(251,146,60,0.16)]',
    system:
      'bg-gradient-to-r from-cyan-300 via-emerald-200 to-white text-black shadow-[0_18px_45px_rgba(34,211,238,0.16)]',
    tech:
      'bg-gradient-to-r from-cyan-300 via-white to-emerald-200 text-black shadow-[0_18px_45px_rgba(34,211,238,0.16)]',
    simple:
      'bg-white text-black shadow-[0_18px_45px_rgba(255,255,255,0.08)]',
    serious:
      'bg-gradient-to-r from-slate-100 via-white to-zinc-200 text-black shadow-[0_18px_45px_rgba(148,163,184,0.12)]',
    contextual:
      'bg-gradient-to-r from-amber-200 via-white to-amber-100 text-black shadow-[0_18px_45px_rgba(251,191,36,0.14)]',
  };

  return classes[tone] || classes.contextual;
};

const getPanelClass = (tone = 'contextual') => {
  const classes = {
    premium: 'border-amber-200/15 bg-amber-200/[0.045]',
    direct: 'border-orange-300/15 bg-orange-300/[0.045]',
    warm: 'border-orange-200/15 bg-orange-200/[0.045]',
    system: 'border-cyan-300/15 bg-cyan-300/[0.045]',
    tech: 'border-cyan-300/15 bg-cyan-300/[0.045]',
    simple: 'border-white/[0.08] bg-white/[0.035]',
    serious: 'border-slate-300/15 bg-slate-300/[0.045]',
    contextual: 'border-white/[0.08] bg-white/[0.035]',
  };

  return classes[tone] || classes.contextual;
};

const LandingHero = ({
  model,
  tone,
  progress,
}) => (
  <section className="px-6 py-9 md:px-10 md:py-12">
    <div
      className={`inline-flex rounded-full border px-4 py-2 transition-all duration-700 ${getAccentClass(tone)} ${
        progress >= 18 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-20'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
        {model.eyebrow}
      </p>
    </div>

    <div className="mt-7 grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
      <div>
        <p
          className={`text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400 transition-all duration-700 ${
            progress >= 24 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-20'
          }`}
        >
          {model.businessName}
        </p>

        <h1
          className={`mt-4 max-w-5xl text-4xl font-semibold tracking-[-0.075em] text-white transition-all duration-700 md:text-6xl ${
            progress >= 34 ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-20'
          }`}
        >
          {model.headline}
        </h1>

        <p
          className={`mt-6 max-w-3xl text-base leading-8 text-zinc-300 transition-all duration-700 md:text-lg ${
            progress >= 48 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-20'
          }`}
        >
          {model.subheadline}
        </p>

        <div
          className={`mt-8 flex flex-wrap gap-3 transition-all duration-700 ${
            progress >= 62 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-20'
          }`}
        >
          <button className={`rounded-2xl px-6 py-3.5 text-sm font-semibold ${getPrimaryButtonClass(tone)}`}>
            {model.primaryCTA}
          </button>

          <button className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white">
            {model.secondaryCTA}
          </button>
        </div>
      </div>

      <div
        className={`rounded-[28px] border p-5 transition-all duration-700 ${getPanelClass(tone)} ${
          progress >= 56 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-20'
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
          {model.offerLabel || 'Acción principal'}
        </p>

        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
          {model.booking.title}
        </h2>

        <p className="mt-3 text-sm leading-7 text-zinc-400">
          {model.booking.text}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {model.booking.fields.slice(0, 4).map((field) => (
            <input
              key={field}
              readOnly
              value=""
              placeholder={field}
              className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-zinc-400 outline-none"
            />
          ))}

          <button className={`rounded-2xl px-5 py-3 text-sm font-semibold sm:col-span-2 ${getPrimaryButtonClass(tone)}`}>
            {model.booking.buttonLabel}
          </button>
        </div>
      </div>
    </div>
  </section>
);

const LandingServices = ({
  model,
  tone,
  progress,
}) => (
  <section
    className={`border-t border-white/[0.08] px-6 py-8 transition-all duration-700 md:px-10 ${
      progress >= 68 ? 'opacity-100' : 'opacity-20'
    }`}
  >
    <div className="max-w-3xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
        {model.offerLabel || 'Servicios'}
      </p>

      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-white">
        {model.sectionTitle}
      </h2>

      <p className="mt-4 text-sm leading-7 text-zinc-400">
        {model.sectionText}
      </p>
    </div>

    <div className="mt-7 grid gap-4 lg:grid-cols-3">
      {model.services.map((service, index) => (
        <article
          key={`${service.title}-${index}`}
          className={`rounded-[26px] border p-5 transition-all duration-700 ${getPanelClass(tone)} ${
            progress >= 72 + index * 4 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-20'
          }`}
        >
          <div className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold ${getAccentClass(tone)}`}>
            {index + 1}
          </div>

          <h3 className="text-xl font-semibold tracking-[-0.04em] text-white">
            {truncateText(service.title, 56)}
          </h3>

          <p className="mt-4 text-sm leading-7 text-zinc-400">
            {service.text}
          </p>
        </article>
      ))}
    </div>
  </section>
);

const LandingTrustProcess = ({
  model,
  tone,
  progress,
}) => (
  <section
    className={`border-t border-white/[0.08] px-6 py-8 transition-all duration-700 md:px-10 ${
      progress >= 78 ? 'opacity-100' : 'opacity-20'
    }`}
  >
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <article className={`rounded-[28px] border p-6 ${getPanelClass(tone)}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
          {model.trustLabel || 'Confianza'}
        </p>

        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
          {model.trustTitle}
        </h2>

        <div className="mt-6 grid gap-3">
          {model.trust.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm text-zinc-300"
            >
              {item}
            </div>
          ))}
        </div>
      </article>

      <article className={`rounded-[28px] border p-6 ${getPanelClass(tone)}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
          Proceso
        </p>

        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
          {model.processTitle}
        </h2>

        <p className="mt-4 text-sm leading-7 text-zinc-400">
          Una experiencia clara para que el usuario entienda qué hacer, qué esperar y cuál es el siguiente paso.
        </p>

        <div className="mt-6 grid gap-3">
          {model.processSteps.map((item, index) => (
            <div
              key={item}
              className="rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm text-zinc-300"
            >
              <span className="mr-2 text-cyan-200">{index + 1}.</span>
              {item}
            </div>
          ))}
        </div>
      </article>
    </div>
  </section>
);

const LandingTestimonials = ({
  model,
  tone,
  progress,
}) => (
  <section
    className={`border-t border-white/[0.08] px-6 py-8 transition-all duration-700 md:px-10 ${
      progress >= 86 ? 'opacity-100' : 'opacity-20'
    }`}
  >
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
          {model.testimonialLabel || 'Prueba social'}
        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-white">
          {model.testimonialTitle}
        </h2>
      </div>

      <span className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${getAccentClass(tone)}`}>
        Opiniones preparadas
      </span>
    </div>

    <div className="mt-7 grid gap-4 lg:grid-cols-2">
      {model.testimonials.map((testimonial, index) => (
        <article
          key={`${testimonial.author}-${index}`}
          className={`rounded-[26px] border p-6 ${getPanelClass(tone)}`}
        >
          <p className="text-lg leading-8 text-white">
            “{testimonial.quote}”
          </p>

          <p className="mt-5 text-sm font-semibold text-zinc-400">
            {testimonial.author}
          </p>
        </article>
      ))}
    </div>
  </section>
);

const LandingFollowUpCTA = ({
  model,
  tone,
  progress,
}) => (
  <section
    className={`border-t border-white/[0.08] px-6 py-8 transition-all duration-700 md:px-10 ${
      progress >= 92 ? 'opacity-100' : 'opacity-20'
    }`}
  >
    <div className={`rounded-[30px] border p-6 md:p-8 ${getPanelClass(tone)}`}>
      <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
            {model.automationLabel || 'Seguimiento'}
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-white">
            {model.automation.title}
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            {model.automation.text}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button className={`rounded-2xl px-6 py-3.5 text-sm font-semibold ${getPrimaryButtonClass(tone)}`}>
              {model.finalCTA || model.primaryCTA}
            </button>

            <button className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white">
              {model.secondaryCTA || 'Solicitar información'}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {model.automation.items.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-4 text-sm text-zinc-300"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const ClientLandingPreview = ({
  copy,
  project,
  progress,
  builderIntelligence,
}) => {
  const model = useMemo(
    () =>
      buildLandingModel({
        copy,
        project,
        builderIntelligence,
      }),
    [
      copy,
      project,
      builderIntelligence,
    ]
  );

  const tone = resolvePreviewTone(builderIntelligence, model.tone);

  return (
    <div className={`h-full overflow-y-auto ${getPreviewSurfaceClass(tone)}`}>
      <LandingHero
        model={model}
        tone={tone}
        progress={progress}
      />

      <LandingServices
        model={model}
        tone={tone}
        progress={progress}
      />

      <LandingTrustProcess
        model={model}
        tone={tone}
        progress={progress}
      />

      <LandingTestimonials
        model={model}
        tone={tone}
        progress={progress}
      />

      <LandingFollowUpCTA
        model={model}
        tone={tone}
        progress={progress}
      />
    </div>
  );
};

const CodeCanvas = ({
  copy,
  project,
  progress,
  activeCodeTab,
  onCodeTabChange,
  intent = {},
  visualState = {},
  codeSnapshot = null,
}) => {
  const lines = useMemo(
    () =>
      getBuilderCodeLines({
        tab: activeCodeTab,
        copy,
        project,
        intent,
        visualState,
        codeSnapshot,
      }),
    [
      activeCodeTab,
      copy,
      project,
      intent,
      visualState,
      codeSnapshot,
    ]
  );

  const visibleLines = useMemo(
    () => getVisibleCodeLines(lines, progress),
    [
      lines,
      progress,
    ]
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#020405] font-mono">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Código del proyecto
          </p>

          {codeSnapshot?.entryFile && (
            <p className="mt-1 text-[10px] text-cyan-200/80">
              {codeSnapshot.entryFile}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {BUILDER_CODE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onCodeTabChange(tab.id)}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                activeCodeTab === tab.id
                  ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100'
                  : 'border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 text-xs leading-6 text-zinc-300">
        {visibleLines.map((line, index) => (
          <div
            key={`${line}-${index}`}
            className="grid grid-cols-[34px_1fr] gap-3"
          >
            <span className="select-none text-right text-zinc-700">
              {index + 1}
            </span>

            <span
              className={
                line.includes('button') ||
                line.includes('h1') ||
                line.includes('CTA') ||
                line.includes('primary')
                  ? 'text-cyan-200'
                  : line.includes('const') ||
                      line.includes('export') ||
                      line.includes('def ') ||
                      line.includes('class ')
                    ? 'text-emerald-200'
                    : line.includes('{') || line.includes('}')
                      ? 'text-amber-100'
                      : 'text-zinc-300'
              }
            >
              {line || ' '}
            </span>
          </div>
        ))}

        {progress < 100 && (
          <div className="grid grid-cols-[34px_1fr] gap-3">
            <span className="select-none text-right text-zinc-700">
              {visibleLines.length + 1}
            </span>

            <span className="text-cyan-300">
              <span className="inline-block h-4 w-[7px] translate-y-[2px] animate-pulse bg-cyan-300" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const BlueprintCompact = ({ project }) => {
  const blueprint = project?.blueprint;
  const priorities = getArray(blueprint?.priorities);
  const components = getArray(blueprint?.architecture?.components);
  const steps = getArray(blueprint?.deployment_steps);

  return (
    <div className="h-full overflow-y-auto p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
        Blueprint
      </p>

      <h2 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.05em] text-white">
        {blueprint?.title || 'Blueprint pendiente'}
      </h2>

      <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-400">
        {blueprint?.summary ||
          'El blueprint queda como base interna para informe, PDF y preparación estructural. Builder mantiene foco en construcción.'}
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-white">Prioridades</p>

          <ul className="mt-4 space-y-3">
            {(priorities.length ? priorities : ['Pendiente']).map((item) => (
              <li key={item} className="text-sm leading-6 text-zinc-400">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-white">Componentes</p>

          <ul className="mt-4 space-y-3">
            {(components.length ? components : ['Pendiente']).map((item) => (
              <li key={item} className="text-sm leading-6 text-zinc-400">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-white">Salida</p>

          <ul className="mt-4 space-y-3">
            {(steps.length ? steps : ['Pendiente de motor Builder']).map((item) => (
              <li key={item} className="text-sm leading-6 text-zinc-400">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const BuilderStructureCompact = ({ project, builderIntelligence }) => {
  const { structureSnapshot, buildSummary } = getBuilderIntelligenceParts(builderIntelligence);

  const folders = getArray(structureSnapshot?.folders);
  const files = getArray(structureSnapshot?.files);
  const routes = getArray(structureSnapshot?.routes);
  const apiRoutes = getArray(structureSnapshot?.apiRoutes);

  const hasStructure =
    folders.length ||
    files.length ||
    routes.length ||
    apiRoutes.length;

  if (!hasStructure) {
    return <BlueprintCompact project={project} />;
  }

  const groups = [
    {
      label: 'Carpetas',
      items: folders,
    },
    {
      label: 'Archivos',
      items: files,
    },
    {
      label: 'Rutas',
      items: routes,
    },
    {
      label: 'API',
      items: apiRoutes,
    },
  ].filter((group) => group.items.length);

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Estructura viva
          </p>

          <h2 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.05em] text-white">
            Carpetas, archivos y rutas generadas por el Builder
          </h2>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-400">
            Esta estructura sale del estado de construcción y permite preparar una salida técnica coherente.
          </p>
        </div>

        {buildSummary && (
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] px-4 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
              Estado
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {buildSummary.filesCount || 0} archivos · {buildSummary.foldersCount || 0} carpetas
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
          <section
            key={group.label}
            className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5"
          >
            <p className="text-sm font-semibold text-white">
              {group.label}
            </p>

            <div className="mt-4 space-y-2">
              {group.items.slice(0, 12).map((item, index) => (
                <div
                  key={`${group.label}-${item}-${index}`}
                  className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3 font-mono text-xs text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

const DeployPanel = ({ project, kind = 'deploy' }) => (
  <div className="h-full overflow-y-auto p-5">
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
      {kind === 'github' ? 'GitHub' : 'Deploy'}
    </p>

    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
      {kind === 'github'
        ? 'Conexión GitHub pendiente del motor Builder'
        : 'Salida técnica pendiente del motor Builder'}
    </h2>

    <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
      El proyecto {project?.project_id || 'actual'} ya tiene diagnóstico. La siguiente fase debe generar archivos reales antes de activar salida técnica.
    </p>

    <div className="mt-5 grid gap-4 md:grid-cols-3">
      {(kind === 'github'
        ? ['Generar archivos', 'Crear repositorio', 'Sincronizar cambios']
        : ['Generar archivos', 'Preparar entorno', 'Publicar versión']
      ).map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5"
        >
          <p className="text-sm font-semibold text-white">{item}</p>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Pendiente de salida técnica validada.
          </p>
        </div>
      ))}
    </div>
  </div>
);

export default function BuilderCanvasPane({
  activeWorkspaceTab = 'preview',
  copy,
  project,
  progress,
  activeCodeTab,
  onCodeTabChange,
  builderIntelligence = null,
}) {
  const landingCopy = useMemo(
    () =>
      buildLandingModel({
        copy,
        project,
        builderIntelligence,
      }),
    [
      copy,
      project,
      builderIntelligence,
    ]
  );

  const {
    hubSummary,
    lastDelta,
    codeSnapshot,
  } = getBuilderIntelligenceParts(builderIntelligence);

  if (activeWorkspaceTab === 'code') {
    return (
      <CodeCanvas
        copy={landingCopy}
        project={project}
        progress={progress}
        activeCodeTab={activeCodeTab}
        onCodeTabChange={onCodeTabChange}
        intent={hubSummary}
        visualState={lastDelta?.visual || {}}
        codeSnapshot={codeSnapshot}
      />
    );
  }

  if (activeWorkspaceTab === 'extract') {
    return (
      <BuilderExtractionPanel
        copy={landingCopy}
        project={project}
        progress={progress}
        builderIntelligence={builderIntelligence}
      />
    );
  }

  if (activeWorkspaceTab === 'structure') {
    return (
      <BuilderStructureCompact
        project={project}
        builderIntelligence={builderIntelligence}
      />
    );
  }

  if (activeWorkspaceTab === 'deploy') {
    return <DeployPanel project={project} kind="deploy" />;
  }

  if (activeWorkspaceTab === 'github') {
    return <DeployPanel project={project} kind="github" />;
  }

  return (
    <ClientLandingPreview
      copy={copy}
      project={project}
      progress={progress}
      builderIntelligence={builderIntelligence}
    />
  );
}