import React from 'react';

const inputConfig = {
  create: {
    label: 'Cuentale tu idea al sistema',
    placeholder:
      'Quiero crear una herramienta para analizar webs y generar una ruta de mejora con IA.',
    helper:
      'El sistema interpreta la idea, ordena la ruta y devuelve una primera lectura clara para ayudarte a decidir el siguiente paso.',
    tone: 'amber',
  },
  improve: {
    label: 'Pega la URL que quieres analizar',
    placeholder: 'https://tuweb.com',
    helper:
      'El sistema toma una web real, detecta fricciones y devuelve una lectura inicial mas clara para orientar la mejora.',
    tone: 'cyan',
  },
  scale: {
    label: 'Explica que quieres automatizar o reforzar',
    placeholder:
      'Quiero automatizar analisis, captacion y seguimiento de proyectos con una base mas clara.',
    helper:
      'El sistema organiza prioridades, detecta palancas y propone una ruta mas ordenada para escalar con criterio.',
    tone: 'pink',
  },
};

const intentToneClasses = {
  create:
    'border-amber-300/30 bg-[linear-gradient(135deg,#FFF2CC_0%,#F2B45A_58%,#F59E0B_100%)] text-black shadow-[0_10px_24px_rgba(245,158,11,0.18)]',
  improve:
    'border-cyan-400/20 bg-cyan-500/10 text-cyan-100 shadow-[0_10px_24px_rgba(6,182,212,0.10)]',
  scale:
    'border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100 shadow-[0_10px_24px_rgba(244,114,182,0.10)]',
};

const intentDefaultClasses =
  'border-white/8 bg-white/[0.02] text-white hover:border-white/15 hover:bg-white/[0.04]';

const typeToneClasses = {
  website:
    'border-amber-400/20 bg-amber-500/10 text-amber-100',
  tool:
    'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  app:
    'border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100',
};

const typeDefaultClasses =
  'border-white/8 bg-white/[0.02] text-zinc-200 hover:border-white/15 hover:bg-white/[0.04]';

const rightToneClasses = {
  amber:
    'border-amber-500/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02))] shadow-[0_0_30px_rgba(245,158,11,0.08)]',
  cyan:
    'border-cyan-500/20 bg-[linear-gradient(180deg,rgba(6,182,212,0.08),rgba(255,255,255,0.02))] shadow-[0_0_30px_rgba(6,182,212,0.08)]',
  pink:
    'border-fuchsia-500/20 bg-[linear-gradient(180deg,rgba(244,114,182,0.08),rgba(255,255,255,0.02))] shadow-[0_0_30px_rgba(244,114,182,0.08)]',
};

const HomeEntryPanel = ({
  activeIntent,
  activeType,
  onIntentChange,
  onTypeChange,
  intentItems = [],
  typeItems = [],
}) => {
  const currentIntent =
    intentItems.find((item) => item.id === activeIntent) || intentItems[0];

  const currentConfig = inputConfig[activeIntent] || inputConfig.create;

  return (
    <div className="rounded-[34px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-7">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Que quieres hacer
        </p>

        <div className="flex flex-wrap gap-3">
          {intentItems.map((item) => {
            const isActive = item.id === activeIntent;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onIntentChange(item.id)}
                className={`rounded-2xl border px-5 py-3 text-base font-semibold transition ${
                  isActive ? intentToneClasses[item.id] : intentDefaultClasses
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="grid gap-5">
          <div className="rounded-[28px] border border-white/6 bg-black/35 p-6">
            <h3 className="text-[2.25rem] font-semibold leading-[1.02] text-white md:text-[3rem]">
              {currentIntent?.title}
            </h3>

            <p className="mt-5 text-sm leading-7 text-zinc-300 md:text-base">
              {currentIntent?.description}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/6 bg-black/25 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Tipo de proyecto
            </p>

            <div className="flex flex-wrap gap-3">
              {typeItems.map((item) => {
                const isActive = item.id === activeType;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTypeChange(item.id)}
                    className={`rounded-2xl border px-5 py-3 text-base font-semibold transition ${
                      isActive ? typeToneClasses[item.id] : typeDefaultClasses
                    } ${activeIntent !== 'create' ? 'opacity-60' : ''}`}
                    disabled={activeIntent !== 'create'}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-400">
              {activeIntent === 'create'
                ? 'Elige el formato principal. El sistema adapta la lectura y la ruta segun el objetivo del proyecto.'
                : 'Aqui manda la necesidad de mejora o continuidad. El tipo deja de ser lo principal.'}
            </p>
          </div>
        </div>

        <div
          className={`flex flex-col rounded-[28px] border p-5 ${rightToneClasses[currentConfig.tone]}`}
        >
          <label className="mb-3 block text-sm font-semibold text-white">
            {currentConfig.label}
          </label>

          <div className="rounded-[22px] border border-white/8 bg-black/45 p-3">
            <textarea
              rows={4}
              placeholder={currentConfig.placeholder}
              className="w-full resize-none rounded-[18px] border border-white/8 bg-black/40 px-4 py-4 text-sm leading-7 text-white placeholder:text-zinc-500 outline-none transition focus:border-white/15"
            />
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-300">
            {currentConfig.helper}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#FFF2CC_0%,#F2B45A_58%,#F472B6_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_28px_rgba(245,158,11,0.18)] transition hover:scale-[1.01]"
            >
              Desbloquear lectura 6,99
            </a>

            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Ver como funciona
            </a>
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-black/35 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Nota de entrada
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Primero activas una lectura orientativa. El trabajo profundo continua dentro del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeEntryPanel;