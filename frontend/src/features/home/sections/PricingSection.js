import React from 'react';
import { Link } from 'react-router-dom';
import {
  entryOffer,
  pricingPlans,
  pricingSection,
  pricingTrustSignals
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
        <div className="rounded-[34px] border border-amber-500/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_28%),linear-gradient(180deg,#18120B_0%,#0B0A09_100%)] p-6 shadow-[0_0_40px_rgba(245,158,11,0.10)] md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-amber-200">
                  Informe Maestro Gold
                </span>
                <span className="inline-flex rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-fuchsia-200">
                  10 gemas iniciales
                </span>
              </div>

              <h2 className="mt-5 max-w-[13ch] text-4xl font-semibold leading-[0.95] tracking-tight text-white md:text-[4.3rem]">
                Valida una oportunidad y entra al sistema con dirección.
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#F4E8D2]">
                No es un PDF suelto. Es una primera lectura útil, un enfoque inicial,
                un prompt de arranque y 10 gemas iniciales para empezar en Builder.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {entryOffer.billingHighlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-amber-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col rounded-[28px] border border-white/8 bg-black/35 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Activación puntual
              </p>

              <div className="mt-4 flex items-end gap-3">
                <span className="text-5xl font-light text-white">
                  {entryOffer.priceLabel}
                </span>
                <span className="pb-1 text-zinc-400">pago único</span>
              </div>

              <ul className="mt-6 space-y-3">
                {entryOffer.features.map((feature) => (
                  <li key={feature} className="text-sm leading-6 text-zinc-200">
                    • {feature}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="mt-6 inline-flex items-center justify-center rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#FFF2CC_0%,#F2B45A_58%,#F472B6_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_28px_rgba(245,158,11,0.18)] transition hover:scale-[1.01]"
              >
                Entrar y validar con 10 gemas
              </Link>
            </div>
          </div>
        </div>

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

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-6 shadow-[0_0_40px_rgba(6,182,212,0.06)]">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-300/10 blur-3xl" />

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/70">
                Gema Maestra
              </p>

              <h4 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Capacidad operativa visible.
              </h4>

              <p className="mt-4 text-sm leading-7 text-zinc-300">
                Las gemas muestran el margen real disponible para construir, iterar y avanzar
                dentro de Sistema Maestro. No escondemos la capacidad: la hacemos visible para que
                el usuario entienda cuándo puede probar, cuándo debe continuar y cuándo conviene escalar.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Inicio
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">10 gemas</p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Continuidad
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">Pro y Growth</p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Escala
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">AI Master</p>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-6 shadow-[0_0_40px_rgba(255,255,255,0.035)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Señales de confianza
              </p>

              <h4 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Un modelo claro antes de pedir más.
              </h4>

              <div className="mt-5 grid gap-3">
                {pricingTrustSignals.slice(0, 4).map((signal, index) => (
                  <div
                    key={signal}
                    className="flex items-start gap-4 rounded-2xl border border-white/8 bg-black/25 p-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10 text-xs font-semibold text-emerald-100">
                      {index + 1}
                    </span>

                    <p className="text-sm leading-6 text-zinc-200">
                      {signal}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;