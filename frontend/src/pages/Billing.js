import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  CreditCard,
  Clock,
  ArrowRight,
  Sparkle,
  Lightning
} from '@phosphor-icons/react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  entryOffer,
  pricingPlans,
  pricingPlansMap,
  pricingTrustSignals
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
  opportunities: 'Oportunidades',
  premium_report_preview: 'Informe puntual mejorado'
};

const PLAN_VISUAL_META = {
  free: {
    borderClass: 'border-white/5',
    badgeClass: 'bg-[#202020] text-[#D4D4D4]',
    chipClass: 'bg-[#111111] text-[#D4D4D4] border border-white/5',
    ctaClass: 'bg-[#262626] text-white hover:bg-[#363636]',
    compactLine: 'Entrada limpia para detectar si merece avanzar.',
    capabilityTitle: 'Señales clave',
    capabilityItems: ['Entrada', 'Claridad', 'Ruta', 'Primer criterio'],
    featurePreview: ['Diagnóstico inicial', 'Ruta recomendada', 'Resultado resumido']
  },
  blueprint: {
    borderClass: 'border-[#0F5257]',
    badgeClass: 'bg-[#0F5257] text-white',
    chipClass: 'bg-[#0D1D1F] text-[#CDECEE] border border-[#0F5257]/25',
    ctaClass: 'bg-[#0F5257] text-white hover:bg-[#136970]',
    compactLine: 'La base correcta para empezar a construir de verdad.',
    capabilityTitle: 'Base estructural',
    capabilityItems: ['Blueprint', 'Prioridades', 'Monetización', 'Prompts'],
    featurePreview: [
      'Blueprint estructural',
      'Prioridades claras',
      'Base de monetización',
      'Prompts estructurales'
    ]
  },
  sistema: {
    borderClass: 'border-[#2F455A]',
    badgeClass: 'bg-[#1A2430] text-[#D6E6F5]',
    chipClass: 'bg-[#111A22] text-[#D6E6F5] border border-[#2F455A]/35',
    ctaClass: 'bg-[#2A3F55] text-white hover:bg-[#355169]',
    compactLine: 'Optimiza conversión, growth y foco de ejecución.',
    capabilityTitle: 'Growth + CRO',
    capabilityItems: ['CRO', 'Growth', 'Conversión', 'Oferta', 'Sistema'],
    featurePreview: [
      'CRO y mejora de conversión',
      'Growth y priorización',
      'Optimización de propuesta',
      'Prompts de optimización'
    ]
  },
  premium: {
    borderClass: 'border-[#4A3B61]',
    badgeClass: 'bg-[#1A1521] text-[#E4D8F7]',
    chipClass: 'bg-[#17121F] text-[#E4D8F7] border border-[#4A3B61]/35',
    ctaClass: 'bg-[#2A1F3A] text-white hover:bg-[#34274A]',
    compactLine: 'La capa senior para criterio, marketing y dirección estratégica.',
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
    featurePreview: [
      'CRO estratégico',
      'Growth y monetización senior',
      'Auditoría maestra',
      'Prompt 99 y prompts maestros'
    ]
  }
};

const PLAN_RECOMMENDATION_COPY = {
  blueprint: {
    title: 'Plan sugerido para este caso: Pro',
    summary:
      'Aquí ya no basta una lectura inicial. Lo correcto es entrar en una capa estructural para ordenar prioridades, monetización y base de trabajo.',
    unlocks:
      'Desbloquea estructura, prompts base, prioridades y una forma más seria de avanzar.'
  },
  sistema: {
    title: 'Plan sugerido para este caso: Growth',
    summary:
      'El siguiente cuello de botella ya no es entender mejor el caso, sino optimizar rendimiento, growth, conversión y secuencia de trabajo.',
    unlocks:
      'Desbloquea continuidad más profunda, lectura de growth, mejora de oferta y optimización del proyecto.'
  },
  premium: {
    title: 'Plan sugerido para este caso: AI Master 199',
    summary:
      'Este nivel solo tiene sentido cuando el caso presenta suficiente peso comercial o necesita criterio senior en estrategia, marketing, conversión y dirección de proyecto.',
    unlocks:
      'Desbloquea una capa superior de CRO, growth, auditoría, prompts maestros, arquitectura de trabajo y dirección de imagen o marketing cuando procede.'
  }
};

const getFeatureChipClass = (feature) => {
  if (['diagnosis', 'route'].includes(feature)) {
    return 'bg-[#0D1D1F] text-[#CDECEE] border border-[#0F5257]/25';
  }

  if (['blueprint', 'priorities'].includes(feature)) {
    return 'bg-[#111A22] text-[#D6E6F5] border border-[#2F455A]/35';
  }

  if (['continuity', 'deployment'].includes(feature)) {
    return 'bg-[#132015] text-[#D8F3DF] border border-[#2E5A39]/35';
  }

  if (['support', 'opportunities', 'premium_report_preview'].includes(feature)) {
    return 'bg-[#17121F] text-[#E4D8F7] border border-[#4A3B61]/35';
  }

  return 'bg-[#262626] text-[#D4D4D4] border border-white/5';
};

const Billing = () => {
  const { user, checkAuth } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const suggestedPlanId = location.state?.suggestedPlan || null;
  const fromProjectId = location.state?.fromProjectId || null;
  const entryOfferIntent = location.state?.entryOfferId || null;

  const suggestedPlan = useMemo(
    () => pricingPlans.find((plan) => plan.id === suggestedPlanId) || null,
    [suggestedPlanId]
  );

  const currentPlanContent = useMemo(
    () => pricingPlansMap[user?.plan] || pricingPlansMap.free || null,
    [user?.plan]
  );

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
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast.info('Verifica tu correo para confirmar el pago');
      return;
    }

    setCheckingPayment(true);

    try {
      const response = await axios.get(`${API_BASE}/payments/status/${sessionId}`, {
        withCredentials: true
      });

      if (response.data.payment_status === 'paid') {
        toast.success('Pago completado. Tu plan ha sido actualizado.');
        await checkAuth();
        await fetchBillingData();
        window.history.replaceState({}, '', window.location.pathname);
        setCheckingPayment(false);
        return;
      }

      if (response.data.status === 'expired') {
        toast.error('La sesión de pago expiró');
        setCheckingPayment(false);
        return;
      }

      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      setCheckingPayment(false);
    }
  };

  const handleUpgrade = async (planId) => {
    if (planId === 'free' || planId === user?.plan) return;

    setProcessingPlan(planId);

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
      setProcessingPlan(null);
    }
  };

  const handleEntryOfferClick = () => {
    toast.info('El informe puntual quedará conectado a Stripe en el siguiente ajuste de backend.');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const currentPlanName =
    currentPlanContent?.visibleName ||
    billingData?.current_plan?.name ||
    'Gratis';

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
                  {PLAN_RECOMMENDATION_COPY[suggestedPlan.id]?.title ||
                    `Plan sugerido: ${suggestedPlan.visibleName}`}
                </h3>

                <p className="text-[#D4D4D4] mb-4">
                  {PLAN_RECOMMENDATION_COPY[suggestedPlan.id]?.summary ||
                    suggestedPlan.description}
                </p>

                <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4">
                  <p className="text-sm text-[#A3A3A3] mb-1">Qué desbloquea</p>
                  <p className="text-white">
                    {PLAN_RECOMMENDATION_COPY[suggestedPlan.id]?.unlocks ||
                      suggestedPlan.valuePromise}
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
                  <span className="text-4xl font-light text-white">
                    {suggestedPlan.priceLabel}
                  </span>
                  <span className="text-[#A3A3A3]">{suggestedPlan.periodLabel}</span>
                </div>

                {user?.plan !== suggestedPlan.id ? (
                  <button
                    onClick={() => handleUpgrade(suggestedPlan.id)}
                    disabled={processingPlan === suggestedPlan.id}
                    className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingPlan === suggestedPlan.id ? (
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
              <h3 className="text-xl text-white font-medium">{currentPlanName}</h3>
            </div>
          </div>

          {billingData?.current_plan?.features && (
            <div className="flex flex-wrap gap-2">
              {billingData.current_plan.features.map((feature) => (
                <span
                  key={feature}
                  className={`px-3 py-1 rounded-full text-sm ${getFeatureChipClass(feature)}`}
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
          transition={{ delay: 0.03 }}
          className="mb-8"
          data-testid="billing-entry-offer"
        >
          <div className="bg-[#121212] border border-[#0F5257]/25 rounded-2xl p-6">
            <div className="grid lg:grid-cols-[1.3fr_0.85fr] gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#0F5257] text-white text-xs font-medium">
                    {entryOffer.badge}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-[#A3A3A3]">
                    {entryOffer.priceLabel} · {entryOffer.periodLabel}
                  </span>
                </div>

                <h3 className="text-2xl text-white font-medium mb-2">{entryOffer.name}</h3>
                <p className="text-[#D4D4D4] mb-3">{entryOffer.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {entryOffer.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 rounded-full text-xs bg-[#0D1D1F] text-[#CDECEE] border border-[#0F5257]/25"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="text-sm text-[#A3A3A3]">
                  {entryOffer.promptLayer.description}
                </div>
              </div>

              <div
                className={`bg-[#0A0A0A] border rounded-xl p-5 flex flex-col justify-between ${
                  entryOfferIntent ? 'border-[#0F5257]/35' : 'border-[#262626]'
                }`}
              >
                <div>
                  <p className="text-sm text-[#A3A3A3] mb-2">Mejor encaje</p>
                  <p className="text-white text-sm mb-5">{entryOffer.bestFor}</p>

                  <p className="text-xs text-[#737373] leading-relaxed">
                    El bloque ya está integrado en el sistema. La conexión real con Stripe va en el siguiente ajuste de backend.
                  </p>
                </div>

                <button
                  onClick={handleEntryOfferClick}
                  className="w-full mt-6 py-3 rounded-lg font-medium bg-[#0F5257] text-white hover:bg-[#136970] transition-all"
                  data-testid="entry-offer-billing-cta"
                >
                  {entryOffer.cta.label}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <h3 className="text-lg font-medium text-white mb-4">Planes disponibles</h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan, index) => {
              const visual = PLAN_VISUAL_META[plan.id] || PLAN_VISUAL_META.free;
              const isCurrentPlan = user?.plan === plan.id;
              const isSuggestedPlan = suggestedPlanId
                ? suggestedPlanId === plan.id
                : plan.isPrimaryPlan;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`bg-[#171717] border rounded-2xl p-6 relative flex flex-col min-h-[610px] ${
                    isSuggestedPlan ? 'border-[#0F5257]' : visual.borderClass
                  }`}
                  data-testid={`plan-card-${plan.id}`}
                >
                  <div className="min-h-[36px] mb-4 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {isCurrentPlan ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#262626] text-white text-xs font-medium whitespace-nowrap">
                          Actual
                        </span>
                      ) : (
                        plan.badge && (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${visual.badgeClass}`}
                          >
                            {plan.badge}
                          </span>
                        )
                      )}

                      {isSuggestedPlan && !isCurrentPlan && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#0F5257]/15 text-[#0F5257] text-xs font-medium whitespace-nowrap">
                          Recomendado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="min-h-[126px] mb-5">
                    <h4 className="text-2xl font-medium text-white mb-2">{plan.visibleName}</h4>
                    <p className="text-[#F0F0F0] text-base leading-snug mb-2">{plan.headline}</p>
                    <p className="text-sm text-[#A3A3A3] leading-relaxed">{visual.compactLine}</p>
                  </div>

                  <div className="min-h-[72px] flex items-end gap-2 mb-5">
                    <span className="text-4xl lg:text-5xl font-light text-white">
                      {plan.priceLabel}
                    </span>
                    <span className="text-[#A3A3A3] mb-1">{plan.periodLabel}</span>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4 mb-4 min-h-[120px]">
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wide mb-2">
                      Mejor encaje
                    </p>
                    <p className="text-white text-sm leading-relaxed">{plan.bestFor}</p>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4 mb-4 min-h-[142px]">
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wide mb-3">
                      {visual.capabilityTitle}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {visual.capabilityItems.map((item) => (
                        <span
                          key={item}
                          className={`px-2.5 py-1 rounded-full text-xs ${visual.chipClass}`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {visual.featurePreview.map((feature) => (
                        <div key={feature} className="flex items-start gap-2 text-sm text-[#D4D4D4]">
                          <CheckCircle
                            size={14}
                            weight="fill"
                            className="text-[#0F5257] mt-0.5 flex-shrink-0"
                          />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={
                      plan.id === 'free' ||
                      isCurrentPlan ||
                      processingPlan === plan.id
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
                    {processingPlan === plan.id ? (
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
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-8"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pricingTrustSignals.map((signal, index) => (
              <div
                key={signal}
                className="bg-[#121212] border border-white/5 rounded-lg px-4 py-3 text-sm text-[#D4D4D4]"
                data-testid={`billing-signal-${index}`}
              >
                {signal}
              </div>
            ))}
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
                    {billingData.transactions.map((tx) => {
                      const txId = tx.item_id || tx.plan_id;
                      const txLabel =
                        pricingPlansMap[txId]?.visibleName ||
                        (txId === 'single_report' ? 'Informe puntual' : txId || 'Pago');

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
                            <span className="text-white">{txLabel}</span>
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
