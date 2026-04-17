import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FileText } from '@phosphor-icons/react';

const EntryOfferCard = ({
  selectedEntryOffer,
  processingKey,
  onEntryOfferCheckout,
  isFocused = false
}) => {
  if (!selectedEntryOffer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className={`mb-10 ${isFocused ? 'ring-2 ring-amber-400/30 rounded-2xl' : ''}`}
      data-testid="entry-offer-card"
    >
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_28%),linear-gradient(180deg,#141311_0%,#0F0F0F_100%)] p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0" />

        <div className="grid lg:grid-cols-[1.18fr_0.82fr] gap-6 items-stretch">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-200 text-xs font-medium border border-amber-500/20">
                {selectedEntryOffer.badge}
              </span>
              <span className="text-xs uppercase tracking-wider text-[#C8B898]">
                {selectedEntryOffer.priceLabel} · {selectedEntryOffer.periodLabel}
              </span>
            </div>

            <h3 className="text-[2rem] leading-tight font-medium text-white mb-3">
              {selectedEntryOffer.headline}
            </h3>

            <p className="text-[#ECE7DD] text-lg leading-relaxed mb-4 max-w-2xl">
              {selectedEntryOffer.description}
            </p>

            <p className="text-sm text-[#D9C8A2] mb-4 max-w-2xl">
              Reduce dudas, ordena el caso y prepara el siguiente paso.
            </p>

            <p className="text-sm text-[#B9B1A3] mb-6 max-w-2xl">
              {selectedEntryOffer.valuePromise}
            </p>

            <div className="flex flex-wrap gap-2 mt-auto">
              {(selectedEntryOffer.billingHighlights || selectedEntryOffer.features)
                .slice(0, 4)
                .map((feature) => (
                  <span
                    key={feature}
                    className="px-3 py-2 rounded-full text-xs bg-[#0A0A0A] border border-amber-500/14 text-[#F0E2C5]"
                  >
                    {feature}
                  </span>
                ))}
            </div>
          </div>

          <div className="bg-[#090909] border border-amber-500/15 rounded-2xl p-5 flex flex-col shadow-[0_0_0_1px_rgba(245,158,11,0.04)]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-100 text-xs font-medium border border-amber-500/20 mb-4 self-start">
              <FileText size={14} weight="fill" />
              Compra puntual
            </div>

            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-5xl font-light text-white">
                {selectedEntryOffer.priceLabel}
              </span>
              <span className="text-amber-100/75">{selectedEntryOffer.periodLabel}</span>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#111111] px-4 py-4 mb-4">
              <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3] mb-1">
                Rol dentro del sistema
              </p>
              <p className="text-sm text-white">
                Puente transaccional antes de entrar en continuidad.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-[linear-gradient(180deg,#181308_0%,#120F07_100%)] px-4 py-4 mb-5">
              <p className="text-[11px] uppercase tracking-wide text-amber-200/75 mb-1">
                Qué activa
              </p>
              <p className="text-sm text-[#F2E7D1]">
                Informe premium inicial, lectura más útil y primer paso accionable.
              </p>
            </div>

            <button
              onClick={onEntryOfferCheckout}
              disabled={processingKey === `offer:${selectedEntryOffer.id}`}
              className="w-full py-3 rounded-lg font-medium bg-[linear-gradient(180deg,#3F3728_0%,#30291F_100%)] text-white hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-auto border border-amber-500/15"
              data-testid="entry-offer-cta"
            >
              {processingKey === `offer:${selectedEntryOffer.id}` ? (
                <div className="spinner w-4 h-4"></div>
              ) : (
                <>
                  {selectedEntryOffer.cta.label}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EntryOfferCard;
