// Configuración pública de la voz en vivo de Nova (demo de la sección Agencia de IA).
//
// Solo se leen identificadores PÚBLICOS en el build:
//   - VITE_ELEVENLABS_AGENT_ID: id público del agente de ElevenLabs (agent_...).
//     Es público por diseño: el agente debe tener la autenticación desactivada
//     y la lista de dominios permitidos (allowlist) limitada a sistemamaestro.com.
//   - VITE_VOICE_AGENT_URL: alternativa, enlace https a una página de conversación
//     alojada por el proveedor (se abre en otra pestaña).
// Nunca se pone aquí una clave de API: la clave del proveedor no va al frontend.

const AGENT_ID_PATTERN = /^agent_[A-Za-z0-9]{8,64}$/;

export const resolveNovaVoiceConfig = (env = {}) => {
  const agentId = String(env.VITE_ELEVENLABS_AGENT_ID || '').trim();
  if (AGENT_ID_PATTERN.test(agentId)) {
    return { mode: 'elevenlabs', agentId };
  }

  const url = String(env.VITE_VOICE_AGENT_URL || '').trim();
  if (/^https:\/\/\S+$/i.test(url)) {
    return { mode: 'link', url };
  }

  return { mode: 'off' };
};

// Texto de estado que se muestra bajo el botón mientras dura la conversación.
export const novaStatusLabel = (status, agentMode) => {
  if (status === 'connecting') return 'Conectando con Nova…';
  if (status === 'connected') {
    return agentMode === 'speaking' ? 'Nova está hablando' : 'Nova te escucha';
  }
  if (status === 'mic-denied') {
    return 'Para hablar con Nova, permite el acceso al micrófono.';
  }
  if (status === 'error') {
    return 'No se ha podido conectar con Nova. Inténtalo de nuevo en un momento.';
  }
  if (status === 'dropped') {
    return 'La llamada se ha cortado nada más empezar. Revisa el micrófono y vuelve a intentarlo.';
  }
  return '';
};

// Fase visual de la demo (avatar, onda y pastilla de estado).
export const novaPhase = (status, agentMode) => {
  if (status === 'connecting') return 'connecting';
  if (status === 'connected') return agentMode === 'speaking' ? 'speaking' : 'listening';
  if (status === 'error' || status === 'mic-denied' || status === 'dropped') return 'error';
  return 'idle';
};

// Una llamada que se cierra en menos de 3 s desde que conectó (o antes de
// conectar) cuenta como corte temprano: se avisa en pantalla en vez de volver
// al estado inicial en silencio.
export const NOVA_EARLY_DROP_MS = 3000;

export const isEarlyDrop = (connectedAt, now, thresholdMs = NOVA_EARLY_DROP_MS) =>
  !connectedAt || now - connectedAt < thresholdMs;

// Convierte el espectro real de la llamada (Uint8Array 0-255 del SDK) en
// `bars` niveles 0-1 para la onda. Usa la mitad baja del espectro, que es
// donde está la voz.
export const levelsFromFrequency = (data, bars) => {
  const out = new Array(bars).fill(0);
  if (!data || !data.length || bars <= 0) return out;
  const usable = Math.max(bars, Math.floor(data.length * 0.5));
  const step = usable / bars;
  for (let i = 0; i < bars; i += 1) {
    const from = Math.floor(i * step);
    const to = Math.max(from + 1, Math.floor((i + 1) * step));
    let sum = 0;
    let count = 0;
    for (let j = from; j < to && j < data.length; j += 1) {
      sum += data[j];
      count += 1;
    }
    out[i] = count ? Math.min(1, sum / count / 255) : 0;
  }
  return out;
};
