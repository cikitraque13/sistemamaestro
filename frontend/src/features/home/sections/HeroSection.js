import React from 'react';

const HeroSection = () => {
  return (
    <section className="px-6 pb-10 pt-16 md:px-10 md:pb-14 md:pt-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Sistema Maestro
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Crea, analiza y mejora proyectos digitales con inteligencia artificial
          </h1>

          <p className="mt-6 text-base leading-8 text-zinc-300 md:text-xl md:leading-9">
            Sistema Maestro convierte una idea o una web en diagnóstico, estructura,
            construcción y despliegue con criterio profesional.
          </p>

          <p className="mt-4 text-sm leading-6 text-zinc-400 md:text-base">
            Posicionamiento, conversión, arquitectura y continuidad en un solo sistema.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-zinc-300">
              SEO
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-zinc-300">
              Conversión
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-zinc-300">
              Arquitectura
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-zinc-300">
              Builder
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-zinc-300">
              Deploy
            </span>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="#constructor-maestro"
              className="inline-flex items-center justify-center rounded-2xl border border-white bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Empezar análisis
            </a>

            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-zinc-500"
            >
              Ver cómo funciona
            </a>
          </div>

          <p className="mt-6 text-sm leading-6 text-zinc-400">
            Pensado para fundadores, agencias, operadores digitales y perfiles que
            necesitan ordenar, construir y escalar con más criterio.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 md:p-8">
          <div className="space-y-5">
            <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Entrada
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">
                Una idea o una web
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Parte de una necesidad real y deja que el sistema ordene el punto de partida.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Sistema
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">
                Lectura, estructura y ruta
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Sistema Maestro analiza, detecta prioridades y prepara una base más clara para construir.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Resultado
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">
                Continuidad real del proyecto
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                No se queda en teoría. Deja el siguiente paso más claro para mejorar, construir o desplegar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;