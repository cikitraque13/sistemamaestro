import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Sparkle
} from '@phosphor-icons/react';

const GOLD_FEATURES = [
  'Diagnóstico premium del caso',
  'Blueprint de activación',
  'Prompt recomendado para empezar',
  '10 gemas iniciales para Builder'
];

const EntryOfferCard = ({
  selectedEntryOffer,
  processingKey,
  onEntryOfferCheckout,
  isFocused = false
}) => {
  if (!selectedEntryOffer) return null;

  const priceLabel = selectedEntryOffer.priceLabel || '6,99 €';
  const periodLabel = selectedEntryOffer.periodLabel || 'PAGO ÚNICO';
  const isProcessing = processingKey === `offer:${selectedEntryOffer.id}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 }}
      className={`mb-8 ${isFocused ? 'rounded-[28px] ring-2 ring-amber-300/30' : ''}`}
      data-testid="entry-offer-card"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-amber-200/15 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,#15120D_0%,#090909_100%)] p-6 sm:p-8">
        <div className="absolute right-[-120px] top-[-140px] h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-[-140px] left-[-110px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
                <Sparkle size={14} weight="fill" />
                Informe Gold
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                <Sparkle size={14} weight="fill" />
                10 gemas iniciales
              </span>

              <span className="text-sm font-medium text-amber-100/85">
                {priceLabel} · {periodLabel.toLowerCase()}
              </span>
            </div>

            <h2 className="mb-4 max-w-3xl text-3xl font-light leading-tight text-white sm:text-4xl">
              Informe Maestro Gold
            </h2>

            <p className="mb-5 max-w-2xl text-base leading-7 text-[#D4D4D4]">
              Compra puntual para convertir una idea, una URL o una oportunidad
              en una lectura premium con diagnóstico, dirección, prompt recomendado
              y 10 gemas iniciales para empezar en Builder.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {GOLD_FEATURES.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <CheckCircle
                    size={17}
                    weight="fill"
                    className="mt-0.5 flex-shrink-0 text-[#8DE1D0]"
                  />

                  <span className="text-sm leading-6 text-white">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-black/30 p-5 sm:p-6">
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-500/10">
                <FileText size={24} className="text-amber-200" />
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100">
                Activación puntual
              </p>

              <div className="mb-3 flex items-end gap-2">
                <span className="text-5xl font-light text-white">
                  {priceLabel}
                </span>
                <span className="pb-2 text-sm text-[#A3A3A3]">
                  pago único
                </span>
              </div>

              <div className="mb-5 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-cyan-100">
                Incluye 10 gemas iniciales
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8DE1D0]">
                  Qué estás activando
                </p>

                <p className="text-sm leading-6 text-[#D4D4D4]">
                  Una lectura premium más útil que un resumen: ordena el caso,
                  detecta la fricción principal, entrega un prompt preparado y
                  activa 10 gemas iniciales para empezar en Builder.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={onEntryOfferCheckout}
                disabled={isProcessing}
                data-testid="entry-offer-cta"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#F8D98B_0%,#F2A1B7_100%)] px-5 py-4 text-base font-semibold text-black shadow-[0_18px_50px_rgba(245,158,11,0.18)] transition-all hover:translate-y-[-1px] hover:shadow-[0_22px_60px_rgba(245,158,11,0.24)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isProcessing ? (
                  'Abriendo checkout...'
                ) : (
                  <>
                    Comprar Informe Gold
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-[#A3A3A3]">
                Después de la compra, volverás al informe o al proyecto activo
                con el prompt y las gemas iniciales para continuar hacia Builder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default EntryOfferCard;