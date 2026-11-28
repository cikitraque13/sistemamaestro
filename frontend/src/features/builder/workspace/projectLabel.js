const clipLabel = (value) => (value.length > 72 ? `${value.slice(0, 69)}…` : value);

const isRawProjectId = (value, projectId) => {
  const text = String(value || '').trim();
  if (!text) return true;
  if (projectId && text === projectId) return true;
  return /^proj_[a-z0-9]+$/i.test(text);
};

export const projectHumanName = (project) => {
  if (!project) return 'Proyecto sin nombre';
  const projectId = String(project.project_id || '');
  const named = [project.title, project.name, project.blueprint?.title]
    .map((value) => String(value || '').trim())
    .find((value) => value && !isRawProjectId(value, projectId));
  if (named) return clipLabel(named);

  const input = String(project.input_content || '').replace(/\s+/g, ' ').trim();
  if (isRawProjectId(input, projectId)) return 'Proyecto sin nombre';
  if (/^https?:\/\//i.test(input)) {
    try {
      return new URL(input).hostname.replace(/^www\./, '') || 'Proyecto sin nombre';
    } catch {
      return 'Proyecto sin nombre';
    }
  }
  return clipLabel(input);
};

export function toSelectableProject(item) {
  if (!item || typeof item !== 'object') return null;
  const projectId = String(item.project_id || item.id || '').trim();
  if (!projectId) return null;
  const label = String(item.label || '').trim();
  return {
    project_id: projectId,
    input_content: typeof item.input_content === 'string' ? item.input_content : '',
    input_url: typeof item.input_url === 'string' ? item.input_url : '',
    title: String(item.title || item.name || label || '').trim(),
    name: typeof item.name === 'string' ? item.name : '',
    blueprint: item.blueprint,
  };
}
