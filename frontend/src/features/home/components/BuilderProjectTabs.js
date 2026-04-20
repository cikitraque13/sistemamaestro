import React from 'react';

const accentClasses = {
  cyan: 'bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.45)]',
  emerald: 'bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.45)]',
  violet: 'bg-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.45)]',
};

const BuilderProjectTabs = ({ items = [], activeId, onChange }) => {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1">
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange?.(item.id)}
            className={`group inline-flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              isActive
                ? 'border-white/30 bg-white/8 text-white shadow-[0_0_30px_rgba(255,255,255,0.06)]'
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
            <span className="ml-1 text-xs text-zinc-500 transition group-hover:text-zinc-300">
              ▾
            </span>
          </button>
        );
      })}

      <button
        type="button"
        className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-black/20 text-xl font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        aria-label="Nuevo proyecto"
      >
        +
      </button>
    </div>
  );
};

export default BuilderProjectTabs;