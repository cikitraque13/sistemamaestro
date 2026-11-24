import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isEarlyDrop,
  levelsFromFrequency,
  novaPhase,
  novaStatusLabel,
  resolveNovaVoiceConfig,
} from './novaVoiceConfig.mjs';

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

test('corte temprano: aviso visible si la llamada cae en menos de 3 s', () => {
  assert.match(novaStatusLabel('dropped'), /cortado/);
  assert.equal(isEarlyDrop(null, 1000), true);
  assert.equal(isEarlyDrop(1000, 3500), true);
  assert.equal(isEarlyDrop(1000, 4000), false);
});

test('fases visuales de la demo', () => {
  assert.equal(novaPhase('idle'), 'idle');
  assert.equal(novaPhase('connecting'), 'connecting');
  assert.equal(novaPhase('connected', 'listening'), 'listening');
  assert.equal(novaPhase('connected', 'speaking'), 'speaking');
  assert.equal(novaPhase('dropped'), 'error');
  assert.equal(novaPhase('mic-denied'), 'error');
});

test('la onda se calcula con el volumen real del espectro', () => {
  assert.deepEqual(levelsFromFrequency(null, 3), [0, 0, 0]);
  const silent = levelsFromFrequency(new Uint8Array(64), 8);
  assert.equal(silent.length, 8);
  assert.ok(silent.every((v) => v === 0));
  const loud = levelsFromFrequency(new Uint8Array(64).fill(255), 8);
  assert.ok(loud.every((v) => v === 1));
  const mixed = new Uint8Array(64);
  mixed.fill(255, 0, 4);
  const levels = levelsFromFrequency(mixed, 8);
  assert.equal(levels[0], 1);
  assert.equal(levels[7], 0);
});
