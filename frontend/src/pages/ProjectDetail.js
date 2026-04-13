import React, { useEffect, useMemo, useState } from 'react';
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

const API_BASE = '/api';

const ROUTE_NAMES = {
  improve: 'Mejorar algo existente',
  sell: 'Vender y cobrar',
  automate: 'Automatizar operación',
  idea: 'Idea a proyecto',

  // Compatibilidad legado
  improve_existing: 'Mejorar algo existente',
  sell_and_charge: 'Vender y cobrar',
  automate_operation: 'Automatizar operación',
  idea_to_project: 'Idea a proyecto'
};

const PLAN_VISUALS = {
  blueprint: {
    label: '29',
    name: 'Blueprint',
    badgeClass: 'bg-[#0F5257]/20 text-[#0F5257]',
    borderClass: 'border-[#0F5257]/30',
    boxClass: 'bg-[#0F5257]/10'
  },
  sistema: {
    label: '79',
    name: 'Sistema',
    badgeClass: 'bg-amber-500/20 text-amber-300',
    borderClass: 'border-amber-500/30',
    boxClass: 'bg-amber-500/10'
  },
  premium: {
    label: '199',
    name: 'Premium',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300',
    borderClass: 'border-fuchsia-500/30',
    boxClass: 'bg-fuchsia-500/10'
  }
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
      const response = await axios.get(`${API_BASE}/projects/${id}`, {
        withCredentials: true
      });
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
        `${API_BASE}/projects/${id}/blueprint`,
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

  const normalizedDiagnosis = useMemo(() => {
    const diagnosis = project?.diagnosis;
    if (!diagnosis) return null;

    const strengths = Array.isArray(diagnosis.strengths) ? diagnosis.strengths : [];
    const weaknesses = Array.isArray(diagnosis.weaknesses) ? diagnosis.weaknesses : [];
    const quickWins = Array.isArray(diagnosis.quick_wins) ? diagnosis.quick_wins : [];

    const understanding =
      diagnosis.understanding ||
      diagnosis.summary ||
      'Diagnóstico generado correctamente, pendiente de ampliar visualización.';

    const mainFinding =
      diagnosis.main_finding ||
      weaknesses[0] ||
      strengths[0] ||
      diagnosis.summary ||
      'Sin hallazgo principal disponible.';

    const opportunity =
      diagnosis.opportunity ||
      quickWins[0] ||
      'Sin oportunidad priorizada disponible.';

    return {
      understanding,
      mainFinding,
      opportunity,
      strengths,
      weaknesses,
      quickWins
    };
  }, [project]);

  const normalizedPlanRecommendation = useMemo(() => {
    const rec = project?.plan_recommendation;
    if (!rec) return null;

    const planId = rec.recommended_plan_id;
    const visual = PLAN_VISUALS[planId] || PLAN_VISUALS.blueprint;

    return {
      planId,
      planName: rec.recommended_plan_name || visual.name,
      planPrice: rec.recommended_plan_price,
      planLabel: visual.label,
      badgeClass: visual.badgeClass,
      borderClass: visual.borderClass,
      boxClass: visual.boxClass,
      scoreTotal: rec.score_total,
      scores: rec.scores || {},
      reason: rec.reason,
      whyNotLower: rec.why_not_lower,
      unlocks: rec.unlocks,
      ctaLabel: rec.cta_label || 'Ver plan recomendado'
    };
  }, [project]);

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
        <Link
          to="/dashboard/projects"
          className="inline-flex items-center gap-2 text-[#A3A3A3] hover:text-white mb-6 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft size={18} />
          Volver a proyectos
        </Link>

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
              <p className="text-white mt-1 break-words">{project.input_content}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[#A3A3A3]">
            <span className="flex items-center gap-1">
              <Clock size={16} />
              {formatDate(project.created_at)}
            </span>
            <span className="px-3 py-1 bg-[#0F5257]/20 text-[#0F5257] rounded-full">
              {ROUTE_NAMES[project.route] || project.route || 'Sin clasificar'}
            </span>
          </div>
        </motion.div>

        {normalizedDiagnosis && (
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
                <p className="text-white">{normalizedDiagnosis.understanding}</p>
              </div>

              <div>
                <p className="text-sm text-[#A3A3A3] mb-1">Hallazgo principal</p>
                <p className="text-white font-medium">{normalizedDiagnosis.mainFinding}</p>
              </div>

              <div>
                <p className="text-sm text-[#A3A3A3] mb-1">Oportunidad</p>
                <p className="text-white">{normalizedDiagnosis.opportunity}</p>
              </div>
            </div>

            {(normalizedDiagnosis.strengths.length > 0 ||
              normalizedDiagnosis.weaknesses.length > 0 ||
              normalizedDiagnosis.quickWins.length > 0) && (
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-[#0A0A0A] rounded-lg p-4">
                  <p className="text-sm text-[#A3A3A3] mb-3">Fortalezas</p>
                  {normalizedDiagnosis.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {normalizedDiagnosis.strengths.map((item, index) => (
                        <li
                          key={`strength-${index}-${item.substring(0, 20)}`}
                          className="text-white text-sm flex items-start gap-2"
                        >
                          <CheckCircle size={14} className="text-[#0F5257] mt-1 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#A3A3A3] text-sm">Sin datos.</p>
                  )}
                </div>

                <div className="bg-[#0A0A0A] rounded-lg p-4">
                  <p className="text-sm text-[#A3A3A3] mb-3">Debilidades</p>
                  {normalizedDiagnosis.weaknesses.length > 0 ? (
                    <ul className="space-y-2">
                      {normalizedDiagnosis.weaknesses.map((item, index) => (
                        <li
                          key={`weakness-${index}-${item.substring(0, 20)}`}
                          className="text-white text-sm flex items-start gap-2"
                        >
                          <CheckCircle size={14} className="text-[#0F5257] mt-1 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#A3A3A3] text-sm">Sin datos.</p>
                  )}
                </div>

                <div className="bg-[#0A0A0A] rounded-lg p-4">
                  <p className="text-sm text-[#A3A3A3] mb-3">Quick wins</p>
                  {normalizedDiagnosis.quickWins.length > 0 ? (
                    <ul className="space-y-2">
                      {normalizedDiagnosis.quickWins.map((item, index) => (
                        <li
                          key={`quickwin-${index}-${item.substring(0, 20)}`}
                          className="text-white text-sm flex items-start gap-2"
                        >
                          <CheckCircle size={14} className="text-[#0F5257] mt-1 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#A3A3A3] text-sm">Sin datos.</p>
                  )}
                </div>
              </div>
            )}

            {project.next_step && (
              <div className="mt-6 p-4 bg-[#0F5257]/10 border border-[#0F5257]/30 rounded-lg">
                <p className="text-sm text-[#0F5257] mb-1">Siguiente paso recomendado</p>
                <p className="text-white">{project.next_step}</p>
              </div>
            )}
          </motion.div>
        )}

        {normalizedPlanRecommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`card mb-6 border ${normalizedPlanRecommendation.borderClass}`}
            data-testid="plan-recommendation-section"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Nivel recomendado
                </h3>
                <p className="text-[#A3A3A3]">
                  Recomendación automática según complejidad, impacto y necesidad real de estructura.
                </p>
              </div>

              <div className={`px-4 py-2 rounded-full text-sm font-medium ${normalizedPlanRecommendation.badgeClass}`}>
                Plan {normalizedPlanRecommendation.planLabel} · {normalizedPlanRecommendation.planName}
              </div>
            </div>

            <div className={`rounded-xl p-4 mb-5 border ${normalizedPlanRecommendation.borderClass} ${normalizedPlanRecommendation.boxClass}`}>
              <p className="text-sm text-[#A3A3A3] mb-1">Motivo</p>
              <p className="text-white">{normalizedPlanRecommendation.reason}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <div className="bg-[#0A0A0A] rounded-xl p-4">
                <p className="text-sm text-[#A3A3A3] mb-2">Por qué no basta el nivel inferior</p>
                <p className="text-white">{normalizedPlanRecommendation.whyNotLower}</p>
              </div>

              <div className="bg-[#0A0A0A] rounded-xl p-4">
                <p className="text-sm text-[#A3A3A3] mb-2">Qué desbloquea</p>
                <p className="text-white">{normalizedPlanRecommendation.unlocks}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-5 gap-3 mb-6">
              <div className="bg-[#0A0A0A] rounded-lg p-3">
                <p className="text-xs text-[#A3A3A3] mb-1">Complejidad</p>
                <p className="text-white font-medium">{normalizedPlanRecommendation.scores.complexity ?? 0}/4</p>
              </div>
              <div className="bg-[#0A0A0A] rounded-lg p-3">
                <p className="text-xs text-[#A3A3A3] mb-1">Impacto</p>
                <p className="text-white font-medium">{normalizedPlanRecommendation.scores.economic_impact ?? 0}/4</p>
              </div>
              <div className="bg-[#0A0A0A] rounded-lg p-3">
                <p className="text-xs text-[#A3A3A3] mb-1">Urgencia</p>
                <p className="text-white font-medium">{normalizedPlanRecommendation.scores.urgency ?? 0}/4</p>
              </div>
              <div className="bg-[#0A0A0A] rounded-lg p-3">
                <p className="text-xs text-[#A3A3A3] mb-1">Estructura</p>
                <p className="text-white font-medium">{normalizedPlanRecommendation.scores.structure_need ?? 0}/4</p>
              </div>
              <div className="bg-[#0A0A0A] rounded-lg p-3">
                <p className="text-xs text-[#A3A3A3] mb-1">Continuidad</p>
                <p className="text-white font-medium">{normalizedPlanRecommendation.scores.continuity_need ?? 0}/4</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#A3A3A3]">Score total</p>
                <p className="text-white text-xl font-medium">
                  {normalizedPlanRecommendation.scoreTotal}/20
                </p>
              </div>

              <Link
                to="/dashboard/billing"
                state={{
                  suggestedPlan: normalizedPlanRecommendation.planId,
                  fromProjectId: project.project_id
                }}
                className="btn-primary inline-flex items-center gap-2"
              >
                {normalizedPlanRecommendation.ctaLabel}
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}

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
                      <li
                        key={`priority-${index}-${priority.substring(0, 20)}`}
                        className="flex items-start gap-2 text-white"
                      >
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
                      <li
                        key={`deploy-${index}-${step.substring(0, 20)}`}
                        className="flex items-start gap-3 text-white"
                      >
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
