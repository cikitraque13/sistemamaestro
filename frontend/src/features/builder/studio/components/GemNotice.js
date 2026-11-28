import React from 'react';
import { X } from '@phosphor-icons/react';

export default function GemNotice({ tone = 'normal', text = '', onDismiss }) {
  return (
    <div data-testid="builder-gem-notice" data-tone={tone} className="flex h-10 items-center gap-2 border-y border-[#2a2a2d] px-4 text-xs text-[#f2f2f2]">
      <p className="min-w-0 flex-1 truncate">{text}</p>
      <a
        href="/dashboard/billing"
        className="shrink-0 rounded-full bg-[#f5d90a] px-2 py-1 text-[11px] font-semibold text-black"
      >
        Mejorar plan
      </a>
      <button type="button" aria-label="Cerrar aviso de gemas" onClick={onDismiss} className="grid h-8 w-8 place-items-center text-[#9a9a9a]">
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
