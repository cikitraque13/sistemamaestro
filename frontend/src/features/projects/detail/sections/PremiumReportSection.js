import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Lock,
  Sparkle
} from '@phosphor-icons/react';

import SnapshotCard from '../components/SnapshotCard';

const PreviewSignal = ({ children }) => {
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-[#0A0A0A] border border-amber-500/12 text-[#E7D8BB]">
      {children}
    </span>
  );
};

const PremiumReportSection = ({
  project,
  reportView,
  continuityMeta
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
                Base premium activa en proyecto. Aquí solo se muestra una lectura orientativa y la entrada a la vista previa premium.
              </p>
            </div>

            <div className="flex flex-col gap-3 min-w-[270px]">
              <div className="rounded-xl border border-white/5 bg-[#111111] px-4 py-4">
                <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
                  Estado del informe
                </p>
                <p className="text-white">Vista base activa en proyecto</p>
                <p className="text-sm text-[#A3A3A3] mt-2">
                  El desarrollo completo se reserva a la vista previa premium y al desbloqueo puntual.
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

          <div className="rounded-2xl border border-amber-500/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_28%),linear-gradient(180deg,#151311_0%,#101010_100%)] p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/18">
                <Lock size={20} className="text-amber-200" />
              </div>

              <div>
                <p className="text-sm text-amber-200/80 mb-1">
                  Capa premium protegida
                </p>
                <h4 className="text-xl text-white font-medium mb-2">
                  El proyecto no expone todavía la lectura completa
                </h4>
                <p className="text-[#E3D7C3] leading-relaxed max-w-3xl">
                  En esta vista solo orientamos el caso. La lectura desarrollada, las dimensiones, las acciones completas y la exportación se activan desde la vista previa premium del informe.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <PreviewSignal>Resumen ejecutivo</PreviewSignal>
              <PreviewSignal>Diagnóstico central</PreviewSignal>
              <PreviewSignal>Lectura por dimensiones</PreviewSignal>
              <PreviewSignal>Acciones prioritarias</PreviewSignal>
              <PreviewSignal>Exportación PDF</PreviewSignal>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#111111] px-4 py-4">
              <p className="text-sm text-[#D4D4D4] leading-relaxed">
                La continuidad comercial sigue centralizada en el bloque de nivel recomendado. Aquí solo se mantiene una entrada limpia a la experiencia premium.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PremiumReportSection;
