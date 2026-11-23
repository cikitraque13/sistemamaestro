import React from 'react';

const cards = [
  {
    step: '01',
    eyebrow: 'Analiza',
    title: 'Analiza y ordena prioridades',
    text: 'Sistema Maestro interpreta el contexto, detecta fricciones y organiza por dónde conviene avanzar primero.',
    classes: 'bg-[linear-gradient(180deg,rgba(249,115,22,0.30),rgba(249,115,22,0.12))]',
    accent: 'text-[#FDBA74]',
    badge: 'border-[#F97316]/40',
    glow: 'hover:shadow-[0_0_18px_rgba(249,115,22,0.16)]',
  },
  {
    step: '02',
    eyebrow: 'Construye',
    title: 'Convierte una idea en una base real de proyecto',
    text: 'No se limita a describir. Ordena una idea o una URL para dejarla lista para avanzar con más sentido.',
    classes: 'bg-[linear-gradient(180deg,rgba(198,244,50,0.22),rgba(198,244,50,0.08))]',
    accent: 'text-[#C6F432]',
    badge: 'border-[#C6F432]/40',
    glow: 'hover:shadow-[0_0_18px_rgba(198,244,50,0.16)]',
  },
  {
    step: '03',
    eyebrow: 'Despliega',
    title: 'Prepara salida y despliegue en la nube',
    text: 'El sistema no se queda encerrado. El proyecto puede avanzar hacia una salida real cuando toque.',
    classes: 'bg-[linear-gradient(180deg,rgba(216,180,254,0.26),rgba(167,139,250,0.12))]',
    accent: 'text-[#E9D5FF]',
    badge: 'border-[#E9D5FF]/40',
    glow: 'hover:shadow-[0_0_18px_rgba(167,139,250,0.18)]',
  },
  {
    step: '04',
    eyebrow: 'Extrae',
    title: 'Saca tu proyecto y sigue con continuidad',
    text: 'Si quieres extracción o una operación premium, el sistema también lo contempla dentro de su economía.',
    classes: 'bg-[linear-gradient(180deg,rgba(56,189,248,0.26),rgba(56,189,248,0.10))]',
    accent: 'text-[#7DD3FC]',
    badge: 'border-[#38BDF8]/40',
    glow: 'hover:shadow-[0_0_18px_rgba(56,189,248,0.16)]',
  },
];

const ValueAuthoritySection = () => {
  return (
    <div
      id="como-funciona"
      className="relative grid scroll-mt-24 gap-3 pt-6 sm:grid-cols-2 xl:w-full xl:max-w-[540px] xl:self-center xl:justify-self-end xl:pt-0"
    >
      {cards.map((card) => (
        <div
          key={card.eyebrow}
          className={`rounded-[22px] bg-[linear-gradient(135deg,rgba(198,244,50,0.55),rgba(167,139,250,0.55))] p-px transition-shadow duration-300 motion-reduce:transition-none ${card.glow}`}
        >
          <article className={`h-full rounded-[21px] bg-[#0a0a0a] p-4 ${card.classes}`}>
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border bg-black/25 text-[11px] font-semibold ${card.badge} ${card.accent}`}>
                {card.step}
              </span>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${card.accent}`}>
                {card.eyebrow}
              </p>
            </div>

            <h3 className="mt-2.5 text-base font-semibold leading-snug text-white">
              {card.title}
            </h3>

            <p className="mt-1.5 text-[13px] leading-5 text-zinc-200">
              {card.text}
            </p>
          </article>
        </div>
      ))}
    </div>
  );
};

export default ValueAuthoritySection;
