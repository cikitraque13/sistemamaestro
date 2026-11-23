import React from 'react';

const HomeTypeTabs = ({ items = [], activeId, onChange, visible = true }) => {
  if (!visible) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange?.(item.id)}
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'border-white bg-white text-black'
                  : 'border-zinc-700 bg-transparent text-white hover:border-zinc-500'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HomeTypeTabs;
