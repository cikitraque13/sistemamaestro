import React from 'react';

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
    <form className="composer" onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }}>
      <textarea
        aria-label="Mensaje para el ejecutor"
        data-testid="builder-executor-input"
        value={draft}
        rows={2}
        onChange={(event) => onDraft?.(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSubmit?.();
          }
        }}
        placeholder="Esperando tu próximo mensaje"
        className="ph"
      />
      {attachmentNote ? <p role="status" className="px-1 text-xs text-[#6b6b6b]">{attachmentNote}</p> : null}
      {micNote ? <p role="status" className="px-1 text-xs text-[#6b6b6b]">{micNote}</p> : null}
      <div className="crow">
        <button type="button" aria-label="Adjuntar" onClick={onAttach} className="sq">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M8 3.4v9.2M3.4 8h9.2" />
          </svg>
        </button>
        <ModeSelector pace={pace} onChange={onPace} />
        <span className="sp" />
        <button type="button" aria-label="Micrófono" onClick={onMic} className="mic">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M8 2.3c-1.15 0-2.05.9-2.05 2.05v3.3c0 1.15.9 2.05 2.05 2.05s2.05-.9 2.05-2.05v-3.3C10.05 3.2 9.15 2.3 8 2.3z" />
            <path d="M3.8 8.1a4.2 4.2 0 0 0 8.4 0M8 12.3v1.5M6.3 13.8h3.4" />
          </svg>
        </button>
        <button type="submit" aria-label="Enviar" disabled={!canSend} className={`send${canSend ? ' is-ready' : ''}`}>
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M8 12.4V3.7M4.3 7.1 8 3.4l3.7 3.7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
