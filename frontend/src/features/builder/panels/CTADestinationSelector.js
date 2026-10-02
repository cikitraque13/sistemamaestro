import React, { useState } from 'react';
import { availableDestinations } from '../state/ctaDestinationIntent.mjs';
export function DestinationChoice({ targets, onSelect, disabled, repair = false }) {
  const [selected, setSelected] = useState('');
  return <div><label>Destino del CTA <select aria-label="Destino del CTA" value={selected} disabled={disabled} onChange={e=>setSelected(e.target.value)}>
    <option value="" label="Elige una sección" />{targets.map(t=><option key={t.sectionId} value={t.sectionId} label={`${t.label} (${t.targetFragment})`} />)}
  </select></label><button type="button" disabled={disabled || !targets.some(t=>t.sectionId===selected)} onClick={()=>onSelect(selected)}>{repair ? 'Proponer reparación' : 'Proponer destino'}</button><p>Seleccionar no aplica el cambio.</p></div>;
}
export default function CTADestinationSelector({ state, transaction }) {
  const targets=availableDestinations(state);
  if (!targets.length) return null;
  return <DestinationChoice key={state.projectId + ':' + transaction.revision} targets={targets} disabled={transaction.busy || Boolean(transaction.pending)} onSelect={sectionId=>transaction.propose([{type:'set_primary_destination',value:sectionId}])}/>;
}
