import React from 'react';
import { Link } from 'react-router-dom';
import {
  pricingPlans,
  pricingSection
} from '../../../content/pricingContent';

const planToneClasses = {
  free: {
    card: 'border-white/10 bg-white/[0.025]',
    badge: 'border-white/10 bg-white/[0.04] text-zinc-200',
    button: 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07]'
  },
  blueprint: {
    card: 'border-emerald-500/18 bg-emerald-500/10',
    badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
    button: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15'
  },
  sistema: {
    card: 'border-cyan-500/18 bg-cyan-500/10',
    badge: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100',
    button: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15'
  },
  premium: {
    card: 'border-fuchsia-500/18 bg-fuchsia-500/10',
    badge: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-100',
    button: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/15'
  }
};

const planBadgeLabels = {
  free: 'Entrada',
  blueprint: 'Entrada seria',
  sistema: 'Núcleo',
  premium: 'Superior'
};

const visiblePlans = pricingPlans.filter((plan) =>
  ['free', 'blueprint', 'sistema', 'premium'].includes(plan.id)
);

const getTone = (planId) => planToneClasses[planId] || planToneClasses.free;

const HomePlansPanel = ({ id, onSelect }) => {
  return (
    <div
      id={id}
      className="absolute left-0 right-0 top-full max-h-[calc(100vh-5rem)] overflow-y-auto border-b border-white/10 bg-[#080808]/95 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-5 py-6 md:px-10 md:py-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
          {pricingSection.eyebrow}
        </p>

        <p className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          {pricingSection.title}
        </p>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
          La suscripción abre el sistema. Las Gemas Maestras expresan tu capacidad
          operativa para construir, iterar y avanzar sin perder continuidad.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visiblePlans.map((plan) => {
            const tone = getTone(plan.id);

            return (
              <article
                key={plan.id}
                className={`flex flex-col rounded-[28px] border p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${tone.card}`}
              >
                <div className="flex min-h-[42px] items-start justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                    {plan.visibleName}
                  </p>

                  <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tone.badge}`}>
                    {planBadgeLabels[plan.id] || plan.badge}
                  </span>
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <h4 className="text-4xl font-semibold text-white">
                    {plan.priceLabel}
                  </h4>
                  <span className="pb-1 text-zinc-400">{plan.periodLabel}</span>
                </div>

                <p className="mt-4 text-sm leading-7 text-zinc-200">
                  {plan.bestForShort || plan.description}
                </p>

                <ul className="mb-6 mt-5 space-y-3">
                  {plan.billingHighlights.map((point) => (
                    <li key={point} className="text-sm leading-6 text-zinc-100">
                      • {point}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  onClick={onSelect}
                  className={`mt-auto inline-flex w-full items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${tone.button}`}
                >
                  {plan.id === 'free' ? 'Probar gratis' : `Entrar en ${plan.visibleName}`}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomePlansPanel;
