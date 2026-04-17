import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';

import {
  buildContinuityView,
  buildDimensionCounters,
  buildPlanRecommendationView,
  buildReportView,
  formatProjectDate
} from './projectDetail.utils';

import ProjectHeaderSection from './sections/ProjectHeaderSection';
import PremiumReportSection from './sections/PremiumReportSection';
import PlanRecommendationSection from './sections/PlanRecommendationSection';
import RefineAnswersSection from './sections/RefineAnswersSection';
import BlueprintSection from './sections/BlueprintSection';

const API_BASE = '/api';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${API_BASE}/projects/${id}`, {
          withCredentials: true
        });
        setProject(response.data);
      } catch {
        toast.error('Proyecto no encontrado');
        navigate('/dashboard/projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, navigate]);

  const handleGenerateBlueprint = async () => {
    if (user?.plan === 'free') {
      toast.error('Necesitas el plan Blueprint o superior');
      navigate('/dashboard/billing');
      return;
    }

    setGeneratingBlueprint(true);

    try {
      const response = await axios.post(
        `${API_BASE}/projects/${id}/blueprint`,
        {},
        { withCredentials: true }
      );
      setProject(response.data);
      toast.success('Blueprint generado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al generar blueprint');
    } finally {
      setGeneratingBlueprint(false);
    }
  };

  const reportView = useMemo(() => buildReportView(project), [project]);

  const dimensionCounters = useMemo(
    () => buildDimensionCounters(reportView),
    [reportView]
  );

  const normalizedPlanRecommendation = useMemo(
    () => buildPlanRecommendationView(project),
    [project]
  );

  const { continuityMeta, continuityPlanId } = useMemo(
    () => buildContinuityView(reportView, normalizedPlanRecommendation),
    [reportView, normalizedPlanRecommendation]
  );

  const formattedDate = useMemo(
    () => formatProjectDate(project?.created_at),
    [project?.created_at]
  );

  if (loading) {
    return (
      <DashboardLayout title="Proyecto">
        <div className="flex items-center justify-center py-24">
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) return null;

  return (
    <DashboardLayout title="Detalle del proyecto">
      <div className="max-w-6xl mx-auto">
        <ProjectHeaderSection
          project={project}
          formattedDate={formattedDate}
        />

        <PremiumReportSection
          project={project}
          reportView={reportView}
          dimensionCounters={dimensionCounters}
          continuityMeta={continuityMeta}
          continuityPlanId={continuityPlanId}
          normalizedPlanRecommendation={normalizedPlanRecommendation}
        />

        <PlanRecommendationSection
          projectId={project.project_id}
          normalizedPlanRecommendation={normalizedPlanRecommendation}
        />

        <RefineAnswersSection
          project={project}
          projectId={id}
        />

        <BlueprintSection
          project={project}
          userPlan={user?.plan}
          generatingBlueprint={generatingBlueprint}
          onGenerateBlueprint={handleGenerateBlueprint}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetailPage;
