import React, { useEffect, useMemo, useState } from 'react';
import { getBuilderVisualState } from '../data/builderVisualStates';

const BuilderVisualPreview = ({ activeIntent, activeType, projectLabel }) => {
  const visualState = useMemo(
    () => getBuilderVisualState(activeIntent, activeType),
    [activeIntent, activeType]
  );

  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    setActiveCard(0);

    const timer = setInterval(() => {
      setActiveCard((prev) => {
        const next = prev + 1;
        if (next >= visualState.cards.length) return 0;
        return next;
      });
    }, 1300);

    return () => clearInterval(timer);
  }, [visualState]);

  return (
    <div className="h-full rounded-[28px] border border-white/10 bg-[#0a0a11] p-5 shadow-[0_0_40px_rgba(168,85,247,0.08)] md:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Preview visual
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            {visualState.title}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">{projectLabel}</p>
        </div>

        <div className="rounded-full border border-zinc-700 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
          {visualState.badge}
        </div>
      </div>

      <p className="text-sm leading-6 text-zinc-300">
        {visualState.description}
      </p>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/35 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-24 rounded-full bg-zinc-800" />
          <div className="h-8 w-24 rounded-xl bg-gradient-to-r from-amber-300 via-amber-200 to-white opacity-90" />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4">
          <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
            <div className="h-4 w-28 rounded-full bg-zinc-800" />
            <div className="mt-4 h-10 w-3/4 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-violet-400/25 to-emerald-400/25" />
            <div className="mt-3 h-4 w-5/6 rounded-full bg-zinc-900" />
            <div className="mt-2 h-4 w-2/3 rounded-full bg-zinc-900" />

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {visualState.cards.map((card, index) => {
                const isActive = index === activeCard;

                return (
                  <div
                    key={card.id}
                    className={`rounded-2xl border p-3 transition ${
                      isActive
                        ? 'border-white/40 bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.08)]'
                        : 'border-zinc-800 bg-zinc-950 text-white'
                    }`}
                  >
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        isActive ? 'text-black/70' : 'text-zinc-500'
                      }`}
                    >
                      {card.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{card.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 transition-all duration-500"
                style={{
                  width: `${((activeCard + 1) / visualState.cards.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderVisualPreview;