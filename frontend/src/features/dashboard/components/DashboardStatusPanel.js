import React from 'react';
import {
  FolderOpen,
  Lightning,
  TrendUp,
  ArrowSquareOut
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const DashboardStatusPanel = ({ loading, stats, user }) => {
  const cards = [
    {
      label: 'Proyectos',
      value: loading ? '-' : stats?.total_projects || 0,
      icon: FolderOpen,
      tone: 'amber'
    },
    {
      label: 'Blueprints',
      value: loading ? '-' : stats?.blueprints_generated || 0,
      icon: Lightning,
      tone: 'cyan'
    },
    {
      label: 'Plan actual',
      value: user?.plan ? String(user.plan).charAt(0).toUpperCase() + String(user.plan).slice(1) : 'Gratis',
      icon: TrendUp,
      tone: 'fuchsia'
    }
  ];

  const toneClasses = {
    amber: 'border-amber-500/15 bg-amber-500/10 text-amber-200',
    cyan: 'border-cyan-500/15 bg-cyan-500/10 text-cyan-200',
    fuchsia: 'border-fuchsia-500/15 bg-fuchsia-500/10 text-fuchsia-200'
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
            >
              <div className={`inline-flex rounded-2xl border p-3 ${toneClasses[card.tone]}`}>
                <Icon size={20} />
              </div>

              <p className="mt-4 text-sm text-zinc-400">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(6,182,212,0.10),rgba(255,255,255,0.01))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Siguiente paso recomendado</p>
        <h3 className="mt-3 text-2xl font-semibold leading-tight text-white">
          Abre un proyecto o continúa el builder con una sola acción clara.
        </h3>
        <p className="mt-3 text-sm leading-7 text-zinc-300">
          No abras diez frentes. Entra en el proyecto activo, revisa la lectura y continúa
          desde una ruta más clara.
        </p>

        <Link
          to="/dashboard/projects"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          Ir a proyectos
          <ArrowSquareOut size={14} />
        </Link>
      </div>
    </div>
  );
};

export default DashboardStatusPanel;