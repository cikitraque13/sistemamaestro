import React from 'react';
import { ArrowUp, Microphone, Plus } from '@phosphor-icons/react';

import ModeSelector from './ModeSelector';

export default function Composer({
  draft = '',
  pace = 'rapido',
  canSend = false,
  attachmentNote = '',
  micNote = '',
  onDraft,
  onPace,
  onSubmit,
  onAttach,
  onMic,
}) {
  return (
    <form
      className="m-4 rounded-2xl border border-[#2a2a2d] bg-[#161618] p-3"
      onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }}
    >
      <textarea
        aria-label="Mensaje para el ejecutor"
        data-testid="builder-executor-input"
        value={draft}
        rows={3}
        onChange={(event) => onDraft?.(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSubmit?.();
          }
        }}
        placeholder="Esperando tu próximo mensaje"
        className="min-h-[4.5rem] w-full resize-none bg-transparent text-sm text-[#f2f2f2] outline-none placeholder:text-[#9a9a9a]"
      />
      {attachmentNote ? <p role="status" className="mt-1 text-xs text-[#9a9a9a]">{attachmentNote}</p> : null}
      {micNote ? <p role="status" className="mt-1 text-xs text-[#9a9a9a]">{micNote}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Adjuntar"
          onClick={onAttach}
          className="grid h-8 w-8 place-items-center rounded-lg border border-[#2a2a2d] text-[#f2f2f2]"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
        <ModeSelector pace={pace} onChange={onPace} />
        <div className="ml-auto flex items-center gap-1">
          <button type="button" aria-label="Micrófono" onClick={onMic} className="grid h-8 w-8 place-items-center text-[#f2f2f2]">
            <Microphone size={16} aria-hidden="true" />
          </button>
          <button
            type="submit"
            aria-label="Enviar"
            disabled={!canSend}
            className={`grid h-8 w-8 place-items-center rounded-full ${canSend ? 'bg-white text-[#111113]' : 'bg-[#2a2a2d] text-[#9a9a9a]'}`}
          >
            <ArrowUp size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </form>
  );
}
