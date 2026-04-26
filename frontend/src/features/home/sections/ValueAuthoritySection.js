import React from 'react';

const cards = [
  {
    eyebrow: 'Construye',
    title: 'Convierte una idea en una base real de proyecto',
    text: 'No se limita a describir. Ordena una idea o una URL para dejarla lista para avanzar con mas sentido.',
    classes: 'border-cyan-500/15 bg-cyan-500/10',
  },
  {
    eyebrow: 'Despliega',
    title: 'Prepara salida y despliegue en la nube',
    text: 'El sistema no se queda encerrado. El proyecto puede avanzar hacia una salida real cuando toque.',
    classes: 'border-emerald-500/15 bg-emerald-500/10',
  },
  {
    eyebrow: 'Extrae',
    title: 'Saca tu proyecto y sigue con continuidad',
    text: 'Si quieres extraccion o una operacion premium, el sistema tambien lo contempla dentro de su economia.',
    classes: 'border-fuchsia-500/15 bg-fuchsia-500/10',
  },
];

const ValueAuthoritySection = () => {
  return (
    <section className="relative overflow-hidden px-6 py-14 md:px-10 md:py-18">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.05),transparent_18%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.05),transparent_18%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Lo que hace de verdad
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[3.8rem] md:leading-[0.96]">
            Analiza, construye, despliega y mantiene continuidad real.
          </h2>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
            La promesa no es solo analizar. La promesa es meter al usuario dentro de una ruta seria
            de proyecto, construccion y salida.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.eyebrow}
              className={`rounded-[28px] border p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${card.classes}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {card.eyebrow}
              </p>

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