import React from 'react';

export default function LivePublish({
  enabled = false,
  reason = '',
  url = '',
  onOpen,
}) {
  return (
    <div className="publish-slot" data-testid="builder-live-publish">
      {url ? (
        <a data-testid="builder-live-url" className="live-url" href={url} target="_blank" rel="noreferrer">
          {url}
        </a>
      ) : null}
      <button
        type="button"
        data-testid="builder-publish-open"
        className="btn-pub"
        disabled={!enabled}
        title={enabled ? 'Publicar' : reason}
        onClick={onOpen}
      >
        Publicar
      </button>
      {!enabled && reason ? <p className="publish-reason">{reason}</p> : null}
    </div>
  );
}
