// Voz de Nova en la portada. La clave del proveedor no vive aquí.
// El backend dice si toca Grok (`grok`), la voz del navegador (`browser`) o solo texto (`text`).

export const NOVA_GREETING =
  'Hola, soy Nova, asistente de inteligencia artificial de Sistema Maestro. Estoy aquí para explicarte el producto con claridad y resolver tus dudas. ¿Me cuentas en una frase qué negocio tienes y qué te trae por aquí?';

export const NOVA_GREETING_DISPLAY = `«${NOVA_GREETING}»`;

export const BROWSER_FOLLOWUP =
  'Gracias. Te he escuchado. Si la voz en directo no está disponible, el saludo de Nova sigue escrito aquí.';

export const PCM_RATES = [8000, 16000, 22050, 24000, 32000, 44100, 48000];

export const choosePcmRate = (nativeRate) => {
  const rate = Number(nativeRate);
  return PCM_RATES.includes(rate) ? rate : 24000;
};

export const resolveNovaVoiceProvider = (config) => {
  const provider = String((config && config.provider) || '').trim().toLowerCase();
  if (provider === 'grok' || provider === 'browser' || provider === 'text') return provider;
  return 'browser';
};

export const buildGrokSessionUpdate = ({ instructions, voice, inputRate, outputRate = 24000 }) => ({
  type: 'session.update',
  session: {
    voice,
    instructions,
    turn_detection: { type: 'server_vad' },
    audio: {
      input: {
        format: { type: 'audio/pcm', rate: inputRate },
        transcription: { language_hint: 'es-ES' },
      },
      output: {
        format: { type: 'audio/pcm', rate: outputRate },
      },
    },
  },
});

export const greetingItem = () => ({
  type: 'conversation.item.create',
  item: {
    type: 'message',
    role: 'user',
    content: [
      {
        type: 'input_text',
        text: 'El visitante acaba de abrir la demo. Di ahora tu saludo exacto.',
      },
    ],
  },
});

export const novaStatusLabel = (status, agentMode) => {
  if (status === 'connecting') return 'Conectando con Nova…';
  if (status === 'connected') {
    return agentMode === 'speaking' ? 'Nova está hablando' : 'Nova te escucha';
  }
  if (status === 'browser') {
    return agentMode === 'speaking' ? 'Nova está hablando' : 'Voz del navegador. Nova te escucha.';
  }
  if (status === 'mic-denied') return 'Para hablar con Nova, permite el acceso al micrófono.';
  if (status === 'error') return 'No se ha podido conectar con Nova. Inténtalo de nuevo en un momento.';
  if (status === 'dropped') return 'La llamada se ha cortado. Puedes intentarlo otra vez.';
  if (status === 'text') return 'Nova está disponible por escrito.';
  return '';
};

export const novaPhase = (status, agentMode) => {
  if (status === 'connecting') return 'connecting';
  if (status === 'connected' || status === 'browser') {
    return agentMode === 'speaking' ? 'speaking' : 'listening';
  }
  if (status === 'error' || status === 'mic-denied' || status === 'dropped') return 'error';
  return 'idle';
};

export const floatToPcm16 = (float32) => {
  const pcm = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, float32[i] || 0));
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return pcm;
};

export const encodePcm16Base64 = (pcm) => {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

export const downsampleFloat32 = (input, inputRate, outputRate) => {
  if (!input || inputRate === outputRate || !inputRate || !outputRate) return input;
  const ratio = inputRate / outputRate;
  const length = Math.max(1, Math.floor(input.length / ratio));
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const pos = i * ratio;
    const left = Math.floor(pos);
    const right = Math.min(left + 1, input.length - 1);
    const weight = pos - left;
    out[i] = input[left] * (1 - weight) + input[right] * weight;
  }
  return out;
};

export const levelsFromPcm16 = (samples, bars) => {
  const out = new Array(bars).fill(0);
  if (!samples || !samples.length || bars <= 0) return out;
  const step = samples.length / bars;
  for (let i = 0; i < bars; i += 1) {
    const from = Math.floor(i * step);
    const to = Math.max(from + 1, Math.floor((i + 1) * step));
    let sum = 0;
    let count = 0;
    for (let j = from; j < to && j < samples.length; j += 1) {
      const value = samples[j] / 32768;
      sum += value * value;
      count += 1;
    }
    out[i] = count ? Math.min(1, Math.sqrt(sum / count) * 2) : 0;
  }
  return out;
};

export const isMicDenied = (error) =>
  Boolean(error && (error.name === 'NotAllowedError' || error.name === 'SecurityError'));

const SECRET_PATTERN = /bearer\s+\S+|xai-[a-z0-9-]{6,}|client-secret\S*|sk-[a-z0-9]+/gi;

export const sanitizeNovaDiag = (detail = {}) => {
  const clip = (value, limit) =>
    String(value == null ? '' : value).replace(SECRET_PATTERN, '[redacted]').slice(0, limit);
  const httpStatus = Number.isInteger(detail.httpStatus) ? detail.httpStatus : null;
  const wsCode = Number.isInteger(detail.wsCode) ? detail.wsCode : null;
  const stage = clip(detail.stage || 'unknown', 32).trim().toLowerCase() || 'unknown';
  return {
    stage,
    http_status: httpStatus != null && httpStatus >= 0 && httpStatus <= 599 ? httpStatus : null,
    ws_code: wsCode != null && wsCode >= 0 && wsCode <= 4999 ? wsCode : null,
    ws_reason: clip(detail.wsReason, 160),
    message: clip(detail.message, 160),
  };
};
