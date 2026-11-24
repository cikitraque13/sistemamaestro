import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import NovaVoiceDemo from '../voice/NovaVoiceDemo';

const steps = [
  {
    step: '01',
    title: 'Eliges tu nicho',
    text: 'Clínica, inmobiliaria, restaurante o el tuyo.',
    accent: 'text-[#FDBA74]',
    badge: 'border-[#F97316]/40',
  },
  {
    step: '02',
    title: 'Describes tu negocio',
    text: 'Con tus palabras, en un par de minutos.',
    accent: 'text-[#C6F432]',
    badge: 'border-[#C6F432]/40',
  },
  {
    step: '03',
    title: 'El agente nace',
    text: 'Tu web y tu agente, listos para trabajar.',
    accent: 'text-[#E9D5FF]',
    badge: 'border-[#E9D5FF]/40',
  },
];

const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(
    () => typeof window === 'undefined' || !('IntersectionObserver' in window)
  );

  useEffect(() => {
    if (visible || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return [ref, visible];
};

const revealClasses = (visible, delay = '') =>
  `transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${delay} ${
    visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
  }`;

const AgencySection = () => {
  const [ref, visible] = useReveal();

  return (
    <section
      id="agencia-ia"
      ref={ref}
      className="relative scroll-mt-24 overflow-hidden px-6 py-12 md:px-10 md:py-16"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_30%,rgba(198,244,50,0.06),transparent_28%),radial-gradient(circle_at_88%_40%,rgba(167,139,250,0.08),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className={revealClasses(visible)}>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Agencia de IA
            </p>

            <h2 className="max-w-[14ch] text-3xl font-semibold tracking-tight text-white md:text-[3rem] md:leading-[0.97]">
              Tu agencia de IA, lista en minutos
            </h2>

            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300 md:text-lg">
              Montamos tu web, le conectamos un agente que contesta llamadas y gestiona citas, y tú no tocas nada técnico.
            </p>
          </div>

          <div
            className={`rounded-[26px] bg-[linear-gradient(135deg,rgba(249,115,22,0.55),rgba(198,244,50,0.45)_35%,rgba(167,139,250,0.6)_70%,rgba(56,189,248,0.55))] p-px shadow-[0_18px_60px_rgba(167,139,250,0.16)] ${revealClasses(visible, 'delay-150')}`}
          >
            <div className="relative h-full overflow-hidden rounded-[25px] bg-[#0a0a0a] p-5 md:p-6">
              {/* Demo premium de Nova: avatar animado, onda con el volumen real de la
                  llamada, estado pulsante y botón grande. El botón solo aparece con
                  VITE_ELEVENLABS_AGENT_ID (o VITE_VOICE_AGENT_URL); el SDK de voz se
                  carga al pulsarlo. La base del agente está en docs/agents/nova/. */}
              <NovaVoiceDemo />
            </div>
          </div>
        </div>

        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {steps.map((item, index) => (
            <li
              key={item.step}
              className={`rounded-[22px] bg-[linear-gradient(135deg,rgba(198,244,50,0.40),rgba(167,139,250,0.40))] p-px transition-shadow duration-300 hover:shadow-[0_0_18px_rgba(167,139,250,0.14)] motion-reduce:transition-none ${revealClasses(
                visible,
                ['delay-200', 'delay-300', 'delay-500'][index]
              )}`}
            >
              <div className="h-full rounded-[21px] bg-[#0a0a0a] p-4">
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border bg-black/25 text-[11px] font-semibold ${item.badge} ${item.accent}`}>
                    {item.step}
                  </span>
                  <h3 className="text-base font-semibold leading-snug text-white">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-zinc-300">
                  {item.text}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className={`mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5 ${revealClasses(visible, 'delay-500')}`}>
          <a
            href="#pricing"
            className="inline-flex whitespace-nowrap rounded-2xl border border-lime-200/70 bg-[#C6F432] px-6 py-3 text-sm font-semibold text-zinc-950 shadow-[0_0_0_1px_rgba(198,244,50,0.25),0_10px_28px_rgba(198,244,50,0.30)] transition hover:-translate-y-0.5 hover:bg-[#D4FF4F] focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-200/80 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            Quiero mi agencia
          </a>
          <Link
            to="/register"
            className="text-sm font-medium text-zinc-300 underline-offset-4 transition hover:text-white hover:underline"
          >
            o crea tu cuenta gratis
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AgencySection;
