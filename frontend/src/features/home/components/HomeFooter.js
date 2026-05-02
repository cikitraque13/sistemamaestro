import React from 'react';
import { Link } from 'react-router-dom';

const HomeFooter = () => {
  return (
    <footer className="border-t border-zinc-800 bg-black/30 px-6 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl md:hidden">
        <div className="rounded-[28px] border border-amber-200/12 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.10),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5">
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
            Arquitectura, inteligencia artificial y continuidad para proyectos digitales.
          </p>

          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Pensado para activar tu entrada desde móvil y trabajar con más profundidad desde ordenador.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-400">
          <Link to="/privacy" className="transition hover:text-white">
            Privacidad
          </Link>
          <Link to="/cookies" className="transition hover:text-white">
            Cookies
          </Link>
          <Link to="/terms" className="transition hover:text-white">
            Términos y condiciones
          </Link>
        </div>

        <p className="mt-5 text-xs text-zinc-600">
          © Sistema Maestro.
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