import React from 'react';
import { motion } from 'framer-motion';
import { DiamondsFour } from '@phosphor-icons/react';

import { formatCredits } from '../billing.utils';

const CreditSummaryCard = ({ creditSummary }) => {
  if (!creditSummary?.enabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.02 }}
      className="mb-8 rounded-2xl border border-amber-500/20 bg-[linear-gradient(180deg,#171717_0%,#14110a_100%)] px-6 py-6"
      data-testid="credit-summary-card"
    >
      <div className="mb-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
            <DiamondsFour size={24} className="text-amber-300" weight="fill" />
          </div>

          <div>
            <p className="mb-1 text-sm text-amber-200/80">
              Gema Maestra
            </p>

            <h3 className="mb-1 text-2xl font-medium text-white">
              Capacidad operativa activa
            </h3>

            <p className="max-w-2xl text-[#C8C8C8]">
              Las gemas representan el margen operativo disponible para construir,
              iterar y avanzar dentro del sistema.
            </p>
          </div>
        </div>

        <div className="min-w-[240px] rounded-xl border border-amber-500/15 bg-[#0F0D08] px-4 py-4">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
            Estado de microfase
          </p>

          <p className="mb-2 text-sm text-white">
            Lectura visible ya integrada.
          </p>

          <p className="text-xs leading-relaxed text-[#A3A3A3]">
            Saldo e incluidas por plan ya son visibles. La capa de consumo,
            recargas y coste por acción queda preparada para la siguiente microfase.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] px-5 py-5">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
            Saldo actual
          </p>

          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-white">
              {formatCredits(creditSummary.balance)}
            </span>

            <span className="mb-1 text-sm text-amber-300">
              gemas
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] px-5 py-5">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
            Incluidas por plan
          </p>

          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-white">
              {formatCredits(creditSummary.included_credits_for_current_plan)}
            </span>

            <span className="mb-1 text-sm text-amber-300">
              incluidas
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] px-5 py-5">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
            Gemas concedidas
          </p>

          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-white">
              {formatCredits(creditSummary.lifetime_granted)}
            </span>

            <span className="mb-1 text-sm text-[#A3A3A3]">
              total
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] px-5 py-5">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
            Gemas consumidas
          </p>

          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-white">
              {formatCredits(creditSummary.lifetime_used)}
            </span>

            <span className="mb-1 text-sm text-[#A3A3A3]">
              total
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreditSummaryCard;