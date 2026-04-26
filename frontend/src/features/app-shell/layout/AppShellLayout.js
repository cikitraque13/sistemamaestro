import React from 'react';
import AppShellTopbar from '../components/AppShellTopbar';
import BuilderCreditBar from '../components/BuilderCreditBar';
import BuilderProjectTabs from '../navigation/BuilderProjectTabs';
import BuilderWorkspaceTabs from '../navigation/BuilderWorkspaceTabs';
import APP_SHELL_NAVIGATION from '../navigation/appShellNavigation';

const DEFAULT_PROJECTS = [
  { id: 'project-alpha', label: 'Sistema Maestro', status: 'Base operativa', accent: 'cyan' },
  { id: 'project-growth', label: 'Growth Ops', status: 'Optimización activa', accent: 'emerald' },
  { id: 'project-labs', label: 'Labs', status: 'Exploración', accent: 'violet' },
];

const DEFAULT_WORKSPACE_TABS = [
  { id: 'preview', label: 'Preview' },
  { id: 'code', label: 'Código' },
  { id: 'extract', label: 'Extracción' },
  { id: 'structure', label: 'Estructura' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'github', label: 'GitHub' },
];

function GemaMaestra({ credits, bonus, usageLabel }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-full border border-emerald-300/25 bg-[radial-gradient(circle_at_20%_20%,rgba(253,230,138,0.35),rgba(16,185,129,0.14)_38%,rgba(6,8,10,0.9)_75%)] px-4 py-2 shadow-[0_0_34px_rgba(16,185,129,0.13)]">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-200/35 bg-[linear-gradient(135deg,#bbf7d0,#67e8f9,#fde68a)] text-[11px] font-black text-black shadow-[0_0_26px_rgba(52,211,153,0.2)]">
        <span className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse" />
        <span className="relative">◆</span>
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
          Gema Maestra
        </p>
        <p className="mt-0.5 text-sm font-semibold text-white">
          {credits} créditos
          <span className="ml-1 text-zinc-500">+ {bonus}</span>
        </p>
      </div>

      <p className="hidden max-w-[260px] text-xs leading-5 text-zinc-500 2xl:block">
        {usageLabel}
      </p>
    </div>
  );
}

function BuilderCompactHeader({
  contextTitle,
  contextBody,
  workspaceTabs,
  activeWorkspaceTab,
  onWorkspaceTabChange,
  credits,
  bonus,
  usageLabel,
}) {
  return (
    <section className="shrink-0 rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))] shadow-[0_0_70px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            {contextTitle}
          </p>
          <p className="mt-1 line-clamp-1 max-w-4xl text-sm leading-6 text-zinc-300">
            {contextBody}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center">
          <BuilderWorkspaceTabs
            items={workspaceTabs}
            activeId={activeWorkspaceTab}
            onChange={onWorkspaceTabChange}
          />

          <GemaMaestra
            credits={credits}
            bonus={bonus}
            usageLabel={usageLabel}
          />
        </div>
      </div>
    </section>
  );
}

export default function AppShellLayout({
  children,
  productLabel = 'Sistema Maestro',
  navigationItems = APP_SHELL_NAVIGATION,
  activeNavId = 'builder',
  onNavChange = () => {},
  projectItems = DEFAULT_PROJECTS,
  activeProjectId = 'project-alpha',
  onProjectChange = () => {},
  workspaceTabs = DEFAULT_WORKSPACE_TABS,
  activeWorkspaceTab = 'preview',
  onWorkspaceTabChange = () => {},
  credits = 120,
  bonus = 25,
  usageLabel = 'Construcción · iteración · salida',
  userLabel = 'Cuenta principal',
  onNewProject = () => {},
  contextTitle = 'Builder activo',
  contextBody = 'Construye, itera y prepara salida técnica con agente, código, extracción y preview.',
}) {
  const isBuilderMode = activeNavId === 'builder';

  if (isBuilderMode) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-[#06080A] text-white">
        <AppShellTopbar
          productLabel={productLabel}
          navigationItems={navigationItems}
          activeNavId={activeNavId}
          onNavChange={onNavChange}
          projectCount={projectItems.length}
          creditLabel={`${credits} créditos`}
          userLabel={userLabel}
          onNewProject={onNewProject}
        />

        <main className="mx-auto flex min-h-0 w-full max-w-[1840px] flex-1 flex-col gap-3 overflow-hidden px-4 pb-4 pt-3 md:px-5">
          <BuilderCompactHeader
            contextTitle={contextTitle}
            contextBody={contextBody}
            workspaceTabs={workspaceTabs}
            activeWorkspaceTab={activeWorkspaceTab}
            onWorkspaceTabChange={onWorkspaceTabChange}
            credits={credits}
            bonus={bonus}
            usageLabel={usageLabel}
          />

          <section className="min-h-0 flex-1 overflow-hidden">
            {children || (
              <div className="flex h-full items-center justify-center rounded-[24px] border border-white/[0.08] bg-white/[0.02] px-6 text-center">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Builder
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    Área operativa del Builder.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-zinc-300">
                    El agente, el código, la extracción y el preview viven dentro de esta zona fija.
                  </p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080A] text-white">
      <AppShellTopbar
        productLabel={productLabel}
        navigationItems={navigationItems}
        activeNavId={activeNavId}
        onNavChange={onNavChange}
        projectCount={projectItems.length}
        creditLabel={`${credits} créditos`}
        userLabel={userLabel}
        onNewProject={onNewProject}
      />

      <main className="mx-auto flex max-w-[1800px] flex-col gap-4 px-4 py-5 md:px-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_520px] xl:items-stretch">
          <BuilderProjectTabs
            items={projectItems}
            activeId={activeProjectId}
            onChange={onProjectChange}
          />

          <BuilderCreditBar
            credits={credits}
            bonus={bonus}
            usageLabel={usageLabel}
          />
        </div>

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] shadow-[0_0_70px_rgba(0,0,0,0.24)]">
          <div className="border-b border-white/[0.08] bg-black/20 px-4 py-4 md:px-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.20em] text-zinc-500">
                  {contextTitle}
                </p>
                <p className="mt-2 max-w-5xl text-sm leading-6 text-zinc-300">
                  {contextBody}
                </p>
              </div>

              <div className="shrink-0">
                <BuilderWorkspaceTabs
                  items={workspaceTabs}
                  activeId={activeWorkspaceTab}
                  onChange={onWorkspaceTabChange}
                />
              </div>
            </div>
          </div>

          <div className="min-h-[calc(100vh-295px)] bg-black/10 p-4 md:p-5">
            {children || (
              <div className="flex min-h-[520px] items-center justify-center rounded-[28px] border border-white/[0.08] bg-white/[0.02] px-6 text-center">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Área principal
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    El contenido interno del producto vive aquí.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-zinc-300">
                    Esta carcasa separa navegación, proyectos, créditos, tabs y zona principal.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}