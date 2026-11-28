import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChatCircle,
  CreditCard,
  FolderOpen,
  List,
  Microphone,
  SignOut,
  Star,
  X
} from '@phosphor-icons/react';

import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import DashboardProjectTabs from '../features/dashboard/components/DashboardProjectTabs';
import DashboardSidebarProjects from '../features/dashboard/components/DashboardSidebarProjects';
import {
  DASHBOARD_BILLING_NAV,
  DASHBOARD_SIDEBAR_LINKS
} from '../features/dashboard/dashboardNav';

const NAV_ICONS = {
  agencia: Star,
  'agente-voz': Microphone,
  'agente-chat': ChatCircle,
  facturacion: CreditCard
};

const getPlanBadge = (plan) => {
  const badges = {
    free: { label: 'Gratis', color: 'bg-[#262626] text-[#A3A3A3]' },
    blueprint: { label: 'Pro', color: 'bg-blue-500/20 text-blue-400' },
    sistema: { label: 'Sistema', color: 'bg-[#0F5257]/30 text-[#6ee7d8]' },
    premium: { label: 'Premium', color: 'bg-yellow-500/20 text-yellow-300' }
  };

  return badges[plan] || badges.free;
};

const navIsActive = (item, pathname) => {
  if (typeof item.isActive === 'function') return item.isActive(pathname);
  return pathname === item.path;
};

const NavLinks = ({ items, pathname, onNavigate, linkTestId = true }) => (
  <>
    {items.map((link) => {
      const active = link.path ? navIsActive(link, pathname) : false;
      const Icon = NAV_ICONS[link.id] || FolderOpen;
      const className = `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
        active
          ? 'bg-white/[0.06] text-white'
          : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
      }`;
      const body = (
        <>
          <Icon size={18} weight={active ? 'fill' : 'regular'} />
          <span className="truncate">{link.label}</span>
        </>
      );

      if (link.href) {
        return (
          <a
            key={link.href}
            href={link.href}
            data-testid={linkTestId ? `dashboard-nav-${link.id}` : undefined}
            onClick={onNavigate}
            className={className}
          >
            {body}
          </a>
        );
      }

      return (
        <Link
          key={link.path}
          to={link.path}
          data-testid={linkTestId ? `dashboard-nav-${link.id}` : undefined}
          onClick={onNavigate}
          className={className}
        >
          {body}
        </Link>
      );
    })}
  </>
);

const PrimaryNav = ({ pathname, onNavigate, linkTestId = true }) => (
  <nav className="flex flex-col gap-0.5" data-testid={linkTestId ? 'dashboard-primary-nav' : undefined}>
    <DashboardSidebarProjects onNavigate={onNavigate} testId={linkTestId} />
    <p className="px-3 pb-1 pt-4 text-[10px] font-semibold tracking-[0.16em] text-zinc-500">
      PRODUCTOS
    </p>
    <NavLinks
      items={DASHBOARD_SIDEBAR_LINKS}
      pathname={pathname}
      onNavigate={onNavigate}
      linkTestId={linkTestId}
    />
  </nav>
);

const AccountCard = ({ user, planBadge }) => (
  <div className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.02] p-2.5" data-testid="dashboard-account-card">
    <div
      data-testid="dashboard-account-avatar"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F5257]/25 text-sm font-semibold text-[#86efe2]"
    >
      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
    </div>
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-white">
        {user?.name || 'Usuario'}
      </p>
      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] ${planBadge.color}`}>
        {planBadge.label}
      </span>
    </div>
  </div>
);

const LogoutButton = ({ onLogout }) => (
  <button
    type="button"
    onClick={onLogout}
    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
  >
    <SignOut size={16} />
    Cerrar sesión
  </button>
);

const DashboardLayout = ({ children, title = 'Workspace', headerExtra = null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const isResumen = location.pathname === '/dashboard';

  const planBadge = getPlanBadge(user?.plan);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={`${isResumen ? 'h-screen overflow-hidden' : 'min-h-screen'} flex bg-[#050505] text-white`}>
      <aside
        data-testid="dashboard-sidebar"
        className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col overflow-hidden border-r border-white/6 bg-[#0A0A0A] lg:flex"
      >
        <div className="px-5 pb-2 pt-4">
          <Logo size="small" />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-2">
          <PrimaryNav pathname={location.pathname} />
        </div>

        <div className="px-2 pb-3">
          <nav data-testid="dashboard-footer-nav">
            <NavLinks
              items={[DASHBOARD_BILLING_NAV]}
              pathname={location.pathname}
            />
          </nav>
          <div className="mt-2">
            <AccountCard user={user} planBadge={planBadge} />
            <LogoutButton onLogout={handleLogout} />
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col overflow-hidden border-r border-white/6 bg-[#0A0A0A] transition-transform lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Logo size="small" />
          <button
            type="button"
            onClick={closeSidebar}
            className="text-zinc-400 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-2">
          <PrimaryNav pathname={location.pathname} onNavigate={closeSidebar} linkTestId={false} />
        </div>

        <div className="px-2 pb-3">
          <NavLinks
            items={[DASHBOARD_BILLING_NAV]}
            pathname={location.pathname}
            onNavigate={closeSidebar}
            linkTestId={false}
          />
          <div className="mt-2">
            <AccountCard user={user} planBadge={planBadge} />
            <LogoutButton onLogout={handleLogout} />
          </div>
        </div>
      </aside>

      <main className={`flex min-w-0 flex-1 flex-col ${isResumen ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        <header className="sticky top-0 z-30 shrink-0 border-b border-white/6 bg-[#050505]">
          <div className={`flex items-center justify-between gap-4 px-5 md:px-6 ${isResumen ? 'py-2.5' : 'py-4'}`}>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="text-zinc-400 transition hover:text-white lg:hidden"
                aria-label="Abrir menú"
              >
                <List size={24} />
              </button>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Workspace
                </p>

                <h1 className="text-lg font-semibold leading-tight text-white">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {headerExtra}
            </div>
          </div>

          {!isResumen && (
            <div className="border-t border-white/6 px-5 py-3 md:px-6">
              <DashboardProjectTabs />
            </div>
          )}
        </header>

        <div className={isResumen ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3 md:px-6' : 'flex-1 px-5 py-6 md:px-6'}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
