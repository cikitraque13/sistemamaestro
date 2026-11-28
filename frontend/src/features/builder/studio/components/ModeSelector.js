import React, { useState } from 'react';
import { Lightning } from '@phosphor-icons/react';

import { PACE_OPTIONS, paceLabel } from '../model';

export default function ModeSelector({ pace = 'rapido', onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        data-testid="builder-pace-button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 bg-transparent px-1 text-sm text-white"
      >
        <Lightning size={14} weight="fill" aria-hidden="true" />
        <span>{paceLabel(pace)}</span>
      </button>
      {open ? (
        <div role="menu" data-testid="builder-pace-menu" className="absolute bottom-9 left-0 z-20 w-64 rounded-xl border border-[#2a2a2d] bg-[#111113] p-2 text-sm shadow-lg">
          {PACE_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="block w-full rounded-lg px-2 py-1.5 text-left text-white hover:bg-[#1e1e20]"
              onClick={() => { onChange?.(item.id); setOpen(false); }}
            >
              {paceLabel(item.id)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
