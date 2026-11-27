// Server is the landing record. localStorage is only the cache used when the
// server cannot be read. Writes wait briefly so a burst of edits is one save.

export const LANDING_SAVE_DELAY_MS = 400;

export function createLandingSync({ storage, load, save, delayMs = LANDING_SAVE_DELAY_MS }) {
  let timer = null;
  let pending = null;

  async function writeRemote() {
    const job = pending;
    pending = null;
    timer = null;
    if (!job) return;
    try {
      await save(job.projectId, job.record);
    } catch {
      // The local cache already holds the edit.
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

    noteWrite(projectId, record) {
      if (typeof record !== 'string' || !record.length) return;
      pending = { projectId, record };
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

export function createCachedLandingStore(localStore, sync, projectId) {
  return {
    transaction: async (key, operation) => {
      let written;
      const value = await localStore.transaction(key, async (raw) => {
        const result = await operation(raw);
        if (typeof result?.write === 'string') written = result.write;
        return result;
      });
      if (written !== undefined) sync.noteWrite(projectId, written);
      return value;
    },
  };
}
