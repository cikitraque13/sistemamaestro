import React from 'react';

import '../homeFlow.css';

const HERO_GLOWS = ['rgba(249,115,22,0.30)', 'rgba(198,244,50,0.26)', 'rgba(167,139,250,0.32)', 'rgba(56,189,248,0.30)'];

const cards = [
  {
    step: '01',
    eyebrow: 'Analiza',
    title: 'Diagnóstico',
    text: 'De tu idea o de tu web a prioridades y un siguiente paso.',
    classes: 'bg-[linear-gradient(180deg,rgba(249,115,22,0.30),rgba(249,115,22,0.12))]',
    accent: 'text-[#FDBA74]',
    badge: 'border-[#F97316]/40',
    glow: 'hover:shadow-[0_0_18px_rgba(249,115,22,0.16)]',
  },
  {
    step: '02',
    eyebrow: 'Canales',
    title: 'La web está disponible',
    text: 'Nova habla en esta página. WhatsApp, calendario y CRM están previstos.',
    classes: 'bg-[linear-gradient(180deg,rgba(198,244,50,0.22),rgba(198,244,50,0.08))]',
    accent: 'text-[#C6F432]',
    badge: 'border-[#C6F432]/40',
    glow: 'hover:shadow-[0_0_18px_rgba(198,244,50,0.16)]',
  },
  {
    step: '03',
    eyebrow: 'Preview',
    title: 'Preview y borrador',
    text: 'El Builder muestra la preview y el borrador. No publica la web.',
    classes: 'bg-[linear-gradient(180deg,rgba(216,180,254,0.26),rgba(167,139,250,0.12))]',
    accent: 'text-[#E9D5FF]',
    badge: 'border-[#E9D5FF]/40',
    glow: 'hover:shadow-[0_0_18px_rgba(167,139,250,0.18)]',
  },
  {
    step: '04',
    eyebrow: 'Cuenta',
    title: 'El proyecto se guarda',
    text: 'El diagnóstico queda en tu cuenta. Puedes volver a la preview.',
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
      {cards.map((card, index) => (
        <div
          key={card.eyebrow}
          style={{ '--sm-glow': HERO_GLOWS[index], animationDelay: `${-index * 1.5}s` }}
          className={`sm-float rounded-[22px] bg-[linear-gradient(135deg,rgba(198,244,50,0.55),rgba(167,139,250,0.55))] p-px transition-shadow duration-300 motion-reduce:transition-none ${card.glow}`}
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
