import React from 'react';

export default function AppShellTopbar({
  productLabel = 'Sistema Maestro',
  navigationItems = [],
  activeNavId = 'builder',
  onNavChange = () => {},
  projectCount = 0,
  creditLabel = '120 créditos',
  userLabel = 'Cuenta principal',
  onNewProject = () => {},
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070A0C]/95 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.22),rgba(8,11,13,0.95))] text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.10)]">
              SM
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
                Workspace
              </p>
              <p className="truncate text-sm font-semibold text-white md:text-base">
                {productLabel}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <div className="hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-right lg:block">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Estado
              </p>
              <p className="text-xs font-medium text-zinc-200">
                {projectCount} proyectos · {creditLabel}
              </p>
            </div>

            <button
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center justify-center rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-200 via-white to-amber-100 px-4 py-2.5 text-sm font-semibold text-black shadow-[0_10px_24px_rgba(245,158,11,0.12)] transition hover:scale-[1.01] hover:opacity-95"
            >
              Nuevo proyecto
            </button>

            <div className="hidden max-w-[190px] truncate rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm font-medium text-zinc-200 md:block">
              {userLabel}
            </div>
          </div>
        </div>

        <nav className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
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