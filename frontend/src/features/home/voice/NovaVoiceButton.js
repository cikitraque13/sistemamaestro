import React, { useCallback, useEffect, useRef, useState } from 'react';

import { novaStatusLabel, resolveNovaVoiceConfig } from './novaVoiceConfig.mjs';

// Botón de voz en vivo de Nova. Se resuelve una sola vez en el build:
// sin VITE_ELEVENLABS_AGENT_ID ni VITE_VOICE_AGENT_URL no se pinta nada.
const NOVA_VOICE = resolveNovaVoiceConfig(import.meta.env || {});

const buttonClass =
  'mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-[#E9D5FF]/60 bg-[linear-gradient(135deg,rgba(216,180,254,0.42),rgba(167,139,250,0.30))] px-5 py-3 text-sm font-semibold text-[#F5F3FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_26px_rgba(167,139,250,0.30)] transition duration-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_34px_rgba(167,139,250,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DDD6FE]/80 disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none sm:w-auto';

const isMicDenied = (error) =>
  error && (error.name === 'NotAllowedError' || error.name === 'SecurityError');

const ElevenLabsNovaButton = ({ agentId }) => {
  const [status, setStatus] = useState('idle');
  const [agentMode, setAgentMode] = useState('listening');
  const sessionRef = useRef(null);
  const mountedRef = useRef(true);

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

  const start = useCallback(async () => {
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
        agentId,
        connectionType: 'webrtc',
        onConnect: () => safeSet(setStatus, 'connected'),
        onDisconnect: () => {
          sessionRef.current = null;
          safeSet(setStatus, 'idle');
        },
        onError: () => safeSet(setStatus, 'error'),
        onModeChange: ({ mode }) => safeSet(setAgentMode, mode),
      });

      if (!mountedRef.current) {
        session.endSession().catch(() => {});
        return;
      }
      sessionRef.current = session;
      setStatus('connected');
    } catch (error) {
      safeSet(setStatus, isMicDenied(error) ? 'mic-denied' : 'error');
    }
  }, [agentId]);

  const stop = useCallback(async () => {
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

  const inCall = status === 'connected';
  const label = novaStatusLabel(status, agentMode);

  return (
    <div>
      <button
        type="button"
        onClick={inCall ? stop : start}
        disabled={status === 'connecting'}
        aria-pressed={inCall}
        className={buttonClass}
      >
        {inCall ? 'Colgar' : status === 'connecting' ? 'Conectando…' : 'Habla con Nova'}
      </button>
      <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-[13px] leading-5 text-zinc-400">
        {label}
      </p>
    </div>
  );
};

const NovaVoiceButton = () => {
  if (NOVA_VOICE.mode === 'elevenlabs') {
    return <ElevenLabsNovaButton agentId={NOVA_VOICE.agentId} />;
  }

  if (NOVA_VOICE.mode === 'link') {
    return (
      <a href={NOVA_VOICE.url} target="_blank" rel="noopener noreferrer" className={buttonClass}>
        Habla con Nova
      </a>
    );
  }

  return null;
};

export default NovaVoiceButton;
