import React from 'react';

const steps = [
  {
    id: 'input',
    number: '01',
    title: 'Introduce una idea o una web',
    description:
      'El sistema parte de un punto real: una idea que quieres construir, una URL que quieres mejorar o una necesidad que quieres ordenar.',
  },
  {
    id: 'analysis',
    number: '02',
    title: 'Analiza y ordena prioridades',
    description:
      'Sistema Maestro interpreta el contexto, detecta fricciones y organiza por dónde conviene avanzar primero.',
  },
  {
    id: 'structure',
    number: '03',
    title: 'Genera estructura y ruta',
    description:
      'No se limita a describir. Devuelve una base más clara para construir, corregir o escalar con lógica de sistema.',
  },
  {
    id: 'continuity',
    number: '04',
    title: 'Prepara continuidad real',
    description:
      'El objetivo no es cerrar un informe, sino dejar el proyecto listo para el siguiente paso con más criterio y menos fricción.',
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Cómo funciona
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Una entrada clara, una lectura útil y una ruta más ordenada para avanzar.
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-300 md:text-lg">
            La lógica del sistema no está pensada para generar ruido. Está pensada para convertir una necesidad en análisis, criterio y continuidad operativa.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <article
              key={step.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6"
            >
              <p className="text-sm font-semibold tracking-[0.18em] text-zinc-500">
                {step.number}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;