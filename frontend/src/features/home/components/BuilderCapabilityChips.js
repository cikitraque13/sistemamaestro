import React from 'react';

const defaultItems = ['SEO', 'Conversión', 'IA', 'Arquitectura', 'Código', 'Deploy', 'Seguridad'];

const BuilderCapabilityChips = ({ items = defaultItems }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-zinc-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
};

export default BuilderCapabilityChips;