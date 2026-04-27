import React from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  FolderOpen,
  Lightning,
  Plus
} from '@phosphor-icons/react';

const BUILDER_LAUNCHER_STATE = {
  focus: 'builder-launcher',
  source: 'dashboard-quick-actions'
};

const actions = [
  {
    to: '/dashboard',
    state: BUILDER_LAUNCHER_STATE,
    label: 'Nuevo proyecto',
    helper: 'Crear o inspirar desde el launcher',
    icon: Plus,
    tone: 'amber'
  },
  {
    to: '/dashboard/projects',
    label: 'Ver proyectos',
    helper: 'Continuar construcciones activas',
    icon: FolderOpen,
    tone: 'cyan'
  },
  {
    to: '/dashboard/opportunities',
    label: 'Oportunidades',
    helper: 'Plantillas y rutas desbloqueables',
    icon: Lightning,
    tone: 'emerald'
  },
  {
    to: '/dashboard/billing',
    label: 'Facturación y créditos',
    helper: 'Pagos, planes y capacidad operativa',
    icon: CreditCard,
    tone: 'fuchsia'
  }
];

const toneClasses = {
  amber: 'border-amber-500/15 bg-amber-500/10 text-amber-200',
  cyan: 'border-cyan-500/15 bg-cyan-500/10 text-cyan-200',
  emerald: 'border-emerald-500/15 bg-emerald-500/10 text-emerald-200',
  fuchsia: 'border-fuchsia-500/15 bg-fuchsia-500/10 text-fuchsia-200'
};

export default function DashboardQuickActions() {
  return (
    <div>
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Accesos rápidos
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={`${action.to}-${action.label}`}
              to={action.to}
              state={action.state}
              className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-white/15 hover:bg-white/[0.03]"
            >
              <div className={`inline-flex rounded-2xl border p-3 ${toneClasses[action.tone]}`}>
                <Icon size={20} />
              </div>

              <p className="mt-4 text-base font-semibold text-white">
                {action.label}
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {action.helper}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}