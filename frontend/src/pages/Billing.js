import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle,
  CreditCard,
  Clock,
  ArrowRight,
  Sparkle
} from '@phosphor-icons/react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

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

const PLANS = [
  {
    id: 'free',
    name: 'Gratis',
    price: 0,
    period: '',
    features: ['Diagnóstico inicial', 'Ruta recomendada', 'Resultado resumido', '2 oportunidades'],
    highlight: false
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    price: 29,
    period: '/mes',
    features: ['Todo de Gratis', 'Estructura completa', 'Prioridades', 'Arquitectura recomendada', '4 oportunidades'],
    highlight: false
  },
  {
    id: 'sistema',
    name: 'Sistema',
    price: 79,
    period: '/mes',
    features: ['Todo de Blueprint', 'Continuidad guiada', 'Mayor profundidad', 'Activación y despliegue', 'Guardado y progreso'],
    highlight: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    period: '/mes',
    features: ['Todo de Sistema', 'Soporte prioritario', 'Personalización', 'Experiencia completa', 'Oportunidades ilimitadas'],
    highlight: false
  }
];

const Billing = () => {
  const { user, checkAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    fetchBillingData();
    
    // Check for payment return
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [searchParams]);

  const fetchBillingData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/user/billing`, { withCredentials: true });
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
      const response = await axios.get(
        `${API_URL}/api/payments/status/${sessionId}`,
        { withCredentials: true }
      );

      if (response.data.payment_status === 'paid') {
        toast.success('¡Pago completado! Tu plan ha sido actualizado.');
        await checkAuth(); // Refresh user data
        await fetchBillingData();
        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);
        setCheckingPayment(false);
        return;
      } else if (response.data.status === 'expired') {
        toast.error('La sesión de pago expiró');
        setCheckingPayment(false);
        return;
      }

      // Continue polling
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
        `${API_URL}/api/payments/checkout`,
        {
          plan_id: planId,
          origin_url: window.location.origin
        },
        { withCredentials: true }
      );

      // Redirect to Stripe checkout
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
        {/* Payment Processing Overlay */}
        {checkingPayment && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-[#171717] border border-[#262626] rounded-2xl p-8 text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-white">Verificando pago...</p>
            </div>
          </div>
        )}

        {/* Current Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
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
              <h3 className="text-xl text-white font-medium capitalize">
                {billingData?.current_plan?.name || 'Gratis'}
              </h3>
            </div>
          </div>
          {billingData?.current_plan?.features && (
            <div className="flex flex-wrap gap-2">
              {billingData.current_plan.features.map((feature) => (
                <span key={feature} className="px-3 py-1 bg-[#262626] text-[#A3A3A3] rounded-full text-sm">
                  {FEATURE_LABELS[feature] || feature}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h3 className="text-lg font-medium text-white mb-4">Planes disponibles</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const isCurrentPlan = user?.plan === plan.id;
              const canUpgrade = !isCurrentPlan && plan.id !== 'free';

              return (
                <div
                  key={plan.id}
                  className={`bg-[#171717] border rounded-xl p-6 relative ${
                    plan.highlight 
                      ? 'border-[#0F5257] pricing-highlight' 
                      : isCurrentPlan 
                        ? 'border-[#0F5257]/50' 
                        : 'border-white/5'
                  }`}
                  data-testid={`plan-card-${plan.id}`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#0F5257] rounded-full text-xs font-medium text-white">
                      Recomendado
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4 px-3 py-1 bg-[#262626] rounded-full text-xs font-medium text-white">
                      Actual
                    </div>
                  )}
                  <h4 className="text-lg font-medium text-white mb-2">{plan.name}</h4>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-light text-white">€{plan.price}</span>
                    <span className="text-[#A3A3A3]">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-[#A3A3A3]">
                        <CheckCircle size={16} weight="fill" className="text-[#0F5257]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => canUpgrade && handleUpgrade(plan.id)}
                    disabled={!canUpgrade || processingPlan === plan.id}
                    className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      isCurrentPlan
                        ? 'bg-[#262626] text-[#A3A3A3] cursor-default'
                        : plan.id === 'free'
                          ? 'bg-[#262626] text-[#A3A3A3] cursor-default'
                          : plan.highlight
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
                        Mejorar
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
                      <tr key={tx.transaction_id} className="border-b border-[#262626] last:border-0">
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
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            tx.payment_status === 'paid' 
                              ? 'bg-green-500/20 text-green-400'
                              : tx.payment_status === 'pending' || tx.payment_status === 'initiated'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}>
                            {tx.payment_status === 'paid' ? 'Completado' : 
                             tx.payment_status === 'pending' || tx.payment_status === 'initiated' ? 'Pendiente' : 
                             'Fallido'}
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
