import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WarningCircle } from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { entryOffer, pricingPlans } from '../../content/pricingContent';

import { API_BASE } from './billing.constants';
import { getErrorMessage, isValidCheckoutUrl } from './billing.utils';

import SuggestedPlanBanner from './components/SuggestedPlanBanner';
import CreditSummaryCard from './components/CreditSummaryCard';
import CurrentPlanCard from './components/CurrentPlanCard';
import PlansGrid from './components/PlansGrid';
import EntryOfferCard from './components/EntryOfferCard';
import PaymentHistoryTable from './components/PaymentHistoryTable';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const entryOfferRef = useRef(null);

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

  const entryOfferId =
    location.state?.entryOfferId ||
    restoredContext?.entryOfferId ||
    null;

  const focusSection =
    location.state?.focusSection ||
    restoredContext?.focusSection ||
    null;

  const entryOfferFocused =
    entryOfferId === 'single_report' || focusSection === 'entry-offer';

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
        const checkoutContext = readCheckoutContext();

        if (item_type === 'one_time_offer' && item_id === 'single_report') {
          toast.success('Pago completado. Tu informe puntual ha quedado registrado.');
        } else {
          toast.success('Pago completado. Tu plan ha sido actualizado.');
        }

        await checkAuth();
        await fetchBillingData();
        window.history.replaceState({}, '', window.location.pathname);
        setCheckingPayment(false);

        if (
          item_type === 'one_time_offer' &&
          item_id === 'single_report' &&
          checkoutContext?.fromProjectId
        ) {
          clearCheckoutContext();
          navigate(
            `/dashboard/project/${checkoutContext.fromProjectId}/report-preview`,
            { replace: true }
          );
          return;
        }

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

    writeCheckoutContext({
      kind: 'entry-offer',
      entryOfferId: offerId,
      fromProjectId: fromProjectId || null,
      focusSection: 'entry-offer'
    });

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
      clearCheckoutContext();
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

  useEffect(() => {
    if (!entryOfferFocused || !entryOfferRef.current) return;

    const timer = setTimeout(() => {
      entryOfferRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 180);

    return () => clearTimeout(timer);
  }, [entryOfferFocused]);

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

        <SuggestedPlanBanner
          suggestedPlan={suggestedPlan}
          fromProjectId={fromProjectId}
          userPlan={user?.plan}
          processingKey={processingKey}
          onPlanCheckout={handlePlanCheckout}
        />

        <CreditSummaryCard creditSummary={creditSummary} />

        <div ref={entryOfferRef}>
          <EntryOfferCard
            selectedEntryOffer={selectedEntryOffer}
            processingKey={processingKey}
            onEntryOfferCheckout={handleEntryOfferCheckout}
            isFocused={entryOfferFocused}
          />
        </div>

        <CurrentPlanCard
          currentPlanDefinition={currentPlanDefinition}
          currentPlanIncludedCredits={currentPlanIncludedCredits}
          currentPlanName={currentPlanName}
          currentPlanFeatures={billingData?.current_plan?.features}
        />

        <PlansGrid
          userPlan={user?.plan}
          suggestedPlanId={suggestedPlanId}
          processingKey={processingKey}
          onPlanCheckout={handlePlanCheckout}
        />

        <PaymentHistoryTable transactions={transactions} />
      </div>
    </DashboardLayout>
  );
};

export default BillingPage;
