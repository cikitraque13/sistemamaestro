import React from 'react';

const cards = [
  {
    eyebrow: 'Entrada',
    title: 'Empieza con una idea o una web',
    text: 'El sistema interpreta el punto de partida y lo convierte en una lectura util.',
    classes:
      'border-amber-500/15 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02))]',
  },
  {
    eyebrow: 'Ruta',
    title: 'Recibe foco y siguiente paso',
    text: 'Ordena prioridades y prepara una entrada seria al sistema.',
    classes:
      'border-cyan-500/15 bg-[linear-gradient(180deg,rgba(6,182,212,0.08),rgba(255,255,255,0.02))]',
  },
  {
    eyebrow: 'Continuidad',
    title: 'Construye, despliega y sigue',
    text: 'Te mete en una ruta real de proyecto, no en una demo suelta.',
    classes:
      'border-fuchsia-500/15 bg-[linear-gradient(180deg,rgba(244,114,182,0.08),rgba(255,255,255,0.02))]',
  },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden px-6 pb-6 pt-8 md:px-10 md:pb-8 md:pt-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(245,158,11,0.10),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(244,114,182,0.08),transparent_20%)]" />

      <div className="relative mx-auto grid max-w-7xl items-start gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Sistema Maestro
          </p>

          <h1 className="max-w-[11ch] text-[3rem] font-semibold leading-[0.9] tracking-tight text-white md:text-[4.05rem]">
            Dirige y acelera proyectos digitales con inteligencia artificial y criterio
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300 md:text-[1.08rem] md:leading-8">
            Sistema Maestro interpreta tu idea o tu web, ordena prioridades y te mete en una ruta
            real de construccion, despliegue y continuidad.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-5">
          <div className="space-y-3">
            {cards.map((card) => (
              <div
                key={card.eyebrow}
                className={`rounded-[20px] border p-4 ${card.classes}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {card.eyebrow}
                </p>
                <h3 className="mt-2 text-[1.4rem] font-semibold leading-tight text-white md:text-[1.5rem]">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {card.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href="#constructor-maestro"
              className="inline-flex items-center justify-center rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#FFF2CC_0%,#F2B45A_58%,#F472B6_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_26px_rgba(245,158,11,0.16)] transition hover:scale-[1.01]"
            >
              Pon tu idea
            </a>

            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Ver como entra al sistema
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;