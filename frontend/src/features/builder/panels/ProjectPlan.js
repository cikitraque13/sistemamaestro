import React, { useRef, useState } from 'react';
import { submitPlanOperation, recoverProjectPlan } from '../api/builderAiClient';

const empty = () => ({ title: '', objective: '', steps: [] });

export function PlanProjection({ projection }) {
  if (!projection) return null;
  const labels = projection.labels;
  return <div aria-label="Plan exacto a confirmar">
    {projection.field_order.map(key => key === 'steps'
      ? <section key={key}><h3>{labels.steps}</h3><ol>{projection.steps.map(step => <li key={step.step_id}>{projection.step_field_order.map(field => <p key={field}><strong>{labels[field === 'title' ? 'step_title' : field]}: </strong>{step[field]}</p>)}</li>)}</ol></section>
      : <section key={key}><h3>{labels[key]}</h3><p>{projection[key]}</p></section>)}
  </div>;
}

export default function ProjectPlan({ project, ownerId, apiBaseUrl = '' }) {
  const [plan, setPlan] = useState(project.j06_2_plan || null);
  const [content, setContent] = useState(project.j06_2_plan?.content || empty());
  const [revision, setRevision] = useState(project.updated_at || '0');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const pending = useRef(null), binding = useRef(null);
  const identity = `${ownerId}:${project.project_id}`;
  binding.current = identity;
  const confirmedIntent = project.active_j06_1_intent?.status === 'CONFIRMED';
  const dirty = JSON.stringify(content) !== JSON.stringify(plan?.content || empty());
  const terminal = ['CONFIRMED', 'CANCELLED', 'STALE'].includes(plan?.status);
  const locked = busy || Boolean(pending.current) || terminal || !plan;
  async function send(type, retry = false) {
    if (busy || (pending.current && !retry)) return;
    const requestIdentity = identity;
    if (!pending.current) pending.current = {
      revision,
      body: { projectId: project.project_id, operation_id: crypto.randomUUID(), operation_type: type,
        ...(plan ? { plan_id: plan.plan_id, generation: plan.generation, plan_revision: plan.plan_revision,
          state_revision: plan.state_revision, expected_status: plan.status } : {}),
        ...(type === 'EDIT' ? { content } : {}),
        ...(type === 'CONFIRM' ? { digest: plan.confirmation_challenge.digest } : {}),
      },
    };
    setBusy(true); setError('');
    try {
      const result = pending.current.body.operation_type === 'READ'
        ? await recoverProjectPlan(project.project_id, apiBaseUrl)
        : await submitPlanOperation(pending.current.body, pending.current.revision, apiBaseUrl);
      if (binding.current !== requestIdentity) return;
      if (result.user_id !== ownerId || result.project_id !== project.project_id) throw Object.assign(new Error(), { code: 'PROJECT_NOT_FOUND_OR_NOT_OWNED' });
      setPlan(result.plan); setContent(result.plan?.content || empty()); setRevision(result.updated_at); pending.current = null;
    } catch (e) {
      if (binding.current !== requestIdentity) return;
      const code = e.code || 'PERSISTENCE_UNAVAILABLE'; setError(code);
      if (code !== 'PERSISTENCE_UNAVAILABLE') pending.current = null;
    } finally { if (binding.current === requestIdentity) setBusy(false); }
  }
  const change = (field, value) => setContent({ ...content, [field]: value });
  const stepChange = (index, field, value) => change('steps', content.steps.map((step, i) => i === index ? { ...step, [field]: value } : step));
  const moveStep = (index, direction) => {
    const steps = [...content.steps], destination = index + direction;
    [steps[index], steps[destination]] = [steps[destination], steps[index]];
    change('steps', steps);
  };
  return <section aria-label="Plan del proyecto"><h2>Preparar plan</h2>
    <p>Escribe el plan y confirma su contenido por separado de la intención. Esta decisión no construye ni consume créditos comerciales.</p>
    {!plan && <button disabled={!confirmedIntent || busy || Boolean(pending.current)} onClick={() => send('CREATE')}>Crear borrador de plan</button>}
    {plan && <><p role="status">Estado del plan: {plan.stored_status === 'CANCELLED' ? 'CANCELLED' : plan.status}{plan.stored_status === 'CANCELLED' && plan.status === 'STALE' ? ' · Fuente obsoleta' : ''}</p>
      <label>Título del plan<input aria-label="Título del plan" value={content.title} maxLength={120} disabled={locked} onChange={e => change('title', e.target.value)} /></label>
      <label>Objetivo del plan<textarea aria-label="Objetivo del plan" value={content.objective} maxLength={1000} disabled={locked} onChange={e => change('objective', e.target.value)} /></label>
      <ol>{content.steps.map((step, index) => <li key={step.step_id}>
        {['title', 'description', 'acceptance_criterion'].map(field => <label key={field}>{`${field === 'title' ? 'Título' : field === 'description' ? 'Descripción' : 'Criterio de aceptación'} del paso ${index + 1}`}<textarea aria-label={`${field} paso ${index + 1}`} disabled={locked} value={step[field]} maxLength={field === 'title' ? 120 : field === 'description' ? 600 : 400} onChange={e => stepChange(index, field, e.target.value)} /></label>)}
        <button disabled={locked} onClick={() => change('steps', content.steps.filter((_, i) => i !== index))}>Eliminar paso {index + 1}</button>
        <button disabled={locked || index === 0} onClick={() => moveStep(index, -1)}>Subir paso {index + 1}</button>
        <button disabled={locked || index === content.steps.length - 1} onClick={() => moveStep(index, 1)}>Bajar paso {index + 1}</button>
      </li>)}</ol>
      <button disabled={locked || content.steps.length >= 12} onClick={() => change('steps', [...content.steps, { step_id: crypto.randomUUID(), title: '', description: '', acceptance_criterion: '' }])}>Añadir paso</button>
      <button disabled={locked || !dirty} onClick={() => send('EDIT')}>Guardar plan</button>
      <button disabled={busy || Boolean(pending.current) || dirty || plan.status !== 'DRAFT'} onClick={() => send('REVIEW')}>Revisar plan guardado</button>
      {dirty && <p>Guarda tus cambios y revisa la nueva propuesta antes de confirmar.</p>}
      {plan.status === 'READY_FOR_CONFIRMATION' && !dirty && <><PlanProjection projection={plan.confirmation_challenge?.display_projection} /><button disabled={busy || Boolean(pending.current)} onClick={() => send('CONFIRM')}>Confirmo este plan exacto</button></>}
      {plan.stored_status !== 'CANCELLED' && ['DRAFT', 'READY_FOR_CONFIRMATION', 'STALE'].includes(plan.status) && <button disabled={busy || Boolean(pending.current)} onClick={() => send('CANCEL')}>Cancelar plan</button>}
      {['CANCELLED', 'STALE'].includes(plan.status) && <button disabled={!confirmedIntent || busy || Boolean(pending.current)} onClick={() => send('RESTART')}>Iniciar nuevo borrador</button>}
      {plan.status === 'STALE' && <p>La intención fuente cambió. El plan se conserva. Solo podrás iniciar otro borrador cuando exista una intención vigente confirmada en este proyecto.</p>}
      <button disabled={busy || Boolean(pending.current)} onClick={() => send('READ')}>{dirty ? 'Descartar cambios y recuperar plan' : 'Recuperar plan guardado'}</button>
    </>}
    {pending.current && !busy && <button onClick={() => send(pending.current.body.operation_type, true)}>Reintentar la misma solicitud de plan</button>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
