import { readFileSync } from 'node:fs';
import path from 'node:path';

import { disableBrowserSpeech, frameTokenFromLocation } from './frameMain';

test('el marco reutiliza NovaVoiceDemo tal cual', () => {
  const source = readFileSync(path.resolve('src/embed/frameMain.js'), 'utf8');
  expect(source).toContain("import('../features/home/voice/NovaVoiceDemo.js')");
  expect(source).not.toContain('NOVA_GREETING =');
});

test('el token vive en el fragmento y la voz del navegador queda en silencio', () => {
  expect(frameTokenFromLocation({ hash: '#frame-token-1' })).toBe('frame-token-1');
  expect(frameTokenFromLocation({ hash: '' })).toBe('');
  const target = {};
  disableBrowserSpeech(target);
  expect(target.speechSynthesis.getVoices()).toEqual([]);
  expect(target.SpeechRecognition).toBeUndefined();
});
