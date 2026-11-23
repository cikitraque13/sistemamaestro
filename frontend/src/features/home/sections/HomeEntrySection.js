import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';
import {
  HOME_IDEA_MAX_LENGTH,
  buildHomeIdeaLauncherState,
  clearHomeIdea,
  saveHomeIdea,
} from '../homeIdeaHandoff';

const peachPrimaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#FFF2CC_0%,#F2B45A_58%,#F472B6_100%)] px-5 py-3.5 text-sm font-semibold text-black shadow-[0_14px_32px_rgba(245,158,11,0.20)] transition hover:scale-[1.01] hover:shadow-[0_16px_38px_rgba(244,114,182,0.24)]';

const HomeIdeaForm = ({ inputId }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [idea, setIdea] = useState('');
  const [error, setError] = useState('');

  const isAuthenticated = !loading && !!user && user !== false;

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanIdea = idea.trim().slice(0, HOME_IDEA_MAX_LENGTH);

    if (!cleanIdea) {
      setError('Escribe tu idea para empezar.');
      return;
    }

    setError('');

    if (isAuthenticated) {
      clearHomeIdea();
      navigate('/dashboard', { state: buildHomeIdeaLauncherState(cleanIdea) });
      return;
    }

    saveHomeIdea(cleanIdea);
    navigate('/register');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor={inputId} className="sr-only">
        Tu idea
      </label>

      <textarea
        id={inputId}
        value={idea}
        onChange={(event) => {
          setIdea(event.target.value);
          if (error) setError('');
        }}
        maxLength={HOME_IDEA_MAX_LENGTH}
        rows={4}
        placeholder="Ejemplo: quiero una web para mi estudio de yoga con reservas de clases y pagos online."
        className="w-full resize-none rounded-[22px] border border-white/10 bg-black/35 px-4 py-4 text-[0.98rem] leading-7 text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-200/40"
      />

      {error ? (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      <button type="submit" className={`${peachPrimaryButton} w-full`}>
        Empieza gratis con 10 gemas
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
};

const MobileEntry = () => {
  return (
    <section
      id="constructor-maestro-movil"
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

          <div className="mt-5">
            <HomeIdeaForm inputId="home-idea-movil" />
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

const DesktopEntry = () => {
  return (
    <section
      id="constructor-maestro"
      className="relative hidden overflow-hidden px-6 pb-10 pt-5 md:block md:px-10 md:pb-12 md:pt-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_88%,rgba(245,158,11,0.22),transparent_18%),radial-gradient(circle_at_72%_12%,rgba(217,70,239,0.14),transparent_22%),radial-gradient(circle_at_92%_20%,rgba(8,145,178,0.12),transparent_18%)]" />

      <div className="relative mx-auto grid max-w-7xl gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Empieza aquí
          </p>

          <h2 className="text-[2.35rem] font-semibold leading-[0.98] tracking-tight text-white md:text-[3.1rem]">
            Escribe tu idea.
            <span className="block bg-[linear-gradient(135deg,#f7d58d_0%,#f3a56b_45%,#ef78b7_100%)] bg-clip-text text-transparent">
              El builder empieza a construirla.
            </span>
          </h2>

          <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300">
            Cuéntalo con tus palabras: qué necesitas, para quién y qué debe hacer. Tu idea pasa tal cual al builder.
          </p>
        </div>

        <div className="rounded-[30px] border border-amber-200/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))] p-5 shadow-[0_0_40px_rgba(245,158,11,0.08)]">
          <HomeIdeaForm inputId="home-idea" />
        </div>
      </div>
    </section>
  );
};

const HomeEntrySection = () => {
  return (
    <>
      <MobileEntry />
      <DesktopEntry />
    </>
  );
};

export default HomeEntrySection;
