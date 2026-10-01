import { decisionRequired } from '../../state/humanSemanticDecision.mjs';
import { useEffect, useRef, useState } from 'react';
import { createDurableLandingWorkspace, createLocalWorkspaceStore } from '../../state/durableLandingWorkspace.mjs';
import { contentHash } from '../../state/builderChangeTransaction.mjs';

export default function useDurableLandingTransaction(activeState, onCommit, ownerId) {
  const [view, setView] = useState({ pending: null, review: null, decision: null, revision: 0, canRevert: false, status: 'loading', error: '', busy: false });
  const context = useRef(null);
  const latest = useRef({ activeState, onCommit, ownerId });
  latest.current = { activeState, onCommit, ownerId };
  const projectId = activeState?.projectId;
  useEffect(() => {
    const token = { ownerId, projectId, alive: true, locked: false, record: null, intent: 0 };
    context.current = token;
    const assertCurrent = () => {
      if (token.locked && token.operationIntent !== token.intent) throw new Error('PROPOSAL_CANCELLED');
      if (!token.alive || context.current !== token || latest.current.ownerId !== ownerId || latest.current.activeState?.projectId !== projectId) throw new Error('SESSION_CHANGED');
    };
    setView({ pending: null, review: null, decision: null, revision: 0, canRevert: false, status: 'loading', error: '', busy: false });
    if (!ownerId || !projectId) {
      setView((v) => ({ ...v, status: 'blocked', error: ownerId ? '' : 'Se requiere una sesión autenticada.' }));
      return () => { token.alive = false; };
    }
    const publish = (record) => {
      assertCurrent(); token.record = record;
      latest.current.onCommit(record.workspace.committed);
      setView({ pending: null, review: null, decision: null, revision: record.workspace.revision, canRevert: record.workspace.history.at(-1)?.kind === 'apply', hasSavedDraft: Boolean(record.pendingDraft), draftVersion: record.draftVersion || 0, audit: (record.decisions || []).map(d => ({...d, effectiveStatus: record.workspace.history.some(e => e.humanDecision?.decisionId === d.decisionId) ? 'APPLIED_HISTORICAL' : d.type === 'REJECT_CHANGE' ? 'REJECTED' : 'STALE_DECISION'})), status: 'ready', error: '', busy: false });
    };
    token.publish = publish; token.assertCurrent = assertCurrent;
    try {
      token.repository = createDurableLandingWorkspace(createLocalWorkspaceStore(window.localStorage, navigator.locks), ownerId, projectId, assertCurrent);
      token.ready = token.repository.initialize(activeState).then(publish).catch((error) => {
        if (token.alive) setView((v) => ({ ...v, status: 'blocked', error: error.message }));
      });
    } catch (error) { setView((v) => ({ ...v, status: 'blocked', error: error.message })); }
    const invalidate = (event) => {
      if (event.key === null || event.key === token.repository?.key) {
        token.conflict = true;
        setView((v) => ({ ...v, pending: null, review: null, decision: null, canRevert: false, status: 'conflict', error: 'El workspace cambió en otra pestaña. Recarga para recuperar la revisión vigente.' }));
      }
    };
    window.addEventListener('storage', invalidate);
    return () => { token.alive = false; window.removeEventListener('storage', invalidate); };
  // The initial state is intentionally captured once per owner/project; later revisions are committed through this session.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, projectId]);

  const operate = async (kind, operations, expectedReviewId, expectedDecisionId) => {
    const token = context.current;
    if (!token || token.locked) return;
    const intent = token.intent;
    const applyingEnvelope = token.envelope;
    if (['apply', 'repair', 'decide', 'savePending'].includes(kind) && (!expectedReviewId || applyingEnvelope?.review?.reviewId !== expectedReviewId)) {
      setView((v) => ({ ...v, error: 'REVIEW_STALE_OR_MISSING' })); return;
    }
    if (kind === 'recoverPending' && applyingEnvelope) { setView(v => ({...v,error:'CLOSE_CURRENT_REVIEW_FIRST'})); return; }
    if (kind === 'apply' && applyingEnvelope?.decision?.decisionId !== expectedDecisionId) { setView(v => ({...v,error:'STALE_DECISION'})); return; }
    token.operationIntent = intent;
    token.locked = true;
    if (kind === 'propose') { token.envelope = null; setView((v) => ({ ...v, pending: null, review: null, decision: null })); }
    setView((v) => ({ ...v, busy: true, error: '' }));
    try {
      await token.ready;
      token.assertCurrent?.();
      if (!token.record || token.conflict) throw new Error('WORKSPACE_NOT_READY');
      if (await contentHash(latest.current.activeState) !== await contentHash(token.record.workspace.committed)) throw new Error('ACTIVE_STATE_CONFLICT');
      token.assertCurrent();
      if (kind === 'savePending' || kind === 'recoverPending') {
        const envelope = kind === 'savePending' ? await token.repository.savePending(applyingEnvelope) : await token.repository.recoverPending();
        token.assertCurrent();
        token.envelope = envelope;
        setView(v => ({...v,pending:envelope.proposal,review:envelope.review,decision:kind === 'savePending' ? envelope.decision || null : null,hasSavedDraft:true,draftVersion:envelope.draftVersion}));
      } else if(kind === 'discardPending') {
        const record=await token.repository.discardPending(operations);
        token.envelope=null; token.publish(record);
      } else if (kind === 'decide') {
        const envelope = await token.repository.decide(applyingEnvelope, operations.type, operations.rationale);
        token.assertCurrent();
        if (token.intent !== intent) throw new Error('PROPOSAL_CANCELLED');
        token.envelope = envelope;
        setView(v => ({...v, decision: envelope.decision, ...(operations.type !== 'ACCEPT_WARNING' ? {hasSavedDraft:false} : {})}));
      } else if (kind === 'propose' || kind === 'repair') {
        if (kind === 'repair') { token.envelope = null; setView(v => ({ ...v, pending: null, review: null, decision: null })); }
        const envelope = kind === 'repair' ? await token.repository.repair(applyingEnvelope, operations) : await token.repository.propose(operations);
        token.assertCurrent();
        if (token.intent !== intent) throw new Error('PROPOSAL_CANCELLED');
        if (envelope.proposal.baseRevision !== token.record.workspace.revision || token.conflict) throw new Error('STALE_WRITE');
        token.envelope = envelope;
        setView((v) => ({ ...v, pending: envelope.proposal, review: envelope.review, decision: null }));
      } else {
        const record = kind === 'apply'
          ? await token.repository.apply(applyingEnvelope, await token.repository.authorize(applyingEnvelope))
          : await token.repository.revert(token.record.workspace.revision);
        token.envelope = null;
        token.publish(record);
      }
    } catch (error) {
      if (token.alive && latest.current.ownerId === token.ownerId) {
        const invalid = /REVIEW_|STALE_|MISMATCH|ACTIVE_STATE_CONFLICT/.test(error.message);
        if (invalid) token.envelope = null;
        setView((v) => ({ ...v, ...(invalid ? { pending: null, review: null, decision: null } : {}), error: error.message }));
      }
    } finally {
      token.locked = false;
      if (token.alive) setView((v) => ({ ...v, busy: false }));
    }
  };
  return { ...view,
    savePending: () => operate('savePending',undefined,view.review?.reviewId),
    recoverPending: () => operate('recoverPending'),
    discardPending: () => operate('discardPending',view.draftVersion),
    requiresDecision: decisionRequired(view.review || {}),
    decide: (type, rationale) => operate('decide', {type, rationale}, view.review?.reviewId),
    propose: (ops) => operate('propose', ops), apply: () => operate('apply', undefined, view.review?.reviewId, view.decision?.decisionId), repair: (sectionId) => operate('repair', sectionId, view.review?.reviewId), revert: () => operate('revert'),
    discard: () => { if (context.current) { context.current.repository?.revokeAuthorizations(); context.current.envelope = null; context.current.intent += 1; } setView((v) => ({ ...v, pending: null, review: null, decision: null })); },
    reject: (error) => { if (context.current) { context.current.repository?.revokeAuthorizations(); context.current.envelope = null; context.current.intent += 1; } setView((v) => ({ ...v, pending: null, review: null, decision: null, error })); },
  };
}
