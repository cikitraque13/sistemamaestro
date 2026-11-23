import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import HomePlansPanel from './HomePlansPanel';

const PLANS_PANEL_ID = 'home-plans-panel';
const PLANS_HASH = '#pricing';

const navItems = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Para quién es', href: '#para-quien-es' },
  { label: 'Radar IA', href: '#radar-ia' },
];

const HomeNav = () => {
  const headerRef = useRef(null);
  const [plansOpen, setPlansOpen] = useState(false);

  const closePlans = useCallback(() => setPlansOpen(false), []);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash !== PLANS_HASH) return;
      setPlansOpen(true);
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`
      );
    };

    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  useEffect(() => {
    if (!plansOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setPlansOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPlansOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [plansOpen]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-white/5 bg-[#080808]/88 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:gap-6 md:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/15 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_55%),linear-gradient(180deg,#17120B_0%,#050505_100%)] p-1.5 shadow-[0_0_28px_rgba(245,158,11,0.10)] md:h-12 md:w-12">
            <img
              src="/sistema_maestro_gold_logo.png"
              alt="Sistema Maestro"
              className="h-full w-full object-contain"
              draggable="false"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              Sistema Maestro
            </p>
            <p className="hidden text-xs text-zinc-400 sm:block">
              Dirección, IA y continuidad
            </p>
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
            className="inline-flex whitespace-nowrap rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,rgba(255,242,204,0.16),rgba(242,180,90,0.11),rgba(244,114,182,0.11))] px-3 py-2 text-xs font-semibold text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(245,158,11,0.08)] transition hover:border-amber-200/45 hover:bg-amber-200/[0.12] sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Iniciar sesión
          </Link>

          <button
            type="button"
            aria-expanded={plansOpen}
            aria-controls={PLANS_PANEL_ID}
            onClick={() => setPlansOpen((open) => !open)}
            className="inline-flex whitespace-nowrap rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,rgba(255,242,204,0.16),rgba(242,180,90,0.11),rgba(244,114,182,0.11))] px-3 py-2 text-xs font-semibold text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(245,158,11,0.08)] transition hover:border-amber-200/45 hover:bg-amber-200/[0.12] sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Planes
          </button>
        </div>
      </div>

      {plansOpen ? (
        <HomePlansPanel id={PLANS_PANEL_ID} onSelect={closePlans} />
      ) : null}
    </header>
  );
};

export default HomeNav;