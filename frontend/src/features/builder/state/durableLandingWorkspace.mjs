import { requireFunctionalPass } from '../preview/functionalLandingValidation.mjs';
import { decisionRequired, createHumanDecision, validateHumanDecision } from './humanSemanticDecision.mjs';
import { prepareRepair } from './boundedLandingRepair.mjs';
import { createChangeReview, validateChangeReview } from './builderChangeReview.mjs';
import { newWorkspace, prepareChange, applyReviewedChange, revertChange, contentHash } from './builderChangeTransaction.mjs';
import { renderLandingArtifact, validateLandingArtifact } from '../preview/landingArtifact.mjs';

const fail = (code) => { throw new Error(code); };
const copy = (value) => JSON.parse(JSON.stringify(value));
export const DURABLE_STORAGE_POLICY = Object.freeze({
  capacityBytes: 384 * 1024, softBytes: 288 * 1024, safetyMarginBytes: 96 * 1024,
  retentionMs: 90 * 24 * 60 * 60 * 1000, maxHistoryDepth: 64, minRevertDepth: 24,
});

// A compacted audit prefix must not take away the last available undo snapshots.
// Only snapshots no longer present in history live in this small sidecar.
function revertibleEvents(workspace) {
  const stack = [...(workspace.revertSnapshots || [])];
  for (const event of workspace.history) {
    if (event.kind === 'apply') stack.push(event);
    else if (event.kind === 'revert') {
      const index = stack.findIndex(e => e.operationId === event.revertedOperationId);
      if (index !== -1) {
        if (index !== stack.length - 1) fail('CORRUPT_REVERT_HISTORY');
        stack.pop();
      }
    } else fail('CORRUPT_WORKSPACE');
  }
  return stack;
}

function normalizeHistory(workspace) {
  const base = workspace.historyBaseRevision ?? 0;
  if (!Number.isSafeInteger(base) || base < 0 ||
      workspace.revision !== base + workspace.history.length) fail('CORRUPT_WORKSPACE');
  const snapshots = workspace.revertSnapshots ?? [];
  const provenance = workspace.compactedProvenance ?? [];
  if (!Array.isArray(snapshots) || !Array.isArray(provenance) ||
      snapshots.length > DURABLE_STORAGE_POLICY.minRevertDepth) fail('CORRUPT_WORKSPACE');
  // Truncated history cannot reconstruct forgotten IDs: require its complete ledger.
  if (base > 0 && (!Array.isArray(workspace.consumedOperationIds) || provenance.length !== base)) fail('CORRUPT_WORKSPACE');
  // Legacy v1 has no consumed set. Reconstruct it before any history can be dropped.
  const known = [...provenance, ...snapshots, ...workspace.history];
  const ids = workspace.consumedOperationIds ?? known.flatMap(e =>
    e.kind === 'revert' ? [e.operationId, e.revertedOperationId] : [e.operationId]);
  if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !id) ||
      new Set(ids).size !== ids.length && workspace.consumedOperationIds !== undefined) fail('CORRUPT_WORKSPACE');
  const consumed = new Set(ids);
  for (const event of known) {
    if (!event || !['apply', 'revert'].includes(event.kind) || typeof event.operationId !== 'string' || !event.operationId ||
        !consumed.has(event.operationId) || (event.kind === 'revert' && !consumed.has(event.revertedOperationId))) fail('CORRUPT_WORKSPACE');
    if (event.createdAt !== undefined && (typeof event.createdAt !== 'string' || !Number.isFinite(Date.parse(event.createdAt)))) fail('CORRUPT_WORKSPACE');
  }
  const historyIds = new Set(workspace.history.map(e => e.operationId));
  if (historyIds.size !== workspace.history.length || new Set(snapshots.map(e => e.operationId)).size !== snapshots.length ||
      snapshots.some(e => e.kind !== 'apply' || historyIds.has(e.operationId))) fail('CORRUPT_WORKSPACE');
  workspace.historyBaseRevision = base;
  workspace.consumedOperationIds = [...consumed];
  workspace.revertSnapshots = snapshots;
  workspace.compactedProvenance = provenance;
  revertibleEvents(workspace);
  return workspace;
}
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
      if (result.expectedRaw !== undefined && storage.getItem(key) !== result.expectedRaw) fail('STORAGE_CONFLICT');
      if (result.write !== undefined) storage.setItem(key, result.write);
      return result.value;
    }),
  };
}

export function createDurableLandingWorkspace(store, ownerId, projectId, assertCurrent = () => {}, binding = {}) {
  const revision = binding.serverRevision;
  const validRevision = revision === '0' || (typeof revision === 'string' && /^\d{4}-\d\d-\d\dT/.test(revision) && Number.isFinite(Date.parse(revision)));
  const rawStore = store;
  async function verifyBinding() {
    assertCurrent();
    if (!validRevision || typeof binding.verify !== 'function' || await binding.verify() !== revision) fail('SERVER_REVISION_UNVERIFIED');
    assertCurrent();
  }
  store = { transaction: (key, operation) => rawStore.transaction(key, async raw => {
    await verifyBinding();
    const result = await operation(raw);
    await verifyBinding();
    return result;
  }) };
  const key = durableWorkspaceKey(ownerId, projectId);
  const sessionId = crypto.randomUUID();
  const authorizations = new Map();
  const repairAttempts = new Set();
  const destinationAttempts = new Map();
  async function decode(raw, allowLegacy = false) {
    if (raw === null) return null;
    let record;
    try { record = JSON.parse(raw); } catch { fail('CORRUPT_WORKSPACE'); }
    if (record?.version !== 1 || record.ownerId !== ownerId || record.projectId !== projectId) fail('OWNERSHIP_OR_VERSION_MISMATCH');
    const { digest, ...body } = record;
    if (digest !== await contentHash(body)) fail('CORRUPT_WORKSPACE');
    if (record.serverRevision !== revision && !(allowLegacy && !Object.hasOwn(record, 'serverRevision'))) fail('SERVER_REVISION_MISMATCH');
    const ws = record.workspace;
    if (!ws || ws.schemaVersion !== 1 || !Number.isSafeInteger(ws.revision) || ws.revision < 0 || !Array.isArray(ws.history) || ws.committed?.projectId !== projectId) fail('CORRUPT_WORKSPACE');
    normalizeHistory(ws);
    for (const event of revertibleEvents(ws)) {
      if (event.before?.projectId !== projectId || await contentHash(event.before) !== event.beforeHash) fail('CORRUPT_REVERT_HISTORY');
      if (event.beforeArtifact) validateLandingArtifact(event.before, event.beforeArtifact);
    }
    validateLandingArtifact(ws.committed, record.artifact);
    return { ...record, digest: await contentHash(body) };
  }
  // Only initialization may claim an unbound v1 record. Never use encode here:
  // normalization/compaction would silently alter the legacy payload.
  async function bindLegacy(raw, initial) {
    const original = JSON.parse(raw);
    const onlyKeys = (value, allowed) => {
      if (!value || typeof value !== 'object' || Array.isArray(value) ||
          Object.keys(value).some(k => !allowed.includes(k))) fail('LEGACY_SCHEMA_UNKNOWN');
    };
    onlyKeys(original, ['version','ownerId','projectId','workspace','artifact','decisions','decisionEpoch','pendingDraft','draftVersion','digest']);
    onlyKeys(original.workspace, ['schemaVersion','revision','committed','history','lastOperationId','historyBaseRevision','consumedOperationIds','revertSnapshots','compactedProvenance']);
    onlyKeys(original.artifact, ['rendererVersion','mediaType','html']);
    if (original.pendingDraft !== null) fail('SERVER_REVISION_MISMATCH');
    if (binding.ownerId !== ownerId || binding.projectId !== projectId) fail('LEGACY_IDENTITY_UNVERIFIED');
    if (!Array.isArray(original.decisions) || !Number.isSafeInteger(original.decisionEpoch) || original.decisionEpoch < 0 ||
        !Number.isSafeInteger(original.draftVersion) || original.draftVersion < 0) fail('LEGACY_SCHEMA_UNKNOWN');
    const checkDecision = async decision => {
      onlyKeys(decision, ['version','ownerId','projectId','reviewId','proposalId','candidateHash','artifactHash','baseRevision','semanticAssessmentId','semanticAssessment','type','rationale','sessionId','sequence','createdAt','validity','decisionId']);
      onlyKeys(decision.semanticAssessment, ['version','method','advisoryOnly','status','reason','promise','destinationId','destinationContent','recognizedIntents','limitation']);
      const { decisionId, ...body } = decision;
      if (decision.ownerId !== ownerId || decision.projectId !== projectId || decisionId !== await contentHash(body) ||
          decision.semanticAssessmentId !== await contentHash(decision.semanticAssessment)) fail('LEGACY_PROVENANCE_UNVERIFIED');
    };
    const events = [...original.workspace.history, ...(original.workspace.revertSnapshots || []), ...(original.workspace.compactedProvenance || [])];
    for (const event of events) {
      onlyKeys(event, ['operationId','before','beforeHash','afterHash','artifactHash','rendererVersion','kind','revertedOperationId','createdAt','beforeArtifact','authorization','humanDecision','repair','reviewId','proposalHash']);
      if (event.beforeArtifact) onlyKeys(event.beforeArtifact, ['rendererVersion','mediaType','html']);
      if (event.authorization) {
        onlyKeys(event.authorization, ['kind','ownerId','projectId','sessionId','baseRevision','proposalId','candidateHash','artifactHash','reviewId','semanticAssessmentId','decisionId','decisionEpoch','draftVersion','envelopeHash','authorizationId','validity','createdAt','beforeHash']);
        if (event.authorization.ownerId !== ownerId || event.authorization.projectId !== projectId || event.authorization.validity !== 'CONSUMED') fail('LEGACY_PROVENANCE_UNVERIFIED');
      }
      if (event.humanDecision) await checkDecision(event.humanDecision);
      if (event.repair) {
        // Reconstruct rather than accept opaque nested repair fields. A compacted
        // event without its before state cannot prove this binding, so stays intact.
        if (!event.before) fail('LEGACY_PROVENANCE_UNVERIFIED');
        const parent = event.repair.parent;
        const repaired = await prepareRepair({ ...newWorkspace(event.before), revision: parent?.baseRevision }, parent, event.repair.selection?.sectionId, event.operationId);
        if (await contentHash(repaired.repair) !== await contentHash(event.repair)) fail('LEGACY_PROVENANCE_UNVERIFIED');
      }
    }
    for (const decision of original.decisions) await checkDecision(decision);
    await decode(raw, true);
    if (await contentHash(original.workspace.committed) !== await contentHash(initial)) fail('LEGACY_CONTENT_MISMATCH');
    const { digest, ...body } = original;
    const replacement = { ...body, serverRevision: revision };
    const next = { ...replacement, digest: await contentHash(replacement) };
    const write = JSON.stringify(next);
    if (2 * (key.length + write.length) > DURABLE_STORAGE_POLICY.capacityBytes) fail('DURABLE_CAPACITY_EXCEEDED');
    const verified = await decode(write);
    return { write, expectedRaw: raw, value: copy(verified), assertCurrent };
  }
  async function encode(workspace, decisions = [], decisionEpoch = 0, pendingDraft = null, draftVersion = 0, preservedArtifact = null) {
    workspace = normalizeHistory(copy(workspace));
    const last = workspace.history.at(-1);
    const restored = last?.kind === 'revert' ? last.restoredArtifact || workspace.history.find(e => e.operationId === last.revertedOperationId)?.beforeArtifact : null;
    const artifact = preservedArtifact || restored || renderLandingArtifact(workspace.committed);
    if (last) delete last.restoredArtifact;
    validateLandingArtifact(workspace.committed, artifact);
    const body = { version: 1, ownerId, projectId, serverRevision: revision, workspace, artifact, decisions: copy(decisions), decisionEpoch, pendingDraft: copy(pendingDraft), draftVersion };
    const protectedSnapshots = revertibleEvents(workspace).slice(-DURABLE_STORAGE_POLICY.minRevertDepth);
    const cutoff = Date.now() - DURABLE_STORAGE_POLICY.retentionMs;
    const serialize = async () => JSON.stringify({ ...body, digest: await contentHash(body) });
    let raw = await serialize();
    while (workspace.history.length) {
      const oldest = workspace.history[0];
      const expired = oldest.createdAt !== undefined && Date.parse(oldest.createdAt) < cutoff;
      if (workspace.history.length <= DURABLE_STORAGE_POLICY.maxHistoryDepth && !expired &&
          2 * (key.length + raw.length) <= DURABLE_STORAGE_POLICY.softBytes) break;
      workspace.history.shift();
      workspace.historyBaseRevision += 1;
      const { before, beforeArtifact, ...provenance } = oldest;
      workspace.compactedProvenance.push(provenance);
      const retained = new Set(workspace.history.map(e => e.operationId));
      workspace.revertSnapshots = protectedSnapshots.filter(e => !retained.has(e.operationId));
      raw = await serialize();
    }
    // Never sacrifice protected data to fit. Storage and caller state stay unchanged.
    if (2 * (key.length + raw.length) > DURABLE_STORAGE_POLICY.capacityBytes) fail('DURABLE_CAPACITY_EXCEEDED');
    const verified = await decode(raw);
    // decode normalizes legacy metadata; for replacements it must be byte-stable.
    if (JSON.stringify(verified) !== raw) fail('INVALID_REPLACEMENT');
    return verified;
  }
  const read = () => store.transaction(key, async (raw) => ({ value: copy(await decode(raw)), assertCurrent }));
  function checkOperation(record, proposal) {
    if (proposal?.ownerId !== ownerId || proposal.projectId !== projectId) fail('OWNER_OR_PROJECT_MISMATCH');
    if (record.workspace.consumedOperationIds.includes(proposal.operationId)) fail('DUPLICATE_APPLY');
  }
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
    checkOperation(record, snapshot.proposal);
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
        if (raw !== null) {
          // Verify integrity/ownership before even considering compatibility.
          const checked = await decode(raw, true);
          if (!Object.hasOwn(checked, 'serverRevision')) return bindLegacy(raw, initial);
        }
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
      if (operationId !== undefined && record.workspace.consumedOperationIds.includes(operationId)) fail('DUPLICATE_APPLY');
      const proposal = await prepareChange(record.workspace, ops, operationId, ownerId);
      return { ownerId, sessionId, decisionEpoch: record.decisionEpoch || 0, draftVersion: record.draftVersion || 0, proposal, review: await createChangeReview(record.workspace, ownerId, proposal) };
    },
    repair: async (envelope, sectionId) => {
      authorizations.clear();
      const snapshot = copy(envelope);
      if (snapshot.ownerId !== ownerId || snapshot.proposal.ownerId !== ownerId) fail('OWNER_MISMATCH');
      const record = await read();
      if (!record) fail('WORKSPACE_NOT_FOUND');
      checkOperation(record, snapshot.proposal);
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
        checkOperation(record, snapshot.proposal);
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
      checkOperation(record, draft.proposal);
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
        checkOperation(record, snapshot.proposal);
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
        next.consumedOperationIds = [...ws.consumedOperationIds, snapshot.proposal.operationId];
        next.history[next.history.length - 1].createdAt = new Date().toISOString();
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
        const target = revertibleEvents(ws).at(-1);
        if (!target) fail('NOTHING_TO_REVERT');
        // Reuse the exact identity checks of the existing kernel for successive undo.
        const reverted = await revertChange({ ...ws, history: [target] }, expectedRevision);
        const event = reverted.history.at(-1);
        if (ws.consumedOperationIds.includes(event.operationId)) fail('DUPLICATE_REVERT');
        event.createdAt = new Date().toISOString();
        event.authorization={authorizationId:crypto.randomUUID(),kind:'REVERT',ownerId,projectId,sessionId,baseRevision:expectedRevision,beforeHash:await contentHash(ws.committed),validity:'CONSUMED'};
        const next = { ...ws, revision: reverted.revision, committed: reverted.committed,
          lastOperationId: event.operationId, history: [...ws.history, event],
          consumedOperationIds: [...ws.consumedOperationIds, event.operationId] };
        // encode resolves the before artifact even if its apply event was compacted.
        event.restoredArtifact = target.beforeArtifact || renderLandingArtifact(target.before);
        return next;
      });
    },
  };
}
