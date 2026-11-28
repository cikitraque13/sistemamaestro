import React, { useState } from 'react';

const PHASE_LABEL = {
  idle: 'Listo',
  construyendo: 'Construyendo',
  iterando: 'Iterando',
  error: 'Error',
  completado: 'Completado',
};

const STEP_MARK = {
  pending: '·',
  in_progress: '…',
  done: '✓',
  error: '!',
};

export default function ExecutorChat({
  phase = 'idle',
  message = 'El ejecutor está listo.',
  steps = [],
  log = [],
  slow = false,
  onSubmit,
}) {
  const [draft, setDraft] = useState('');
  const canSubmit = draft.trim().length > 0 && typeof onSubmit === 'function' && phase !== 'construyendo' && phase !== 'iterando';

  const send = () => {
    const value = draft.trim();
    if (!value || !canSubmit) return;
    onSubmit(value);
    setDraft('');
  };

  return (
    <section aria-label="Ejecutor" className="flex min-h-[280px] flex-col rounded-2xl border border-white/10 bg-black/30">
      <header className="border-b border-white/10 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100">Ejecutor</p>
        <p className="mt-1 text-sm text-zinc-200" role="status">{PHASE_LABEL[phase] || phase}. {message}</p>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-3 py-2">
        {log.map((item, index) => (
          <p key={`${item.role}-${index}`} className={item.role === 'user' ? 'text-sm text-white' : 'text-sm text-zinc-300'}>
            {item.role === 'user' ? 'Tú: ' : 'Ejecutor: '}{item.text}
          </p>
        ))}
        <ul aria-label="Pasos del ejecutor" className="space-y-1">
          {steps.map((step) => (
            <li key={step.id} className="text-xs leading-5 text-zinc-300">
              <span className="mr-1 text-cyan-200">{STEP_MARK[step.status] || '·'}</span>
              {step.label}
              {step.status === 'in_progress' && slow ? ' · sigue trabajando…' : ''}
              {step.summary ? <span className="block text-zinc-400">{step.summary}</span> : null}
            </li>
          ))}
        </ul>
      </div>
      <form
        className="flex items-center gap-2 border-t border-white/10 p-2"
        onSubmit={(event) => { event.preventDefault(); send(); }}
      >
        <input
          aria-label="Mensaje para el ejecutor"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Pide un cambio de la página"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
        />
        <button type="submit" disabled={!canSubmit} className="rounded-full bg-cyan-200/90 px-3 py-2 text-xs font-semibold text-black disabled:opacity-40">
          Enviar
        </button>
      </form>
    </section>
  );
}
