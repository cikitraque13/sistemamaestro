import React from 'react';
import { motion } from 'framer-motion';
import { DiamondsFour, Sparkle } from '@phosphor-icons/react';

import { formatCredits } from '../billing.utils';

const MetricCard = ({ label, value, suffix, featured = false }) => (
  <div
    className={`relative overflow-hidden rounded-2xl border px-5 py-5 ${
      featured
        ? 'border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_38%),linear-gradient(180deg,#081519_0%,#060707_100%)]'
        : 'border-white/6 bg-[linear-gradient(180deg,#080A0B_0%,#050505_100%)]'
    }`}
  >
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent" />

    <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-[#A3A3A3]">
      {label}
    </p>

    <div className="flex items-end gap-2">
      <span className="text-4xl font-light leading-none text-white">
        {value}
      </span>

      <span
        className={`mb-1 text-sm ${
          featured ? 'text-cyan-200' : 'text-[#A3A3A3]'
        }`}
      >
        {suffix}
      </span>
    </div>
  </div>
);

const CreditSummaryCard = ({ creditSummary }) => {
  if (!creditSummary?.enabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.02 }}
      className="relative mb-8 overflow-hidden rounded-[30px] border border-cyan-300/14 bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_88%_10%,rgba(139,92,246,0.16),transparent_26%),linear-gradient(180deg,#101517_0%,#090A0A_100%)] px-6 py-6 shadow-[0_0_60px_rgba(34,211,238,0.08)]"
      data-testid="credit-summary-card"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent" />
      <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-fuchsia-400/10 blur-3xl" />

      <div className="relative z-10 mb-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.26),transparent_18%),linear-gradient(145deg,rgba(34,211,238,0.22),rgba(139,92,246,0.16)_52%,rgba(245,158,11,0.16))] shadow-[0_0_32px_rgba(34,211,238,0.16)]">
            <DiamondsFour size={30} className="text-cyan-100" weight="fill" />
          </div>

          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-cyan-100">
              <Sparkle size={13} weight="fill" />
              Gema Maestra
            </div>

            <h3 className="mb-2 text-3xl font-medium leading-tight text-white">
              Capacidad operativa activa
            </h3>

            <p className="max-w-2xl text-base leading-7 text-[#D6E7EA]">
              Las gemas muestran el margen real disponible para construir,
              iterar y avanzar dentro de Sistema Maestro.
            </p>
          </div>
        </div>

        <div className="min-w-[280px] rounded-2xl border border-cyan-300/12 bg-black/30 px-5 py-5">
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-cyan-100/70">
            Estado operativo
          </p>

          <p className="mb-2 text-sm font-medium text-white">
            Capacidad visible e integrada.
          </p>

          <p className="text-xs leading-relaxed text-[#A3A3A3]">
            El saldo y las gemas incluidas por plan ya son visibles. Consumo,
            recargas y salida con coste quedan preparados para la siguiente microfase.
          </p>
        </div>
      </div>

      <div className="relative z-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Saldo actual"
          value={formatCredits(creditSummary.balance)}
          suffix="gemas"
          featured
        />

        <MetricCard
          label="Incluidas por plan"
          value={formatCredits(creditSummary.included_credits_for_current_plan)}
          suffix="incluidas"
          featured
        />

        <MetricCard
          label="Gemas concedidas"
          value={formatCredits(creditSummary.lifetime_granted)}
          suffix="total"
        />

        <MetricCard
          label="Gemas consumidas"
          value={formatCredits(creditSummary.lifetime_used)}
          suffix="total"
        />
      </div>
    </motion.div>
  );
};

export default CreditSummaryCard;