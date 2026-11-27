import { api } from '../../lib/apiClient';

// Same role the opportunities catalog already treats as admin.
// This does not add a new admin rule.
const EXISTING_ADMIN_ROLE = 'admin';

export function isExistingAdmin(user) {
  const role = String(user?.role ?? '').trim().toLowerCase();
  return role === EXISTING_ADMIN_ROLE;
}

export async function isBuilderEnabled() {
  try {
    const response = await api.get('/public/config');
    return response?.data?.builder_enabled === true;
  } catch {
    return false;
  }
}

export async function builderEntryIsOpen(user) {
  if (isExistingAdmin(user)) return true;
  return isBuilderEnabled();
}
