import React from 'react';
import { Link } from 'react-router-dom';

const DashboardWelcomePanel = ({ user, recentProjectsCount = 0 }) => {
  const firstName = user?.name?.split(' ')[0] || 'Usuario';

  return (
    <div className="rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_24%),linear-gradient(180deg,#121212_0%,#0B0B0B_100%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <h2 className="max-w-[18ch] text-3xl font-semibold leading-[0.95] tracking-tight text-white md:text-[3.2rem]">
        Hola, {firstName}.
      </h2>

      <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
        El Builder está arriba. Guarda el diagnóstico, la preview y el borrador.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Proyectos activos
          </p>

          <p className="mt-2 text-2xl font-semibold text-white">
            {recentProjectsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Siguiente foco
          </p>

          <p className="mt-2 text-base font-medium text-white">
            Builder
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Estado
          </p>

          <p className="mt-2 text-base font-medium text-white">
            Cuenta abierta
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/dashboard/projects"
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          Ver todos los proyectos
        </Link>
      </div>
    </div>
  );
};

export default DashboardWelcomePanel;