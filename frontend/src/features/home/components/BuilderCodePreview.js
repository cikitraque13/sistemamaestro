import React, { useEffect, useMemo, useState } from 'react';
import { getBuilderCodeFrame } from '../data/builderCodeFrames';

const getLineClass = (line) => {
  if (/createProject|buildHero|composeHomepage|bootstrapApp|runAudit|designScaleRoute|validate|export/.test(line)) {
    return 'text-cyan-300';
  }

  if (/mode:|goal:|system:|objective:|focus:|nextStep:|target:/.test(line)) {
    return 'text-emerald-300';
  }

  if (/'.*'|".*"/.test(line)) {
    return 'text-amber-300';
  }

  if (/const|return|def|class/.test(line)) {
    return 'text-violet-300';
  }

  return 'text-zinc-300';
};

const BuilderCodePreview = ({ activeIntent, activeType, projectLabel }) => {
  const frame = useMemo(
    () => getBuilderCodeFrame(activeIntent, activeType),
    [activeIntent, activeType]
  );

  const [visibleLines, setVisibleLines] = useState(6);
  const maxVisible = 14;

  useEffect(() => {
    let current = 6;
    setVisibleLines(6);

    const limit = Math.min(frame.lines.length, maxVisible);

    const timer = setInterval(() => {
      current += 1;
      if (current >= limit) {
        current = limit;
        clearInterval(timer);
      }
      setVisibleLines(current);
    }, 120);

    return () => clearInterval(timer);
  }, [frame]);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-cyan-500/15 bg-[#07090c] p-5 shadow-[0_0_40px_rgba(6,182,212,0.08)] md:p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Código en construcción
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-300">{frame.fileLabel}</p>
          <p className="mt-1 text-xs text-zinc-500">{projectLabel}</p>
        </div>

        <div className="rounded-full border border-zinc-700 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
          {frame.language}
        </div>
      </div>

      <div className="relative rounded-2xl border border-zinc-800 bg-black/45 p-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>

        <div className="h-[270px] overflow-hidden">
          <div className="space-y-2 font-mono text-[12px] leading-6 md:text-[13px]">
            {frame.lines.slice(0, visibleLines).map((line, index) => (
              <div key={`${frame.fileLabel}-${index}`} className="flex gap-4">
                <span className="w-6 shrink-0 text-right text-zinc-600">
                  {index + 1}
                </span>
                <span className={`whitespace-pre-wrap ${getLineClass(line)}`}>
                  {line || ' '}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderCodePreview;