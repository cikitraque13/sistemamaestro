import {createChangeReview} from './builderChangeReview.mjs';
import {createHumanDecision} from './humanSemanticDecision.mjs';
export async function testDecision(ws,p){return createHumanDecision(await createChangeReview(ws,p.ownerId || 'legacy-local',p),'ACCEPT_WARNING','Razón humana de prueba para este candidato.','test-session',1);}
