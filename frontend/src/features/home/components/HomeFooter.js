import React from 'react';
import { Link } from 'react-router-dom';

const HomeFooter = () => {
  return (
    <footer className="border-t border-zinc-800 bg-black/30 px-6 py-12 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-sm font-semibold text-white">
              SM
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
            <a href="#captacion-inteligente" className="transition hover:text-white">Captación</a>
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

      <div className="mx-auto mt-10 max-w-7xl border-t border-zinc-800 pt-6">
        <p className="text-xs text-zinc-500">
          © Sistema Maestro. Arquitectura, IA, estructura y continuidad para proyectos digitales.
        </p>
      </div>
    </footer>
  );
};

export default HomeFooter;