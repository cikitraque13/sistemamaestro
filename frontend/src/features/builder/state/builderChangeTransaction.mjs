import { createChangeReview } from './builderChangeReview.mjs';
import { decisionRequired, validateHumanDecision } from './humanSemanticDecision.mjs';
import { selectDestination } from './ctaDestinationIntent.mjs';
import { validateRepairCandidate } from './boundedLandingRepair.mjs';
import { functionalValidation, requireFunctionalPass } from '../preview/functionalLandingValidation.mjs';
import { isStaticSectionOperation, validateStaticSectionOperation, mutateStaticSection } from './staticSectionMutation.mjs';
import { renderLandingArtifact, validateLandingArtifact } from '../preview/landingArtifact.mjs';
// Local landing transactions. Metadata lives outside the reversible content.
const clone = (value) => JSON.parse(JSON.stringify(value));
const fail = (code) => { throw new Error(code); };
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonical(value[key])])
  );
  return value;
};
export async function contentHash(value) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canonical(value))));
  return Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, '0')).join('');
}
export const isCompatibleLanding = (state) => Boolean(state?.projectId && state.projectKind === 'landing');
const keys = (value, allowed) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) fail('INVALID_SCHEMA');
};
export function validateOperations(operations) {
  if (!Array.isArray(operations) || !operations.length || operations.length > 4) fail('INVALID_OPERATIONS');
  const structural = operations.some((op) => isStaticSectionOperation(op?.type));
  if (structural && !operations.every((op) => isStaticSectionOperation(op?.type))) fail('MIXED_COMPOSITE_NOT_SUPPORTED');
  if (!structural && operations.length > 2) fail('INVALID_OPERATIONS');
  const seen = new Set();
  for (const op of operations) {
    if (isStaticSectionOperation(op?.type)) {
      validateStaticSectionOperation(op); continue;
    }
    keys(op, ['type', 'value']);
    if (seen.has(op.type)) fail('DUPLICATE_OPERATION');
    seen.add(op.type);
    if (op.type === 'set_primary_cta') {
      if (typeof op.value !== 'string' || !op.value.trim() || op.value.length > 120 || /[\u0000-\u001f]/.test(op.value)) fail('INVALID_CTA');
    } else if (op.type === 'set_primary_destination') {
      if (typeof op.value !== 'string' || !/^[a-zA-Z][\w-]*$/.test(op.value)) fail('INVALID_DESTINATION');
    } else if (op.type === 'set_accent') {
      if (!['orange', 'amber'].includes(op.value)) fail('INVALID_ACCENT');
    } else fail('UNSUPPORTED_OPERATION');
  }
}
export function candidateFor(base, operations) {
  if (!isCompatibleLanding(base)) fail('UNSUPPORTED_PROJECT');
  validateOperations(operations);
  let next = clone(base);
  for (const op of operations) {
    if (isStaticSectionOperation(op.type)) { next = mutateStaticSection(next, op); continue; }
    if (op.type === 'set_primary_destination') { next = selectDestination(next, op.value); continue; }
    if (op.type === 'set_primary_cta') {
      next.primaryCTA = op.value;
      for (const field of ['previewModel', 'codeModel', 'structureModel']) next[field] = { ...next[field], primaryCTA: op.value };
      const ctas = next.ctas || [];
      const primary = ctas.some((cta) => cta.intent === 'primary' || cta.id === 'hero-primary-cta');
      next.ctas = primary ? ctas.map((cta) => cta.intent === 'primary' || cta.id === 'hero-primary-cta' ? { ...cta, label: op.value } : cta)
        : [{ id: 'hero-primary-cta', label: op.value, href: '#', intent: 'primary' }, ...ctas];
    } else {
      next.visualAccent = op.value;
      next.theme = { ...next.theme, visualAccent: op.value, accent: op.value };
      for (const field of ['previewModel', 'codeModel', 'structureModel']) next[field] = { ...next[field], visualAccent: op.value };
    }
  }
  return next;
}
export function newWorkspace(state) {
  return { schemaVersion: 1, revision: 0, committed: clone(state), history: [], lastOperationId: null };
}
export async function prepareChange(workspace, operations, operationId = globalThis.crypto.randomUUID(), ownerId = null) {
  validateOperations(operations);
  const candidate = candidateFor(workspace.committed, operations);
  const artifact = renderLandingArtifact(candidate);
  validateLandingArtifact(candidate, artifact);
  const proposal = {
    ownerId, artifact, artifactHash: await contentHash(artifact),
    schemaVersion: 1, operationId, projectId: workspace.committed.projectId,
    baseRevision: workspace.revision, baseHash: await contentHash(workspace.committed),
    operations: clone(operations), operationCount: operations.length, candidate, candidateHash: await contentHash(candidate),
  };
  proposal.functionalValidation = await functionalValidation(proposal);
  return proposal;
}
export async function validateChangeStructure(workspace, proposal) {
  keys(proposal, ['repair', 'ownerId', 'functionalValidation', 'schemaVersion', 'operationId', 'projectId', 'baseRevision', 'baseHash', 'operations', 'operationCount', 'candidate', 'candidateHash', 'artifact', 'artifactHash']);
  if (proposal.schemaVersion !== 1 || typeof proposal.operationId !== 'string' || !proposal.operationId) fail('INVALID_SCHEMA');
  if (!Array.isArray(proposal.operations) || proposal.operationCount !== proposal.operations.length) fail('OPERATION_COUNT_MISMATCH');
  if (workspace.history.some((event) => event.operationId === proposal.operationId)) fail('DUPLICATE_APPLY');
  if (proposal.projectId !== workspace.committed.projectId || proposal.baseRevision !== workspace.revision || proposal.baseHash !== await contentHash(workspace.committed)) fail('STALE_PROPOSAL');
  const candidate = proposal.repair ? await validateRepairCandidate(workspace, proposal) : candidateFor(workspace.committed, proposal.operations);
  const hash = await contentHash(candidate);
  if (hash !== proposal.candidateHash || hash !== await contentHash(proposal.candidate)) fail('CANDIDATE_MISMATCH');
  validateLandingArtifact(candidate, proposal.artifact);
  if (await contentHash(proposal.artifact) !== proposal.artifactHash) fail('ARTIFACT_HASH_MISMATCH');
  return candidate;
}
export async function applyChange(workspace, proposal) {
  return applyReviewedChange(workspace, proposal);
}
export async function applyReviewedChange(workspace, proposal, decision) {
  const candidate = await validateChangeStructure(workspace, proposal);
  await requireFunctionalPass(proposal);
  const review = await createChangeReview(workspace, proposal.ownerId || 'legacy-local', proposal);
  if (decisionRequired(review)) await validateHumanDecision(review, decision);
  const hash = proposal.candidateHash;
  return { ...workspace, revision: workspace.revision + 1, committed: candidate, lastOperationId: proposal.operationId,
    history: [...workspace.history, { operationId: proposal.operationId, before: clone(workspace.committed), beforeHash: proposal.baseHash, afterHash: hash, artifactHash: proposal.artifactHash, rendererVersion: proposal.artifact.rendererVersion, kind: 'apply' }] };
}
export async function revertChange(workspace, expectedRevision) {
  if (workspace.revision !== expectedRevision) fail('STALE_REVERT');
  const event = workspace.history.at(-1);
  if (event?.kind !== 'apply') fail('NOTHING_TO_REVERT');
  if (await contentHash(workspace.committed) !== event.afterHash || await contentHash(event.before) !== event.beforeHash) fail('REVERT_IDENTITY_MISMATCH');
  return { ...workspace, revision: workspace.revision + 1, committed: clone(event.before),
    history: [...workspace.history, { kind: 'revert', operationId: `revert:${event.operationId}`, revertedOperationId: event.operationId, beforeHash: event.afterHash, afterHash: event.beforeHash }],
    lastOperationId: `revert:${event.operationId}` };
}
export const transactionStorageKey = (projectId) => `sistemamaestro:landingTransaction:v1:${projectId}`;
export function saveWorkspace(storage, workspace, expectedRaw) {
  const key = transactionStorageKey(workspace.committed.projectId);
  if (storage.getItem(key) !== expectedRaw) fail('STORAGE_CONFLICT');
  const raw = JSON.stringify(workspace);
  storage.setItem(key, raw); // Failure occurs before caller commits React state.
  return raw;
}
export function loadWorkspace(storage, projectId) {
  const raw = storage.getItem(transactionStorageKey(projectId));
  if (raw === null) return null;
  const value = JSON.parse(raw);
  if (value.schemaVersion !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 0 || !Array.isArray(value.history) || value.committed?.projectId !== projectId || !isCompatibleLanding(value.committed)) fail('INVALID_STORAGE');
  return value;
}
