import React, { useMemo } from 'react';
import { buildMatrixColumn } from '../flow.utils';

const MatrixRain = () => {
  const columns = useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => ({
        id: index,
        left: `${index * 3.95}%`,
        duration: 5.8 + (index % 7) * 0.65,
        delay: (index % 9) * 0.28,
        opacity: 0.14 + (index % 5) * 0.045,
        chars: buildMatrixColumn(24 + (index % 8))
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {columns.map((column) => (
        <div
          key={column.id}
          className="absolute top-[-40%] select-none font-mono text-[11px] sm:text-xs tracking-[0.2em] text-[#39ff88]"
          style={{
            left: column.left,
            opacity: column.opacity,
            animation: `matrixDrop ${column.duration}s linear infinite`,
            animationDelay: `${column.delay}s`
          }}
        >
          {column.chars.map((item, charIndex) => (
            <div
              key={item.id}
              className={charIndex === 0 ? 'text-[#d1ffe5]' : ''}
              style={{
                opacity: Math.max(0.18, 1 - charIndex * 0.045)
              }}
            >
              {item.char}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const MatrixTransitionOverlay = ({ title, detail, status }) => {
  return (
    <div className="fixed inset-0 z-[120] bg-[#010302] flex items-center justify-center px-6">
      <style>{`
        @keyframes matrixDrop {
          0% { transform: translateY(-18%); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translateY(150%); opacity: 0; }
        }
        @keyframes matrixPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes matrixScan {
          0% { transform: translateY(-130%); opacity: 0; }
          10% { opacity: 0.18; }
          100% { transform: translateY(130%); opacity: 0; }
        }
        @keyframes terminalBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,136,0.09),transparent_45%)]" />
      <div className="absolute inset-0 opacity-55">
        <MatrixRain />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ animation: 'matrixScan 2.4s linear infinite' }}
      >
        <div className="h-28 w-full bg-gradient-to-b from-transparent via-[#39ff88]/10 to-transparent" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-0 rounded-[30px] bg-[#39ff88]/8 blur-3xl" />

        <div className="relative overflow-hidden rounded-[30px] border border-[#1f7a4f]/35 bg-[#06100b]/92 shadow-[0_0_70px_rgba(57,255,136,0.09)]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(57,255,136,0.05),transparent_22%,transparent_78%,rgba(57,255,136,0.03))]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.015)_0px,rgba(255,255,255,0.015)_1px,transparent_1px,transparent_4px)] opacity-20" />

          <div className="relative px-8 py-10 sm:px-12 sm:py-12">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#39ff88]/20 bg-[#0a1711] px-4 py-2">
                <span
                  className="h-2.5 w-2.5 rounded-full bg-[#39ff88]"
                  style={{ animation: 'matrixPulse 1.2s ease-in-out infinite' }}
                />
                <span className="font-mono text-[11px] sm:text-xs tracking-[0.28em] text-[#b8ffd4] uppercase">
                  Sistema Maestro
                </span>
              </div>

              <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#6ee7a8]">
                FLOW / TRANSITION
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
              <div>
                <h3 className="text-2xl sm:text-3xl font-light text-white mb-4">
                  {title}
                </h3>

                <p className="text-[#9aa4a0] leading-relaxed mb-8 max-w-xl">
                  {detail}
                </p>

                <div className="rounded-2xl border border-[#39ff88]/14 bg-[#040a07] px-5 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse" />
                    <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse [animation-delay:180ms]" />
                    <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse [animation-delay:360ms]" />
                  </div>

                  <p className="font-mono text-sm sm:text-base tracking-[0.16em] uppercase text-[#e9fff1]">
                    {status}
                    <span
                      className="ml-1 inline-block text-[#39ff88]"
                      style={{ animation: 'terminalBlink 1s step-end infinite' }}
                    >
                      _
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#39ff88]/14 bg-[#040a07] px-5 py-5">
                <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#6ee7a8] mb-4">
                  Estado de sistema
                </div>

                <div className="space-y-3 font-mono text-xs sm:text-[13px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9aa4a0]">Entrada</span>
                    <span className="text-[#d7ffe7]">OK</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9aa4a0]">Análisis</span>
                    <span className="text-[#d7ffe7]">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9aa4a0]">Sistema</span>
                    <span className="text-[#d7ffe7]">SECURE</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9aa4a0]">Resultado</span>
                    <span className="text-[#d7ffe7]">PROCESSING</span>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-white/5 bg-[#07110c] px-4 py-4">
                  <div className="font-mono text-[11px] tracking-[0.20em] uppercase text-[#6ee7a8] mb-2">
                    Log
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-[#b8c4be]">
                    <div>&gt; flow.channel = secure</div>
                    <div>&gt; analysis.mode = active</div>
                    <div>&gt; pipeline.target = result</div>
                    <div>&gt; status = running transition</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
