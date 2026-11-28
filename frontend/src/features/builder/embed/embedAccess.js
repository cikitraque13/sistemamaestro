import { API_BASE } from '../../../lib/apiClient';
import { isExistingAdmin } from '../builderAccess';

// Uses fetch instead of api.get so opening the builder does not consume the
// project request the workspace already makes.
export async function isEmbedAgentEnabled() {
  try {
    const response = await fetch(`${API_BASE}/public/config`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data?.embed_agent_enabled === true;
  } catch {
    return false;
  }
}

export async function embedEntryIsOpen(user) {
  if (isExistingAdmin(user)) return true;
  return isEmbedAgentEnabled();
}
