import React from 'react';

import { GemaMaestra } from '../../app-shell/layout/AppShellLayout';
import BuilderAgentPane from '../components/BuilderAgentPane';
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

function WorkspaceSidePanel({
  activeWorkspaceTab,
  onWorkspaceTabChange,
  credits,
  bonus,
  usageLabel,
  runtime,
}) {
  const visibleTab = activeWorkspaceTab === 'extract' ? 'extract' : 'preview';

  return (
    <aside className="flex min-h-0 flex-col gap-3 overflow-auto border-t border-white/10 bg-[#08070D] p-3 lg:border-l lg:border-t-0">
      <div className="grid grid-cols-2 gap-2" aria-label="Vista del Builder">
        <button type="button" className={viewButtonClass(visibleTab === 'preview')} onClick={() => onWorkspaceTabChange?.('preview')}>
          Preview
        </button>
        <button type="button" className={viewButtonClass(visibleTab === 'extract')} onClick={() => onWorkspaceTabChange?.('extract')}>
          Extracción
        </button>
      </div>

      <GemaMaestra credits={credits} bonus={bonus} usageLabel={usageLabel} />

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
}) {
  const runtime = useBuilderWorkspaceRuntime({
    project,
    ownerId,
    initialPrompt,
    loadingProject,
    projectError,
  });

  const visibleTab = activeWorkspaceTab === 'extract' ? 'extract' : 'preview';
  let main = <EmptyState />;
  if (loadingProject) main = <LoadingState />;
  else if (projectError) main = <ErrorState projectError={projectError} />;
  else if (project && visibleTab !== 'extract' && runtime.generatedPreview?.html) {
    main = (
      <iframe
        title="Preview de la landing"
        sandbox=""
        srcDoc={runtime.generatedPreview.html}
        className="h-full min-h-[70vh] w-full border-0 bg-[#090b12] lg:min-h-0"
      />
    );
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
      <div className="flex min-h-full flex-col lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_20.5rem] lg:overflow-hidden">
        <div className="min-h-[70vh] overflow-hidden lg:min-h-0 lg:h-full">
          {main}
        </div>
        <WorkspaceSidePanel
          activeWorkspaceTab={visibleTab}
          onWorkspaceTabChange={onWorkspaceTabChange}
          credits={credits}
          bonus={bonus}
          usageLabel={usageLabel}
          runtime={{ ...runtime, project }}
        />
      </div>
    </section>
  );
}
