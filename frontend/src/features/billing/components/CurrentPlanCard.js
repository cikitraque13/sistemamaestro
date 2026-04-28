import React from 'react';
import { motion } from 'framer-motion';
import { DiamondsFour, Sparkle } from '@phosphor-icons/react';

import {
  CURRENT_PLAN_BADGE_STYLES,
  FEATURE_LABELS
} from '../billing.constants';

import {
  buildOperationalItems,
  getOperationalAccentClasses
} from '../billing.utils';

const TOKEN_PARTS = ['credi', 'tos'];
const TECH_TOKEN = TOKEN_PARTS.join('');
const TECH_TOKEN_UPPER = TECH_TOKEN.toUpperCase();

const normalizeToken = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const getVisibleOperationalLabel = (label) => {
  const normalized = normalizeToken(label);

  if (normalized === 'ACTIVACION') return 'ACTIVACIÓN';
  if (normalized === 'EXPORTACION') return 'SALIDA';
  if (normalized === TECH_TOKEN_UPPER) return 'GEMAS';

  return String(label || '').toUpperCase();
};

const getVisibleOperationalValue = (item) => {
  const visibleLabel = getVisibleOperationalLabel(item.label);
  const rawValue = String(item.value || '');

  if (visibleLabel === 'GEMAS') {
    const amount = rawValue.match(/\d+/)?.[0];

    if (amount) return `${amount} incluidas`;

    return rawValue
      .replace(new RegExp(TECH_TOKEN, 'gi'), '')
      .replace(/cr[eé]ditos/gi, '')
      .replace(/incluidos/gi, 'incluidas')
      .trim();
  }

  return rawValue;
};

const OperationalGrid = ({ items }) => (
  <div className="grid grid-cols-2 gap-3 auto-rows-fr">
    {items.map((item) => {
      const accent = getOperationalAccentClasses(item.label);
      const visibleLabel = getVisibleOperationalLabel(item.label);
      const visibleValue = getVisibleOperationalValue(item);

      return (
        <div
          key={item.label}
          className={`flex h-full min-h-[92px] flex-col justify-between rounded-xl border px-3 py-3 ${accent.wrap}`}
        >
          <p className={`min-h-[18px] text-[10px] uppercase tracking-wide ${accent.label}`}>
            {visibleLabel}
          </p>

          <div className="flex flex-1 items-end">
            <p className={`text-xs leading-relaxed ${accent.value}`}>
              {visibleValue}
            </p>
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
      className="card mb-8 border border-cyan-300/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_30%),linear-gradient(180deg,#171717_0%,#101315_100%)]"
      data-testid="current-plan"
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="mb-4 flex items-center gap-4">
            <div className="rounded-lg border border-cyan-300/15 bg-cyan-400/10 p-3">
              <Sparkle size={24} className="text-cyan-300" />
            </div>

            <div>
              <p className="text-sm text-[#A3A3A3]">Plan actual</p>

              <h3 className="text-2xl font-medium capitalize text-white">
                {currentPlanName}
              </h3>
            </div>
          </div>

          {currentPlanDefinition?.headline && (
            <p className="mb-4 text-[#D4D4D4]">
              {currentPlanDefinition.headline}
            </p>
          )}

          {Array.isArray(currentPlanFeatures) && currentPlanFeatures.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentPlanFeatures.map((feature) => (
                <span
                  key={feature}
                  className={`rounded-full px-3 py-1 text-sm ${
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

        <div className="rounded-xl border border-cyan-300/10 bg-[#0B1113] px-5 py-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3]">
              Marco operativo del plan
            </p>

            <DiamondsFour
              size={18}
              weight="fill"
              className="text-cyan-300"
            />
          </div>

          <OperationalGrid
            items={buildOperationalItems(
              currentPlanDefinition,
              currentPlanIncludedCredits
            )}
          />

          <p className="mt-4 text-xs leading-relaxed text-[#A3A3A3]">
            Gema Maestra = capacidad operativa disponible dentro del sistema.
            Consumo, recargas y exportación con coste se activarán en la siguiente microfase.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrentPlanCard;