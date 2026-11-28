import { api } from '../../../lib/apiClient';
import { economicPost } from '../../../lib/economicRequest';

export const PUBLISH_LANDING_ENABLED = false;

export function previewErrorMessage(error) {
  const message = error?.response?.data?.detail?.message;
  if (typeof message === 'string' && message.trim() && !/^[A-Z0-9_]+$/.test(message.trim())) {
    return message.trim();
  }
  return 'No se ha podido preparar la preview. No se ha publicado nada.';
}

export async function loadLandingPreview(projectId) {
  try {
    const response = await api.get(`/builder/preview/${encodeURIComponent(projectId)}`);
    const data = response?.data;
    if (!data || typeof data.html !== 'string') return null;
    return data;
  } catch (error) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export async function generateLandingPreview(project, instruction) {
  const response = await economicPost(api, '/builder/preview', {
    projectId: project.project_id,
    instruction,
  }, { headers: { 'If-Match': project.updated_at || '0' } });
  return response.data;
}
