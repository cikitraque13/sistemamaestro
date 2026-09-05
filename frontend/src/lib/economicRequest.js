// Preserve one logical intent through network failures, including same-tab reload.
// Only hashes and random keys are stored; never prompts, project data or tokens.
const pending = new Map();

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

export async function runEconomicRequest(scope, inputs, send, { newOperation = false } = {}) {
  const bytes = new TextEncoder().encode(JSON.stringify([scope, canonical(inputs)]));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const storageKey = 'sm.economic.' + Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, '0')).join('');
  let key = pending.get(storageKey);
  try { key = key || globalThis.sessionStorage?.getItem(storageKey); } catch (_) { /* memory fallback */ }
  if (!key || newOperation) key = globalThis.crypto.randomUUID();
  pending.set(storageKey, key);
  try { globalThis.sessionStorage?.setItem(storageKey, key); } catch (_) { /* memory fallback */ }
  const release = () => {
    // An older response must not erase a newer explicit operation's identity.
    if (pending.get(storageKey) !== key) return;
    pending.delete(storageKey);
    try {
      if (globalThis.sessionStorage?.getItem(storageKey) === key) globalThis.sessionStorage.removeItem(storageKey);
    } catch (_) { /* memory fallback */ }
  };
  try {
    const result = await send(key);
    release(); // A later successful identical submission is a distinct intent.
    return result;
  } catch (error) {
    const detail = error.response?.data?.detail;
    if (detail?.retry_with_new_key || [400, 401, 403, 422].includes(error.response?.status)) release();
    throw error; // Unknown result/busy/reconciliation retains identity.
  }
}

export function economicPost(client, url, data, config = {}, options = {}) {
  return runEconomicRequest(url, data, (key) => client.post(url, data, {
    ...config, headers: { ...config.headers, 'Idempotency-Key': key },
  }), options);
}
