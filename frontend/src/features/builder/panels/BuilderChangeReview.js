import { DestinationChoice } from './CTADestinationSelector';
import React from 'react';
const labels = { ADD: 'Añadir sección', EDIT: 'Editar sección', MOVE: 'Cambiar posición', DELETE: 'Eliminar sección' };
const value = (present, content) => present ? JSON.stringify(content, null, 2) : 'No existe';
function Fields({ changes }) {
  return <dl className="space-y-3">{changes.map((change, index) => <div key={index} className="border-t border-white/10 pt-2">
    <dt className="break-all font-medium">{change.path.join(' → ') || 'Estado'}</dt>
    <dd className="grid grid-cols-2 gap-3">
      <div><span className="text-zinc-400">Antes</span><pre className="whitespace-pre-wrap break-words">{value(change.beforePresent, change.before)}</pre></div>
      <div><span className="text-zinc-400">Después</span><pre className="whitespace-pre-wrap break-words">{value(change.afterPresent, change.after)}</pre></div>
    </dd>
  </div>)}</dl>;
}
export default function BuilderChangeReview({ review, onRepair, busy = false }) {
  if (!review) return null;
  return <section aria-label="Revisión exacta del cambio" className="my-3 rounded-lg border border-white/20 p-3">
    <h3 className="font-semibold">Qué cambiará</h3><p>Listo para revisar no significa autorizado. La autorización se comprueba al elegir autorizar y aplicar; solo se usa una vez.</p>
    <p>Revisión de partida: {review.baseRevision} · {review.validation === 'PASS' ? 'Validación correcta' : 'Revisión no válida'}</p>
    {review.destinationIntent && <p>Destino elegido: {review.destinationIntent.label} ({review.destinationIntent.targetFragment}) · CTA {review.destinationIntent.ctaId}</p>}
    {review.semanticCoherence && <div aria-label="Coherencia CTA y destino" className="my-3 border border-white/20 p-3">
      <h4>¿El destino cumple la promesa?</h4>
      <p>Promesa: {review.semanticCoherence.promise}</p>
      <p>{{ SUPPORTING_SIGNALS: 'Hay señales de correspondencia; confirma el significado.', POTENTIAL_MISMATCH: 'Posible incoherencia: revisa antes de aplicar.', UNCERTAIN: 'No hay evidencia suficiente para valorar la coherencia.' }[review.semanticCoherence.status]}</p>
      <p>Contenido de llegada: {review.semanticCoherence.destinationContent.join(' · ') || 'Sin destino explícito evaluable'}</p>
      <p>{review.semanticCoherence.reason === 'ACTION_NOT_PROVIDED_BY_STATIC_ARTIFACT' ? 'Este documento estático no ejecuta compras, reservas, registros ni descargas.' : review.semanticCoherence.reason === 'NO_VISIBLE_SUPPORT_FOR_PROMISE' ? 'No se encontraron señales visibles que respalden esta promesa.' : null}</p>
      <p>{review.semanticCoherence.limitation}</p>
      <p>Puedes descartar la propuesta o aplicarla expresamente tras revisar. Esta valoración no aplica cambios.</p>
    </div>}
    {review.repair && <div aria-label="Reparación propuesta"><p>Fallo original: {review.repair.originalFailure.failedInvariants.join(', ')}</p><p>{review.repair.rationale}</p><Fields changes={review.repair.changes} /><p>Revalidación: {review.validation}. Todavía no se ha aplicado.</p><p>Propuesta original: {review.repair.parentProposalId}</p></div>}
    {!review.repair && review.validation !== 'PASS' && <div><p>{review.repairability?.status === 'REPAIRABLE' ? 'Hay una reparación local disponible.' : 'No hay una reparación segura disponible.'}</p>{review.repairability?.status === 'REPAIRABLE' && onRepair && <DestinationChoice key={review.reviewId} targets={review.repairability.targets} disabled={busy} onSelect={onRepair} repair />}</div>}
    {review.functionalValidation && <div aria-label="Comprobación funcional">
      <p>{review.functionalValidation.status === 'PASS' ? 'Este cambio fue comprobado: navegación y estructura válidas. La coherencia de intención se revisa por separado.' : 'Este cambio no puede aplicarse.'}</p>
      {review.functionalValidation.checks.filter(c => c.status !== 'PASS').map(c => <p key={c.id} role="alert">{c.message}</p>)}
      <details><summary>Comprobaciones del cambio</summary>{review.functionalValidation.checks.map(c => <p key={c.id}>{c.status} · {c.message}</p>)}</details>
    </div>}
    {review.operationCount > 1 && <div aria-label="Operaciones de la propuesta">
      <p>{review.operationCount} operaciones · una aplicación y una revisión durable.</p>
      {review.steps.map((step) => <details key={step.index} open><summary>Operación {step.index}: {{ insert_static_section: 'Añadir', update_static_section: 'Editar', move_static_section: 'Mover', remove_static_section: 'Eliminar' }[step.type] || step.type} · {step.target}</summary><Fields changes={step.changes} /></details>)}
      <p>Orden final: {review.finalStructure.map((section) => `${section.position}. ${section.id}`).join(' → ')}</p>
      <p className="text-zinc-400">El preview muestra solo el resultado final combinado.</p>
    </div>}
    {review.sections.map((section, index) => <article key={index} className="my-3">
      <h4>{labels[section.kind]} · {section.target}</h4>
      {section.kind === 'MOVE' && <p>Posición {section.from + 1} → {section.to + 1}{section.from === section.to ? ' (normalización del orden interno)' : ''}</p>}
      {section.kind === 'ADD' && <><p>Posición nueva: {section.to + 1}</p><pre className="whitespace-pre-wrap break-words">{JSON.stringify(section.after.props, null, 2)}</pre></>}
      {section.kind === 'DELETE' && <><p>Posición anterior: {section.from + 1}</p><pre className="whitespace-pre-wrap break-words">{JSON.stringify(section.before.props, null, 2)}</pre></>}
      {section.kind === 'EDIT' && <Fields changes={section.fields} />}
    </article>)}
    {review.sections.length === 0 && <Fields changes={review.changes} />}
    {review.sections.length > 0 && <details><summary>Todos los campos afectados ({review.changes.length})</summary><Fields changes={review.changes} /></details>}
    {review.warnings.map((warning) => <p key={warning} className="text-amber-200">{warning}</p>)}
    <details className="mt-2 text-xs text-zinc-400"><summary>Identidad de esta revisión</summary>
      <dl className="break-all">{['ownerId', 'projectId', 'proposalId', 'beforeHash', 'candidateHash', 'artifactHash', 'reviewId'].map((key) => <div key={key}><dt>{key}</dt><dd>{review[key]}</dd></div>)}</dl>
    </details>
    <p className="mt-2 text-xs text-zinc-400">Descartar cierra esta revisión sin cambiar la landing; no elimina un borrador guardado. Puedes guardar el borrador para recuperarlo tras recargar. Las aceptaciones no se recuperan.</p>
  </section>;
}
