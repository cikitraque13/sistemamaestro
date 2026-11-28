import React, { useEffect, useState } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';

import { api } from '../../../lib/apiClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { projectHumanName, toSelectableProject } from '../workspace/projectLabel';

const PAGE_LIMIT = 200;
const MAX_PAGES = 25;

function nextCursor(headers) {
  if (!headers) return '';
  const value = typeof headers.get === 'function'
    ? headers.get('x-next-cursor')
    : headers['x-next-cursor'];
  return typeof value === 'string' ? value.trim() : '';
}

export async function loadOwnerProjects(get = api.get.bind(api)) {
  const collected = [];
  const seen = new Set();
  let cursor = '';

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = { limit: PAGE_LIMIT };
    if (cursor) params.cursor = cursor;
    const response = await get('/projects', { params });
    const data = Array.isArray(response?.data) ? response.data : [];
    data.forEach((item) => {
      const project = toSelectableProject(item);
      if (!project || seen.has(project.project_id)) return;
      seen.add(project.project_id);
      collected.push(project);
    });
    const next = nextCursor(response?.headers);
    if (!next || next === cursor || data.length === 0) break;
    cursor = next;
  }

  return collected;
}

function mergeProjects(loaded, fallback, activeProjectId) {
  const fallbackById = new Map();
  fallback.forEach((project) => {
    if (project?.project_id) fallbackById.set(project.project_id, project);
  });
  if (!loaded.length) return [...fallbackById.values()];

  const items = loaded.map((project) => {
    const previous = fallbackById.get(project.project_id);
    if (previous?.title && !project.title) return { ...project, title: previous.title };
    return project;
  });
  if (activeProjectId && !items.some((project) => project.project_id === activeProjectId)) {
    const current = fallbackById.get(activeProjectId);
    if (current) items.unshift(current);
  }
  return items;
}

export default function BuilderProjectSelect({
  projectItems = [],
  activeProjectId = '',
  onProjectChange = () => {},
}) {
  const fallback = projectItems.map(toSelectableProject).filter(Boolean);
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    let live = true;
    loadOwnerProjects()
      .then((projects) => {
        if (live) setLoaded(projects);
      })
      .catch(() => {
        if (live) setLoaded([]);
      });
    return () => {
      live = false;
    };
  }, []);

  const projects = mergeProjects(loaded || [], fallback, activeProjectId);
  const active = projects.find((project) => project.project_id === activeProjectId) || null;
  const label = active ? projectHumanName(active) : (projects[0] ? projectHumanName(projects[0]) : 'Proyecto');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="builder-project-select"
        aria-label="Seleccionar proyecto"
        className="inline-flex h-11 min-w-0 max-w-[16rem] items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 text-left text-sm font-medium text-white outline-none transition hover:border-white/20 hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-cyan-300/70"
      >
        <span className="min-w-0 truncate">{label}</span>
        <CaretDown aria-hidden="true" size={14} className="shrink-0 text-zinc-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        aria-label="Proyectos"
        data-testid="builder-project-options"
        className="w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-white/10 bg-[#0c1016] p-2 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
      >
        {projects.length === 0 ? (
          <p className="px-3 py-2 text-sm text-zinc-400">Sin proyectos</p>
        ) : projects.map((project) => {
          const selected = project.project_id === activeProjectId;
          return (
            <DropdownMenuItem
              key={project.project_id}
              data-testid={`builder-project-option-${project.project_id}`}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-100 outline-none focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10"
              onSelect={() => onProjectChange(project.project_id)}
            >
              <span className="min-w-0 flex-1 truncate">{projectHumanName(project)}</span>
              {selected ? <Check aria-hidden="true" size={14} className="shrink-0 text-cyan-200" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
