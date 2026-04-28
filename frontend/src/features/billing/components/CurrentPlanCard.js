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

const PLAN_TONE_META = {
  blueprint: {
    shell:
      'border-[#8DE1D0]/18 bg-[radial-gradient(circle_at_14%_0%,rgba(141,225,208,0.13),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.10),transparent_28%),linear-gradient(180deg,#151716_0%,#0A0D0D_100%)]',
    leftPanel:
      'border-[#8DE1D0]/12 bg-[linear-gradient(180deg,rgba(15,82,87,0.16)_0%,rgba(0,0,0,0.16)_100%)]',
    rightPanel:
      'border-[#8DE1D0]/14 bg-[radial-gradient(circle_at_top_right,rgba(141,225,208,0.10),transparent_30%),linear-gradient(180deg,#071314_0%,#070909_100%)]',
    iconBox:
      'border-[#8DE1D0]/20 bg-[#0F5257]/18 shadow-[0_0_34px_rgba(141,225,208,0.10)]',
    icon: 'text-[#8DE1D0]',
    kicker: 'text-[#8DE1D0]',
    gemSlot:
      'border-[#8DE1D0]/24 bg-[linear-gradient(180deg,rgba(15,82,87,0.18),rgba(7,12,12,0.88))]'
  },
  sistema: {
    shell:
      'border-sky-200/18 bg-[radial-gradient(circle_at_14%_0%,rgba(56,189,248,0.13),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.10),transparent_28%),linear-gradient(180deg,#14181B_0%,#090B0D_100%)]',
    leftPanel:
      'border-sky-200/12 bg-[linear-gradient(180deg,rgba(14,49,76,0.22)_0%,rgba(0,0,0,0.16)_100%)]',
    rightPanel:
      'border-sky-200/14 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_30%),linear-gradient(180deg,#071520_0%,#070909_100%)]',
    iconBox:
      'border-sky-200/20 bg-sky-400/12 shadow-[0_0_34px_rgba(56,189,248,0.10)]',
    icon: 'text-sky-200',
    kicker: 'text-sky-200',
    gemSlot:
      'border-cyan-200/24 bg-[linear-gradient(180deg,rgba(34,211,238,0.13),rgba(7,12,12,0.88))]'
  },
  premium: {
    shell:
      'border-fuchsia-200/18 bg-[radial-gradient(circle_at_12%_0%,rgba(217,70,239,0.16),transparent_30%),radial-gradient(circle_at_78%_0%,rgba(34,211,238,0.12),transparent_28%),linear-gradient(180deg,#1A141B_0%,#0A080C_100%)]',
    leftPanel:
      'border-fuchsia-200/12 bg-[linear-gradient(180deg,rgba(58,15,58,0.26)_0%,rgba(0,0,0,0.16)_100%)]',
    rightPanel:
      'border-fuchsia-200/16 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.13),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_34%),linear-gradient(180deg,#120814_0%,#070707_100%)]',
    iconBox:
      'border-fuchsia-200/22 bg-fuchsia-400/12 shadow-[0_0_38px_rgba(217,70,239,0.13)]',
    icon: 'text-fuchsia-100',
    kicker: 'text-fuchsia-100',
    gemSlot:
      'border-cyan-200/24 bg-[linear-gradient(180deg,rgba(34,211,238,0.14),rgba(19,8,20,0.88))]'
  }
};

const normalizeToken = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const getPlanTone = (planId) =>
  PLAN_TONE_META[planId] || PLAN_TONE_META.premium;

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

const OperationalGrid = ({ items, tone }) => (
  <div className="grid grid-cols-2 gap-3">
    {items.map((item) => {
      const accent = getOperationalAccentClasses(item.label);
      const visibleLabel = getVisibleOperationalLabel(item.label);
      const visibleValue = getVisibleOperationalValue(item);
      const isGems = visibleLabel === 'GEMAS';

      return (
        <div
          key={item.label}
          className={`relative flex min-h-[98px] flex-col justify-between overflow-hidden rounded-2xl border px-4 py-3 ${
            isGems ? tone.gemSlot : accent.wrap
          }`}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

          <p className={`text-[10px] uppercase tracking-[0.16em] ${isGems ? 'text-cyan-100' : accent.label}`}>
            {visibleLabel}
          </p>

          <div className="flex flex-1 items-end">
            <p className={`text-sm font-medium leading-snug ${isGems ? 'text-cyan-100' : accent.value}`}>
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
  const tone = getPlanTone(currentPlanDefinition?.id);
  const operationalItems = buildOperationalItems(
    currentPlanDefinition,
    currentPlanIncludedCredits
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card relative mb-8 overflow-hidden border ${tone.shell} shadow-[0_28px_90px_rgba(0,0,0,0.32)]`}
      data-testid="current-plan"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className={`rounded-3xl border p-6 ${tone.leftPanel}`}>
          <div className="mb-6 flex items-start gap-4">
            <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl ${tone.iconBox}`}>
              <Sparkle size={28} className={tone.icon} weight="fill" />
            </div>

            <div>
              <p className={`mb-1 text-xs font-medium uppercase tracking-[0.16em] ${tone.kicker}`}>
                Plan actual
              </p>

              <h3 className="text-3xl font-medium leading-tight text-white">
                {currentPlanName}
              </h3>
            </div>
          </div>

          {currentPlanDefinition?.headline && (
            <p className="mb-5 max-w-2xl text-lg leading-7 text-white">
              {currentPlanDefinition.headline}
            </p>
          )}

          {Array.isArray(currentPlanFeatures) && currentPlanFeatures.length > 0 && (
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Capacidades activas
              </p>

              <div className="flex flex-wrap gap-2">
                {currentPlanFeatures.map((feature) => (
                  <span
                    key={feature}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      CURRENT_PLAN_BADGE_STYLES[feature] ||
                      'border border-white/10 bg-white/5 text-[#D4D4D4]'
                    }`}
                  >
                    {FEATURE_LABELS[feature] || feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`rounded-3xl border px-5 py-5 ${tone.rightPanel}`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                Marco operativo del plan
              </p>

              <p className="mt-2 text-sm leading-6 text-white/70">
                Acceso, Builder, salida y Gemas consolidadas para este nivel.
              </p>
            </div>

            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${tone.icon}`}>
              <DiamondsFour size={20} weight="fill" />
            </div>
          </div>

          <OperationalGrid items={operationalItems} tone={tone} />

          <div className="mt-5 rounded-2xl border border-white/8 bg-black/24 px-4 py-3">
            <p className="text-xs leading-6 text-[#BFCFD2]">
              <span className="font-medium text-white">Gema Maestra</span> =
              capacidad operativa disponible dentro del sistema. Consumo,
              recargas y salida con coste se activarán en la siguiente microfase.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrentPlanCard;