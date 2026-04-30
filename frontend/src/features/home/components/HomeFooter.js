import React from 'react';
import { Link } from 'react-router-dom';

const HomeFooter = () => {
  return (
    <footer className="border-t border-zinc-800 bg-black/30 px-6 py-10 md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl md:hidden">
        <div className="rounded-[30px] border border-amber-200/14 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-5 shadow-[0_0_38px_rgba(245,158,11,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/15 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_55%),linear-gradient(180deg,#17120B_0%,#050505_100%)] p-1.5 shadow-[0_0_24px_rgba(245,158,11,0.10)]">
              <img
                src="/sistema_maestro_gold_logo.png"
                alt="Sistema Maestro"
                className="h-full w-full object-contain"
                draggable="false"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Sistema Maestro</p>
              <p className="text-xs text-zinc-400">Dirección, IA y continuidad</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-300">
            Una plataforma para ordenar ideas, webs, oportunidades y proyectos digitales antes de construir con más criterio.
          </p>

          <div className="mt-5 rounded-2xl border border-amber-200/14 bg-amber-200/[0.055] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/75">
              Entrada al sistema
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              10 gemas gratis · Informe Gold + 10 gemas · hasta 20 gemas para arrancar.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5">
          <div className="rounded-[26px] border border-white/8 bg-black/25 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Sistema
            </p>

            <div className="mt-4 grid gap-3 text-sm text-zinc-300">
              <a href="#constructor-maestro" className="transition hover:text-white">
                Qué es Sistema Maestro
              </a>
              <span>
                Para fundadores, negocios, agencias y profesionales.
              </span>
              <span>
                Dirección antes de construir.
              </span>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/8 bg-black/25 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Herramientas
            </p>

            <div className="mt-4 grid gap-3 text-sm text-zinc-300">
              <span>Gemas Maestras</span>
              <a href="#informe-maestro-gold" className="transition hover:text-white">
                Informe Maestro Gold
              </a>
              <span>Oportunidades monetizables</span>
              <span>Proyectos con continuidad</span>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/8 bg-black/25 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Legal
            </p>

            <div className="mt-4 grid gap-3 text-sm text-zinc-400">
              <Link to="/privacy" className="transition hover:text-white">
                Privacidad
              </Link>
              <Link to="/cookies" className="transition hover:text-white">
                Cookies
              </Link>
              <Link to="/terms" className="transition hover:text-white">
                Términos
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-amber-200/14 bg-[linear-gradient(135deg,rgba(255,228,163,0.065),rgba(244,114,182,0.04),rgba(6,182,212,0.025))] p-5">
          <p className="text-sm font-semibold text-amber-100">
            Activa tu entrada desde el móvil.
          </p>

          <p className="mt-2 text-xs leading-5 text-zinc-400">
            Cuando llegues al ordenador, entra al sistema y trabaja tu proyecto con más profundidad, dirección y continuidad.
          </p>
        </div>

        <p className="mt-6 text-xs text-zinc-600">
          © Sistema Maestro. Arquitectura, IA y continuidad para proyectos digitales.
        </p>
      </div>

      <div className="mx-auto hidden max-w-7xl gap-10 md:grid md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/15 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_55%),linear-gradient(180deg,#17120B_0%,#050505_100%)] p-1.5 shadow-[0_0_24px_rgba(245,158,11,0.10)]">
              <img
                src="/sistema_maestro_gold_logo.png"
                alt="Sistema Maestro"
                className="h-full w-full object-contain"
                draggable="false"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Sistema Maestro</p>
              <p className="text-xs text-zinc-400">Sistema para analizar, ordenar y construir mejor</p>
            </div>
          </div>

          <p className="mt-4 max-w-md text-sm leading-6 text-zinc-400">
            Pensado para fundadores, agencias y operadores digitales que necesitan una capa de sistema para posicionar, convertir y avanzar con más criterio.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Navegación</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-zinc-400">
            <a href="#constructor-maestro" className="transition hover:text-white">Constructor</a>
            <a href="#como-funciona" className="transition hover:text-white">Cómo funciona</a>
            <a href="#radar-ia" className="transition hover:text-white">Radar IA</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Legal y acceso</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-zinc-400">
            <Link to="/privacy" className="transition hover:text-white">Privacidad</Link>
            <Link to="/cookies" className="transition hover:text-white">Cookies</Link>
            <Link to="/terms" className="transition hover:text-white">Términos</Link>
            <Link to="/login" className="transition hover:text-white">Iniciar sesión</Link>
            <Link to="/register" className="transition hover:text-white">Crear cuenta</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 hidden max-w-7xl border-t border-zinc-800 pt-6 md:block">
        <p className="text-xs text-zinc-500">
          © Sistema Maestro. Arquitectura, IA, estructura y continuidad para proyectos digitales.
        </p>
      </div>
    </footer>
  );
};

export default HomeFooter;