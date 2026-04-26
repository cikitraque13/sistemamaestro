import React from 'react';

const items = [
  { label: 'Direccion', tone: 'neutral' },
  { label: 'SEO', tone: 'blue' },
  { label: 'Conversion', tone: 'amber' },
  { label: 'IA', tone: 'green' },
  { label: 'Arquitectura', tone: 'blue' },
  { label: 'Continuidad', tone: 'pink' },
];

const toneClasses = {
  neutral: 'border-zinc-700 bg-zinc-900/80 text-zinc-200',
  blue: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
  pink: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200',
};

const HomeCapabilityChips = () => {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <span
          key={item.label}
          className={`rounded-full border px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] ${toneClasses[item.tone]}`}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
};

export default HomeCapabilityChips;