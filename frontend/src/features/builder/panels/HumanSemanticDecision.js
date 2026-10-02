import React, { useState } from 'react';
export default function HumanSemanticDecision({ review, decision, onDecide, busy }) {
 const [rationale,setRationale]=useState('');
 return <section aria-label="Decisión humana" className="my-3 border border-white/20 p-3">
 <h4>Decisión sobre la advertencia</h4>
 {decision ? <><p>Decisión: {decision.type} · {decision.validity}</p><p>Razón: {decision.rationale || 'No indicada'}</p><p>Persona: {decision.ownerId} · Revisión: {decision.baseRevision}</p><details><summary>Estado cubierto</summary><p>{decision.reviewId}</p><p>{decision.candidateHash}</p><p>{decision.decisionId}</p></details></> : <>
 <label>Razón de la decisión<textarea maxLength={500} value={rationale} onChange={e=>setRationale(e.target.value)} /></label>
 <button type="button" disabled={busy || !rationale.trim()} onClick={()=>onDecide('ACCEPT_WARNING',rationale)}>Aceptar advertencia</button>
 <button type="button" disabled={busy} onClick={()=>onDecide('REJECT_CHANGE',rationale)}>Rechazar cambio</button>
 <button type="button" disabled={busy} onClick={()=>onDecide('REQUIRES_CLARIFICATION',rationale)}>Requiere aclaración</button>
 </>}
 <p>Esta decisión cubre solo la propuesta revisada. Recargar conserva el registro, pero exige una nueva revisión para aplicar.</p>
 </section>;
}
