import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  isEarlyDrop,
  levelsFromFrequency,
  novaPhase,
  novaStatusLabel,
  resolveNovaVoiceConfig,
} from './novaVoiceConfig.mjs';
import NovaAvatar from './NovaAvatar';
import './novaDemo.css';

// Demo de voz en vivo de Nova: avatar animado, onda con el volumen real de la
// llamada, estado pulsante y botón grande. Se resuelve una sola vez en el
// build: sin VITE_ELEVENLABS_AGENT_ID ni VITE_VOICE_AGENT_URL se muestra el
// avatar y el saludo, pero no el botón. El SDK de voz solo se carga al pulsar.
const NOVA_VOICE = resolveNovaVoiceConfig(import.meta.env || {});

const BAR_COUNT = 28;
const BAR_COLORS = ['#F97316', '#C6F432', '#A78BFA', '#38BDF8'];
// Perfil en reposo: una onda suave, más alta en el centro.
const BAR_BASE = Array.from({ length: BAR_COUNT }, (_, i) => {
  const x = i / (BAR_COUNT - 1);
  const envelope = Math.sin(Math.PI * x);
  const ripple = 0.5 + 0.5 * Math.sin(i * 1.7);
  return Number((0.16 + envelope * (0.22 + ripple * 0.26)).toFixed(3));
});

// Mismo texto que el primer mensaje del agente en ElevenLabs.
const GREETING =
  '«Hola, soy Nova, asistente de inteligencia artificial de Sistema Maestro. Estoy aquí para explicarte el producto con claridad y resolver tus dudas. ¿Me cuentas en una frase qué negocio tienes y qué te trae por aquí?»';

const PHASE_UI = {
  idle: { pill: 'Disponible ahora', color: 'text-[#C6F432]', ripple: 'text-[#A78BFA]' },
  connecting: { pill: 'Conectando', color: 'text-[#38BDF8]', ripple: 'text-[#38BDF8]' },
  listening: { pill: 'Te escucha', color: 'text-[#C6F432]', ripple: 'text-[#C6F432]' },
  speaking: { pill: 'Hablando', color: 'text-[#D8B4FE]', ripple: 'text-[#A78BFA]' },
  error: { pill: 'Sin conexión', color: 'text-[#FDBA74]', ripple: 'text-[#F97316]' },
};

const MOTES = [
  { left: '12%', top: '62%', color: '#C6F432', delay: '0s' },
  { left: '24%', top: '30%', color: '#A78BFA', delay: '2.2s' },
  { left: '78%', top: '24%', color: '#38BDF8', delay: '1.1s' },
  { left: '86%', top: '58%', color: '#F97316', delay: '3.6s' },
  { left: '64%', top: '78%', color: '#E9D5FF', delay: '5s' },
  { left: '40%', top: '14%', color: '#FDBA74', delay: '6.4s' },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isMicDenied = (error) =>
  error && (error.name === 'NotAllowedError' || error.name === 'SecurityError');

const MicIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2.5" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3.5" />
  </svg>
);

const HangUpIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 15.5c5-4.7 13-4.7 18 0l-2.4 2.4a1 1 0 0 1-1.3.1l-2.4-1.7a1 1 0 0 1-.4-.9l.2-1.9a10 10 0 0 0-5.4 0l.2 1.9a1 1 0 0 1-.4.9L6.7 18a1 1 0 0 1-1.3-.1z" />
  </svg>
);

const NovaVoiceDemo = () => {
  const [status, setStatus] = useState('idle');
  const [agentMode, setAgentMode] = useState('listening');
  const rootRef = useRef(null);
  const barsRef = useRef([]);
  const sessionRef = useRef(null);
  const connectedAtRef = useRef(0);
  const endedByUserRef = useRef(false);
  const modeRef = useRef('listening');
  const mountedRef = useRef(true);

  const voiceMode = NOVA_VOICE.mode;
  const phase = novaPhase(status, agentMode);
  const ui = PHASE_UI[phase];
  const inCall = status === 'connected';
  const label = novaStatusLabel(status, agentMode);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) session.endSession().catch(() => {});
    };
  }, []);

  const safeSet = (setter, value) => {
    if (mountedRef.current) setter(value);
  };

  const resetVisuals = () => {
    if (rootRef.current) rootRef.current.style.setProperty('--nova-level', '0');
    barsRef.current.forEach((bar) => {
      if (bar) bar.style.transform = '';
    });
  };

  // Onda y avatar con el volumen REAL de la llamada: espectro de salida cuando
  // habla Nova, de entrada (micrófono) cuando escucha.
  useEffect(() => {
    if (!inCall || prefersReducedMotion()) return undefined;
    let frame = 0;
    const tick = () => {
      const session = sessionRef.current;
      if (session) {
        try {
          const speaking = modeRef.current === 'speaking';
          const data = speaking
            ? session.getOutputByteFrequencyData()
            : session.getInputByteFrequencyData();
          const volume = speaking ? session.getOutputVolume() : session.getInputVolume();
          const levels = levelsFromFrequency(data, BAR_COUNT);
          barsRef.current.forEach((bar, index) => {
            if (bar) {
              const level = Math.max(BAR_BASE[index] * 0.35, 0.08 + levels[index] * 0.92);
              bar.style.transform = `scaleY(${level.toFixed(3)})`;
            }
          });
          if (rootRef.current) {
            rootRef.current.style.setProperty('--nova-level', Math.min(1, volume || 0).toFixed(3));
          }
        } catch {
          // El análisis de audio aún no está listo; se intenta en el siguiente frame.
        }
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      resetVisuals();
    };
  }, [inCall]);

  const start = useCallback(async () => {
    endedByUserRef.current = false;
    connectedAtRef.current = 0;
    modeRef.current = 'listening';
    setStatus('connecting');
    setAgentMode('listening');

    // 1) Permiso de micrófono, pedido tras el clic del visitante.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      safeSet(setStatus, isMicDenied(error) ? 'mic-denied' : 'error');
      return;
    }

    // 2) El SDK de ElevenLabs solo se descarga ahora (chunk aparte, carga diferida).
    try {
      const { Conversation } = await import('@elevenlabs/client');
      const session = await Conversation.startSession({
        agentId: NOVA_VOICE.agentId,
        connectionType: 'webrtc',
        onConnect: () => {
          if (!connectedAtRef.current) connectedAtRef.current = Date.now();
          safeSet(setStatus, 'connected');
        },
        onDisconnect: (details) => {
          sessionRef.current = null;
          if (endedByUserRef.current) {
            safeSet(setStatus, 'idle');
            return;
          }
          const early = isEarlyDrop(connectedAtRef.current, Date.now());
          if (early && typeof console !== 'undefined') {
            console.warn('[Nova] la llamada se cortó al empezar', details);
          }
          safeSet(setStatus, early ? 'dropped' : 'idle');
        },
        onError: (message) => {
          if (typeof console !== 'undefined') console.warn('[Nova] error de voz', message);
          safeSet(setStatus, 'error');
        },
        onModeChange: ({ mode }) => {
          modeRef.current = mode;
          safeSet(setAgentMode, mode);
        },
      });

      if (!mountedRef.current) {
        session.endSession().catch(() => {});
        return;
      }
      sessionRef.current = session;
      if (!connectedAtRef.current) connectedAtRef.current = Date.now();
      setStatus((current) => (current === 'connecting' ? 'connected' : current));
    } catch (error) {
      safeSet(setStatus, isMicDenied(error) ? 'mic-denied' : 'error');
    }
  }, []);

  const stop = useCallback(async () => {
    endedByUserRef.current = true;
    const session = sessionRef.current;
    sessionRef.current = null;
    setStatus('idle');
    if (session) {
      try {
        await session.endSession();
      } catch {
        // La sesión ya estaba cerrada.
      }
    }
  }, []);

  const ctaBase =
    'nova-cta group mt-4 inline-flex min-h-[3.125rem] w-full items-center justify-center gap-3 rounded-2xl px-6 text-base font-semibold transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-wait disabled:opacity-80 motion-reduce:transition-none md:min-h-[3.25rem] md:text-[17px]';
  const ctaIdle = `${ctaBase} border border-white/20 bg-[linear-gradient(110deg,#F97316_0%,#A78BFA_55%,#38BDF8_100%)] text-white shadow-[0_0_0_1px_rgba(167,139,250,0.25),0_14px_40px_rgba(167,139,250,0.38)] hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(198,244,50,0.35),0_18px_48px_rgba(167,139,250,0.5)] focus-visible:ring-[#DDD6FE] motion-reduce:hover:translate-y-0`;
  const ctaHang = `${ctaBase} border border-[#FDBA74]/50 bg-[#1a0f08] text-[#FED7AA] shadow-[0_10px_30px_rgba(249,115,22,0.22)] hover:bg-[#24140a] focus-visible:ring-[#FDBA74]`;

  return (
    <div ref={rootRef} className="nova-demo" data-phase={phase} data-status={status}>
      <span className="nova-demo__glow" aria-hidden="true" />
      {MOTES.map((mote) => (
        <span
          key={`${mote.left}-${mote.top}`}
          className="nova-demo__mote"
          aria-hidden="true"
          style={{ left: mote.left, top: mote.top, background: mote.color, animationDelay: mote.delay, boxShadow: `0 0 8px ${mote.color}` }}
        />
      ))}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E9D5FF]">Demo en vivo · Nova</p>
        <span
          className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[12px] font-medium backdrop-blur ${ui.color}`}
          data-testid="nova-status-pill"
        >
          <span className="nova-status__dot" aria-hidden="true" />
          {ui.pill}
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
        <NovaAvatar rippleClass={ui.ripple} />

        <figure className="relative w-full flex-1 rounded-2xl border border-[#A78BFA]/25 bg-[linear-gradient(135deg,rgba(167,139,250,0.14),rgba(56,189,248,0.06))] p-3.5 sm:rounded-tl-md">
          <figcaption className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C4B5FD]">
            Nova
            <span className="h-1 w-1 rounded-full bg-[#C4B5FD]/60" aria-hidden="true" />
            <span className="font-medium normal-case tracking-normal text-zinc-400">agente de Sistema Maestro</span>
          </figcaption>
          <blockquote className="text-[14px] leading-6 text-zinc-100 md:text-[15px]">{GREETING}</blockquote>
        </figure>
      </div>

      <div className="mt-3 flex h-12 items-center justify-center gap-[5px] md:h-14" aria-hidden="true" data-testid="nova-wave">
        {Array.from({ length: BAR_COUNT }, (_, index) => (
          <span
            key={index}
            ref={(el) => {
              barsRef.current[index] = el;
            }}
            className="nova-wave__bar"
            style={{
              '--nova-bar-base': BAR_BASE[index],
              background: BAR_COLORS[index % BAR_COLORS.length],
              animationDelay: `${(index % 7) * 0.12}s`,
              opacity: 0.7 + ((index * 37) % 30) / 100,
            }}
          />
        ))}
      </div>

      {voiceMode === 'elevenlabs' && (
        <button
          type="button"
          onClick={inCall ? stop : start}
          disabled={status === 'connecting'}
          aria-pressed={inCall}
          className={inCall ? ctaHang : ctaIdle}
          data-testid="nova-talk-button"
        >
          {inCall ? <HangUpIcon /> : <MicIcon />}
          {inCall ? 'Colgar' : status === 'connecting' ? 'Conectando…' : 'Habla con Nova'}
        </button>
      )}

      {voiceMode === 'link' && (
        <a href={NOVA_VOICE.url} target="_blank" rel="noopener noreferrer" className={ctaIdle} data-testid="nova-talk-button">
          <MicIcon />
          Habla con Nova
        </a>
      )}

      {voiceMode !== 'off' && (
        <p
          aria-live="polite"
          data-testid="nova-status-text"
          className={`mt-2 min-h-[1.25rem] text-center text-[13px] leading-5 ${phase === 'error' ? 'text-[#FDBA74]' : 'text-zinc-400'}`}
        >
          {label}
        </p>
      )}
    </div>
  );
};

export default NovaVoiceDemo;
