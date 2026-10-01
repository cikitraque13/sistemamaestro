// Test-only adapter: historical scenarios cross the explicit S13 gate.
import {createDurableLandingWorkspace as createRepository,createLocalWorkspaceStore} from './durableLandingWorkspace.mjs';
export {createLocalWorkspaceStore};
export function createDurableLandingWorkspace(...args){
 const repository=createRepository(...args);
 return {...repository,apply:envelope=>{
  const snapshot=JSON.parse(JSON.stringify(envelope));
  return repository.authorize(snapshot).then(authorization=>repository.apply(snapshot,authorization));
 }};
}
