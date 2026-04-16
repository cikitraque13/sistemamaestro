import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Clock
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

  useEffect(() => {
    fetchProject();
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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
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
                  Esta página sirve para validar la plantilla visual PDF-ready con datos reales
                  antes de abrir la exportación final.
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

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-10"
          data-testid="report-preview-template"
        >
          <PremiumReportPdfTemplate
            project={project}
            brandName="Sistema Maestro"
            documentTitle="Informe Puntual"
            showSystemFooter={true}
          />
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ReportPreview;
