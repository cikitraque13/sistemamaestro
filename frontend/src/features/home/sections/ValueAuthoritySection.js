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
    <div id="como-funciona" className="relative scroll-mt-24 pt-6 xl:pt-1">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
        Lo que hace de verdad
      </p>

      <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[2.6rem] md:leading-[1.02] xl:text-[2rem] xl:leading-[1.08]">
        Analiza, construye, despliega y mantiene continuidad real.
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.eyebrow}
            className={`rounded-[24px] border p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${card.classes}`}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-xs font-semibold text-white">
                {card.step}
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {card.eyebrow}
              </p>
            </div>

            <h3 className="mt-3 text-lg font-semibold leading-snug text-white">
              {card.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-200">
              {card.text}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ValueAuthoritySection;
