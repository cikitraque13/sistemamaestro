import React from 'react';

export default function PublishButton({ enabled = false, reason = '', onClick }) {
  return (
    <button
      type="button"
      data-testid="builder-publish-button"
      aria-label="Publicar la página"
      disabled={!enabled}
      title={enabled ? 'Publicar' : reason}
      onClick={onClick}
      className="btn-pub"
    >
      <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <path d="M4.4 10.8A3 3 0 0 1 5.2 5.1 3.6 3.6 0 0 1 12 6.2a2.5 2.5 0 0 1 .2 4.9" />
        <path d="M8 13.2V8.2M6.1 9.8 8 8l1.9 1.8" />
      </svg>
      Publicar
    </button>
  );
}
