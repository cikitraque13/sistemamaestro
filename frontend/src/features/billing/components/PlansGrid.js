import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DiamondsFour, Sparkle } from '@phosphor-icons/react';

import { pricingPlans } from '../../../content/pricingContent';
import { OPERATIONAL_NOTE } from '../billing.constants';
import PlanCard from './PlanCard';

const PlansGrid = ({
  userPlan,
  suggestedPlanId,
  processingKey,
  onPlanCheckout
}) => {
  const paidPlans = useMemo(
    () => pricingPlans.filter((plan) => plan.id !== 'free'),
    []
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="mb-8"
    >
      <div className="mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(15,82,87,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.08),transparent_34%),linear-gradient(180deg,#121212_0%,#080808_100%)] p-6 sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0F5257]/25 bg-[#0F5257]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[#8DE1D0]">
              <Sparkle size={14} weight="fill" />
              Sistema Maestro Gold
            </div>

            <h3 className="text-2xl font-light leading-tight text-white sm:text-3xl">
              Niveles de continuidad operativa
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#A3A3A3]">
              Gratis ya es tu estado base dentro del sistema. Aquí eliges la capacidad
              de continuidad que necesita tu proyecto: activar, crecer o trabajar con
              criterio maestro.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200/15 bg-amber-500/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-amber-100">
              Progresión interna
            </p>
            <p className="mt-1 text-sm text-[#F2E7D1]">
              10 créditos iniciales → Pro → Growth → AI Master
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {paidPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            userPlan={userPlan}
            suggestedPlanId={suggestedPlanId}
            processingKey={processingKey}
            onPlanCheckout={onPlanCheckout}
          />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-amber-500/10 bg-[linear-gradient(180deg,#14110A_0%,#0A0A0A_100%)] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-amber-200/15 bg-amber-500/10">
            <DiamondsFour size={17} className="text-amber-300" weight="fill" />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-white">
              Gratis queda como capacidad inicial
            </p>
            <p className="text-sm leading-6 text-[#D5D5D5]">
              El usuario registrado parte con créditos iniciales para probar valor real.
              Los planes amplían recorrido, Builder, continuidad y capacidad operativa.
              {` ${OPERATIONAL_NOTE}`}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default PlansGrid;