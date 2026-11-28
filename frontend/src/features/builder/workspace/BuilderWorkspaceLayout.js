import React from 'react';

import ExecutorChat from '../components/ExecutorChat';
import BuilderCanvasPane from '../components/BuilderCanvasPane';
import BuilderPublishDock from '../publish/BuilderPublishDock';
import useBuilderWorkspaceRuntime from './hooks/useBuilderWorkspaceRuntime';
import EmbedInstallStep from '../embed/EmbedInstallStep';

const LoadingState = () => (
  <div className="flex h-full min-h-[520px] items-center justify-center p-6">
    <div className="text-center">
      <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-2xl bg-cyan-300/30" />
      <h2 className="text-2xl font-semibold text-white">Cargando proyecto</h2>
      <p className="mt-3 text-sm text-zinc-400">Leyendo el diagnóstico y la preview.</p>
    </div>
  </div>
);

const ErrorState = ({ projectError }) => (
  <div className="flex h-full min-h-[520px] items-center justify-center p-6">
    <div className="max-w-xl text-center">
      <h2 className="text-2xl font-semibold text-white">No se pudo cargar el proyecto</h2>
      <p className="mt-3 text-sm leading-6 text-red-200">{projectError}</p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex h-full min-h-[520px] items-center justify-center p-6">
    <div className="max-w-xl text-center">
      <h2 className="text-2xl font-semibold text-white">Builder sin proyecto</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Vuelve al dashboard, escribe una idea o URL y abre el Builder.
      </p>
    </div>
  </div>
);

function PreparingPreview() {
  return (
    <div className="flex h-full min-h-[520px] items-center justify-center p-6" role="status">
      <div className="w-full max-w-xl">
        <div className="mb-5 h-40 animate-pulse rounded-3xl bg-white/10" />
        <div className="mb-3 h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-white/10" />
        <h2 className="mt-6 text-2xl font-semibold text-white">Preparando tu página…</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Estamos escribiendo la primera versión.</p>
      </div>
    </div>
  );
}

function PreviewFailed({ message, onRetry }) {
  return (
    <div className="flex h-full min-h-[520px] items-center justify-center p-6" role="alert">
      <div className="max-w-xl text-center">
        <h2 className="text-2xl font-semibold text-white">No se ha podido preparar la página</h2>
        <p className="mt-3 text-sm leading-6 text-amber-100">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

function WorkspaceSidePanel({ runtime }) {
  return (
    <aside
      data-testid="builder-side-panel"
      className="order-2 flex min-h-0 flex-col overflow-hidden border-t border-white/10 bg-[#08070D] lg:order-1 lg:h-full lg:overflow-hidden lg:border-r lg:border-t-0"
    >
      <ExecutorChat
        phase={runtime.executor?.phase || 'idle'}
        message={runtime.executor?.message || 'El ejecutor está listo.'}
        steps={runtime.executor?.steps || []}
        log={runtime.executor?.log || []}
        slow={Boolean(runtime.executor?.slow)}
        onSubmit={runtime.submitMessage}
      />
    </aside>
  );
}

export default function BuilderWorkspaceLayout({
  ownerId = null,
  activeWorkspaceTab = 'preview',
  initialPrompt = '',
  project = null,
  loadingProject = false,
  projectError = '',
  autoStart = false,
  publishLanding = false,
  customDomain = false,
  embedInstall = false,
}) {
  const runtime = useBuilderWorkspaceRuntime({
    project,
    ownerId,
    initialPrompt,
    autoStart,
    loadingProject,
    projectError,
  });

  const visibleTab = activeWorkspaceTab === 'extract' ? 'extract' : 'preview';
  const installOpen = Boolean(embedInstall && activeWorkspaceTab === 'install' && project);
  const executorPhase = runtime.executor?.phase || '';
  const busy = executorPhase === 'construyendo' || executorPhase === 'iterando' || runtime.previewPhase === 'working';
  const failed = executorPhase === 'error' || runtime.previewPhase === 'error';
  const liveHtml = (busy && runtime.executor?.partialHtml) || runtime.generatedPreview?.html || '';
  const workStatus = (busy || (failed && liveHtml)) ? (
    <div role="status" className="border-b border-white/10 bg-[#10141c] px-4 py-3 text-sm text-zinc-100">
      <p className="font-semibold">{runtime.executor?.message || (busy ? 'Construyendo tu página.' : runtime.previewNotice)}</p>
      {runtime.executor?.slow ? <p className="mt-1 text-amber-100">sigue trabajando…</p> : null}
    </div>
  ) : null;
  let main = <EmptyState />;
  if (loadingProject) main = <LoadingState />;
  else if (projectError) main = <ErrorState projectError={projectError} />;
  else if (installOpen) main = <EmbedInstallStep projectId={project.project_id} />;
  else if (project && visibleTab !== 'extract' && liveHtml) {
    main = (
      <div className="flex h-full min-h-[70vh] flex-col lg:min-h-0">
        {workStatus}
        <iframe
          title="Preview de la landing"
          sandbox=""
          srcDoc={liveHtml}
          className="min-h-0 w-full flex-1 border-0 bg-[#090b12]"
        />
        <BuilderPublishDock
          projectId={project.project_id}
          publishLanding={publishLanding}
          customDomain={customDomain}
          hasPreview={Boolean(runtime.generatedPreview?.html)}
          busy={busy}
        />
      </div>
    );
  } else if (project && visibleTab !== 'extract' && busy) {
    main = (
      <div>
        {workStatus}
        <PreparingPreview />
      </div>
    );
  } else if (project && visibleTab !== 'extract' && failed) {
    main = <PreviewFailed message={runtime.previewNotice || runtime.executor?.message || 'No se ha podido preparar la preview. No se ha publicado nada.'} onRetry={runtime.retryPreview} />;
  } else if (project) {
    main = (
      <BuilderCanvasPane
        activeWorkspaceTab={visibleTab}
        copy={runtime.copy}
        project={project}
        progress={100}
        activeCodeTab={runtime.activeCodeTab}
        onCodeTabChange={runtime.setActiveCodeTab}
        builderIntelligence={runtime.builderIntelligence}
      />
    );
  }

  return (
    <section className="h-full min-h-0 overflow-auto rounded-[24px] border border-white/10 bg-[#06080B] shadow-[0_0_90px_rgba(0,0,0,0.38)] lg:overflow-hidden">
      <div className="flex min-h-full flex-col lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[380px_minmax(0,1fr)] lg:overflow-hidden">
        <div className="order-1 min-h-[70vh] overflow-hidden lg:order-2 lg:min-h-0 lg:h-full">
          {main}
        </div>
        <WorkspaceSidePanel runtime={{ ...runtime, project }} />
      </div>
    </section>
  );
}
