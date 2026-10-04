import { requestedProject, validatedProjectIdentity, serverRevision } from '../state/projectIdentity.mjs';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/apiClient';
import { economicPost } from '../../../lib/economicRequest';
import AppShellLayout from '../../app-shell/layout/AppShellLayout';
import BuilderWorkspaceLayout from './BuilderWorkspaceLayout';

import builderProjects from '../data/builderProjects';
import builderWorkspaceTabs from '../data/builderWorkspaceTabs';

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
    landing: 'create',
    webapp: 'create',
    automation: 'scale',
    automate: 'scale',
    deploy: 'scale',
    business: 'improve',
    blueprint: 'create',
  };

  return intentMap[mode] || 'create';
};

const resolveBuilderType = (mode) => {
  const typeMap = {
    idea: 'website',
    url: 'website',
    builder: 'app',
    landing: 'website',
    webapp: 'app',
    automation: 'tool',
    automate: 'tool',
    deploy: 'app',
    business: 'website',
    blueprint: 'website',
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

  return error?.message || 'Error de conexión con el backend.';
};

export default function BuilderWorkspacePage() {
  const { user } = useAuth();
  const ownerId = typeof user?.user_id === 'string' ? user.user_id : null;
  if (!ownerId) return <div role="status">Se requiere una sesión autenticada.</div>;
  return <OwnedBuilderWorkspacePage key={ownerId} ownerId={ownerId} />;
}

function OwnedBuilderWorkspacePage({ ownerId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const params = new URLSearchParams(location.search);
  const queryProjectId = params.get('project_id') || '';

  const initialPrompt = getInitialPrompt(location.state);
  const initialMode = getInitialMode(location.state);
  const stateProjectId = getStateProjectId(location.state);
  let selectionId = '';
  let selectionError = '';
  try { selectionId = requestedProject(location.search, location.state); }
  catch (error) { selectionError = error.message; }
  const selection = useRef(null);
  const selectionKey = JSON.stringify([ownerId, selectionId, selectionError]);
  if (!selection.current || selection.current.key !== selectionKey) {
    selection.current = {
      key: selectionKey,
      epoch: (selection.current?.epoch || 0) + 1,
    };
  }
  const selectionEpoch = selection.current.epoch;
  const runtimeProjectId = selectionId;

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(
    builderWorkspaceTabs[0]?.id || 'preview'
  );

  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(Boolean(runtimeProjectId));
  const [projectError, setProjectError] = useState('');
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false);

  useEffect(() => {
    if (!runtimeProjectId || selectionError) {
      setLoadingProject(false);
      setProject(null);
      setProjectError(selectionError);
      return;
    }

    let mounted = true;

    const fetchProject = async () => {
      setLoadingProject(true);
      setProjectError('');

      try {
        const response = await api.get(`/projects/${runtimeProjectId}`);

        if (!mounted || selection.current?.key !== selectionKey) return;

        validatedProjectIdentity(response.data, ownerId, runtimeProjectId);
        const loadedProjectId = response.data.project_id;

        setProject(response.data);
        writeStoredBuilderProjectId(loadedProjectId);
      } catch (error) {
        if (!mounted || selection.current?.key !== selectionKey) return;

        const message = getErrorMessage(error);

        setProject(null);
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
  }, [runtimeProjectId, ownerId, selectionKey, selectionError]);

  const resolved = !selectionError && project?.project_id === selectionId && project?.user_id === ownerId ? project : null;
  const projectLoadingForCurrentSelection =
    loadingProject ||
    (Boolean(runtimeProjectId) && !selectionError && !resolved && !projectError);

  const activeProjectData = useMemo(
    () =>
      builderProjects.find((item) => item.id === runtimeProjectId) ||
      builderProjects[0] ||
      { label: 'Proyecto activo' },
    [runtimeProjectId]
  );

  const activeIntent = resolveBuilderIntent(initialMode || resolved?.route);
  const activeType = resolveBuilderType(initialMode || resolved?.input_type);
  const projectLabel = buildProjectLabel(resolved, activeProjectData.label);

  const currentBuilderProjectId =
    resolved?.project_id ||
    (selectionError ? '' : runtimeProjectId) ||
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
    if (
      !resolved?.project_id ||
      generatingBlueprint ||
      selection.current?.key !== selectionKey ||
      selection.current?.epoch !== selectionEpoch
    ) return;

    const requestSelection = { key: selectionKey, epoch: selectionEpoch };
    const projectId = resolved.project_id;
    setGeneratingBlueprint(true);

    try {
      const response = await economicPost(api,
        `/projects/${projectId}/blueprint`,
        {}, { headers: { 'If-Match': serverRevision(resolved) } }
      );

      if (selection.current?.key !== requestSelection.key || selection.current?.epoch !== requestSelection.epoch) return;
      validatedProjectIdentity(response.data, ownerId, projectId);
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

  const contextBody = resolved
    ? `Proyecto real ${resolved.project_id}. Estado: ${resolved.status || 'sin estado'}. El Builder ya está conectado al diagnóstico del backend.`
    : initialPrompt
      ? `Entrada recibida: "${initialPrompt}". El Builder está esperando proyecto real.`
      : 'Builder operativo para construir, revisar diagnóstico, generar blueprint y preparar continuidad.';
  return (
    <AppShellLayout
      productLabel="Sistema Maestro"
      activeNavId="builder"
      onNavChange={handleNavChange}
      projectItems={builderProjects}
      activeProjectId={selectionError ? '' : (runtimeProjectId || resolved?.project_id || '')}
      onProjectChange={(id) => navigate(buildBuilderProjectRoute(id), { state: { projectId: id } })}
      workspaceTabs={builderWorkspaceTabs}
      activeWorkspaceTab={activeWorkspaceTab}
      onWorkspaceTabChange={setActiveWorkspaceTab}
      credits={user?.credit_balance ?? 0}
      bonus={user?.credit_lifetime_granted ?? 0}
      usageLabel="Créditos visibles para análisis, builder, blueprint, exportación y deploy."
      userLabel={user?.name || user?.email || 'Workspace activo'}
      onNewProject={handleNewProject}
      contextTitle={resolved ? `Proyecto ${resolved.project_id}` : 'Builder activo'}
      contextBody={contextBody}
    >
      <BuilderWorkspaceLayout
        key={JSON.stringify([ownerId, selectionKey, resolved?.updated_at])}
        ownerId={ownerId}
        activeIntent={activeIntent}
        activeType={activeType}
        activeWorkspaceTab={activeWorkspaceTab}
        projectLabel={projectLabel}
        initialPrompt={resolved?.input_content || initialPrompt || ''}
        project={resolved}
        loadingProject={projectLoadingForCurrentSelection}
        projectError={selectionError || projectError || (!resolved ? 'Proyecto no validado.' : '')}
        onGenerateBlueprint={handleGenerateBlueprint}
        generatingBlueprint={generatingBlueprint}
      />
    </AppShellLayout>
  );
}
