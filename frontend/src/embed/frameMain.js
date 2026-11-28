import './embed.css';
import { API_BASE } from '../lib/apiClient';
import { installVoiceBridge } from './voiceBridge';

export function frameTokenFromLocation(location) {
  const hash = String((location && location.hash) || '').replace(/^#/, '');
  if (!hash) return '';
  try {
    return decodeURIComponent(hash).trim();
  } catch {
    return '';
  }
}

export function disableBrowserSpeech(windowObject) {
  const silent = {
    speak() {},
    cancel() {},
    getVoices() { return []; },
    pause() {},
    resume() {},
    speaking: false,
    pending: false,
    paused: false,
    addEventListener() {},
    removeEventListener() {},
  };
  try {
    windowObject.speechSynthesis = silent;
  } catch {
    /* el navegador puede no permitir sustituirlo */
  }
  try {
    windowObject.SpeechRecognition = undefined;
    windowObject.webkitSpeechRecognition = undefined;
  } catch {
    /* igual que arriba */
  }
}

export async function startEmbedFrame(windowObject = window) {
  const token = frameTokenFromLocation(windowObject.location);
  const root = windowObject.document && windowObject.document.getElementById('embed-root');
  if (!token || !root || root.dataset.mounted === '1') return;
  root.dataset.mounted = '1';
  disableBrowserSpeech(windowObject);
  const original = windowObject.fetch.bind(windowObject);
  windowObject.fetch = installVoiceBridge({
    fetchImpl: original,
    apiBase: API_BASE,
    frameToken: token,
  });
  const [{ createRoot }, React, voice] = await Promise.all([
    import('react-dom/client'),
    import('react'),
    import('../features/home/voice/NovaVoiceDemo.js'),
  ]);
  createRoot(root).render(React.createElement(voice.default));
}

if (typeof document !== 'undefined' && document.getElementById('embed-root')) {
  startEmbedFrame();
}
