import React from 'react';
import problemItems from '../data/problemItems';

const ProblemSection = () => {
  return (
    <section className="px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Qué resuelve
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            El problema no suele ser la falta de ideas. Suele ser el caos entre herramientas, prioridades y ejecución.
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-300 md:text-lg">
            Sistema Maestro entra justo ahí: donde la web, el SEO, la conversión, la IA y la monetización todavía no están trabajando como un solo sistema.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {problemItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;