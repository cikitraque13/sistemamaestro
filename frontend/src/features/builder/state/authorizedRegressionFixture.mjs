// Test-only adapter: historical scenarios cross the explicit S13 gate.
import {createDurableLandingWorkspace as createRepository,createLocalWorkspaceStore} from './durableLandingWorkspace.mjs';
export {createLocalWorkspaceStore};
export function createBoundWorkspace(...args) {
 args[4] ??= {serverRevision:'0',verify:async()=> '0'};
 return createRepository(...args);
}
export function createDurableLandingWorkspace(...args){
 const repository=createBoundWorkspace(...args);
 return {...repository,apply:envelope=>{
  const snapshot=JSON.parse(JSON.stringify(envelope));
  return repository.authorize(snapshot).then(authorization=>repository.apply(snapshot,authorization));
 }};
}
