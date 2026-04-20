import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BuilderIntentTabs from '../components/BuilderIntentTabs';
import BuilderTypeTabs from '../components/BuilderTypeTabs';
import BuilderCapabilityChips from '../components/BuilderCapabilityChips';
import BuilderCodePreview from '../components/BuilderCodePreview';
import BuilderVisualPreview from '../components/BuilderVisualPreview';
import BuilderProjectTabs from '../components/BuilderProjectTabs';
import builderIntents from '../data/builderIntents';
import builderTypes from '../data/builderTypes';
import builderProjects from '../data/builderProjects';

const HeroBuilderSection = () => {
  const [activeIntent, setActiveIntent] = useState('create');
  const [activeType, setActiveType] = useState('website');
  const [activeProject, setActiveProject] = useState('project-alpha');

  const activeIntentData = useMemo(
    () => builderIntents.find((item) => item.id === activeIntent) || builderIntents[0],
    [activeIntent]
  );

  const activeProjectData = useMemo(
    () => builderProjects.find((item) => item.id === activeProject) || builderProjects[0],
    [activeProject]
  );

  const inputConfig = {
    create: {
      label: 'Cuéntale tu idea al sistema',
      placeholder:
        'Quiero crear una herramienta para analizar webs y generar una ruta de mejora con IA.',
      helper:
        'Sistema Maestro interpreta tu idea y activa una ruta clara para analizar, estructurar y preparar la construcción.',
    },
    improve: {
      label: 'Pega la URL que quieres analizar',
      placeholder: 'https://tuweb.com',
      helper:
        'El sistema parte de una web real para detectar fricciones, ordenar prioridades y proponer el siguiente paso correcto.',
    },
    scale: {
      label: 'Explica qué quieres automatizar o reforzar',
      placeholder:
        'Quiero automatizar el análisis, la captación y el seguimiento de proyectos de clientes.',
      helper:
        'Sistema Maestro ordena procesos, detecta puntos de mejora y prepara una ruta más clara para crecer sin dispersión.',
    },
  };

  const currentConfig = inputConfig[activeIntent] || inputConfig.create;

  return (
    <section className="relative overflow-hidden border-b border-zinc-900 bg-[#060809] px-6 pb-16 pt-8 md:px-10 md:pb-20 md:pt-10">
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

          <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-300 md:text-xl md:leading-9">
            Sistema Maestro convierte una idea o una web en una ruta clara de estructura,
            construcción y continuidad con criterio profesional.
          </p>

          <div className="mt-8">
            <BuilderCapabilityChips
              items={['SEO', 'Conversión', 'Arquitectura', 'IA', 'Código', 'Deploy', 'Seguridad']}
            />
          </div>
        </div>

        <div className="mt-10 rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4 shadow-[0_0_80px_rgba(255,255,255,0.04)] md:p-6">
          <BuilderProjectTabs
            items={builderProjects}
            activeId={activeProject}
            onChange={setActiveProject}
          />

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[28px] border border-white/10 bg-black/35 p-6 shadow-[0_0_40px_rgba(0,0,0,0.25)]">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Qué quieres hacer
                </p>
                <BuilderIntentTabs
                  items={builderIntents}
                  activeId={activeIntent}
                  onChange={setActiveIntent}
                />
              </div>

              <div className="mt-6">
                <h2 className="text-2xl font-semibold text-white md:text-3xl">
                  {activeIntentData.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-zinc-300 md:text-base">
                  {activeIntentData.description}
                </p>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Tipo de construcción
                </p>

                <BuilderTypeTabs
                  items={builderTypes}
                  activeId={activeType}
                  onChange={setActiveType}
                  visible={activeIntent === 'create'}
                />

                {activeIntent === 'create' && (
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Elige el formato principal. El sistema adapta la ruta de construcción según tu objetivo.
                  </p>
                )}
              </div>

              <div className="mt-6">
                <label className="mb-3 block text-sm font-semibold text-white">
                  {currentConfig.label}
                </label>

                <div className="rounded-[26px] border border-cyan-500/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-3 shadow-[0_0_30px_rgba(6,182,212,0.08)]">
                  <textarea
                    rows={activeIntent === 'improve' ? 3 : 5}
                    placeholder={currentConfig.placeholder}
                    className="w-full resize-none rounded-[20px] border border-zinc-800 bg-black/45 px-4 py-4 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-cyan-400/40"
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  {currentConfig.helper}
                </p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-200 via-white to-amber-100 px-6 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(251,191,36,0.15)] transition hover:opacity-95"
                >
                  Empezar análisis
                </Link>

                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-black/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-zinc-500"
                >
                  Ver cómo funciona
                </a>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <BuilderCodePreview
                activeIntent={activeIntent}
                activeType={activeType}
                projectLabel={activeProjectData.label}
              />
              <BuilderVisualPreview
                activeIntent={activeIntent}
                activeType={activeType}
                projectLabel={activeProjectData.label}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBuilderSection;