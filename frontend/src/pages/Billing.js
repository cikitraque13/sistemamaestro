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

const PLAN_CONTENT = [
  {
    id: 'free',
    name: 'Gratis',
    price: 0,
    period: '',
    headline: 'Entrada al sistema',
    description:
      'Pensado para detectar señales iniciales, validar el foco y entender si merece profundizar.',
    bestFor:
      'Útil cuando todavía estás explorando el problema y no necesitas una capa estructural.',
    features: [
      'Diagnóstico inicial',
      'Ruta recomendada',
      'Resultado resumido',
      '2 oportunidades'
    ]
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    price: 29,
    period: '/mes',
    headline: 'Claridad y foco inicial',
    description:
      'Convierte un diagnóstico inicial en una dirección más precisa, con prioridades y estructura básica.',
    bestFor:
      'Encaja cuando el cuello de botella es entender mejor qué está frenando el proyecto.',
    features: [
      'Todo de Gratis',
      'Estructura completa',
      'Prioridades',
      'Arquitectura recomendada',
      '4 oportunidades'
    ]
  },
  {
    id: 'sistema',
    name: 'Sistema',
    price: 79,
    period: '/mes',
    headline: 'Plan accionable y continuidad',
    description:
      'Ordena prioridades, arquitectura y ejecución para proyectos que ya necesitan una capa seria de sistema.',
    bestFor:
      'Es el nivel central cuando detectar el problema ya no basta y hace falta ordenar qué tocar primero.',
    features: [
      'Todo de Blueprint',
      'Continuidad guiada',
      'Mayor profundidad',
      'Activación y despliegue',
      'Guardado y progreso'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    period: '/mes',
    headline: 'Intervención estratégica completa',
    description:
      'Reservado para casos con complejidad alta, varios cuellos de botella y suficiente impacto económico en juego.',
    bestFor:
      'Encaja cuando ya no basta un blueprint simple y hace falta profundidad estratégica para decidir bien.',
    features: [
      'Todo de Sistema',
      'Soporte prioritario',
      'Personalización',
      'Experiencia completa',
      'Oportunidades ilimitadas'
    ]
  }
];

const PLAN_RECOMMENDATION_COPY = {
  blueprint: {
    title: 'Plan sugerido para este caso: Blueprint',
    summary:
      'El siguiente cuello de botella no es todavía la complejidad del sistema, sino afinar mejor el diagnóstico y ordenar el foco.',
    unlocks:
      'Desbloquea más precisión, prioridad inicial y una dirección accionable sin saltar aún a una capa estructural superior.'
  },
  sistema: {
    title: 'Plan sugerido para este caso: Sistema',
    summary:
      'Aquí el problema ya supera una mejora puntual. Lo importante ya no es solo detectar fallos, sino priorizar y estructurar.',
    unlocks:
      'Desbloquea continuidad guiada, mayor profundidad y una secuencia clara para ejecutar con criterio.'
  },
  premium: {
    title: 'Plan sugerido para este caso: Premium',
    summary:
      'Este nivel solo tiene sentido cuando el caso presenta complejidad real, varios frentes conectados y suficiente impacto comercial.',
    unlocks:
      'Desbloquea una intervención estratégica más completa para tomar mejores decisiones en monetización, crecimiento, conversión y sistema.'
  }
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

  const suggestedPlan = useMemo(
    () => PLAN_CONTENT.find((plan) => plan.id === suggestedPlanId) || null,
    [suggestedPlanId]
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
      <div className="max-w-6xl mx-auto">
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
                  {PLAN_RECOMMENDATION_COPY[suggestedPlan.id]?.title || `Plan sugerido: ${suggestedPlan.name}`}
                </h3>

                <p className="text-[#D4D4D4] mb-4">
                  {PLAN_RECOMMENDATION_COPY[suggestedPlan.id]?.summary}
                </p>

                <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4">
                  <p className="text-sm text-[#A3A3A3] mb-1">Qué desbloquea</p>
                  <p className="text-white">
                    {PLAN_RECOMMENDATION_COPY[suggestedPlan.id]?.unlocks}
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

              <div className="lg:w-[280px] bg-[#0A0A0A] border border-[#262626] rounded-xl p-5">
                <p className="text-sm text-[#A3A3A3] mb-1">Nivel sugerido</p>
                <h4 className="text-2xl text-white font-medium mb-1">
                  {suggestedPlan.name}
                </h4>
                <p className="text-[#A3A3A3] mb-4">{suggestedPlan.headline}</p>

                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-light text-white">€{suggestedPlan.price}</span>
                  <span className="text-[#A3A3A3]">{suggestedPlan.period}</span>
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
                        Activar {suggestedPlan.name}
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
                  className="px-3 py-1 bg-[#262626] text-[#A3A3A3] rounded-full text-sm"
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
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <h3 className="text-lg font-medium text-white mb-4">Planes disponibles</h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLAN_CONTENT.map((plan) => {
              const isCurrentPlan = user?.plan === plan.id;
              const isSuggestedPlan = suggestedPlanId
                ? suggestedPlanId === plan.id
                : plan.id === 'sistema';

              return (
                <div
                  key={plan.id}
                  className={`bg-[#171717] border rounded-2xl p-6 relative flex flex-col min-h-[560px] ${
                    isSuggestedPlan
                      ? 'border-[#0F5257]'
                      : isCurrentPlan
                        ? 'border-white/15'
                        : 'border-white/5'
                  }`}
                  data-testid={`plan-card-${plan.id}`}
                >
                  <div className="flex items-start justify-between gap-3 min-h-[52px] mb-5">
                    <div className="flex flex-wrap gap-2">
                      {isSuggestedPlan && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#0F5257] text-white text-xs font-medium whitespace-nowrap">
                          Recomendado
                        </span>
                      )}

                      {isCurrentPlan && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#262626] text-white text-xs font-medium whitespace-nowrap">
                          Actual
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-5">
                    <h4 className="text-2xl font-medium text-white mb-2">{plan.name}</h4>
                    <p className="text-sm text-[#D4D4D4] mb-2">{plan.headline}</p>
                    <p className="text-sm text-[#A3A3A3]">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-4xl font-light text-white">€{plan.price}</span>
                    <span className="text-[#A3A3A3]">{plan.period}</span>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4 mb-5">
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wide mb-2">
                      Mejor encaje
                    </p>
                    <p className="text-sm text-white">{plan.bestFor}</p>
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
                          : isSuggestedPlan
                            ? 'bg-[#0F5257] text-white hover:bg-[#136970]'
                            : 'bg-[#262626] text-white hover:bg-[#363636]'
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
                        Activar {plan.name}
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
                      <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">Plan</th>
                      <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">Monto</th>
                      <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingData.transactions.map((tx) => (
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
                          <span className="text-white capitalize">{tx.plan_id}</span>
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
