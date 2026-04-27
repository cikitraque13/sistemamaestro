import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle, Printer } from '@phosphor-icons/react';
import { toast } from 'sonner';

import PremiumReportPrintTemplate from '../../components/reports/premium/print/PremiumReportPrintTemplate';
import { REPORT_BRAND_ASSETS } from '../../components/reports/premium/reportPremium.constants';
import { useAuth } from '../../context/AuthContext';

const API_BASE = '/api';

const ReportPrintPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingChecked, setBillingChecked] = useState(false);
  const [printFinished, setPrintFinished] = useState(false);

  const hasTriggeredPrintRef = useRef(false);
  const finishTriggeredRef = useRef(false);

  const isAdmin = user?.role === 'admin' || user?.is_admin === true;

  const safeReturnTo = useMemo(() => {
    const raw = searchParams.get('returnTo');
    if (raw && raw.startsWith('/')) return raw;
    return `/dashboard/project/${id}/report-preview`;
  }, [id, searchParams]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setProject(null);
      setBillingData(null);
      setBillingChecked(false);

      try {
        const projectResponse = await axios.get(`${API_BASE}/projects/${id}`, {
          withCredentials: true
        });

        if (cancelled) return;
        setProject(projectResponse.data);

        try {
          const billingResponse = await axios.get(`${API_BASE}/user/billing`, {
            withCredentials: true
          });

          if (cancelled) return;
          setBillingData(billingResponse.data);
        } catch (billingError) {
          if (cancelled) return;
          console.warn('Billing no disponible para ReportPrintPage', billingError);
          setBillingData(null);
        } finally {
          if (!cancelled) {
            setBillingChecked(true);
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error cargando proyecto para ReportPrintPage', error);
        toast.error('No se pudo cargar el documento para imprimir');
        navigate('/dashboard/projects');
        return;
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const transactions = useMemo(
    () => (Array.isArray(billingData?.transactions) ? billingData.transactions : []),
    [billingData]
  );

  const hasPaidSingleReport = useMemo(
    () =>
      transactions.some(
        (tx) =>
          tx?.payment_status === 'paid' &&
          tx?.item_type === 'one_time_offer' &&
          (tx?.item_id === 'single_report' || tx?.offer_id === 'single_report')
      ),
    [transactions]
  );

  const canExportPdf = isAdmin || hasPaidSingleReport;

  const finishPrintFlow = useCallback(() => {
    if (finishTriggeredRef.current) return;
    finishTriggeredRef.current = true;
    setPrintFinished(true);

    try {
      if (window.opener && !window.opener.closed) {
        window.opener.focus();
      }
    } catch (error) {
      console.warn('No se pudo recuperar el foco de la ventana origen', error);
    }

    window.setTimeout(() => {
      try {
        window.close();
      } catch (error) {
        console.warn('No se pudo cerrar automaticamente la ventana de impresion', error);
      }

      window.setTimeout(() => {
        navigate(safeReturnTo, { replace: true });
      }, 120);
    }, 120);
  }, [navigate, safeReturnTo]);

  useEffect(() => {
    if (loading) return;
    if (!project) return;
    if (!isAdmin && billingChecked && !canExportPdf) return;
    if (hasTriggeredPrintRef.current) return;

    hasTriggeredPrintRef.current = true;

    const originalTitle = document.title;
    const safeProjectId = project?.project_id || 'informe';

    const triggerPrint = () => {
      window.print();
    };

    document.title = `informe-maestro-gold-${safeProjectId}`;
    window.addEventListener('afterprint', finishPrintFlow);

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          window.setTimeout(triggerPrint, 180);
        });
      });
    } else {
      window.setTimeout(triggerPrint, 320);
    }

    return () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', finishPrintFlow);
    };
  }, [billingChecked, canExportPdf, finishPrintFlow, isAdmin, loading, project]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] text-white">
        <div className="px-6 text-center">
          <p className="mb-2 text-lg font-medium">Preparando Informe Maestro Gold</p>
          <p className="text-sm text-zinc-400">Generando vista de impresion premium...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] text-white">
        <div className="max-w-xl px-6 text-center">
          <p className="mb-2 text-lg font-semibold">No se pudo cargar el documento</p>
          <p className="mb-4 text-sm text-zinc-400">
            El proyecto no estaba disponible o la sesion no pudo validarse.
          </p>

          <Link
            to="/dashboard/projects"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white transition-all hover:bg-white/10"
          >
            Volver a proyectos
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin && billingChecked && !canExportPdf) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] text-white">
        <div className="max-w-xl px-6 text-center">
          <p className="mb-2 text-lg font-semibold">La exportacion PDF no esta disponible</p>
          <p className="mb-4 text-sm text-zinc-400">
            Este documento requiere la activacion puntual o acceso administrador para imprimirse.
          </p>

          <Link
            to={`/dashboard/project/${id}/report-preview`}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white transition-all hover:bg-white/10"
          >
            Volver a la vista previa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        html,
        body,
        #root {
          min-height: 100%;
          background: #0B0F14 !important;
        }

        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @media screen {
          body {
            background: #0B0F14 !important;
          }

          .report-print-page-shell {
            min-height: 100vh;
            padding: 88px 24px 40px;
            background:
              radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent 26%),
              radial-gradient(circle at top left, rgba(15, 82, 87, 0.18), transparent 28%),
              linear-gradient(180deg, #0B0F14 0%, #050505 100%);
          }

          .report-print-screen-toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 50;
            backdrop-filter: blur(16px);
            background: rgba(10, 10, 10, 0.86);
            border-bottom: 1px solid rgba(245, 158, 11, 0.14);
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          html,
          body,
          #root {
            background: #ffffff !important;
          }

          body {
            margin: 0 !important;
          }

          .report-print-page-shell {
            padding: 0 !important;
            background: #ffffff !important;
          }

          .report-print-screen-toolbar,
          .report-print-flow-message {
            display: none !important;
          }
        }
      `}</style>

      <div className="report-print-screen-toolbar">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-200/20 bg-amber-500/10">
              <Printer size={18} className="text-amber-200" />
            </div>

            <div>
              <p className="text-sm font-medium text-white">
                Ventana de impresion dedicada
              </p>
              <p className="text-xs text-[#A3A3A3] sm:text-sm">
                Al guardar o cancelar, esta ventana intentara cerrarse sola y volver al flujo anterior.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F5257] px-4 py-2 text-white transition-all hover:bg-[#136970]"
            >
              <Printer size={16} />
              Imprimir de nuevo
            </button>

            <button
              type="button"
              onClick={finishPrintFlow}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#171717] px-4 py-2 text-white transition-all hover:bg-[#1E1E1E]"
            >
              <ArrowLeft size={16} />
              Cerrar y volver
            </button>
          </div>
        </div>
      </div>

      <div className="report-print-page-shell">
        {printFinished && (
          <div className="report-print-flow-message mx-auto mb-4 max-w-6xl px-2">
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/18 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              <CheckCircle size={16} weight="fill" className="text-emerald-300" />
              Cerrando flujo de impresion y devolviendo el control a la vista previa...
            </div>
          </div>
        )}

        <PremiumReportPrintTemplate
          project={project}
          brandName={REPORT_BRAND_ASSETS.brandName}
          documentTitle="Informe Maestro Gold"
          showSystemFooter={true}
        />
      </div>
    </>
  );
};

export default ReportPrintPage;