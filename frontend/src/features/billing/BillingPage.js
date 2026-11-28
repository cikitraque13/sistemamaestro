import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { pricingPlans } from '../../content/pricingContent';

import { API_BASE } from './billing.constants';
import { isPaymentProvisionComplete } from './paymentCompletion.mjs';
import { getErrorMessage, isValidCheckoutUrl } from './billing.utils';
import PlanCard from './components/PlanCard';

const CHECKOUT_CONTEXT_KEY = 'sm_billing_checkout_context';

const readCheckoutContext = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCheckoutContext = (value) => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(CHECKOUT_CONTEXT_KEY, JSON.stringify(value));
  } catch {
    // no-op
  }
};

const clearCheckoutContext = () => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(CHECKOUT_CONTEXT_KEY);
  } catch {
    // no-op
  }
};

const BillingPage = () => {
  const { user, checkAuth } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const restoredContext = useMemo(() => readCheckoutContext(), []);

  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingKey, setProcessingKey] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const suggestedPlanId =
    location.state?.suggestedPlan ||
    restoredContext?.suggestedPlan ||
    null;

  const fromProjectId =
    location.state?.fromProjectId ||
    restoredContext?.fromProjectId ||
    null;

  const currentPlanId = billingData?.current_plan?.id || user?.plan || 'free';

  const paidPlans = useMemo(
    () => pricingPlans.filter((plan) => plan.id !== 'free'),
    []
  );

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

      const { status } = response.data || {};

      if (isPaymentProvisionComplete(response.data)) {
        toast.success('Pago completado. Tu plan ha sido actualizado.');

        await checkAuth();
        await fetchBillingData();
        window.history.replaceState({}, '', window.location.pathname);
        setCheckingPayment(false);

        clearCheckoutContext();
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

    writeCheckoutContext({
      kind: 'plan',
      suggestedPlan: planId,
      fromProjectId: fromProjectId || null,
      focusSection: 'plans'
    });

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
      clearCheckoutContext();
      const message = getErrorMessage(error, 'No se pudo iniciar el checkout del plan.');
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
      <div className="mx-auto max-w-6xl" data-testid="billing-plans">
        {checkingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="rounded-2xl border border-white/10 bg-[#0e131a] p-8 text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-white">Verificando pago...</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {paidPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              userPlan={currentPlanId}
              suggestedPlanId={suggestedPlanId}
              processingKey={processingKey}
              onPlanCheckout={handlePlanCheckout}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BillingPage;
