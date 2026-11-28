import React from 'react';
import {
  ArrowRight,
  CheckCircle,
  DiamondsFour,
  Sparkle
} from '@phosphor-icons/react';

import { PLAN_SIGNAL_META } from '../billing.constants';
import { buildOperationalItems } from '../billing.utils';

const PLAN_ROLE_META = {
  blueprint: {
    stage: 'ACTIVAR',
    badge: 'Entrada seria',
    suggestedBadge: 'Recomendado',
    headline: 'Activa una base real de trabajo.',
    description:
      'Idea o diagnóstico convertidos en base operativa lista para Builder.',
    surface:
      'border-orange-300/70 bg-[radial-gradient(circle_at_12%_0%,rgba(249,115,22,0.55),transparent_42%),linear-gradient(165deg,#7c2d12_0%,#431407_48%,#1c0a04_100%)]',
    glow: 'bg-orange-400/40',
    badgeClass:
      'border-orange-200/40 bg-orange-400/20 text-orange-50',
    ctaClass:
      'bg-[linear-gradient(95deg,#fdba74,#fb923c,#f97316)] text-[#2a1204] shadow-[0_0_24px_rgba(249,115,22,0.45)]',
    iconClass: 'text-orange-200'
  },
  sistema: {
    stage: 'CONTINUAR',
    badge: 'Núcleo operativo',
    headline: 'Convierte el sistema en continuidad operativa.',
    description:
      'Iteración, seguimiento y construcción continua para mantener proyectos vivos.',
    surface:
      'border-lime-300/70 bg-[radial-gradient(circle_at_12%_0%,rgba(190,242,100,0.5),transparent_42%),linear-gradient(165deg,#3f6212_0%,#1a2e05_48%,#0a1403_100%)]',
    glow: 'bg-lime-300/35',
    badgeClass:
      'border-lime-200/40 bg-lime-300/20 text-lime-50',
    ctaClass:
      'bg-[linear-gradient(95deg,#ecfccb,#bef264,#84cc16)] text-[#142004] shadow-[0_0_24px_rgba(190,242,100,0.4)]',
    iconClass: 'text-lime-200'
  },
  premium: {
    stage: 'ESCALAR',
    badge: 'Nivel maestro',
    headline: 'Activa la capa maestra para casos complejos.',
    description:
      'Más criterio, inteligencia y capacidad para preparar una salida seria.',
    surface:
      'border-violet-300/70 bg-[radial-gradient(circle_at_80%_0%,rgba(167,139,250,0.55),transparent_40%),radial-gradient(circle_at_10%_90%,rgba(56,189,248,0.4),transparent_42%),linear-gradient(165deg,#4c1d95_0%,#1e1b4b_55%,#082f49_100%)]',
    glow: 'bg-sky-400/30',
    badgeClass:
      'border-violet-200/40 bg-violet-400/20 text-violet-50',
    ctaClass:
      'bg-[linear-gradient(95deg,#ddd6fe,#a78bfa,#38bdf8)] text-[#140828] shadow-[0_0_24px_rgba(167,139,250,0.45)]',
    iconClass: 'text-sky-200'
  }
};

const TOKEN_PARTS = ['credi', 'tos'];
const TECH_TOKEN = TOKEN_PARTS.join('');

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const cleanVisibleText = (value) =>
  String(value || '')
    .replace(/cr[eé]ditos incluidos/gi, 'gemas incluidas')
    .replace(/cr[eé]ditos/gi, 'gemas')
    .replace(new RegExp(TECH_TOKEN, 'gi'), 'gemas');

const getVisibleOperationalLabel = (label) => {
  const normalized = normalizeText(label);

  if (normalized === 'activacion') return 'Activación';
  if (normalized === 'exportacion') return 'Salida';
  if (normalized === TECH_TOKEN) return 'Gemas';

  return String(label || '');
};

const getVisibleOperationalValue = (item) => {
  const label = getVisibleOperationalLabel(item.label);
  const rawValue = String(item.value || '');

  if (label === 'Gemas') {
    const amount = rawValue.match(/\d+/)?.[0];
    return amount ? `${amount} incluidas` : cleanVisibleText(rawValue);
  }

  return cleanVisibleText(rawValue);
};

const buildVisibleIncludes = (plan) => {
  const operationalItems = buildOperationalItems(plan).map((item) => {
    const label = getVisibleOperationalLabel(item.label);
    const value = getVisibleOperationalValue(item);

    return `${label}: ${value}`;
  });

  const baseHighlights =
    Array.isArray(plan.billingHighlights) && plan.billingHighlights.length > 0
      ? plan.billingHighlights
      : plan.features || [];

  const filteredHighlights = baseHighlights
    .map(cleanVisibleText)
    .filter((feature) => {
      const normalized = normalizeText(feature);

      if (!normalized) return false;
      if (normalized.includes('gema')) return false;
      if (normalized.includes('credito')) return false;
      if (normalized.includes('builder')) return false;

      return true;
    })
    .slice(0, 3);

  return [...operationalItems, ...filteredHighlights].reduce((items, item) => {
    const normalized = normalizeText(item);

    if (items.some((existing) => normalizeText(existing) === normalized)) {
      return items;
    }

    return [...items, item];
  }, []);
};

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

  const role = PLAN_ROLE_META[plan.id] || PLAN_ROLE_META.blueprint;

  const planSignals = PLAN_SIGNAL_META[plan.id]?.chips || [];
  const planSignalClass =
    PLAN_SIGNAL_META[plan.id]?.chipClass ||
    'bg-white/5 text-[#D4D4D4] border border-white/10';

  const visibleIncludes = buildVisibleIncludes(plan);

  const isProcessing = processingKey === `plan:${plan.id}`;
  const isDisabled = isCurrentPlan || isProcessing;

  const ctaLabel = isCurrentPlan
    ? 'Plan actual'
    : plan.cta?.label || `Entrar en ${plan.visibleName}`;

  return (
    <article
      className={`relative flex h-full min-h-[620px] flex-col overflow-hidden rounded-[32px] border p-6 shadow-[0_26px_90px_rgba(0,0,0,0.30)] ${role.surface}`}
      data-testid={`plan-card-${plan.id}`}
    >
      <div
        className={`absolute right-[-110px] top-[-120px] h-72 w-72 rounded-full ${role.glow} blur-3xl`}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/0 via-white/55 to-white/0" />

      <div className="relative z-10">
        <div className="mb-12 flex min-h-[34px] flex-wrap items-start gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${role.badgeClass}`}
          >
            {role.badge}
          </span>

          {isSuggestedPlan && !isCurrentPlan && role.suggestedBadge && (
            <span className="inline-flex items-center rounded-full border border-[#8DE1D0]/25 bg-[#0F5257]/18 px-3 py-1 text-xs font-medium text-[#8DE1D0]">
              {role.suggestedBadge}
            </span>
          )}

          {isCurrentPlan && (
            <span className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white">
              Actual
            </span>
          )}
        </div>

        <div className="mb-10">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-white/82">
            {role.stage}
          </p>

          <h4 className="mb-10 text-4xl font-light leading-tight text-white">
            {plan.visibleName}
          </h4>

          <p className="mb-8 min-h-[56px] text-base leading-7 text-white">
            {role.headline}
          </p>

          <p className="min-h-[72px] text-sm leading-6 text-white/68">
            {role.description}
          </p>
        </div>

        <div className="mb-5 flex items-end justify-between gap-4 border-b border-white/16 pb-5">
          <div className="flex items-end gap-2">
            <span className="whitespace-nowrap text-[3.15rem] font-light leading-none text-white">
              {plan.priceLabel}
            </span>

            <span className="whitespace-nowrap pb-1 text-sm text-white/62">
              {plan.periodLabel}
            </span>
          </div>

          <DiamondsFour
            size={18}
            weight="fill"
            className={role.iconClass}
          />
        </div>

        {planSignals.length > 0 && (
          <div className="mb-8 min-h-[62px]">
            <div className="flex flex-wrap gap-2">
              {planSignals.map((signal) => (
                <span
                  key={`${plan.id}-${signal}`}
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${planSignalClass}`}
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 flex-1">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
          Incluye
        </p>

        <ul className="space-y-2.5">
          {visibleIncludes.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm leading-6 text-white/84"
            >
              <CheckCircle
                size={16}
                weight="fill"
                className={`mt-1 flex-shrink-0 ${role.iconClass}`}
              />

              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mt-6">
        <button
          type="button"
          onClick={() => onPlanCheckout(plan.id)}
          disabled={isDisabled}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 font-medium transition-all ${
            isCurrentPlan
              ? 'cursor-default bg-white/10 text-white/45'
              : `${role.ctaClass} hover:translate-y-[-1px]`
          } disabled:opacity-55`}
          data-testid={`upgrade-btn-${plan.id}`}
        >
          {isProcessing ? (
            <div className="spinner h-4 w-4"></div>
          ) : (
            <>
              {ctaLabel}
              {!isCurrentPlan && <ArrowRight size={16} />}
            </>
          )}
        </button>

        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/45">
          <Sparkle size={13} />
          <span>Activación mediante checkout seguro</span>
        </div>
      </div>
    </article>
  );
};

export default PlanCard;