import React, { useEffect, useRef, useState } from 'react';
import { streamTerminalState } from '../api/builderPreviewClient';

export { streamTerminalState };

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

const SUGGESTIONS = [
  'Escribe la página de mi negocio',
  'Quiero una landing para pedir cita',
  'Explica el servicio y el siguiente paso',
];

export function executorStatusText(phase, message) {
  const label = PHASE_LABEL[phase] || phase || 'Listo';
  const detail = message || 'El ejecutor está listo.';
  return `${label}. ${detail}`;
}

function Thinking({ slow }) {
  return (
    <div data-testid="builder-thinking" className="flex items-start gap-2" role="status">
      <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[9px] font-semibold tracking-wide text-cyan-100">
        SM
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-100">
          Pensando
          <span className="inline-flex w-6 justify-start" aria-hidden="true">
            <span className="animate-bounce [animation-delay:0ms]">.</span>
            <span className="animate-bounce [animation-delay:150ms]">.</span>
            <span className="animate-bounce [animation-delay:300ms]">.</span>
          </span>
        </p>
        <span className="mt-2 block h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
        </span>
        {slow ? <p className="mt-1 text-xs text-amber-100">sigue trabajando…</p> : null}
      </div>
    </div>
  );
}

export default function ExecutorChat({
  phase = 'idle',
  message = 'El ejecutor está listo.',
  steps = [],
  log = [],
  slow = false,
  onSubmit,
}) {
  const [draft, setDraft] = useState('');
  const threadRef = useRef(null);
  const thinking = phase === 'construyendo' || phase === 'iterando';
  const canSubmit = draft.trim().length > 0 && typeof onSubmit === 'function' && !thinking;
  const showSuggestions = phase === 'idle' && log.length === 0;

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    if (typeof node.scrollTo === 'function') node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
    else node.scrollTop = node.scrollHeight;
  }, [log, steps, phase, message, thinking]);

  const send = (value) => {
    const text = String(value || '').trim();
    if (!text || typeof onSubmit !== 'function' || thinking) return;
    onSubmit(text);
    setDraft('');
  };

  return (
    <section aria-label="Ejecutor" className="flex h-full min-h-[11rem] min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0">
      <header className="shrink-0 border-b border-white/10 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100">Ejecutor</p>
        <p className="mt-1 text-sm font-medium text-zinc-200" role="status">{executorStatusText(phase, message)}</p>
      </header>
      <div
        ref={threadRef}
        data-testid="builder-executor-thread"
        className="min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-3 py-3"
      >
        {showSuggestions ? (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                data-testid="builder-suggestion"
                onClick={() => send(suggestion)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs font-medium text-zinc-200 hover:bg-white/10"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
        {log.map((item, index) => (
          item.role === 'user' ? (
            <p
              key={`user-${index}`}
              data-testid="builder-user-bubble"
              className="ml-8 rounded-2xl rounded-br-md bg-cyan-200/90 px-3 py-2 text-right text-sm font-semibold text-black"
            >
              {item.text}
            </p>
          ) : (
            <div key={`agent-${index}`} data-testid="builder-agent-message" className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[9px] font-semibold tracking-wide text-cyan-100">
                SM
              </span>
              <p className="min-w-0 flex-1 text-sm font-normal leading-6 text-zinc-200">{item.text}</p>
            </div>
          )
        ))}
        {steps.length ? (
          <ul aria-label="Pasos del ejecutor" className="space-y-1 pl-8">
            {steps.map((step) => (
              <li key={step.id} className="text-xs font-medium leading-5 text-zinc-400">
                <span className="mr-1 text-cyan-200">{STEP_MARK[step.status] || '·'}</span>
                {step.label}
                {step.status === 'in_progress' && slow ? ' · sigue trabajando…' : ''}
                {step.summary ? <span className="mt-0.5 block font-normal text-zinc-500">{step.summary}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {thinking ? <Thinking slow={slow} /> : null}
      </div>
      <form
        className="flex shrink-0 items-center gap-2 border-t border-white/10 p-2"
        onSubmit={(event) => { event.preventDefault(); send(draft); }}
      >
        <input
          aria-label="Mensaje para el ejecutor"
          data-testid="builder-executor-input"
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
