import { api } from '../../../lib/apiClient';

const path = (projectId, suffix) => `/builder/${suffix}/${encodeURIComponent(projectId)}`;

export async function loadPublication(projectId) {
  const response = await api.get(path(projectId, 'publish'));
  return response.data;
}

export async function publishSavedLanding(projectId, slug) {
  const response = await api.post(path(projectId, 'publish'), { slug });
  return response.data;
}

export async function republishSavedLanding(projectId) {
  const response = await api.post(`${path(projectId, 'publish')}/republish`, {});
  return response.data;
}

export async function unpublishSavedLanding(projectId) {
  const response = await api.post(`${path(projectId, 'publish')}/unpublish`, {});
  return response.data;
}

export async function saveCustomDomain(projectId, domain) {
  const response = await api.post(path(projectId, 'domain'), { domain });
  return response.data;
}

export async function verifyCustomDomain(projectId) {
  const response = await api.post(`${path(projectId, 'domain')}/verify`, {});
  return response.data;
}

export function publishErrorMessage(error) {
  const message = error?.response?.data?.detail?.message;
  if (typeof message === 'string' && message.trim()) return message.trim();
  return 'No se ha podido completar la acción.';
}
