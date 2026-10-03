const reject = () => { throw new Error('PROJECT_IDENTITY_INVALID'); };
export function serverRevision(project) {
  if (!project || typeof project !== 'object') return reject();
  if (!Object.hasOwn(project, 'updated_at')) return '0';
  const value = project.updated_at;
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) return reject();
  return value;
}
export function requestedProject(search, state) {
  const params = new URLSearchParams(search);
  const ids = params.getAll('project_id');
  const url = ids[0];
  const transported = state?.projectId;
  if (ids.length > 1 || (url !== undefined && !url) || (transported !== undefined && typeof transported !== 'string')) return reject();
  if (url && transported && url !== transported) return reject();
  const id = url || transported || '';
  if (id && !/^[A-Za-z0-9_-]+$/.test(id)) return reject();
  return id;
}
export function validatedProjectIdentity(project, ownerId, requestedId) {
  if (!ownerId || !requestedId || project?.user_id !== ownerId || project?.project_id !== requestedId) return reject();
  return { ownerId, projectId: requestedId, serverRevision: serverRevision(project) };
}
export function requireOutputIdentity(output, identity) {
  const binding = output?.trace?.meta?.identity;
  if (!identity || binding?.scope !== 'project' || binding.ownerId !== identity.ownerId || binding.projectId !== identity.projectId || binding.serverRevision !== identity.serverRevision) return reject();
  return output;
}
