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
  DiamondsFour
} from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';
import DashboardLayout from '../components/DashboardLayout';
import PremiumReportPdfTemplate from '../components/reports/PremiumReportPdfTemplate';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

const ReportPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  const isAdminPreview = user?.role === 'admin';

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API_BASE}/projects/${id}`, {
        withCredentials: true
      });
      setProject(response.data);
    } catch {
      toast.error('No se pudo cargar la vista previa del informe');
      navigate('/dashboard/projects');
    } finally {
      setLoading(false);
    }
  };

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

  const handleExportPdf = () => {
    if (!project || exportingPdf || !isAdminPreview) return;

    const originalTitle = document.title;
    const safeProjectId = project.project_id || 'informe';
    let restored = false;

    const restoreState = () => {
      if (restored) return;
      restored = true;
      document.title = originalTitle;
      setExportingPdf(false);
      window.removeEventListener('afterprint', restoreState);
    };

    setExportingPdf(true);
    document.title = `informe-puntual-${safeProjectId}`;

    window.addEventListener('afterprint', restoreState);

    setTimeout(() => {
      window.print();
      setTimeout(restoreState, 1200);
    }, 80);
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

  if (!project) return null;

  return (
    <DashboardLayout title="Vista previa del informe">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: #0A0A0A !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .report-preview-screen-only {
            display: none !important;
          }

          body * {
            visibility: hidden !important;
          }

          #print-report-root,
          #print-report-root * {
            visibility: visible !important;
          }

          #print-report-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #print-report-root .report-print-frame {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="report-preview-screen-only flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <Link
              to={`/dashboard/project/${id}`}
              className="inline-flex items-center gap-2 text-[#A3A3A3] hover:text-white transition-colors mb-4"
              data-testid="back-to-project-btn"
            >
              <ArrowLeft size={18} />
              Volver al proyecto
            </Link>

            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-[#0F5257]/15">
                <FileText size={24} className="text-[#8DE1D0]" />
              </div>

              <div>
                <h1 className="text-2xl text-white font-medium mb-1">
                  {isAdminPreview ? 'Vista previa del informe premium' : 'Muestra del informe premium'}
                </h1>
                <p className="text-[#A3A3A3] max-w-3xl">
                  {isAdminPreview
                    ? 'Esta página valida la plantilla visual PDF-ready antes de cerrar la exportación final.'
                    : 'Aquí ves la capa visual del informe. La lectura completa y la exportación PDF se desbloquean con la activación del informe puntual.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#111111] px-4 py-4 min-w-[260px]">
            <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
              Proyecto cargado
            </p>
            <p className="text-white mb-2">{project.project_id}</p>
            <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
              <Clock size={14} />
              {formatDate(project.updated_at || project.created_at)}
            </div>
          </div>
        </div>

        {isAdminPreview ? (
          <div className="report-preview-screen-only rounded-2xl border border-white/5 bg-[#111111] px-5 py-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-sm text-[#A3A3A3] mb-1">Exportación inicial</p>
                <p className="text-white">
                  Este botón abre la impresión del navegador para guardar el informe como PDF.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F5257] text-white hover:bg-[#136970] transition-all disabled:opacity-50"
                  data-testid="export-pdf-btn"
                >
                  {exportingPdf ? (
                    <>
                      <div className="spinner w-4 h-4"></div>
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
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-[#171717] text-white hover:bg-[#1E1E1E] transition-all disabled:opacity-50"
                >
                  <Printer size={18} />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="report-preview-screen-only rounded-2xl border border-amber-500/15 bg-[linear-gradient(180deg,#141311_0%,#0F0F0F_100%)] px-5 py-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-200 text-xs font-medium border border-amber-500/20 mb-3">
                  <Lock size={14} weight="fill" />
                  Acceso premium bloqueado
                </div>

                <p className="text-white text-lg mb-1">
                  Ya existe un informe premium preparado para este caso.
                </p>
                <p className="text-[#B9B1A3] max-w-3xl">
                  La muestra visual te deja ver la calidad del documento, pero la lectura completa y la exportación PDF forman parte del informe puntual.
                </p>
              </div>

              <Link
                to="/dashboard/billing"
                state={{ entryOfferId: 'single_report', fromProjectId: id }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[linear-gradient(180deg,#3A3327_0%,#2E2921_100%)] text-white hover:brightness-110 transition-all border border-amber-500/15"
              >
                Desbloquear por 6,99 €
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-10"
          data-testid="report-preview-template"
        >
          <div id="print-report-root">
            <div className="report-print-frame">
              {isAdminPreview ? (
                <PremiumReportPdfTemplate
                  project={project}
                  brandName="Sistema Maestro"
                  documentTitle="Informe Puntual"
                  showSystemFooter={true}
                />
              ) : (
                <div className="relative overflow-hidden rounded-[28px] border border-amber-500/10">
                  <div className="pointer-events-none select-none">
                    <div className="max-h-[980px] overflow-hidden">
                      <PremiumReportPdfTemplate
                        project={project}
                        brandName="Sistema Maestro"
                        documentTitle="Informe Puntual"
                        showSystemFooter={true}
                      />
                    </div>
                  </div>

                  <div className="absolute inset-x-0 top-[240px] bottom-0 bg-[linear-gradient(180deg,rgba(10,10,10,0)_0%,rgba(10,10,10,0.35)_18%,rgba(10,10,10,0.72)_42%,rgba(10,10,10,0.92)_68%,rgba(10,10,10,1)_100%)] backdrop-blur-[10px]" />

                  <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
                    <div className="mx-auto max-w-3xl rounded-2xl border border-amber-500/20 bg-[linear-gradient(180deg,#141311_0%,#0F0F0F_100%)] px-6 py-6 shadow-[0_0_0_1px_rgba(245,158,11,0.04)]">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                        <div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-200 text-xs font-medium border border-amber-500/20 mb-3">
                            <DiamondsFour size={14} weight="fill" />
                            Informe puntual premium
                          </div>

                          <h3 className="text-2xl text-white font-medium mb-2">
                            Desbloquea la lectura completa y la exportación PDF
                          </h3>
                          <p className="text-[#D8D1C5] leading-relaxed">
                            Accede al informe estructurado, la lectura más útil del caso y el primer paso accionable por <span className="text-amber-300 font-medium">6,99 €</span>.
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[240px]">
                          <Link
                            to="/dashboard/billing"
                            state={{ entryOfferId: 'single_report', fromProjectId: id }}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[linear-gradient(180deg,#3A3327_0%,#2E2921_100%)] text-white hover:brightness-110 transition-all border border-amber-500/15"
                          >
                            Comprar informe
                            <ArrowRight size={16} />
                          </Link>

                          <Link
                            to={`/dashboard/project/${id}`}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-[#151515] text-white hover:bg-[#1C1C1C] transition-all"
                          >
                            Volver al proyecto
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ReportPreview;
