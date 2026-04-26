import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, X } from '@phosphor-icons/react';

const STORAGE_KEY = 'sm_dashboard_open_tabs_v1';
const MAX_TABS = 6;

const TAB_META = [
  { match: (p) => p === '/dashboard', key: 'overview', label: 'Resumen', to: '/dashboard' },
  { match: (p) => p === '/dashboard/projects', key: 'projects', label: 'Proyectos', to: '/dashboard/projects' },
  { match: (p) => p === '/dashboard/opportunities', key: 'opportunities', label: 'Oportunidades', to: '/dashboard/opportunities' },
  { match: (p) => p === '/dashboard/billing', key: 'billing', label: 'Facturación', to: '/dashboard/billing' },
  { match: (p) => p.startsWith('/dashboard/project/') && p.includes('/report-preview'), key: 'report-preview', label: 'Informe', to: null },
  { match: (p) => p.startsWith('/dashboard/project/') && p.includes('/report-print'), key: 'report-print', label: 'Impresión', to: null },
  { match: (p) => p.startsWith('/dashboard/project/'), key: 'project', label: 'Proyecto activo', to: null },
  { match: (p) => p.startsWith('/flow'), key: 'flow', label: 'Nuevo proyecto', to: '/flow' }
];

const getTabForPath = (pathname) => {
  const match = TAB_META.find((item) => item.match(pathname));

  if (!match) {
    return {
      key: pathname,
      label: 'Workspace',
      to: pathname
    };
  }

  return {
    key: `${match.key}:${pathname}`,
    label: match.label,
    to: match.to || pathname
  };
};

const readTabs = () => {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeTabs = (tabs) => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  } catch {
    // no-op
  }
};

const DashboardProjectTabs = () => {
  const location = useLocation();
  const [tabs, setTabs] = useState([]);

  useEffect(() => {
    const currentTab = getTabForPath(location.pathname);
    const existing = readTabs();

    const next = [
      currentTab,
      ...existing.filter((item) => item.to !== currentTab.to)
    ].slice(0, MAX_TABS);

    setTabs(next);
    writeTabs(next);
  }, [location.pathname]);

  const activeTo = useMemo(() => getTabForPath(location.pathname).to, [location.pathname]);

  const handleClose = (to) => {
    const next = tabs.filter((item) => item.to !== to);
    setTabs(next);
    writeTabs(next);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
      {tabs.map((tab) => {
        const isActive = tab.to === activeTo;

        return (
          <div
            key={`${tab.key}-${tab.to}`}
            className={`group inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm whitespace-nowrap transition-all ${
              isActive
                ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100 shadow-[0_8px_20px_rgba(6,182,212,0.10)]'
                : 'border-white/8 bg-white/[0.02] text-zinc-300 hover:border-white/15 hover:bg-white/[0.04]'
            }`}
          >
            <Link to={tab.to} className="font-medium">
              {tab.label}
            </Link>

            {tabs.length > 1 && (
              <button
                type="button"
                onClick={() => handleClose(tab.to)}
                className="opacity-60 transition-opacity hover:opacity-100"
                aria-label={`Cerrar ${tab.label}`}
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}

      <Link
        to="/flow"
        className="inline-flex items-center gap-2 rounded-2xl border border-amber-200/20 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] px-4 py-2 text-sm font-semibold text-black shadow-[0_10px_24px_rgba(245,158,11,0.14)] transition hover:scale-[1.01]"
      >
        <Plus size={14} />
        Nuevo proyecto
      </Link>
    </div>
  );
};

export default DashboardProjectTabs;