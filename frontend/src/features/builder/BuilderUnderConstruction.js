import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const BuilderUnderConstruction = () => {
  return (
    <DashboardLayout title="Builder">
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center">
        <section
          data-testid="builder-under-construction"
          className="w-full rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] px-6 py-10 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:px-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Builder
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            El Builder está en construcción
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-300">
            Lo estamos terminando para que funcione de verdad. Mientras tanto, puedes hablar con Nova o contarnos tu proyecto.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] px-5 py-3 text-sm font-semibold text-black"
            >
              Volver al inicio
            </a>
            <a
              href="/#agencia-ia"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white"
            >
              Hablar con Nova
            </a>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default BuilderUnderConstruction;
