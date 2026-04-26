import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  Plus,
  Clock,
  Trash,
  MagnifyingGlass
} from '@phosphor-icons/react';
import axios from 'axios';
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

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
  blueprint_generated: { label: 'Blueprint', color: 'bg-[#0F5257]/30 text-[#0F5257]' }
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRoute, setFilterRoute] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
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

  const handleDelete = async (projectId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('¿Estás seguro de eliminar este proyecto?')) return;

    try {
      await axios.delete(`${API_URL}/api/projects/${projectId}`, {
        withCredentials: true
      });
      setProjects((prev) => prev.filter((project) => project.project_id !== projectId));
      toast.success('Proyecto eliminado');
    } catch (error) {
      toast.error('Error al eliminar proyecto');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects.filter((project) => {
      const inputContent = (project.input_content || '').toLowerCase();
      const matchesSearch = inputContent.includes(normalizedSearch);
      const matchesRoute = filterRoute === 'all' || project.route === filterRoute;
      return matchesSearch && matchesRoute;
    });
  }, [projects, search, filterRoute]);

  return (
    <DashboardLayout title="Proyectos">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
              <MagnifyingGlass size={18} className="text-[#A3A3A3]" />
            </span>
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-premium pl-14 pr-4"
              data-testid="search-input"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterRoute}
              onChange={(e) => setFilterRoute(e.target.value)}
              className="input-premium py-2 min-w-[210px]"
              data-testid="filter-route"
            >
              <option value="all">Todas las rutas</option>
              <option value="improve_existing">Mejorar existente</option>
              <option value="sell_and_charge">Vender y cobrar</option>
              <option value="automate_operation">Automatizar</option>
              <option value="idea_to_project">Idea a proyecto</option>
            </select>

            <Link
              to="/flow"
              className="btn-primary flex items-center gap-2"
              data-testid="new-project-btn"
            >
              <Plus size={18} />
              Nuevo
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="spinner"></div>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="space-y-4">
            {filteredProjects.map((project, index) => {
              const inputContent = project.input_content || 'Proyecto sin contenido';

              return (
                <motion.div
                  key={project.project_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/dashboard/project/${project.project_id}`}
                    className="card block hover:border-[#0F5257]/50 group"
                    data-testid={`project-${project.project_id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium mb-2">
                          {inputContent.substring(0, 100)}
                          {inputContent.length > 100 ? '...' : ''}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="text-[#0F5257] bg-[#0F5257]/10 px-2 py-1 rounded">
                            {ROUTE_NAMES[project.route] || 'Sin clasificar'}
                          </span>

                          <span className="flex items-center gap-1 text-[#A3A3A3]">
                            <Clock size={14} />
                            {formatDate(project.created_at)}
                          </span>

                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              STATUS_BADGES[project.status]?.color || STATUS_BADGES.pending.color
                            }`}
                          >
                            {STATUS_BADGES[project.status]?.label || 'Pendiente'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDelete(project.project_id, e)}
                        className="p-2 text-[#A3A3A3] hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        data-testid={`delete-${project.project_id}`}
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-16">
            <FolderOpen size={64} className="text-[#A3A3A3] mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">No hay proyectos</h3>
            <p className="text-[#A3A3A3] mb-6">
              {search || filterRoute !== 'all'
                ? 'No se encontraron proyectos con esos filtros'
                : 'Empieza creando tu primer proyecto'}
            </p>
            <Link to="/flow" className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} />
              Crear proyecto
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectsPage;