import React from 'react';
import { Link } from 'react-router-dom';
import { Lightning, ArrowRight } from '@phosphor-icons/react';

import {
  getGemsLabel,
  getOperationalAccentClasses,
  buildOperationalItems
} from '../billing.utils';

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
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#0F5257]/15 px-3 py-1 text-sm font-medium text-[#8DE1D0]">
            <Lightning weight="fill" />
            Recomendación contextual
          </div>

          <h3 className="mb-2 text-xl font-medium text-white">
            Plan sugerido: {suggestedPlan.visibleName}
          </h3>

          <p className="mb-4 text-[#D4D4D4]">{suggestedPlan.valuePromise}</p>

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
                className="text-sm text-[#0F5257] transition-colors hover:text-[#1a7a80]"
              >
                Volver al informe del proyecto
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-xl border border-[#262626] bg-[#0A0A0A] p-5">
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

          <div className="mb-4 rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-4">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-cyan-100/75">
              Gemas incluidas
            </p>
            <p className="text-sm text-cyan-100">
              {getGemsLabel(suggestedPlan)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onPlanCheckout(suggestedPlan.id)}
            disabled={
              userPlan === suggestedPlan.id ||
              processingKey === `plan:${suggestedPlan.id}`
            }
            className={`mt-auto flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium transition-all ${
              userPlan === suggestedPlan.id
                ? 'cursor-default bg-[#262626] text-[#A3A3A3]'
                : 'btn-primary'
            } disabled:opacity-50`}
          >
            {processingKey === `plan:${suggestedPlan.id}` ? (
              <div className="spinner h-4 w-4"></div>
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