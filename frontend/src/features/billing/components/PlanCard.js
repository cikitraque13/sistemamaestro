import React from 'react';
import { ArrowRight, CheckCircle } from '@phosphor-icons/react';

import { PLAN_SIGNAL_META, PLAN_VISUAL_META } from '../billing.constants';
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

const PlanCard = ({
  plan,
  userPlan,
  suggestedPlanId,
  processingKey,
  onPlanCheckout
}) => {
  const isCurrentPlan = userPlan === plan.id;
  const isSuggestedPlan = suggestedPlanId
    ? suggestedPlanId === plan.id
    : plan.id === 'blueprint';

  const visual = PLAN_VISUAL_META[plan.id] || PLAN_VISUAL_META.free;
  const planSignals = PLAN_SIGNAL_META[plan.id]?.chips || [];
  const planSignalClass =
    PLAN_SIGNAL_META[plan.id]?.chipClass ||
    'bg-white/5 text-[#D4D4D4] border border-white/10';

  const highlights =
    Array.isArray(plan.billingHighlights) && plan.billingHighlights.length > 0
      ? plan.billingHighlights.slice(0, 3)
      : (plan.features || []).slice(0, 3);

  return (
    <div
      className={`relative overflow-hidden border rounded-2xl p-6 h-full min-h-[920px] ${visual.surfaceClass} ${
        isSuggestedPlan ? 'border-[#0F5257]' : visual.borderClass
      }`}
      data-testid={`plan-card-${plan.id}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${visual.accentLineClass}`}
      />

      <div className="grid h-full grid-rows-[92px_176px_88px_122px_244px_1fr_auto] gap-y-4">
        <div className="flex items-start">
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${visual.badgeClass}`}
            >
              {plan.badge || visual.eyebrow}
            </span>

            {isSuggestedPlan && !isCurrentPlan && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#0F5257]/15 text-[#8DE1D0] text-xs font-medium">
                Recomendado
              </span>
            )}

            {isCurrentPlan && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#262626] text-white text-xs font-medium">
                Actual
              </span>
            )}

            {plan.id === 'blueprint' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#0F5257]/10 text-[#8DE1D0] text-xs font-medium">
                Entrada principal
              </span>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-2xl font-medium text-white mb-2">{plan.visibleName}</h4>
          <p className="text-[#F0F0F0] text-[15px] leading-snug mb-3">{plan.headline}</p>
          <p className="text-[#A3A3A3] text-sm leading-relaxed">{plan.description}</p>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-4xl lg:text-5xl font-light text-white">{plan.priceLabel}</span>
          <span className="text-[#A3A3A3] mb-1">{plan.periodLabel}</span>
        </div>

        <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-2">
            Mejor encaje
          </p>
          <p className="text-sm text-white leading-relaxed">
            {plan.bestForShort || plan.bestFor}
          </p>
        </div>

        <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-3">
            Marco operativo
          </p>

          <OperationalGrid items={buildOperationalItems(plan)} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="min-h-[60px]">
            <div className="flex flex-wrap gap-2">
              {planSignals.map((signal) => (
                <span
                  key={`${plan.id}-${signal}`}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${planSignalClass}`}
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>

          <ul className="space-y-3">
            {highlights.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-[#D4D4D4]"
              >
                <CheckCircle
                  size={16}
                  weight="fill"
                  className="text-[#0F5257] mt-0.5 flex-shrink-0"
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => onPlanCheckout(plan.id)}
          disabled={
            plan.id === 'free' ||
            isCurrentPlan ||
            processingKey === `plan:${plan.id}`
          }
          className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isCurrentPlan
              ? 'bg-[#262626] text-[#A3A3A3] cursor-default'
              : plan.id === 'free'
                ? 'bg-[#262626] text-[#A3A3A3] cursor-default'
                : visual.ctaClass
          } disabled:opacity-50`}
          data-testid={`upgrade-btn-${plan.id}`}
        >
          {processingKey === `plan:${plan.id}` ? (
            <div className="spinner w-4 h-4"></div>
          ) : isCurrentPlan ? (
            'Plan actual'
          ) : plan.id === 'free' ? (
            'Plan base'
          ) : (
            <>
              {plan.cta.label}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlanCard;
