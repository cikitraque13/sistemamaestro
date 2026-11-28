import React from 'react';

export default function ResumeStrip({ phase = 'static', onResume }) {
  const resuming = phase === 'resuming';
  return (
    <div data-testid="builder-resume-strip" className="resume">
      <span>Estás viendo una vista previa estática. Reanuda para interactuar con tu sitio web.</span>
      <button type="button" onClick={onResume} disabled={resuming} className="btn-res">
        {resuming ? <i className="spin" aria-hidden="true" /> : null}
        {resuming ? 'Reanudando…' : 'Reanudar'}
      </button>
    </div>
  );
}
