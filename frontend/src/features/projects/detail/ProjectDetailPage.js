import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

import DashboardLayout from '../../../components/DashboardLayout';

import {
  buildPlanRecommendationView,
  formatProjectDate
} from './projectDetail.utils';

import ProjectHeaderSection from './sections/ProjectHeaderSection';
import PlanRecommendationSection from './sections/PlanRecommendationSection';
import RefineAnswersSection from './sections/RefineAnswersSection';

const API_BASE = '/api';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const normalizedPlanRecommendation = useMemo(
    () => buildPlanRecommendationView(project),
    [project]
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

        <PlanRecommendationSection
          projectId={project.project_id}
          normalizedPlanRecommendation={normalizedPlanRecommendation}
        />

        <RefineAnswersSection
          project={project}
          projectId={id}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetailPage;
