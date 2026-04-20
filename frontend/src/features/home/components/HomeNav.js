import React from 'react';
import { Link } from 'react-router-dom';

const navItems = [
  { label: 'Constructor', href: '#constructor-maestro' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Captación', href: '#captacion-inteligente' },
  { label: 'Pricing', href: '#pricing' },
];

const HomeNav = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#0A0A0A]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-sm font-semibold text-white">
            SM
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sistema Maestro</p>
            <p className="text-xs text-zinc-400">IA, estructura y conversión</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-zinc-300 transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden rounded-2xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-zinc-500 sm:inline-flex"
          >
            Iniciar sesión
          </Link>

          <Link
            to="/register"
            className="inline-flex rounded-2xl border border-white bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Empezar
          </Link>
        </div>
      </div>
    </header>
  );
};

export default HomeNav;