import React from 'react';
import { Link } from 'react-router-dom';

import BuilderAccountMenu from './BuilderAccountMenu';
import BuilderProjectSelect from './BuilderProjectSelect';

const PLANS_PATH = '/dashboard/billing';
const SUMMARY_PATH = '/dashboard';

export default function BuilderShellHeader({
  productLabel = 'Sistema Maestro',
  projectItems = [],
  activeProjectId = '',
  onProjectChange = () => {},
  onNewProject = () => {},
  freeTestMode = false,
}) {
  return (
    <header
      data-testid="builder-shell-header"
      className="sticky top-0 z-40 border-b border-white/10 bg-[#070A0C]/95 backdrop-blur-2xl"
    >
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={SUMMARY_PATH}
            data-testid="builder-back-summary"
            aria-label="Volver al resumen"
            className="flex min-w-0 items-center gap-3 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            <span aria-hidden="true" className="shrink-0 text-lg leading-none text-zinc-200">←</span>
            <div data-testid="builder-workspace-mark" className="flex min-w-0 items-center gap-3">
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
          </Link>
          <BuilderProjectSelect
            projectItems={projectItems}
            activeProjectId={activeProjectId}
            onProjectChange={onProjectChange}
          />
        </div>

        <div data-testid="builder-header-actions" className="flex shrink-0 items-center gap-2">
          <Link
            to={PLANS_PATH}
            data-testid="builder-header-upgrade"
            className="inline-flex items-center justify-center rounded-full border border-amber-200/70 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-100 px-3 py-2 text-sm font-semibold text-black shadow-[0_0_22px_rgba(250,204,21,0.28)] transition hover:brightness-105 sm:px-4"
          >
            Mejorar plan
          </Link>
          {freeTestMode ? (
            <p
              data-testid="builder-free-test-badge"
              className="inline-flex shrink-0 items-center rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-[11px] font-semibold text-amber-100"
            >
              Modo prueba · sin gemas
            </p>
          ) : null}
          <BuilderAccountMenu onNewProject={onNewProject} />
        </div>
      </div>
    </header>
  );
}
