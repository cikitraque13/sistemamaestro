import React, { useEffect, useState } from 'react';

function ArtifactFrame({ artifact }) {
  const [source, setSource] = useState(null);
  useEffect(() => {
    const url = URL.createObjectURL(new Blob([artifact.html], { type: artifact.mediaType }));
    setSource({ html: artifact.html, url });
    return () => URL.revokeObjectURL(url);
  }, [artifact.html, artifact.mediaType]);
  return <iframe title="Landing HTML validada" sandbox="allow-same-origin" src={source?.html === artifact.html ? source.url : undefined} className="h-[650px] w-full border-0" />;
}

import { renderLandingArtifact, validateLandingArtifact } from '../preview/landingArtifact.mjs';

export default function LandingArtifactPreview({ state, artifact: suppliedArtifact, isCandidate = false }) {
  let artifact;
  try {
    artifact = suppliedArtifact || renderLandingArtifact(state);
    validateLandingArtifact(state, artifact);
  } catch (error) {
    return <p role="alert">No se puede mostrar ni descargar la landing: {error.message}</p>;
  }
  const download = () => {
    validateLandingArtifact(state, artifact);
    const url = URL.createObjectURL(new Blob([artifact.html], { type: artifact.mediaType }));
    const link = document.createElement('a');
    link.href = url; link.download = isCandidate ? 'landing-propuesta.html' : 'landing.html';
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="h-full min-h-[600px]">
    <div className="p-3 text-sm text-zinc-300">
      <button type="button" onClick={download}>Descargar {isCandidate ? 'propuesta HTML' : 'landing HTML'}</button>
      <p>Documento estático: texto, secciones y CTA de navegación interna. Sin formularios, servicios ni código JavaScript del proyecto.</p>
    </div>
    <ArtifactFrame artifact={artifact} />
  </div>;
}
