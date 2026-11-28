import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretDown, Plus } from '@phosphor-icons/react';

import { loadOwnerProjects } from '../../builder/components/BuilderProjectSelect';
import { projectHumanName } from '../../builder/workspace/projectLabel';
import { resolveActiveProject } from '../dashboardModel';

const builderUrl = (projectId) =>
  `/dashboard/builder?project_id=${encodeURIComponent(projectId)}`;

export default function DashboardSidebarProjects({ onNavigate, testId = true }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState(null);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && projects == null) {
      loadOwnerProjects()
        .then((items) => setProjects(items))
        .catch(() => setProjects([]));
    }
  };

  const openProject = (projectId) => {
    onNavigate?.();
    navigate(builderUrl(projectId), {
      state: { projectId, source: 'dashboard-sidebar-project' },
    });
  };

  const startNew = () => {
    onNavigate?.();
    navigate('/dashboard', {
      state: {
        focus: 'builder-launcher',
        source: 'dashboard-sidebar-new-project',
        resetPrompt: true,
      },
    });
  };

  const activeId = resolveActiveProject(projects || [])?.project_id || '';

  return (
    <div
      data-testid={testId ? 'dashboard-sidebar-projects' : undefined}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-1"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/[0.04] hover:text-white"
      >
        <span className="min-w-0 flex-1 truncate">Proyectos</span>
        <CaretDown
          aria-hidden="true"
          size={12}
          className={`shrink-0 text-zinc-500 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="max-h-32 overflow-y-auto px-1 pb-1">
          {projects == null ? (
            <p className="px-2 py-1.5 text-xs text-zinc-500">Cargando…</p>
          ) : projects.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-zinc-500">Sin proyectos</p>
          ) : (
            projects.map((project) => {
              const selected = project.project_id === activeId;
              return (
                <button
                  key={project.project_id}
                  type="button"
                  onClick={() => openProject(project.project_id)}
                  className={`block w-full truncate rounded-lg px-2 py-1.5 text-left text-xs ${
                    selected
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {projectHumanName(project)}
                </button>
              );
            })
          )}
          <button
            type="button"
            onClick={startNew}
            className="mt-0.5 flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-teal-300 hover:bg-white/[0.04]"
          >
            <Plus size={12} aria-hidden="true" />
            Nuevo proyecto
          </button>
        </div>
      ) : null}
    </div>
  );
}
