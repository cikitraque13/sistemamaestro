import React from 'react';

const FinalCtaSection = () => {
  return (
    <section className="px-6 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 text-center md:p-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Siguiente paso
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
          Empieza con tu idea o con tu web y deja que el sistema te devuelva una ruta más clara.
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
          Sistema Maestro está pensado para ayudarte a analizar, ordenar y preparar mejor el siguiente movimiento de tu proyecto digital.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-white px-6 py-3 text-sm font-semibold text-black bg-white transition hover:opacity-90"
          >
            Empezar análisis
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-zinc-500"
          >
            Ver cómo funciona
          </button>
        </div>
      </div>
    </section>
  );
};

export default FinalCtaSection;