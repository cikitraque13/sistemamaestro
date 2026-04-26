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
  activeWorkspaceTab = 'preview',
  initialPrompt = '',
  project = null,
  loadingProject = false,
  projectError = '',
}) {
  const runtime = useBuilderWorkspaceRuntime({
    project,
    initialPrompt,
    loadingProject,
    projectError,
  });

  if (loadingProject) return <LoadingState />;
  if (projectError) return <ErrorState projectError={projectError} />;
  if (!project) return <EmptyState />;

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

        <div className="min-h-0 overflow-hidden bg-[#08070D]">
          <BuilderCanvasPane
            activeWorkspaceTab={activeWorkspaceTab}
            copy={runtime.copy}
            project={project}
            progress={runtime.progress}
            activeCodeTab={runtime.activeCodeTab}
            onCodeTabChange={runtime.setActiveCodeTab}
            builderIntelligence={runtime.builderIntelligence}
          />
        </div>
      </div>
    </section>
  );
}