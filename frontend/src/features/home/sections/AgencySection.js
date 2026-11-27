import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import NovaVoiceDemo from '../voice/NovaVoiceDemo';
import '../homeFlow.css';

const steps = [
  {
    step: '01',
    title: 'Cuentas el negocio',
    text: 'Idea o URL, con tus palabras.',
    accent: 'text-[#FDBA74]',
    badge: 'border-[#F97316]/40',
    classes: 'bg-[linear-gradient(180deg,rgba(249,115,22,0.30),rgba(249,115,22,0.12))]',
  },
  {
    step: '02',
    title: 'Ves el diagnóstico',
    text: 'Prioridades y el siguiente paso.',
    accent: 'text-[#C6F432]',
    badge: 'border-[#C6F432]/40',
    classes: 'bg-[linear-gradient(180deg,rgba(198,244,50,0.22),rgba(198,244,50,0.08))]',
  },
  {
    step: '03',
    title: 'Abres la preview',
    text: 'Preview y borrador en el Builder.',
    accent: 'text-[#E9D5FF]',
    badge: 'border-[#E9D5FF]/40',
    classes: 'bg-[linear-gradient(180deg,rgba(216,180,254,0.26),rgba(167,139,250,0.12))]',
  },
];

const beforeItems = ['Idea sin orden', 'Web sin lectura', 'Siguiente paso poco claro'];
const afterItems = ['Diagnóstico', 'Preview de la web', 'Borrador de prompt'];

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
      className="relative scroll-mt-24 overflow-hidden px-6 pb-6 pt-4 md:px-10 md:pb-6 md:pt-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_30%,rgba(198,244,50,0.06),transparent_28%),radial-gradient(circle_at_88%_40%,rgba(167,139,250,0.08),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className={revealClasses(visible)}>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Agencia de IA
            </p>

            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[3rem] md:leading-[1.02]">
              Diagnóstico, preview
              <br />
              <span className="inline-block bg-[linear-gradient(90deg,#F97316,#A78BFA_55%,#22D3EE)] bg-clip-text pb-1 text-transparent">
                y borrador.
              </span>
            </h2>

            <div className="mt-7 grid gap-5 sm:grid-cols-2 sm:gap-4">
              <div className="flex flex-col">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400/50">Antes</p>
              <div className="sm-float flex-1 rounded-[20px] border border-white/[0.08] bg-[#111216] p-5" style={{ '--sm-glow': 'rgba(161,161,170,0.18)' }} aria-label="Sin este paso">
                <p className="text-base font-semibold text-zinc-500">Sin este paso</p>
                <ul className="mt-3 space-y-2.5 text-[15px] leading-6 text-zinc-500 md:text-base">
                  {beforeItems.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span aria-hidden="true" className="font-semibold text-zinc-600">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              </div>

              <div className="flex flex-col">
              <p className="mb-2 bg-[linear-gradient(90deg,#A78BFA,#22D3EE)] bg-clip-text text-[11px] font-medium uppercase tracking-[0.18em] text-transparent opacity-80">
                Después
              </p>
              <div
                className="sm-float flex-1 rounded-[20px] bg-[linear-gradient(135deg,#A78BFA,#8B5CF6_50%,#22D3EE)] p-[1.5px] shadow-[0_0_28px_rgba(139,92,246,0.35)]"
                style={{ '--sm-glow': 'rgba(139,92,246,0.45)', animationDelay: '-3s' }}
                aria-label="Con Sistema Maestro"
              >
                <div className="h-full rounded-[18.5px] bg-[#12122a] bg-[linear-gradient(180deg,rgba(139,92,246,0.14),rgba(18,18,42,0)_70%)] p-5">
                  <p className="bg-[linear-gradient(90deg,#A78BFA,#22D3EE)] bg-clip-text text-base font-semibold text-transparent">
                    Con la Agencia de IA
                  </p>
                  <ul className="mt-3 space-y-2.5 text-[15px] font-medium leading-6 text-white md:text-base">
                    {afterItems.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span aria-hidden="true" className="font-bold text-[#22D3EE]">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              </div>
            </div>
          </div>

          <div
            className={`w-full rounded-[26px] lg:max-w-[480px] lg:justify-self-end bg-[linear-gradient(135deg,rgba(249,115,22,0.55),rgba(198,244,50,0.45)_35%,rgba(167,139,250,0.6)_70%,rgba(56,189,248,0.55))] p-px shadow-[0_18px_60px_rgba(167,139,250,0.16)] ${revealClasses(visible, 'delay-150')}`}
          >
            <div className="relative h-full overflow-hidden rounded-[25px] bg-[#0a0a0a] p-4 md:p-5">
              {/* Demo de Nova: avatar, saludo y botón. La voz en directo sale del
                  backend (token efímero). Si no está disponible, voz del navegador
                  y, en último caso, el saludo por escrito. */}
              <NovaVoiceDemo />
            </div>
          </div>
        </div>

        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {steps.map((item, index) => (
            <li
              key={item.step}
              style={{ '--sm-glow': ['rgba(249,115,22,0.30)', 'rgba(198,244,50,0.26)', 'rgba(167,139,250,0.32)'][index], animationDelay: `${-index * 2}s` }}
              className={`sm-float rounded-[22px] bg-[linear-gradient(135deg,rgba(198,244,50,0.55),rgba(167,139,250,0.55))] p-px transition-shadow duration-300 hover:shadow-[0_0_18px_rgba(167,139,250,0.14)] motion-reduce:transition-none ${revealClasses(
                visible,
                ['delay-200', 'delay-300', 'delay-500'][index]
              )}`}
            >
              <div className={`h-full rounded-[21px] bg-[#0a0a0a] p-4 ${item.classes}`}>
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
            Planes
          </a>
          <Link
            to="/register"
            className="sm-capsule"
          >
            <span className="sm-capsule__inner px-6 py-3 text-sm">
              Crea tu cuenta gratis
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AgencySection;
