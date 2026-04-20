import React from 'react';

const BuilderCreditBar = ({
  credits = 120,
  bonus = 25,
  usageLabel = 'Consumo estimado controlado',
}) => {
  const total = credits + bonus;
  const progress = Math.min((credits / Math.max(total, 1)) * 100, 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 shadow-[0_0_24px_rgba(255,255,255,0.04)]">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Créditos
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {credits} disponibles
            <span className="ml-2 text-zinc-400">+ {bonus} bonus</span>
          </p>
        </div>

        <div className="min-w-[180px] flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">{usageLabel}</p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-black/30 px-4 py-2 text-xs font-semibold text-white transition hover:border-zinc-500"
        >
          Ampliar créditos
        </button>
      </div>
    </div>
  );
};

export default BuilderCreditBar;