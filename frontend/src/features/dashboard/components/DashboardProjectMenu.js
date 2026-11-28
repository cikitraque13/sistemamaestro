import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretDown, Check } from '@phosphor-icons/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { loadOwnerProjects } from '../../builder/components/BuilderProjectSelect';
import { projectHumanName } from '../../builder/workspace/projectLabel';
import { resolveActiveProject } from '../dashboardModel';

const builderUrl = (projectId) =>
  `/dashboard/builder?project_id=${encodeURIComponent(projectId)}`;

export default function DashboardProjectMenu({ onNewProject }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let live = true;

    loadOwnerProjects()
      .then((items) => {
        if (live) setProjects(items);
      })
      .catch(() => {
        if (live) setProjects([]);
      });

    return () => {
      live = false;
    };
  }, []);

  const active = resolveActiveProject(projects);
  const label = active ? projectHumanName(active) : 'Proyecto';

  const openProject = (projectId) => {
    navigate(builderUrl(projectId), {
      state: {
        projectId,
        source: 'dashboard-project-menu',
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="dashboard-project-menu"
        aria-label="Proyecto activo"
        className="inline-flex h-9 max-w-[16rem] items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 text-sm font-medium text-zinc-100 outline-none transition hover:border-cyan-200/30 focus-visible:ring-2 focus-visible:ring-cyan-300/50"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#67e8f9] shadow-[0_0_12px_#67e8f9]" aria-hidden="true" />
        <span className="min-w-0 truncate">{label}</span>
        <CaretDown aria-hidden="true" size={14} className="shrink-0 text-zinc-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={8}
        collisionPadding={12}
        aria-label="Proyectos"
        data-testid="dashboard-project-options"
        className="w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-white/10 bg-[#0c1016] p-2 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
      >
        {projects.length === 0 ? (
          <p className="px-3 py-2 text-sm text-zinc-400">Sin proyectos</p>
        ) : (
          projects.map((project) => {
            const selected = project.project_id === active?.project_id;
            return (
              <DropdownMenuItem
                key={project.project_id}
                data-testid={`dashboard-project-option-${project.project_id}`}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-100 outline-none focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10"
                onSelect={() => openProject(project.project_id)}
              >
                <span className="min-w-0 flex-1 truncate">{projectHumanName(project)}</span>
                {selected ? <Check aria-hidden="true" size={14} className="shrink-0 text-cyan-200" /> : null}
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator className="my-1 bg-white/10" />
        <DropdownMenuItem
          data-testid="dashboard-project-new"
          className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-100 outline-none focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10"
          onSelect={() => onNewProject?.()}
        >
          Nuevo proyecto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
