import React from 'react';
import { Copy, ThumbsDown, ThumbsUp } from '@phosphor-icons/react';

import { finishedStamp, narrateSteps } from '../model';
import MarkdownMessage from './MarkdownMessage';

const SUGGESTIONS = [
  'Escribe la página de mi negocio',
  'Quiero una landing para pedir cita',
  'Explica el servicio y el siguiente paso',
];

function MessageActions({ id, text, reaction, onReact, onCopy }) {
  return (
    <div className="fb">
      <button type="button" aria-label="Me gusta" aria-pressed={reaction === 'up'} onClick={() => onReact(id, 'up')}>
        <ThumbsUp size={15} aria-hidden="true" />
      </button>
      <button type="button" aria-label="No me gusta" aria-pressed={reaction === 'down'} onClick={() => onReact(id, 'down')}>
        <ThumbsDown size={15} aria-hidden="true" />
      </button>
      <button type="button" aria-label="Copiar mensaje" onClick={() => onCopy(text)}>
        <Copy size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function MessageList({
  log = [],
  steps = [],
  phase = 'idle',
  message = '',
  slow = false,
  preview = null,
  reactions = {},
  onSuggest,
  onReact,
  onCopy,
  threadRef,
  onScroll,
}) {
  const thinking = phase === 'construyendo' || phase === 'iterando';
  const narration = narrateSteps(steps);
  const stamp = phase === 'completado'
    ? finishedStamp(preview?.versions?.[preview.versions.length - 1]?.createdAt)
    : '';
  const showSuggestions = phase === 'idle' && log.length === 0 && !steps.length;

  return (
    <div
      ref={threadRef}
      data-testid="builder-executor-thread"
      onScroll={onScroll}
      className="studio-thread"
    >
      {showSuggestions ? (
        <div className="studio-suggest">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              data-testid="builder-suggestion"
              onClick={() => onSuggest?.(suggestion)}
              className="rounded-full border border-[#2a2a2d] bg-[#161618] px-3 py-1.5 text-left text-xs text-[#f2f2f2]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      {log.map((item, index) => (
        item.role === 'user' ? (
          <p key={`user-${index}`} data-testid="builder-user-bubble" className="u">
            {item.text}
          </p>
        ) : (
          <div key={`agent-${index}`} data-testid="builder-agent-message">
            <div className="md"><MarkdownMessage text={item.text} /></div>
            <MessageActions id={`log-${index}`} text={item.text} reaction={reactions[`log-${index}`]} onReact={onReact} onCopy={onCopy} />
          </div>
        )
      ))}
      {narration ? (
        <div data-testid="builder-agent-steps">
          <MarkdownMessage text={narration} />
          <MessageActions id="steps" text={narration} reaction={reactions.steps} onReact={onReact} onCopy={onCopy} />
        </div>
      ) : null}
      {thinking ? (
        <div data-testid="builder-thinking" role="status" className="text-sm text-[#f2f2f2]">
          <p>Pensando…</p>
          {message ? <p className="mt-1 text-[#9a9a9a]">{message}</p> : null}
          {slow ? <p className="mt-1 text-xs text-[#9a9a9a]">sigue trabajando…</p> : null}
        </div>
      ) : null}
      {phase === 'error' && message ? (
        <p role="alert" className="text-sm text-[#f2f2f2]">{message}</p>
      ) : null}
      {phase === 'completado' ? (
        <>
          <div data-testid="builder-agent-finished" className="done"><i /><b>Agente terminado</b><i /></div>
          {stamp ? <div className="date">{stamp}</div> : null}
        </>
      ) : null}
    </div>
  );
}
