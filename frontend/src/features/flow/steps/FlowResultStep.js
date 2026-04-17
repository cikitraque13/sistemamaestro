import React from 'react';
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Lightning,
  Lock,
  SpeakerHigh,
  Stop,
  Sparkle
} from '@phosphor-icons/react';
import { ROUTE_NAMES } from '../flow.constants';

const ROUTE_DESCRIPTION_FALLBACKS = {
  improve: 'Analizamos un activo existente y detectamos fricciones que afectan claridad, captación o conversión.',
  sell: 'Estructuramos la propuesta comercial y detectamos oportunidades de monetización.',
  automate: 'Identificamos cuellos de botella operativos y oportunidades de automatización.',
  idea: 'Convertimos una idea en una dirección de proyecto con potencial de validación y crecimiento.',
  improve_existing: 'Analizamos tu activo existente y te mostramos cómo mejorarlo.',
  sell_and_charge: 'Estructuramos tu propuesta comercial con el flujo correcto.',
  automate_operation: 'Identificamos cuellos de botella y proponemos automatización.',
  idea_to_project: 'Convertimos tu idea en un proyecto digital monetizable.'
};

const PreviewSignal = ({ children }) => {
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-[#0A0A0A] border border-amber-500/12 text-[#E7D8BB]">
      {children}
    </span>
  );
};

const FlowResultStep = (props) => {
  const {
    project,
    normalizedDiagnosis,
    normalizedPlanRecommendation,
    userPlan,
    loading,
    voiceSupported,
    isSpeaking,
    onPlayDiagnosis,
    onGoToProject,
    onOpenPremiumPreview,
    onOpenStrategicBilling,
    onGenerateBlueprint
  } = props;

  const isFree = !userPlan || userPlan === 'free';

  const safeRoute = project && project.route ? project.route : 'idea';
  const routeName = ROUTE_NAMES[safeRoute] || safeRoute || 'Ruta detectada';
  const routeDescription =
    ROUTE_DESCRIPTION_FALLBACKS[safeRoute] ||
    'Ruta generada según el análisis actual del proyecto.';

  const safeDiagnosis = normalizedDiagnosis || {
    understanding: 'El sistema ha generado una lectura inicial del caso.',
    mainFinding: 'Sin hallazgo principal disponible todavía.',
    opportunity: 'Sin oportunidad principal disponible todavía.'
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <CheckCircle
          size={48}
          weight="fill"
          className="text-[#0F5257] mx-auto mb-4"
        />
        <h2 className="text-2xl font-light text-white mb-2" data-testid="result-title">
          Tu diagnóstico está listo
        </h2>

        {voiceSupported ? (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={onPlayDiagnosis}
              disabled={typeof onPlayDiagnosis !== 'function'}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all disabled:opacity-50 ${
                isSpeaking
                  ? 'bg-[#0F5257] text-white'
                  : 'bg-[#262626] text-[#A3A3A3] hover:text-white'
              }`}
              data-testid="play-voice-btn"
            >
              {isSpeaking ? (
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
        ) : null}
      </div>

      <div className="bg-[#171717] border border-[#0F5257]/30 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#0F5257]/20 rounded-lg">
            <Lightning size={24} weight="fill" className="text-[#0F5257]" />
          </div>

          <div>
            <p className="text-sm text-[#A3A3A3] mb-1">Ruta recomendada</p>
            <h3 className="text-xl text-white font-medium">{routeName}</h3>
            <p className="text-[#A3A3A3] text-sm mt-1">{routeDescription}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#171717] border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
        <div>
          <p className="text-sm text-[#A3A3A3] mb-1">Comprensión</p>
          <p className="text-white">{safeDiagnosis.understanding}</p>
        </div>

        <div>
          <p className="text-sm text-[#A3A3A3] mb-1">Hallazgo principal</p>
          <p className="text-white font-medium text-lg">{safeDiagnosis.mainFinding}</p>
        </div>

        <div>
          <p className="text-sm text-[#A3A3A3] mb-1">Primer foco de mejora</p>
          <p className="text-white">{safeDiagnosis.opportunity}</p>
        </div>
      </div>

      {isFree ? (
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_28%),linear-gradient(180deg,#151311_0%,#101010_100%)] p-6 mb-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0" />

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-stretch">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-200 text-xs font-medium border border-amber-500/20 mb-4">
                  <FileText size={14} weight="fill" />
                  Primer desbloqueo recomendado · 6,99 €
                </div>

                <h3 className="text-2xl text-white font-medium mb-3">
                  Vista previa del informe puntual
                </h3>

                <p className="text-[#E3D7C3] leading-relaxed mb-5 max-w-2xl">
                  Aquí no entregamos todavía el documento final. Primero te mostramos una
                  vista premium controlada para que percibas nivel, estructura y valor real
                  antes de desbloquearlo.
                </p>

                <div className="flex flex-wrap gap-2">
                  <PreviewSignal>Validación puntual</PreviewSignal>
                  <PreviewSignal>Lectura más útil</PreviewSignal>
                  <PreviewSignal>Primer foco de mejora</PreviewSignal>
                  <PreviewSignal>Prompt de avance</PreviewSignal>
                  <PreviewSignal>Exportación PDF</PreviewSignal>
                </div>
              </div>

              <div className="bg-[#090909] border border-amber-500/14 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-amber-200/70 mb-2">
                    Qué desbloquea el 6,99
                  </p>

                  <p className="text-white text-lg leading-relaxed mb-4">
                    Un informe puntual descargable, más serio, más útil y ya orientado a
                    acción, sin regalarlo antes de tiempo.
                  </p>

                  <div className="rounded-xl border border-white/5 bg-[#111111] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
                      Siguiente paso correcto
                    </p>
                    <p className="text-sm text-white">
                      Abrir la vista previa premium y decidir desde ahí si activas el documento final.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onOpenPremiumPreview}
                  disabled={typeof onOpenPremiumPreview !== 'function'}
                  className="w-full mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[linear-gradient(180deg,#3F3728_0%,#30291F_100%)] text-white hover:brightness-110 transition-all border border-amber-500/20 disabled:opacity-50"
                  data-testid="open-premium-preview-btn"
                >
                  Ver vista previa PDF premium
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#131313_0%,#0D0D0D_100%)] p-5 mb-6">
            <p className="text-sm text-[#A3A3A3] mb-3">Salida secundaria</p>

            <button
              onClick={onGoToProject}
              disabled={typeof onGoToProject !== 'function'}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-white/12 bg-[#090909] text-white text-lg font-medium hover:bg-[#111111] hover:border-white/18 transition-all disabled:opacity-50"
              data-testid="view-project-btn"
            >
              Ver proyecto
            </button>

            <p className="text-sm text-[#8F8F8F] mt-3">
              Accede al caso base sin abrir todavía la capa completa del informe puntual.
            </p>
          </div>

          {normalizedPlanRecommendation ? (
            <div
              className={`border rounded-2xl p-6 ${normalizedPlanRecommendation.borderClass} ${normalizedPlanRecommendation.boxClass}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-sm text-[#A3A3A3] mb-1">
                    Continuidad estratégica posterior
                  </p>
                  <h3 className="text-xl text-white font-medium">
                    Plan {normalizedPlanRecommendation.planLabel} · {normalizedPlanRecommendation.planName}
                  </h3>
                </div>

                <div className={`px-4 py-2 rounded-full text-sm font-medium ${normalizedPlanRecommendation.badgeClass}`}>
                  {normalizedPlanRecommendation.scoreTotal || 0}/20
                </div>
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <p className="text-sm text-[#A3A3A3] mb-1">Motivo</p>
                  <p className="text-white">{normalizedPlanRecommendation.reason}</p>
                </div>

                <div>
                  <p className="text-sm text-[#A3A3A3] mb-1">Qué desbloquea después</p>
                  <p className="text-white">{normalizedPlanRecommendation.unlocks}</p>
                </div>
              </div>

              <button
                onClick={onOpenStrategicBilling}
                disabled={typeof onOpenStrategicBilling !== 'function'}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-[linear-gradient(180deg,#4A3310_0%,#352108_100%)] text-white text-lg font-medium border border-amber-500/24 hover:brightness-110 transition-all disabled:opacity-50"
                data-testid="open-strategic-billing-btn"
              >
                Ver continuidad estratégica
                <ArrowRight weight="bold" />
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div>
          <div className="rounded-2xl border border-[#0F5257]/22 bg-[linear-gradient(180deg,#111111_0%,#0F1414_100%)] p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#0F5257]/20 rounded-lg">
                <Sparkle size={20} weight="fill" className="text-[#8DE1D0]" />
              </div>

              <div className="flex-1">
                <p className="text-sm text-[#A3A3A3] mb-1">Siguiente capa disponible</p>
                <h3 className="text-xl text-white font-medium mb-2">
                  Generar blueprint estructural
                </h3>
                <p className="text-[#C8D0CC] leading-relaxed mb-5">
                  Tu plan ya permite pasar del diagnóstico a una salida más operativa, con prioridades, arquitectura y despliegue.
                </p>

                <button
                  onClick={onGenerateBlueprint}
                  disabled={loading || typeof onGenerateBlueprint !== 'function'}
                  className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
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
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#131313_0%,#0D0D0D_100%)] p-5">
            <button
              onClick={onGoToProject}
              disabled={typeof onGoToProject !== 'function'}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-white/12 bg-[#090909] text-white text-lg font-medium hover:bg-[#111111] hover:border-white/18 transition-all disabled:opacity-50"
              data-testid="view-project-btn"
            >
              Ver proyecto
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowResultStep;
