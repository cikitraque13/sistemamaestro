import React from 'react';
import { motion } from 'framer-motion';
import { DiamondsFour } from '@phosphor-icons/react';

import { pricingPlans } from '../../../content/pricingContent';
import { OPERATIONAL_NOTE } from '../billing.constants';
import PlanCard from './PlanCard';

const PlansGrid = ({
  userPlan,
  suggestedPlanId,
  processingKey,
  onPlanCheckout
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="mb-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-medium text-white">Planes disponibles</h3>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Compara nivel, capacidad operativa y créditos incluidos.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {pricingPlans.map((plan) => (
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

      <div className="mt-4 rounded-xl border border-amber-500/10 bg-[#12110c] px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <DiamondsFour size={18} className="text-amber-300" weight="fill" />
          </div>
          <p className="text-sm text-[#D5D5D5] leading-relaxed">
            {OPERATIONAL_NOTE}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PlansGrid;
