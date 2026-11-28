import React from 'react';

import { GemaMaestra } from '../../app-shell/layout/AppShellLayout';
import BuilderAgentPane from '../components/BuilderAgentPane';
import ExecutorChat from '../components/ExecutorChat';
import BuilderCanvasPane from '../components/BuilderCanvasPane';
import { PUBLISH_LANDING_ENABLED } from '../api/builderPreviewClient';
import useBuilderWorkspaceRuntime from './hooks/useBuilderWorkspaceRuntime';

const HISTORY_LABELS = {
  ACCEPT_WARNING: 'Aceptó la advertencia',
  REJECT_CHANGE: 'Rechazó el cambio',
  REQUIRES_CLARIFICATION: 'Pidió una aclaración',
};

const historyText = (item) => {
  const label = HISTORY_LABELS[item?.type] || String(item?.type || 'Cambio');
  const reason = String(item?.rationale || '').trim();
  return reason ? `${label}. ${reason}` : label;
};

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

const viewButtonClass = (active) =>
  `rounded-full border px-3 py-2 text-sm font-semibold transition ${
    active
      ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100'
      : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:text-white'
  }`;

function ProjectHistory({ audit, versions }) {
  const saved = Array.isArray(versions) ? versions.filter((item) => item && item.instruction) : [];
  const items = Array.isArray(audit) ? audit.filter((item) => item && (item.type || item.rationale)) : [];

  return (
    <section aria-label="Historial" className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Historial</p>
      {saved.length === 0 && items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">Aún no hay cambios</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {saved.slice().reverse().map((item) => (
            <li key={`v-${item.version}`} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm leading-6 text-zinc-200">
              {`Versión ${item.version}. ${item.instruction}`}
            </li>
          ))}
          {items.slice().reverse().map((item, index) => (
            <li
              key={item.decisionId || `${item.type}-${index}`}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm leading-6 text-zinc-200"
            >
              {historyText(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

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

function WorkspaceSidePanel({
  activeWorkspaceTab,
  onWorkspaceTabChange,
  credits,
  bonus,
  usageLabel,
  freeTestMode = false,
  runtime,
}) {
  const visibleTab = activeWorkspaceTab === 'extract' ? 'extract' : 'preview';

  return (
    <aside className="order-2 flex min-h-0 flex-col gap-3 overflow-auto border-t border-white/10 bg-[#08070D] p-3 lg:order-1 lg:h-full lg:border-r lg:border-t-0">
      <div className="grid grid-cols-2 gap-2" aria-label="Vista del Builder">
        <button type="button" className={viewButtonClass(visibleTab === 'preview')} onClick={() => onWorkspaceTabChange?.('preview')}>
          Preview
        </button>
        <button type="button" className={viewButtonClass(visibleTab === 'extract')} onClick={() => onWorkspaceTabChange?.('extract')}>
          Extracción
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <GemaMaestra credits={credits} bonus={bonus} usageLabel={usageLabel} />
      </div>
      {freeTestMode ? (
        <p className="w-fit rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-[11px] font-semibold text-amber-100">
          Modo prueba · sin gemas
        </p>
      ) : null}

      <ExecutorChat
        phase={runtime.executor?.phase || 'idle'}
        message={runtime.executor?.message || 'El ejecutor está listo.'}
        steps={runtime.executor?.steps || []}
        log={runtime.executor?.log || []}
        slow={Boolean(runtime.executor?.slow)}
        onSubmit={runtime.submitMessage}
      />

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
        <BuilderAgentPane
          project={runtime.project}
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
      </div>

      {runtime.previewNotice ? <p role="alert" className="text-sm text-amber-100">{runtime.previewNotice}</p> : null}
      {PUBLISH_LANDING_ENABLED ? <button type="button">Publicar</button> : null}

      <ProjectHistory audit={runtime.landingTransaction?.audit} versions={runtime.generatedPreview?.versions} />
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
  onWorkspaceTabChange = () => {},
  credits = 0,
  bonus = 0,
  usageLabel = '',
  autoStart = false,
  freeTestMode = false,
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
        <WorkspaceSidePanel
          activeWorkspaceTab={visibleTab}
          onWorkspaceTabChange={onWorkspaceTabChange}
          credits={credits}
          bonus={bonus}
          usageLabel={usageLabel}
          freeTestMode={freeTestMode}
          runtime={{ ...runtime, project }}
        />
      </div>
    </section>
  );
}
