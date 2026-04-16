import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Globe,
  TextAlignLeft,
  Lightning,
  CheckCircle,
  Sparkle,
  Lock,
  Microphone,
  Stop,
  SpeakerHigh
} from '@phosphor-icons/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Logo from '../components/Logo';
import { useVoice } from '../hooks/useVoice';

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

const ROUTE_DESCRIPTIONS = {
  improve: 'Analizamos un activo existente y detectamos fricciones que afectan claridad, captación o conversión.',
  sell: 'Estructuramos la propuesta comercial y detectamos oportunidades de monetización.',
  automate: 'Identificamos cuellos de botella operativos y oportunidades de automatización.',
  idea: 'Convertimos una idea en una dirección de proyecto con potencial de validación y crecimiento.',

  improve_existing: 'Analizamos tu activo existente y te mostramos cómo mejorarlo.',
  sell_and_charge: 'Estructuramos tu propuesta comercial con el flujo correcto.',
  automate_operation: 'Identificamos cuellos de botella y proponemos automatización.',
  idea_to_project: 'Convertimos tu idea en un proyecto digital monetizable.'
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

const MATRIX_CHARS = [
  '0', '1', 'A', 'U', 'T', 'H', 'X', '9', 'K', 'Σ', 'Λ', '7', 'N', 'O', 'D', 'E',
  'S', 'Y', 'S', 'Q', 'R', 'I', 'V', 'M', 'C', '8', '2', '5', 'F', 'P'
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatApiErrorDetail = (detail) => {
  if (detail == null) return 'Algo salió mal. Intenta de nuevo.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(' ');
  }
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
};

const buildFlowUrl = (step, projectId) => {
  if (!projectId) return `/flow/${step}`;
  return `/flow/${step}?project=${encodeURIComponent(projectId)}`;
};

const resolveStepFromProject = (projectData) => {
  if (!projectData) return 'input';
  if (projectData.blueprint || projectData.status === 'blueprint_generated') return 'blueprint';
  return 'result';
};

const resolveRestoredStep = (requestedStep, projectData) => {
  const fallbackStep = resolveStepFromProject(projectData);

  if (!requestedStep) return fallbackStep;
  if (requestedStep === 'blueprint' && !projectData?.blueprint) return fallbackStep;
  if (requestedStep === 'refine' && !(projectData?.refine_questions?.length > 0)) return fallbackStep;

  return requestedStep;
};

const buildMatrixColumn = (length = 28) => {
  return Array.from({ length }, (_, index) => ({
    id: index,
    char: MATRIX_CHARS[(index * 7 + length) % MATRIX_CHARS.length]
  }));
};

const MatrixRain = () => {
  const columns = useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => ({
        id: index,
        left: `${index * 3.95}%`,
        duration: 5.8 + (index % 7) * 0.65,
        delay: (index % 9) * 0.28,
        opacity: 0.14 + (index % 5) * 0.045,
        chars: buildMatrixColumn(24 + (index % 8))
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {columns.map((column) => (
        <div
          key={column.id}
          className="absolute top-[-40%] select-none font-mono text-[11px] sm:text-xs tracking-[0.2em] text-[#39ff88]"
          style={{
            left: column.left,
            opacity: column.opacity,
            animation: `matrixDrop ${column.duration}s linear infinite`,
            animationDelay: `${column.delay}s`
          }}
        >
          {column.chars.map((item, charIndex) => (
            <div
              key={item.id}
              className={charIndex === 0 ? 'text-[#d1ffe5]' : ''}
              style={{
                opacity: Math.max(0.18, 1 - charIndex * 0.045)
              }}
            >
              {item.char}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const MatrixTransitionOverlay = ({ title, detail, status }) => {
  return (
    <div className="fixed inset-0 z-[120] bg-[#010302] flex items-center justify-center px-6">
      <style>{`
        @keyframes matrixDrop {
          0% { transform: translateY(-18%); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translateY(150%); opacity: 0; }
        }
        @keyframes matrixPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes matrixScan {
          0% { transform: translateY(-130%); opacity: 0; }
          10% { opacity: 0.18; }
          100% { transform: translateY(130%); opacity: 0; }
        }
        @keyframes terminalBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,136,0.09),transparent_45%)]" />
      <div className="absolute inset-0 opacity-55">
        <MatrixRain />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ animation: 'matrixScan 2.4s linear infinite' }}
      >
        <div className="h-28 w-full bg-gradient-to-b from-transparent via-[#39ff88]/10 to-transparent" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-0 rounded-[30px] bg-[#39ff88]/8 blur-3xl" />

        <div className="relative overflow-hidden rounded-[30px] border border-[#1f7a4f]/35 bg-[#06100b]/92 shadow-[0_0_70px_rgba(57,255,136,0.09)]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(57,255,136,0.05),transparent_22%,transparent_78%,rgba(57,255,136,0.03))]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.015)_0px,rgba(255,255,255,0.015)_1px,transparent_1px,transparent_4px)] opacity-20" />

          <div className="relative px-8 py-10 sm:px-12 sm:py-12">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#39ff88]/20 bg-[#0a1711] px-4 py-2">
                <span
                  className="h-2.5 w-2.5 rounded-full bg-[#39ff88]"
                  style={{ animation: 'matrixPulse 1.2s ease-in-out infinite' }}
                />
                <span className="font-mono text-[11px] sm:text-xs tracking-[0.28em] text-[#b8ffd4] uppercase">
                  Sistema Maestro
                </span>
              </div>

              <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#6ee7a8]">
                FLOW / TRANSITION
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
              <div>
                <h3 className="text-2xl sm:text-3xl font-light text-white mb-4">
                  {title}
                </h3>

                <p className="text-[#9aa4a0] leading-relaxed mb-8 max-w-xl">
                  {detail}
                </p>

                <div className="rounded-2xl border border-[#39ff88]/14 bg-[#040a07] px-5 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse" />
                    <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse [animation-delay:180ms]" />
                    <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse [animation-delay:360ms]" />
                  </div>

                  <p className="font-mono text-sm sm:text-base tracking-[0.16em] uppercase text-[#e9fff1]">
                    {status}
                    <span
                      className="ml-1 inline-block text-[#39ff88]"
                      style={{ animation: 'terminalBlink 1s step-end infinite' }}
                    >
                      _
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#39ff88]/14 bg-[#040a07] px-5 py-5">
                <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#6ee7a8] mb-4">
                  Estado de sistema
                </div>

                <div className="space-y-3 font-mono text-xs sm:text-[13px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9aa4a0]">Entrada</span>
                    <span className="text-[#d7ffe7]">OK</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9aa4a0]">Análisis</span>
                    <span className="text-[#d7ffe7]">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9aa4a0]">Sistema</span>
                    <span className="text-[#d7ffe7]">SECURE</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9aa4a0]">Resultado</span>
                    <span className="text-[#d7ffe7]">PROCESSING</span>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-white/5 bg-[#07110c] px-4 py-4">
                  <div className="font-mono text-[11px] tracking-[0.20em] uppercase text-[#6ee7a8] mb-2">
                    Log
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-[#b8c4be]">
                    <div>&gt; flow.channel = secure</div>
                    <div>&gt; analysis.mode = active</div>
                    <div>&gt; pipeline.target = result</div>
                    <div>&gt; status = running transition</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Flow = () => {
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
        detail: 'Analizando contexto, estructura y ruta recomendada para construir una salida útil y accionable.',
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

        setProject(response.data);
        setRefineAnswers(response.data.refine_answers || {});

        await wait(950);

        if (response.data.refine_questions?.length > 0) {
          setStep('refine');
        } else {
          setStep('result');
        }
      } catch (error) {
        toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Error al analizar. Intenta de nuevo.');
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
    if (location.state?.inputContent) return;
    if (!projectIdFromQuery) return;
    if (project) return;

    const loadProjectFromQuery = async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `${API_BASE}/projects/${projectIdFromQuery}`,
          { withCredentials: true }
        );

        const loadedProject = response.data;
        setProject(loadedProject);
        setRefineAnswers(loadedProject.refine_answers || {});

        const restoredStep = resolveRestoredStep(urlStep, loadedProject);
        setStep(restoredStep);
      } catch (error) {
        toast.error('No se pudo recuperar el proyecto.');
        navigate('/dashboard/projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjectFromQuery();
  }, [location.state?.inputContent, navigate, project, projectIdFromQuery, urlStep]);

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
      detail: 'Analizando contexto, estructura y ruta recomendada para convertir la entrada en una lectura de sistema.',
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

      setProject(response.data);
      setRefineAnswers(response.data.refine_answers || {});

      await wait(950);

      if (response.data.refine_questions?.length > 0) {
        setStep('refine');
      } else {
        setStep('result');
      }
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Error al analizar. Intenta de nuevo.');
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
    if (!project) return;

    if (voice.isSpeaking) {
      voice.stopSpeaking();
    }

    setLoading(true);
    setTransitionOverlay({
      visible: true,
      title: 'Procesando afinado',
      detail: 'Consolidando respuestas, elevando precisión del diagnóstico y reordenando la lectura del proyecto.',
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

      setProject(response.data);
      setRefineAnswers(response.data.refine_answers || {});
      await wait(800);
      toast.success('Afinado guardado correctamente');
      setStep('result');
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Error al guardar respuestas');
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
    if (!project) return;

    if (user?.plan === 'free') {
      toast.error('Necesitas el plan Blueprint o superior');
      navigate('/dashboard/billing', {
        state: {
          suggestedPlan: normalizedPlanRecommendation?.planId || 'blueprint',
          fromProjectId: project.project_id
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
      detail: 'Construyendo prioridades, arquitectura, despliegue y secuencia de trabajo para el proyecto.',
      status: 'Compilando blueprint'
    });

    try {
      const response = await axios.post(
        `${API_BASE}/projects/${project.project_id}/blueprint`,
        {},
        { withCredentials: true }
      );

      setProject(response.data);
      await wait(1000);
      setStep('blueprint');
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Error al generar blueprint');
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
    if (project) {
      navigate(`/dashboard/project/${project.project_id}`);
    } else {
      navigate('/dashboard/projects');
    }
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
            {['input', 'interpreting', 'refine', 'result', 'blueprint'].map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`flex items-center gap-2 ${
                    step === s
                      ? 'text-[#0F5257]'
                      : ['input', 'interpreting', 'refine', 'result', 'blueprint'].indexOf(step) > i
                        ? 'text-[#0F5257]'
                        : 'text-[#A3A3A3]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step === s
                        ? 'bg-[#0F5257] text-white'
                        : ['input', 'interpreting', 'refine', 'result', 'blueprint'].indexOf(step) > i
                          ? 'bg-[#0F5257]/30 text-[#0F5257]'
                          : 'bg-[#262626] text-[#A3A3A3]'
                    }`}
                  >
                    {['input', 'interpreting', 'refine', 'result', 'blueprint'].indexOf(step) > i ? (
                      <CheckCircle size={14} weight="fill" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm">
                    {s === 'input'
                      ? 'Entrada'
                      : s === 'interpreting'
                        ? 'Interpretando'
                        : s === 'refine'
                          ? 'Afinado'
                          : s === 'result'
                            ? 'Resultado'
                            : 'Blueprint'}
                  </span>
                </div>
                {i < 4 && <div className="flex-1 h-px bg-[#262626]"></div>}
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
                <h1 className="text-2xl sm:text-3xl font-light text-white mb-4" data-testid="flow-title">
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
                        onChange={(e) => setInputContent(e.target.value)}
                        placeholder={voice.isListening ? 'Escuchando...' : 'Describe tu idea, necesidad o problema que quieres resolver...'}
                        className={`w-full h-40 bg-[#0A0A0A] border rounded-lg px-4 py-3 pr-14 text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F5257] focus:ring-1 focus:ring-[#0F5257]/50 transition-all resize-none ${
                          voice.isListening ? 'border-red-500/50 animate-pulse' : 'border-white/10'
                        }`}
                        data-testid="input-text"
                      />
                      {voice.isSupported && (
                        <div className="absolute right-3 top-3">
                          <button
                            onClick={voice.isListening ? voice.stopListening : voice.startListening}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              voice.isListening
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-[#262626] text-[#A3A3A3] hover:bg-[#363636] hover:text-white'
                            }`}
                            title={voice.isListening ? 'Detener' : 'Hablar por voz'}
                            data-testid="voice-input-btn"
                          >
                            {voice.isListening ? <Stop size={20} weight="fill" /> : <Microphone size={20} weight="fill" />}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
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
                  <h2 className="text-2xl font-light text-white mb-2" data-testid="refine-title">
                    Afinemos tu proyecto
                  </h2>
                  <p className="text-[#A3A3A3]">
                    Responde estas preguntas para obtener un diagnóstico más preciso.
                  </p>
                </div>

                <div className="bg-[#171717] border border-white/10 rounded-2xl p-6 space-y-6">
                  {project.refine_questions.map((q, index) => (
                    <div key={q.id || index}>
                      <label className="block text-white mb-2">
                        {index + 1}. {q.question}
                      </label>
                      <textarea
                        value={refineAnswers[q.id] || ''}
                        onChange={(e) =>
                          setRefineAnswers({
                            ...refineAnswers,
                            [q.id]: e.target.value
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

            {step === 'result' && project && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <CheckCircle size={48} weight="fill" className="text-[#0F5257] mx-auto mb-4" />
                  <h2 className="text-2xl font-light text-white mb-2" data-testid="result-title">
                    Tu diagnóstico está listo
                  </h2>

                  {voice.isSupported && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <button
                        onClick={handlePlayDiagnosis}
                        className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                          voice.isSpeaking
                            ? 'bg-[#0F5257] text-white'
                            : 'bg-[#262626] text-[#A3A3A3] hover:text-white'
                        }`}
                        data-testid="play-voice-btn"
                      >
                        {voice.isSpeaking ? (
                          <>
                            <Stop size={16} weight="fill" />
                            Detener audio
                          </>
                        ) : (
                          <>
                            <SpeakerHigh size={16} weight="fill" />
                            Escuchar diagnóstico
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-[#171717] border border-[#0F5257]/30 rounded-2xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#0F5257]/20 rounded-lg">
                      <Lightning size={24} weight="fill" className="text-[#0F5257]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#A3A3A3] mb-1">Ruta recomendada</p>
                      <h3 className="text-xl text-white font-medium">
                        {ROUTE_NAMES[project.route] || project.route || 'Ruta detectada'}
                      </h3>
                      <p className="text-[#A3A3A3] text-sm mt-1">
                        {ROUTE_DESCRIPTIONS[project.route] || 'Ruta generada según el análisis actual del proyecto.'}
                      </p>
                    </div>
                  </div>
                </div>

                {normalizedDiagnosis && (
                  <div className="bg-[#171717] border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
                    <div>
                      <p className="text-sm text-[#A3A3A3] mb-1">Comprensión</p>
                      <p className="text-white">{normalizedDiagnosis.understanding}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#A3A3A3] mb-1">Hallazgo principal</p>
                      <p className="text-white font-medium text-lg">{normalizedDiagnosis.mainFinding}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#A3A3A3] mb-1">Oportunidad</p>
                      <p className="text-white">{normalizedDiagnosis.opportunity}</p>
                    </div>
                  </div>
                )}

                {normalizedPlanRecommendation && (
                  <div className={`border rounded-2xl p-6 mb-6 ${normalizedPlanRecommendation.borderClass} ${normalizedPlanRecommendation.boxClass}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                      <div>
                        <p className="text-sm text-[#A3A3A3] mb-1">Nivel recomendado</p>
                        <h3 className="text-xl text-white font-medium">
                          Plan {normalizedPlanRecommendation.planLabel} · {normalizedPlanRecommendation.planName}
                        </h3>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-medium ${normalizedPlanRecommendation.badgeClass}`}>
                        {normalizedPlanRecommendation.scoreTotal}/20
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-[#A3A3A3] mb-1">Motivo</p>
                        <p className="text-white">{normalizedPlanRecommendation.reason}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#A3A3A3] mb-1">Por qué no basta el nivel inferior</p>
                        <p className="text-white">{normalizedPlanRecommendation.whyNotLower}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#A3A3A3] mb-1">Qué desbloquea</p>
                        <p className="text-white">{normalizedPlanRecommendation.unlocks}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 mb-5">
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

                    <button
                      onClick={() =>
                        navigate('/dashboard/billing', {
                          state: {
                            suggestedPlan: normalizedPlanRecommendation.planId,
                            fromProjectId: project.project_id
                          }
                        })
                      }
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      {normalizedPlanRecommendation.ctaLabel}
                      <ArrowRight weight="bold" />
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={goToProject}
                    className="btn-secondary flex-1"
                    data-testid="view-project-btn"
                  >
                    Ver proyecto
                  </button>
                  {user?.plan === 'free' ? (
                    <button
                      onClick={() =>
                        navigate('/dashboard/billing', {
                          state: {
                            suggestedPlan: normalizedPlanRecommendation?.planId || 'blueprint',
                            fromProjectId: project.project_id
                          }
                        })
                      }
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                      data-testid="unlock-blueprint-btn"
                    >
                      <Lock size={16} />
                      {normalizedPlanRecommendation?.ctaLabel || 'Desbloquear Blueprint'}
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateBlueprint}
                      disabled={loading}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                      data-testid="generate-blueprint-btn"
                    >
                      {loading ? (
                        <div className="spinner w-4 h-4"></div>
                      ) : (
                        <>
                          <Sparkle size={16} weight="fill" />
                          Generar Blueprint
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'blueprint' && project?.blueprint && (
              <motion.div
                key="blueprint"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <Sparkle size={48} weight="fill" className="text-[#0F5257] mx-auto mb-4" />
                  <h2 className="text-2xl font-light text-white mb-2" data-testid="blueprint-title">
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
                        {project.blueprint.priorities.map((p, i) => (
                          <li key={`priority-${i}-${p.substring(0, 20)}`} className="flex items-start gap-3 text-white">
                            <span className="w-6 h-6 rounded-full bg-[#0F5257]/20 text-[#0F5257] text-sm flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            {p}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {project.blueprint.deployment_steps && (
                    <div>
                      <p className="text-sm text-[#A3A3A3] mb-3">Plan de despliegue</p>
                      <ol className="space-y-2">
                        {project.blueprint.deployment_steps.map((s, i) => (
                          <li key={`deploy-${i}-${s.substring(0, 20)}`} className="flex items-center gap-2 text-white">
                            <CheckCircle size={16} className="text-[#0F5257]" />
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {project.blueprint.timeline_estimate && (
                    <div className="p-4 bg-[#0F5257]/10 rounded-lg">
                      <p className="text-sm text-[#0F5257]">Tiempo estimado</p>
                      <p className="text-white font-medium">{project.blueprint.timeline_estimate}</p>
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

export default Flow;
