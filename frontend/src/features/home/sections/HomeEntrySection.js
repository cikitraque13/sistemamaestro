import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  FastForward,
  ListChecks,
  Pencil,
  Search,
  Sparkles,
} from 'lucide-react';

const modes = [
  { id: 'idea', label: 'Pon tu idea' },
  { id: 'web', label: 'Pega tu URL' },
  { id: 'scale', label: 'Escala tu proyecto' },
];

const projectTypes = [
  { id: 'website', label: 'Web' },
  { id: 'tool', label: 'Herramienta' },
  { id: 'automation', label: 'Automatización' },
];

const getIdeaPlaceholderByType = (type) => {
  if (type === 'tool') {
    return 'Quiero crear una herramienta para analizar webs, ordenar prioridades y proponer una ruta clara de mejora con IA.';
  }

  if (type === 'automation') {
    return 'Quiero crear una automatización para captar, clasificar y activar oportunidades dentro de un flujo más claro.';
  }

  return 'Quiero crear una web para captar mejor, ordenar mi oferta y construir con más criterio.';
};

const getModeContent = (mode, type) => {
  if (mode === 'web') {
    return {
      title: 'Pega tu URL y recibe una primera lectura.',
      placeholder: 'https://tuweb.com',
      helper:
        'El sistema detecta foco, ordena el caso y prepara una entrada seria.',
    };
  }

  if (mode === 'scale') {
    return {
      title: 'Escala tu proyecto con una ruta más clara.',
      placeholder:
        'Quiero ordenar builder, despliegue, continuidad y capacidad operativa de un proyecto que ya está vivo.',
      helper:
        'El sistema detecta foco, ordena el caso y prepara una entrada seria.',
    };
  }

  return {
    title: 'Pon tu idea y construye una web, una herramienta o una automatización.',
    placeholder: getIdeaPlaceholderByType(type),
    helper:
      'El sistema detecta foco, ordena el caso y prepara una entrada seria.',
  };
};

const outputs = [
  {
    title: 'Diagnóstico inicial',
    text: 'Aclara el punto de partida y detecta la primera palanca útil.',
    icon: Search,
    classes:
      'border-cyan-400/20 bg-[linear-gradient(180deg,rgba(8,47,73,0.92),rgba(6,30,44,0.92))] shadow-[inset_0_0_0_1px_rgba(34,211,238,0.08)]',
    iconClasses: 'bg-cyan-500/10 text-cyan-100',
  },
  {
    title: 'Ruta priorizada',
    text: 'Ordena prioridades y deja claro qué conviene hacer primero.',
    icon: ListChecks,
    classes:
      'border-emerald-400/20 bg-[linear-gradient(180deg,rgba(6,52,41,0.92),rgba(4,34,27,0.92))] shadow-[inset_0_0_0_1px_rgba(16,185,129,0.08)]',
    iconClasses: 'bg-emerald-500/10 text-emerald-100',
  },
  {
    title: 'Siguiente paso',
    text: 'Prepara entrada al informe, al builder o a la continuidad dentro del sistema.',
    icon: FastForward,
    classes:
      'border-fuchsia-400/20 bg-[linear-gradient(180deg,rgba(61,16,60,0.92),rgba(38,10,39,0.92))] shadow-[inset_0_0_0_1px_rgba(217,70,239,0.08)]',
    iconClasses: 'bg-fuchsia-500/10 text-fuchsia-100',
  },
];

const HomeEntrySection = () => {
  const [activeMode, setActiveMode] = useState('idea');
  const [activeType, setActiveType] = useState('automation');

  const current = useMemo(
    () => getModeContent(activeMode, activeType),
    [activeMode, activeType]
  );

  const isWebMode = activeMode === 'web';

  return (
    <section
      id="constructor-maestro"
      className="relative overflow-hidden px-6 pb-10 pt-4 md:px-10 md:pb-12 md:pt-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_88%,rgba(245,158,11,0.22),transparent_18%),radial-gradient(circle_at_72%_12%,rgba(217,70,239,0.14),transparent_22%),radial-gradient(circle_at_92%_20%,rgba(8,145,178,0.12),transparent_18%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-5xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Entrada guiada
          </p>

          <h2 className="max-w-[12ch] text-[2.45rem] font-semibold leading-[0.95] tracking-tight text-white md:text-[3.5rem]">
            Pon tu idea o pega tu URL y entra con{' '}
            <span className="bg-[linear-gradient(135deg,#f7d58d_0%,#f3a56b_45%,#ef78b7_100%)] bg-clip-text text-transparent">
              más claridad.
            </span>
          </h2>
        </div>

        <div className="mt-5 grid items-stretch gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="h-full rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(6,6,6,0.96))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d5b16e]">
              QUE QUIERES HACER
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {modes.map((mode) => {
                const isActive = mode.id === activeMode;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setActiveMode(mode.id)}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'border-amber-200/20 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] text-black shadow-[0_10px_24px_rgba(245,158,11,0.16)]'
                        : 'border-white/10 bg-white/[0.02] text-white hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    {mode.label}
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <h3 className="max-w-[16ch] text-[1.8rem] font-semibold leading-[1.03] text-white md:text-[2rem]">
                {current.title}
              </h3>

              {!isWebMode && (
                <div className="mt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                    TIPO DE PROYECTO
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {projectTypes.map((item) => {
                      const isActive = item.id === activeType;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveType(item.id)}
                          className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                            isActive
                              ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100 shadow-[0_8px_20px_rgba(6,182,212,0.12)]'
                              : 'border-white/10 bg-white/[0.02] text-zinc-200 hover:border-white/20 hover:bg-white/[0.04]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="relative mt-5">
                {isWebMode ? (
                  <input
                    type="text"
                    placeholder={current.placeholder}
                    className="w-full rounded-[20px] border border-white/10 bg-[#0a0a0a] px-5 py-4 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-cyan-400/25"
                  />
                ) : (
                  <>
                    <textarea
                      rows={3}
                      placeholder={current.placeholder}
                      className="w-full resize-none rounded-[20px] border border-white/10 bg-[#0a0a0a] px-5 py-4 pr-12 text-sm leading-7 text-white placeholder:text-zinc-500 outline-none transition focus:border-cyan-400/25"
                    />
                    <Pencil className="pointer-events-none absolute bottom-4 right-4 h-4 w-4 text-zinc-500" />
                  </>
                )}
              </div>

              <div className="mt-4 flex items-start gap-2 text-sm leading-6 text-zinc-300">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#f2c978]" />
                <span>{current.helper}</span>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] px-5 py-3.5 text-sm font-semibold text-black shadow-[0_12px_26px_rgba(245,158,11,0.16)] transition hover:scale-[1.01]"
                >
                  Recibir primera lectura
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.04]"
                >
                  Ver cómo entro al sistema
                </a>
              </div>
            </div>
          </div>

          <div className="h-full rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(6,6,6,0.96))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d5b16e]">
              LO QUE RECIBES
            </p>

            <h3 className="mt-4 max-w-[10ch] text-[1.85rem] font-semibold leading-[1.03] text-white md:text-[2.05rem]">
              Entras con una lectura clara, no con ruido.
            </h3>

            <div className="mt-5 space-y-4">
              {outputs.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`rounded-[22px] border p-4 ${item.classes}`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${item.iconClasses}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      <div>
                        <p className="text-[1rem] font-semibold text-white md:text-[1.08rem]">
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-zinc-100">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeEntrySection;