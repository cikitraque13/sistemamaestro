import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Lightning,
  CheckCircle,
  Lock,
  ArrowRight,
  Clock,
  Globe,
  TextAlignLeft
} from '@phosphor-icons/react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ROUTE_NAMES = {
  improve_existing: 'Mejorar algo existente',
  sell_and_charge: 'Vender y cobrar',
  automate_operation: 'Automatizar operación',
  idea_to_project: 'Idea a proyecto'
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects/${id}`, { withCredentials: true });
      setProject(response.data);
    } catch (error) {
      toast.error('Proyecto no encontrado');
      navigate('/dashboard/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBlueprint = async () => {
    if (user?.plan === 'free') {
      toast.error('Necesitas el plan Blueprint o superior');
      navigate('/dashboard/billing');
      return;
    }

    setGeneratingBlueprint(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/projects/${id}/blueprint`,
        {},
        { withCredentials: true }
      );
      setProject(response.data);
      toast.success('Blueprint generado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al generar blueprint');
    } finally {
      setGeneratingBlueprint(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Proyecto">
        <div className="flex items-center justify-center py-24">
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) return null;

  return (
    <DashboardLayout title="Detalle del proyecto">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/dashboard/projects"
          className="inline-flex items-center gap-2 text-[#A3A3A3] hover:text-white mb-6 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft size={18} />
          Volver a proyectos
        </Link>

        {/* Project Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
          data-testid="project-header"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-[#0F5257]/20 rounded-lg">
              {project.input_type === 'url' ? (
                <Globe size={24} className="text-[#0F5257]" />
              ) : (
                <TextAlignLeft size={24} className="text-[#0F5257]" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-xs text-[#0F5257] font-medium uppercase tracking-wider">
                {project.input_type === 'url' ? 'Análisis de URL' : 'Descripción'}
              </span>
              <p className="text-white mt-1">{project.input_content}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#A3A3A3]">
            <span className="flex items-center gap-1">
              <Clock size={16} />
              {formatDate(project.created_at)}
            </span>
            <span className="px-3 py-1 bg-[#0F5257]/20 text-[#0F5257] rounded-full">
              {ROUTE_NAMES[project.route] || 'Sin clasificar'}
            </span>
          </div>
        </motion.div>

        {/* Diagnosis */}
        {project.diagnosis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card mb-6"
            data-testid="diagnosis-section"
          >
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Lightning weight="fill" className="text-[#0F5257]" />
              Diagnóstico
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#A3A3A3] mb-1">Comprensión</p>
                <p className="text-white">{project.diagnosis.understanding}</p>
              </div>
              <div>
                <p className="text-sm text-[#A3A3A3] mb-1">Hallazgo principal</p>
                <p className="text-white font-medium">{project.diagnosis.main_finding}</p>
              </div>
              <div>
                <p className="text-sm text-[#A3A3A3] mb-1">Oportunidad</p>
                <p className="text-white">{project.diagnosis.opportunity}</p>
              </div>
            </div>

            {project.next_step && (
              <div className="mt-6 p-4 bg-[#0F5257]/10 border border-[#0F5257]/30 rounded-lg">
                <p className="text-sm text-[#0F5257] mb-1">Siguiente paso recomendado</p>
                <p className="text-white">{project.next_step}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Refine Questions & Answers */}
        {project.refine_questions && project.refine_questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card mb-6"
            data-testid="refine-section"
          >
            <h3 className="text-lg font-medium text-white mb-4">Preguntas de afinado</h3>
            <div className="space-y-4">
              {project.refine_questions.map((q, index) => (
                <div key={q.id || index}>
                  <p className="text-[#A3A3A3] text-sm mb-1">{q.question}</p>
                  {project.refine_answers?.[q.id] ? (
                    <p className="text-white">{project.refine_answers[q.id]}</p>
                  ) : (
                    <p className="text-[#A3A3A3] italic">Sin responder</p>
                  )}
                </div>
              ))}
            </div>
            {!project.refine_answers && (
              <Link
                to={`/flow?project=${id}&step=refine`}
                className="btn-primary inline-flex items-center gap-2 mt-4"
              >
                Responder preguntas
                <ArrowRight size={16} />
              </Link>
            )}
          </motion.div>
        )}

        {/* Blueprint */}
        {project.blueprint ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
            data-testid="blueprint-section"
          >
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <CheckCircle weight="fill" className="text-[#0F5257]" />
              Blueprint
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="text-xl text-white mb-2">{project.blueprint.title}</h4>
                <p className="text-[#A3A3A3]">{project.blueprint.summary}</p>
              </div>

              {project.blueprint.priorities && (
                <div>
                  <p className="text-sm text-[#A3A3A3] mb-2">Prioridades</p>
                  <ul className="space-y-2">
                    {project.blueprint.priorities.map((priority, index) => (
                      <li key={`priority-${index}-${priority.substring(0, 20)}`} className="flex items-start gap-2 text-white">
                        <span className="text-[#0F5257] font-medium">{index + 1}.</span>
                        {priority}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {project.blueprint.architecture && (
                <div>
                  <p className="text-sm text-[#A3A3A3] mb-2">Arquitectura recomendada</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {project.blueprint.architecture.components && (
                      <div className="bg-[#0A0A0A] rounded-lg p-4">
                        <p className="text-xs text-[#A3A3A3] mb-2">Componentes</p>
                        <ul className="space-y-1">
                          {project.blueprint.architecture.components.map((comp) => (
                            <li key={comp} className="text-white text-sm flex items-center gap-2">
                              <CheckCircle size={14} className="text-[#0F5257]" />
                              {comp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {project.blueprint.architecture.tech_stack && (
                      <div className="bg-[#0A0A0A] rounded-lg p-4">
                        <p className="text-xs text-[#A3A3A3] mb-2">Tech Stack</p>
                        <ul className="space-y-1">
                          {project.blueprint.architecture.tech_stack.map((tech) => (
                            <li key={tech} className="text-white text-sm flex items-center gap-2">
                              <CheckCircle size={14} className="text-[#0F5257]" />
                              {tech}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {project.blueprint.monetization && (
                <div>
                  <p className="text-sm text-[#A3A3A3] mb-2">Monetización</p>
                  <p className="text-white">{project.blueprint.monetization}</p>
                </div>
              )}

              {project.blueprint.deployment_steps && (
                <div>
                  <p className="text-sm text-[#A3A3A3] mb-2">Plan de despliegue</p>
                  <ol className="space-y-2">
                    {project.blueprint.deployment_steps.map((step, index) => (
                      <li key={`deploy-${index}-${step.substring(0, 20)}`} className="flex items-start gap-3 text-white">
                        <span className="w-6 h-6 rounded-full bg-[#0F5257]/20 text-[#0F5257] text-sm flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {project.blueprint.timeline_estimate && (
                <div className="p-4 bg-[#0F5257]/10 border border-[#0F5257]/30 rounded-lg">
                  <p className="text-sm text-[#0F5257] mb-1">Tiempo estimado</p>
                  <p className="text-white font-medium">{project.blueprint.timeline_estimate}</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card text-center py-8"
            data-testid="blueprint-locked"
          >
            <Lock size={48} className="text-[#A3A3A3] mx-auto mb-4" />
            <h3 className="text-lg text-white mb-2">Blueprint bloqueado</h3>
            <p className="text-[#A3A3A3] mb-6 max-w-md mx-auto">
              {user?.plan === 'free' 
                ? 'Actualiza al plan Blueprint o superior para desbloquear la estructura completa de tu proyecto.'
                : 'Genera el blueprint completo con prioridades, arquitectura y plan de despliegue.'}
            </p>
            {user?.plan === 'free' ? (
              <Link to="/dashboard/billing" className="btn-primary inline-flex items-center gap-2">
                Mejorar plan
                <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                onClick={handleGenerateBlueprint}
                disabled={generatingBlueprint}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
              >
                {generatingBlueprint ? (
                  <>
                    <div className="spinner w-4 h-4"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    Generar Blueprint
                    <Lightning size={16} />
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetail;
