import React from 'react';
import { motion } from 'framer-motion';
import { Sparkle } from '@phosphor-icons/react';

import {
  CURRENT_PLAN_BADGE_STYLES,
  FEATURE_LABELS,
  OPERATIONAL_NOTE
} from '../billing.constants';

import {
  buildOperationalItems,
  getOperationalAccentClasses
} from '../billing.utils';

const OperationalGrid = ({ items }) => (
  <div className="grid grid-cols-2 gap-3 auto-rows-fr">
    {items.map((item) => {
      const accent = getOperationalAccentClasses(item.label);

      return (
        <div
          key={item.label}
          className={`rounded-xl border px-3 py-3 min-h-[96px] h-full flex flex-col justify-between ${accent.wrap}`}
        >
          <p className={`text-[10px] uppercase tracking-wide min-h-[18px] ${accent.label}`}>
            {item.label}
          </p>
          <div className="flex-1 flex items-end">
            <p className={`text-xs leading-relaxed ${accent.value}`}>{item.value}</p>
          </div>
        </div>
      );
    })}
  </div>
);

const CurrentPlanCard = ({
  currentPlanDefinition,
  currentPlanIncludedCredits,
  currentPlanName,
  currentPlanFeatures
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mb-8"
      data-testid="current-plan"
    >
      <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#0F5257]/20 rounded-lg">
              <Sparkle size={24} className="text-[#0F5257]" />
            </div>
            <div>
              <p className="text-sm text-[#A3A3A3]">Plan actual</p>
              <h3 className="text-2xl text-white font-medium capitalize">
                {currentPlanName}
              </h3>
            </div>
          </div>

          {currentPlanDefinition?.headline && (
            <p className="text-[#D4D4D4] mb-4">{currentPlanDefinition.headline}</p>
          )}

          {Array.isArray(currentPlanFeatures) && currentPlanFeatures.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentPlanFeatures.map((feature) => (
                <span
                  key={feature}
                  className={`px-3 py-1 rounded-full text-sm ${
                    CURRENT_PLAN_BADGE_STYLES[feature] ||
                    'bg-[#262626] text-[#A3A3A3]'
                  }`}
                >
                  {FEATURE_LABELS[feature] || feature}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/5 bg-[#111111] px-5 py-5">
          <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-4">
            Marco operativo del plan
          </p>

          <OperationalGrid
            items={buildOperationalItems(
              currentPlanDefinition,
              currentPlanIncludedCredits
            )}
          />

          <p className="text-xs text-[#A3A3A3] mt-4 leading-relaxed">
            {OPERATIONAL_NOTE}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrentPlanCard;
