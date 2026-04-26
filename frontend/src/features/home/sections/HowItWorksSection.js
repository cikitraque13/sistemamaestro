import React from 'react';

const steps = [
  {
    id: '01',
    title: 'Introduce una idea o una web',
    text: 'El sistema parte de un punto real: una idea que quieres construir, una URL que quieres mejorar o una necesidad que quieres ordenar.',
    tone: 'amber',
  },
  {
    id: '02',
    title: 'Analiza y ordena prioridades',
    text: 'Sistema Maestro interpreta el contexto, detecta fricciones y organiza por donde conviene avanzar primero.',
    tone: 'green',
  },
  {
    id: '03',
    title: 'Genera estructura y ruta',
    text: 'No se limita a describir. Devuelve una base mas clara para construir, corregir o escalar con logica de sistema.',
    tone: 'cyan',
  },
  {
    id: '04',
    title: 'Prepara continuidad real',
    text: 'El objetivo no es cerrar un informe, sino dejar el proyecto listo para el siguiente paso con mas criterio y menos friccion.',
    tone: 'pink',
  },
];

const toneStyles = {
  amber: 'border-amber-500/18 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02))] text-amber-200',
  green: 'border-emerald-500/18 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.02))] text-emerald-200',
  cyan: 'border-cyan-500/18 bg-[linear-gradient(180deg,rgba(6,182,212,0.08),rgba(255,255,255,0.02))] text-cyan-200',
  pink: 'border-fuchsia-500/18 bg-[linear-gradient(180deg,rgba(244,114,182,0.08),rgba(255,255,255,0.02))] text-fuchsia-200',
};

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="relative overflow-hidden px-6 py-18 md:px-10 md:py-22">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(245,158,11,0.05),transparent_18%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.05),transparent_20%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Como funciona
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Una entrada clara, una lectura util y una ruta mas ordenada para avanzar.
          </h2>

          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-300 md:text-xl">
            La logica del sistema no esta pensada para generar ruido. Esta pensada para convertir
            una necesidad en analisis, criterio y continuidad operativa.
          </p>
        </div>

        <div className="mt-10 grid gap-5 xl:grid-cols-4">
          {steps.map((step) => (
            <article
              key={step.id}
              className="rounded-[30px] border border-white/6 bg-white/[0.02] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
            >
              <div className={`inline-flex rounded-full border px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] ${toneStyles[step.tone]}`}>
                {step.id}
              </div>

              <h3 className="mt-6 text-2xl font-semibold leading-tight text-white">
                {step.title}
              </h3>

              <p className="mt-5 text-sm leading-7 text-zinc-300 md:text-base">
                {step.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;