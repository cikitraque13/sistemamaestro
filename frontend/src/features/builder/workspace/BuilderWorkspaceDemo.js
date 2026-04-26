import React, { useMemo, useState } from 'react';
import AppShellLayout from '../../app-shell/layout/AppShellLayout';
import BuilderWorkspaceLayout from './BuilderWorkspaceLayout';
import builderProjects from '../data/builderProjects';
import builderWorkspaceTabs from '../data/builderWorkspaceTabs';

export default function BuilderWorkspaceDemo() {
  const [activeProjectId, setActiveProjectId] = useState(
    builderProjects[0]?.id || 'project-alpha'
  );
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(
    builderWorkspaceTabs[0]?.id || 'preview'
  );

  const activeProjectData = useMemo(
    () =>
      builderProjects.find((item) => item.id === activeProjectId) ||
      builderProjects[0] || { label: 'Proyecto activo' },
    [activeProjectId]
  );

  return (
    <AppShellLayout
      productLabel="Sistema Maestro"
      activeNavId="builder"
      projectItems={builderProjects}
      activeProjectId={activeProjectId}
      onProjectChange={setActiveProjectId}
      workspaceTabs={builderWorkspaceTabs}
      activeWorkspaceTab={activeWorkspaceTab}
      onWorkspaceTabChange={setActiveWorkspaceTab}
      credits={120}
      bonus={25}
      usageLabel="Créditos listos para construir, iterar y desplegar."
      contextTitle="Builder activo"
      contextBody="El App Shell ya contiene navegación, proyectos, créditos y tabs de trabajo. Esta demo levanta la primera base del Builder dentro de esa carcasa."
    >
      <BuilderWorkspaceLayout
        activeIntent="create"
        activeType="website"
        activeWorkspaceTab={activeWorkspaceTab}
        projectLabel={activeProjectData.label}
      />
    </AppShellLayout>
  );
}