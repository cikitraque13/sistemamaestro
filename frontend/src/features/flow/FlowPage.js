import { serverRevision } from '../builder/state/projectIdentity.mjs';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Globe,
  TextAlignLeft,
  Lightning,
  CheckCircle,
  Microphone,
  Stop
} from '@phosphor-icons/react';
import axios from 'axios';
import { economicPost } from '../../lib/economicRequest';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import Logo from '../../components/Logo';
import { useVoice } from '../../hooks/useVoice';

import {
  API_BASE,
  PLAN_VISUALS,
  ROUTE_NAMES
} from './flow.constants';
import {
  buildFlowUrl,
  formatApiErrorDetail,
  resolveRestoredStep,
  wait
} from './flow.utils';
import { mapMemoryReviewGroups, parseMemoryReviewError, questionHasMemoryReview } from './memoryReview.mjs';

import MatrixTransitionOverlay from './components/MatrixTransitionOverlay';
import FlowResultStep from './steps/FlowResultStep';

const isValidProjectPayload = (value) => {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
};

const FlowPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { step: urlStep } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const projectIdFromQuery = searchParams.get('project');

  const [step, setStep] = useState(urlStep || 'input');
  const [inputType, setInputType] = useState(location.state?.inputType || 'text');
  const [inputContent, setInputContent] = useState(location.state?.inputContent || '');
  const [loading, setLoading] = useState(false);
  const [recoveringResult, setRecoveringResult] = useState(false);
  const [project, setProject] = useState(null);
  const [refineAnswers, setRefineAnswers] = useState({});
  const [memoryReview, setMemoryReview] = useState(null);
  const [replacementRecovery, setReplacementRecovery] = useState(false);
  const [showReplacementConfirmation, setShowReplacementConfirmation] = useState(false);
  const [transitionOverlay, setTransitionOverlay] = useState({
    visible: false,
    title: '',
    detail: '',
    status: ''
  });

  const voice = useVoice();

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

  useEffect(() => {
    const fromHome = location.state?.inputContent;
    if (!fromHome) return;

    const autoAnalyze = async () => {
      setLoading(true);
      setStep('interpreting');
      setTransitionOverlay({
        visible: true,
        title: 'Interpretando entrada',
        detail:
          'Analizando contexto, estructura y ruta recomendada para construir una salida útil y accionable.',
        status: 'Procesando análisis'
      });

      try {
        const response = await economicPost(axios,
          `${API_BASE}/projects`,
          {
            input_type: location.state.inputType || 'text',
            input_content: fromHome
          },
          { withCredentials: true }
        );

        const nextProject = response?.data;

        if (!isValidProjectPayload(nextProject)) {
          throw new Error('Respuesta de proyecto no válida');
        }

        setProject(nextProject);
        setRefineAnswers(nextProject.refine_answers || {});

        const nextStep = nextProject.refine_questions?.length > 0 ? 'refine' : 'result';
        window.history.replaceState(
          null,
          '',
          buildFlowUrl(nextStep, nextProject.project_id)
        );

        await wait(950);
        setStep(nextStep);
      } catch (error) {
        toast.error(
          formatApiErrorDetail(error.response?.data?.detail) ||
            error.message ||
            'Error al analizar. Intenta de nuevo.'
        );
        setStep('input');
      } finally {
        setTransitionOverlay({
          visible: false,
          title: '',
          detail: '',
          status: ''
        });
        setLoading(false);
      }
    };

    autoAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.state?.replacementRecovery) return;
    if (!projectIdFromQuery || project) return;

    const loadProjectFromQuery = async () => {
      setLoading(true);
      setRecoveringResult(true);

      try {
        const response = await axios.get(`${API_BASE}/projects/${projectIdFromQuery}`, {
          withCredentials: true
        });

        const loadedProject = response.data;

        if (!isValidProjectPayload(loadedProject)) {
          throw new Error('Proyecto inválido');
        }

        setProject(loadedProject);
        setRefineAnswers(loadedProject.refine_answers || {});

        const restoredStep = resolveRestoredStep(urlStep, loadedProject);
        setStep(restoredStep);
      } catch {
        toast.error('No se pudo recuperar el proyecto.');
        navigate('/dashboard/projects');
      } finally {
        setRecoveringResult(false);
        setLoading(false);
      }
    };

    loadProjectFromQuery();
  }, [navigate, project, projectIdFromQuery, urlStep, location.state?.replacementRecovery]);

  useEffect(() => {
    if (voice.transcript && inputType === 'text') {
      setInputContent(voice.transcript);
    }
  }, [voice.transcript, inputType]);

  useEffect(() => {
    if (step !== 'result' && voice.isSpeaking) {
      voice.stopSpeaking();
    }
  }, [step, voice]);

  useEffect(() => {
    return () => {
      if (voice.isSpeaking) {
        voice.stopSpeaking();
      }
    };
  }, [voice]);

  useEffect(() => {
    if (step === 'input') return;

    const effectiveProjectId = project?.project_id || projectIdFromQuery;
    window.history.replaceState(null, '', buildFlowUrl(step, effectiveProjectId));
  }, [step, project?.project_id, projectIdFromQuery]);

  const handleAnalyze = async ({ replacementConfirmed = false } = {}) => {
    if (!inputContent.trim()) {
      toast.error('Por favor, ingresa una descripción o URL');
      return;
    }

    if (replacementRecovery && !replacementConfirmed) {
      setShowReplacementConfirmation(true);
      return;
    }

    if (voice.isSpeaking) {
      voice.stopSpeaking();
    }

    setLoading(true);
    setStep('interpreting');
    setTransitionOverlay({
      visible: true,
      title: 'Interpretando entrada',
      detail:
        'Analizando contexto, estructura y ruta recomendada para convertir la entrada en una lectura de sistema.',
      status: 'Procesando análisis'
    });

    try {
      const response = await economicPost(axios,
        `${API_BASE}/projects`,
        {
          input_type: inputType,
          input_content: inputContent
        },
        { withCredentials: true }
      );

      const nextProject = response?.data;

      if (!isValidProjectPayload(nextProject)) {
        throw new Error('Respuesta de proyecto no válida');
      }

      setProject(nextProject);
      setRefineAnswers(nextProject.refine_answers || {});
      setReplacementRecovery(false);
      setShowReplacementConfirmation(false);

      const nextStep = nextProject.refine_questions?.length > 0 ? 'refine' : 'result';
      window.history.replaceState(
        null,
        '',
        buildFlowUrl(nextStep, nextProject.project_id)
      );

      await wait(950);
      setStep(nextStep);
    } catch (error) {
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) ||
          error.message ||
          'Error al analizar. Intenta de nuevo.'
      );
      setStep('input');
    } finally {
      setTransitionOverlay({
        visible: false,
        title: '',
        detail: '',
        status: ''
      });
      setLoading(false);
    }
  };

  const handleRefineSubmit = async () => {
    if (!project?.project_id) return;

    if (voice.isSpeaking) {
      voice.stopSpeaking();
    }

    setLoading(true);
    setTransitionOverlay({
      visible: true,
      title: 'Procesando afinado',
      detail:
        'Consolidando respuestas, elevando precisión del diagnóstico y reordenando la lectura del proyecto.',
      status: 'Aplicando afinado'
    });

    try {
      const response = await axios.post(
        `${API_BASE}/projects/${project.project_id}/refine`,
        {
          answers: refineAnswers
        },
        { withCredentials: true, headers: { 'If-Match': serverRevision(project) } }
      );

      const nextProject = response?.data;

      if (!isValidProjectPayload(nextProject)) {
        throw new Error('Respuesta de proyecto no válida');
      }

      setProject(nextProject);
      setRefineAnswers(nextProject.refine_answers || {});
      setMemoryReview(null);
      window.history.replaceState(
        null,
        '',
        buildFlowUrl('result', nextProject.project_id)
      );

      await wait(800);
      toast.success('Afinado guardado correctamente');
      setStep('result');
    } catch (error) {
      const detail = error.response?.data?.detail;
      const memoryError = parseMemoryReviewError(detail);
      const code = memoryError?.code;
      if (code === 'project_memory_conflict' || code === 'project_memory_uncertain') {
        setMemoryReview(memoryError);
      } else if (code === 'memory_review_legacy_unmapped') {
        setMemoryReview(memoryError);
      } else if (code === 'stale_project_revision') {
        setMemoryReview(null);
        try {
          const latest = await axios.get(`${API_BASE}/projects/${project.project_id}`, { withCredentials: true });
          if (isValidProjectPayload(latest?.data)) {
            setProject(latest.data);
            setRefineAnswers(latest.data.refine_answers || {});
            toast.error('El proyecto cambió en otra sesión. Se cargó la revisión actual; revisa tus respuestas y vuelve a enviarlas.');
          } else {
            toast.error('El proyecto cambió en otra sesión. Recárgalo antes de volver a enviar.');
          }
        } catch {
          toast.error('El proyecto cambió en otra sesión y no se pudo recargar. Inténtalo de nuevo.');
        }
      } else {
        toast.error(formatApiErrorDetail(detail) || error.message || 'Error al guardar respuestas');
      }
    } finally {
      setTransitionOverlay({
        visible: false,
        title: '',
        detail: '',
        status: ''
      });
      setLoading(false);
    }
  };

  const beginReplacementRecovery = () => {
    setProject(null);
    setMemoryReview(null);
    setRefineAnswers({});
    setInputContent('');
    setReplacementRecovery(true);
    setShowReplacementConfirmation(false);
    setStep('input');
    navigate('/flow/input', { replace: true, state: { replacementRecovery: true } });
  };

  const handleGenerateBlueprint = async () => {
    if (!project?.project_id) return;

    if (user?.plan === 'free') {
      toast.error('Necesitas el plan Blueprint o superior');
      navigate('/dashboard/billing', {
        state: {
          suggestedPlan: normalizedPlanRecommendation?.planId || 'blueprint',
          fromProjectId: project.project_id,
          focusSection: 'plans'
        }
      });
      return;
    }

    if (voice.isSpeaking) {
      voice.stopSpeaking();
    }

    setLoading(true);
    setTransitionOverlay({
      visible: true,
      title: 'Generando blueprint',
      detail:
        'Construyendo prioridades, arquitectura, despliegue y secuencia de trabajo para el proyecto.',
      status: 'Compilando blueprint'
    });

    try {
      const response = await economicPost(axios,
        `${API_BASE}/projects/${project.project_id}/blueprint`,
        {},
        { withCredentials: true, headers: { 'If-Match': serverRevision(project) } }
      );

      const nextProject = response?.data;

      if (!isValidProjectPayload(nextProject)) {
        throw new Error('Respuesta de proyecto no válida');
      }

      setProject(nextProject);
      window.history.replaceState(
        null,
        '',
        buildFlowUrl('blueprint', nextProject.project_id)
      );

      await wait(1000);
      setStep('blueprint');
    } catch (error) {
      const detail = error.response?.data?.detail;
      const memoryError = parseMemoryReviewError(detail);
      if (memoryError?.code === 'project_memory_conflict' || memoryError?.code === 'project_memory_uncertain') {
        setMemoryReview(memoryError);
        setStep('refine');
      } else if (memoryError?.code === 'memory_review_legacy_unmapped') {
        setMemoryReview(memoryError);
      } else {
        toast.error(formatApiErrorDetail(detail) || error.message || 'Error al generar blueprint');
      }
    } finally {
      setTransitionOverlay({
        visible: false,
        title: '',
        detail: '',
        status: ''
      });
      setLoading(false);
    }
  };

  const goToProject = () => {
    if (project?.project_id) {
      navigate(`/dashboard/project/${project.project_id}`);
    } else {
      navigate('/dashboard/projects');
    }
  };

  const goToPremiumPreview = () => {
    if (!project?.project_id) return;
    navigate(`/dashboard/project/${project.project_id}/report-preview`);
  };

  const openStrategicBilling = () => {
    if (!project?.project_id) return;

    navigate('/dashboard/billing', {
      state: {
        suggestedPlan: normalizedPlanRecommendation?.planId || 'blueprint',
        fromProjectId: project.project_id,
        focusSection: 'plans'
      }
    });
  };

  const handlePlayDiagnosis = () => {
    if (!normalizedDiagnosis) return;

    if (voice.isSpeaking) {
      voice.stopSpeaking();
      return;
    }

    const textToSpeak = `${normalizedDiagnosis.understanding}. Hallazgo principal: ${normalizedDiagnosis.mainFinding}. Oportunidad: ${normalizedDiagnosis.opportunity}.`;
    voice.speak(textToSpeak);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {transitionOverlay.visible && (
        <MatrixTransitionOverlay
          title={transitionOverlay.title}
          detail={transitionOverlay.detail}
          status={transitionOverlay.status}
        />
      )}

      <header className="border-b border-[#262626] bg-[#0A0A0A]/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-[#A3A3A3] hover:text-white flex items-center gap-2 transition-colors"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <Logo size="small" />

          <div className="w-20"></div>
        </div>
      </header>

      <div className="border-b border-[#262626]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {['input', 'interpreting', 'refine', 'result', 'blueprint'].map((stepName, index) => (
              <React.Fragment key={stepName}>
                <div
                  className={`flex items-center gap-2 ${
                    step === stepName
                      ? 'text-[#0F5257]'
                      : ['input', 'interpreting', 'refine', 'result', 'blueprint'].indexOf(step) > index
                        ? 'text-[#0F5257]'
                        : 'text-[#A3A3A3]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step === stepName
                        ? 'bg-[#0F5257] text-white'
                        : ['input', 'interpreting', 'refine', 'result', 'blueprint'].indexOf(step) > index
                          ? 'bg-[#0F5257]/30 text-[#0F5257]'
                          : 'bg-[#262626] text-[#A3A3A3]'
                    }`}
                  >
                    {['input', 'interpreting', 'refine', 'result', 'blueprint'].indexOf(step) > index ? (
                      <CheckCircle size={14} weight="fill" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <span className="hidden sm:inline text-sm">
                    {stepName === 'input'
                      ? 'Entrada'
                      : stepName === 'interpreting'
                        ? 'Interpretando'
                        : stepName === 'refine'
                          ? 'Afinado'
                          : stepName === 'result'
                            ? 'Resultado'
                            : 'Blueprint'}
                  </span>
                </div>

                {index < 4 && <div className="flex-1 h-px bg-[#262626]"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          {memoryReview?.code === 'memory_review_legacy_unmapped' && (
            <section className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 mb-6" role="alert" data-testid="memory-legacy-recovery">
              <h3 className="text-white font-medium mb-2">Este proyecto conserva respuestas históricas sin pregunta asociada</h3>
              <p className="text-sm text-[#D4D4D4] mb-3">No se han cambiado ni descartado. Para continuar, puedes crear otro proyecto y reintroducir manualmente los datos que sigan siendo relevantes. El proyecto original permanecerá intacto.</p>
              <ul className="text-sm text-[#D4D4D4] list-disc pl-5 mb-4">
                {memoryReview.questionIds.map((id) => <li key={id}>ID histórico: {id}</li>)}
              </ul>
              <button type="button" onClick={beginReplacementRecovery} className="btn-secondary" data-testid="create-replacement-project-btn">Empezar un proyecto nuevo</button>
            </section>
          )}
          <AnimatePresence mode="wait">
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <h1
                  className="text-2xl sm:text-3xl font-light text-white mb-4"
                  data-testid="flow-title"
                >
                  ¿Qué necesitas resolver?
                </h1>

                <p className="text-[#A3A3A3] mb-8">
                  Describe tu necesidad o pega una URL para analizar.
                </p>

                <div className="bg-[#171717] border border-white/10 rounded-2xl p-6">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setInputType('text')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        inputType === 'text'
                          ? 'bg-[#0F5257] text-white'
                          : 'bg-[#262626] text-[#A3A3A3] hover:text-white'
                      }`}
                      data-testid="tab-text"
                    >
                      <TextAlignLeft size={16} />
                      Descripción
                    </button>

                    <button
                      onClick={() => setInputType('url')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        inputType === 'url'
                          ? 'bg-[#0F5257] text-white'
                          : 'bg-[#262626] text-[#A3A3A3] hover:text-white'
                      }`}
                      data-testid="tab-url"
                    >
                      <Globe size={16} />
                      URL
                    </button>
                  </div>

                  {inputType === 'text' ? (
                    <div className="relative">
                      <textarea
                        value={inputContent}
                        onChange={(event) => setInputContent(event.target.value)}
                        placeholder={
                          voice.isListening
                            ? 'Escuchando...'
                            : 'Describe tu idea, necesidad o problema que quieres resolver...'
                        }
                        className={`w-full h-40 bg-[#0A0A0A] border rounded-lg px-4 py-3 pr-14 text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F5257] focus:ring-1 focus:ring-[#0F5257]/50 transition-all resize-none ${
                          voice.isListening ? 'border-red-500/50 animate-pulse' : 'border-white/10'
                        }`}
                        data-testid="input-text"
                      />

                      {voice.isSupported && (
                        <div className="absolute right-3 top-3">
                          <button
                            onClick={
                              voice.isListening ? voice.stopListening : voice.startListening
                            }
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              voice.isListening
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-[#262626] text-[#A3A3A3] hover:bg-[#363636] hover:text-white'
                            }`}
                            title={voice.isListening ? 'Detener' : 'Hablar por voz'}
                            data-testid="voice-input-btn"
                          >
                            {voice.isListening ? (
                              <Stop size={20} weight="fill" />
                            ) : (
                              <Microphone size={20} weight="fill" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={inputContent}
                      onChange={(event) => setInputContent(event.target.value)}
                      placeholder="https://tu-sitio-web.com"
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F5257] focus:ring-1 focus:ring-[#0F5257]/50 transition-all"
                      data-testid="input-url"
                    />
                  )}

                  <button
                    onClick={handleAnalyze}
                    disabled={!inputContent.trim() || loading}
                    className="w-full btn-primary flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    data-testid="analyze-btn"
                  >
                    {loading ? (
                      <div className="spinner"></div>
                    ) : (
                      <>
                        Analizar
                        <ArrowRight weight="bold" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'interpreting' && (
              <motion.div
                key="interpreting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <h2 className="text-xl text-white mb-2">Interpretando tu necesidad...</h2>
                <p className="text-[#A3A3A3]">El sistema está procesando tu entrada</p>
              </motion.div>
            )}

            {step === 'refine' && project?.refine_questions?.length > 0 && (
              <motion.div
                key="refine"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F5257]/20 text-[#0F5257] rounded-full text-sm mb-4">
                    <Lightning weight="fill" />
                    {ROUTE_NAMES[project.route] || project.route || 'Ruta detectada'}
                  </div>

                  <h2
                    className="text-2xl font-light text-white mb-2"
                    data-testid="refine-title"
                  >
                    Afinemos tu proyecto
                  </h2>

                  <p className="text-[#A3A3A3]">
                    Responde estas preguntas para obtener un diagnóstico más preciso.
                  </p>
                </div>

                <div className="bg-[#171717] border border-white/10 rounded-2xl p-6 space-y-6">
                  {(memoryReview?.code === 'project_memory_conflict' || memoryReview?.code === 'project_memory_uncertain') && (
                    <section className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4" role="alert" data-testid="memory-conflict-review">
                      <h3 className="text-white font-medium mb-2">
                        {memoryReview.code === 'project_memory_conflict' ? 'Revisa respuestas incompatibles' : 'Aclara el contexto de estas respuestas'}
                      </h3>
                      <p className="text-sm text-[#D4D4D4] mb-4">Edita conjuntamente las respuestas relacionadas. El proyecto solo se actualizará cuando el conjunto completo sea compatible.</p>
                      <div className="space-y-3">
                        {mapMemoryReviewGroups(memoryReview.groups, project.refine_questions).map((group, groupIndex) => {
                          return (
                            <div key={`memory-group-${groupIndex}`} className="rounded-lg border border-white/10 p-3" data-testid="memory-conflict-group">
                              <p className="text-xs uppercase tracking-wide text-amber-200 mb-2">{group.kind === 'uncertain' ? 'Grupo por aclarar' : `Grupo ${groupIndex + 1}`}</p>
                              {group.mappedQuestions.map((question) => (
                                <p key={question.id} className="text-sm text-white">{question.question}</p>
                              ))}
                              {group.unmappedIds.map((id) => (
                                <p key={id} className="text-sm text-[#A3A3A3]">ID sin pregunta autorizada: {id}</p>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {project.refine_questions.map((question, index) => (
                    <div key={question.id || index}>
                      <label className="block text-white mb-2">
                        {index + 1}. {question.question}
                      </label>

                      <textarea
                        value={refineAnswers[question.id] || ''}
                        onChange={(event) => {
                          setMemoryReview(null);
                          setRefineAnswers({ ...refineAnswers, [question.id]: event.target.value });
                        }}
                        placeholder="Tu respuesta..."
                        className={`w-full h-20 bg-[#0A0A0A] border rounded-lg px-4 py-3 text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F5257] focus:ring-1 focus:ring-[#0F5257]/50 transition-all resize-none ${questionHasMemoryReview(memoryReview?.groups, question.id) ? 'border-amber-300/70 ring-1 ring-amber-300/30' : 'border-white/10'}`}
                        data-testid={`refine-answer-${index}`}
                      />
                      {questionHasMemoryReview(memoryReview?.groups, question.id) && (
                        <p className="text-xs text-amber-200 mt-2">Esta respuesta forma parte de una revisión conjunta.</p>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setStep('result')}
                      className="btn-secondary flex-1"
                      data-testid="skip-refine-btn"
                    >
                      Saltar
                    </button>

                    <button
                      onClick={handleRefineSubmit}
                      disabled={loading}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                      data-testid="submit-refine-btn"
                    >
                      {loading ? (
                        <div className="spinner w-4 h-4"></div>
                      ) : (
                        <>
                          Continuar
                          <ArrowRight weight="bold" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'result' && (
              project ? (
                <FlowResultStep
                  project={project}
                  normalizedDiagnosis={normalizedDiagnosis}
                  normalizedPlanRecommendation={normalizedPlanRecommendation}
                  userPlan={user?.plan}
                  loading={loading}
                  voiceSupported={voice.isSupported}
                  isSpeaking={voice.isSpeaking}
                  onPlayDiagnosis={handlePlayDiagnosis}
                  onGoToProject={goToProject}
                  onOpenPremiumPreview={goToPremiumPreview}
                  onOpenStrategicBilling={openStrategicBilling}
                  onGenerateBlueprint={handleGenerateBlueprint}
                />
              ) : (
                <motion.div
                  key="result-fallback"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-[#171717] border border-white/10 rounded-2xl p-6 text-center"
                >
                  {recoveringResult ? (
                    <>
                      <div className="spinner mx-auto mb-4"></div>
                      <h2 className="text-xl text-white mb-2">Recuperando tu resultado</h2>
                      <p className="text-[#A3A3A3]">
                        El proyecto ya existe. Estamos rehaciendo la vista para mostrar el diagnóstico correctamente.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl text-white mb-2">No se pudo reconstruir el resultado</h2>
                      <p className="text-[#A3A3A3] mb-5">
                        El análisis se ha procesado, pero la vista no ha podido hidratar el proyecto en este paso.
                      </p>
                      <button
                        onClick={() => navigate('/dashboard/projects')}
                        className="btn-secondary"
                      >
                        Volver a proyectos
                      </button>
                    </>
                  )}
                </motion.div>
              )
            )}

            {step === 'blueprint' && project?.blueprint && (
              <motion.div
                key="blueprint"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <CheckCircle size={48} weight="fill" className="text-[#0F5257] mx-auto mb-4" />
                  <h2
                    className="text-2xl font-light text-white mb-2"
                    data-testid="blueprint-title"
                  >
                    Tu Blueprint está listo
                  </h2>
                </div>

                <div className="bg-[#171717] border border-white/10 rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="text-xl text-white mb-2">{project.blueprint.title}</h3>
                    <p className="text-[#A3A3A3]">{project.blueprint.summary}</p>
                  </div>

                  {project.blueprint.priorities && (
                    <div>
                      <p className="text-sm text-[#A3A3A3] mb-3">Prioridades</p>
                      <ol className="space-y-2">
                        {project.blueprint.priorities.map((priority, index) => (
                          <li
                            key={`priority-${index}-${priority.substring(0, 20)}`}
                            className="flex items-start gap-3 text-white"
                          >
                            <span className="w-6 h-6 rounded-full bg-[#0F5257]/20 text-[#0F5257] text-sm flex items-center justify-center flex-shrink-0">
                              {index + 1}
                            </span>
                            {priority}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {project.blueprint.deployment_steps && (
                    <div>
                      <p className="text-sm text-[#A3A3A3] mb-3">Plan de despliegue</p>
                      <ol className="space-y-2">
                        {project.blueprint.deployment_steps.map((deploymentStep, index) => (
                          <li
                            key={`deploy-${index}-${deploymentStep.substring(0, 20)}`}
                            className="flex items-center gap-2 text-white"
                          >
                            <CheckCircle size={16} className="text-[#0F5257]" />
                            {deploymentStep}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {project.blueprint.timeline_estimate && (
                    <div className="p-4 bg-[#0F5257]/10 rounded-lg">
                      <p className="text-sm text-[#0F5257]">Tiempo estimado</p>
                      <p className="text-white font-medium">
                        {project.blueprint.timeline_estimate}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={goToProject}
                  className="w-full btn-primary mt-6 flex items-center justify-center gap-2"
                  data-testid="go-to-project-btn"
                >
                  Ver proyecto completo
                  <ArrowRight weight="bold" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {showReplacementConfirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-6">
          <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171717] p-6" role="dialog" aria-modal="true" aria-labelledby="replacement-confirmation-title" data-testid="replacement-consumption-confirmation">
            <h2 id="replacement-confirmation-title" className="text-xl text-white mb-3">Confirmar nuevo análisis</h2>
            <p className="text-[#D4D4D4] mb-5">Crear el proyecto nuevo ejecutará el análisis inicial habitual para {inputType === 'url' ? 'una URL' : 'una idea'} y aplicará el consumo normal de créditos definido para esa operación. La cantidad depende de la operación y de la configuración de tu cuenta. No se copiarán las respuestas históricas y el proyecto original permanecerá intacto.</p>
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowReplacementConfirmation(false)} data-testid="cancel-replacement-confirmation">Cancelar</button>
              <button type="button" className="btn-primary" onClick={() => handleAnalyze({ replacementConfirmed: true })} data-testid="confirm-replacement-consumption">Confirmar y crear proyecto</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default FlowPage;
