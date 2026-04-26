import React from 'react';

const tones = [
  'border-amber-500/16',
  'border-cyan-500/16',
  'border-emerald-500/16',
  'border-fuchsia-500/16',
];

const HomeOutputsPreview = ({ items = [] }) => {
  return (
    <div className="rounded-[34px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Que obtienes primero
        </p>

        <h3 className="mt-3 text-xl font-semibold leading-tight text-white">
          El sistema devuelve una base util para avanzar, no un informe muerto.
        </h3>
      </div>

      <div className="grid gap-4">
        {items.map((item, index) => (
          <article
            key={item.id}
            className={`rounded-[24px] border bg-black/28 p-4 ${tones[index % tones.length]}`}
          >
            <h4 className="text-lg font-semibold text-white">{item.title}</h4>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default HomeOutputsPreview;