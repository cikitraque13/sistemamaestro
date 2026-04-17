import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  DiamondsFour,
  FileText,
  Lightning,
  Sparkle,
  WarningCircle
} from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { entryOffer, pricingPlans } from '../../content/pricingContent';

import {
  API_BASE,
  CREDIT_NOTE,
  CURRENT_PLAN_BADGE_STYLES,
  FEATURE_LABELS,
  OPERATIONAL_NOTE,
  PLAN_SIGNAL_META,
  PLAN_VISUAL_META
} from './billing.constants';

import {
  buildOperationalItems,
  formatBillingDate,
  formatCredits,
  getConceptLabel,
  getCreditsLabel,
  getErrorMessage,
  getOperationalAccentClasses,
  isValidCheckoutUrl
} from './billing.utils';

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

const BillingPage = () => {
  const { user, checkAuth } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingKey, setProcessingKey] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const suggestedPlanId = location.state?.suggestedPlan || null;
  const fromProjectId = location.state?.fromProjectId || null;
  const entryOfferId = location.state?.entryOfferId || null;

  const suggestedPlan = useMemo(
    () => pricingPlans.find((plan) => plan.id === suggestedPlanId) || null,
    [suggestedPlanId]
  );

  const selectedEntryOffer = useMemo(() => {
    if (entryOfferId && entryOffer?.id === entryOfferId) return entryOffer;
    return entryOffer;
  }, [entryOfferId]);

  const currentPlanId = billingData?.current_plan?.id || user?.plan || 'free';

  const currentPlanDefinition = useMemo(
    () => pricingPlans.find((plan) => plan.id === currentPlanId) || null,
    [currentPlanId]
  );

  const creditSummary = billingData?.credit_summary || null;
  const currentPlanIncludedCredits = billingData?.current_plan?.included_credits;

  const currentPlanName =
    currentPlanDefinition?.visibleName ||
    billingData?.current_plan?.name ||
    'Gratis';

  const transactions = Array.isArray(billingData?.transactions)
    ? billingData.transactions
    : [];

  const fetchBillingData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/user/billing`, {
        withCredentials: true
      });
      setBillingData(response.data);
    } catch {
      toast.error('Error al cargar datos de facturación');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 6;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast.info('Verifica tu correo o revisa el estado del pago en unos segundos.');
      setCheckingPayment(false);
      return;
    }

    setCheckingPayment(true);

    try {
      const response = await axios.get(`${API_BASE}/payments/status/${sessionId}`, {
        withCredentials: true
      });

      const { payment_status, item_type, item_id, status } = response.data || {};

      if (payment_status === 'paid') {
        if (item_type === 'one_time_offer' && item_id === 'single_report') {
          toast.success('Pago completado. Tu informe puntual ha quedado registrado.');
        } else {
          toast.success('Pago completado. Tu plan ha sido actualizado.');
        }

        await checkAuth();
        await fetchBillingData();
        window.history.replaceState({}, '', window.location.pathname);
        setCheckingPayment(false);
        return;
      }

      if (status === 'expired') {
        toast.error('La sesión de pago expiró');
        setCheckingPayment(false);
        return;
      }

      setTimeout(() => {
        pollPaymentStatus(sessionId, attempts + 1);
      }, pollInterval);
    } catch {
      setCheckingPayment(false);
    }
  };

  const redirectToCheckout = (url) => {
    if (!isValidCheckoutUrl(url)) {
      throw new Error('La URL de checkout no es válida');
    }

    window.location.assign(url);
  };

  const handlePlanCheckout = async (planId) => {
    if (planId === 'free' || planId === user?.plan) return;

    const processingId = `plan:${planId}`;
    setProcessingKey(processingId);
    setCheckoutError('');

    try {
      const response = await axios.post(
        `${API_BASE}/payments/checkout`,
        {
          plan_id: planId,
          origin_url: window.location.origin
        },
        { withCredentials: true }
      );

      const checkoutUrl = response?.data?.url;

      if (!isValidCheckoutUrl(checkoutUrl)) {
        throw new Error('Stripe no devolvió una URL de checkout válida');
      }

      redirectToCheckout(checkoutUrl);
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudo iniciar el checkout del plan.');
      setCheckoutError(message);
      toast.error(message);
      setProcessingKey(null);
    }
  };

  const handleEntryOfferCheckout = async () => {
    const offerId = selectedEntryOffer?.id;

    if (!offerId) {
      const message = 'La oferta puntual no está bien configurada.';
      setCheckoutError(message);
      toast.error(message);
      return;
    }

    const processingId = `offer:${offerId}`;
    setProcessingKey(processingId);
    setCheckoutError('');

    try {
      const response = await axios.post(
        `${API_BASE}/payments/checkout`,
        {
          item_type: 'one_time_offer',
          item_id: offerId,
          origin_url: window.location.origin
        },
        { withCredentials: true }
      );

      const checkoutUrl = response?.data?.url;

      if (!isValidCheckoutUrl(checkoutUrl)) {
        throw new Error('Stripe no devolvió una URL de checkout válida');
      }

      redirectToCheckout(checkoutUrl);
    } catch (error) {
      const message = getErrorMessage(
        error,
        'No se pudo iniciar el checkout del informe puntual.'
      );
      setCheckoutError(message);
      toast.error(message);
      setProcessingKey(null);
    }
  };

  useEffect(() => {
    fetchBillingData();

    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (loading) {
    return (
      <DashboardLayout title="Facturación">
        <div className="flex items-center justify-center py-24">
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Facturación">
      <div className="max-w-7xl mx-auto">
        {checkingPayment && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-[#171717] border border-[#262626] rounded-2xl p-8 text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-white">Verificando pago...</p>
            </div>
          </div>
        )}

        {checkoutError && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <WarningCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-300 font-medium mb-1">No se pudo abrir el checkout</p>
                <p className="text-red-200/90 text-sm">{checkoutError}</p>
              </div>
            </div>
          </motion.div>
        )}

        {suggestedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
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
                  onClick={() => handlePlanCheckout(suggestedPlan.id)}
                  disabled={
                    user?.plan === suggestedPlan.id ||
                    processingKey === `plan:${suggestedPlan.id}`
                  }
                  className={`w-full mt-auto py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    user?.plan === suggestedPlan.id
                      ? 'bg-[#262626] text-[#A3A3A3] cursor-default'
                      : 'btn-primary'
                  } disabled:opacity-50`}
                >
                  {processingKey === `plan:${suggestedPlan.id}` ? (
                    <div className="spinner w-4 h-4"></div>
                  ) : user?.plan === suggestedPlan.id ? (
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
          </motion.div>
        )}

        {creditSummary?.enabled && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 }}
            className="mb-8 rounded-2xl border border-amber-500/20 bg-[linear-gradient(180deg,#171717_0%,#14110a_100%)] px-6 py-6"
            data-testid="credit-summary-card"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <DiamondsFour size={24} className="text-amber-300" weight="fill" />
                </div>
                <div>
                  <p className="text-sm text-amber-200/80 mb-1">Créditos del sistema</p>
                  <h3 className="text-2xl text-white font-medium mb-1">
                    Capacidad operativa activa
                  </h3>
                  <p className="text-[#C8C8C8] max-w-2xl">
                    Los créditos pasan a mostrarse como recurso operativo central del sistema,
                    no como nota secundaria.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/15 bg-[#0F0D08] px-4 py-4 min-w-[240px]">
                <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
                  Estado de microfase
                </p>
                <p className="text-sm text-white mb-2">Lectura visible ya integrada.</p>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">{CREDIT_NOTE}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/5 bg-[#0A0A0A] px-5 py-5">
                <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-2">
                  Saldo actual
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-light text-white">
                    {formatCredits(creditSummary.balance)}
                  </span>
                  <span className="text-sm text-amber-300 mb-1">créditos</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#0A0A0A] px-5 py-5">
                <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-2">
                  Incluidos por plan
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-light text-white">
                    {formatCredits(creditSummary.included_credits_for_current_plan)}
                  </span>
                  <span className="text-sm text-amber-300 mb-1">incluidos</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#0A0A0A] px-5 py-5">
                <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-2">
                  Históricos concedidos
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-light text-white">
                    {formatCredits(creditSummary.lifetime_granted)}
                  </span>
                  <span className="text-sm text-[#A3A3A3] mb-1">total</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#0A0A0A] px-5 py-5">
                <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-2">
                  Históricos consumidos
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-light text-white">
                    {formatCredits(creditSummary.lifetime_used)}
                  </span>
                  <span className="text-sm text-[#A3A3A3] mb-1">total</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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

              {billingData?.current_plan?.features && (
                <div className="flex flex-wrap gap-2">
                  {billingData.current_plan.features.map((feature) => (
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
            {pricingPlans.map((plan) => {
              const isCurrentPlan = user?.plan === plan.id;
              const isSuggestedPlan = suggestedPlanId
                ? suggestedPlanId === plan.id
                : plan.id === 'blueprint';

              const visual = PLAN_VISUAL_META[plan.id] || PLAN_VISUAL_META.free;
              const planSignals = PLAN_SIGNAL_META[plan.id]?.chips || [];
              const planSignalClass =
                PLAN_SIGNAL_META[plan.id]?.chipClass ||
                'bg-white/5 text-[#D4D4D4] border border-white/10';

              const highlights =
                Array.isArray(plan.billingHighlights) &&
                plan.billingHighlights.length > 0
                  ? plan.billingHighlights.slice(0, 3)
                  : (plan.features || []).slice(0, 3);

              return (
                <div
                  key={plan.id}
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
                      <h4 className="text-2xl font-medium text-white mb-2">
                        {plan.visibleName}
                      </h4>
                      <p className="text-[#F0F0F0] text-[15px] leading-snug mb-3">
                        {plan.headline}
                      </p>
                      <p className="text-[#A3A3A3] text-sm leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    <div className="flex items-end gap-2">
                      <span className="text-4xl lg:text-5xl font-light text-white">
                        {plan.priceLabel}
                      </span>
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
                      onClick={() => handlePlanCheckout(plan.id)}
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
            })}
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

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-10"
          data-testid="entry-offer-card"
        >
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_28%),linear-gradient(180deg,#141311_0%,#0F0F0F_100%)] p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0" />

            <div className="grid lg:grid-cols-[1.18fr_0.82fr] gap-6 items-stretch">
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-200 text-xs font-medium border border-amber-500/20">
                    {selectedEntryOffer.badge}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-[#C8B898]">
                    {selectedEntryOffer.priceLabel} · {selectedEntryOffer.periodLabel}
                  </span>
                </div>

                <h3 className="text-[2rem] leading-tight font-medium text-white mb-3">
                  {selectedEntryOffer.headline}
                </h3>

                <p className="text-[#ECE7DD] text-lg leading-relaxed mb-4 max-w-2xl">
                  {selectedEntryOffer.description}
                </p>

                <p className="text-sm text-[#D9C8A2] mb-4 max-w-2xl">
                  Reduce dudas, ordena el caso y prepara el siguiente paso.
                </p>

                <p className="text-sm text-[#B9B1A3] mb-6 max-w-2xl">
                  {selectedEntryOffer.valuePromise}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {(selectedEntryOffer.billingHighlights || selectedEntryOffer.features)
                    .slice(0, 4)
                    .map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-2 rounded-full text-xs bg-[#0A0A0A] border border-amber-500/14 text-[#F0E2C5]"
                      >
                        {feature}
                      </span>
                    ))}
                </div>
              </div>

              <div className="bg-[#090909] border border-amber-500/15 rounded-2xl p-5 flex flex-col shadow-[0_0_0_1px_rgba(245,158,11,0.04)]">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-100 text-xs font-medium border border-amber-500/20 mb-4 self-start">
                  <FileText size={14} weight="fill" />
                  Compra puntual
                </div>

                <div className="flex items-baseline gap-2 mb-5">
                  <span className="text-5xl font-light text-white">
                    {selectedEntryOffer.priceLabel}
                  </span>
                  <span className="text-amber-100/75">{selectedEntryOffer.periodLabel}</span>
                </div>

                <div className="rounded-xl border border-white/5 bg-[#111111] px-4 py-4 mb-4">
                  <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
                    Rol dentro del sistema
                  </p>
                  <p className="text-sm text-white">
                    Puente transaccional antes de entrar en continuidad.
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-[linear-gradient(180deg,#181308_0%,#120F07_100%)] px-4 py-4 mb-5">
                  <p className="text-[11px] uppercase tracking-wide text-amber-200/75 mb-1">
                    Qué activa
                  </p>
                  <p className="text-sm text-[#F2E7D1]">
                    Informe premium inicial, lectura más útil y primer paso accionable.
                  </p>
                </div>

                <button
                  onClick={handleEntryOfferCheckout}
                  disabled={processingKey === `offer:${selectedEntryOffer.id}`}
                  className="w-full py-3 rounded-lg font-medium bg-[linear-gradient(180deg,#3F3728_0%,#30291F_100%)] text-white hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-auto border border-amber-500/15"
                  data-testid="entry-offer-cta"
                >
                  {processingKey === `offer:${selectedEntryOffer.id}` ? (
                    <div className="spinner w-4 h-4"></div>
                  ) : (
                    <>
                      {selectedEntryOffer.cta.label}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-medium text-white mb-4">Historial de pagos</h3>

          {transactions.length > 0 ? (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#262626]">
                      <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">
                        Fecha
                      </th>
                      <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">
                        Concepto
                      </th>
                      <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">
                        Monto
                      </th>
                      <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.transaction_id}
                        className="border-b border-[#262626] last:border-0"
                      >
                        <td className="px-6 py-4">
                          <span className="text-white flex items-center gap-2">
                            <Clock size={16} className="text-[#A3A3A3]" />
                            {formatBillingDate(tx.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white capitalize">
                            {getConceptLabel(tx, pricingPlans, entryOffer)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white">€{tx.amount}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              tx.payment_status === 'paid'
                                ? 'bg-green-500/20 text-green-400'
                                : tx.payment_status === 'pending' ||
                                    tx.payment_status === 'initiated'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {tx.payment_status === 'paid'
                              ? 'Completado'
                              : tx.payment_status === 'pending' ||
                                  tx.payment_status === 'initiated'
                                ? 'Pendiente'
                                : 'Fallido'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <CreditCard size={48} className="text-[#A3A3A3] mx-auto mb-4" />
              <p className="text-[#A3A3A3]">No hay transacciones todavía</p>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
