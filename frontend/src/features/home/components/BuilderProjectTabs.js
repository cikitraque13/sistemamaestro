import React from 'react';

const accentClasses = {
  cyan: 'bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.45)]',
  emerald: 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.45)]',
  violet: 'bg-violet-400 shadow-[0_0_16px_rgba(167,139,250,0.45)]',
};

const BuilderProjectTabs = ({ items = [], activeId, onChange }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
      <div className="flex items-center gap-2 overflow-x-auto">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange?.(item.id)}
              className={`group inline-flex min-w-[190px] shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-white/20 bg-white/8 text-white shadow-[0_0_24px_rgba(255,255,255,0.05)]'
                  : 'border-zinc-800 bg-black/25 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              <span
                className={`h-3 w-3 rounded-full ${
                  accentClasses[item.accent] || accentClasses.cyan
                }`}
              />
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  {item.status}
                </span>
              </span>
              <span className="ml-auto text-xs text-zinc-500 transition group-hover:text-zinc-300">
                ▾
              </span>
            </button>
          );
        })}

        <button
          type="button"
          className="inline-flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-black/20 text-xl font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          aria-label="Nuevo proyecto"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default BuilderProjectTabs;