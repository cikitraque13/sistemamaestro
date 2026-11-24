import React from 'react';

import ValueAuthoritySection from './ValueAuthoritySection';
import '../homeFlow.css';
import { BRAND_GRADIENT_TEXT } from '../brandText';

const LEAD = ['Describe', 'tu', 'negocio:'];
const REST = ['creamos', 'tu', 'web,', 'la', 'lanzamos', 'y', 'tu'];
const GRADIENT = ['agente', 'de', 'IA'];
const TAIL = ['atiende'];

// Cada palabra sube una tras otra; todo termina en menos de 1 s y solo al cargar.
const STEP_MS = 45;

const Word = ({ children, index, className = '' }) => (
  <span className={`sm-word ${className}`} style={{ animationDelay: `${index * STEP_MS}ms` }}>
    {children}
  </span>
);

const words = (list, offset, className) =>
  list.map((word, i) => (
    <React.Fragment key={`${word}-${offset + i}`}>
      <Word index={offset + i} className={className}>
        {word}
      </Word>{' '}
    </React.Fragment>
  ));

const HeroSection = () => {
  let n = 0;
  const lead = words(LEAD, n);
  n += LEAD.length;
  const rest = words(REST, n);
  n += REST.length;
  const gradient = words(
    GRADIENT,
    n,
    BRAND_GRADIENT_TEXT
  );
  n += GRADIENT.length;
  const tail = words(TAIL, n);

  return (
    <section className="relative overflow-hidden px-6 pb-4 pt-8 md:px-10 md:pb-5 md:pt-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(245,158,11,0.10),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(244,114,182,0.08),transparent_20%)]" />

      <div className="relative mx-auto grid max-w-7xl items-start gap-6 xl:grid-cols-[1.2fr_1fr] xl:items-center">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Sistema Maestro
          </p>

          <h1 className="font-semibold tracking-tight text-white">
            <span className="block text-[2.6rem] leading-[1] md:text-[3.6rem]">{lead}</span>
            <span className="mt-2 block text-[1.6rem] leading-[1.15] text-zinc-100 md:text-[2.15rem]">
              {rest}
              {gradient}
              {tail}
            </span>
          </h1>

          <p className="mt-3 inline-block max-w-2xl text-base leading-7 text-zinc-300 md:text-[1.08rem] md:leading-8">
            Sistema Maestro interpreta tu idea o tu web y ordena prioridades.
            <span className="sm-bridge-line mt-1" aria-hidden="true" />
          </p>

          <a
            href="#agencia-ia"
            className="group mt-6 flex w-fit flex-col items-start gap-2 text-sm font-medium text-zinc-300 transition hover:text-white"
          >
            <span>Y además, un agente que trabaja por ti.</span>
            <span className="sm-fall ml-1" aria-hidden="true" />
          </a>
        </div>

        <ValueAuthoritySection />
      </div>
    </section>
  );
};

export default HeroSection;
