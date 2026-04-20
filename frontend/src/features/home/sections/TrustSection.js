import React from 'react';

const trustItems = [
  {
    id: 'method',
    title: 'Método y criterio',
    description:
      'La utilidad del sistema no depende solo de la IA. Depende del criterio con el que ordena, interpreta y prioriza.',
  },
  {
    id: 'continuity',
    title: 'Continuidad real',
    description:
      'No está pensado para dejarte en un informe aislado, sino para preparar el siguiente paso con más claridad.',
  },
  {
    id: 'professional-logic',
    title: 'Lógica profesional',
    description:
      'Estructura, análisis, construcción, validación y despliegue se presentan como partes conectadas de un sistema serio.',
  },
];

const TrustSection = () => {
  return (
    <section className="px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Confianza y autoridad
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Sistema Maestro está pensado para proyectos que necesitan criterio, no solo velocidad.
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-300 md:text-lg">
            La promesa no es hacer ruido. La promesa es construir una capa de sistema útil para analizar, decidir y avanzar mejor.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {trustItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;