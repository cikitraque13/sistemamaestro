import React from 'react';
import audienceItems from '../data/audienceItems';

const AudienceSection = () => {
  return (
    <section className="px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Para quién es
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Sistema Maestro está pensado para operadores digitales que necesitan orden, criterio y continuidad.
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-300 md:text-lg">
            No habla solo a un perfil técnico. Habla a quien necesita entender mejor qué hacer, cómo priorizar y cómo convertir un proyecto en una ruta más sólida.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {audienceItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
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

export default AudienceSection;