import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  DiamondsFour,
  FileText,
  Flag,
  Lightning,
  Sparkle
} from '@phosphor-icons/react';

import SnapshotCard from '../components/SnapshotCard';
import SignalList from '../components/SignalList';
import {
  DIMENSION_STATUS_META,
  PRIORITY_META
} from '../projectDetail.constants';

const PremiumReportSection = ({
  project,
  reportView,
  dimensionCounters,
  continuityMeta,
  continuityPlanId,
  normalizedPlanRecommendation
}) => {
  if (!project || !reportView) return null;

  return (
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

            <div className="flex flex-col gap-3 min-w-[270px]">
              <div className="rounded-xl border border-white/5 bg-[#111111] px-4 py-4">
                <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
                  Estado del informe
                </p>
                <p className="text-white">Base premium activa en proyecto</p>
                <p className="text-sm text-[#A3A3A3] mt-2">
                  Preparado para evolucionar a PDF sin rehacer arquitectura.
                </p>
              </div>

              <Link
                to={`/dashboard/project/${project.project_id}/report-preview`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0F5257]/25 bg-[#0F5257]/10 px-4 py-3 text-[#8DE1D0] hover:bg-[#0F5257]/15 transition-colors"
              >
                <FileText size={18} />
                Vista previa PDF premium
              </Link>
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

              {reportView.continuityRecommendation || normalizedPlanRecommendation ? (
                <>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${continuityMeta.badgeClass}`}>
                      {continuityMeta.label}
                    </span>
                  </div>

                  <p className="text-white mb-5 leading-relaxed">
                    {reportView.continuityRecommendation?.reason ||
                      normalizedPlanRecommendation?.reason ||
                      'Sin recomendación de continuidad disponible.'}
                  </p>

                  {normalizedPlanRecommendation ? (
                    <div className="rounded-lg border border-white/5 bg-[#111111] px-4 py-3">
                      <p className="text-sm text-[#D4D4D4]">
                        La activación comercial se centraliza en el bloque “Nivel recomendado”
                        para mantener una única salida de continuidad.
                      </p>
                    </div>
                  ) : continuityPlanId ? (
                    <Link
                      to="/dashboard/billing"
                      state={{
                        suggestedPlan: continuityPlanId,
                        fromProjectId: project.project_id
                      }}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      {reportView.continuityRecommendation?.cta_label || continuityMeta.cta}
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
  );
};

export default PremiumReportSection;