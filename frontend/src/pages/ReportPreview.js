import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Clock,
  DownloadSimple,
  Printer
} from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';
import DashboardLayout from '../components/DashboardLayout';
import PremiumReportPdfTemplate from '../components/reports/PremiumReportPdfTemplate';

const API_BASE = '/api';

const ReportPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

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
    if (!project || exportingPdf) return;

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
                  Vista previa del informe premium
                </h1>
                <p className="text-[#A3A3A3] max-w-3xl">
                  Esta página valida la plantilla visual PDF-ready antes de cerrar la exportación final.
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

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-10"
          data-testid="report-preview-template"
        >
          <div id="print-report-root">
            <div className="report-print-frame">
              <PremiumReportPdfTemplate
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

export default ReportPreview;
