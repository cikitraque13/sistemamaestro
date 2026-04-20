import React from 'react';

const outcomes = [
  {
    id: 'diagnosis',
    title: 'Diagnóstico claro',
    description:
      'Aclara qué está fallando, qué falta y qué prioridad real tiene cada frente.',
  },
  {
    id: 'blueprint',
    title: 'Blueprint operativo',
    description:
      'Convierte la información en una base más útil para construir, corregir o escalar.',
  },
  {
    id: 'priority-route',
    title: 'Ruta de prioridades',
    description:
      'Ayuda a distinguir entre lo crítico, lo estratégico y lo que puede esperar.',
  },
  {
    id: 'project-continuity',
    title: 'Continuidad del proyecto',
    description:
      'Deja preparado el siguiente paso para que el proyecto no se quede bloqueado en teoría o dispersión.',
  },
];

const OutcomesSection = () => {
  return (
    <section className="px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Qué obtienes
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Resultados pensados para avanzar, no solo para mirar un informe y parar.
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-300 md:text-lg">
            El valor del sistema está en traducir análisis y criterio en una salida útil para construir, mejorar o tomar decisiones con más claridad.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {outcomes.map((item) => (
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

export default OutcomesSection;