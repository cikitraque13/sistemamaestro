import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Lock,
  Sparkle
} from '@phosphor-icons/react';

import SnapshotCard from '../components/SnapshotCard';

const PremiumReportSection = ({
  project,
  reportView,
  continuityMeta
}) => {
  if (!project || !reportView) return null;

  const continuityLabel = continuityMeta?.label || 'Seguir analizando';

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
                Lectura base del caso
              </h3>

              <p className="text-[#A3A3A3] max-w-3xl">
                Aquí mantenemos la orientación esencial del proyecto, las señales clave y la entrada correcta a la capa premium.
              </p>
            </div>

            <div className="flex flex-col gap-3 min-w-[290px]">
              <div className="rounded-xl border border-white/5 bg-[#111111] px-4 py-4">
                <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
                  Estado del caso
                </p>
                <p className="text-white">Lectura base disponible en proyecto</p>
                <p className="text-sm text-[#A3A3A3] mt-2">
                  La vista previa premium controla el acceso al informe ampliado y a la exportación final.
                </p>
              </div>

              <Link
                to={`/dashboard/project/${project.project_id}/report-preview`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0F5257]/25 bg-[linear-gradient(180deg,rgba(15,82,87,0.16),rgba(15,82,87,0.08))] px-4 py-3 text-[#8DE1D0] hover:bg-[linear-gradient(180deg,rgba(15,82,87,0.22),rgba(15,82,87,0.12))] transition-colors"
              >
                <FileText size={18} />
                Abrir vista previa premium
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
              value={continuityLabel}
              accent="violet"
            />
          </div>

          <div className="rounded-[28px] border border-amber-500/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_26%),linear-gradient(180deg,#151311_0%,#101010_100%)] p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl border border-amber-500/20 bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Lock size={22} className="text-amber-200" />
              </div>

              <div>
                <p className="text-sm text-amber-300 mb-1">Capa premium protegida</p>
                <h4 className="text-2xl text-white font-medium mb-3">
                  El proyecto no expone todavía la lectura completa
                </h4>
                <p className="text-[#E5D9C7] leading-relaxed max-w-4xl">
                  En esta vista solo orientamos el caso. La validación puntual, la lectura más útil,
                  el primer foco de mejora, el prompt de avance y la exportación se activan desde la vista previa premium del informe.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-5">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-[#0A0A0A] border border-amber-500/16 text-[#F0E2CA]">
                Validación puntual
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-[#0A0A0A] border border-amber-500/16 text-[#F0E2CA]">
                Lectura más útil
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-[#0A0A0A] border border-amber-500/16 text-[#F0E2CA]">
                Primer foco de mejora
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-[#0A0A0A] border border-amber-500/16 text-[#F0E2CA]">
                Prompt de avance
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-[#0A0A0A] border border-amber-500/16 text-[#F0E2CA]">
                Exportación PDF
              </span>
            </div>

            <div className="rounded-2xl border border-white/6 bg-[#0B0B0B] px-5 py-4">
              <p className="text-[#D8D0C3] leading-relaxed">
                La continuidad comercial sigue centralizada en el bloque de nivel recomendado.
                Aquí solo se mantiene una entrada limpia a la experiencia premium.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PremiumReportSection;
