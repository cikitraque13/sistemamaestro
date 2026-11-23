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

const PricingSection = () => {
  return (
    <section id="pricing" className="relative overflow-hidden px-6 py-14 md:px-10 md:py-18">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(245,158,11,0.12),transparent_22%),radial-gradient(circle_at_80%_18%,rgba(244,114,182,0.06),transparent_18%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mt-10">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
              {pricingSection.eyebrow}
            </p>

            <h3 className="text-3xl font-semibold tracking-tight text-white md:text-[3.5rem] md:leading-[0.96]">
              {pricingSection.title}
            </h3>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
              La suscripción abre el sistema. Las Gemas Maestras expresan tu capacidad
              operativa para construir, iterar y avanzar sin perder continuidad.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {visiblePlans.map((plan) => {
              const tone = getTone(plan.id);

              return (
                <article
                  key={plan.id}
                  className={`flex min-h-[560px] flex-col rounded-[28px] border p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${tone.card}`}
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

                  <ul className="mt-6 space-y-3">
                    {plan.billingHighlights.map((point) => (
                      <li key={point} className="text-sm leading-6 text-zinc-100">
                        • {point}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/register"
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
    </section>
  );
};

export default PricingSection;