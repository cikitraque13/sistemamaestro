import assert from 'node:assert/strict';
import test from 'node:test';
import { createLandingSync } from './landingPersistence.mjs';

function memoryStorage() {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => { items.set(key, String(value)); },
  };
}

test('an edit saved in one browser loads in another', async () => {
  const server = { record: null };
  const first = memoryStorage();
  const key = 'landing-key';
  const origin = createLandingSync({
    storage: first,
    load: async () => server.record,
    save: async (_projectId, record) => { server.record = record; },
    delayMs: 5000,
  });
  const edited = JSON.stringify({ ownerId: 'alice', projectId: 'p1', headline: 'Consulta' });
  first.setItem(key, edited);
  assert.equal(await origin.hydrate('p1', key), 'local');
  await origin.flush();
  assert.equal(server.record, edited);

  const second = memoryStorage();
  const otherBrowser = createLandingSync({
    storage: second,
    load: async () => server.record,
    save: async () => { throw new Error('read only'); },
    delayMs: 5000,
  });
  assert.equal(await otherBrowser.hydrate('p1', key), 'remote');
  assert.equal(second.getItem(key), edited);
});

test('a failed load keeps the local cache and a remote record replaces it', async () => {
  const storage = memoryStorage();
  const key = 'landing-key';
  storage.setItem(key, 'cache');
  const offline = createLandingSync({
    storage,
    load: async () => { throw new Error('offline'); },
    save: async () => {},
  });
  assert.equal(await offline.hydrate('p1', key), 'local');
  assert.equal(storage.getItem(key), 'cache');

  const online = createLandingSync({
    storage,
    load: async () => 'from-server',
    save: async () => {},
  });
  assert.equal(await online.hydrate('p1', key), 'remote');
  assert.equal(storage.getItem(key), 'from-server');
});

test('writes are debounced into one save', async () => {
  const saved = [];
  const sync = createLandingSync({
    storage: memoryStorage(),
    load: async () => null,
    save: async (_projectId, record) => { saved.push(record); },
    delayMs: 5000,
  });
  sync.noteWrite('p1', 'uno');
  sync.noteWrite('p1', 'dos');
  await sync.flush();
  assert.deepEqual(saved, ['dos']);
});
