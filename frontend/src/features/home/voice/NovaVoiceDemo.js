import React, { useCallback, useEffect, useRef, useState } from 'react';

import { API_BASE } from '../../../lib/apiClient';
import { useVoice } from '../../../hooks/useVoice';
import {
  BROWSER_FOLLOWUP,
  NOVA_GREETING,
  NOVA_GREETING_DISPLAY,
  buildGrokSessionUpdate,
  choosePcmRate,
  downsampleFloat32,
  encodePcm16Base64,
  executeWebsiteAnalysisTool,
  floatToPcm16,
  functionCallOutputItem,
  greetingItem,
  isMicDenied,
  levelsFromPcm16,
  novaPhase,
  novaStatusLabel,
  resolveNovaVoiceProvider,
  sanitizeNovaDiag,
} from './novaVoiceConfig.mjs';
import NovaAvatar from './NovaAvatar';
import './novaDemo.css';

const BAR_COUNT = 28;
const BAR_COLORS = ['#F97316', '#C6F432', '#A78BFA', '#38BDF8'];
const BAR_BASE = Array.from({ length: BAR_COUNT }, (_, i) => {
  const x = i / (BAR_COUNT - 1);
  const envelope = Math.sin(Math.PI * x);
  const ripple = 0.5 + 0.5 * Math.sin(i * 1.7);
  return Number((0.16 + envelope * (0.22 + ripple * 0.26)).toFixed(3));
});

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

const decodeBase64 = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

function reportNovaFailure(detail) {
  const safe = sanitizeNovaDiag(detail);
  try {
    console.warn('[Nova]', safe);
  } catch {
    /* consola no disponible */
  }
  try {
    fetch(`${API_BASE}/public/nova-voice/diag`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(safe),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* el diagnóstico no puede romper la página */
  }
}

function openPlaybackContext() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) {
    const error = new Error('AudioContext missing');
    error.name = 'NotSupportedError';
    throw error;
  }
  const context = new Ctor();
  try {
    const pending = context.resume();
    if (pending && typeof pending.catch === 'function') pending.catch(() => {});
  } catch {
    /* resume puede fallar si el contexto ya se cerró */
  }
  return context;
}

function xaiErrorMessage(event) {
  const error = event && event.error;
  if (error && typeof error === 'object') {
    return String(error.message || error.code || error.type || 'xai error');
  }
  if (event && typeof event.message === 'string') return event.message;
  return 'xai error';
}

async function readProvider() {
  try {
    const response = await fetch(`${API_BASE}/public/nova-voice`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return 'browser';
    return resolveNovaVoiceProvider(await response.json());
  } catch {
    return 'browser';
  }
}

const NovaVoiceDemo = () => {
  const voice = useVoice();
  const [provider, setProvider] = useState('pending');
  const [status, setStatus] = useState('idle');
  const [agentMode, setAgentMode] = useState('listening');
  const [engine, setEngine] = useState(null);
  const [heard, setHeard] = useState('');
  const rootRef = useRef(null);
  const barsRef = useRef([]);
  const mountedRef = useRef(true);
  const providerRef = useRef('pending');
  const callRef = useRef(null);
  const browserStep = useRef('idle');
  const sawSpeaking = useRef(false);

  const phase = novaPhase(status, agentMode);
  const ui = PHASE_UI[phase] || PHASE_UI.idle;
  const inCall = engine === 'grok' || engine === 'browser';
  const label = novaStatusLabel(status, agentMode);

  const safe = (fn) => {
    if (mountedRef.current) fn();
  };

  const paintLevels = (levels) => {
    if (prefersReducedMotion()) return;
    barsRef.current.forEach((bar, index) => {
      if (!bar) return;
      const level = Math.max(BAR_BASE[index] * 0.35, 0.08 + (levels[index] || 0) * 0.92);
      bar.style.transform = `scaleY(${level.toFixed(3)})`;
    });
  };

  const stopCall = useCallback(() => {
    const call = callRef.current;
    callRef.current = null;
    browserStep.current = 'idle';
    sawSpeaking.current = false;
    if (call) {
      try { call.stop(); } catch { /* already closed */ }
    }
    try { voice.stopSpeaking(); } catch { /* speech API unavailable */ }
    try { voice.stopListening(); } catch { /* speech API unavailable */ }
  }, [voice]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    readProvider().then((next) => {
      if (cancelled) return;
      providerRef.current = next;
      setProvider(next);
    });
    return () => {
      cancelled = true;
      mountedRef.current = false;
      const call = callRef.current;
      callRef.current = null;
      if (call) {
        try { call.stop(); } catch { /* already closed */ }
      }
    };
  }, []);

  useEffect(() => {
    if (engine !== 'browser') return;
    if (voice.isSpeaking) sawSpeaking.current = true;
    if (browserStep.current === 'greeting' && sawSpeaking.current && !voice.isSpeaking) {
      browserStep.current = 'listening';
      let started = false;
      try {
        started = voice.startListening();
      } catch {
        started = false;
      }
      if (!started) {
        safe(() => {
          setEngine(null);
          setStatus('text');
        });
      } else {
        safe(() => setAgentMode('listening'));
      }
    }
  }, [engine, voice.isSpeaking, voice]);

  useEffect(() => {
    if (engine !== 'browser') return;
    if (browserStep.current !== 'listening' || voice.isListening) return;
    const transcript = (voice.transcript || '').trim();
    if (!transcript) return;
    browserStep.current = 'done';
    safe(() => {
      setHeard(transcript);
      setAgentMode('speaking');
    });
    try {
      voice.speak(BROWSER_FOLLOWUP);
    } catch {
      safe(() => setStatus('text'));
    }
  }, [engine, voice.isListening, voice.transcript, voice]);

  const startBrowser = () => {
    if (!voice.isSupported) return false;
    browserStep.current = 'greeting';
    sawSpeaking.current = false;
    setEngine('browser');
    setStatus('browser');
    setAgentMode('speaking');
    try {
      return voice.speak(NOVA_GREETING) !== false;
    } catch {
      return false;
    }
  };

  const startGrok = async (playback) => {
    const diag = { stage: 'unknown', httpStatus: null, wsCode: null, wsReason: '', message: '' };
    const note = (partial) => {
      Object.assign(diag, partial);
    };
    const releasePlayback = () => {
      try {
        if (playback && playback.close) playback.close().catch(() => {});
      } catch {
        /* el contexto ya estaba cerrado */
      }
    };
    let payload;
    try {
      const response = await fetch(`${API_BASE}/public/nova-voice/session`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.provider !== 'grok' || !payload.token || !payload.websocket_url) {
        note({
          stage: 'session',
          httpStatus: response.status,
          message: payload.detail || payload.provider || 'session rejected',
        });
        reportNovaFailure(diag);
        releasePlayback();
        return 'fail';
      }
    } catch (error) {
      note({ stage: 'session', message: (error && error.name) || 'network' });
      reportNovaFailure(diag);
      releasePlayback();
      return 'fail';
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof WebSocket === 'undefined') {
      note({ stage: 'mic', message: 'mediaDevices or WebSocket missing' });
      reportNovaFailure(diag);
      releasePlayback();
      return 'fail';
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
    } catch (error) {
      note({ stage: 'mic', message: (error && (error.name || error.message)) || 'getUserMedia' });
      reportNovaFailure(diag);
      releasePlayback();
      return isMicDenied(error) ? 'mic-denied' : 'fail';
    }

    let inputContext;
    try {
      inputContext = new AudioContext();
      if (inputContext.resume) await inputContext.resume();
    } catch (error) {
      note({ stage: 'audiocontext', message: (error && (error.name || error.message)) || 'input AudioContext' });
      reportNovaFailure(diag);
      stream.getTracks().forEach((track) => track.stop());
      releasePlayback();
      return 'fail';
    }

    const inputRate = choosePcmRate(inputContext.sampleRate);
    const outputRate = Number(payload.output_sample_rate) || 24000;
    const sources = [];
    let nextTime = 0;
    let ws;
    let processor;
    let settled = false;
    let ready = false;
    let configured = false;
    let greeted = false;
    let userEnded = false;

    const stopMic = () => {
      if (processor) {
        try { processor.disconnect(); } catch { /* already stopped */ }
        processor.onaudioprocess = null;
        processor = null;
      }
      stream.getTracks().forEach((track) => track.stop());
      if (inputContext && inputContext.close) inputContext.close().catch(() => {});
      sources.forEach((source) => {
        try { source.stop(); } catch { /* already ended */ }
      });
      if (playback && playback.close) playback.close().catch(() => {});
    };

    const playDelta = (b64) => {
      if (!b64 || !playback) return;
      try {
        const bytes = decodeBase64(b64);
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const sampleCount = Math.floor(bytes.byteLength / 2);
        if (!sampleCount) return;
        const audioBuffer = playback.createBuffer(1, sampleCount, outputRate);
        const channel = audioBuffer.getChannelData(0);
        const pcm = new Int16Array(sampleCount);
        for (let i = 0; i < sampleCount; i += 1) {
          pcm[i] = view.getInt16(i * 2, true);
          channel[i] = pcm[i] / 32768;
        }
        const source = playback.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(playback.destination);
        const startAt = Math.max(playback.currentTime, nextTime);
        source.start(startAt);
        nextTime = startAt + audioBuffer.duration;
        sources.push(source);
        paintLevels(levelsFromPcm16(pcm, BAR_COUNT));
        if (rootRef.current) {
          const rms = levelsFromPcm16(pcm, 1)[0] || 0;
          rootRef.current.style.setProperty('--nova-level', Math.min(1, rms).toFixed(3));
        }
        safe(() => setAgentMode('speaking'));
      } catch {
        /* a bad audio chunk must not take down the page */
      }
    };

    const beginMic = () => {
      try {
        const source = inputContext.createMediaStreamSource(stream);
        processor = inputContext.createScriptProcessor(4096, 1, 1);
        const mute = inputContext.createGain();
        mute.gain.value = 0;
        processor.onaudioprocess = (event) => {
          if (!ws || ws.readyState !== WebSocket.OPEN) return;
          try {
            let channel = event.inputBuffer.getChannelData(0);
            if (inputContext.sampleRate !== inputRate) {
              channel = downsampleFloat32(channel, inputContext.sampleRate, inputRate);
            }
            const pcm = floatToPcm16(channel);
            ws.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: encodePcm16Base64(pcm),
            }));
          } catch {
            /* ignore one bad frame */
          }
        };
        source.connect(processor);
        processor.connect(mute);
        mute.connect(inputContext.destination);
      } catch {
        /* the call can still play the greeting if the mic graph fails */
      }
    };

    const readyPromise = new Promise((resolve) => {
      const finish = (result) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      let openToolCalls = 0;
      const toolNotRegistered = {
        ok: false,
        registered: false,
        message: 'No se ha podido registrar la solicitud. No digas que quedó registrada.',
      };
      const handleNovaToolCall = (event) => {
        const callId = event && event.call_id;
        if (!callId) return;
        openToolCalls += 1;
        executeWebsiteAnalysisTool(event, { fetchImpl: fetch, apiBase: API_BASE })
          .then((output) => {
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            ws.send(JSON.stringify(functionCallOutputItem(callId, output)));
          })
          .catch(() => {
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            ws.send(JSON.stringify(functionCallOutputItem(callId, toolNotRegistered)));
          })
          .finally(() => {
            openToolCalls -= 1;
            if (openToolCalls === 0 && ws && ws.readyState === WebSocket.OPEN) {
              try {
                ws.send(JSON.stringify({ type: 'response.create' }));
              } catch {
                /* la llamada puede haber colgado */
              }
            }
          });
      };

      const timer = window.setTimeout(() => {
        if (!ready) {
          note({ stage: 'timeout', message: 'session.updated timeout' });
          try { ws && ws.close(); } catch { /* ignore */ }
          stopMic();
          finish('fail');
        }
      }, 8000);

      try {
        ws = new WebSocket(payload.websocket_url, [`xai-client-secret.${payload.token}`]);
      } catch (error) {
        note({ stage: 'ws', message: (error && (error.name || error.message)) || 'WebSocket' });
        window.clearTimeout(timer);
        stopMic();
        finish('fail');
        return;
      }

      ws.onmessage = (message) => {
        let event;
        try {
          event = JSON.parse(message.data);
        } catch {
          return;
        }
        const type = event && event.type;
        if ((type === 'session.created' || type === 'conversation.created') && !configured) {
          configured = true;
          try {
            ws.send(JSON.stringify(buildGrokSessionUpdate({
              instructions: payload.instructions,
              voice: payload.voice || 'ara',
              inputRate,
              outputRate,
              tools: payload.tools,
            })));
          } catch (error) {
            note({ stage: 'ws', message: (error && error.message) || 'session.update send' });
            finish('fail');
          }
        }
        if (type === 'session.updated' && !greeted) {
          greeted = true;
          ready = true;
          window.clearTimeout(timer);
          try {
            if (playback && playback.resume) playback.resume();
          } catch (error) {
            note({ stage: 'audiocontext', message: (error && error.name) || 'playback resume' });
          }
          try {
            ws.send(JSON.stringify(greetingItem()));
            ws.send(JSON.stringify({ type: 'response.create' }));
          } catch {
            /* the visitor can still speak */
          }
          beginMic();
          safe(() => {
            setEngine('grok');
            setStatus('connected');
            setAgentMode('listening');
          });
          finish('ok');
        }
        if (type === 'response.function_call_arguments.done') {
          handleNovaToolCall(event);
        }
        if (type === 'response.output_audio.delta' || type === 'response.audio.delta') {
          playDelta(event.delta);
        }
        if (type === 'response.done') {
          safe(() => setAgentMode('listening'));
        }
        if (type === 'input_audio_buffer.speech_started') {
          sources.splice(0).forEach((source) => {
            try { source.stop(); } catch { /* already ended */ }
          });
          if (playback) nextTime = playback.currentTime;
          safe(() => setAgentMode('listening'));
        }
        if (type === 'error' && !ready) {
          note({ stage: 'xai', message: xaiErrorMessage(event) });
          window.clearTimeout(timer);
          try { ws.close(); } catch { /* ignore */ }
          stopMic();
          finish('fail');
        }
      };

      ws.onerror = () => {
        if (!ready) {
          if (!diag.message) note({ stage: 'ws', message: 'websocket error' });
          window.clearTimeout(timer);
          stopMic();
          finish('fail');
        }
      };

      ws.onclose = (event) => {
        const code = event && typeof event.code === 'number' ? event.code : null;
        const reason = event && event.reason ? String(event.reason) : '';
        if (userEnded) {
          stopMic();
          return;
        }
        if (!ready) {
          if (diag.stage === 'unknown') note({ stage: 'ws', message: 'websocket closed before ready' });
          if (diag.wsCode == null) note({ wsCode: code, wsReason: reason });
          window.clearTimeout(timer);
          stopMic();
          finish('fail');
          return;
        }
        if (callRef.current && callRef.current.ws === ws) {
          stopMic();
          callRef.current = null;
          reportNovaFailure({
            stage: 'dropped',
            wsCode: code,
            wsReason: reason,
            message: 'closed after ready',
          });
          safe(() => {
            let browserOk = false;
            try { browserOk = startBrowser(); } catch { browserOk = false; }
            if (!browserOk) {
              setEngine(null);
              setStatus('text');
            }
          });
        }
      };
    });

    callRef.current = {
      ws,
      stop: () => {
        userEnded = true;
        ready = false;
        try { ws && ws.close(); } catch { /* ignore */ }
        stopMic();
      },
    };

    const result = await readyPromise;
    if (result !== 'ok') {
      callRef.current = null;
      reportNovaFailure(diag);
    }
    return result;
  };

  const start = async (playback) => {
    setHeard('');
    setStatus('connecting');
    setAgentMode('listening');
    let nextProvider = providerRef.current;
    if (nextProvider === 'pending') {
      nextProvider = await readProvider();
      providerRef.current = nextProvider;
      safe(() => setProvider(nextProvider));
    }
    if (!mountedRef.current) return;
    if (nextProvider === 'text') {
      if (playback && playback.close) playback.close().catch(() => {});
      setStatus('text');
      return;
    }
    if (nextProvider === 'grok') {
      let result = 'fail';
      try {
        result = await startGrok(playback);
      } catch (error) {
        reportNovaFailure({ stage: 'unknown', message: (error && error.message) || 'startGrok' });
        result = 'fail';
      }
      if (!mountedRef.current) {
        stopCall();
        return;
      }
      if (result === 'ok') return;
    } else if (playback && playback.close) {
      playback.close().catch(() => {});
    }
    let browserOk = false;
    try {
      browserOk = startBrowser();
    } catch {
      browserOk = false;
    }
    if (!browserOk) {
      setEngine(null);
      setStatus('text');
    }
  };

  const stop = () => {
    stopCall();
    setEngine(null);
    setStatus(providerRef.current === 'text' ? 'text' : 'idle');
    setAgentMode('listening');
    if (rootRef.current) rootRef.current.style.setProperty('--nova-level', '0');
    barsRef.current.forEach((bar) => {
      if (bar) bar.style.transform = '';
    });
  };

  const showButton = provider !== 'text' || inCall;
  const ctaBase =
    'nova-cta group mt-4 inline-flex min-h-[3.125rem] w-full items-center justify-center gap-3 rounded-2xl px-6 text-base font-semibold transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-wait disabled:opacity-80 motion-reduce:transition-none md:min-h-[3.25rem] md:text-[17px]';
  const ctaIdle = `${ctaBase} border border-white/20 bg-[linear-gradient(110deg,#F97316_0%,#A78BFA_55%,#38BDF8_100%)] text-white shadow-[0_0_0_1px_rgba(167,139,250,0.25),0_14px_40px_rgba(167,139,250,0.38)] hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(198,244,50,0.35),0_18px_48px_rgba(167,139,250,0.5)] focus-visible:ring-[#DDD6FE] motion-reduce:hover:translate-y-0`;
  const ctaHang = `${ctaBase} border border-[#FDBA74]/50 bg-[#1a0f08] text-[#FED7AA] shadow-[0_10px_30px_rgba(249,115,22,0.22)] hover:bg-[#24140a] focus-visible:ring-[#FDBA74]`;

  return (
    <div ref={rootRef} className="nova-demo" data-phase={phase} data-status={status} data-engine={engine || 'text'}>
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
          <blockquote className="text-[14px] leading-6 text-zinc-100 md:text-[15px]">{NOVA_GREETING_DISPLAY}</blockquote>
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

      {showButton && (
        <button
          type="button"
          onClick={inCall ? stop : () => {
            let playback = null;
            try {
              playback = openPlaybackContext();
            } catch (error) {
              reportNovaFailure({
                stage: 'audiocontext',
                message: (error && (error.name || error.message)) || 'AudioContext',
              });
            }
            start(playback).catch((error) => {
              reportNovaFailure({ stage: 'unknown', message: (error && error.message) || 'start' });
              safe(() => setStatus('text'));
            });
          }}
          disabled={status === 'connecting'}
          aria-pressed={inCall}
          className={inCall ? ctaHang : ctaIdle}
          data-testid="nova-talk-button"
        >
          {inCall ? <HangUpIcon /> : <MicIcon />}
          {inCall ? 'Colgar' : status === 'connecting' ? 'Conectando…' : 'Habla con Nova'}
        </button>
      )}

      <p
        aria-live="polite"
        data-testid="nova-status-text"
        className={`mt-2 min-h-[1.25rem] text-center text-[13px] leading-5 ${phase === 'error' ? 'text-[#FDBA74]' : 'text-zinc-400'}`}
      >
        {label}
      </p>
      {heard ? (
        <p className="mt-1 text-center text-[13px] leading-5 text-zinc-500">Has dicho: {heard}</p>
      ) : null}
    </div>
  );
};

export default NovaVoiceDemo;
