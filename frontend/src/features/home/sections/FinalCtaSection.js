import React from 'react';

const FinalCtaSection = () => {
  return (
    <section className="relative overflow-hidden px-6 py-18 md:px-10 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_26%,rgba(245,158,11,0.07),transparent_18%),radial-gradient(circle_at_84%_24%,rgba(244,114,182,0.07),transparent_18%),radial-gradient(circle_at_58%_80%,rgba(16,185,129,0.06),transparent_20%)]" />

      <div className="relative mx-auto max-w-6xl rounded-[36px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-12">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Siguiente paso
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Activa una lectura clara de tu proyecto y entra al sistema con mas criterio.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-zinc-300 md:text-xl">
            Empieza con una idea o con una web, valida el siguiente paso y entra en una continuidad
            real de trabajo, builder y capacidad operativa.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-amber-200">
              Direccion
            </span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-emerald-200">
              Builder
            </span>
            <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-fuchsia-200">
              Continuidad
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#constructor-maestro"
              className="inline-flex items-center justify-center rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#FFF2CC_0%,#F2B45A_58%,#F472B6_100%)] px-6 py-3.5 text-sm font-semibold text-black shadow-[0_12px_30px_rgba(245,158,11,0.18)] transition hover:scale-[1.01]"
            >
              Empezar con mi proyecto
            </a>

            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Desbloquear lectura 6,99
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCtaSection;