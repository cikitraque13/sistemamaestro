import React from 'react';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const DashboardWelcomePanel = ({ user, recentProjectsCount = 0 }) => {
  const firstName = user?.name?.split(' ')[0] || 'Usuario';

  return (
    <div className="rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_24%),linear-gradient(180deg,#121212_0%,#0B0B0B_100%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-amber-200">
          <Sparkle size={12} />
          Recepción premium
        </span>

        <span className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-cyan-200">
          Continuidad activa
        </span>
      </div>

      <h2 className="mt-5 max-w-[14ch] text-3xl font-semibold leading-[0.95] tracking-tight text-white md:text-[3.2rem]">
        Hola, {firstName}. Tu sistema ya está listo para seguir.
      </h2>

      <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
        Entra, revisa tu proyecto activo, abre builder, consulta oportunidades o sigue
        desde el siguiente paso recomendado sin perder continuidad.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Proyectos activos</p>
          <p className="mt-2 text-2xl font-semibold text-white">{recentProjectsCount}</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Siguiente foco</p>
          <p className="mt-2 text-base font-medium text-white">Continuar proyecto o abrir builder</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Estado</p>
          <p className="mt-2 text-base font-medium text-white">Sistema operativo y listo</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/flow"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_26px_rgba(245,158,11,0.16)] transition hover:scale-[1.01]"
        >
          Crear o abrir proyecto
          <ArrowRight size={14} />
        </Link>

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