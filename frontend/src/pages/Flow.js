import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
  SpeakerHigh,
  SpeakerSlash
} from '@phosphor-icons/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Logo from '../components/Logo';
import { useVoice } from '../hooks/useVoice';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ROUTE_NAMES = {
  improve_existing: 'Mejorar algo existente',
  sell_and_charge: 'Vender y cobrar',
  automate_operation: 'Automatizar operación',
  idea_to_project: 'Idea a proyecto'
};

const ROUTE_DESCRIPTIONS = {
  improve_existing: 'Analizamos tu activo existente y te mostramos cómo mejorarlo.',
  sell_and_charge: 'Estructuramos tu propuesta comercial con el flujo correcto.',
  automate_operation: 'Identificamos cuellos de botella y proponemos automatización.',
  idea_to_project: 'Convertimos tu idea en un proyecto digital monetizable.'
};

const Flow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { step: urlStep } = useParams();
  const { user } = useAuth();
  
  const [step, setStep] = useState(urlStep || 'input');
  const [inputType, setInputType] = useState(location.state?.inputType || 'text');
  const [inputContent, setInputContent] = useState(location.state?.inputContent || '');
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [refineAnswers, setRefineAnswers] = useState({});

  // Voice functionality
  const voice = useVoice();

  // Update input when voice transcript changes
  useEffect(() => {
    if (voice.transcript && inputType === 'text') {
      setInputContent(voice.transcript);
    }
  }, [voice.transcript, inputType]);

  // Speak diagnosis when result is ready
  useEffect(() => {
    if (step === 'result' && project?.diagnosis && voice.voiceEnabled) {
      const textToSpeak = `${project.diagnosis.understanding}. Hallazgo principal: ${project.diagnosis.main_finding}. ${project.next_step || ''}`;
      setTimeout(() => voice.speak(textToSpeak), 500);
    }
  }, [step, project]);

  // Update URL when step changes
  useEffect(() => {
    if (step !== 'input') {
      window.history.replaceState(null, '', `/flow/${step}`);
    }
  }, [step]);

  const handleAnalyze = async () => {
    if (!inputContent.trim()) {
      toast.error('Por favor, ingresa una descripción o URL');
      return;
    }

    setLoading(true);
    setStep('interpreting');

    try {
      const response = await axios.post(
        `${API_URL}/api/projects`,
        {
          input_type: inputType,
          input_content: inputContent
        },
        { withCredentials: true }
      );

      setProject(response.data);
      
      // Small delay for UX
      setTimeout(() => {
        if (response.data.refine_questions?.length > 0) {
          setStep('refine');
        } else {
          setStep('result');
        }
      }, 1500);
    } catch (error) {
      toast.error('Error al analizar. Intenta de nuevo.');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleRefineSubmit = async () => {
    if (!project) return;

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/projects/${project.project_id}/refine`,
        {
          project_id: project.project_id,
          answers: refineAnswers
        },
        { withCredentials: true }
      );

      setProject(response.data);
      setStep('result');
    } catch (error) {
      toast.error('Error al guardar respuestas');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBlueprint = async () => {
    if (!project) return;

    if (user?.plan === 'free') {
      toast.error('Necesitas el plan Blueprint o superior');
      navigate('/dashboard/billing');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/projects/${project.project_id}/blueprint`,
        {},
        { withCredentials: true }
      );

      setProject(response.data);
      setStep('blueprint');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al generar blueprint');
    } finally {
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
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

      {/* Progress */}
      <div className="border-b border-[#262626]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {['input', 'interpreting', 'refine', 'result', 'blueprint'].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${
                  step === s ? 'text-[#0F5257]' : 
                  ['input', 'interpreting', 'refine', 'result', 'blueprint'].indexOf(step) > i 
                    ? 'text-[#0F5257]' 
                    : 'text-[#A3A3A3]'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    step === s ? 'bg-[#0F5257] text-white' :
                    ['input', 'interpreting', 'refine', 'result', 'blueprint'].indexOf(step) > i
                      ? 'bg-[#0F5257]/30 text-[#0F5257]'
                      : 'bg-[#262626] text-[#A3A3A3]'
                  }`}>
                    {['input', 'interpreting', 'refine', 'result', 'blueprint'].indexOf(step) > i ? (
                      <CheckCircle size={14} weight="fill" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm">
                    {s === 'input' ? 'Entrada' :
                     s === 'interpreting' ? 'Interpretando' :
                     s === 'refine' ? 'Afinado' :
                     s === 'result' ? 'Resultado' : 'Blueprint'}
                  </span>
                </div>
                {i < 4 && <div className="flex-1 h-px bg-[#262626]"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Input */}
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

                {/* Input Module */}
                <div className="bg-[#171717] border border-white/10 rounded-2xl p-6">
                  {/* Tabs */}
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

                  {/* Input Field */}
                  {inputType === 'text' ? (
                    <div className="relative">
                      <textarea
                        value={inputContent}
                        onChange={(e) => setInputContent(e.target.value)}
                        placeholder={voice.isListening ? "Escuchando..." : "Describe tu idea, necesidad o problema que quieres resolver..."}
                        className={`w-full h-40 bg-[#0A0A0A] border rounded-lg px-4 py-3 pr-14 text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F5257] focus:ring-1 focus:ring-[#0F5257]/50 transition-all resize-none ${
                          voice.isListening ? 'border-red-500/50 animate-pulse' : 'border-white/10'
                        }`}
                        data-testid="input-text"
                      />
                      {/* Voice Button */}
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

            {/* Step 2: Interpreting */}
            {step === 'interpreting' && (
              <motion.div
                key="interpreting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <div className="spinner mx-auto mb-6"></div>
                <h2 className="text-xl text-white mb-2">Interpretando tu necesidad...</h2>
                <p className="text-[#A3A3A3]">Esto solo tomará unos segundos</p>
              </motion.div>
            )}

            {/* Step 3: Refine */}
            {step === 'refine' && project?.refine_questions && (
              <motion.div
                key="refine"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F5257]/20 text-[#0F5257] rounded-full text-sm mb-4">
                    <Lightning weight="fill" />
                    {ROUTE_NAMES[project.route]}
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
                        onChange={(e) => setRefineAnswers({
                          ...refineAnswers,
                          [q.id]: e.target.value
                        })}
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

            {/* Step 4: Result */}
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
                  {/* Voice Control */}
                  {voice.isSupported && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <button
                        onClick={() => {
                          if (voice.isSpeaking) {
                            voice.stopSpeaking();
                          } else if (project.diagnosis) {
                            const textToSpeak = `${project.diagnosis.understanding}. Hallazgo principal: ${project.diagnosis.main_finding}. ${project.next_step || ''}`;
                            voice.speak(textToSpeak);
                          }
                        }}
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
                      <button
                        onClick={voice.toggleVoice}
                        className={`p-2 rounded-lg transition-all ${
                          voice.voiceEnabled 
                            ? 'bg-[#262626] text-[#0F5257]' 
                            : 'bg-[#262626] text-[#A3A3A3]'
                        }`}
                        title={voice.voiceEnabled ? 'Voz automática activada' : 'Voz automática desactivada'}
                      >
                        {voice.voiceEnabled ? <SpeakerHigh size={18} /> : <SpeakerSlash size={18} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Route Badge */}
                <div className="bg-[#171717] border border-[#0F5257]/30 rounded-2xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#0F5257]/20 rounded-lg">
                      <Lightning size={24} weight="fill" className="text-[#0F5257]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#A3A3A3] mb-1">Ruta recomendada</p>
                      <h3 className="text-xl text-white font-medium">{ROUTE_NAMES[project.route]}</h3>
                      <p className="text-[#A3A3A3] text-sm mt-1">{ROUTE_DESCRIPTIONS[project.route]}</p>
                    </div>
                  </div>
                </div>

                {/* Diagnosis */}
                {project.diagnosis && (
                  <div className="bg-[#171717] border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
                    <div>
                      <p className="text-sm text-[#A3A3A3] mb-1">Comprensión</p>
                      <p className="text-white">{project.diagnosis.understanding}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#A3A3A3] mb-1">Hallazgo principal</p>
                      <p className="text-white font-medium text-lg">"{project.diagnosis.main_finding}"</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#A3A3A3] mb-1">Oportunidad</p>
                      <p className="text-white">{project.diagnosis.opportunity}</p>
                    </div>
                  </div>
                )}

                {/* Next Step */}
                {project.next_step && (
                  <div className="bg-[#0F5257]/10 border border-[#0F5257]/30 rounded-2xl p-6 mb-6">
                    <p className="text-sm text-[#0F5257] mb-1">Siguiente paso recomendado</p>
                    <p className="text-white">{project.next_step}</p>
                  </div>
                )}

                {/* Actions */}
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
                      onClick={() => navigate('/dashboard/billing')}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                      data-testid="unlock-blueprint-btn"
                    >
                      <Lock size={16} />
                      Desbloquear Blueprint
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

            {/* Step 5: Blueprint */}
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
                          <li key={i} className="flex items-start gap-3 text-white">
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
                          <li key={i} className="flex items-center gap-2 text-white">
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
