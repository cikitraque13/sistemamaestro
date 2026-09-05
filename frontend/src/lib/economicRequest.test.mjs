import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { economicPost, runEconomicRequest } from './economicRequest.js';

const stored = new Map();
globalThis.sessionStorage = {
  getItem: (key) => stored.get(key) || null,
  setItem: (key, value) => stored.set(key, value),
  removeItem: (key) => stored.delete(key),
};

test('network retry reuses identity; successful identical new request gets a new identity', async () => {
  const keys = [];
  const send = async (key) => { keys.push(key); if (keys.length === 1) throw new Error('network'); return 'ok'; };
  await assert.rejects(runEconomicRequest('retry-case', { prompt: 'synthetic' }, send));
  await runEconomicRequest('retry-case', { prompt: 'synthetic' }, send);
  await runEconomicRequest('retry-case', { prompt: 'synthetic' }, send);
  assert.equal(keys[0], keys[1]);
  assert.notEqual(keys[1], keys[2]);
});

test('pending identity survives same-tab module reload without persisting input', async () => {
  let first;
  await assert.rejects(runEconomicRequest('reload-case', { prompt: 'private-synthetic' }, async (key) => {
    first = key; throw new Error('network');
  }));
  assert.ok(!JSON.stringify([...stored]).includes('private-synthetic'));
  const fresh = await import('./economicRequest.js?reload-test');
  await fresh.runEconomicRequest('reload-case', { prompt: 'private-synthetic' }, async (key) => assert.equal(key, first));
});

test('explicit new operation differs from retry even with identical pending payload', async () => {
  let first;
  await assert.rejects(runEconomicRequest('new-case', {}, async (key) => { first = key; throw new Error('network'); }));
  await runEconomicRequest('new-case', {}, async (key) => assert.notEqual(key, first), { newOperation: true });
});

test('axios adapter preserves headers and credentials and adds stable identity', async () => {
  const calls = [];
  const client = { post: async (...args) => { calls.push(args); if (calls.length === 1) throw new Error('network'); return { data: {} }; } };
  const config = { withCredentials: true, headers: { 'X-Synthetic': 'test' } };
  await assert.rejects(economicPost(client, '/projects', { input_content: 'synthetic' }, config));
  await economicPost(client, '/projects', { input_content: 'synthetic' }, config);
  assert.equal(calls[0][2].headers['Idempotency-Key'], calls[1][2].headers['Idempotency-Key']);
  assert.equal(calls[1][2].headers['X-Synthetic'], 'test');
  assert.equal(calls[1][2].withCredentials, true);
});

test('reconciliation keeps identity; confirmed terminal rejection permits new operation', async () => {
  const keys = [];
  const send = async (key) => {
    keys.push(key);
    if (keys.length <= 2) throw { response: { status: keys.length === 1 ? 503 : 409,
      data: { detail: { retry_with_new_key: keys.length === 2 } } } };
  };
  await assert.rejects(runEconomicRequest('reconcile-case', {}, send));
  await assert.rejects(runEconomicRequest('reconcile-case', {}, send));
  await runEconomicRequest('reconcile-case', {}, send);
  assert.equal(keys[0], keys[1]);
  assert.notEqual(keys[1], keys[2]);
});

test('actual Builder fetch client retains identity until response JSON is available', async () => {
  const url = new URL('../features/builder/api/builderAiClient.js', import.meta.url);
  const source = (await readFile(url, 'utf8')).replace(
    "'../../../lib/economicRequest'", JSON.stringify(new URL('./economicRequest.js', import.meta.url).href),
  );
  const { buildWithBuilderAI } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const requests = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    requests.push(options);
    return { ok: true, json: async () => {
      if (requests.length === 1) throw new Error('connection lost before JSON');
      return { assistantMessage: 'synthetic' };
    } };
  };
  try {
    await assert.rejects(buildWithBuilderAI({ userInput: 'synthetic' }));
    await buildWithBuilderAI({ userInput: 'synthetic' });
    assert.equal(requests[0].headers['Idempotency-Key'], requests[1].headers['Idempotency-Key']);
    assert.equal(requests[0].credentials, 'include');
  } finally { globalThis.fetch = original; }
});
