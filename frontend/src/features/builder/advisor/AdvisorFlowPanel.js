import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChatCircle, Phone, X } from '@phosphor-icons/react';

import NovaAvatar from '../../home/voice/NovaAvatar';
import '../../home/voice/novaDemo.css';
import { findBuilderNovaChat, focusBuilderNovaChat, safeHttpUrl, visibleTestimonials } from './advisorFlowConfig';

const CALL_POINTS = [
  'Hablas con una persona real, en una llamada en vivo.',
  'Puedes traer cualquier problema de tu aplicación.',
  'Sales con el siguiente paso, claro.',
];

function AdvisorPortrait({ photoUrl }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !failed;

  return (
    <span className="relative inline-flex h-14 w-14 shrink-0" data-testid="advisor-portrait">
      {showPhoto ? (
        <img
          src={photoUrl}
          alt=""
          data-testid="advisor-photo"
          className="h-14 w-14 rounded-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          data-testid="advisor-nova-avatar"
          aria-label="Nova"
          className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-full"
        >
          <span
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{ transform: 'translate(-50%, -50%) scale(0.44)' }}
          >
            <NovaAvatar />
          </span>
        </span>
      )}
      <span
        data-testid="advisor-presence"
        className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0c1016] bg-emerald-400"
        aria-hidden="true"
      />
    </span>
  );
}

function Testimonials({ items }) {
  const [index, setIndex] = useState(0);
  if (!items.length) return null;
  const current = items[index % items.length];

  return (
    <section
      data-testid="advisor-testimonials"
      aria-label="Testimonios"
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Testimonios</p>
      <blockquote data-testid="advisor-testimonial-quote" className="mt-3 text-sm leading-6 text-zinc-100">
        {`“${current.quote}”`}
      </blockquote>
      <p data-testid="advisor-testimonial-name" className="mt-3 text-sm text-zinc-300">
        {current.name}
        {current.detail ? <span className="text-zinc-500">{` · ${current.detail}`}</span> : null}
      </p>
      {items.length > 1 ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            aria-label="Testimonio anterior"
            data-testid="advisor-testimonial-prev"
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-zinc-200"
            onClick={() => setIndex((value) => (value - 1 + items.length) % items.length)}
          >
            Anterior
          </button>
          <button
            type="button"
            aria-label="Testimonio siguiente"
            data-testid="advisor-testimonial-next"
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-zinc-200"
            onClick={() => setIndex((value) => (value + 1) % items.length)}
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </section>
  );
}

const bookingClass = 'flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200/70 bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-200 px-3 py-2.5 text-center text-sm font-semibold text-black shadow-[0_0_28px_rgba(250,204,21,0.28)] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70';

export default function AdvisorFlowPanel({ open = false, onOpenChange = () => {}, config = {} }) {
  const [chatMissing, setChatMissing] = useState(false);
  const enabled = config?.enabled === true;
  const bookingUrl = safeHttpUrl(config?.bookingUrl);
  const photoUrl = safeHttpUrl(config?.photoUrl);
  const testimonials = visibleTestimonials(config?.testimonials);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const handleChat = () => {
    if (!findBuilderNovaChat()) {
      setChatMissing(true);
      return;
    }
    setChatMissing(false);
    onOpenChange(false);
    window.setTimeout(() => focusBuilderNovaChat(), 0);
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="advisor-flow-title"
        data-testid="advisor-flow-panel"
        data-advisor-state={enabled ? 'on' : 'off'}
        className="relative max-h-[min(42rem,calc(100vh-2rem))] w-[min(28rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c1016] p-5 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
      >
        <button
          type="button"
          aria-label="Cerrar"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-zinc-400 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          onClick={() => onOpenChange(false)}
        >
          <X size={16} aria-hidden="true" />
        </button>
        <div className="space-y-4 pr-6 text-left">
          <div className="flex items-center gap-3">
            <AdvisorPortrait photoUrl={photoUrl} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Nova</p>
              <h2 id="advisor-flow-title" className="mt-1 text-lg font-semibold text-white">Conoce a tu asesor</h2>
              <p className="mt-1 text-sm text-zinc-400">Asistente de Sistema Maestro</p>
            </div>
          </div>
          {enabled ? (
            <p className="text-sm leading-6 text-zinc-300">
              Nova te acompaña dentro del Builder. Si quieres una persona, reserva una llamada gratuita de 30 minutos.
            </p>
          ) : (
            <p className="text-sm leading-6 text-zinc-300">
              Esta opción todavía no está disponible. No se reserva ninguna llamada y el chat no se abre desde aquí.
            </p>
          )}
        </div>

        {!enabled ? (
          <p
            data-testid="advisor-coming-soon"
            className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400"
          >
            Próximamente
          </p>
        ) : (
          <div className="grid gap-3">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ChatCircle size={18} aria-hidden="true" className="text-cyan-200" />
                Charlar con Nova
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                El chat del Builder ya está en esta pantalla. Le escribes el cambio y Nova sigue sobre tu página.
              </p>
              <button
                type="button"
                data-testid="advisor-chat"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-300/10 px-3 py-2.5 text-sm font-semibold text-cyan-50 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                onClick={handleChat}
              >
                Charlar con Nova
              </button>
              {chatMissing ? (
                <p data-testid="advisor-chat-missing" className="mt-2 text-xs leading-5 text-amber-100">
                  Abre un proyecto en el Builder para escribirle a Nova. El chat de esta pantalla es el que se usa.
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Phone size={18} aria-hidden="true" className="text-amber-200" />
                Llamada gratuita de 30 minutos
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-200">
                {CALL_POINTS.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="advisor-booking"
                  className={`mt-4 ${bookingClass}`}
                >
                  Reservar llamada gratuita de 30 minutos
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  data-testid="advisor-booking"
                  className={`mt-4 ${bookingClass} cursor-not-allowed opacity-45`}
                >
                  Reservar llamada gratuita de 30 minutos
                </button>
              )}
              <p data-testid="advisor-booking-note" className="mt-2 text-center text-xs text-zinc-400">
                Gratis · 30 minutos · eliges el horario
              </p>
              {bookingUrl ? null : (
                <p data-testid="advisor-booking-unavailable" className="mt-1 text-center text-xs text-zinc-500">
                  El calendario todavía no está conectado.
                </p>
              )}
            </section>

            <Testimonials items={testimonials} />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
