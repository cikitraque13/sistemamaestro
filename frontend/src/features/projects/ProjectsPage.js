import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  FileText,
  FolderOpen,
  Plus,
  Trash,
  MagnifyingGlass
} from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

import DashboardLayout from '../../components/DashboardLayout';

const API_URL = (process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000')
  .trim()
  .replace(/\/$/, '');

const BUILDER_LAUNCHER_STATE = {
  focus: 'builder-launcher',
  source: 'projects-page-new-project'
};

const ROUTE_NAMES = {
  improve_existing: 'Mejorar existente',
  sell_and_charge: 'Vender y cobrar',
  automate_operation: 'Automatizar',
  idea_to_project: 'Idea a proyecto'
};

const STATUS_BADGES = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400' },
  analyzed: { label: 'Analizado', color: 'bg-blue-500/20 text-blue-400' },
  refined: { label: 'Afinado', color: 'bg-purple-500/20 text-purple-400' },
  blueprint_generated: { label: 'Blueprint', color: 'bg-[#0F5257]/30 text-[#6ee7d8]' }
};

const getProjectTitle = (project) => {
  const inputContent = String(project?.input_content || '').trim();

  if (!inputContent) return 'Proyecto sin contenido';
  if (inputContent.length <= 92) return inputContent;

  return `${inputContent.slice(0, 92)}...`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Sin fecha';

  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Sin fecha';
  }
};

const buildBuilderUrl = (projectId) =>
  `/dashboard/builder?project_id=${encodeURIComponent(projectId)}`;

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRoute, setFilterRoute] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);

    try {
      const response = await axios.get(`${API_URL}/api/projects`, {
        withCredentials: true
      });

      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId, event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!window.confirm('¿Seguro que quieres eliminar este proyecto?')) return;

    try {
      await axios.delete(`${API_URL}/api/projects/${projectId}`, {
        withCredentials: true
      });

      setProjects((prev) =>
        prev.filter((project) => project.project_id !== projectId)
      );

      toast.success('Proyecto eliminado');
    } catch (error) {
      toast.error('Error al eliminar proyecto');
    }
  };

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects.filter((project) => {
      const inputContent = String(project.input_content || '').toLowerCase();
      const route = project.route || '';

      const matchesSearch = inputContent.includes(normalizedSearch);
      const matchesRoute = filterRoute === 'all' || route === filterRoute;

      return matchesSearch && matchesRoute;
    });
  }, [projects, search, filterRoute]);

  return (
    <DashboardLayout title="Proyectos">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(15,82,87,0.22),transparent_28%),linear-gradient(180deg,#111111_0%,#080808_100%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                Continuidad de proyecto
              </p>

              <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white md:text-4xl">
                Vuelve al Builder, revisa tus informes y continúa donde lo dejaste.
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 md:text-base">
                Proyectos centraliza tus construcciones activas. La acción principal es
                continuar en Builder. El informe premium y la exportación PDF quedan como
                salidas secundarias cuando proceda.
              </p>
            </div>

            <Link
              to="/dashboard"
              state={BUILDER_LAUNCHER_STATE}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_26px_rgba(245,158,11,0.16)] transition hover:scale-[1.01]"
              data-testid="new-project-btn"
            >
              <Plus size={18} weight="bold" />
              Nuevo proyecto
            </Link>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
              <MagnifyingGlass size={18} className="text-[#A3A3A3]" />
            </span>

            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input-premium pl-14 pr-4"
              data-testid="search-input"
            />
          </div>

          <select
            value={filterRoute}
            onChange={(event) => setFilterRoute(event.target.value)}
            className="input-premium py-2 sm:min-w-[210px]"
            data-testid="filter-route"
          >
            <option value="all">Todas las rutas</option>
            <option value="improve_existing">Mejorar existente</option>
            <option value="sell_and_charge">Vender y cobrar</option>
            <option value="automate_operation">Automatizar</option>
            <option value="idea_to_project">Idea a proyecto</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-[28px] border border-white/8 bg-white/[0.02] py-24">
            <div className="spinner"></div>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="space-y-4">
            {filteredProjects.map((project, index) => {
              const projectId = project.project_id;
              const status =
                STATUS_BADGES[project.status] ||
                { label: project.status || 'Sin estado', color: 'bg-white/10 text-zinc-300' };

              const routeLabel =
                ROUTE_NAMES[project.route] || project.route || 'Sin clasificar';

              return (
                <motion.article
                  key={projectId}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="group rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-cyan-400/20 hover:bg-white/[0.03]"
                  data-testid={`project-${projectId}`}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>

                        <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-300">
                          {routeLabel}
                        </span>

                        <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400">
                          {formatDate(project.created_at)}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold leading-7 text-white">
                        {getProjectTitle(project)}
                      </h3>

                      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                        Continúa la construcción en Builder o abre la vista del informe
                        premium si quieres revisar la salida estratégica del proyecto.
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                      <Link
                        to={buildBuilderUrl(projectId)}
                        state={{
                          projectId,
                          source: 'projects-page-card'
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/35 hover:bg-cyan-400/15"
                      >
                        <FolderOpen size={17} />
                        Continuar en Builder
                        <ArrowRight size={14} />
                      </Link>

                      <Link
                        to={`/dashboard/project/${projectId}/report-preview`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.06]"
                      >
                        <FileText size={17} />
                        Ver informe
                      </Link>

                      <button
                        type="button"
                        onClick={(event) => handleDelete(projectId, event)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/10 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-200 transition hover:border-red-400/20 hover:bg-red-500/10"
                        data-testid={`delete-${projectId}`}
                      >
                        <Trash size={16} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[28px] border border-white/8 bg-white/[0.02] px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/8 bg-white/[0.03]">
              <FolderOpen size={28} className="text-zinc-400" />
            </div>

            <h3 className="text-2xl font-semibold text-white">
              No hay proyectos todavía
            </h3>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              Crea tu primer proyecto desde el launcher del Dashboard. Sistema Maestro
              abrirá Builder para construir la primera versión y guiar las siguientes mejoras.
            </p>

            <Link
              to="/dashboard"
              state={BUILDER_LAUNCHER_STATE}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_26px_rgba(245,158,11,0.16)] transition hover:scale-[1.01]"
            >
              <Plus size={18} weight="bold" />
              Crear proyecto
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectsPage;