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
        const response = await axios.post(
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
  }, [navigate, project, projectIdFromQuery, urlStep]);

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

  const handleAnalyze = async () => {
    if (!inputContent.trim()) {
      toast.error('Por favor, ingresa una descripción o URL');
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
      const response = await axios.post(
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
        { withCredentials: true }
      );

      const nextProject = response?.data;

      if (!isValidProjectPayload(nextProject)) {
        throw new Error('Respuesta de proyecto no válida');
      }

      setProject(nextProject);
      setRefineAnswers(nextProject.refine_answers || {});
      window.history.replaceState(
        null,
        '',
        buildFlowUrl('result', nextProject.project_id)
      );

      await wait(800);
      toast.success('Afinado guardado correctamente');
      setStep('result');
    } catch (error) {
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) ||
          error.message ||
          'Error al guardar respuestas'
      );
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
      const response = await axios.post(
        `${API_BASE}/projects/${project.project_id}/blueprint`,
        {},
        { withCredentials: true }
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
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) ||
          error.message ||
          'Error al generar blueprint'
      );
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
                  {project.refine_questions.map((question, index) => (
                    <div key={question.id || index}>
                      <label className="block text-white mb-2">
                        {index + 1}. {question.question}
                      </label>

                      <textarea
                        value={refineAnswers[question.id] || ''}
                        onChange={(event) =>
                          setRefineAnswers({
                            ...refineAnswers,
                            [question.id]: event.target.value
                          })
                        }
                        placeholder="Tu respuesta..."
                        className="w-full h-20 bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F5257] focus:ring-1 focus:ring-[#0F5257]/50 transition-all resize-none"
                        data-testid={`refine-answer-${index}`}
                      />
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
    </div>
  );
};

export default FlowPage;
