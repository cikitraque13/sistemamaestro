import React from 'react';
import { Coins, CreditCard } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const DashboardCreditsPanel = ({ billingSummary, loading }) => {
  const availableGems = billingSummary?.available_credits ?? '—';
  const usedGems = billingSummary?.used_credits ?? '—';
  const includedGems = billingSummary?.included_credits ?? '—';

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[22px] border border-emerald-200/10 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(253,230,138,0.04)_48%,rgba(255,255,255,0.01))] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-2.5 text-emerald-100">
              <Coins size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
                Gema Maestra
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-white">
                {loading ? '—' : availableGems} gemas
              </h3>
            </div>
          </div>

          <span className="rounded-full border border-amber-200/15 bg-amber-200/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-100">
            Capacidad operativa
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Gemas incluidas</p>
            <p className="mt-1.5 text-lg font-semibold text-white">{loading ? '—' : includedGems}</p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Gemas usadas</p>
            <p className="mt-1.5 text-lg font-semibold text-white">{loading ? '—' : usedGems}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-fuchsia-200/10 bg-[linear-gradient(180deg,rgba(244,114,182,0.11),rgba(253,230,138,0.04)_45%,rgba(255,255,255,0.01))] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/10 p-2.5 text-fuchsia-100">
            <CreditCard size={20} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">
              Continuidad del sistema
            </p>
            <h3 className="mt-1 text-xl font-semibold leading-tight text-white">
              Tu Gema Maestra mantiene la capacidad para construir y seguir.
            </h3>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          Cuando tus gemas se agotan, recargas desde facturación y mantienes continuidad sin perder el hilo del proyecto.
        </p>

        <Link
          to="/dashboard/billing"
          className="mt-4 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          Ver facturación y gemas
        </Link>
      </div>
    </div>
  );
};

export default DashboardCreditsPanel;