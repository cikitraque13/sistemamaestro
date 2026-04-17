import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import PremiumReportPrintTemplate from '../components/reports/premium/print/PremiumReportPrintTemplate';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

const ReportPrintPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingChecked, setBillingChecked] = useState(false);

  const hasTriggeredPrintRef = useRef(false);

  const isAdmin = user?.role === 'admin' || user?.is_admin === true;

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

  useEffect(() => {
    if (loading) return;
    if (!project) return;
    if (!isAdmin && billingChecked && !canExportPdf) return;
    if (hasTriggeredPrintRef.current) return;

    hasTriggeredPrintRef.current = true;

    const originalTitle = document.title;
    const safeProjectId = project?.project_id || 'informe';
    let restored = false;

    const restoreState = () => {
      if (restored) return;
      restored = true;
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreState);
    };

    const triggerPrint = () => {
      window.print();
      setTimeout(restoreState, 1500);
    };

    document.title = `informe-puntual-${safeProjectId}`;
    window.addEventListener('afterprint', restoreState);

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setTimeout(triggerPrint, 100);
        });
      });
    } else {
      setTimeout(triggerPrint, 220);
    }

    return () => {
      window.removeEventListener('afterprint', restoreState);
      restoreState();
    };
  }, [loading, project, billingChecked, canExportPdf, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-lg font-medium mb-2">Preparando documento</p>
          <p className="text-sm text-slate-500">Generando vista de impresión…</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <div className="max-w-xl px-6 text-center">
          <p className="text-lg font-semibold mb-2">No se pudo cargar el documento</p>
          <p className="text-sm text-slate-500 mb-4">
            El proyecto no estaba disponible o la sesión no pudo validarse.
          </p>
          <Link
            to="/dashboard/projects"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 transition-all"
          >
            Volver a proyectos
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin && billingChecked && !canExportPdf) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <div className="max-w-xl px-6 text-center">
          <p className="text-lg font-semibold mb-2">La exportación PDF no está disponible</p>
          <p className="text-sm text-slate-500 mb-4">
            Este documento requiere la activación puntual o acceso administrador para imprimirse.
          </p>
          <Link
            to={`/dashboard/project/${id}/report-preview`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 transition-all"
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
        html, body, #root {
          background: #ffffff !important;
        }

        @media screen {
          body {
            background: #eef2f7 !important;
          }

          .report-print-page-shell {
            min-height: 100vh;
            padding: 24px 0 40px;
            background: #eef2f7;
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html, body, #root {
            background: #ffffff !important;
          }

          .report-print-page-shell {
            padding: 0 !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      <div className="report-print-page-shell">
        <PremiumReportPrintTemplate
          project={project}
          brandName="Sistema Maestro"
          documentTitle="Informe Puntual"
          showSystemFooter={true}
        />
      </div>
    </>
  );
};

export default ReportPrintPage;