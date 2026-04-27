import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  House,
  FolderOpen,
  Lightbulb,
  CreditCard,
  SignOut,
  Plus,
  List,
  X
} from '@phosphor-icons/react';

import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import DashboardProjectTabs from '../features/dashboard/components/DashboardProjectTabs';

const SIDEBAR_LINKS = [
  { path: '/dashboard', icon: House, label: 'Resumen' },
  { path: '/dashboard/projects', icon: FolderOpen, label: 'Proyectos' },
  { path: '/dashboard/opportunities', icon: Lightbulb, label: 'Oportunidades' },
  { path: '/dashboard/billing', icon: CreditCard, label: 'Facturación' }
];

const BUILDER_LAUNCHER_STATE = {
  focus: 'builder-launcher',
  source: 'dashboard-layout-new-project'
};

const getPlanBadge = (plan) => {
  const badges = {
    free: { label: 'Gratis', color: 'bg-[#262626] text-[#A3A3A3]' },
    blueprint: { label: 'Blueprint', color: 'bg-blue-500/20 text-blue-400' },
    sistema: { label: 'Sistema', color: 'bg-[#0F5257]/30 text-[#6ee7d8]' },
    premium: { label: 'Premium', color: 'bg-yellow-500/20 text-yellow-300' }
  };

  return badges[plan] || badges.free;
};

const DashboardLayout = ({ children, title = 'Workspace' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const planBadge = getPlanBadge(user?.plan);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleNewProject = () => {
    setSidebarOpen(false);

    navigate('/dashboard', {
      state: BUILDER_LAUNCHER_STATE
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-r border-white/6 bg-[linear-gradient(180deg,#121212_0%,#0A0A0A_100%)]">
        <div className="border-b border-white/6 px-6 py-6">
          <Logo size="large" />
        </div>

        <div className="px-4 py-4">
          <button
            type="button"
            onClick={handleNewProject}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_10px_24px_rgba(245,158,11,0.14)] transition hover:scale-[1.01]"
          >
            <Plus size={16} weight="bold" />
            Nuevo proyecto
          </button>
        </div>

        <nav className="flex-1 px-3 py-2">
          {SIDEBAR_LINKS.map((link) => {
            const active = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <link.icon size={20} weight={active ? 'fill' : 'regular'} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/6 p-4">
          <div className="mb-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F5257]/25 text-[#86efe2] font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {user?.name || 'Usuario'}
                </p>

                <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs ${planBadge.color}`}>
                  {planBadge.label}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.04] hover:text-white"
          >
            <SignOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform border-r border-white/6 bg-[linear-gradient(180deg,#121212_0%,#0A0A0A_100%)] transition-transform lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/6 px-6 py-6">
          <Logo size="small" />

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-4">
          <button
            type="button"
            onClick={handleNewProject}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_10px_24px_rgba(245,158,11,0.14)]"
          >
            <Plus size={16} weight="bold" />
            Nuevo proyecto
          </button>
        </div>

        <nav className="px-3 py-2">
          {SIDEBAR_LINKS.map((link) => {
            const active = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <link.icon size={20} weight={active ? 'fill' : 'regular'} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/6 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.04] hover:text-white"
          >
            <SignOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/6 bg-[#050505]/88 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="text-zinc-400 transition hover:text-white lg:hidden"
              >
                <List size={24} />
              </button>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Workspace
                </p>

                <h1 className="text-lg font-semibold text-white">
                  {title}
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${planBadge.color}`}>
                {planBadge.label}
              </span>
            </div>
          </div>

          <div className="border-t border-white/6 px-5 py-3 md:px-6">
            <DashboardProjectTabs />
          </div>
        </header>

        <div className="flex-1 px-5 py-6 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;