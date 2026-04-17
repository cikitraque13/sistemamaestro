import React from 'react';
import { motion } from 'framer-motion';
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

const PreviewSignal = ({ children }) => (
  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-[#0A0A0A] border border-amber-500/12 text-[#E7D8BB]">
    {children}
  </span>
);

const StrategicContinuationCard = ({
  normalizedPlanRecommendation,
  onOpenStrategicBilling
}) => {
  if (!normalizedPlanRecommendation) return null;

  return (
    <div
      className={`border rounded-2xl p-6 ${normalizedPlanRecommendation.borderClass} ${normalizedPlanRecommendation.boxClass}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-sm text-[#A3A3A3] mb-1">Continuidad estratégica posterior</p>
          <h3 className="text-xl text-white font-medium">
            Plan {normalizedPlanRecommendation.planLabel} · {normalizedPlanRecommendation.planName}
          </h3>
        </div>

        <div
          className={`px-4 py-2 rounded-full text-sm font-medium ${normalizedPlanRecommendation.badgeClass}`}
        >
          {normalizedPlanRecommendation.scoreTotal ?? 0}/20
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-[#A3A3A3] mb-1">Motivo</p>
          <p className="text-white">{normalizedPlanRecommendation.reason}</p>
        </div>

        <div>
          <p className="text-sm text-[#A3A3A3] mb-1">Qué desbloquea después</p>
          <p className="text-white">{normalizedPlanRecommendation.unlocks}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 mb-5">
        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <p className="text-xs text-[#A3A3A3] mb-1">Complejidad</p>
          <p className="text-white font-medium">
            {normalizedPlanRecommendation.scores?.complexity ?? 0}/4
          </p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <p className="text-xs text-[#A3A3A3] mb-1">Impacto</p>
          <p className="text-white font-medium">
            {normalizedPlanRecommendation.scores?.economic_impact ?? 0}/4
          </p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <p className="text-xs text-[#A3A3A3] mb-1">Urgencia</p>
          <p className="text-white font-medium">
            {normalizedPlanRecommendation.scores?.urgency ?? 0}/4
          </p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <p className="text-xs text-[#A3A3A3] mb-1">Estructura</p>
          <p className="text-white font-medium">
            {normalizedPlanRecommendation.scores?.structure_need ?? 0}/4
          </p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <p className="text-xs text-[#A3A3A3] mb-1">Continuidad</p>
          <p className="text-white font-medium">
            {normalizedPlanRecommendation.scores?.continuity_need ?? 0}/4
          </p>
        </div>
      </div>

      <button
        onClick={onOpenStrategicBilling}
        disabled={typeof onOpenStrategicBilling !== 'function'}
        className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
        data-testid="open-strategic-billing-btn"
      >
        Ver continuidad estratégica
        <ArrowRight weight="bold" />
      </button>
    </div>
  );
};

const PremiumBridgeCard = ({ onOpenPremiumPreview }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_28%),linear-gradient(180deg,#151311_0%,#101010_100%)] p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0" />

      <div className="grid lg:grid-cols-[1.12fr_0.88fr] gap-6 items-stretch">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-200 text-xs font-medium border border-amber-500/20 mb-4">
            <FileText size={14} weight="fill" />
            Primer desbloqueo recomendado · 6,99 €
          </div>

          <h3 className="text-2xl text-white font-medium mb-3">
            Vista previa del informe PDF premium
          </h3>

          <p className="text-[#E3D7C3] leading-relaxed mb-5 max-w-2xl">
            Aquí cambia la percepción del usuario. Entras en una salida premium real, ves la
            estructura del informe y percibes su nivel profesional antes de decidir si lo
            desbloqueas completo.
          </p>

          <div className="flex flex-wrap gap-2">
            <PreviewSignal>Resumen ejecutivo</PreviewSignal>
            <PreviewSignal>Diagnóstico central</PreviewSignal>
            <PreviewSignal>Lectura por dimensiones</PreviewSignal>
            <PreviewSignal>Acciones prioritarias</PreviewSignal>
            <PreviewSignal>Exportación PDF</PreviewSignal>
          </div>
        </div>

        <div className="bg-[#090909] border border-amber-500/14 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-amber-200/70 mb-2">
              Qué activa
            </p>

            <p className="text-white text-lg leading-relaxed mb-4">
              Una vista premium controlada con efecto wow, lectura de alto nivel y acceso al
              desbloqueo del PDF completo.
            </p>

            <div className="rounded-xl border border-white/5 bg-[#111111] px-4 py-4">
              <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
                Siguiente paso correcto
              </p>
              <p className="text-sm text-white">
                Abrir la preview premium y empujar desde ahí al desbloqueo puntual.
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
  );
};

const PaidPlanActionCard = ({ onGenerateBlueprint, loading }) => {
  return (
    <div className="rounded-2xl border border-[#0F5257]/22 bg-[linear-gradient(180deg,#111111_0%,#0F1414_100%)] p-6">
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
            Tu plan ya permite pasar del diagnóstico a una salida más operativa, con prioridades,
            arquitectura y despliegue.
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
  );
};

const FlowResultStep = ({
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
}) => {
  const isFree = !userPlan || userPlan === 'free';
  const safeRoute = project?.route || 'idea';

  const routeName =
    ROUTE_NAMES[safeRoute] ||
    safeRoute ||
    'Ruta detectada';

  const routeDescription =
    ROUTE_DESCRIPTION_FALLBACKS[safeRoute] ||
    'Ruta generada según el análisis actual del proyecto.';

  const safeDiagnosis = normalizedDiagnosis || {
    understanding: 'El sistema ha generado una lectura inicial del caso.',
    mainFinding: 'Sin hallazgo principal disponible todavía.',
    opportunity: 'Sin oportunidad principal disponible todavía.'
  };

  return (
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

        {voiceSupported && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={onPlayDiagnosis}
              disabled={typeof onPlayDiagnosis !== 'function'}
             ={typeof onPlayDiagnosis !== 'function'}
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
        )}
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
          <p className="text-sm text-[#A3A3A3] mb-1">Oportunidad</p>
          <p className="text-white">{safeDiagnosis.opportunity}</p>
        </div>
      </div>

      {isFree ? (
        <>
          <div className="mb-6">
            <PremiumBridgeCard onOpenPremiumPreview={onOpenPremiumPreview} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={onGoToProject}
              disabled={typeof onGoToProject !== 'function'}
              className="btn-secondary flex-1 disabled:opacity-50"
              data-testid="view-project-btn"
            >
              Ver proyecto
            </button>

            <button
              onClick={onOpenPremiumPreview}
              disabled={typeof onOpenPremiumPreview !== 'function'}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="open-premium-preview-btn-secondary"
            >
              <Lock size={16} />
              Ver vista previa PDF premium
            </button>
          </div>

          <StrategicContinuationCard
            normalizedPlanRecommendation={normalizedPlanRecommendation}
            onOpenStrategicBilling={onOpenStrategicBilling}
          />
        </>
      ) : (
        <>
          <div className="mb-6">
            <PaidPlanActionCard
              onGenerateBlueprint={onGenerateBlueprint}
              loading={loading}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onGoToProject}
              disabled={typeof onGoToProject !== 'function'}
              className="btn-secondary flex-1 disabled:opacity-50"
              data-testid="view-project-btn"
            >
              Ver proyecto
            </button>

            <button
              onClick={onGenerateBlueprint}
              disabled={loading || typeof onGenerateBlueprint !== 'function'}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="generate-blueprint-btn-secondary"
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
        </>
      )}
    </motion.div>
  );
};

export default FlowResultStep;
