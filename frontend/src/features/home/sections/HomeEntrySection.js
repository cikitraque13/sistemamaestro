import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  { id: 'idea', label: 'Idea' },
  { id: 'web', label: 'URL' },
  { id: 'scale', label: 'Escalar' },
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
      eyebrow: 'Analizar una web existente',
      title: 'Pega una URL y recibe una primera lectura accionable.',
      placeholder: 'https://tuweb.com',
      helper:
        'Sistema Maestro detecta foco, fricción y oportunidades para preparar una entrada más clara.',
    };
  }

  if (mode === 'scale') {
    return {
      eyebrow: 'Ordenar un proyecto vivo',
      title: 'Escala tu proyecto con una ruta de continuidad.',
      placeholder:
        'Quiero ordenar oferta, captación, continuidad y capacidad operativa de un proyecto que ya está vivo.',
      helper:
        'El sistema separa lo urgente de lo secundario y prepara el siguiente avance con criterio.',
    };
  }

  return {
    eyebrow: 'Construir desde una idea',
    title: 'Describe qué quieres crear y recibe una base más clara.',
    placeholder: getIdeaPlaceholderByType(type),
    helper:
      'El sistema convierte una idea inicial en diagnóstico, ruta y entrada de arranque.',
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
    title: 'Entrada de arranque',
    text: 'Prepara una primera base útil para avanzar dentro del sistema con más criterio.',
    icon: FastForward,
    classes:
      'border-fuchsia-400/20 bg-[linear-gradient(180deg,rgba(61,16,60,0.92),rgba(38,10,39,0.92))] shadow-[inset_0_0_0_1px_rgba(217,70,239,0.08)]',
    iconClasses: 'bg-fuchsia-500/10 text-fuchsia-100',
  },
];

const peachPrimaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#FFF2CC_0%,#F2B45A_58%,#F472B6_100%)] px-5 py-3.5 text-sm font-semibold text-black shadow-[0_14px_32px_rgba(245,158,11,0.20)] transition hover:scale-[1.01] hover:shadow-[0_16px_38px_rgba(244,114,182,0.24)]';

const peachSecondaryButton =
  'inline-flex items-center justify-center rounded-2xl border border-amber-200/24 bg-[linear-gradient(135deg,rgba(255,242,204,0.11),rgba(242,180,90,0.08),rgba(244,114,182,0.08))] px-5 py-3.5 text-sm font-semibold text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-amber-200/40 hover:bg-amber-200/[0.10]';

const MobileEntry = () => {
  return (
    <section
      id="constructor-maestro"
      className="relative overflow-hidden px-5 pb-8 pt-7 md:hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(245,158,11,0.20),transparent_30%),radial-gradient(circle_at_86%_24%,rgba(244,114,182,0.12),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(6,182,212,0.08),transparent_34%)]" />

      <div className="relative mx-auto max-w-md">
        <div className="overflow-hidden rounded-[34px] border border-amber-200/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.014))] p-5 shadow-[0_0_50px_rgba(245,158,11,0.09)]">
          <div className="inline-flex rounded-full border border-amber-200/18 bg-amber-200/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
            Sistema Maestro Gold
          </div>

          <h1 className="mt-5 text-[2.2rem] font-semibold leading-[0.97] tracking-tight text-white">
            Construye y acelera proyectos digitales con inteligencia artificial.
          </h1>

          <p className="mt-4 text-sm leading-7 text-zinc-300">
            Una aplicación para ordenar ideas, webs, oportunidades y proyectos antes de construirlos con más criterio.
          </p>

          <div className="mt-5 rounded-2xl border border-white/8 bg-black/25 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Para quién es
            </p>

            <div className="mt-3 space-y-2.5 text-sm leading-6 text-zinc-300">
              <p>
                <span className="font-semibold text-white">Fundadores</span> que quieren ordenar una idea antes de invertir tiempo.
              </p>
              <p>
                <span className="font-semibold text-white">Negocios</span> que necesitan mejorar su presencia digital con más dirección.
              </p>
              <p>
                <span className="font-semibold text-white">Agencias y profesionales</span> que buscan acelerar proyectos con IA.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <Link
              to="/register"
              className={peachPrimaryButton}
            >
              Registrarme gratis
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="text-center text-xs leading-5 text-zinc-500">
              Incluye 10 gemas iniciales para conocer el sistema.
            </p>
          </div>
        </div>

        <div
          id="informe-maestro-gold"
          className="mt-4 overflow-hidden rounded-[32px] border border-amber-200/18 bg-[linear-gradient(135deg,rgba(255,228,163,0.09),rgba(244,114,182,0.065),rgba(6,182,212,0.035))] p-5 shadow-[0_0_38px_rgba(245,158,11,0.065)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d5b16e]">
            Entrada al sistema
          </p>

          <h2 className="mt-3 text-2xl font-semibold leading-tight text-white">
            Empieza gratis. Entra mejor preparado con el informe.
          </h2>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-emerald-300/14 bg-emerald-300/[0.055] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100/75">
                Registro gratis
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                10 gemas iniciales
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Activa tu cuenta y entra al sistema para conocer la aplicación.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.085] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
                Informe Maestro Gold · 6,99 €
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                Lectura guiada + 10 gemas extra
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Una entrada más clara antes de gastar tus gemas dentro del sistema.
              </p>
            </div>

            <div className="rounded-2xl border border-fuchsia-300/16 bg-fuchsia-300/[0.065] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-100/78">
                Arranque preparado
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                Hasta 20 gemas para empezar
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Más margen para construir una primera base con dirección.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <a
              href="#informe-maestro-gold"
              className={peachPrimaryButton}
            >
              Ver Informe Maestro Gold
              <ArrowRight className="h-4 w-4" />
            </a>

            <Link
              to="/register"
              className={peachSecondaryButton}
            >
              Crear cuenta y recibir 10 gemas
            </Link>
          </div>
        </div>

        <div className="mt-4 rounded-[30px] border border-amber-200/14 bg-[linear-gradient(135deg,rgba(255,228,163,0.065),rgba(244,114,182,0.04),rgba(6,182,212,0.025))] p-5">
          <p className="text-sm font-semibold text-amber-100">
            Pensado para trabajar proyectos en serio desde ordenador.
          </p>

          <p className="mt-2 text-xs leading-5 text-zinc-400">
            Desde móvil puedes entender el sistema y activar tu acceso. Cuando llegues al ordenador, entra, usa tus gemas y trabaja con más profundidad.
          </p>
        </div>
      </div>
    </section>
  );
};

const DesktopEntry = () => {
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
      className="relative hidden overflow-hidden px-6 pb-10 pt-5 md:block md:px-10 md:pb-12 md:pt-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_88%,rgba(245,158,11,0.22),transparent_18%),radial-gradient(circle_at_72%_12%,rgba(217,70,239,0.14),transparent_22%),radial-gradient(circle_at_92%_20%,rgba(8,145,178,0.12),transparent_18%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Entrada guiada
            </p>

            <h2 className="max-w-[11ch] text-[2.35rem] font-semibold leading-[0.95] tracking-tight text-white md:text-[3.35rem]">
              Pon tu idea o URL.
              <span className="block bg-[linear-gradient(135deg,#f7d58d_0%,#f3a56b_45%,#ef78b7_100%)] bg-clip-text text-transparent">
                Entra con una ruta clara.
              </span>
            </h2>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,228,163,0.07),rgba(244,114,182,0.065),rgba(6,182,212,0.045))] p-5 shadow-[0_0_45px_rgba(245,158,11,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d5b16e]">
              Qué prepara el sistema
            </p>

            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Describe una idea, pega una URL o explica qué quieres mejorar. Sistema Maestro prepara una primera lectura útil para avanzar sin ruido.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-300/14 bg-emerald-300/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100/70">
                  Registro gratis
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  10 gemas iniciales
                </p>
              </div>

              <div className="rounded-2xl border border-amber-300/18 bg-amber-300/[0.075] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/80">
                  Informe 6,99 €
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Lectura guiada + 10 gemas
                </p>
              </div>

              <div className="rounded-2xl border border-fuchsia-300/16 bg-fuchsia-300/[0.065] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-100/75">
                  Arranque
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Hasta 20 gemas de entrada
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a href="#pricing" className={peachPrimaryButton}>
                Ver informe de entrada
                <ArrowRight className="h-4 w-4" />
              </a>

              <Link to="/register" className={peachSecondaryButton}>
                Registrarme gratis
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid items-stretch gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="h-full rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(6,6,6,0.96))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d5b16e]">
              Qué quieres construir
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

            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                {current.eyebrow}
              </p>

              <h3 className="max-w-[18ch] text-[1.65rem] font-semibold leading-[1.04] text-white md:text-[1.95rem]">
                {current.title}
              </h3>

              {!isWebMode && (
                <div className="mt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                    Tipo de proyecto
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

              <div className="relative mt-5 rounded-[30px] border border-amber-200/22 bg-[linear-gradient(135deg,rgba(255,228,163,0.22),rgba(255,210,161,0.16),rgba(242,139,165,0.14))] p-1 shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
                <div className="rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_30%),linear-gradient(180deg,#080909_0%,#050606_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/70">
                      Entrada del usuario
                    </p>

                    <span className="rounded-full border border-cyan-300/18 bg-cyan-300/[0.07] px-3 py-1 text-[11px] font-semibold text-cyan-100">
                      Interpretación inicial
                    </span>
                  </div>

                  {isWebMode ? (
                    <input
                      type="text"
                      placeholder={current.placeholder}
                      className="w-full rounded-[20px] border border-white/10 bg-black/50 px-5 py-4 text-sm text-white placeholder:text-zinc-500 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus:border-amber-200/28"
                    />
                  ) : (
                    <div className="relative">
                      <textarea
                        rows={3}
                        placeholder={current.placeholder}
                        className="w-full resize-none rounded-[20px] border border-white/10 bg-black/50 px-5 py-4 pr-12 text-sm leading-7 text-white placeholder:text-zinc-500 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus:border-amber-200/28"
                      />
                      <Pencil className="pointer-events-none absolute bottom-4 right-4 h-4 w-4 text-amber-100/45" />
                    </div>
                  )}

                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    Escribe lo esencial. La primera lectura ordenará foco, prioridad y vía de entrada.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 text-sm leading-6 text-zinc-300">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#f2c978]" />
                <span>{current.helper}</span>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a href="#pricing" className={peachPrimaryButton}>
                  Informe 6,99 € + 10 gemas
                  <ArrowRight className="h-4 w-4" />
                </a>

                <Link to="/register" className={peachSecondaryButton}>
                  Empezar gratis con 10 gemas
                </Link>
              </div>
            </div>
          </div>

          <div className="h-full rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(6,6,6,0.96))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d5b16e]">
              Lo que recibes
            </p>

            <h3 className="mt-4 max-w-[12ch] text-[1.85rem] font-semibold leading-[1.03] text-white md:text-[2.05rem]">
              Una lectura clara antes de construir.
            </h3>

            <p className="mt-3 max-w-md text-sm leading-7 text-zinc-400">
              La primera salida no promete hacerlo todo. Ordena el caso, reduce duda y prepara una entrada mejor al sistema.
            </p>

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

const HomeEntrySection = () => {
  return (
    <>
      <MobileEntry />
      <DesktopEntry />
    </>
  );
};

export default HomeEntrySection;