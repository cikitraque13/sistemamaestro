import HumanSemanticDecision from '../panels/HumanSemanticDecision';
import CTADestinationSelector from '../panels/CTADestinationSelector';
import BuilderChangeReview from '../panels/BuilderChangeReview';
import StaticSectionEditor from '../panels/StaticSectionEditor';
import LandingArtifactPreview from '../panels/LandingArtifactPreview';
import { createBuilderOutputMap } from '../state/builderOutputMap';
import React from 'react';

import BuilderAgentPane from '../components/BuilderAgentPane';
import BuilderCanvasPane from '../components/BuilderCanvasPane';
import useBuilderWorkspaceRuntime from './hooks/useBuilderWorkspaceRuntime';

const LoadingState = () => (
  <div className="flex h-full min-h-[520px] items-center justify-center rounded-[24px] border border-white/10 bg-[#08070D] p-6">
    <div className="text-center">
      <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-2xl bg-cyan-300/30" />

      <h2 className="text-2xl font-semibold text-white">
        Cargando proyecto real
      </h2>

      <p className="mt-3 text-sm text-zinc-400">
        Leyendo diagnóstico y preparando Builder.
      </p>
    </div>
  </div>
);

const ErrorState = ({ projectError }) => (
  <div className="flex h-full min-h-[520px] items-center justify-center rounded-[24px] border border-red-400/20 bg-red-950/20 p-6">
    <div className="max-w-xl text-center">
      <h2 className="text-2xl font-semibold text-white">
        No se pudo cargar el proyecto
      </h2>

      <p className="mt-3 text-sm leading-6 text-red-200">
        {projectError}
      </p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex h-full min-h-[520px] items-center justify-center rounded-[24px] border border-white/10 bg-[#08070D] p-6">
    <div className="max-w-xl text-center">
      <h2 className="text-2xl font-semibold text-white">
        Builder sin proyecto
      </h2>

      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Vuelve al dashboard, escribe una idea o URL y abre Builder para crear un proyecto real.
      </p>
    </div>
  </div>
);

export default function BuilderWorkspaceLayout({
  ownerId = null,
  activeWorkspaceTab = 'preview',
  initialPrompt = '',
  project = null,
  loadingProject = false,
  projectError = '',
}) {
  const runtime = useBuilderWorkspaceRuntime({
    project,
    ownerId,
    initialPrompt,
    loadingProject,
    projectError,
  });

  if (loadingProject) return <LoadingState />;
  if (projectError) return <ErrorState projectError={projectError} />;
  if (!project) return <EmptyState />;

  const transaction = runtime.landingTransaction;
  const isLandingWorkspace = runtime.builderBuildState?.projectKind === 'landing';
  if (transaction.status !== 'ready' && runtime.builderBuildState?.projectKind === 'landing') return <div role="status" className="p-6 text-white">{transaction.error || 'Recuperando tu workspace…'}</div>;
  const previewIntelligence = transaction.pending ? { ...runtime.builderIntelligence, builderBuildState: transaction.pending.candidate, builderKernelOutput: createBuilderOutputMap(transaction.pending.candidate) } : runtime.builderIntelligence;

  return (
    <section className="h-full min-h-0 overflow-hidden rounded-[24px] border border-white/10 bg-[#06080B] shadow-[0_0_90px_rgba(0,0,0,0.38)]">
      <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(390px,0.48fr)_1px_minmax(560px,0.52fr)]">
        <BuilderAgentPane
          project={project}
          copy={runtime.copy}
          progress={runtime.progress}
          activeCodeTab={runtime.activeCodeTab}
          onCodeTabChange={runtime.setActiveCodeTab}
          messages={runtime.messages}
          agentStatus={runtime.agentStatus}
          onSubmitMessage={runtime.submitMessage}
          onStartBuild={runtime.startBuild}
          builderIntelligence={runtime.builderIntelligence}
        />

        <div className="hidden bg-white/[0.08] xl:block" />

        <div className="min-h-0 overflow-auto bg-[#08070D]">
          {isLandingWorkspace && <>
          <div className="border-b border-white/10 p-3 text-sm text-white" aria-label="Cambio de landing">
            <p>{transaction.pending ? 'Vista previa del cambio · aún no aplicado' : `Landing activa · revisión local ${transaction.revision}`}</p>
            {transaction.pending && <p>Propuesta: {transaction.pending.operations.map((op) => ({ insert_static_section: 'Añadir sección', update_static_section: 'Editar sección', move_static_section: 'Mover sección', remove_static_section: 'Eliminar sección', set_primary_cta: 'Cambiar CTA', set_accent: 'Cambiar acento' }[op.type])).join(', ')} · CTA: {transaction.pending.candidate.primaryCTA} · Acento: {transaction.pending.candidate.visualAccent}</p>}
            <CTADestinationSelector state={runtime.builderBuildState} transaction={transaction} />
            {transaction.audit?.length > 0 && <details><summary>Decisiones anteriores</summary>{transaction.audit.map(d => <div key={d.decisionId}><p>{d.ownerId} · {d.type} · {d.effectiveStatus}</p><p>{d.semanticAssessment?.promise} · {d.semanticAssessment?.status} · {d.semanticAssessment?.reason}</p><p>{d.rationale || 'Sin razón indicada'} · Revisión {d.baseRevision}</p><p className="break-all">Review: {d.reviewId} · Assessment: {d.semanticAssessmentId}</p></div>)}</details>}
            <div aria-label="Borrador pendiente">
              {transaction.pending && <button type="button" disabled={transaction.busy} onClick={transaction.savePending}>Guardar borrador</button>}
              {transaction.hasSavedDraft && <><p>Hay un borrador guardado. Recuperarlo exige una nueva revisión; no recupera aceptaciones.</p><button type="button" disabled={transaction.busy || Boolean(transaction.pending)} onClick={transaction.recoverPending}>Recuperar borrador</button><button type="button" disabled={transaction.busy} onClick={transaction.discardPending}>Eliminar borrador guardado</button></>}
            </div>
            <BuilderChangeReview review={transaction.review} onRepair={transaction.repair} busy={transaction.busy} />
            {transaction.review && transaction.requiresDecision && <HumanSemanticDecision key={transaction.review.reviewId} review={transaction.review} decision={transaction.decision} onDecide={transaction.decide} busy={transaction.busy} />}
            {transaction.error && <p role="alert">{transaction.error}</p>}
            {transaction.pending && <>
              <button type="button" disabled={transaction.busy || transaction.review?.validation !== 'PASS' || (transaction.requiresDecision && transaction.decision?.type !== 'ACCEPT_WARNING')} onClick={transaction.apply}>Autorizar y aplicar cambio</button>{' '}
              <button type="button" disabled={transaction.busy} onClick={transaction.discard}>Descartar propuesta</button>{' '}
            </>}
            <button type="button" disabled={transaction.busy || !transaction.canRevert || Boolean(transaction.pending)} onClick={transaction.revert}>Revertir último cambio</button>
            <p className="text-xs text-zinc-400">Cambios locales de CTA, acento y secciones estáticas. No publica ni modifica créditos.</p>
          </div>
          <StaticSectionEditor state={runtime.builderBuildState} transaction={transaction} />
          </>}
          {isLandingWorkspace && activeWorkspaceTab === 'preview' && (transaction.pending || transaction.revision > 0) ? (
            <LandingArtifactPreview state={transaction.pending?.candidate || runtime.builderBuildState} artifact={transaction.pending?.artifact} isCandidate={Boolean(transaction.pending)} />
          ) : <BuilderCanvasPane
            activeWorkspaceTab={activeWorkspaceTab}
            copy={runtime.copy}
            project={project}
            progress={runtime.progress}
            activeCodeTab={runtime.activeCodeTab}
            onCodeTabChange={runtime.setActiveCodeTab}
            builderIntelligence={previewIntelligence}
          />}
        </div>
      </div>
    </section>
  );
}