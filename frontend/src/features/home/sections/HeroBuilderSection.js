import React, { useMemo, useState } from 'react';
import BuilderIntentTabs from '../components/BuilderIntentTabs';
import BuilderTypeTabs from '../components/BuilderTypeTabs';
import BuilderCapabilityChips from '../components/BuilderCapabilityChips';
import BuilderProjectTabs from '../components/BuilderProjectTabs';
import BuilderInputPanel from '../components/BuilderInputPanel';
import BuilderCodePreview from '../components/BuilderCodePreview';
import BuilderVisualPreview from '../components/BuilderVisualPreview';
import BuilderWorkspaceTabs from '../components/BuilderWorkspaceTabs';
import BuilderChatDock from '../components/BuilderChatDock';
import BuilderCreditBar from '../components/BuilderCreditBar';
import BuilderDeployPreview from '../components/BuilderDeployPreview';
import BuilderStructurePreview from '../components/BuilderStructurePreview';
import builderIntents from '../data/builderIntents';
import builderTypes from '../data/builderTypes';
import builderProjects from '../data/builderProjects';
import builderWorkspaceTabs from '../data/builderWorkspaceTabs';

const HeroBuilderSection = () => {
  const [activeIntent, setActiveIntent] = useState('create');
  const [activeType, setActiveType] = useState('website');
  const [activeProject, setActiveProject] = useState('project-alpha');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('preview');

  const activeProjectData = useMemo(
    () => builderProjects.find((item) => item.id === activeProject) || builderProjects[0],
    [activeProject]
  );

  return (
    <section className="relative overflow-hidden border-b border-zinc-900 bg-[#060809] px-6 pb-14 pt-8 md:px-10 md:pb-18 md:pt-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[10%] h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[10%] top-[12%] h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-[6%] left-[24%] h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[18%] top-[38%] h-56 w-56 rounded-full bg-amber-300/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Sistema Maestro
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
            ¿Qué quieres crear, mejorar o escalar hoy?
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-300 md:text-xl md:leading-9">
            Sistema Maestro convierte una idea o una web en una ruta clara de estructura, construcción y continuidad con criterio profesional.
          </p>

          <div className="mt-7">
            <BuilderCapabilityChips
              items={['SEO', 'Conversión', 'Arquitectura', 'IA', 'Código', 'Deploy', 'Seguridad']}
            />
          </div>
        </div>

        <div className="mt-8 rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4 shadow-[0_0_80px_rgba(255,255,255,0.04)] md:p-6">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
            <BuilderProjectTabs
              items={builderProjects}
              activeId={activeProject}
              onChange={setActiveProject}
            />

            <BuilderCreditBar credits={120} bonus={25} usageLabel="Créditos listos para construir, iterar y desplegar." />
          </div>

          <div className="mt-5">
            <BuilderInputPanel
              activeIntent={activeIntent}
              activeType={activeType}
              onIntentChange={setActiveIntent}
              onTypeChange={setActiveType}
              intentItems={builderIntents}
              typeItems={builderTypes}
              IntentTabs={BuilderIntentTabs}
              TypeTabs={BuilderTypeTabs}
            />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
            <div className="grid gap-5">
              <BuilderCodePreview
                activeIntent={activeIntent}
                activeType={activeType}
                projectLabel={activeProjectData.label}
              />

              <BuilderChatDock
                activeIntent={activeIntent}
                projectLabel={activeProjectData.label}
              />
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/35 p-5 shadow-[0_0_30px_rgba(0,0,0,0.22)]">
              <BuilderWorkspaceTabs
                items={builderWorkspaceTabs}
                activeId={activeWorkspaceTab}
                onChange={setActiveWorkspaceTab}
              />

              <div className="mt-5 min-h-[420px]">
                {activeWorkspaceTab === 'preview' && (
                  <BuilderVisualPreview
                    activeIntent={activeIntent}
                    activeType={activeType}
                    projectLabel={activeProjectData.label}
                  />
                )}

                {activeWorkspaceTab === 'deploy' && (
                  <BuilderDeployPreview projectLabel={activeProjectData.label} />
                )}

                {activeWorkspaceTab === 'structure' && (
                  <BuilderStructurePreview
                    activeIntent={activeIntent}
                    activeType={activeType}
                    projectLabel={activeProjectData.label}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBuilderSection;