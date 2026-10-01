import { availableDestinations, PRIMARY_CTA_ID } from '../state/ctaDestinationIntent.mjs';
import { contentHash } from '../state/builderChangeTransaction.mjs';

import { renderLandingArtifact } from './landingArtifact.mjs';

export const FUNCTIONAL_VALIDATOR_VERSION = 'bounded-static-dom-v1';

// Deliberately accepts only the renderer's small HTML grammar, not general HTML.

export function inspectStaticDocument(html) {

  const nodes = []; const stack = []; const voids = new Set(['meta']);

  const allowed = new Set(['html','head','meta','title','style','body','main','header','h1','h2','p','a','div','section','ul','li']);

  const tokens = html.match(/<!doctype html>|<[^>]*>|[^<]+/gi) || [];

  if (tokens.join('') !== html || tokens[0]?.toLowerCase() !== '<!doctype html>') throw new Error('HTML_GRAMMAR');

  for (const token of tokens.slice(1)) {

    if (!token.startsWith('<')) { if (stack.length) stack.at(-1).text += token; else if (token.trim()) throw new Error('HTML_ROOT'); continue; }

    if (token.startsWith('</')) { const match = /^<\/([a-z0-9]+)>$/.exec(token); if (!match || stack.pop()?.tag !== match[1]) throw new Error('HTML_NESTING'); continue; }

    const match = /^<([a-z0-9]+)((?:\s+[a-zA-Z-]+(?:="[^"]*")?)*)>$/.exec(token);

    if (!match || !allowed.has(match[1])) throw new Error('ACTIVE_OR_UNSUPPORTED_MARKUP');

    const attrs = {}; for (const a of match[2].matchAll(/\s+([a-zA-Z-]+)(?:="([^"]*)")?/g)) { if (Object.hasOwn(attrs,a[1]) || /^on/i.test(a[1])) throw new Error('ACTIVE_OR_DUPLICATE_ATTRIBUTE'); attrs[a[1]]=a[2] ?? ''; }

    const node = {tag:match[1],attrs,text:'',parent:stack.at(-1)?.tag || null}; nodes.push(node); if (!voids.has(node.tag)) stack.push(node);

  }

  if (stack.length) throw new Error('HTML_NESTING');

  return nodes;

}

export async function functionalValidation(proposal) {

  const identity = { repairHash: await contentHash(proposal.repair ?? null), validatorVersion: FUNCTIONAL_VALIDATOR_VERSION, ownerId: proposal.ownerId ?? null, projectId:proposal.projectId, proposalId:proposal.operationId, baseRevision:proposal.baseRevision, baseHash:proposal.baseHash, candidateHash:await contentHash(proposal.candidate), artifactHash:await contentHash(proposal.artifact), operationsHash:await contentHash(proposal.operations) };

  const checks=[]; const check=(id,pass,message,evidence={})=>checks.push({id,status:pass?'PASS':'FAIL',message,evidence});

  let status='PASS';

  try {

    const nodes=inspectStaticDocument(proposal.artifact.html); const find=(tag)=>nodes.filter(n=>n.tag===tag);

    check('HTML_DOM',find('html').length===1 && find('body').length===1 && find('main').length===1 && find('h1').length===1,'Documento estático con estructura principal completa.');

    const ids=nodes.filter(n=>n.attrs.id).map(n=>n.attrs.id);

    const blocks=proposal.candidate.blocks || []; const blockIds=blocks.map(b=>b.id).filter(Boolean);

    check('UNIQUE_IDS',new Set(ids).size===ids.length && new Set(blockIds).size===blockIds.length,'Las identidades de las secciones deben ser únicas.');

    const links=find('a');

    check('NAVIGATION',links.length===1 && links.every(n=>/^#[a-zA-Z][\w-]*$/.test(n.attrs.href) && ids.includes(n.attrs.href.slice(1))),'El CTA debe apuntar a un destino interno existente.',{links:links.map(n=>n.attrs.href),targets:ids});

    if (proposal.candidate.destinationIntent) {
      const intent = proposal.candidate.destinationIntent;
      const target = availableDestinations(proposal.candidate).find(t => t.sectionId === intent.sectionId);
      check('DESTINATION_INTENT',Boolean(target && intent.ctaId === PRIMARY_CTA_ID && intent.sourceSectionId === target.sourceSectionId && intent.destinationType === 'section' && intent.targetFragment === target.targetFragment && links[0]?.attrs.id === PRIMARY_CTA_ID && links[0]?.attrs.href === target.targetFragment),'El CTA debe alcanzar la sección seleccionada explícitamente.');
    }
    check('REQUIRED_CONTENT',find('h1').every(n=>n.text.trim()) && find('h2').every(n=>n.text.trim()) && links.every(n=>n.text.trim()),'Títulos y CTA deben contener texto.');

    const hero=blocks.find(b=>b.type==='hero') || blocks[0];

    const expectedOrder=blocks.filter(b=>b!==hero && b.canonicalStatic===1).map(b=>b.id);

    const actualOrder=nodes.filter(n=>Object.hasOwn(n.attrs,'data-section-id')).map(n=>n.attrs['data-section-id']);

    check('ORDER',JSON.stringify(expectedOrder)===JSON.stringify(actualOrder),'El orden del documento debe coincidir con el orden de las secciones.');

    check('STATIC_ONLY',nodes.every(n=>Object.keys(n.attrs).every(a=>!/^on/i.test(a) && !['src','srcdoc','action','formaction'].includes(a))) && find('style').length===1,'El contenido no puede introducir elementos activos.');

    check('CANDIDATE_ARTIFACT',JSON.stringify(renderLandingArtifact(proposal.candidate))===JSON.stringify(proposal.artifact),'El documento debe representar exactamente el candidato final.');

  } catch (error) { status='BLOCKED'; check('VALIDATOR_FAILURE',false,'No se pudo comprobar el documento estático.',{code:error.message}); }

  const failedInvariants=checks.filter(c=>c.status!=='PASS').map(c=>c.id);

  if(status!=='BLOCKED' && failedInvariants.length) status='FAIL';

  return {...identity,status,checks,failedInvariants,warnings:[],repairability:status==='FAIL'?'REPAIRABLE':status==='BLOCKED'?'BLOCKED':null};

}

export async function requireFunctionalPass(proposal) {

  const actual=await functionalValidation(proposal);

  if(await contentHash(actual)!==await contentHash(proposal.functionalValidation ?? null)) throw new Error('FUNCTIONAL_VALIDATION_STALE_OR_MISSING');

  if(actual.status!=='PASS') throw new Error('FUNCTIONAL_VALIDATION_'+actual.status+':'+actual.failedInvariants.join(','));

  return actual;

}
