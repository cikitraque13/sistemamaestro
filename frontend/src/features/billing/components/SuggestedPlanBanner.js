import React from 'react';
import { Link } from 'react-router-dom';
import { Lightning, ArrowRight } from '@phosphor-icons/react';

import { getCreditsLabel, getOperationalAccentClasses, buildOperationalItems } from '../billing.utils';

const SuggestedPlanBanner = ({
  suggestedPlan,
  fromProjectId,
  userPlan,
  processingKey,
  onPlanCheckout
}) => {
  if (!suggestedPlan) return null;

  return (
    <div
      className="card mb-8 border border-[#0F5257]/30"
      data-testid="suggested-plan-banner"
    >
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F5257]/15 text-[#8DE1D0] text-sm font-medium mb-4">
            <Lightning weight="fill" />
            Recomendación contextual
          </div>

          <h3 className="text-xl text-white font-medium mb-2">
            Plan sugerido: {suggestedPlan.visibleName}
          </h3>

          <p className="text-[#D4D4D4] mb-4">{suggestedPlan.valuePromise}</p>

          <div className="grid sm:grid-cols-3 gap-3">
            {buildOperationalItems(suggestedPlan)
              .slice(0, 3)
              .map((item) => {
                const accent = getOperationalAccentClasses(item.label);

                return (
                  <div
                    key={item.label}
                    className={`rounded-xl border px-4 py-4 ${accent.wrap}`}
                  >
                    <p className={`text-[11px] uppercase tracking-wide mb-1 ${accent.label}`}>
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
                className="text-[#0F5257] hover:text-[#1a7a80] text-sm transition-colors"
              >
                Volver al informe del proyecto
              </Link>
            </div>
          )}
        </div>

        <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-5 flex flex-col">
          <p className="text-sm text-[#A3A3A3] mb-1">Nivel sugerido</p>
          <h4 className="text-2xl text-white font-medium mb-1">
            {suggestedPlan.visibleName}
          </h4>
          <p className="text-[#A3A3A3] mb-4">{suggestedPlan.headline}</p>

          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-light text-white">{suggestedPlan.priceLabel}</span>
            <span className="text-[#A3A3A3]">{suggestedPlan.periodLabel}</span>
          </div>

          <div className="rounded-xl border border-amber-500/15 bg-[#111008] px-4 py-4 mb-4">
            <p className="text-[11px] uppercase tracking-wide text-amber-200/70 mb-1">
              Créditos previstos
            </p>
            <p className="text-sm text-amber-300">
              {getCreditsLabel(suggestedPlan)}
            </p>
          </div>

          <button
            onClick={() => onPlanCheckout(suggestedPlan.id)}
            disabled={
              userPlan === suggestedPlan.id ||
              processingKey === `plan:${suggestedPlan.id}`
            }
            className={`w-full mt-auto py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              userPlan === suggestedPlan.id
                ? 'bg-[#262626] text-[#A3A3A3] cursor-default'
                : 'btn-primary'
            } disabled:opacity-50`}
          >
            {processingKey === `plan:${suggestedPlan.id}` ? (
              <div className="spinner w-4 h-4"></div>
            ) : userPlan === suggestedPlan.id ? (
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
