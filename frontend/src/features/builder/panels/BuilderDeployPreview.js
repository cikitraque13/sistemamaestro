import React from 'react';

const BuilderDeployPreview = ({ projectLabel }) => {
  return (
    <div className="h-full rounded-[28px] border border-white/10 bg-[#0a0a11] p-5 shadow-[0_0_40px_rgba(168,85,247,0.07)] md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Deploy
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Ruta de salida y preparación
          </h3>
          <p className="mt-1 text-xs text-zinc-500">{projectLabel}</p>
        </div>

        <div className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
          Ready path
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-black/35 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Entorno
          </p>
          <p className="mt-2 text-sm font-semibold text-white">Producción preparada</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Configuración estable, validación previa y salida lista para siguiente fase.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/35 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Release path
          </p>
          <p className="mt-2 text-sm font-semibold text-white">Build → Validate → Release</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            El sistema prepara una secuencia limpia para evitar saltos y reducir fricción.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/35 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Checks
        </p>

        <div className="mt-4 space-y-3">
          {[
            'Estructura validada',
            'Continuidad de CTA revisada',
            'Salida lista para despliegue',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-sm text-zinc-300">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuilderDeployPreview;