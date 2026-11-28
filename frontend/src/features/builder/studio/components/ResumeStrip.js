import React from 'react';

export default function ResumeStrip({ phase = 'static', onResume }) {
  const resuming = phase === 'resuming';
  return (
    <div data-testid="builder-resume-strip" className="flex h-10 items-center gap-2 border-t border-[#2a2a2d] bg-[#0b0b0c] px-3 text-xs text-[#f2f2f2]">
      <p className="min-w-0 flex-1 truncate">Estás viendo una vista previa estática. Reanuda para interactuar con tu sitio web.</p>
      <button
        type="button"
        onClick={onResume}
        disabled={resuming}
        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#f2f2f2] px-3 font-semibold text-[#111113] disabled:opacity-70"
      >
        {resuming ? <span aria-hidden="true" className="inline-block h-3 w-3 animate-spin rounded-full border border-[#111113] border-t-transparent" /> : null}
        {resuming ? 'Reanudando…' : 'Reanudar'}
      </button>
    </div>
  );
}
