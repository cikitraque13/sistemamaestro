import React from 'react';
import faqItems from '../data/faqItems';

const FaqSection = () => {
  return (
    <section className="px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            FAQ
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Preguntas clave antes de empezar
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-300 md:text-lg">
            Esta capa ayuda a reducir objeciones y a dejar más claro qué hace el sistema y qué puedes esperar al entrar.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {faqItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;