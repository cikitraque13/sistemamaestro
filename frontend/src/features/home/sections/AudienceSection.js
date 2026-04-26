import React from 'react';

const items = [
  {
    title: 'Fundadores y duenos de proyecto',
    text: 'Ordenan idea, web o producto con mas criterio.',
    classes: 'border-amber-500/15 bg-amber-500/10',
  },
  {
    title: 'Agencias y freelancers',
    text: 'Trabajan proyectos de cliente con una capa mas util de sistema.',
    classes: 'border-cyan-500/15 bg-cyan-500/10',
  },
  {
    title: 'SEO, creadores y operadores',
    text: 'Unen crecimiento, contenido y continuidad en una ruta mas clara.',
    classes: 'border-emerald-500/15 bg-emerald-500/10',
  },
  {
    title: 'Equipos que quieren escalar',
    text: 'Reducen dispersion y aumentan capacidad real dentro del sistema.',
    classes: 'border-fuchsia-500/15 bg-fuchsia-500/10',
  },
];

const AudienceSection = () => {
  return (
    <section id="para-quien-es" className="relative overflow-hidden px-6 py-12 md:px-10 md:py-14">
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Para quien es
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[3rem] md:leading-[0.97]">
            Pensado para quien necesita mas claridad, mas criterio y mas continuidad.
          </h2>

          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
            Si trabajas con ideas, webs, crecimiento o producto, este sistema esta pensado para darte una entrada mas util.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.title}
              className={`rounded-[22px] border p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${item.classes}`}
            >
              <h3 className="text-xl font-semibold leading-tight text-white">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-200">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;