import React, { useState } from 'react';

import { PACE_OPTIONS, paceLabel } from '../model';

function Bolt() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path fill="#e2725b" d="M9.2 1.2 3.4 9h3.2L6.4 14.8 12.6 7H9.2L9.2 1.2z" />
    </svg>
  );
}

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
        className="mode-label"
      >
        <Bolt />
        <span>{paceLabel(pace)}</span>
      </button>
      {open ? (
        <div role="menu" data-testid="builder-pace-menu" className="absolute bottom-9 left-0 z-20 w-64 rounded-xl border border-[#2a2a2a] bg-[#111] p-2 text-sm shadow-lg">
          {PACE_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="block w-full rounded-lg px-2 py-1.5 text-left text-white hover:bg-[#1a1a1a]"
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
