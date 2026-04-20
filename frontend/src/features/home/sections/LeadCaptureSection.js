import React from 'react';

const LeadCaptureSection = () => {
  return (
    <section id="captacion-inteligente" className="px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Captación inteligente
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Cuéntanos qué quieres construir y deja una base útil para seguir tu proyecto.
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-300 md:text-lg">
            Este bloque no está pensado como una newsletter genérica. Está pensado para captar interés real, segmentar necesidades y abrir continuidad comercial con más criterio.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
              <h3 className="text-lg font-semibold text-white">Más que un email</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Recoge contexto, intención y necesidades para convertir mejor después, no solo para guardar contactos.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
              <h3 className="text-lg font-semibold text-white">Segmentación útil</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Diferencia entre crear, mejorar o automatizar y detecta el eje principal de interés del usuario.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 md:p-7">
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">
                Email
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white">
                Qué quieres hacer
              </label>
              <select className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-500">
                <option>Crear desde cero</option>
                <option>Mejorar una web</option>
                <option>Escalar o automatizar</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white">
                Qué te interesa más
              </label>
              <select className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-500">
                <option>SEO</option>
                <option>Conversión</option>
                <option>IA</option>
                <option>Estructura</option>
                <option>Monetización</option>
                <option>Deploy</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white">
                Idea o necesidad
              </label>
              <textarea
                rows={4}
                placeholder="Quiero mejorar una web o construir una herramienta con más criterio y continuidad."
                className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-zinc-500"
              />
            </div>

            <label className="flex items-start gap-3 text-sm leading-6 text-zinc-300">
              <input type="checkbox" className="mt-1" />
              <span>
                He leído y acepto la política de privacidad y el tratamiento de datos para recibir información útil sobre mi proyecto.
              </span>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-white bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Quiero mi ruta inicial
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-zinc-500"
              >
                Recibir ideas para mi proyecto
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadCaptureSection;