import React, { useEffect, useRef, useState } from 'react';

const actionOptions = [
  'Crear desde cero',
  'Mejorar una web',
  'Escalar o automatizar'
];

const interestOptions = [
  'Ideas de negocio con IA',
  'Oportunidades de proyecto',
  'Tendencias útiles',
  'Builder y despliegue'
];

const toneClasses = {
  cyan: {
    focus: 'focus:border-cyan-400/25',
    active: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
    marker: 'text-cyan-100'
  },
  fuchsia: {
    focus: 'focus:border-fuchsia-400/25',
    active: 'border-fuchsia-300/25 bg-fuchsia-400/10 text-fuchsia-100',
    marker: 'text-fuchsia-100'
  }
};

const RadarSelect = ({
  id,
  label,
  value,
  options,
  onChange,
  openSelect,
  setOpenSelect,
  tone = 'cyan'
}) => {
  const ref = useRef(null);
  const isOpen = openSelect === id;
  const currentTone = toneClasses[tone] || toneClasses.cyan;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!ref.current?.contains(event.target)) {
        setOpenSelect(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenSelect(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setOpenSelect]);

  return (
    <div ref={ref} className="relative">
      <label className="mb-2 block text-sm font-semibold text-white">
        {label}
      </label>

      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => setOpenSelect(isOpen ? null : id)}
        className={`flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-left text-sm text-white outline-none transition hover:border-white/18 hover:bg-black/45 ${currentTone.focus}`}
      >
        <span>{value}</span>
        <span className={`ml-3 text-xs ${currentTone.marker}`}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#080909]/95 p-1.5 shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-xl">
          {options.map((option) => {
            const isActive = option === value;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpenSelect(null);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  isActive
                    ? currentTone.active
                    : 'border border-transparent text-zinc-300 hover:border-white/8 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <span>{option}</span>
                {isActive && (
                  <span className="ml-3 text-xs">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const LeadCaptureSection = () => {
  const [action, setAction] = useState(actionOptions[0]);
  const [interest, setInterest] = useState(interestOptions[0]);
  const [openSelect, setOpenSelect] = useState(null);

  return (
    <section id="radar-ia" className="relative overflow-hidden px-6 py-12 md:px-10 md:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.06),transparent_18%),radial-gradient(circle_at_82%_18%,rgba(244,114,182,0.05),transparent_18%)]" />

      <div className="relative mx-auto grid max-w-7xl items-start gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Radar IA
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[3.2rem] md:leading-[0.95]">
            Recibe ideas, movimientos y oportunidades antes que los demás.
          </h2>

          <p className="mt-5 text-base leading-8 text-zinc-300 md:text-lg">
            No es una newsletter genérica. Es una puerta de continuidad para seguir conectado al sistema con ideas, tendencias y señales útiles para tu proyecto.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
              Ideas
            </span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
              Tendencias
            </span>
            <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-fuchsia-200">
              Oportunidades
            </span>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-6">
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">
                Email
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-emerald-400/25"
              />
            </div>

            <RadarSelect
              id="action"
              label="Qué quieres hacer"
              value={action}
              options={actionOptions}
              onChange={setAction}
              openSelect={openSelect}
              setOpenSelect={setOpenSelect}
              tone="cyan"
            />

            <RadarSelect
              id="interest"
              label="Qué te interesa más"
              value={interest}
              options={interestOptions}
              onChange={setInterest}
              openSelect={openSelect}
              setOpenSelect={setOpenSelect}
              tone="fuchsia"
            />

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