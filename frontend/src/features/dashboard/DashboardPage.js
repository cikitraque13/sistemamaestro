import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  FileText,
  FolderOpen,
  Plus
} from '@phosphor-icons/react';

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

const BUILDER_LAUNCHER_STATE = {
  focus: 'builder-launcher',
  source: 'dashboard-page'
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

const buildBuilderUrl = (projectId) =>
  `/dashboard/builder?project_id=${encodeURIComponent(projectId)}`;

const getProjectTitle = (project) => {
  const inputContent = String(project?.input_content || '').trim();

  if (!inputContent) return 'Proyecto sin contenido';
  if (inputContent.length <= 96) return inputContent;

  return `${inputContent.slice(0, 96)}...`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Sin fecha';

  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  } catch {
    return 'Sin fecha';
  }
};

const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const launcherRef = useRef(null);

  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [billingSummary, setBillingSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const shouldFocusLauncher = location.state?.focus === 'builder-launcher';

  useEffect(() => {
    if (!shouldFocusLauncher) return;

    const timer = window.setTimeout(() => {
      launcherRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [shouldFocusLauncher, location.key]);

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
          const projects = Array.isArray(projectsRes.value.data)
            ? projectsRes.value.data
            : [];

          setRecentProjects(projects.slice(0, 5));
        }

        if (billingRes.status === 'fulfilled') {
          setBillingSummary(
            billingRes.value.data?.credit_summary || billingRes.value.data || null
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardLayout title="Resumen premium">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          id="builder-launcher"
          ref={launcherRef}
          tabIndex={-1}
          initial={{ opacity: 0, y: shouldFocusLauncher ? 10 : 18 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: shouldFocusLauncher ? [1, 1.008, 1] : 1
          }}
          transition={{ duration: 0.35 }}
          className="scroll-mt-32 outline-none"
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

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Proyectos recientes
              </p>

              <h3 className="mt-1 text-2xl font-semibold text-white">
                Continúa construyendo
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Vuelve al Builder como acción principal. El informe queda disponible como
                salida premium cuando quieras revisar o exportar el caso.
              </p>
            </div>

            <Link
              to="/dashboard"
              state={BUILDER_LAUNCHER_STATE}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_26px_rgba(245,158,11,0.16)] transition hover:scale-[1.01]"
            >
              <Plus size={16} weight="bold" />
              Nuevo proyecto
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-[24px] border border-white/8 bg-white/[0.02] py-20">
              <div className="spinner"></div>
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="space-y-4">
              {recentProjects.map((project) => {
                const projectId = project.project_id;
                const status =
                  STATUS_BADGES[project.status] ||
                  STATUS_BADGES.pending;

                return (
                  <article
                    key={projectId}
                    className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-cyan-400/20 hover:bg-white/[0.03]"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="mb-3 text-lg font-semibold leading-7 text-white">
                          {getProjectTitle(project)}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="rounded-full bg-cyan-500/10 px-3 py-1.5 text-cyan-200">
                            {ROUTE_NAMES[project.route] || 'Sin clasificar'}
                          </span>

                          <span className="text-zinc-400">
                            {formatDate(project.created_at)}
                          </span>

                          <span className={`rounded-full px-3 py-1.5 text-xs ${status.color}`}>
                            {status.label}
                          </span>
                        </div>

                        <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
                          Continúa la construcción en Builder para mantener el estado vivo,
                          la preview, el código y las siguientes mejoras del proyecto.
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                        <Link
                          to={buildBuilderUrl(projectId)}
                          state={{
                            projectId,
                            source: 'dashboard-recent-project'
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
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <h3 className="text-xl font-semibold text-white">
                No tienes proyectos todavía
              </h3>

              <p className="mt-3 text-zinc-400">
                Empieza con una idea o una URL y activa el sistema desde una base clara.
              </p>

              <Link
                to="/dashboard"
                state={BUILDER_LAUNCHER_STATE}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_26px_rgba(245,158,11,0.16)] transition hover:scale-[1.01]"
              >
                <Plus size={16} weight="bold" />
                Abrir launcher
              </Link>
            </div>
          )}
        </motion.section>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;