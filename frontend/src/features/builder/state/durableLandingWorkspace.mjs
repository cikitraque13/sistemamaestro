import { requireFunctionalPass } from '../preview/functionalLandingValidation.mjs';
import { decisionRequired, createHumanDecision, validateHumanDecision } from './humanSemanticDecision.mjs';
import { prepareRepair } from './boundedLandingRepair.mjs';
import { createChangeReview, validateChangeReview } from './builderChangeReview.mjs';
import { newWorkspace, prepareChange, applyReviewedChange, revertChange, contentHash } from './builderChangeTransaction.mjs';
import { renderLandingArtifact, validateLandingArtifact } from '../preview/landingArtifact.mjs';

const fail = (code) => { throw new Error(code); };
const copy = (value) => JSON.parse(JSON.stringify(value));
export function durableWorkspaceKey(ownerId, projectId) {
  if (typeof ownerId !== 'string' || !ownerId.trim() || typeof projectId !== 'string' || !projectId.trim()) fail('OWNER_AND_PROJECT_REQUIRED');
  return `sistemamaestro:durable:v1:${JSON.stringify([ownerId, projectId])}`;
}

// All participating clients must use the same origin and Web Locks namespace.
// Ownership is local isolation, not a substitute for server authorization.
export function createLocalWorkspaceStore(storage, locks) {
  if (!locks?.request) fail('ATOMIC_STORAGE_UNAVAILABLE');
  return {
    transaction: (key, operation) => locks.request(key, { mode: 'exclusive' }, async () => {
      const result = await operation(storage.getItem(key));
      result.assertCurrent?.();
      if (result.write !== undefined) storage.setItem(key, result.write);
      return result.value;
    }),
  };
}

export function createDurableLandingWorkspace(store, ownerId, projectId, assertCurrent = () => {}) {
  const key = durableWorkspaceKey(ownerId, projectId);
  const sessionId = crypto.randomUUID();
  const authorizations = new Map();
  const repairAttempts = new Set();
  const destinationAttempts = new Map();
  async function decode(raw) {
    if (raw === null) return null;
    let record;
    try { record = JSON.parse(raw); } catch { fail('CORRUPT_WORKSPACE'); }
    if (record?.version !== 1 || record.ownerId !== ownerId || record.projectId !== projectId) fail('OWNERSHIP_OR_VERSION_MISMATCH');
    const { digest, ...body } = record;
    if (digest !== await contentHash(body)) fail('CORRUPT_WORKSPACE');
    const ws = record.workspace;
    if (!ws || ws.schemaVersion !== 1 || !Number.isSafeInteger(ws.revision) || ws.revision < 0 || !Array.isArray(ws.history) || ws.revision !== ws.history.length || ws.committed?.projectId !== projectId) fail('CORRUPT_WORKSPACE');
    validateLandingArtifact(ws.committed, record.artifact);
    return record;
  }
  async function encode(workspace, decisions = [], decisionEpoch = 0, pendingDraft = null, draftVersion = 0, preservedArtifact = null) {
    const last = workspace.history.at(-1);
    const restored = last?.kind === 'revert' ? workspace.history.find(e => e.operationId === last.revertedOperationId)?.beforeArtifact : null;
    const artifact = preservedArtifact || restored || renderLandingArtifact(workspace.committed);
    validateLandingArtifact(workspace.committed, artifact);
    const body = { version: 1, ownerId, projectId, workspace, artifact, decisions, decisionEpoch, pendingDraft, draftVersion };
    return { ...body, digest: await contentHash(body) };
  }
  const read = () => store.transaction(key, async (raw) => ({ value: copy(await decode(raw)), assertCurrent }));
  async function mutate(expectedRevision, transform) {
    return store.transaction(key, async (raw) => {
      assertCurrent();
      const record = await decode(raw);
      if (!record) fail('WORKSPACE_NOT_FOUND');
      if (!Number.isSafeInteger(expectedRevision) || record.workspace.revision !== expectedRevision) fail('STALE_WRITE');
      if (expectedRevision === Number.MAX_SAFE_INTEGER) fail('REVISION_EXHAUSTED');
      const next = await encode(await transform(copy(record.workspace), copy(record.artifact), record), record.decisions || [], record.decisionEpoch || 0, null, (record.draftVersion || 0)+1);
      return { write: JSON.stringify(next), value: copy(next), assertCurrent };
    });
  }
  async function verifyApplyAuthority(record, snapshot) {
    const ws=record.workspace;
    if(ws.revision!==snapshot.proposal.baseRevision) fail('STALE_WRITE');
    if(snapshot.ownerId!==ownerId || snapshot.proposal.ownerId!==ownerId) fail('OWNER_MISMATCH');
    await validateChangeReview(ws, ownerId, snapshot.proposal, snapshot.review);
    if (snapshot.sessionId !== sessionId || snapshot.decisionEpoch !== (record.decisionEpoch || 0)) fail('STALE_DECISION');
    if (snapshot.draftVersion !== (record.draftVersion || 0)) fail('STALE_DRAFT');
    if ((record.decisions || []).some(d => d.reviewId === snapshot.review.reviewId && d.type !== 'ACCEPT_WARNING')) fail('DECISION_TERMINAL');
    if (decisionRequired(snapshot.review) || snapshot.decision) {
      await validateHumanDecision(snapshot.review,snapshot.decision);
      if(snapshot.decision.sessionId!==sessionId || snapshot.decision.sequence!==record.decisionEpoch || await contentHash(snapshot.decision)!==await contentHash(record.decisions.at(-1))) fail('STALE_DECISION');
    }
    await requireFunctionalPass(snapshot.proposal);
  }
  async function authorizationIdentity(snapshot) {
    return {kind:'APPLY',ownerId,projectId,sessionId,baseRevision:snapshot.proposal.baseRevision,
      proposalId:snapshot.proposal.operationId,candidateHash:snapshot.proposal.candidateHash,
      artifactHash:snapshot.proposal.artifactHash,reviewId:snapshot.review.reviewId,
      semanticAssessmentId:await contentHash(snapshot.review.semanticCoherence),decisionId:snapshot.decision?.decisionId || null,
      decisionEpoch:snapshot.decisionEpoch,draftVersion:snapshot.draftVersion,envelopeHash:await contentHash(snapshot)};
  }
  return {
    key, read,
    revokeAuthorizations: () => authorizations.clear(),
    authorize: (envelope) => {
      const snapshot=copy(envelope);
      if(snapshot.ownerId!==ownerId || snapshot.proposal.ownerId!==ownerId) fail('OWNER_MISMATCH');
      return store.transaction(key,async raw=>{
        assertCurrent();const record=await decode(raw);
        if(!record) fail('WORKSPACE_NOT_FOUND');
        await verifyApplyAuthority(record,snapshot);
        const identity=await authorizationIdentity(snapshot);
        const authorization={...identity,authorizationId:crypto.randomUUID(),validity:'AUTHORIZED',createdAt:new Date().toISOString()};
        assertCurrent();authorizations.clear();
        authorizations.set(authorization.authorizationId,{tokenHash:await contentHash(authorization),identityHash:await contentHash(identity)});
        return {value:authorization,assertCurrent};
      });
    },
    initialize: (state) => {
      assertCurrent();
      const initial = copy(state);
      if (initial.projectId !== projectId) fail('PROJECT_MISMATCH');
      return store.transaction(key, async (raw) => {
        const existing = await decode(raw);
        if (existing) return { value: copy(existing), assertCurrent };
        const record = await encode(newWorkspace(initial));
        return { write: JSON.stringify(record), value: copy(record), assertCurrent };
      });
    },
    propose: async (operations, operationId) => {
      authorizations.clear();
      const ops = copy(operations);
      const record = await read();
      if (!record) fail('WORKSPACE_NOT_FOUND');
      const proposal = await prepareChange(record.workspace, ops, operationId, ownerId);
      return { ownerId, sessionId, decisionEpoch: record.decisionEpoch || 0, draftVersion: record.draftVersion || 0, proposal, review: await createChangeReview(record.workspace, ownerId, proposal) };
    },
    repair: async (envelope, sectionId) => {
      authorizations.clear();
      const snapshot = copy(envelope);
      if (snapshot.ownerId !== ownerId || snapshot.proposal.ownerId !== ownerId) fail('OWNER_MISMATCH');
      const record = await read();
      if (!record) fail('WORKSPACE_NOT_FOUND');
      await validateChangeReview(record.workspace, ownerId, snapshot.proposal, snapshot.review);
      if (!sectionId) fail('REQUIRES_DESTINATION_SELECTION');
      const parentFingerprint = await contentHash(snapshot.proposal);
      const fingerprint = await contentHash({parent:snapshot.proposal, sectionId});
      if ((destinationAttempts.get(parentFingerprint) || 0) >= 4) fail('REPAIR_BUDGET_EXHAUSTED');
      if (repairAttempts.has(fingerprint)) fail('REPAIR_BUDGET_EXHAUSTED');
      repairAttempts.add(fingerprint);
      destinationAttempts.set(parentFingerprint, (destinationAttempts.get(parentFingerprint) || 0) + 1);
      const proposal = await prepareRepair(record.workspace, snapshot.proposal, sectionId);
      assertCurrent();
      return { ownerId, sessionId, decisionEpoch: record.decisionEpoch || 0, draftVersion: record.draftVersion || 0, proposal, review: await createChangeReview(record.workspace, ownerId, proposal) };
    },
    savePending: (envelope) => {
      authorizations.clear();
      const snapshot=copy(envelope);
      return store.transaction(key,async raw=>{
        assertCurrent();const record=await decode(raw);
        if(!record || snapshot.sessionId!==sessionId || snapshot.ownerId!==ownerId || snapshot.decisionEpoch!==(record.decisionEpoch||0) || snapshot.draftVersion!==(record.draftVersion||0)) fail('STALE_DRAFT');
        await validateChangeReview(record.workspace,ownerId,snapshot.proposal,snapshot.review);
        if((record.decisions||[]).some(d=>d.reviewId===snapshot.review.reviewId && d.type!=='ACCEPT_WARNING')) fail('DECISION_TERMINAL');
        const draft={version:1,ownerId,projectId,proposal:snapshot.proposal,review:snapshot.review};
        const version=(record.draftVersion||0)+1;
        const next=await encode(record.workspace,record.decisions||[],record.decisionEpoch||0,draft,version,record.artifact);
        return {write:JSON.stringify(next),value:{...snapshot,draftVersion:version},assertCurrent};
      });
    },
    recoverPending: () => store.transaction(key,async raw=>{
      authorizations.clear();assertCurrent();const record=await decode(raw);const draft=record?.pendingDraft;
      if(!draft) fail('NO_PENDING_DRAFT');
      if(draft.version!==1 || draft.ownerId!==ownerId || draft.projectId!==projectId) fail('DRAFT_OWNER_MISMATCH');
      await validateChangeReview(record.workspace,ownerId,draft.proposal,draft.review);
      if((record.decisions||[]).some(d=>d.reviewId===draft.review.reviewId && d.type!=='ACCEPT_WARNING')) fail('DECISION_TERMINAL');
      const old=draft.proposal;
      const proposal=old.repair ? await prepareRepair(record.workspace,old.repair.parent,old.repair.selection.sectionId) : await prepareChange(record.workspace,old.operations,undefined,ownerId);
      if(proposal.candidateHash!==old.candidateHash || proposal.artifactHash!==old.artifactHash) fail('DRAFT_RECONSTRUCTION_MISMATCH');
      const review=await createChangeReview(record.workspace,ownerId,proposal);
      const epoch=(record.decisionEpoch||0)+1,version=(record.draftVersion||0)+1;
      const next=await encode(record.workspace,record.decisions||[],epoch,{version:1,ownerId,projectId,proposal,review},version,record.artifact);
      return {write:JSON.stringify(next),value:{ownerId,sessionId,decisionEpoch:epoch,draftVersion:version,proposal,review},assertCurrent};
    }),
    discardPending: (expectedVersion) => store.transaction(key,async raw=>{
      assertCurrent();const record=await decode(raw);
      if(!record?.pendingDraft) return {value:record,assertCurrent};
      if(expectedVersion!==(record.draftVersion||0)) fail('STALE_DRAFT');
      const next=await encode(record.workspace,record.decisions||[],(record.decisionEpoch||0)+1,null,expectedVersion+1,record.artifact);
      return {write:JSON.stringify(next),value:next,assertCurrent};
    }),
    decide: (envelope, type, rationale) => {
      authorizations.clear();
      const snapshot = copy(envelope);
      return store.transaction(key, async raw => {
        assertCurrent(); const record = await decode(raw);
        if(snapshot.ownerId!==ownerId || snapshot.sessionId!==sessionId || snapshot.decisionEpoch!==(record.decisionEpoch || 0)) fail('STALE_DECISION');
        if(snapshot.draftVersion !== (record.draftVersion || 0)) fail('STALE_DRAFT');
        await validateChangeReview(record.workspace,ownerId,snapshot.proposal,snapshot.review);
        if ((record.decisions || []).some(d => d.reviewId === snapshot.review.reviewId && d.type !== 'ACCEPT_WARNING')) fail('DECISION_TERMINAL');
        const epoch=(record.decisionEpoch || 0)+1;
        const decision=await createHumanDecision(snapshot.review,type,rationale,sessionId,epoch);
        const next=await encode(record.workspace,[...(record.decisions || []),decision],epoch, type === 'ACCEPT_WARNING' ? record.pendingDraft : null, type === 'ACCEPT_WARNING' ? (record.draftVersion || 0) : (record.draftVersion || 0)+1,record.artifact);
        return {write:JSON.stringify(next),value:{...snapshot,decisionEpoch:epoch,draftVersion:next.draftVersion,decision},assertCurrent};
      });
    },
    apply: (envelope, authorization) => {
      const issued=authorizations.get(authorization?.authorizationId);
      if(!issued) fail('AUTHORIZATION_REQUIRED_OR_CONSUMED');
      authorizations.delete(authorization.authorizationId);
      const snapshot = copy(envelope);
      if (snapshot.ownerId !== ownerId || snapshot.proposal.ownerId !== ownerId) fail('OWNER_MISMATCH');
      return mutate(snapshot.proposal.baseRevision, async (ws, beforeArtifact, record) => {
        if(await contentHash(authorization)!==issued.tokenHash) fail('INVALID_AUTHORIZATION');
        await verifyApplyAuthority(record,snapshot);
        if(await contentHash(await authorizationIdentity(snapshot))!==issued.identityHash) fail('STALE_AUTHORIZATION');
        const next = await applyReviewedChange(ws, snapshot.proposal, snapshot.decision);
        next.history[next.history.length - 1].authorization = {...copy(authorization),validity:'CONSUMED'};
        if(snapshot.decision) next.history[next.history.length - 1].humanDecision = copy(snapshot.decision);
        next.history[next.history.length - 1].beforeArtifact = beforeArtifact;
        if (snapshot.proposal.repair) next.history[next.history.length - 1].repair = copy(snapshot.proposal.repair);
        next.history[next.history.length - 1].reviewId = snapshot.review.reviewId;
        next.history[next.history.length - 1].proposalHash = snapshot.review.proposalHash;
        return next;
      });
    },
    revert: (expectedRevision) => {
      authorizations.clear();
      return mutate(expectedRevision, async ws => {
        const next=await revertChange(ws,expectedRevision);
        next.history[next.history.length-1].authorization={authorizationId:crypto.randomUUID(),kind:'REVERT',ownerId,projectId,sessionId,baseRevision:expectedRevision,beforeHash:await contentHash(ws.committed),validity:'CONSUMED'};
        return next;
      });
    },
  };
}
