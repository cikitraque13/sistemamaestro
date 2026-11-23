import React from 'react';

const cards = [
  {
    step: '01',
    eyebrow: 'Analiza',
    title: 'Analiza y ordena prioridades',
    text: 'Sistema Maestro interpreta el contexto, detecta fricciones y organiza por dónde conviene avanzar primero.',
    classes: 'border-amber-500/15 bg-amber-500/10',
  },
  {
    step: '02',
    eyebrow: 'Construye',
    title: 'Convierte una idea en una base real de proyecto',
    text: 'No se limita a describir. Ordena una idea o una URL para dejarla lista para avanzar con más sentido.',
    classes: 'border-cyan-500/15 bg-cyan-500/10',
  },
  {
    step: '03',
    eyebrow: 'Despliega',
    title: 'Prepara salida y despliegue en la nube',
    text: 'El sistema no se queda encerrado. El proyecto puede avanzar hacia una salida real cuando toque.',
    classes: 'border-emerald-500/15 bg-emerald-500/10',
  },
  {
    step: '04',
    eyebrow: 'Extrae',
    title: 'Saca tu proyecto y sigue con continuidad',
    text: 'Si quieres extracción o una operación premium, el sistema también lo contempla dentro de su economía.',
    classes: 'border-fuchsia-500/15 bg-fuchsia-500/10',
  },
];

const ValueAuthoritySection = () => {
  return (
    <section id="como-funciona" className="relative overflow-hidden px-6 pb-14 pt-6 md:px-10 md:pb-18 md:pt-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.05),transparent_18%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.05),transparent_18%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Lo que hace de verdad
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[3.8rem] md:leading-[0.96]">
            Analiza, construye, despliega y mantiene continuidad real.
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.eyebrow}
              className={`rounded-[28px] border p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${card.classes}`}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/20 text-xs font-semibold text-white">
                  {card.step}
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  {card.eyebrow}
                </p>
              </div>

              <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">
                {card.title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-zinc-200">
                {card.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueAuthoritySection;