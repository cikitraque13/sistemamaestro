import React from 'react';
import { CloudArrowUp } from '@phosphor-icons/react';

export default function PublishButton({ enabled = false, reason = '', onClick }) {
  return (
    <button
      type="button"
      data-testid="builder-publish-button"
      aria-label="Publicar la página"
      disabled={!enabled}
      title={enabled ? 'Publicar' : reason}
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-[#111113] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <CloudArrowUp size={16} aria-hidden="true" />
      Publicar
    </button>
  );
}
