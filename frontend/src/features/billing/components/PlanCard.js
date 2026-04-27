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
    headline: 'Activa una base real de trabajo.',
    description:
      'Para pasar de una idea, informe o diagnóstico inicial a una base real de trabajo dentro de Builder.',
    bestFor:
      'Primera activación seria dentro del sistema.',
    surface:
      'border-[#8DE1D0]/45 bg-[linear-gradient(180deg,#073B39_0%,#05211F_46%,#050505_100%)]',
    glow: 'bg-[#0F5257]/26',
    badgeClass:
      'border-[#8DE1D0]/25 bg-[#0F5257]/34 text-[#8DE1D0]',
    ctaClass:
      'bg-[#0F5257] text-white hover:bg-[#136970]',
    iconClass: 'text-[#8DE1D0]'
  },
  sistema: {
    stage: 'CONTINUAR',
    badge: 'Núcleo operativo',
    level: 'Continuidad seria',
    headline: 'Convierte el sistema en continuidad operativa.',
    description:
      'Para proyectos que ya necesitan iteración, seguimiento, más margen operativo y continuidad de construcción.',
    bestFor:
      'Continuidad seria y trabajo con más recorrido.',
    surface:
      'border-sky-200/42 bg-[linear-gradient(180deg,#0C314C_0%,#071D2B_46%,#050505_100%)]',
    glow: 'bg-sky-400/18',
    badgeClass:
      'border-sky-200/22 bg-sky-400/18 text-sky-100',
    ctaClass:
      'bg-[#2A3F55] text-white hover:bg-[#355169]',
    iconClass: 'text-sky-200'
  },
  premium: {
    stage: 'ESCALAR',
    badge: 'Capa superior',
    level: 'Capa maestra avanzada',
    headline: 'Activa la capa maestra para casos complejos.',
    description:
      'Para casos complejos que requieren más criterio, más inteligencia, más capacidad y preparación seria de salida.',
    bestFor:
      'Casos complejos, operador serio y salida preparada.',
    surface:
      'border-fuchsia-200/42 bg-[linear-gradient(180deg,#3A0F3A_0%,#1E0820_46%,#050505_100%)]',
    glow: 'bg-fuchsia-400/18',
    badgeClass:
      'border-fuchsia-200/22 bg-fuchsia-400/16 text-fuchsia-100',
    ctaClass:
      'bg-[#3B123E] text-white hover:bg-[#4A1850]',
    iconClass: 'text-fuchsia-200'
  }
};

const OperationalGrid = ({ items }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {items.map((item) => {
      const accent = getOperationalAccentClasses(item.label);

      return (
        <div
          key={item.label}
          className={`min-h-[92px] rounded-2xl border px-3 py-3 ${accent.wrap}`}
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
      className={`relative flex h-full min-h-[710px] flex-col overflow-hidden rounded-[32px] border p-6 shadow-[0_26px_90px_rgba(0,0,0,0.30)] ${role.surface}`}
      data-testid={`plan-card-${plan.id}`}
    >
      <div className={`absolute right-[-110px] top-[-120px] h-72 w-72 rounded-full ${role.glow} blur-3xl`} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/0 via-white/55 to-white/0" />

      <div className="relative z-10 flex min-h-[292px] flex-col">
        <div className="mb-8 flex min-h-[34px] flex-wrap items-start gap-2">
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

        <div className="flex min-h-[232px] flex-col">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/82">
            {role.stage}
          </p>

          <h4 className="mb-5 min-h-[54px] text-4xl font-light leading-tight text-white">
            {plan.visibleName}
          </h4>

          <p className="mb-5 min-h-[58px] text-base leading-7 text-white">
            {role.headline || plan.headline}
          </p>

          <p className="min-h-[78px] text-sm leading-6 text-white/68">
            {role.description}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-2 min-h-[248px] rounded-3xl border border-white/16 bg-black/30 p-5">
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

        <div className="rounded-2xl border border-white/14 bg-white/[0.045] px-4 py-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/48">
            Mejor encaje
          </p>

          <p className="min-h-[52px] text-sm leading-6 text-white">
            {plan.bestForShort || plan.bestFor || role.bestFor}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-5 rounded-3xl border border-white/16 bg-black/25 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
              Marco operativo
            </p>
            <p className="mt-1 text-xs text-white/45">
              Acceso, Builder, salida y créditos.
            </p>
          </div>

          <DiamondsFour
            size={18}
            weight="fill"
            className={role.iconClass}
          />
        </div>

        <OperationalGrid items={buildOperationalItems(plan)} />
      </div>

      {planSignals.length > 0 && (
        <div className="relative z-10 mt-5 min-h-[72px]">
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

      <div className="relative z-10 mt-4 flex-1">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
          Incluye
        </p>

        <ul className="space-y-2.5">
          {highlights.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm leading-6 text-white/84"
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