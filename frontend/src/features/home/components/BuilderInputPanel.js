import React from 'react';

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
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 md:p-7">
      <div className="space-y-6">
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

        <div>
          <h3 className="text-xl font-semibold text-white">
            {currentIntent?.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            {currentIntent?.description}
          </p>
        </div>

        <div>
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
              Elige el formato principal. El sistema adapta la ruta de construcción según tu objetivo.
            </p>
          )}
        </div>

        <div>
          <label className="mb-3 block text-sm font-semibold text-white">
            {currentConfig.label}
          </label>
          <textarea
            rows={activeIntent === 'improve' ? 3 : 5}
            defaultValue=""
            placeholder={currentConfig.placeholder}
            className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-4 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-zinc-500"
          />
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {currentConfig.helper}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-white bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Empezar análisis
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-zinc-500"
          >
            Ver cómo funciona
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuilderInputPanel;