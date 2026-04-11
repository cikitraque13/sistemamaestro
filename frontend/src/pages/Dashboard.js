import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FolderOpen, 
  Lightning, 
  TrendUp, 
  Plus,
  ArrowRight,
  Clock
} from '@phosphor-icons/react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

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

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, projectsRes] = await Promise.all([
          axios.get(`${API_URL}/api/user/stats`, { withCredentials: true }),
          axios.get(`${API_URL}/api/projects`, { withCredentials: true })
        ]);
        setStats(statsRes.data);
        setRecentProjects(projectsRes.data.slice(0, 5));
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <DashboardLayout title="Resumen">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-light text-white mb-2" data-testid="welcome-title">
            Hola, {user?.name?.split(' ')[0] || 'Usuario'}
          </h2>
          <p className="text-[#A3A3A3]">
            {recentProjects.length > 0 
              ? 'Aquí tienes un resumen de tu actividad reciente.'
              : 'Empieza creando tu primer proyecto.'}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
            data-testid="stat-projects"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#0F5257]/20 rounded-lg">
                <FolderOpen size={24} className="text-[#0F5257]" />
              </div>
              <div>
                <p className="text-[#A3A3A3] text-sm">Proyectos</p>
                <p className="text-2xl font-light text-white">
                  {loading ? '-' : stats?.total_projects || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
            data-testid="stat-blueprints"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Lightning size={24} className="text-blue-400" />
              </div>
              <div>
                <p className="text-[#A3A3A3] text-sm">Blueprints</p>
                <p className="text-2xl font-light text-white">
                  {loading ? '-' : stats?.blueprints_generated || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
            data-testid="stat-plan"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <TrendUp size={24} className="text-purple-400" />
              </div>
              <div>
                <p className="text-[#A3A3A3] text-sm">Plan actual</p>
                <p className="text-2xl font-light text-white capitalize">
                  {user?.plan || 'Gratis'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h3 className="text-lg font-medium text-white mb-4">Acciones rápidas</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/flow"
              className="card group flex items-center gap-4 hover:border-[#0F5257]/50"
              data-testid="quick-new-project"
            >
              <div className="p-3 bg-[#0F5257]/20 rounded-lg group-hover:bg-[#0F5257]/30 transition-colors">
                <Plus size={20} className="text-[#0F5257]" />
              </div>
              <span className="text-white">Nuevo proyecto</span>
            </Link>

            <Link
              to="/dashboard/projects"
              className="card group flex items-center gap-4 hover:border-[#0F5257]/50"
              data-testid="quick-projects"
            >
              <div className="p-3 bg-[#262626] rounded-lg group-hover:bg-[#363636] transition-colors">
                <FolderOpen size={20} className="text-[#A3A3A3]" />
              </div>
              <span className="text-white">Ver proyectos</span>
            </Link>

            <Link
              to="/dashboard/opportunities"
              className="card group flex items-center gap-4 hover:border-[#0F5257]/50"
              data-testid="quick-opportunities"
            >
              <div className="p-3 bg-[#262626] rounded-lg group-hover:bg-[#363636] transition-colors">
                <Lightning size={20} className="text-[#A3A3A3]" />
              </div>
              <span className="text-white">Oportunidades</span>
            </Link>

            <Link
              to="/dashboard/billing"
              className="card group flex items-center gap-4 hover:border-[#0F5257]/50"
              data-testid="quick-billing"
            >
              <div className="p-3 bg-[#262626] rounded-lg group-hover:bg-[#363636] transition-colors">
                <TrendUp size={20} className="text-[#A3A3A3]" />
              </div>
              <span className="text-white">Mejorar plan</span>
            </Link>
          </div>
        </motion.div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Proyectos recientes</h3>
            {recentProjects.length > 0 && (
              <Link to="/dashboard/projects" className="text-[#0F5257] hover:text-[#136970] text-sm flex items-center gap-1">
                Ver todos <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.project_id}
                  to={`/dashboard/project/${project.project_id}`}
                  className="card block hover:border-[#0F5257]/50"
                  data-testid={`project-${project.project_id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate mb-1">
                        {project.input_content.substring(0, 60)}
                        {project.input_content.length > 60 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-[#A3A3A3]">
                          {ROUTE_NAMES[project.route] || 'Sin clasificar'}
                        </span>
                        <span className="flex items-center gap-1 text-[#A3A3A3]">
                          <Clock size={14} />
                          {formatDate(project.created_at)}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${STATUS_BADGES[project.status]?.color || STATUS_BADGES.pending.color}`}>
                      {STATUS_BADGES[project.status]?.label || 'Pendiente'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <FolderOpen size={48} className="text-[#A3A3A3] mx-auto mb-4" />
              <p className="text-[#A3A3A3] mb-4">No tienes proyectos todavía</p>
              <Link to="/flow" className="btn-primary inline-flex items-center gap-2">
                <Plus size={18} />
                Crear primer proyecto
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
