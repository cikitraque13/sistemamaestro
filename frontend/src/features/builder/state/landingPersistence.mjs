// Server is the landing record. localStorage is only the cache used when the
// server cannot be read. Writes wait briefly so a burst of edits is one save.

export const LANDING_SAVE_DELAY_MS = 400;

export function landingSaveMessage(error) {
  const message = error?.response?.data?.detail?.message;
  if (typeof message === 'string' && message.trim() && !/^[A-Z0-9_]+$/.test(message.trim())) {
    return message.trim();
  }
  if (error?.response?.status === 409) return 'La landing cambió en otra pestaña. Recarga antes de guardar.';
  return 'No se ha podido guardar la landing. El cambio sigue en este navegador.';
}

export function createLandingSync({ storage, load, save, delayMs = LANDING_SAVE_DELAY_MS, onError = null }) {
  let timer = null;
  let pending = null;

  async function writeRemote() {
    const job = pending;
    pending = null;
    timer = null;
    if (!job) return;
    try {
      await save(job.projectId, job.record, job.expected);
    } catch (error) {
      onError?.(landingSaveMessage(error));
    }
  }

  return {
    async hydrate(projectId, key) {
      let remote = null;
      let failed = false;
      try {
        remote = await load(projectId);
      } catch {
        failed = true;
      }
      if (typeof remote === 'string' && remote.length) {
        storage.setItem(key, remote);
        return 'remote';
      }
      if (failed) return 'local';
      const cached = storage.getItem(key);
      if (typeof cached === 'string' && cached.length) this.noteWrite(projectId, cached);
      return cached ? 'local' : 'empty';
    },

    noteWrite(projectId, record, expected = '0') {
      if (typeof record !== 'string' || !record.length) return;
      pending = { projectId, record, expected };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { writeRemote(); }, delayMs);
    },

    async flush() {
      if (timer) clearTimeout(timer);
      timer = null;
      await writeRemote();
    },
  };
}

export function createCachedLandingStore(localStore, sync, projectId, expected = () => '0') {
  return {
    transaction: async (key, operation) => {
      let written;
      const value = await localStore.transaction(key, async (raw) => {
        const result = await operation(raw);
        if (typeof result?.write === 'string') written = result.write;
        return result;
      });
      if (written !== undefined) sync.noteWrite(projectId, written, expected());
      return value;
    },
  };
}
