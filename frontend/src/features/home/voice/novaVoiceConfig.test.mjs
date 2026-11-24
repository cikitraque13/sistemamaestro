import test from 'node:test';
import assert from 'node:assert/strict';

import { novaStatusLabel, resolveNovaVoiceConfig } from './novaVoiceConfig.mjs';

test('sin variables la voz de Nova queda apagada', () => {
  assert.deepEqual(resolveNovaVoiceConfig({}), { mode: 'off' });
  assert.deepEqual(resolveNovaVoiceConfig(undefined), { mode: 'off' });
});

test('un agent id público de ElevenLabs activa la conversación en la página', () => {
  assert.deepEqual(
    resolveNovaVoiceConfig({ VITE_ELEVENLABS_AGENT_ID: '  agent_7101k5zvyjhmfg983brhmhkd98n6 ' }),
    { mode: 'elevenlabs', agentId: 'agent_7101k5zvyjhmfg983brhmhkd98n6' }
  );
});

test('el agent id tiene prioridad sobre el enlace', () => {
  const config = resolveNovaVoiceConfig({
    VITE_ELEVENLABS_AGENT_ID: 'agent_abcdef123456',
    VITE_VOICE_AGENT_URL: 'https://example.com/nova',
  });
  assert.equal(config.mode, 'elevenlabs');
});

test('valores no válidos no muestran el botón', () => {
  assert.deepEqual(resolveNovaVoiceConfig({ VITE_ELEVENLABS_AGENT_ID: 'sk_secreto' }), { mode: 'off' });
  assert.deepEqual(resolveNovaVoiceConfig({ VITE_ELEVENLABS_AGENT_ID: 'agent_<script>' }), { mode: 'off' });
  assert.deepEqual(resolveNovaVoiceConfig({ VITE_VOICE_AGENT_URL: 'http://example.com' }), { mode: 'off' });
  assert.deepEqual(resolveNovaVoiceConfig({ VITE_VOICE_AGENT_URL: 'javascript:alert(1)' }), { mode: 'off' });
});

test('el enlace https sigue funcionando como alternativa', () => {
  assert.deepEqual(resolveNovaVoiceConfig({ VITE_VOICE_AGENT_URL: 'https://example.com/nova' }), {
    mode: 'link',
    url: 'https://example.com/nova',
  });
});

test('textos de estado en español', () => {
  assert.equal(novaStatusLabel('idle'), '');
  assert.equal(novaStatusLabel('connecting'), 'Conectando con Nova…');
  assert.equal(novaStatusLabel('connected', 'listening'), 'Nova te escucha');
  assert.equal(novaStatusLabel('connected', 'speaking'), 'Nova está hablando');
  assert.match(novaStatusLabel('mic-denied'), /micrófono/);
  assert.match(novaStatusLabel('error'), /No se ha podido conectar/);
});
