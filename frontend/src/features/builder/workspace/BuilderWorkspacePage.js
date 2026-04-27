import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

import { useAuth } from '../../../context/AuthContext';
import AppShellLayout from '../../app-shell/layout/AppShellLayout';
import BuilderWorkspaceLayout from './BuilderWorkspaceLayout';

import builderProjects from '../data/builderProjects';
import builderWorkspaceTabs from '../data/builderWorkspaceTabs';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000')
  .trim()
  .replace(/\/$/, '');

const API_URL = `${BACKEND_URL}/api`;

const ACTIVE_BUILDER_PROJECT_STORAGE_KEY =
  'sistema_maestro.active_builder_project_id';

const NAVIGATION_ROUTES = {
  overview: '/dashboard',
  builder: '/dashboard/builder',
  projects: '/dashboard/projects',
  opportunities: '/dashboard/opportunities',
  billing: '/dashboard/billing',
  settings: '/dashboard/settings',
};

const readStoredBuilderProjectId = () => {
  if (typeof window === 'undefined') return '';

  try {
    return window.localStorage.getItem(ACTIVE_BUILDER_PROJECT_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const writeStoredBuilderProjectId = (projectId = '') => {
  if (typeof window === 'undefined') return;

  const value = String(projectId || '').trim();

  try {
    if (value) {
      window.localStorage.setItem(ACTIVE_BUILDER_PROJECT_STORAGE_KEY, value);
    }
  } catch {
    // Storage is not critical for Builder runtime.
  }
};

const buildBuilderProjectRoute = (projectId = '') => {
  const value = String(projectId || '').trim();

  if (!value) return NAVIGATION_ROUTES.builder;

  return `${NAVIGATION_ROUTES.builder}?project_id=${encodeURIComponent(value)}`;
};

const getInitialPrompt = (locationState) => {
  if (!locationState || typeof locationState !== 'object') return '';

  return typeof locationState.initialPrompt === 'string'
    ? locationState.initialPrompt.trim()
    : '';
};

const getInitialMode = (locationState) => {
  if (!locationState || typeof locationState !== 'object') return 'idea';

  return typeof locationState.initialMode === 'string'
    ? locationState.initialMode
    : 'idea';
};

const getStateProjectId = (locationState) => {
  if (!locationState || typeof locationState !== 'object') return '';

  return typeof locationState.projectId === 'string'
    ? locationState.projectId.trim()
    : '';
};

const buildNavigationState = ({
  locationState = null,
  projectId = '',
  initialPrompt = '',
  initialMode = 'idea',
} = {}) => ({
  ...(locationState && typeof locationState === 'object' ? locationState : {}),
  projectId: projectId || undefined,
  initialPrompt: initialPrompt || undefined,
  initialMode: initialMode || undefined,
});

const resolveBuilderIntent = (mode) => {
  const intentMap = {
    idea: 'create',
    url: 'improve',
    builder: 'create',
    automation: 'scale',
    deploy: 'scale',
    business: 'improve',
  };

  return intentMap[mode] || 'create';
};

const resolveBuilderType = (mode) => {
  const typeMap = {
    idea: 'website',
    url: 'website',
    builder: 'app',
    automation: 'tool',
    deploy: 'app',
    business: 'website',
  };

  return typeMap[mode] || 'website';
};

const buildProjectLabel = (project, fallback) => {
  if (!project?.input_content) return fallback || 'Proyecto activo';

  const clean = String(project.input_content).trim();
  if (clean.length <= 48) return clean;

  return `${clean.slice(0, 48)}...`;
};

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || JSON.stringify(item))
      .filter(Boolean)
      .join(' ');
  }

  if (detail && typeof detail === 'object') {
    return detail.msg || JSON.stringify(detail);
  }

  return error?.message || 'Error de conexion con el backend.';
};

export default function BuilderWorkspacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const params = new URLSearchParams(location.search);
  const queryProjectId = params.get('project_id') || '';

  const initialPrompt = getInitialPrompt(location.state);
  const initialMode = getInitialMode(location.state);
  const stateProjectId = getStateProjectId(location.state);
  const storedProjectId = readStoredBuilderProjectId();

  const runtimeProjectId = stateProjectId || queryProjectId || storedProjectId;

  const [activeProjectId, setActiveProjectId] = useState(
    runtimeProjectId || builderProjects[0]?.id || 'project-alpha'
  );

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(
    builderWorkspaceTabs[0]?.id || 'preview'
  );

  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(Boolean(runtimeProjectId));
  const [projectError, setProjectError] = useState('');
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false);

  useEffect(() => {
    if (!runtimeProjectId) return;

    writeStoredBuilderProjectId(runtimeProjectId);

    if (!queryProjectId || queryProjectId !== runtimeProjectId) {
      navigate(buildBuilderProjectRoute(runtimeProjectId), {
        replace: true,
        state: buildNavigationState({
          locationState: location.state,
          projectId: runtimeProjectId,
          initialPrompt,
          initialMode,
        }),
      });
    }
  }, [
    runtimeProjectId,
    queryProjectId,
    navigate,
    location.state,
    initialPrompt,
    initialMode,
  ]);

  useEffect(() => {
    if (!runtimeProjectId) {
      setLoadingProject(false);
      setProject(null);
      setProjectError('');
      return;
    }

    let mounted = true;

    const fetchProject = async () => {
      setLoadingProject(true);
      setProjectError('');

      try {
        const response = await axios.get(`${API_URL}/projects/${runtimeProjectId}`, {
          withCredentials: true,
        });

        if (!mounted) return;

        const loadedProjectId = response.data?.project_id || runtimeProjectId;

        setProject(response.data);
        setActiveProjectId(loadedProjectId);
        writeStoredBuilderProjectId(loadedProjectId);
      } catch (error) {
        if (!mounted) return;

        const message = getErrorMessage(error);

        setProjectError(message);
        toast.error('No se pudo cargar el proyecto');
      } finally {
        if (mounted) {
          setLoadingProject(false);
        }
      }
    };

    fetchProject();

    return () => {
      mounted = false;
    };
  }, [runtimeProjectId]);

  const activeProjectData = useMemo(
    () =>
      builderProjects.find((item) => item.id === activeProjectId) ||
      builderProjects[0] ||
      { label: 'Proyecto activo' },
    [activeProjectId]
  );

  const activeIntent = resolveBuilderIntent(initialMode || project?.route);
  const activeType = resolveBuilderType(initialMode || project?.input_type);
  const projectLabel = buildProjectLabel(project, activeProjectData.label);

  const currentBuilderProjectId =
    project?.project_id ||
    runtimeProjectId ||
    '';

  const handleNavChange = (navId) => {
    if (navId === 'deploy' || navId === 'github') {
      setActiveWorkspaceTab(navId);
      return;
    }

    if (navId === 'builder') {
      navigate(buildBuilderProjectRoute(currentBuilderProjectId), {
        state: buildNavigationState({
          locationState: location.state,
          projectId: currentBuilderProjectId,
          initialPrompt,
          initialMode,
        }),
      });
      return;
    }

    const nextRoute = NAVIGATION_ROUTES[navId];

    if (nextRoute) {
      navigate(nextRoute, {
        state: currentBuilderProjectId
          ? {
              fromBuilderProjectId: currentBuilderProjectId,
            }
          : undefined,
      });
    }
  };

  const handleNewProject = () => {
    navigate('/dashboard', {
      state: {
        focus: 'builder-launcher',
      },
    });
  };

  const handleGenerateBlueprint = async () => {
    if (!project?.project_id || generatingBlueprint) return;

    setGeneratingBlueprint(true);

    try {
      const response = await axios.post(
        `${API_URL}/projects/${project.project_id}/blueprint`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );

      setProject(response.data);
      setActiveWorkspaceTab('structure');
      toast.success('Blueprint generado.');
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setGeneratingBlueprint(false);
    }
  };

  const contextBody = project
    ? `Proyecto real ${project.project_id}. Estado: ${project.status || 'sin estado'}. El Builder ya esta conectado al diagnostico del backend.`
    : initialPrompt
      ? `Entrada recibida: "${initialPrompt}". El Builder esta esperando proyecto real.`
      : 'Builder operativo para construir, revisar diagnostico, generar blueprint y preparar continuidad.';

  return (
    <AppShellLayout
      productLabel="Sistema Maestro"
      activeNavId="builder"
      onNavChange={handleNavChange}
      projectItems={builderProjects}
      activeProjectId={activeProjectId}
      onProjectChange={setActiveProjectId}
      workspaceTabs={builderWorkspaceTabs}
      activeWorkspaceTab={activeWorkspaceTab}
      onWorkspaceTabChange={setActiveWorkspaceTab}
      credits={user?.credit_balance ?? 0}
      bonus={user?.credit_lifetime_granted ?? 0}
      usageLabel="Creditos visibles para analisis, builder, blueprint, exportacion y deploy."
      userLabel={user?.name || user?.email || 'Workspace activo'}
      onNewProject={handleNewProject}
      contextTitle={project ? `Proyecto ${project.project_id}` : 'Builder activo'}
      contextBody={contextBody}
    >
      <BuilderWorkspaceLayout
        activeIntent={activeIntent}
        activeType={activeType}
        activeWorkspaceTab={activeWorkspaceTab}
        projectLabel={projectLabel}
        initialPrompt={initialPrompt || project?.input_content || ''}
        project={project}
        loadingProject={loadingProject}
        projectError={projectError}
        onGenerateBlueprint={handleGenerateBlueprint}
        generatingBlueprint={generatingBlueprint}
      />
    </AppShellLayout>
  );
}