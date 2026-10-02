import { availableDestinations, selectDestination } from './ctaDestinationIntent.mjs';
import { contentHash, validateChangeStructure, prepareChange } from './builderChangeTransaction.mjs';
import { functionalValidation } from '../preview/functionalLandingValidation.mjs';
import { renderLandingArtifact } from '../preview/landingArtifact.mjs';
const copy = value => JSON.parse(JSON.stringify(value));
const stop = code => { throw new Error(code); };
export function classifyRepair(proposal) {
  const result = proposal?.functionalValidation;
  if (proposal?.repair) return { status: 'BLOCKED', reason: 'REPAIR_BUDGET_EXHAUSTED' };
  if (!result || result.status === 'BLOCKED') return { status: 'BLOCKED', reason: 'VALIDATOR_NOT_AVAILABLE' };
  const navigation = result.checks?.find(c => c.id === 'NAVIGATION');
  const ctas = proposal.candidate?.ctas || [];
  const primary = ctas.find(c => c.intent === 'primary' || c.id === 'hero-primary-cta');
  const from = primary?.href;
  if (result.status !== 'FAIL' || !result.failedInvariants?.includes('NAVIGATION') || result.failedInvariants.some(id => !['NAVIGATION','DESTINATION_INTENT'].includes(id)) ||
      typeof from !== 'string' || !/^#[a-zA-Z][\w-]*$/.test(from) || !navigation?.evidence?.targets?.includes('contenido') ||
      navigation.evidence.targets.includes(from.slice(1))) return { status: 'NOT_REPAIRABLE', reason: 'NO_SAFE_LOCAL_REPAIR' };
  const targets = availableDestinations(proposal.candidate);
  if (!targets.length) return { status: 'NOT_REPAIRABLE', reason: 'NO_AVAILABLE_DESTINATION' };
  return { status: 'REPAIRABLE', reason: 'REQUIRES_DESTINATION_SELECTION', from, targets };
}
export async function repairContext(workspace, parent, sectionId) {
  if (parent?.repair) stop('REPAIR_BUDGET_EXHAUSTED');
  await validateChangeStructure(workspace, parent);
  const result = await functionalValidation(parent);
  if (await contentHash(result) !== await contentHash(parent.functionalValidation)) stop('REPAIR_FAILURE_IDENTITY_MISMATCH');
  const diagnosis = classifyRepair(parent);
  if (diagnosis.status !== 'REPAIRABLE') stop(diagnosis.reason);
  if (!sectionId) stop('REQUIRES_DESTINATION_SELECTION');
  const candidate = selectDestination(parent.candidate, sectionId);
  const selection = candidate.destinationIntent;
  return { candidate, metadata: { version: 1, attempt: 1, maxAttempts: 1, parentProposalId: parent.operationId,
    parentHash: await contentHash(parent), failureHash: await contentHash(result), originalFailure: copy(result),
    selection, originalDestinationIntent: parent.candidate.destinationIntent || null, operations: [{type: 'repair_primary_target', from: diagnosis.from, to: selection.targetFragment}], rationale: `El destino ${diagnosis.from} ya no existe. Has seleccionado ${selection.label} (${selection.targetFragment}).`, parent: copy(parent) } };
}
export async function prepareRepair(workspace, parent, sectionId, operationId = globalThis.crypto.randomUUID()) {
  const snapshot = copy(parent);
  const {candidate,metadata} = await repairContext(workspace, snapshot, sectionId);
  if (operationId === snapshot.operationId) stop('REPAIR_ID_MUST_BE_NEW');
  const proposal = await prepareChange(workspace, snapshot.operations, operationId, snapshot.ownerId);
  proposal.repair = metadata; proposal.candidate = candidate; proposal.candidateHash = await contentHash(candidate);
  proposal.artifact = renderLandingArtifact(candidate); proposal.artifactHash = await contentHash(proposal.artifact);
  proposal.functionalValidation = await functionalValidation(proposal);
  await validateChangeStructure(workspace, proposal);
  return proposal;
}
export async function validateRepairCandidate(workspace, proposal) {
  const {candidate,metadata} = await repairContext(workspace, proposal.repair?.parent, proposal.repair?.selection?.sectionId);
  if (proposal.operationId === metadata.parentProposalId || proposal.ownerId !== metadata.parent.ownerId ||
      await contentHash(proposal.operations) !== await contentHash(metadata.parent.operations) ||
      await contentHash(proposal.repair) !== await contentHash(metadata)) stop('REPAIR_LINEAGE_MISMATCH');
  return candidate;
}
