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
  TextAlignLeft,
  DiamondsFour,
  Flag,
  Sparkle
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
  improve_existing: 'Mejorar algo existente',
  sell_and_charge: 'Vender y cobrar',
  automate_operation: 'Automatizar operación',
  idea_to_project: 'Idea a proyecto'
};

const PLAN_VISUALS = {
  blueprint: {
    label: '29',
    name: 'Blueprint',
    badgeClass: 'bg-[#0F5257]/20 text-[#8DE1D0]',
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

const DIMENSION_STATUS_META = {
  strong: {
    label: 'Fuerte',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
    cardClass: 'border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(10,10,10,1))]'
  },
  improvable: {
    label: 'Mejorable',
    badgeClass: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
    cardClass: 'border-sky-500/20 bg-[linear-gradient(180deg,rgba(14,165,233,0.06),rgba(10,10,10,1))]'
  },
  priority: {
    label: 'Prioritario',
    badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
    cardClass: 'border-amber-500/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(10,10,10,1))]'
  }
};

const PRIORITY_META = {
  high: {
    label: 'Alta',
    badgeClass: 'bg-amber-500/15 text-amber-300'
  },
  medium: {
    label: 'Media',
    badgeClass: 'bg-[#262626] text-[#D4D4D4]'
  },
  low: {
    label: 'Baja',
    badgeClass: 'bg-[#1B2A20] text-[#8BE3A1]'
  }
};

const CONTINUITY_PATH_META = {
  stay: {
    label: 'Seguir analizando',
    cta: null,
    badgeClass: 'bg-[#262626] text-[#D4D4D4]'
  },
  blueprint: {
    label: 'Entrar en Pro',
    cta: 'Entrar en Pro',
    badgeClass: 'bg-[#0F5257]/20 text-[#8DE1D0]'
  },
  sistema: {
    label: 'Entrar en Growth',
    cta: 'Entrar en Growth',
    badgeClass: 'bg-amber-500/20 text-amber-300'
  },
  premium: {
    label: 'Acceder a AI Master 199',
    cta: 'Acceder a AI Master 199',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300'
  }
};

const CONTINUITY_PATH_TO_PLAN = {
  blueprint: 'blueprint',
  sistema: 'sistema',
  premium: 'premium'
};

const SnapshotCard = ({ eyebrow, value, accent = 'default' }) => {
  const accentMap = {
    teal: 'border-[#0F5257]/20 bg-[#0F5257]/8 text-[#8DE1D0]',
    amber: 'border-amber-500/20 bg-amber-500/8 text-amber-300',
    violet: 'border-fuchsia-500/20 bg-fuchsia-500/8 text-fuchsia-300',
    default: 'border-white/5 bg-[#0A0A0A] text-white'
  };

  const accentClass = accentMap[accent] || accentMap.default;

  return (
    <div className={`rounded-xl border p-5 ${accentClass}`}>
      <p className="text-[11px] uppercase tracking-wide mb-2 opacity-80">{eyebrow}</p>
      <p className="text-white font-medium leading-relaxed">{value}</p>
    </div>
  );
};

const SignalList = ({ title, items }) => (
  <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/5">
    <p className="text-sm text-[#A3A3A3] mb-3">{title}</p>
    {items.length > 0 ? (
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}-${item.substring(0, 24)}`}
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
);

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
    } catch {
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

  const reportView = useMemo(() => {
    const diagnosis = project?.diagnosis;
    if (!diagnosis) return null;

    const strengths = Array.isArray(diagnosis.strengths) ? diagnosis.strengths : [];
    const weaknesses = Array.isArray(diagnosis.weaknesses) ? diagnosis.weaknesses : [];
    const quickWins = Array.isArray(diagnosis.quick_wins) ? diagnosis.quick_wins : [];

    const executiveSummaryRaw =
      diagnosis.executive_summary && typeof diagnosis.executive_summary === 'object'
        ? diagnosis.executive_summary
        : {};

    const coreDiagnosisRaw =
      diagnosis.core_diagnosis && typeof diagnosis.core_diagnosis === 'object'
        ? diagnosis.core_diagnosis
        : {};

    const dimensionReview = Array.isArray(diagnosis.dimension_review)
      ? diagnosis.dimension_review
      : [];

    const priorityActions = Array.isArray(diagnosis.priority_actions)
      ? diagnosis.priority_actions
      : [];

    const immediateAction =
      diagnosis.immediate_action && typeof diagnosis.immediate_action === 'object'
        ? diagnosis.immediate_action
        : null;

    const continuityRecommendation =
      diagnosis.continuity_recommendation && typeof diagnosis.continuity_recommendation === 'object'
        ? diagnosis.continuity_recommendation
        : null;

    const understanding =
      diagnosis.understanding ||
      diagnosis.summary ||
      executiveSummaryRaw.understanding ||
      'Diagnóstico generado correctamente, pendiente de ampliar visualización.';

    const mainFinding =
      diagnosis.main_finding ||
      coreDiagnosisRaw.main_finding ||
      weaknesses[0] ||
      strengths[0] ||
      diagnosis.summary ||
      'Sin hallazgo principal disponible.';

    const opportunity =
      diagnosis.opportunity ||
      coreDiagnosisRaw.main_leverage ||
      quickWins[0] ||
      'Sin oportunidad priorizada disponible.';

    return {
      understanding,
      mainFinding,
      opportunity,
      strengths,
      weaknesses,
      quickWins,
      executiveSummary: {
        understanding: executiveSummaryRaw.understanding || understanding,
        mainTension:
          executiveSummaryRaw.main_tension ||
          weaknesses[0] ||
          'No se ha precisado aún la tensión principal.',
        commercialImportance:
          executiveSummaryRaw.commercial_importance ||
          'La lectura debe conectar con captación, conversión, monetización o continuidad.',
        bottomLine:
          executiveSummaryRaw.bottom_line ||
          quickWins[0] ||
          'Hace falta priorizar la siguiente acción con más claridad.'
      },
      coreDiagnosis: {
        mainFinding: coreDiagnosisRaw.main_finding || mainFinding,
        mainWeakness:
          coreDiagnosisRaw.main_weakness ||
          weaknesses[0] ||
          'Sin debilidad principal disponible.',
        mainLeverage: coreDiagnosisRaw.main_leverage || opportunity
      },
      dimensionReview,
      priorityActions,
      immediateAction,
      continuityRecommendation
    };
  }, [project]);

  const dimensionCounters = useMemo(() => {
    const counters = { strong: 0, improvable: 0, priority: 0 };
    const items = reportView?.dimensionReview || [];

    items.forEach((item) => {
      if (item?.status && counters[item.status] !== undefined) {
        counters[item.status] += 1;
      }
    });

    return counters;
  }, [reportView]);

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

  const continuityPath =
    reportView?.continuityRecommendation?.recommended_path || 'stay';
  const continuityMeta = CONTINUITY_PATH_META[continuityPath] || CONTINUITY_PATH_META.stay;
  const continuityPlanId = CONTINUITY_PATH_TO_PLAN[continuityPath] || null;

  return (
    <DashboardLayout title="Detalle del proyecto">
      <div className="max-w-6xl mx-auto">
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
            <span className="px-3 py-1 bg-[#0F5257]/20 text-[#8DE1D0] rounded-full">
              {ROUTE_NAMES[project.route] || project.route || 'Sin clasificar'}
            </span>
          </div>
        </motion.div>

        {reportView && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="card mb-6 overflow-hidden"
            data-testid="premium-report-section"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,82,87,0.16),transparent_35%)] pointer-events-none" />

              <div className="relative">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F5257]/15 text-[#8DE1D0] text-sm font-medium mb-3">
                      <Sparkle weight="fill" />
                      Informe del caso
                    </div>
                    <h3 className="text-2xl text-white font-medium mb-2">
                      Lectura premium estructurada
                    </h3>
                    <p className="text-[#A3A3A3] max-w-3xl">
                      Vista base del informe canónico: comprensión, diagnóstico central, dimensiones,
                      prioridades y recomendación de continuidad.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-[#111111] px-4 py-4 min-w-[270px]">
                    <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
                      Estado del informe
                    </p>
                    <p className="text-white">Base premium activa en proyecto</p>
                    <p className="text-sm text-[#A3A3A3] mt-2">
                      Preparado para evolucionar a PDF sin rehacer arquitectura.
                    </p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-4 mb-6">
                  <SnapshotCard
                    eyebrow="Hallazgo principal"
                    value={reportView.coreDiagnosis.mainFinding}
                    accent="teal"
                  />
                  <SnapshotCard
                    eyebrow="Palanca principal"
                    value={reportView.coreDiagnosis.mainLeverage}
                    accent="amber"
                  />
                  <SnapshotCard
                    eyebrow="Continuidad recomendada"
                    value={continuityMeta.label}
                    accent="violet"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <DiamondsFour size={18} className="text-amber-300" weight="fill" />
                    <h4 className="text-sm uppercase tracking-wide text-[#A3A3A3]">
                      Resumen ejecutivo
                    </h4>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5">
                      <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wide">
                        Comprensión
                      </p>
                      <p className="text-white">{reportView.executiveSummary.understanding}</p>
                    </div>

                    <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5">
                      <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wide">
                        Tensión principal
                      </p>
                      <p className="text-white">{reportView.executiveSummary.mainTension}</p>
                    </div>

                    <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5">
                      <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wide">
                        Importancia comercial
                      </p>
                      <p className="text-white">{reportView.executiveSummary.commercialImportance}</p>
                    </div>

                    <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5">
                      <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wide">
                        Conclusión ejecutiva
                      </p>
                      <p className="text-white">{reportView.executiveSummary.bottomLine}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightning size={18} className="text-[#8DE1D0]" weight="fill" />
                    <h4 className="text-sm uppercase tracking-wide text-[#A3A3A3]">
                      Diagnóstico central
                    </h4>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="rounded-xl p-5 border border-[#0F5257]/20 bg-[#0F5257]/8">
                      <p className="text-xs text-[#8DE1D0] mb-2 uppercase tracking-wide">
                        Hallazgo principal
                      </p>
                      <p className="text-white font-medium">{reportView.coreDiagnosis.mainFinding}</p>
                    </div>

                    <div className="rounded-xl p-5 border border-white/5 bg-[#0A0A0A]">
                      <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wide">
                        Debilidad principal
                      </p>
                      <p className="text-white">{reportView.coreDiagnosis.mainWeakness}</p>
                    </div>

                    <div className="rounded-xl p-5 border border-amber-500/20 bg-amber-500/8">
                      <p className="text-xs text-amber-300 mb-2 uppercase tracking-wide">
                        Palanca principal
                      </p>
                      <p className="text-white">{reportView.coreDiagnosis.mainLeverage}</p>
                    </div>
                  </div>
                </div>

                {reportView.dimensionReview.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Flag size={18} className="text-[#8DE1D0]" weight="fill" />
                        <h4 className="text-sm uppercase tracking-wide text-[#A3A3A3]">
                          Lectura por dimensiones
                        </h4>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs ${DIMENSION_STATUS_META.strong.badgeClass}`}>
                          {dimensionCounters.strong} fuertes
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs ${DIMENSION_STATUS_META.improvable.badgeClass}`}>
                          {dimensionCounters.improvable} mejorables
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs ${DIMENSION_STATUS_META.priority.badgeClass}`}>
                          {dimensionCounters.priority} prioritarias
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                      {reportView.dimensionReview.map((dimension) => {
                        const statusMeta =
                          DIMENSION_STATUS_META[dimension.status] || DIMENSION_STATUS_META.improvable;
                        const priorityMeta =
                          PRIORITY_META[dimension.priority] || PRIORITY_META.medium;

                        return (
                          <div
                            key={dimension.id}
                            className={`rounded-xl border p-4 ${statusMeta.cardClass}`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <p className="text-white font-medium">{dimension.label}</p>
                              <span className={`px-2 py-1 rounded-full text-[11px] ${statusMeta.badgeClass}`}>
                                {statusMeta.label}
                              </span>
                            </div>

                            <p className="text-sm text-[#D4D4D4] leading-relaxed mb-4">
                              {dimension.reading}
                            </p>

                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] ${priorityMeta.badgeClass}`}>
                              Prioridad {priorityMeta.label.toLowerCase()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {reportView.priorityActions.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={18} className="text-[#8DE1D0]" weight="fill" />
                      <h4 className="text-sm uppercase tracking-wide text-[#A3A3A3]">
                        Acciones prioritarias
                      </h4>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      {reportView.priorityActions.map((action, index) => {
                        const intensityMeta =
                          PRIORITY_META[action.intensity] || PRIORITY_META.medium;

                        return (
                          <div
                            key={action.id}
                            className="rounded-xl border border-white/5 bg-[#0A0A0A] p-5"
                          >
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div className="w-8 h-8 rounded-full bg-[#0F5257]/15 text-[#8DE1D0] flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[11px] ${intensityMeta.badgeClass}`}>
                                {intensityMeta.label}
                              </span>
                            </div>

                            <p className="text-white font-medium mb-2">{action.title}</p>
                            <p className="text-sm text-[#D4D4D4] leading-relaxed">
                              {action.why_it_matters}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-4">
                  <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-5">
                    <p className="text-sm uppercase tracking-wide text-[#A3A3A3] mb-3">
                      Acción inmediata
                    </p>

                    {reportView.immediateAction ? (
                      <>
                        <p className="text-white font-medium mb-2">
                          {reportView.immediateAction.title}
                        </p>
                        <p className="text-[#D4D4D4] leading-relaxed">
                          {reportView.immediateAction.description}
                        </p>
                      </>
                    ) : (
                      <p className="text-[#A3A3A3]">Sin acción inmediata disponible.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#0F5257]/20 bg-[#0F5257]/8 p-5">
                    <p className="text-sm uppercase tracking-wide text-[#8DE1D0] mb-3">
                      Recomendación de continuidad
                    </p>

                    {reportView.continuityRecommendation ? (
                      <>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-sm ${continuityMeta.badgeClass}`}>
                            {continuityMeta.label}
                          </span>
                        </div>

                        <p className="text-white mb-5 leading-relaxed">
                          {reportView.continuityRecommendation.reason}
                        </p>

                        {continuityPlanId ? (
                          <Link
                            to="/dashboard/billing"
                            state={{
                              suggestedPlan: continuityPlanId,
                              fromProjectId: project.project_id
                            }}
                            className="btn-primary inline-flex items-center gap-2"
                          >
                            {reportView.continuityRecommendation.cta_label || continuityMeta.cta}
                            <ArrowRight size={16} />
                          </Link>
                        ) : (
                          <div className="rounded-lg border border-white/5 bg-[#111111] px-4 py-3">
                            <p className="text-sm text-[#D4D4D4]">
                              Este caso todavía conviene seguir analizándolo antes de ampliar intensidad.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-[#A3A3A3]">Sin recomendación de continuidad disponible.</p>
                    )}
                  </div>
                </div>

                {(reportView.strengths.length > 0 ||
                  reportView.weaknesses.length > 0 ||
                  reportView.quickWins.length > 0) && (
                  <div className="mt-6">
                    <h4 className="text-sm uppercase tracking-wide text-[#A3A3A3] mb-3">
                      Señales complementarias
                    </h4>

                    <div className="grid md:grid-cols-3 gap-4">
                      <SignalList title="Fortalezas" items={reportView.strengths} />
                      <SignalList title="Debilidades" items={reportView.weaknesses} />
                      <SignalList title="Quick wins" items={reportView.quickWins} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {normalizedPlanRecommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
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
                <div key={q.id || index} className="bg-[#0A0A0A] rounded-xl p-4 border border-white/5">
                  <p className="text-[#A3A3A3] text-sm mb-2">{q.question}</p>
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
            transition={{ delay: 0.28 }}
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
            transition={{ delay: 0.28 }}
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
