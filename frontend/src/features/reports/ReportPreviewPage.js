import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Clock,
  DownloadSimple,
  Printer,
  Lock,
  ArrowRight,
  CheckCircle,
  DiamondsFour,
  Flag,
  Lightning,
  FolderOpen
} from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

import DashboardLayout from '../../components/DashboardLayout';
import PremiumReportScreenTemplate from '../../components/reports/premium/screen/PremiumReportScreenTemplate';
import { REPORT_COPY } from '../../components/reports/premium/reportPremium.constants';
import { useAuth } from '../../context/AuthContext';

const API_BASE = '/api';

const buildBuilderUrl = (projectId) =>
  `/dashboard/builder?project_id=${encodeURIComponent(projectId)}`;

const ReportPreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.is_admin === true;

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setProject(null);
      setBillingData(null);

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
          console.warn('Billing no disponible para ReportPreview', billingError);
          setBillingData(null);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error cargando proyecto para ReportPreview', error);
        toast.error('No se pudo cargar la vista previa del informe');
        navigate('/dashboard/projects');
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

  const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const transactions = Array.isArray(billingData?.transactions)
    ? billingData.transactions
    : [];

  const hasPaidSingleReport = transactions.some(
    (tx) =>
      tx?.payment_status === 'paid' &&
      tx?.item_type === 'one_time_offer' &&
      (tx?.item_id === 'single_report' || tx?.offer_id === 'single_report')
  );

  const canExportPdf = isAdmin || hasPaidSingleReport;

  const projectId = project?.project_id || id;
  const builderUrl = buildBuilderUrl(projectId);

  const handleExportPdf = () => {
    if (!project || exportingPdf || !canExportPdf) return;

    setExportingPdf(true);

    const returnTo = `/dashboard/project/${id}/report-preview`;
    const printUrl = `/dashboard/project/${id}/report-print?returnTo=${encodeURIComponent(returnTo)}`;

    const printWindow = window.open(
      printUrl,
      '_blank',
      'width=1120,height=920,resizable=yes,scrollbars=yes'
    );

    if (!printWindow) {
      navigate(printUrl);
    } else {
      try {
        printWindow.focus();
      } catch (error) {
        console.warn('No se pudo enfocar la ventana de impresion', error);
      }
    }

    window.setTimeout(() => {
      setExportingPdf(false);
    }, 420);
  };

  if (loading) {
    return (
      <DashboardLayout title="Vista previa del informe">
        <div className="flex items-center justify-center py-24">
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout title="Vista previa del informe">
        <div className="flex items-center justify-center py-24">
          <div className="max-w-xl rounded-2xl border border-white/10 bg-[#111111] p-6 text-center text-white">
            <p className="mb-2 text-lg font-semibold">
              No se pudo cargar el informe
            </p>

            <p className="mb-4 text-sm text-[#A3A3A3]">
              La vista previa no recibio un proyecto valido o la sesion no estaba disponible.
            </p>

            <Link
              to="/dashboard/projects"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#171717] px-4 py-2 text-white transition-all hover:bg-[#1E1E1E]"
            >
              <ArrowLeft size={16} />
              Volver a proyectos
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Vista previa del informe">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              to="/dashboard/projects"
              className="mb-4 inline-flex items-center gap-2 text-[#A3A3A3] transition-colors hover:text-white"
              data-testid="back-to-projects-btn"
            >
              <ArrowLeft size={18} />
              Volver a proyectos
            </Link>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[#0F5257]/15 p-3">
                <FileText size={24} className="text-[#8DE1D0]" />
              </div>

              <div>
                <h1 className="mb-1 text-2xl font-medium text-white">
                  Vista previa del informe premium
                </h1>

                <p className="max-w-3xl text-[#A3A3A3]">
                  Esta pagina presenta la salida visual premium del informe. El PDF se desbloquea con la compra puntual, pero el proyecto ya puede continuar en Builder.
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-[260px] rounded-xl border border-white/5 bg-[#111111] px-4 py-4">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
              Proyecto cargado
            </p>

            <p className="mb-2 text-white">
              {projectId}
            </p>

            <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
              <Clock size={14} />
              {formatDate(project.updated_at || project.created_at)}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_28%),linear-gradient(180deg,#101617_0%,#0B0F10_100%)] px-5 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                <FolderOpen size={14} />
                {REPORT_COPY.bridgeEyebrow}
              </div>

              <h2 className="mb-2 text-xl font-semibold text-white sm:text-2xl">
                {REPORT_COPY.bridgeTitle}
              </h2>

              <p className="max-w-3xl text-sm leading-6 text-zinc-300">
                {REPORT_COPY.bridgeDescription}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                to={builderUrl}
                state={{
                  projectId,
                  source: 'report-preview-builder-bridge'
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-50 transition-all hover:border-cyan-300/40 hover:bg-cyan-400/15"
                data-testid="build-from-report-btn"
              >
                <FolderOpen size={18} />
                {REPORT_COPY.bridgePrimaryCta}
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/dashboard/projects"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1E1E1E]"
              >
                {REPORT_COPY.bridgeSecondaryCta}
              </Link>
            </div>
          </div>
        </div>

        {canExportPdf ? (
          <div className="mb-6 rounded-2xl border border-[#0F5257]/20 bg-[linear-gradient(180deg,#111111_0%,#0F1414_100%)] px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0F5257]/20 bg-[#0F5257]/15 px-3 py-1 text-xs font-medium text-[#8DE1D0]">
                  <CheckCircle size={14} weight="fill" />
                  {isAdmin ? 'Modo administrador' : 'PDF desbloqueado'}
                </div>

                <p className="mb-1 text-sm text-[#A3A3A3]">
                  {isAdmin ? 'Exportacion de prueba' : 'Exportacion activa'}
                </p>

                <p className="text-white">
                  {isAdmin
                    ? 'Este boton abre una ventana de impresion dedicada. Al guardar o cancelar, el flujo debe cerrarse sin dejar una vista residual.'
                    : 'Tu compra puntual esta activa. Ya puedes exportar el informe completo en PDF.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F5257] px-5 py-3 text-white transition-all hover:bg-[#136970] disabled:opacity-50"
                  data-testid="export-pdf-btn"
                >
                  {exportingPdf ? (
                    <>
                      <div className="spinner h-4 w-4"></div>
                      Preparando PDF...
                    </>
                  ) : (
                    <>
                      <DownloadSimple size={18} />
                      Exportar PDF
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#171717] px-5 py-3 text-white transition-all hover:bg-[#1E1E1E] disabled:opacity-50"
                >
                  <Printer size={18} />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_28%),linear-gradient(180deg,#151311_0%,#101010_100%)] px-5 py-5">
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
                  <Lock size={14} />
                  Vista premium bloqueada
                </div>

                <h2 className="mb-2 text-xl font-medium text-white sm:text-2xl">
                  Desbloquea el informe PDF premium
                </h2>

                <p className="mb-4 max-w-3xl leading-relaxed text-[#DDD3C2]">
                  Ya estas viendo la salida visual premium del documento. La version completa desbloquea la lectura integra, la exportacion PDF y una estructura pensada para ayudarte a decidir el siguiente paso con mas claridad.
                </p>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl border border-white/6 bg-[#111111] px-4 py-4">
                    <div className="mb-2 flex items-center gap-2">
                      <DiamondsFour size={16} className="text-amber-300" weight="fill" />
                      <p className="text-sm font-medium text-white">
                        Resumen ejecutivo
                      </p>
                    </div>

                    <p className="text-xs leading-relaxed text-[#BEB6A8]">
                      Lectura breve y estructurada para entender el caso con mas precision.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/6 bg-[#111111] px-4 py-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Lightning size={16} className="text-amber-300" weight="fill" />
                      <p className="text-sm font-medium text-white">
                        Diagnostico central
                      </p>
                    </div>

                    <p className="text-xs leading-relaxed text-[#BEB6A8]">
                      Hallazgo principal, debilidad clave y palanca prioritaria de mejora.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/6 bg-[#111111] px-4 py-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Flag size={16} className="text-amber-300" weight="fill" />
                      <p className="text-sm font-medium text-white">
                        Lectura por dimensiones
                      </p>
                    </div>

                    <p className="text-xs leading-relaxed text-[#BEB6A8]">
                      Claridad, propuesta, conversion, estructura y continuidad.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/6 bg-[#111111] px-4 py-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle size={16} className="text-amber-300" weight="fill" />
                      <p className="text-sm font-medium text-white">
                        Acciones prioritarias
                      </p>
                    </div>

                    <p className="text-xs leading-relaxed text-[#BEB6A8]">
                      Que deberias mover primero y por que importa comercialmente.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/6 bg-[#111111] px-4 py-4">
                    <div className="mb-2 flex items-center gap-2">
                      <FileText size={16} className="text-amber-300" weight="fill" />
                      <p className="text-sm font-medium text-white">
                        Exportacion PDF
                      </p>
                    </div>

                    <p className="text-xs leading-relaxed text-[#BEB6A8]">
                      Documento listo para guardar, revisar o compartir cuando lo necesites.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-amber-500/18 bg-[linear-gradient(180deg,#17120E_0%,#100F0E_100%)] px-5 py-5">
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-wide text-amber-200/70">
                    Activacion puntual
                  </p>

                  <p className="mb-2 text-4xl font-light text-white">
                    6,99 €
                  </p>

                  <p className="mb-4 text-sm leading-relaxed text-[#D7CCBC]">
                    Activa el informe premium para ver la lectura completa y exportarla en PDF.
                  </p>

                  <div className="mb-4 rounded-xl border border-amber-500/14 bg-[#111111] px-4 py-4">
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
                      Que estas activando
                    </p>

                    <p className="text-sm text-white">
                      Una lectura premium mas util, mas seria y lista para exportacion.
                    </p>
                  </div>

                  <p className="mb-4 text-xs leading-5 text-[#BEB6A8]">
                    Builder sigue disponible aunque no desbloquees el PDF. La compra puntual desbloquea la lectura completa y la exportacion.
                  </p>
                </div>

                <Link
                  to="/dashboard/billing"
                  state={{
                    entryOfferId: 'single_report',
                    fromProjectId: projectId,
                    focusSection: 'entry-offer'
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-[linear-gradient(180deg,#3F3728_0%,#30291F_100%)] px-5 py-3 text-white transition-all hover:brightness-110"
                >
                  Desbloquear PDF premium - 6,99 €
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-10"
          data-testid="report-preview-template"
        >
          <div className="relative overflow-hidden rounded-[28px]">
            {!canExportPdf && (
              <>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[220px] z-10 rounded-b-[28px] bg-[linear-gradient(180deg,rgba(10,10,10,0.04)_0%,rgba(10,10,10,0.24)_10%,rgba(10,10,10,0.58)_24%,rgba(10,10,10,0.86)_46%,rgba(10,10,10,0.97)_72%,rgba(10,10,10,1)_100%)] backdrop-blur-[8px] sm:top-[235px] lg:top-[250px]" />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[205px] z-[11] rounded-b-[28px] bg-[radial-gradient(circle_at_center_top,rgba(255,255,255,0.07),transparent_22%),linear-gradient(180deg,rgba(10,10,10,0)_0%,rgba(10,10,10,0.10)_7%,rgba(10,10,10,0.42)_18%,rgba(10,10,10,0.80)_38%,rgba(10,10,10,0.98)_68%,rgba(10,10,10,1)_100%)] sm:top-[220px] lg:top-[235px]" />

                <div className="pointer-events-none absolute inset-x-6 top-[300px] z-[12] sm:inset-x-8 sm:top-[325px] lg:top-[345px]">
                  <div className="mx-auto max-w-xl rounded-2xl border border-amber-500/14 bg-[rgba(12,12,12,0.72)] px-5 py-4 shadow-[0_0_0_1px_rgba(245,158,11,0.04)] backdrop-blur-md">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/18 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-200">
                      <Lock size={13} />
                      Contenido premium bloqueado
                    </div>

                    <p className="text-sm leading-relaxed text-white sm:text-base">
                      Ya estas viendo la portada y la estructura premium. La lectura completa queda bloqueada hasta activar la compra puntual.
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="relative z-[1]">
              <PremiumReportScreenTemplate
                project={project}
                brandName="Sistema Maestro"
                documentTitle="Informe Puntual"
                showSystemFooter={true}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ReportPreviewPage;