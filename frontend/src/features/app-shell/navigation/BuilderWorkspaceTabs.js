import React from 'react';

const BuilderWorkspaceTabs = ({ items = [], activeId, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange?.(item.id)}
            className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? 'border-white/30 bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.08)]'
                : 'border-zinc-700 bg-black/20 text-white hover:border-zinc-500'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default BuilderWorkspaceTabs;