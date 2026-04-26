import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';

import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

import DashboardBuilderLauncher from './components/DashboardBuilderLauncher';
import DashboardWelcomePanel from './components/DashboardWelcomePanel';
import DashboardStatusPanel from './components/DashboardStatusPanel';
import DashboardCreditsPanel from './components/DashboardCreditsPanel';
import DashboardQuickActions from './widgets/DashboardQuickActions';

const API_URL = (process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000')
  .trim()
  .replace(/\/$/, '');

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

const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [billingSummary, setBillingSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const shouldFocusLauncher = location.state?.focus === 'builder-launcher';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, projectsRes, billingRes] = await Promise.allSettled([
          axios.get(`${API_URL}/api/user/stats`, { withCredentials: true }),
          axios.get(`${API_URL}/api/projects`, { withCredentials: true }),
          axios.get(`${API_URL}/api/user/billing`, { withCredentials: true })
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        }

        if (projectsRes.status === 'fulfilled') {
          const projects = Array.isArray(projectsRes.value.data) ? projectsRes.value.data : [];
          setRecentProjects(projects.slice(0, 5));
        }

        if (billingRes.status === 'fulfilled') {
          setBillingSummary(billingRes.value.data?.credit_summary || billingRes.value.data || null);
        }
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
    <DashboardLayout title="Resumen premium">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          id="builder-launcher"
          initial={{ opacity: 0, y: shouldFocusLauncher ? 10 : 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <DashboardBuilderLauncher user={user} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <DashboardWelcomePanel
            user={user}
            recentProjectsCount={recentProjects.length}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DashboardStatusPanel
            loading={loading}
            stats={stats}
            user={user}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <DashboardCreditsPanel
            billingSummary={billingSummary}
            loading={loading}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DashboardQuickActions />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Proyectos recientes
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-white">
                Continúa donde lo dejaste
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-[24px] border border-white/8 bg-white/[0.02] py-20">
              <div className="spinner"></div>
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link
                  key={project.project_id}
                  to={`/dashboard/project/${project.project_id}`}
                  className="block rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-white/15 hover:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="mb-2 font-medium text-white">
                        {(project.input_content || 'Proyecto sin contenido').substring(0, 90)}
                        {(project.input_content || '').length > 90 ? '...' : ''}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1.5 text-cyan-200">
                          {ROUTE_NAMES[project.route] || 'Sin clasificar'}
                        </span>

                        <span className="text-zinc-400">
                          {formatDate(project.created_at)}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs ${
                            STATUS_BADGES[project.status]?.color || STATUS_BADGES.pending.color
                          }`}
                        >
                          {STATUS_BADGES[project.status]?.label || 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <h3 className="text-xl font-semibold text-white">No tienes proyectos todavía</h3>
              <p className="mt-3 text-zinc-400">
                Empieza con una idea o una URL y activa el sistema desde una base clara.
              </p>
              <Link
                to="/dashboard"
                state={{ focus: 'builder-launcher' }}
                className="mt-5 inline-flex items-center justify-center rounded-2xl border border-amber-200/20 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_26px_rgba(245,158,11,0.16)] transition hover:scale-[1.01]"
              >
                Abrir Builder Launcher
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;