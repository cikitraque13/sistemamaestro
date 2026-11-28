import React from 'react';

function Gem() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M8 1.8 3 6.3 8 14.4l5-8.1L8 1.8zM8 3.4 11.1 6.2H4.9L8 3.4z" />
    </svg>
  );
}

export default function GemNotice({ tone = 'normal', text = '', onDismiss }) {
  return (
    <div data-testid="builder-gem-notice" data-tone={tone} className="notice">
      <span className="g"><Gem /></span>
      <span>{text}</span>
      <span className="sp" />
      <button type="button" aria-label="Cerrar aviso de gemas" onClick={onDismiss} className="xb">
        <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
        </svg>
      </button>
    </div>
  );
}
