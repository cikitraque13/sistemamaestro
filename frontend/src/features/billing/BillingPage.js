import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  DiamondsFour,
  WarningCircle
} from '@phosphor-icons/react';
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

const BillingHero = ({ fromProjectId, onReturnToProject }) => (
  <motion.section
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8 overflow-hidden rounded-[28px] border border-amber-200/10 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_28%),radial-gradient(circle_at_top_left,rgba(15,82,87,0.20),transparent_32%),linear-gradient(180deg,#141414_0%,#090909_100%)] p-6 sm:p-8"
  >
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-amber-100">
          <DiamondsFour size={14} weight="fill" />
          Sistema Maestro Gold
        </div>

        <h1 className="mb-3 text-3xl font-light leading-tight text-white sm:text-4xl">
          Centro de capacidad Gold
        </h1>

        <p className="max-w-2xl text-sm leading-6 text-[#D4D4D4] sm:text-base">
          Gestiona tu entrada puntual, tu plan, tus créditos y la continuidad de
          trabajo dentro de Sistema Maestro Builder sin perder el hilo del proyecto.
        </p>
      </div>

      {fromProjectId && (
        <button
          type="button"
          onClick={onReturnToProject}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-all hover:bg-white/10"
        >
          <ArrowLeft size={16} />
          Volver al informe
        </button>
      )}
    </div>

    <div className="mt-6 grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="mb-1 text-xs uppercase tracking-[0.14em] text-amber-100">
          Informe Gold
        </p>
        <p className="text-sm leading-6 text-[#D4D4D4]">
          Entrada puntual para validar una idea, ordenar el diagnóstico y preparar
          el primer paso hacia Builder.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="mb-1 text-xs uppercase tracking-[0.14em] text-[#8DE1D0]">
          Créditos
        </p>
        <p className="text-sm leading-6 text-[#D4D4D4]">
          Capacidad operativa visible para entender el margen de trabajo disponible
          dentro del sistema.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="mb-1 text-xs uppercase tracking-[0.14em] text-sky-200">
          Continuidad
        </p>
        <p className="text-sm leading-6 text-[#D4D4D4]">
          Los planes amplían acceso, recorrido y capacidad cuando el proyecto necesita
          más construcción.
        </p>
      </div>
    </div>
  </motion.section>
);

const ProjectContextCard = ({ fromProjectId, onReturnToProject }) => {
  if (!fromProjectId) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border border-[#0F5257]/20 bg-[#0F5257]/10 px-5 py-4"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle
            size={20}
            weight="fill"
            className="mt-0.5 flex-shrink-0 text-[#8DE1D0]"
          />

          <div>
            <p className="mb-1 font-medium text-white">
              Vienes desde un proyecto activo
            </p>
            <p className="text-sm leading-6 text-[#D4D4D4]">
              Si completas una compra puntual o un plan desde aquí, el sistema conserva
              el contexto para devolverte al informe o al proyecto correspondiente.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReturnToProject}
          className="inline-flex items-center justify-center rounded-xl border border-[#0F5257]/30 bg-black/20 px-4 py-2 text-sm text-[#8DE1D0] transition-all hover:bg-black/30"
        >
          Volver al proyecto
        </button>
      </div>
    </motion.div>
  );
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

  const handleReturnToProject = () => {
    if (!fromProjectId) return;
    navigate(`/dashboard/project/${fromProjectId}/report-preview`);
  };

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
          toast.success('Pago completado. Tu Informe Gold ha quedado registrado.');
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
        'No se pudo iniciar el checkout del Informe Gold.'
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
      <div className="mx-auto max-w-7xl">
        {checkingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="rounded-2xl border border-[#262626] bg-[#171717] p-8 text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-white">Verificando pago...</p>
            </div>
          </div>
        )}

        <BillingHero
          fromProjectId={fromProjectId}
          onReturnToProject={handleReturnToProject}
        />

        <ProjectContextCard
          fromProjectId={fromProjectId}
          onReturnToProject={handleReturnToProject}
        />

        {checkoutError && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <WarningCircle size={20} className="mt-0.5 flex-shrink-0 text-red-400" />
              <div>
                <p className="mb-1 font-medium text-red-300">
                  No se pudo abrir el checkout
                </p>
                <p className="text-sm text-red-200/90">{checkoutError}</p>
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

        <div ref={entryOfferRef}>
          <EntryOfferCard
            selectedEntryOffer={selectedEntryOffer}
            processingKey={processingKey}
            onEntryOfferCheckout={handleEntryOfferCheckout}
            isFocused={entryOfferFocused}
          />
        </div>

        <CreditSummaryCard creditSummary={creditSummary} />

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