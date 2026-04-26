import React from 'react';
import { Link } from 'react-router-dom';

const plans = [
  {
    id: 'pro',
    name: 'Pro',
    price: '29 EUR',
    period: '/mes',
    description: 'Entrada seria al sistema con base operativa y capacidad inicial.',
    points: ['Acceso al sistema', 'Base de trabajo', 'Creditos incluidos'],
    classes: 'border-emerald-500/18 bg-emerald-500/10',
    button: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '79 EUR',
    period: '/mes',
    description: 'Mas builder, mas continuidad y mas margen para iterar con el proyecto.',
    points: ['Builder vivo', 'Mas capacidad', 'Mas continuidad'],
    classes: 'border-cyan-500/18 bg-cyan-500/10',
    button: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15',
  },
  {
    id: 'master',
    name: 'AI Master',
    price: '199 EUR',
    period: '/mes',
    description: 'Capa superior para casos complejos, activacion fuerte y salida preparada.',
    points: ['Criterio premium', 'Builder avanzado', 'Preparacion seria'],
    classes: 'border-fuchsia-500/18 bg-fuchsia-500/10',
    button: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/15',
  },
];

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
                  Informe inicial 6,99
                </span>
                <span className="inline-flex rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-fuchsia-200">
                  10 creditos de entrada
                </span>
              </div>

              <h2 className="mt-5 max-w-[13ch] text-4xl font-semibold leading-[0.95] tracking-tight text-white md:text-[4.3rem]">
                Recibe tu informe inicial y entra al sistema con ventaja.
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#F4E8D2]">
                No vende un PDF suelto. Vende una primera lectura util, una idea o enfoque inicial,
                un prompt de arranque y 10 creditos para empezar dentro del sistema.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-amber-200">
                  Lectura inicial
                </span>
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-cyan-200">
                  Prompt de entrada
                </span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-emerald-200">
                  10 creditos
                </span>
              </div>
            </div>

            <div className="flex flex-col rounded-[28px] border border-white/8 bg-black/35 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Activacion inmediata
              </p>

              <div className="mt-4 flex items-end gap-3">
                <span className="text-5xl font-light text-white">6,99 EUR</span>
                <span className="pb-1 text-zinc-400">pago unico</span>
              </div>

              <ul className="mt-6 space-y-3">
                <li className="text-sm leading-6 text-zinc-200">• Informe inicial del caso</li>
                <li className="text-sm leading-6 text-zinc-200">• Primer enfoque o idea de negocio</li>
                <li className="text-sm leading-6 text-zinc-200">• Prompt maestro de arranque</li>
                <li className="text-sm leading-6 text-zinc-200">• 10 creditos para entrar</li>
              </ul>

              <a
                href="#radar-ia"
                className="mt-6 inline-flex items-center justify-center rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#FFF2CC_0%,#F2B45A_58%,#F472B6_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_28px_rgba(245,158,11,0.18)] transition hover:scale-[1.01]"
              >
                Recibir informe + 10 creditos
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Planes y creditos
            </p>

            <h3 className="text-3xl font-semibold tracking-tight text-white md:text-[3.5rem] md:leading-[0.96]">
              Tu plan te abre el sistema. Tus creditos te dan capacidad para construir, iterar y desplegar.
            </h3>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
              El plan te da acceso y una base inicial. Si necesitas mas recorrido, recargas creditos y sigues
              trabajando sin perder continuidad.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`rounded-[28px] border p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${plan.classes}`}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                  {plan.name}
                </p>

                <div className="mt-4 flex items-end gap-2">
                  <h4 className="text-4xl font-semibold text-white">{plan.price}</h4>
                  <span className="pb-1 text-zinc-400">{plan.period}</span>
                </div>

                <p className="mt-4 text-sm leading-7 text-zinc-200">
                  {plan.description}
                </p>

                <ul className="mt-6 space-y-3">
                  {plan.points.map((point) => (
                    <li key={point} className="text-sm leading-6 text-zinc-100">
                      • {point}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${plan.button}`}
                >
                  Entrar al sistema
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] border border-white/6 bg-white/[0.02] p-5">
            <p className="text-sm leading-7 text-zinc-300">
              <span className="font-semibold text-white">Escala de creditos:</span> construir, iterar,
              activar operaciones premium, desplegar o extraer proyecto consume capacidad. Cuando se te
              acaban, recargas y sigues dentro del sistema.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;