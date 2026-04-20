import React from 'react';
import { Link } from 'react-router-dom';

const BuilderInputPanel = ({
  activeIntent,
  activeType,
  onIntentChange,
  onTypeChange,
  intentItems = [],
  typeItems = [],
  IntentTabs,
  TypeTabs,
}) => {
  const currentIntent =
    intentItems.find((item) => item.id === activeIntent) || intentItems[0];

  const inputConfig = {
    create: {
      label: 'Cuéntale tu idea al sistema',
      placeholder:
        'Quiero crear una herramienta para analizar webs y generar una ruta de mejora con IA.',
      helper:
        'El sistema interpreta la idea, ordena la ruta y activa el workspace para seguir construyendo.',
    },
    improve: {
      label: 'Pega la URL que quieres analizar',
      placeholder: 'https://tuweb.com',
      helper:
        'El sistema toma una web real, detecta fricciones y abre una ruta más clara de mejora.',
    },
    scale: {
      label: 'Explica qué quieres automatizar o reforzar',
      placeholder:
        'Quiero automatizar el análisis, la captación y el seguimiento de proyectos de clientes.',
      helper:
        'El sistema organiza procesos, detecta prioridades y abre una ruta más ordenada para escalar.',
    },
  };

  const currentConfig = inputConfig[activeIntent] || inputConfig.create;

  return (
    <div className="rounded-[28px] border border-white/10 bg-black/35 p-5 shadow-[0_0_30px_rgba(0,0,0,0.22)]">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Qué quieres hacer
        </p>
        <IntentTabs
          items={intentItems}
          activeId={activeIntent}
          onChange={onIntentChange}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            {currentIntent?.title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-300 md:text-base">
            {currentIntent?.description}
          </p>

          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Tipo de construcción
            </p>

            <TypeTabs
              items={typeItems}
              activeId={activeType}
              onChange={onTypeChange}
              visible={activeIntent === 'create'}
            />

            {activeIntent === 'create' && (
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Elige el formato principal. El sistema adapta la ruta según el objetivo del proyecto.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-semibold text-white">
            {currentConfig.label}
          </label>

          <div className="rounded-[24px] border border-cyan-500/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-3 shadow-[0_0_24px_rgba(6,182,212,0.08)]">
            <textarea
              rows={3}
              placeholder={currentConfig.placeholder}
              className="w-full resize-none rounded-[18px] border border-zinc-800 bg-black/45 px-4 py-4 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-cyan-400/40"
            />
          </div>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {currentConfig.helper}
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-200 via-white to-amber-100 px-6 py-3 text-sm font-semibold text-black shadow-[0_0_28px_rgba(251,191,36,0.16)] transition hover:opacity-95"
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
      </div>
    </div>
  );
};

export default BuilderInputPanel;