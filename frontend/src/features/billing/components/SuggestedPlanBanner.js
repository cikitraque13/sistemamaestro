import React from 'react';
import { Link } from 'react-router-dom';
import { Lightning, ArrowRight } from '@phosphor-icons/react';

import {
  getGemsLabel,
  getOperationalAccentClasses,
  buildOperationalItems
} from '../billing.utils';

const PLAN_TONE_META = {
  blueprint: {
    shell:
      'border-[#8DE1D0]/24 bg-[radial-gradient(circle_at_10%_0%,rgba(141,225,208,0.15),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(34,211,238,0.10),transparent_30%),linear-gradient(180deg,#121817_0%,#080A0A_100%)]',
    chip: 'border-[#8DE1D0]/18 bg-[#0F5257]/18 text-[#8DE1D0]',
    side:
      'border-[#8DE1D0]/20 bg-[radial-gradient(circle_at_top_right,rgba(141,225,208,0.12),transparent_32%),linear-gradient(180deg,#071314_0%,#070909_100%)]',
    gemBox:
      'border-[#8DE1D0]/20 bg-[#0F5257]/16 text-[#8DE1D0]',
    cta:
      'bg-[#0F5257] text-white hover:bg-[#14686F] shadow-[0_16px_42px_rgba(15,82,87,0.24)]'
  },
  sistema: {
    shell:
      'border-sky-200/24 bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(34,211,238,0.10),transparent_30%),linear-gradient(180deg,#12181C_0%,#080A0C_100%)]',
    chip: 'border-sky-200/18 bg-sky-400/12 text-sky-100',
    side:
      'border-sky-200/20 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.13),transparent_32%),linear-gradient(180deg,#071520_0%,#070909_100%)]',
    gemBox:
      'border-sky-200/20 bg-sky-400/12 text-sky-100',
    cta:
      'bg-sky-400/18 text-sky-50 hover:bg-sky-400/24 shadow-[0_16px_42px_rgba(56,189,248,0.16)]'
  },
  premium: {
    shell:
      'border-fuchsia-200/24 bg-[radial-gradient(circle_at_10%_0%,rgba(217,70,239,0.17),transparent_30%),radial-gradient(circle_at_88%_0%,rgba(34,211,238,0.13),transparent_30%),linear-gradient(180deg,#1A121C_0%,#09070B_100%)]',
    chip: 'border-fuchsia-200/18 bg-fuchsia-400/12 text-fuchsia-100',
    side:
      'border-fuchsia-200/22 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.15),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.09),transparent_34%),linear-gradient(180deg,#120814_0%,#070707_100%)]',
    gemBox:
      'border-cyan-200/20 bg-cyan-400/12 text-cyan-100',
    cta:
      'bg-[linear-gradient(135deg,#8DE1D0_0%,#A78BFA_48%,#F0ABFC_100%)] text-black hover:scale-[1.01] shadow-[0_18px_52px_rgba(217,70,239,0.18)]'
  }
};

const normalizePlanId = (planId) => {
  const value = String(planId || '').toLowerCase();

  if (['pro', 'blueprint'].includes(value)) return 'blueprint';
  if (['growth', 'sistema'].includes(value)) return 'sistema';
  if (['premium', 'ai_master', 'ai-master', 'ai_master_199'].includes(value)) {
    return 'premium';
  }

  return 'premium';
};

const getPlanTone = (planId) => PLAN_TONE_META[normalizePlanId(planId)];

const SuggestedPlanBanner = ({
  suggestedPlan,
  fromProjectId,
  userPlan,
  processingKey,
  onPlanCheckout
}) => {
  if (!suggestedPlan) return null;

  const tone = getPlanTone(suggestedPlan.id);
  const isCurrentPlan = userPlan === suggestedPlan.id;
  const isProcessing = processingKey === `plan:${suggestedPlan.id}`;

  return (
    <div
      className={`card mb-8 overflow-hidden border ${tone.shell}`}
      data-testid="suggested-plan-banner"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${tone.chip}`}>
            <Lightning weight="fill" />
            Recomendación contextual
          </div>

          <h3 className="mb-2 text-xl font-medium text-white">
            Plan sugerido: {suggestedPlan.visibleName}
          </h3>

          <p className="mb-4 max-w-2xl text-[#D4D4D4]">
            {suggestedPlan.valuePromise}
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {buildOperationalItems(suggestedPlan)
              .slice(0, 3)
              .map((item) => {
                const accent = getOperationalAccentClasses(item.label);

                return (
                  <div
                    key={item.label}
                    className={`rounded-xl border px-4 py-4 ${accent.wrap}`}
                  >
                    <p className={`mb-1 text-[11px] uppercase tracking-wide ${accent.label}`}>
                      {item.label}
                    </p>
                    <p className={`text-sm ${accent.value}`}>{item.value}</p>
                  </div>
                );
              })}
          </div>

          {fromProjectId && (
            <div className="mt-4">
              <Link
                to={`/dashboard/project/${fromProjectId}`}
                className="text-sm text-[#8DE1D0] transition-colors hover:text-white"
              >
                Volver al informe del proyecto
              </Link>
            </div>
          )}
        </div>

        <div className={`flex flex-col rounded-2xl border p-5 ${tone.side}`}>
          <p className="mb-1 text-sm text-[#A3A3A3]">Nivel sugerido</p>

          <h4 className="mb-1 text-2xl font-medium text-white">
            {suggestedPlan.visibleName}
          </h4>

          <p className="mb-4 text-[#A3A3A3]">{suggestedPlan.headline}</p>

          <div className="mb-4 flex items-baseline gap-1">
            <span className="text-4xl font-light text-white">
              {suggestedPlan.priceLabel}
            </span>
            <span className="text-[#A3A3A3]">{suggestedPlan.periodLabel}</span>
          </div>

          <div className={`mb-4 rounded-xl border px-4 py-4 ${tone.gemBox}`}>
            <p className="mb-1 text-[11px] uppercase tracking-wide opacity-75">
              Gemas incluidas
            </p>
            <p className="text-sm">
              {getGemsLabel(suggestedPlan)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onPlanCheckout(suggestedPlan.id)}
            disabled={isCurrentPlan || isProcessing}
            className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-3 font-medium transition-all ${
              isCurrentPlan
                ? 'cursor-default bg-[#262626] text-[#A3A3A3]'
                : tone.cta
            } disabled:opacity-50`}
          >
            {isProcessing ? (
              <div className="spinner h-4 w-4"></div>
            ) : isCurrentPlan ? (
              'Plan actual'
            ) : (
              <>
                Activar {suggestedPlan.visibleName}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestedPlanBanner;