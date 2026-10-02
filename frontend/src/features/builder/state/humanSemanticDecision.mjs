import { contentHash } from './builderChangeTransaction.mjs';
export const decisionRequired = review => Boolean(review.destinationIntent && ['POTENTIAL_MISMATCH', 'UNCERTAIN'].includes(review.semanticCoherence?.status));
export async function decisionBinding(review) {
 return {ownerId:review.ownerId,projectId:review.projectId,reviewId:review.reviewId,proposalId:review.proposalId,candidateHash:review.candidateHash,artifactHash:review.artifactHash,baseRevision:review.baseRevision,semanticAssessmentId:await contentHash(review.semanticCoherence)};
}
export async function createHumanDecision(review,type,rationale,sessionId,sequence) {
 if (!['ACCEPT_WARNING','REJECT_CHANGE','REQUIRES_CLARIFICATION'].includes(type)) throw new Error('INVALID_DECISION_TYPE');
 if(typeof rationale !== 'string' || rationale.length > 500 || (type === 'ACCEPT_WARNING' && !rationale.trim())) throw new Error('RATIONALE_REQUIRED_OR_TOO_LONG');
 const body={version:1,...await decisionBinding(review),semanticAssessment: JSON.parse(JSON.stringify(review.semanticCoherence)),type,rationale:rationale.trim(),sessionId,sequence,createdAt:new Date().toISOString(),validity:type==='ACCEPT_WARNING'?'VALID':type==='REJECT_CHANGE'?'REJECTED':'REQUIRES_CLARIFICATION'};
 return {...body,decisionId:await contentHash(body)};
}
export async function validateHumanDecision(review,decision) {
 if(!decision) throw new Error('HUMAN_DECISION_REQUIRED');
 const {decisionId,...body}=decision;
 if(decisionId!==await contentHash(body) || decision.type!=='ACCEPT_WARNING' || decision.validity!=='VALID' || typeof decision.rationale!=='string' || !decision.rationale.trim() || decision.rationale.length>500) throw new Error('INVALID_HUMAN_DECISION');
 const binding=await decisionBinding(review);
 for(const [key,value] of Object.entries(binding)) if(decision[key]!==value) throw new Error('STALE_DECISION');
 return true;
}
