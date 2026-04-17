import React from 'react';
import { motion } from 'framer-motion';
import { DiamondsFour } from '@phosphor-icons/react';

import { CREDIT_NOTE } from '../billing.constants';
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
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <DiamondsFour size={24} className="text-amber-300" weight="fill" />
          </div>
          <div>
            <p className="text-sm text-amber-200/80 mb-1">Créditos del sistema</p>
            <h3 className="text-2xl text-white font-medium mb-1">
              Capacidad operativa activa
            </h3>
            <p className="text-[#C8C8C8] max-w-2xl">
              Los créditos pasan a mostrarse como recurso operativo central del sistema,
              no como nota secundaria.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/15 bg-[#0F0D08] px-4 py-4 min-w-[240px]">
          <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
            Estado de microfase
          </p>
          <p className="text-sm text-white mb-2">Lectura visible ya integrada.</p>
          <p className="text-xs text-[#A3A3A3] leading-relaxed">{CREDIT_NOTE}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] px-5 py-5">
          <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-2">
            Saldo actual
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-white">
              {formatCredits(creditSummary.balance)}
            </span>
            <span className="text-sm text-amber-300 mb-1">créditos</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] px-5 py-5">
          <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-2">
            Incluidos por plan
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-white">
              {formatCredits(creditSummary.included_credits_for_current_plan)}
            </span>
            <span className="text-sm text-amber-300 mb-1">incluidos</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] px-5 py-5">
          <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-2">
            Históricos concedidos
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-white">
              {formatCredits(creditSummary.lifetime_granted)}
            </span>
            <span className="text-sm text-[#A3A3A3] mb-1">total</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] px-5 py-5">
          <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-2">
            Históricos consumidos
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-white">
              {formatCredits(creditSummary.lifetime_used)}
            </span>
            <span className="text-sm text-[#A3A3A3] mb-1">total</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreditSummaryCard;
