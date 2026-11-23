import React from 'react';

const tones = [
  'border-amber-500/18 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02))] text-amber-200',
  'border-emerald-500/18 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.02))] text-emerald-200',
  'border-cyan-500/18 bg-[linear-gradient(180deg,rgba(6,182,212,0.08),rgba(255,255,255,0.02))] text-cyan-200',
  'border-fuchsia-500/18 bg-[linear-gradient(180deg,rgba(244,114,182,0.08),rgba(255,255,255,0.02))] text-fuchsia-200',
];

const HomeFlowPreview = ({ items = [] }) => {
  return (
    <div className="rounded-[34px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Recorrido inicial
        </p>

        <h3 className="mt-3 text-xl font-semibold leading-tight text-white">
          Una secuencia pensada para interpretar, ordenar y preparar el siguiente paso.
        </h3>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className="rounded-[24px] border border-white/8 bg-black/28 p-4"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${tones[index % tones.length]}`}
              >
                <span className="text-sm font-semibold">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div>
                <p className="text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeFlowPreview;