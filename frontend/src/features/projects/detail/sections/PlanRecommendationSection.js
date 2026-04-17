import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';

const PlanRecommendationSection = ({
  projectId,
  normalizedPlanRecommendation
}) => {
  if (!normalizedPlanRecommendation) return null;

  return (
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

        <div
          className={`px-4 py-2 rounded-full text-sm font-medium ${normalizedPlanRecommendation.badgeClass}`}
        >
          Plan {normalizedPlanRecommendation.planLabel} · {normalizedPlanRecommendation.planName}
        </div>
      </div>

      <div
        className={`rounded-xl p-4 mb-5 border ${normalizedPlanRecommendation.borderClass} ${normalizedPlanRecommendation.boxClass}`}
      >
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
          <p className="text-white font-medium">
            {normalizedPlanRecommendation.scores.complexity ?? 0}/4
          </p>
        </div>

        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <p className="text-xs text-[#A3A3A3] mb-1">Impacto</p>
          <p className="text-white font-medium">
            {normalizedPlanRecommendation.scores.economic_impact ?? 0}/4
          </p>
        </div>

        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <p className="text-xs text-[#A3A3A3] mb-1">Urgencia</p>
          <p className="text-white font-medium">
            {normalizedPlanRecommendation.scores.urgency ?? 0}/4
          </p>
        </div>

        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <p className="text-xs text-[#A3A3A3] mb-1">Estructura</p>
          <p className="text-white font-medium">
            {normalizedPlanRecommendation.scores.structure_need ?? 0}/4
          </p>
        </div>

        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <p className="text-xs text-[#A3A3A3] mb-1">Continuidad</p>
          <p className="text-white font-medium">
            {normalizedPlanRecommendation.scores.continuity_need ?? 0}/4
          </p>
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
            fromProjectId: projectId,
            focusSection: 'plans'
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          {normalizedPlanRecommendation.ctaLabel}
          <ArrowRight size={16} />
        </Link>
      </div>
    </motion.div>
  );
};

export default PlanRecommendationSection;
