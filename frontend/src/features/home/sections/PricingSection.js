import React from 'react';

const pricingItems = [
  {
    id: 'starter',
    name: 'Entrada',
    price: 'Acceso inicial',
    description:
      'Pensado para quien quiere validar una idea, analizar una web o empezar con una primera ruta de proyecto.',
    points: [
      'Entrada al sistema',
      'Primeras rutas y análisis',
      'Base para activar proyecto',
    ],
  },
  {
    id: 'growth',
    name: 'Proyecto',
    price: 'Más capacidad',
    description:
      'Para quien necesita más continuidad, más profundidad de análisis y una estructura más preparada para avanzar.',
    points: [
      'Más análisis y continuidad',
      'Mayor profundidad operativa',
      'Base para construcción y mejora',
    ],
    featured: true,
  },
  {
    id: 'advanced',
    name: 'Escala',
    price: 'Capacidad ampliada',
    description:
      'Para proyectos y operadores que necesitan más control, más recorrido y más capacidad para construir o desplegar.',
    points: [
      'Más recorrido del sistema',
      'Mayor preparación para despliegue',
      'Pensado para continuidad y crecimiento',
    ],
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Pricing y acceso
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Una escalera de acceso pensada para activar, profundizar y escalar.
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-300 md:text-lg">
            La lógica del pricing debe acompañar el recorrido del usuario: entrar, validar, avanzar y ampliar capacidad cuando el proyecto lo requiera.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pricingItems.map((item) => (
            <article
              key={item.id}
              className={`rounded-3xl border p-6 md:p-7 ${
                item.featured
                  ? 'border-white bg-white text-black'
                  : 'border-zinc-800 bg-zinc-950/70 text-white'
              }`}
            >
              <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${item.featured ? 'text-black/70' : 'text-zinc-400'}`}>
                {item.name}
              </p>
              <h3 className="mt-3 text-2xl font-semibold">{item.price}</h3>
              <p className={`mt-4 text-sm leading-6 ${item.featured ? 'text-black/80' : 'text-zinc-300'}`}>
                {item.description}
              </p>

              <ul className="mt-6 space-y-3">
                {item.points.map((point) => (
                  <li
                    key={point}
                    className={`text-sm leading-6 ${item.featured ? 'text-black/80' : 'text-zinc-300'}`}
                  >
                    • {point}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                  item.featured
                    ? 'border-black bg-black text-white hover:opacity-90'
                    : 'border-white bg-white text-black hover:opacity-90'
                }`}
              >
                Empezar
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;