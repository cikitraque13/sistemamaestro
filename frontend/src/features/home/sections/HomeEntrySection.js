import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const peachPrimaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#FFF2CC_0%,#F2B45A_58%,#F472B6_100%)] px-5 py-3.5 text-sm font-semibold text-black shadow-[0_14px_32px_rgba(245,158,11,0.20)] transition hover:scale-[1.01] hover:shadow-[0_16px_38px_rgba(244,114,182,0.24)]';

const MobileEntry = () => {
  return (
    <section
      className="relative overflow-hidden px-5 pb-8 pt-7 md:hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(245,158,11,0.20),transparent_30%),radial-gradient(circle_at_86%_24%,rgba(244,114,182,0.12),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(6,182,212,0.08),transparent_34%)]" />

      <div className="relative mx-auto max-w-md">
        <div className="overflow-hidden rounded-[34px] border border-amber-200/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.014))] p-5 shadow-[0_0_50px_rgba(245,158,11,0.09)]">
          <div className="inline-flex rounded-full border border-amber-200/18 bg-amber-200/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
            Sistema Maestro Gold
          </div>

          <h1 className="mt-5 text-[2.2rem] font-semibold leading-[0.97] tracking-tight text-white">
            Construye y acelera proyectos digitales con inteligencia artificial.
          </h1>

          <p className="mt-4 text-sm leading-7 text-zinc-300">
            Una aplicación para ordenar ideas, webs, oportunidades y proyectos antes de construirlos con más criterio.
          </p>

          <div className="mt-5 rounded-2xl border border-white/8 bg-black/25 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Para quién es
            </p>

            <div className="mt-3 space-y-2.5 text-sm leading-6 text-zinc-300">
              <p>
                <span className="font-semibold text-white">Fundadores</span> que quieren ordenar una idea antes de invertir tiempo.
              </p>
              <p>
                <span className="font-semibold text-white">Negocios</span> que necesitan mejorar su presencia digital con más dirección.
              </p>
              <p>
                <span className="font-semibold text-white">Agencias y profesionales</span> que buscan acelerar proyectos con IA.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <Link
              to="/register"
              className={peachPrimaryButton}
            >
              Registrarme gratis
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="text-center text-xs leading-5 text-zinc-500">
              Incluye 10 gemas iniciales para conocer el sistema.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[30px] border border-amber-200/14 bg-[linear-gradient(135deg,rgba(255,228,163,0.065),rgba(244,114,182,0.04),rgba(6,182,212,0.025))] p-5">
          <p className="text-sm font-semibold text-amber-100">
            Pensado para trabajar proyectos en serio desde ordenador.
          </p>

          <p className="mt-2 text-xs leading-5 text-zinc-400">
            Desde móvil puedes entender el sistema y activar tu acceso. Cuando llegues al ordenador, entra, usa tus gemas y trabaja con más profundidad.
          </p>
        </div>
      </div>
    </section>
  );
};

const HomeEntrySection = () => {
  return <MobileEntry />;
};

export default HomeEntrySection;
