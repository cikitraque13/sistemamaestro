import React from 'react';
import capabilityItems from '../data/capabilityItems';

const CapabilitiesSection = () => {
  return (
    <section className="px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Capacidades del sistema
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            No es una suma de funciones sueltas. Es una capa de sistema orientada a analizar, construir y hacer avanzar proyectos digitales.
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-300 md:text-lg">
            Las capacidades importan porque reducen fricción, mejoran el criterio y conectan mejor el análisis con la ejecución.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {capabilityItems.map((item) => (
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

export default CapabilitiesSection;