import React from 'react';
import { Coins, CreditCard } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const DashboardCreditsPanel = ({ billingSummary, loading }) => {
  const availableCredits = billingSummary?.available_credits ?? '—';
  const usedCredits = billingSummary?.used_credits ?? '—';
  const includedCredits = billingSummary?.included_credits ?? '—';

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,185,129,0.10),rgba(255,255,255,0.01))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="inline-flex rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-3 text-emerald-200">
          <Coins size={20} />
        </div>

        <p className="mt-4 text-sm text-zinc-400">Capacidad operativa</p>
        <h3 className="mt-2 text-3xl font-semibold text-white">
          {loading ? '—' : availableCredits} créditos
        </h3>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Incluidos</p>
            <p className="mt-2 text-xl font-semibold text-white">{loading ? '—' : includedCredits}</p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Usados</p>
            <p className="mt-2 text-xl font-semibold text-white">{loading ? '—' : usedCredits}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(244,114,182,0.10),rgba(255,255,255,0.01))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="inline-flex rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/10 p-3 text-fuchsia-200">
          <CreditCard size={20} />
        </div>

        <p className="mt-4 text-sm text-zinc-400">Continuidad del sistema</p>
        <h3 className="mt-2 text-2xl font-semibold leading-tight text-white">
          Tu plan te abre el sistema. Tus créditos te dan capacidad para construir y seguir.
        </h3>

        <p className="mt-3 text-sm leading-7 text-zinc-300">
          Cuando los créditos se acaban, recargas y mantienes continuidad sin perder el hilo del proyecto.
        </p>

        <Link
          to="/dashboard/billing"
          className="mt-5 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          Ver billing y créditos
        </Link>
      </div>
    </div>
  );
};

export default DashboardCreditsPanel;