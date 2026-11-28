import React from 'react';

import BuilderAccountMenu from './BuilderAccountMenu';

export default function BuilderShellHeader({
  navigationItems = [],
  activeNavId = 'builder',
  onNavChange = () => {},
  projectCount = 0,
  creditLabel = '',
  onNewProject = () => {},
}) {
  return (
    <header
      data-testid="builder-shell-header"
      className="sticky top-0 z-40 border-b border-white/10 bg-[#070A0C]/95 backdrop-blur-2xl"
    >
      <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <BuilderAccountMenu />
          </div>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <div className="hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-right lg:block">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Estado</p>
              <p className="text-xs font-medium text-zinc-200">
                {projectCount > 0 ? 'Proyecto abierto' : 'Sin proyecto abierto'}
                {creditLabel ? ` · ${creditLabel}` : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center justify-center rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-200 via-white to-amber-100 px-4 py-2.5 text-sm font-semibold text-black shadow-[0_10px_24px_rgba(245,158,11,0.12)] transition hover:scale-[1.01] hover:opacity-95"
            >
              Nuevo proyecto
            </button>
          </div>
        </div>

        <nav aria-label="Secciones" className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
          {navigationItems.map((item) => {
            const isActive = item.id === activeNavId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavChange(item.id)}
                className={`inline-flex shrink-0 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-cyan-400/35 bg-cyan-400/12 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.08)]'
                    : 'border-white/10 bg-white/[0.025] text-zinc-300 hover:border-white/20 hover:bg-white/[0.045] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
