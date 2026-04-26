import React from 'react';

const LeadCaptureSection = () => {
  return (
    <section id="radar-ia" className="relative overflow-hidden px-6 py-12 md:px-10 md:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.06),transparent_18%),radial-gradient(circle_at_82%_18%,rgba(244,114,182,0.05),transparent_18%)]" />

      <div className="relative mx-auto grid max-w-7xl items-start gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Radar IA
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[3.2rem] md:leading-[0.95]">
            Recibe ideas, movimientos y oportunidades antes que los demas.
          </h2>

          <p className="mt-4 text-base leading-7 text-zinc-300 md:text-lg">
            No es una newsletter generica. Es una puerta de continuidad para seguir conectado al sistema con ideas,
            tendencias y senales utiles para tu proyecto.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-amber-200">
              Ideas
            </span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-emerald-200">
              Tendencias
            </span>
            <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-fuchsia-200">
              Oportunidades
            </span>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-6">
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-emerald-400/25"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white">Que quieres hacer</label>
              <select className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-sm text-white outline-none transition focus:border-cyan-400/25">
                <option>Crear desde cero</option>
                <option>Mejorar una web</option>
                <option>Escalar o automatizar</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white">Que te interesa mas</label>
              <select className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-sm text-white outline-none transition focus:border-fuchsia-400/25">
                <option>Ideas de negocio con IA</option>
                <option>Oportunidades de proyecto</option>
                <option>Tendencias utiles</option>
                <option>Builder y despliegue</option>
              </select>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#FFF2CC_0%,#F2B45A_58%,#F472B6_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_28px_rgba(245,158,11,0.18)] transition hover:scale-[1.01]"
            >
              Entrar en el Radar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadCaptureSection;