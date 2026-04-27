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
  free: {
    stage: 'Explorar',
    title: 'Entrada sin friccion',
    description: 'Para orientarte, probar el sistema y entender si la oportunidad merece avanzar.',
    accent: 'text-zinc-300',
    shell: 'border-white/8 bg-[linear-gradient(180deg,#151515_0%,#0B0B0B_100%)]'
  },
  blueprint: {
    stage: 'Activar',
    title: 'Primera capacidad real',
    description: 'Para pasar del analisis a una base estructural con Builder, ruta y creditos iniciales.',
    accent: 'text-[#8DE1D0]',
    shell: 'border-[#0F5257]/45 bg-[radial-gradient(circle_at_top_right,rgba(15,82,87,0.18),transparent_32%),linear-gradient(180deg,#121B1C_0%,#090909_100%)]'
  },
  sistema: {
    stage: 'Continuar',
    title: 'Operacion con recorrido',
    description: 'Para proyectos que ya necesitan iteracion, continuidad y mas margen operativo.',
    accent: 'text-sky-200',
    shell: 'border-sky-500/20 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.10),transparent_30%),linear-gradient(180deg,#111722_0%,#090909_100%)]'
  },
  premium: {
    stage: 'Escalar',
    title: 'Criterio avanzado',
    description: 'Para trabajar con mas capacidad, estructura superior y enfoque maestro.',
    accent: 'text-fuchsia-200',
    shell: 'border-fuchsia-400/20 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.10),transparent_30%),linear-gradient(180deg,#17111F_0%,#090909_100%)]'
  }
};

const OperationalGrid = ({ items }) => (
  <div className="grid grid-cols-2 gap-3">
    {items.map((item) => {
      const accent = getOperationalAccentClasses(item.label);

      return (
        <div
          key={item.label}
          className={`min-h-[90px] rounded-2xl border px-3 py-3 ${accent.wrap}`}
        >
          <p className={`mb-2 text-[10px] uppercase tracking-[0.14em] ${accent.label}`}>
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

  const visual = PLAN_VISUAL_META[plan.id] || PLAN_VISUAL_META.free;
  const role = PLAN_ROLE_META[plan.id] || PLAN_ROLE_META.free;

  const planSignals = PLAN_SIGNAL_META[plan.id]?.chips || [];
  const planSignalClass =
    PLAN_SIGNAL_META[plan.id]?.chipClass ||
    'bg-white/5 text-[#D4D4D4] border border-white/10';

  const highlights =
    Array.isArray(plan.billingHighlights) && plan.billingHighlights.length > 0
      ? plan.billingHighlights.slice(0, 4)
      : (plan.features || []).slice(0, 4);

  const isProcessing = processingKey === `plan:${plan.id}`;
  const isDisabled = plan.id === 'free' || isCurrentPlan || isProcessing;

  const ctaLabel = isCurrentPlan
    ? 'Plan actual'
    : plan.id === 'free'
      ? 'Plan base'
      : plan.cta?.label || 'Activar plan';

  return (
    <article
      className={`group relative flex h-full min-h-[760px] flex-col overflow-hidden rounded-[28px] border p-5 transition-all duration-300 ${
        isSuggestedPlan ? role.shell : `${visual.surfaceClass} ${visual.borderClass}`
      }`}
      data-testid={`plan-card-${plan.id}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${visual.accentLineClass}`}
      />

      {isSuggestedPlan && !isCurrentPlan && (
        <div className="absolute right-4 top-4 rounded-full border border-[#0F5257]/30 bg-[#0F5257]/15 px-3 py-1 text-[11px] font-medium text-[#8DE1D0]">
          Recomendado
        </div>
      )}

      <div className="mb-5">
        <div className="mb-4 flex flex-wrap items-center gap-2 pr-28">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${visual.badgeClass}`}
          >
            {plan.badge || visual.eyebrow}
          </span>

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

        <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.18em] ${role.accent}`}>
          {role.stage}
        </p>

        <h4 className="mb-2 text-2xl font-medium text-white">
          {plan.visibleName}
        </h4>

        <p className="mb-3 text-[15px] leading-snug text-[#F0F0F0]">
          {plan.headline}
        </p>

        <p className="text-sm leading-relaxed text-[#A3A3A3]">
          {role.description || plan.description}
        </p>
      </div>

      <div className="mb-5 rounded-3xl border border-white/10 bg-black/25 p-5">
        <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[#A3A3A3]">
          Nivel de capacidad
        </p>

        <div className="mb-4 flex items-end gap-2">
          <span className="text-4xl font-light text-white lg:text-5xl">
            {plan.priceLabel}
          </span>
          <span className="pb-1 text-sm text-[#A3A3A3]">
            {plan.periodLabel}
          </span>
        </div>

        <p className="text-sm leading-6 text-[#D4D4D4]">
          {plan.bestForShort || plan.bestFor || role.title}
        </p>
      </div>

      <div className="mb-5 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A3A3A3]">
            Marco operativo
          </p>

          <DiamondsFour
            size={16}
            weight="fill"
            className={plan.id === 'blueprint' ? 'text-[#8DE1D0]' : 'text-amber-200'}
          />
        </div>

        <OperationalGrid items={buildOperationalItems(plan)} />
      </div>

      {planSignals.length > 0 && (
        <div className="mb-5 min-h-[64px]">
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

      <div className="mb-6 flex-1">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A3A3A3]">
          Incluye
        </p>

        <ul className="space-y-3">
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

      <div className="mt-auto">
        <button
          type="button"
          onClick={() => onPlanCheckout(plan.id)}
          disabled={isDisabled}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-medium transition-all ${
            isCurrentPlan
              ? 'cursor-default bg-white/8 text-[#A3A3A3]'
              : plan.id === 'free'
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
              {!isCurrentPlan && plan.id !== 'free' && <ArrowRight size={16} />}
            </>
          )}
        </button>

        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#8D8D8D]">
          <Sparkle size={13} />
          <span>
            {plan.id === 'free'
              ? 'Exploracion inicial del sistema'
              : 'Activacion mediante checkout seguro'}
          </span>
        </div>
      </div>
    </article>
  );
};

export default PlanCard;