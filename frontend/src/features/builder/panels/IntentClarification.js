import React, { useRef, useState } from 'react';
import { submitIntentOperation } from '../api/builderAiClient';

export function IntentProjection({ projection }) {
  if (!projection) return null;
  const p = projection, labels = p.labels;
  return <div aria-label="Contenido de intención a confirmar">
    {['title','goal','scope','assumptions','success_criteria'].map(key => <section key={key}><h3>{labels[key]}</h3>{Array.isArray(p[key]) ? p[key].map((value,index) => <p key={index}>{value}</p>) : <p>{p[key]}</p>}</section>)}
    <section><h3>{labels.clarifications}</h3>{p.clarifications.map(q => <div key={q.question_id}><p>{labels.question_id}: {q.question_id}</p><p>{labels.question}: {q.question}</p><p>{labels.answer}: {q.answer}</p></div>)}</section>
    <section><h3>{labels.sources}</h3>{p.sources.map((source,index) => <div key={index}><p>{labels.source_label}: {source.label}</p><p>{labels.field_path}: {source.field_path}</p><p>{labels.revision}: {source.revision}</p></div>)}</section>
  </div>;
}

export default function IntentClarification({ project, ownerId, apiBaseUrl = '' }) {
  const [intent, setIntent] = useState(project.active_j06_1_intent || null);
  const [revision, setRevision] = useState(project.updated_at || '0');
  const [text, setText] = useState(intent?.text || '');
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const pending = useRef(null);
  const currentBinding = `${ownerId}:${project.project_id}`;
  const binding = useRef(currentBinding); binding.current = currentBinding;
  async function send(operationType, retry = false) {
    if (busy || (pending.current && !retry)) return;
    const requestBinding = currentBinding;
    const body = { projectId: project.project_id, operation_id: crypto.randomUUID(), operation_type: operationType,
      ...(intent ? { intent_id: intent.intent_id, draft_revision: intent.draft_revision, state_revision: intent.state_revision } : {}),
      ...(['CREATE_INTENT','EDIT','SUPERSEDE_AND_CREATE'].includes(operationType) ? { text } : {}),
      ...(operationType === 'ANSWER' ? { answers } : {}),
      ...(operationType === 'CONFIRM' ? { digest: intent.confirmation_challenge.digest } : {}),
    };
    if (!pending.current) pending.current = { body, revision };
    setBusy(true); setError('');
    try {
      const result = await submitIntentOperation(pending.current.body, pending.current.revision, apiBaseUrl);
      if (binding.current !== requestBinding) return;
      if (result.user_id !== ownerId || result.project_id !== project.project_id) throw new Error('ACCESS_DENIED');
      setIntent(result.intent); setRevision(result.updated_at); setAnswers({}); pending.current = null;
    } catch (e) {
      if (binding.current !== requestBinding) return;
      const code = e.code || 'PERSISTENCE_UNAVAILABLE';
      setError(code);
      if (!['PERSISTENCE_UNAVAILABLE','CLASSIFIER_UNAVAILABLE'].includes(code)) pending.current = null;
    } finally { if (binding.current === requestBinding) setBusy(false); }
  }
  const terminal = ['CONFIRMED','CANCELLED','SUPERSEDED'].includes(intent?.status);
  return <section aria-label="Intención del proyecto">
    <h2>Revisar intención</h2><p>La confirmación registra tu decisión. No construye ni consume créditos comerciales.</p>
    <textarea aria-label="Petición" value={text} maxLength={8000} disabled={busy || Boolean(pending.current) || terminal} onChange={e=>setText(e.target.value)} />
    <button disabled={busy || terminal || !text || Boolean(pending.current)} onClick={()=>send(intent ? 'EDIT' : 'CREATE_INTENT')}>Preparar propuesta</button>
    {intent?.questions.map(q=><label key={q.question_id}>{q.question}<textarea aria-label={q.question} disabled={busy || terminal || Boolean(pending.current)} value={answers[q.question_id] ?? intent.answers[q.question_id]?.text ?? ''} onChange={e=>setAnswers({...answers,[q.question_id]:e.target.value})} maxLength={2000} /></label>)}
    {intent && !terminal && <><button disabled={busy || Boolean(pending.current) || !Object.keys(answers).length} onClick={()=>send('ANSWER')}>Guardar aclaraciones</button><button disabled={busy || Boolean(pending.current)} onClick={()=>send('SAVE_DRAFT')}>Guardar borrador</button><button disabled={busy || Boolean(pending.current)} onClick={()=>send('REFRESH')}>Actualizar contexto</button><button disabled={busy || Boolean(pending.current)} onClick={()=>send('CANCEL')}>Cancelar</button><button disabled={busy || Boolean(pending.current) || !text} onClick={()=>send('SUPERSEDE_AND_CREATE')}>Sustituir propuesta</button></>}
    <IntentProjection projection={intent?.confirmation_challenge?.display_projection} />
    {intent?.status === 'READY_FOR_CONFIRMATION' && <button disabled={busy || Boolean(pending.current)} onClick={()=>send('CONFIRM')}>Confirmo esta intención exacta</button>}
    {pending.current && !busy && <button onClick={()=>send(pending.current.body.operation_type, true)}>Reintentar la misma solicitud</button>}
    {intent?.status === 'CONFIRMED' && <p role="status">Intención confirmada. No se ha iniciado ninguna construcción.</p>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
