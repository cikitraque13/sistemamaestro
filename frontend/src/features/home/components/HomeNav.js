import React from 'react';
import { Link } from 'react-router-dom';

const navItems = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Para quién es', href: '#para-quien-es' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Radar IA', href: '#radar-ia' },
];

const HomeNav = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#080808]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:gap-6 md:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/15 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_55%),linear-gradient(180deg,#17120B_0%,#050505_100%)] p-1.5 shadow-[0_0_28px_rgba(245,158,11,0.10)]">
            <img
              src="/sistema_maestro_gold_logo.png"
              alt="Sistema Maestro"
              className="h-full w-full object-contain"
              draggable="false"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Sistema Maestro</p>
            <p className="hidden text-xs text-zinc-400 sm:block">Dirección, IA y continuidad</p>
          </div>
        </div>

        <nav className="hidden items-center gap-7 lg:flex">
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="inline-flex rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.05] sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Iniciar sesión
          </Link>

          <a
            href="#constructor-maestro"
            className="hidden rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#FFF2CC_0%,#F2B45A_58%,#F472B6_100%)] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(245,158,11,0.18)] transition hover:scale-[1.01] hover:shadow-[0_12px_34px_rgba(244,114,182,0.22)] sm:inline-flex"
          >
            Empezar con mi proyecto
          </a>
        </div>
      </div>
    </header>
  );
};

export default HomeNav;