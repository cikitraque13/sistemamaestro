import React from 'react';
import {
  ArrowRight,
  CheckCircle,
  DiamondsFour,
  Sparkle
} from '@phosphor-icons/react';

import { PLAN_SIGNAL_META, PLAN_VISUAL_META } from '../billing.constants';
import {
  buildOperationalItems,
  getOperationalAccentClasses
} from '../billing.utils';

const PLAN_ROLE_META = {
  blueprint: {
    stage: 'Activar',
    level: 'Primera activación operativa',
    description:
      'Para pasar de una idea, informe o diagnóstico inicial a una base real de trabajo dentro de Builder.',
    emphasis: 'Entrada seria al sistema',
    accent: 'text-[#8DE1D0]',
    border: 'border-[#0F5257]/45',
    surface:
      'bg-[radial-gradient(circle_at_top_right,rgba(15,82,87,0.20),transparent_32%),linear-gradient(180deg,#121B1C_0%,#090909_100%)]'
  },
  sistema: {
    stage: 'Continuar',
    level: 'Continuidad y mejora',
    description:
      'Para proyectos que ya necesitan iteración, seguimiento, más margen operativo y continuidad de construcción.',
    emphasis: 'Núcleo operativo',
    accent: 'text-sky-200',
    border: 'border-sky-500/24',
    surface:
      'bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.13),transparent_32%),linear-gradient(180deg,#111722_0%,#090909_100%)]'
  },
  premium: {
    stage: 'Escalar',
    level: 'Capa maestra avanzada',
    description:
      'Para casos complejos que requieren más criterio, más inteligencia, más capacidad y preparación seria de salida.',
    emphasis: 'Máxima capacidad',
    accent: 'text-fuchsia-200',
    border: 'border-fuchsia-400/24',
    surface:
      'bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.12),transparent_32%),linear-gradient(180deg,#17111F_0%,#090909_100%)]'
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

  const visual = PLAN_VISUAL_META[plan.id] || PLAN_VISUAL_META.blueprint;
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
    : plan.cta?.label || `Activar ${plan.visibleName}`;

  return (
    <article
      className={`group relative flex h-full min-h-[650px] flex-col overflow-hidden rounded-[30px] border p-5 transition-all duration-300 ${role.border} ${role.surface}`}
      data-testid={`plan-card-${plan.id}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${visual.accentLineClass}`}
      />

      <div className="absolute right-[-80px] top-[-90px] h-56 w-56 rounded-full bg-white/[0.035] blur-3xl" />

      <div className="relative z-10 mb-4 flex flex-wrap items-start gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${visual.badgeClass}`}
        >
          {plan.badge || role.emphasis}
        </span>

        {isSuggestedPlan && !isCurrentPlan && (
          <span className="inline-flex items-center rounded-full border border-[#0F5257]/30 bg-[#0F5257]/15 px-3 py-1 text-xs font-medium text-[#8DE1D0]">
            Recomendado
          </span>
        )}

        {isCurrentPlan && (
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
            Actual
          </span>
        )}

        {plan.id === 'blueprint' && !isCurrentPlan && (
          <span className="inline-flex items-center rounded-full border border-[#0F5257]/20 bg-[#0F5257]/10 px-3 py-1 text-xs font-medium text-[#8DE1D0]">
            Entrada principal
          </span>
        )}
      </div>

      <div className="relative z-10 mb-5">
        <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.22em] ${role.accent}`}>
          {role.stage}
        </p>

        <h4 className="mb-2 text-3xl font-light leading-tight text-white">
          {plan.visibleName}
        </h4>

        <p className="mb-3 text-base leading-snug text-[#F0F0F0]">
          {plan.headline}
        </p>

        <p className="text-sm leading-6 text-[#A3A3A3]">
          {role.description}
        </p>
      </div>

      <div className="relative z-10 mb-5 rounded-3xl border border-white/10 bg-black/28 p-5">
        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[#A3A3A3]">
          Nivel de capacidad
        </p>

        <div className="mb-4 flex items-end gap-2">
          <span className="whitespace-nowrap text-[3.1rem] font-light leading-none text-white">
            {plan.priceLabel}
          </span>

          <span className="whitespace-nowrap pb-1 text-sm text-[#A3A3A3]">
            {plan.periodLabel}
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A3A3A3]">
            Mejor encaje
          </p>

          <p className="text-sm leading-6 text-white">
            {plan.bestForShort || plan.bestFor || role.level}
          </p>
        </div>
      </div>

      <div className="relative z-10 mb-5 rounded-3xl border border-white/10 bg-black/22 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A3A3A3]">
              Marco operativo
            </p>
            <p className="mt-1 text-xs text-[#777]">
              Acceso, Builder, salida y créditos.
            </p>
          </div>

          <DiamondsFour
            size={17}
            weight="fill"
            className={plan.id === 'blueprint' ? 'text-[#8DE1D0]' : 'text-amber-200'}
          />
        </div>

        <OperationalGrid items={buildOperationalItems(plan)} />
      </div>

      {planSignals.length > 0 && (
        <div className="relative z-10 mb-5">
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

      <div className="relative z-10 mb-6 flex-1">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A3A3A3]">
          Incluye
        </p>

        <ul className="space-y-2.5">
          {highlights.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm leading-6 text-[#D4D4D4]"
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

      <div className="relative z-10 mt-auto">
        <button
          type="button"
          onClick={() => onPlanCheckout(plan.id)}
          disabled={isDisabled}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-medium transition-all ${
            isCurrentPlan
              ? 'cursor-default bg-white/8 text-[#A3A3A3]'
              : `${visual.ctaClass} hover:translate-y-[-1px]`
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

        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#8D8D8D]">
          <Sparkle size={13} />
          <span>
            Activación mediante checkout seguro
          </span>
        </div>
      </div>
    </article>
  );
};

export default PlanCard;