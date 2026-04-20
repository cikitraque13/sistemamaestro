import React from 'react';

const BuilderOutputsPreview = ({ items = [] }) => {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 md:p-7">
      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Qué obtienes
        </p>
        <h3 className="text-xl font-semibold text-white">
          El sistema no se queda en una lectura superficial. Devuelve una base útil para avanzar.
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-zinc-800 bg-black/30 p-4"
          >
            <h4 className="text-base font-semibold text-white">{item.title}</h4>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default BuilderOutputsPreview;