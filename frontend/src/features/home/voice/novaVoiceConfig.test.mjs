import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NOVA_GREETING,
  BROWSER_FOLLOWUP,
  buildGrokSessionUpdate,
  choosePcmRate,
  encodePcm16Base64,
  executeWebsiteAnalysisTool,
  floatToPcm16,
  functionCallOutputItem,
  levelsFromPcm16,
  postWebsiteAnalysis,
  novaPhase,
  novaStatusLabel,
  resolveNovaVoiceProvider,
  sanitizeNovaDiag,
} from './novaVoiceConfig.mjs';

test('sin respuesta del servidor Nova usa la voz del navegador', () => {
  assert.equal(resolveNovaVoiceProvider(undefined), 'browser');
  assert.equal(resolveNovaVoiceProvider({}), 'browser');
  assert.equal(resolveNovaVoiceProvider({ provider: 'nope' }), 'browser');
});

test('el servidor puede pedir Grok, navegador o texto', () => {
  assert.equal(resolveNovaVoiceProvider({ provider: 'grok' }), 'grok');
  assert.equal(resolveNovaVoiceProvider({ provider: 'browser' }), 'browser');
  assert.equal(resolveNovaVoiceProvider({ provider: 'text' }), 'text');
});

test('la frecuencia del micrófono se queda en una tasa que acepta el proveedor', () => {
  assert.equal(choosePcmRate(48000), 48000);
  assert.equal(choosePcmRate(44100), 44100);
  assert.equal(choosePcmRate(96000), 24000);
  assert.equal(choosePcmRate(undefined), 24000);
});

test('session.update pide español de España y pcm', () => {
  const message = buildGrokSessionUpdate({
    instructions: 'Habla en es-ES.',
    voice: 'ara',
    inputRate: 48000,
  });
  assert.equal(message.type, 'session.update');
  assert.equal(message.session.voice, 'ara');
  assert.equal(message.session.audio.input.format.rate, 48000);
  assert.equal(message.session.audio.input.transcription.language_hint, 'es-ES');
  assert.equal(message.session.audio.output.format.type, 'audio/pcm');
  assert.equal(message.session.instructions.includes('es-ES') || message.session.instructions.length > 0, true);
});

test('el saludo de Nova sigue siendo el de la portada', () => {
  assert.match(NOVA_GREETING, /Hola, soy Nova/);
  assert.match(BROWSER_FOLLOWUP, /escrito/);
});

test('textos de estado en español', () => {
  assert.equal(novaStatusLabel('idle'), '');
  assert.equal(novaStatusLabel('connecting'), 'Conectando con Nova…');
  assert.equal(novaStatusLabel('connected', 'listening'), 'Nova te escucha');
  assert.equal(novaStatusLabel('connected', 'speaking'), 'Nova está hablando');
  assert.match(novaStatusLabel('mic-denied'), /micrófono/);
  assert.match(novaStatusLabel('text'), /escrito/);
  assert.match(novaStatusLabel('browser', 'listening'), /navegador/);
});

test('fases visuales', () => {
  assert.equal(novaPhase('idle'), 'idle');
  assert.equal(novaPhase('connecting'), 'connecting');
  assert.equal(novaPhase('connected', 'speaking'), 'speaking');
  assert.equal(novaPhase('browser', 'listening'), 'listening');
  assert.equal(novaPhase('text'), 'idle');
  assert.equal(novaPhase('mic-denied'), 'error');
});

test('el diagnóstico no se lleva tokens ni datos largos', () => {
  const clean = sanitizeNovaDiag({
    stage: 'ws',
    httpStatus: 503,
    wsCode: 1006,
    wsReason: 'bye',
    message: 'Bearer super-secret-key xai-realtime-client-secret-abc',
  });
  assert.equal(clean.stage, 'ws');
  assert.equal(clean.http_status, 503);
  assert.equal(clean.message.includes('super-secret-key'), false);
  assert.equal(clean.message.includes('xai-realtime'), false);
  assert.equal(Object.hasOwn(clean, 'token'), false);
});

test('el pcm16 se puede codificar y la onda no revienta con silencio', () => {
  const pcm = floatToPcm16(new Float32Array([0, 0.5, -0.5]));
  assert.equal(pcm.length, 3);
  assert.equal(pcm[0], 0);
  const encoded = encodePcm16Base64(pcm);
  assert.equal(typeof encoded, 'string');
  assert.ok(encoded.length > 0);
  assert.deepEqual(levelsFromPcm16(null, 4), [0, 0, 0, 0]);
  const loud = levelsFromPcm16(new Int16Array(16).fill(32767), 4);
  assert.ok(loud.every((value) => value > 0));
});

test('session.update incluye la herramienta de análisis cuando el servidor la manda', () => {
  const tool = { type: 'function', name: 'register_website_analysis' };
  const message = buildGrokSessionUpdate({
    instructions: 'Habla en es-ES.',
    voice: 'ara',
    inputRate: 24000,
    tools: [tool],
  });
  assert.deepEqual(message.session.tools, [tool]);
  const without = buildGrokSessionUpdate({
    instructions: 'Habla en es-ES.',
    voice: 'ara',
    inputRate: 24000,
  });
  assert.equal(Object.hasOwn(without.session, 'tools'), false);
});

test('la herramienta pide el alta de la solicitud y no manda el contacto sin consentimiento', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return {
      json: async () => ({
        ok: true,
        registered: true,
        status: 'queued',
        message: 'queda registrado para el análisis',
      }),
    };
  };
  const result = await executeWebsiteAnalysisTool(
    {
      name: 'register_website_analysis',
      arguments: JSON.stringify({
        business_name: 'Creative Flow',
        website_url: 'https://creativeflow.example',
        contact: 'lucas@example.com',
        consent: false,
      }),
    },
    { fetchImpl, apiBase: 'https://sistemamaestro.com/api' },
  );
  assert.equal(result.registered, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://sistemamaestro.com/api/public/nova-voice/website-analysis');
  const sent = JSON.parse(calls[0].options.body);
  assert.equal(sent.contact, '');
  assert.equal(sent.consent, false);
  assert.equal(sent.business_name, 'Creative Flow');
  const output = functionCallOutputItem('call-1', result);
  assert.equal(output.type, 'conversation.item.create');
  assert.equal(output.item.type, 'function_call_output');
  assert.equal(output.item.call_id, 'call-1');
  assert.equal(JSON.parse(output.item.output).status, 'queued');
});

test('si el alta falla, el resultado dice que no quedó registrada', async () => {
  const result = await postWebsiteAnalysis(async () => {
    throw new Error('offline');
  }, 'https://sistemamaestro.com/api', {
    business_name: 'Creative Flow',
    website_url: 'https://creativeflow.example',
    consent: true,
  });
  assert.equal(result.registered, false);
  assert.match(result.message, /No digas que quedó registrada/);
});
