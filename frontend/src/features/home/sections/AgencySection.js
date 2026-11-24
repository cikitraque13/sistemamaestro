import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import NovaVoiceButton from '../voice/NovaVoiceButton';

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
            className={`rounded-[26px] bg-[linear-gradient(135deg,rgba(198,244,50,0.45),rgba(167,139,250,0.55))] p-px shadow-[0_18px_60px_rgba(167,139,250,0.10)] ${revealClasses(visible, 'delay-150')}`}
          >
            <div className="h-full rounded-[25px] bg-[#0a0a0a] bg-[linear-gradient(180deg,rgba(216,180,254,0.10),rgba(10,10,10,0)_60%)] p-5 md:p-6">
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-[#A78BFA]/25 blur-md motion-safe:animate-pulse" />
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#E9D5FF]/50 bg-[linear-gradient(135deg,rgba(216,180,254,0.42),rgba(167,139,250,0.30))] text-base font-semibold text-[#F5F3FF]">
                    N
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E9D5FF]">
                    Demo con Nova
                  </p>
                  <p className="mt-1 text-lg font-semibold leading-tight text-white">
                    Habla con la agente de Sistema Maestro
                  </p>
                </div>
              </div>

              <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[15px] leading-7 text-zinc-200">
                «Hola, soy Nova, de Sistema Maestro. Montamos tu web con inteligencia artificial y le conectamos un agente que atiende a tus clientes, para que tú te centres en tu negocio. ¿Qué te gustaría saber?»
              </p>

              {/* Botón de voz de Nova: oculto hasta que exista VITE_ELEVENLABS_AGENT_ID
                  (o VITE_VOICE_AGENT_URL). El SDK de voz solo se carga al pulsarlo.
                  La base del agente está en docs/agents/nova/. */}
              <NovaVoiceButton />
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
