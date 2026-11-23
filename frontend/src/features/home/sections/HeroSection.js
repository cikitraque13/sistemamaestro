import React from 'react';

import ValueAuthoritySection from './ValueAuthoritySection';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden px-6 pb-6 pt-8 md:px-10 md:pb-8 md:pt-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(245,158,11,0.10),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(244,114,182,0.08),transparent_20%)]" />

      <div className="relative mx-auto grid max-w-7xl items-start gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Sistema Maestro
          </p>

          <h1 className="max-w-[11ch] text-[3rem] font-semibold leading-[0.9] tracking-tight text-white md:text-[4.05rem]">
            Dirige y acelera proyectos digitales con inteligencia artificial y criterio
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300 md:text-[1.08rem] md:leading-8">
            Sistema Maestro interpreta tu idea o tu web y ordena prioridades.
          </p>
        </div>

        <ValueAuthoritySection />
      </div>
    </section>
  );
};

export default HeroSection;
