import React from 'react';
import { Link } from 'react-router-dom';

const navItems = [
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Para quien es', href: '#para-quien-es' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Radar IA', href: '#captacion-inteligente' },
];

const HomeNav = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#080808]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.18),transparent_48%),linear-gradient(180deg,#171717_0%,#0A0A0A_100%)] text-lg font-semibold text-white shadow-[0_0_28px_rgba(244,114,182,0.10)]">
            SM
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Sistema Maestro</p>
            <p className="text-xs text-zinc-400">Direccion, IA y continuidad</p>
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

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.05] sm:inline-flex"
          >
            Iniciar sesion
          </Link>

          <a
            href="#constructor-maestro"
            className="inline-flex rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#FFF2CC_0%,#F2B45A_58%,#F472B6_100%)] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(245,158,11,0.18)] transition hover:scale-[1.01] hover:shadow-[0_12px_34px_rgba(244,114,182,0.22)]"
          >
            Empezar con mi proyecto
          </a>
        </div>
      </div>
    </header>
  );
};

export default HomeNav;