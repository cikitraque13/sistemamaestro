import { useEffect, useRef, useState } from 'react';
import { applyChange, revertChange, prepareChange, newWorkspace, loadWorkspace, saveWorkspace, transactionStorageKey, contentHash } from '../../state/builderChangeTransaction.mjs';

export default function useLandingTransaction(activeState, onCommit) {
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [canRevert, setCanRevert] = useState(false);
  const current = useRef(activeState);
  const generation = useRef(0);
  const lock = useRef(false);
  current.current = activeState;
  useEffect(() => {
    generation.current += 1;
    setPending(null);
    try {
      const ws = activeState && loadWorkspace(window.localStorage, activeState.projectId);
      setRevision(ws?.revision || 0);
      setCanRevert(ws?.history.at(-1)?.kind === 'apply');
    } catch { setError('No se pudo recuperar la transacción local.'); setCanRevert(false); }
  }, [activeState]);
  useEffect(() => {
    const invalidate = (event) => {
      if (event.key === null || event.key === transactionStorageKey(current.current?.projectId)) {
        generation.current += 1; setPending(null); setCanRevert(false);
        setError('El estado cambió en otra pestaña. Recarga antes de continuar.');
      }
    };
    window.addEventListener('storage', invalidate);
    return () => window.removeEventListener('storage', invalidate);
  }, []);
  const operate = async (fn) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const base = current.current;
    const epoch = generation.current;
    try {
      if (!base) throw new Error('No hay una landing activa.');
      const storage = window.localStorage;
      const raw = storage.getItem(transactionStorageKey(base.projectId));
      const workspace = loadWorkspace(storage, base.projectId) || newWorkspace(base);
      if (await contentHash(workspace.committed) !== await contentHash(base)) throw new Error('STORAGE_CONFLICT');
      const result = await fn(workspace);
      if (current.current !== base || generation.current !== epoch) throw new Error('STALE_PROPOSAL');
      if (result.proposal) { setPending(result.proposal); return; }
      saveWorkspace(storage, result, raw);
      setPending(null); setRevision(result.revision); setCanRevert(result.history.at(-1)?.kind === 'apply');
      onCommit(result.committed);
    } catch (problem) { setError(problem.message); }
    finally { lock.current = false; setBusy(false); }
  };
  return {
    pending, error, busy, revision, canRevert,
    propose: (operations) => operate(async (ws) => ({ proposal: await prepareChange(ws, operations) })),
    apply: () => operate((ws) => applyChange(ws, pending)),
    revert: () => operate((ws) => revertChange(ws, revision)),
    discard: () => { generation.current += 1; setPending(null); },
    reject: (message) => { generation.current += 1; setPending(null); setError(message); },
  };
}
