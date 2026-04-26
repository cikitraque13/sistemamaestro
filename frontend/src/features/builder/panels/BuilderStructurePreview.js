import React, { useMemo } from 'react';

const structures = {
  create: {
    website: ['Hero', 'Builder', 'Audience', 'Problems', 'Outcomes', 'Pricing'],
    tool: ['Workspace', 'Projects', 'Credits', 'Builder', 'Deploy', 'Control'],
    app: ['Landing', 'Auth', 'Dashboard', 'Projects', 'Billing', 'Settings'],
  },
  improve: {
    default: ['Audit', 'Fricciones', 'Prioridades', 'Reestructura', 'CTA', 'Release'],
  },
  scale: {
    default: ['Inputs', 'Automatización', 'Rutas', 'Control', 'Deploy', 'Growth'],
  },
};

const BuilderStructurePreview = ({ activeIntent, activeType, projectLabel }) => {
  const items = useMemo(() => {
    if (activeIntent === 'create') {
      return structures.create[activeType] || structures.create.website;
    }

    if (activeIntent === 'improve') {
      return structures.improve.default;
    }

    return structures.scale.default;
  }, [activeIntent, activeType]);

  return (
    <div className="h-full rounded-[28px] border border-white/10 bg-[#0a0a11] p-5 shadow-[0_0_40px_rgba(34,197,94,0.06)] md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Estructura
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Mapa compacto del sistema
          </h3>
          <p className="mt-1 text-xs text-zinc-500">{projectLabel}</p>
        </div>

        <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
          System map
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={item}
            className="rounded-2xl border border-zinc-800 bg-black/35 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {String(index + 1).padStart(2, '0')}
            </p>
            <p className="mt-2 text-sm font-semibold text-white">{item}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/35 p-4">
        <p className="text-sm leading-6 text-zinc-300">
          El sistema no construye piezas sueltas. Ordena módulos, prioridades y continuidad para que el proyecto tenga más estabilidad y menos fricción futura.
        </p>
      </div>
    </div>
  );
};

export default BuilderStructurePreview;