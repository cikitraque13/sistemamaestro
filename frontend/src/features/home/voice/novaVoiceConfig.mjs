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
  return '';
};
