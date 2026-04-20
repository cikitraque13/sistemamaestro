import React from 'react';

const BuilderFlowPreview = ({ items = [] }) => {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 md:p-7">
      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Lo que activa el sistema
        </p>
        <h3 className="text-xl font-semibold text-white">
          Una secuencia pensada para interpretar, ordenar y preparar el siguiente paso.
        </h3>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-2xl border border-zinc-800 bg-black/30 p-4"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-sm font-semibold text-zinc-300">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">{item.title}</h4>
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

export default BuilderFlowPreview;