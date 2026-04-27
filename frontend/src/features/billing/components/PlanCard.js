import React from 'react';
import {
  ArrowRight,
  CheckCircle,
  DiamondsFour,
  Sparkle
} from '@phosphor-icons/react';

import { PLAN_SIGNAL_META } from '../billing.constants';
import {
  buildOperationalItems,
  getOperationalAccentClasses
} from '../billing.utils';

const PLAN_ROLE_META = {
  blueprint: {
    stage: 'ACTIVAR',
    badge: 'Entrada seria',
    suggestedBadge: 'Recomendado',
    level: 'Primera activación operativa',
    description:
      'Para pasar de una idea, informe o diagnóstico inicial a una base real de trabajo dentro de Builder.',
    bestFor:
      'Base operativa inicial para empezar con estructura, prioridades y primeros créditos.',
    surface:
      'border-[#0F5257]/55 bg-[linear-gradient(180deg,#062D2D_0%,#041616_48%,#050505_100%)]',
    glow: 'bg-[#0F5257]/22',
    badgeClass:
      'border-[#8DE1D0]/25 bg-[#0F5257]/35 text-[#8DE1D0]',
    ctaClass:
      'bg-[#0F5257] text-white hover:bg-[#136970]'
  },
  sistema: {
    stage: 'CONTINUAR',
    badge: 'Núcleo operativo',
    level: 'Continuidad seria',
    description:
      'Para proyectos que ya necesitan iteración, seguimiento, más margen operativo y continuidad de construcción.',
    bestFor:
      'Trabajo con más recorrido, Builder continuo, optimización y mejora del proyecto.',
    surface:
      'border-sky-300/45 bg-[linear-gradient(180deg,#0B263C_0%,#061722_48%,#050505_100%)]',
    glow: 'bg-sky-400/16',
    badgeClass:
      'border-sky-200/20 bg-sky-400/18 text-sky-100',
    ctaClass:
      'bg-[#2A3F55] text-white hover:bg-[#355169]'
  },
  premium: {
    stage: 'ESCALAR',
    badge: 'Capa superior',
    level: 'Capa maestra avanzada',
    description:
      'Para casos complejos que requieren más criterio, más inteligencia, más capacidad y preparación seria de salida.',
    bestFor:
      'Criterio maestro, Builder avanzado, más capacidad y salida mejor preparada.',
    surface:
      'border-fuchsia-200/45 bg-[linear-gradient(180deg,#2B0D2E_0%,#17081A_48%,#050505_100%)]',
    glow: 'bg-fuchsia-400/16',
    badgeClass:
      'border-fuchsia-200/20 bg-fuchsia-400/16 text-fuchsia-100',
    ctaClass:
      'bg-[#3B123E] text-white hover:bg-[#4A1850]'
  }
};

const OperationalGrid = ({ items }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {items.map((item) => {
      const accent = getOperationalAccentClasses(item.label);

      return (
        <div
          key={item.label}
          className={`rounded-2xl border px-3 py-3 ${accent.wrap}`}
        >
          <p className={`mb-1 text-[10px] uppercase tracking-[0.14em] ${accent.label}`}>
            {item.label}
          </p>

          <p className={`text-xs leading-relaxed ${accent.value}`}>
            {item.value}
          </p>
        </div>
      );
    })}
  </div>
);

const PlanCard = ({
  plan,
  userPlan,
  suggestedPlanId,
  processingKey,
  onPlanCheckout
}) => {
  const isCurrentPlan = userPlan === plan.id;
  const isSuggestedPlan = suggestedPlanId
    ? suggestedPlanId === plan.id
    : plan.id === 'blueprint';

  const role = PLAN_ROLE_META[plan.id] || PLAN_ROLE_META.blueprint;

  const planSignals = PLAN_SIGNAL_META[plan.id]?.chips || [];
  const planSignalClass =
    PLAN_SIGNAL_META[plan.id]?.chipClass ||
    'bg-white/5 text-[#D4D4D4] border border-white/10';

  const highlights =
    Array.isArray(plan.billingHighlights) && plan.billingHighlights.length > 0
      ? plan.billingHighlights.slice(0, 4)
      : (plan.features || []).slice(0, 4);

  const isProcessing = processingKey === `plan:${plan.id}`;
  const isDisabled = isCurrentPlan || isProcessing;

  const ctaLabel = isCurrentPlan
    ? 'Plan actual'
    : plan.cta?.label || `Entrar en ${plan.visibleName}`;

  return (
    <article
      className={`relative flex h-full min-h-[680px] flex-col overflow-hidden rounded-[30px] border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.26)] ${role.surface}`}
      data-testid={`plan-card-${plan.id}`}
    >
      <div className={`absolute right-[-110px] top-[-120px] h-72 w-72 rounded-full ${role.glow} blur-3xl`} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/0 via-white/45 to-white/0" />

      <div className="relative z-10 flex min-h-[176px] flex-col">
        <div className="mb-5 flex min-h-[34px] flex-wrap items-start gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${role.badgeClass}`}
          >
            {role.badge}
          </span>

          {isSuggestedPlan && !isCurrentPlan && role.suggestedBadge && (
            <span className="inline-flex items-center rounded-full border border-[#8DE1D0]/25 bg-[#0F5257]/18 px-3 py-1 text-xs font-medium text-[#8DE1D0]">
              {role.suggestedBadge}
            </span>
          )}

          {isCurrentPlan && (
            <span className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white">
              Actual
            </span>
          )}
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
          {role.stage}
        </p>

        <h4 className="mb-3 text-4xl font-light leading-tight text-white">
          {plan.visibleName}
        </h4>

        <p className="mb-3 text-base leading-snug text-white">
          {plan.headline}
        </p>

        <p className="text-sm leading-6 text-white/68">
          {role.description}
        </p>
      </div>

      <div className="relative z-10 mt-6 rounded-3xl border border-white/14 bg-black/28 p-5">
        <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-white/55">
          Nivel de capacidad
        </p>

        <div className="mb-5 flex items-end gap-2">
          <span className="whitespace-nowrap text-[3.25rem] font-light leading-none text-white">
            {plan.priceLabel}
          </span>

          <span className="whitespace-nowrap pb-1 text-sm text-white/62">
            {plan.periodLabel}
          </span>
        </div>

        <div className="rounded-2xl border border-white/12 bg-white/[0.045] px-4 py-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/48">
            Mejor encaje
          </p>

          <p className="text-sm leading-6 text-white">
            {plan.bestForShort || plan.bestFor || role.bestFor}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-5 rounded-3xl border border-white/14 bg-black/24 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/58">
              Marco operativo
            </p>
            <p className="mt-1 text-xs text-white/38">
              Acceso, Builder, salida y créditos.
            </p>
          </div>

          <DiamondsFour
            size={17}
            weight="fill"
            className="text-amber-200"
          />
        </div>

        <OperationalGrid items={buildOperationalItems(plan)} />
      </div>

      {planSignals.length > 0 && (
        <div className="relative z-10 mt-5">
          <div className="flex flex-wrap gap-2">
            {planSignals.map((signal) => (
              <span
                key={`${plan.id}-${signal}`}
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${planSignalClass}`}
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 mt-5 flex-1">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/58">
          Incluye
        </p>

        <ul className="space-y-2.5">
          {highlights.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm leading-6 text-white/82"
            >
              <CheckCircle
                size={16}
                weight="fill"
                className="mt-1 flex-shrink-0 text-[#0F5257]"
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