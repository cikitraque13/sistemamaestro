import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  CreditCard,
  Clock,
  ArrowRight,
  Sparkle,
  Lightning,
  FileText
} from '@phosphor-icons/react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  entryOffer,
  pricingPlans
} from '../content/pricingContent';

const API_BASE = '/api';

const FEATURE_LABELS = {
  diagnosis: 'Diagnóstico',
  route: 'Ruta recomendada',
  blueprint: 'Blueprint',
  priorities: 'Prioridades',
  continuity: 'Continuidad guiada',
  deployment: 'Activación y despliegue',
  support: 'Soporte prioritario',
  opportunities: 'Oportunidades'
};

const PLAN_VISUAL_META = {
  free: {
    borderClass: 'border-white/5',
    badgeClass: 'bg-[#202020] text-[#D4D4D4]',
    chipClass: 'bg-[#111111] text-[#D4D4D4] border border-white/5',
    ctaClass: 'bg-[#262626] text-white hover:bg-[#363636]',
    capabilityTitle: 'Señales clave',
    capabilityItems: ['Entrada', 'Claridad', 'Ruta', 'Primer criterio'],
    insight:
      'Ideal para abrir posibilidad, detectar si merece avanzar y romper la inercia inicial.'
  },
  blueprint: {
    borderClass: 'border-[#0F5257]',
    badgeClass: 'bg-[#0F5257] text-white',
    chipClass: 'bg-[#0D1D1F] text-[#CDECEE] border border-[#0F5257]/25',
    ctaClass: 'bg-[#0F5257] text-white hover:bg-[#136970]',
    capabilityTitle: 'Base estructural',
    capabilityItems: ['Blueprint', 'Prioridades', 'Base de monetización', 'Prompts'],
    insight:
      'Aquí empieza la decisión principal del sistema: construir con estructura y dejar atrás la lectura básica.'
  },
  sistema: {
    borderClass: 'border-[#2F455A]',
    badgeClass: 'bg-[#1A2430] text-[#D6E6F5]',
    chipClass: 'bg-[#111A22] text-[#D6E6F5] border border-[#2F455A]/35',
    ctaClass: 'bg-[#2A3F55] text-white hover:bg-[#355169]',
    capabilityTitle: 'Growth + CRO',
    capabilityItems: ['CRO', 'Growth', 'Conversión', 'Oferta', 'Priorización', 'Sistema'],
    insight:
      'No solo acompaña. Mejora rendimiento, secuencia de trabajo y calidad de decisión sobre el proyecto.'
  },
  premium: {
    borderClass: 'border-[#4A3B61]',
    badgeClass: 'bg-[#1A1521] text-[#E4D8F7]',
    chipClass: 'bg-[#17121F] text-[#E4D8F7] border border-[#4A3B61]/35',
    ctaClass: 'bg-[#2A1F3A] text-white hover:bg-[#34274A]',
    capabilityTitle: 'Capa estratégica',
    capabilityItems: [
      'CRO',
      'Growth',
      'Auditoría',
      'AI Product',
      'Assurance',
      'Arquitectura',
      'Dirección de arte',
      'Marketing visual'
    ],
    insight:
      'Cuando hay decisiones críticas, imagen de marca, marketing visual o arquitectura senior, esta es la capa correcta.'
  }
};

const CURRENT_PLAN_BADGE_STYLES = {
  diagnosis: 'bg-[#0F5257]/15 text-[#8DE1D0]',
  route: 'bg-[#0F5257]/15 text-[#8DE1D0]',
  blueprint: 'bg-[#173329] text-[#8BE3A1]',
  priorities: 'bg-[#173329] text-[#8BE3A1]',
  continuity: 'bg-[#2A213C] text-[#D7C3FF]',
  deployment: 'bg-[#2A213C] text-[#D7C3FF]',
  support: 'bg-[#3A241A] text-[#FFC89A]',
  opportunities: 'bg-[#3A241A] text-[#FFC89A]'
};

const Billing = () => {
  const { user, checkAuth } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingKey, setProcessingKey] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

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

  useEffect(() => {
    fetchBillingData();

    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchBillingData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/user/billing`, {
        withCredentials: true
      });
      setBillingData(response.data);
    } catch (error) {
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
      return;
    }

    setCheckingPayment(true);

    try {
      const response = await axios.get(`${API_BASE}/payments/status/${sessionId}`, {
        withCredentials: true
      });

      const { payment_status, item_type, item_id, status } = response.data;

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

      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      setCheckingPayment(false);
    }
  };

  const handlePlanCheckout = async (planId) => {
    if (planId === 'free' || planId === user?.plan) return;

    const processingId = `plan:${planId}`;
    setProcessingKey(processingId);

    try {
      const response = await axios.post(
        `${API_BASE}/payments/checkout`,
        {
          plan_id: planId,
          origin_url: window.location.origin
        },
        { withCredentials: true }
      );

      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al procesar el pago');
      setProcessingKey(null);
    }
  };

  const handleEntryOfferCheckout = async () => {
    const processingId = `offer:${selectedEntryOffer.id}`;
    setProcessingKey(processingId);

    try {
      const response = await axios.post(
        `${API_BASE}/payments/checkout`,
        {
          item_type: 'one_time_offer',
          item_id: selectedEntryOffer.id,
          origin_url: window.location.origin
        },
        { withCredentials: true }
      );

      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al procesar el pago');
      setProcessingKey(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const currentPlanName = billingData?.current_plan?.name || 'Gratis';

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

        {suggestedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8 border border-[#0F5257]/30"
            data-testid="suggested-plan-banner"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F5257]/15 text-[#0F5257] text-sm font-medium mb-4">
                  <Lightning weight="fill" />
                  Recomendación contextual
                </div>

                <h3 className="text-xl text-white font-medium mb-2">
                  Plan sugerido para este caso: {suggestedPlan.visibleName}
                </h3>

                <p className="text-[#D4D4D4] mb-4">
                  {suggestedPlan.valuePromise}
                </p>

                <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4">
                  <p className="text-sm text-[#A3A3A3] mb-1">Qué desbloquea</p>
                  <p className="text-white">
                    {suggestedPlan.promptLayer?.description}
                  </p>
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

              <div className="lg:w-[300px] bg-[#0A0A0A] border border-[#262626] rounded-xl p-5">
                <p className="text-sm text-[#A3A3A3] mb-1">Nivel sugerido</p>
                <h4 className="text-2xl text-white font-medium mb-1">
                  {suggestedPlan.visibleName}
                </h4>
                <p className="text-[#A3A3A3] mb-4">{suggestedPlan.headline}</p>

                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-light text-white">{suggestedPlan.priceLabel}</span>
                  <span className="text-[#A3A3A3]">{suggestedPlan.periodLabel}</span>
                </div>

                {user?.plan !== suggestedPlan.id ? (
                  <button
                    onClick={() => handlePlanCheckout(suggestedPlan.id)}
                    disabled={processingKey === `plan:${suggestedPlan.id}`}
                    className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingKey === `plan:${suggestedPlan.id}` ? (
                      <div className="spinner w-4 h-4"></div>
                    ) : (
                      <>
                        Activar {suggestedPlan.visibleName}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                ) : (
                  <button className="w-full py-3 rounded-lg font-medium bg-[#262626] text-[#A3A3A3] cursor-default">
                    Plan actual
                  </button>
                )}
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
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#0F5257]/20 rounded-lg">
              <Sparkle size={24} className="text-[#0F5257]" />
            </div>
            <div>
              <p className="text-sm text-[#A3A3A3]">Plan actual</p>
              <h3 className="text-xl text-white font-medium capitalize">{currentPlanName}</h3>
            </div>
          </div>

          {billingData?.current_plan?.features && (
            <div className="flex flex-wrap gap-2">
              {billingData.current_plan.features.map((feature) => (
                <span
                  key={feature}
                  className={`px-3 py-1 rounded-full text-sm ${
                    CURRENT_PLAN_BADGE_STYLES[feature] || 'bg-[#262626] text-[#A3A3A3]'
                  }`}
                >
                  {FEATURE_LABELS[feature] || feature}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="mb-10"
          data-testid="entry-offer-card"
        >
          <div className="bg-[#121212] border border-[#0F5257]/30 rounded-2xl p-6 lg:p-8">
            <div className="grid lg:grid-cols-[1.35fr_0.9fr] gap-8">
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#0F5257] text-white text-xs font-medium">
                    {selectedEntryOffer.badge}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-[#A3A3A3]">
                    {selectedEntryOffer.priceLabel} · {selectedEntryOffer.periodLabel}
                  </span>
                </div>

                <div className="min-h-[160px]">
                  <h3 className="text-2xl lg:text-3xl font-light text-white mb-3">
                    {selectedEntryOffer.headline}
                  </h3>
                  <p className="text-[#D4D4D4] mb-4 max-w-2xl">{selectedEntryOffer.description}</p>
                  <p className="text-sm text-[#A3A3A3] mb-6 max-w-2xl">
                    {selectedEntryOffer.valuePromise}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {selectedEntryOffer.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-2 bg-[#0A0A0A] border border-white/5 rounded-lg px-4 py-4 min-h-[92px]"
                    >
                      <CheckCircle
                        size={18}
                        weight="fill"
                        className="text-[#0F5257] mt-0.5 flex-shrink-0"
                      />
                      <span className="text-sm text-[#D4D4D4]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col bg-[#0A0A0A] border border-[#262626] rounded-2xl p-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F5257]/15 text-[#8DE1D0] text-xs font-medium mb-4">
                    <FileText size={14} weight="fill" />
                    Compra puntual
                  </div>

                  <div className="flex items-baseline gap-2 mb-5">
                    <span className="text-5xl font-light text-white">{selectedEntryOffer.priceLabel}</span>
                    <span className="text-[#A3A3A3]">{selectedEntryOffer.periodLabel}</span>
                  </div>

                  <div className="bg-[#111111] border border-[#0F5257]/20 rounded-xl p-4 mb-5">
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wide mb-2">
                      Mejor encaje
                    </p>
                    <p className="text-sm text-white">{selectedEntryOffer.bestFor}</p>
                  </div>

                  <div className="bg-[#111111] border border-white/5 rounded-xl p-4 mb-6">
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wide mb-2">
                      Qué prepara
                    </p>
                    <p className="text-sm text-[#D4D4D4]">
                      Valida la oportunidad, reduce dudas y deja el terreno preparado para subir con lógica al plan Pro.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleEntryOfferCheckout}
                  disabled={processingKey === `offer:${selectedEntryOffer.id}`}
                  className="w-full py-3 rounded-lg font-medium bg-[#0F5257] text-white hover:bg-[#136970] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
          transition={{ delay: 0.06 }}
          className="mb-8"
        >
          <h3 className="text-lg font-medium text-white mb-4">Planes disponibles</h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan) => {
              const isCurrentPlan = user?.plan === plan.id;
              const isSuggestedPlan = suggestedPlanId
                ? suggestedPlanId === plan.id
                : plan.id === 'blueprint';

              const visual = PLAN_VISUAL_META[plan.id] || PLAN_VISUAL_META.free;

              return (
                <div
                  key={plan.id}
                  className={`bg-[#171717] border rounded-2xl p-6 relative flex flex-col min-h-[640px] ${
                    isSuggestedPlan ? 'border-[#0F5257]' : visual.borderClass
                  }`}
                  data-testid={`plan-card-${plan.id}`}
                >
                  <div className="min-h-[40px] mb-4 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {plan.badge && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${visual.badgeClass}`}>
                          {plan.badge}
                        </span>
                      )}

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
                    </div>
                  </div>

                  <div className="min-h-[170px] mb-5">
                    <h4 className="text-2xl font-medium text-white mb-3">{plan.visibleName}</h4>
                    <p className="text-[#F0F0F0] text-base leading-snug mb-3">{plan.headline}</p>
                    <p className="text-[#A3A3A3] text-sm leading-relaxed">{plan.description}</p>
                  </div>

                  <div className="min-h-[84px] flex items-end gap-2 mb-5">
                    <span className="text-4xl lg:text-5xl font-light text-white">{plan.priceLabel}</span>
                    <span className="text-[#A3A3A3] mb-1">{plan.periodLabel}</span>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4 mb-4 min-h-[130px]">
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wide mb-2">
                      Mejor encaje
                    </p>
                    <p className="text-sm text-white leading-relaxed">{plan.bestFor}</p>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4 mb-4 min-h-[145px]">
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wide mb-3">
                      {visual.capabilityTitle}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {visual.capabilityItems.map((item) => (
                        <span key={item} className={`px-2.5 py-1 rounded-full text-xs ${visual.chipClass}`}>
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-[#BEBEBE] leading-relaxed">{visual.insight}</p>
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature) => (
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

                  <button
                    onClick={() => handlePlanCheckout(plan.id)}
                    disabled={
                      plan.id === 'free' ||
                      isCurrentPlan ||
                      processingKey === `plan:${plan.id}`
                    }
                    className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 mt-auto ${
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
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-medium text-white mb-4">Historial de pagos</h3>

          {billingData?.transactions && billingData.transactions.length > 0 ? (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#262626]">
                      <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">Fecha</th>
                      <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">Concepto</th>
                      <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">Monto</th>
                      <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingData.transactions.map((tx) => {
                      const isOneTimeOffer = tx.item_type === 'one_time_offer';
                      const conceptLabel = isOneTimeOffer
                        ? tx.offer_id === 'single_report'
                          ? 'Informe puntual 6,99'
                          : tx.offer_id || 'Oferta puntual'
                        : tx.plan_id || tx.item_id || 'Plan';

                      return (
                        <tr
                          key={tx.transaction_id}
                          className="border-b border-[#262626] last:border-0"
                        >
                          <td className="px-6 py-4">
                            <span className="text-white flex items-center gap-2">
                              <Clock size={16} className="text-[#A3A3A3]" />
                              {formatDate(tx.created_at)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white capitalize">{conceptLabel}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white">€{tx.amount}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs ${
                                tx.payment_status === 'paid'
                                  ? 'bg-green-500/20 text-green-400'
                                  : tx.payment_status === 'pending' || tx.payment_status === 'initiated'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {tx.payment_status === 'paid'
                                ? 'Completado'
                                : tx.payment_status === 'pending' || tx.payment_status === 'initiated'
                                  ? 'Pendiente'
                                  : 'Fallido'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
