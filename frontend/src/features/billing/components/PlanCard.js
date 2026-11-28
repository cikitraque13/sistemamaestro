import React from 'react';
import {
  ArrowRight,
  CheckCircle,
  DiamondsFour,
  Sparkle
} from '@phosphor-icons/react';

import { getPlanDisplayCopy } from '../../../content/planDisplayCopy';

const PLAN_ROLE_META = {
  blueprint: {
    stage: 'ACTIVAR',
    surface:
      'border-orange-300/70 bg-[radial-gradient(circle_at_12%_0%,rgba(249,115,22,0.55),transparent_42%),linear-gradient(165deg,#7c2d12_0%,#431407_48%,#1c0a04_100%)]',
    glow: 'bg-orange-400/40',
    badgeClass:
      'border-orange-200/40 bg-orange-400/20 text-orange-50',
    ctaClass:
      'bg-[linear-gradient(95deg,#fdba74,#fb923c,#f97316)] text-[#2a1204] shadow-[0_0_24px_rgba(249,115,22,0.45)]',
    iconClass: 'text-orange-200'
  },
  sistema: {
    stage: 'CONTINUAR',
    surface:
      'border-lime-300/70 bg-[radial-gradient(circle_at_12%_0%,rgba(190,242,100,0.5),transparent_42%),linear-gradient(165deg,#3f6212_0%,#1a2e05_48%,#0a1403_100%)]',
    glow: 'bg-lime-300/35',
    badgeClass:
      'border-lime-200/40 bg-lime-300/20 text-lime-50',
    ctaClass:
      'bg-[linear-gradient(95deg,#ecfccb,#bef264,#84cc16)] text-[#142004] shadow-[0_0_24px_rgba(190,242,100,0.4)]',
    iconClass: 'text-lime-200'
  },
  premium: {
    stage: 'ESCALAR',
    surface:
      'border-violet-300/70 bg-[radial-gradient(circle_at_80%_0%,rgba(167,139,250,0.55),transparent_40%),radial-gradient(circle_at_10%_90%,rgba(56,189,248,0.4),transparent_42%),linear-gradient(165deg,#4c1d95_0%,#1e1b4b_55%,#082f49_100%)]',
    glow: 'bg-sky-400/30',
    badgeClass:
      'border-violet-200/40 bg-violet-400/20 text-violet-50',
    ctaClass:
      'bg-[linear-gradient(95deg,#ddd6fe,#a78bfa,#38bdf8)] text-[#140828] shadow-[0_0_24px_rgba(167,139,250,0.45)]',
    iconClass: 'text-sky-200'
  }
};

const PlanCard = ({
  plan,
  userPlan,
  processingKey,
  onPlanCheckout
}) => {
  const isCurrentPlan = userPlan === plan.id;
  const role = PLAN_ROLE_META[plan.id] || PLAN_ROLE_META.blueprint;
  const display = getPlanDisplayCopy(plan);

  const isProcessing = processingKey === `plan:${plan.id}`;
  const isDisabled = isCurrentPlan || isProcessing;

  const ctaLabel = isCurrentPlan
    ? 'Plan actual'
    : plan.cta?.label || `Entrar en ${display.name}`;

  return (
    <article
      className={`relative flex h-full min-h-[620px] flex-col overflow-hidden rounded-[32px] border p-6 shadow-[0_26px_90px_rgba(0,0,0,0.30)] ${role.surface}`}
      data-testid={`plan-card-${plan.id}`}
      data-highlight={display.highlighted ? 'true' : 'false'}
    >
      <div
        className={`absolute right-[-110px] top-[-120px] h-72 w-72 rounded-full ${role.glow} blur-3xl`}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/0 via-white/55 to-white/0" />

      <div className="relative z-10">
        <div className="mb-12 flex min-h-[34px] flex-wrap items-start gap-2">
          {display.badge ? (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${role.badgeClass}`}
              data-testid={`plan-badge-${plan.id}`}
            >
              {display.badge}
            </span>
          ) : null}

          {isCurrentPlan && (
            <span className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white">
              Actual
            </span>
          )}
        </div>

        <div className="mb-10">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-white/82">
            {role.stage}
          </p>

          <h4
            className="mb-6 text-4xl font-light leading-tight text-white"
            data-testid={`plan-name-${plan.id}`}
          >
            {display.name}
          </h4>

          <p
            className="min-h-[56px] text-base leading-7 text-white"
            data-testid={`plan-tagline-${plan.id}`}
          >
            {display.tagline}
          </p>
        </div>

        <div className="mb-5 flex items-end justify-between gap-4 border-b border-white/16 pb-5">
          <div className="flex items-end gap-2">
            <span className="whitespace-nowrap text-[3.15rem] font-light leading-none text-white">
              {plan.priceLabel}
            </span>

            <span className="whitespace-nowrap pb-1 text-sm text-white/62">
              {plan.periodLabel}
            </span>
          </div>

          <DiamondsFour
            size={18}
            weight="fill"
            className={role.iconClass}
          />
        </div>

        {display.gemsLine ? (
          <p
            className="mb-8 text-sm font-medium text-white"
            data-testid={`plan-gems-${plan.id}`}
          >
            {display.gemsLine}
          </p>
        ) : null}
      </div>

      <div className="relative z-10 flex-1">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
          Incluye
        </p>

        <ul className="space-y-2.5">
          {display.bullets.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm leading-6 text-white/84"
            >
              <CheckCircle
                size={16}
                weight="fill"
                className={`mt-1 flex-shrink-0 ${role.iconClass}`}
              />

              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mt-6">
        <button
          type="button"
          onClick={() => onPlanCheckout(plan.id)}
          disabled={isDisabled}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 font-medium transition-all ${
            isCurrentPlan
              ? 'cursor-default bg-white/10 text-white/45'
              : `${role.ctaClass} hover:translate-y-[-1px]`
          } disabled:opacity-55`}
          data-testid={`upgrade-btn-${plan.id}`}
        >
          {isProcessing ? (
            <div className="spinner h-4 w-4"></div>
          ) : (
            <>
              {ctaLabel}
              {!isCurrentPlan && <ArrowRight size={16} />}
            </>
          )}
        </button>

        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/45">
          <Sparkle size={13} />
          <span>Activación mediante checkout seguro</span>
        </div>
      </div>
    </article>
  );
};

export default PlanCard;
