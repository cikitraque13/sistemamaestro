import { assessCtaCoherence } from './ctaSemanticCoherence.mjs';
import { classifyRepair } from './boundedLandingRepair.mjs';
import { functionalValidation } from '../preview/functionalLandingValidation.mjs';
import { validateChangeStructure, contentHash, candidateFor } from './builderChangeTransaction.mjs';

const copy = (value) => JSON.parse(JSON.stringify(value));
const object = (value) => value !== null && typeof value === 'object';
// Lossless JSON leaf changes. Presence distinguishes absent keys from null values.
export function exactChanges(before, after, path = []) {
  if (Object.is(before, after)) return [];
  if (object(before) && object(after) && Array.isArray(before) === Array.isArray(after)) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
    const result = [];
    for (const key of keys) {
      const beforePresent = Object.hasOwn(before, key); const afterPresent = Object.hasOwn(after, key);
      if (beforePresent && afterPresent) result.push(...exactChanges(before[key], after[key], [...path, key]));
      else result.push({ path: [...path, key], beforePresent, afterPresent, ...(beforePresent ? { before: copy(before[key]) } : {}), ...(afterPresent ? { after: copy(after[key]) } : {}) });
    }
    // Empty container changes (e.g. [] -> {}) are handled by the type branch below.
    return result;
  }
  return [{ path, beforePresent: true, afterPresent: true, before: copy(before), after: copy(after) }];
}
function sectionChanges(before, after) {
  const previous = before.blocks || []; const next = after.blocks || [];
  const result = [];
  for (const id of new Set([...previous.map((b) => b.id), ...next.map((b) => b.id)])) {
    const from = previous.findIndex((b) => b.id === id); const to = next.findIndex((b) => b.id === id);
    if (from === -1) result.push({ kind: 'ADD', target: id, from: null, to, after: copy(next[to]) });
    else if (to === -1) result.push({ kind: 'DELETE', target: id, from, to: null, before: copy(previous[from]) });
    else {
      const { order: oldOrder, ...oldContent } = previous[from]; const { order: newOrder, ...newContent } = next[to];
      const fields = exactChanges(oldContent, newContent);
      if (fields.length) result.push({ kind: 'EDIT', target: id, fields });
      if (from !== to || oldOrder !== newOrder) result.push({ kind: 'MOVE', target: id, from, to, beforeOrder: oldOrder ?? null, afterOrder: newOrder ?? null });
    }
  }
  return result;
}
export async function createChangeReview(workspace, ownerId, proposal) {
  if (typeof ownerId !== 'string' || !ownerId.trim()) throw new Error('REVIEW_OWNER_REQUIRED');
  // Uses the same validator as apply; no UI-derived reconstruction or provider input.
  const validated = { committed: await validateChangeStructure(workspace, proposal) };
  const functional = await functionalValidation(proposal);
  if (await contentHash(functional) !== await contentHash(proposal.functionalValidation)) throw new Error('FUNCTIONAL_VALIDATION_STALE_OR_MISSING');
  const changes = exactChanges(workspace.committed, validated.committed);
  let stepState = workspace.committed;
  const steps = proposal.operations.map((operation, index) => {
    const after = candidateFor(stepState, [operation]);
    const step = { index: index + 1, type: operation.type, target: operation.id || operation.type, changes: exactChanges(stepState, after), sections: sectionChanges(stepState, after) };
    stepState = after; return step;
  });
  const body = { semanticCoherence: assessCtaCoherence(validated.committed), destinationIntent: proposal.candidate.destinationIntent || null, repairability: classifyRepair(proposal), repair: proposal.repair ? { parentProposalId: proposal.repair.parentProposalId, failureHash: proposal.repair.failureHash, originalFailure: proposal.repair.originalFailure, selection: proposal.repair.selection, originalDestinationIntent: proposal.repair.originalDestinationIntent, operations: proposal.repair.operations, rationale: proposal.repair.rationale, attempt: proposal.repair.attempt, changes: exactChanges(proposal.repair.parent.candidate, proposal.candidate), status: functional.status === 'PASS' ? 'READY_FOR_HUMAN_REVIEW' : functional.status } : null, operationCount: proposal.operationCount, steps, finalStructure: (validated.committed.blocks || []).map((block, index) => ({ id: block.id, position: index + 1, order: block.order ?? null })), version: 1, ownerId, projectId: proposal.projectId, baseRevision: proposal.baseRevision,
    proposalId: proposal.operationId, beforeHash: proposal.baseHash, candidateHash: proposal.candidateHash,
    artifactHash: proposal.artifactHash, proposalHash: await contentHash(proposal), validation: functional.status, functionalValidation: functional,
    operations: copy(proposal.operations), sections: sectionChanges(workspace.committed, validated.committed), changes,
    warnings: changes.length ? ['La entrega validada es HTML estático.'] : ['La propuesta no modifica el contenido activo.'],
  };
  return { ...body, reviewId: await contentHash(body) };
}
export async function validateChangeReview(workspace, ownerId, proposal, review) {
  if (!review) throw new Error('REVIEW_REQUIRED');
  const expected = await createChangeReview(workspace, ownerId, proposal);
  if (await contentHash(review) !== await contentHash(expected)) throw new Error('REVIEW_STALE_OR_TAMPERED');
  return true;
}
