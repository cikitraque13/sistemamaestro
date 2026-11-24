import React from 'react';

import '../homeFlow.css';
import { BRAND_GRADIENT_TEXT } from '../brandText';

const items = [
  {
    title: 'Clínicas y consultas',
    text: 'Dudas de pacientes respondidas sin coger el teléfono.',
    classes: 'bg-[linear-gradient(180deg,rgba(249,115,22,0.30),rgba(249,115,22,0.12))]',
    glow: 'rgba(249,115,22,0.30)',
  },
  {
    title: 'Inmobiliarias',
    text: 'Cada contacto atendido al momento, a cualquier hora.',
    classes: 'bg-[linear-gradient(180deg,rgba(198,244,50,0.22),rgba(198,244,50,0.08))]',
    glow: 'rgba(198,244,50,0.26)',
  },
  {
    title: 'Restaurantes y comercios',
    text: 'Preguntas y reservas resueltas mientras tú trabajas.',
    classes: 'bg-[linear-gradient(180deg,rgba(216,180,254,0.26),rgba(167,139,250,0.12))]',
    glow: 'rgba(167,139,250,0.32)',
  },
  {
    title: 'Agencias y freelancers',
    text: 'Entregan web y agente a sus clientes desde un solo sistema.',
    classes: 'bg-[linear-gradient(180deg,rgba(56,189,248,0.26),rgba(56,189,248,0.10))]',
    glow: 'rgba(56,189,248,0.30)',
  },
];

const AudienceSection = () => {
  return (
    <section id="para-quien-es" className="relative overflow-hidden px-6 pb-12 pt-6 md:px-10 md:pb-14 md:pt-6">
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Para quién es
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[3rem] md:leading-[0.97]">
            Para negocios que quieren <span className={BRAND_GRADIENT_TEXT}>su web</span> y{' '}
            <span className={BRAND_GRADIENT_TEXT}>su agente</span> trabajando por ellos.
          </h2>

          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
            Si atiendes clientes por chat, web o WhatsApp, Sistema Maestro construye tu web y pone un agente de IA a atenderlos por ti.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <div
              key={item.title}
              className="sm-float rounded-[22px] bg-[linear-gradient(135deg,rgba(198,244,50,0.55),rgba(167,139,250,0.55))] p-px"
              style={{ '--sm-glow': item.glow, animationDelay: `${-index * 1.5}s` }}
            >
              <article className={`h-full rounded-[21px] bg-[#0a0a0a] p-5 ${item.classes}`}>
                <h3 className="text-xl font-semibold leading-tight text-white">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-zinc-200">
                  {item.text}
                </p>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
