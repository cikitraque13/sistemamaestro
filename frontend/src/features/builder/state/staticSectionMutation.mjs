const fail = (code) => { throw new Error(code); };
const exact = (value, names) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !names.includes(key)) || names.some((key) => !Object.hasOwn(value, key))) fail('INVALID_SECTION_SCHEMA');
};
const id = (value) => { if (typeof value !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(value)) fail('INVALID_SECTION_ID'); };
const text = (value, max, empty = false) => {
  if (typeof value !== 'string' || (!empty && !value.trim()) || value.length > max || /[\u0000-\u001f]/.test(value)) fail('INVALID_SECTION_CONTENT');
};
export const isStaticSectionOperation = (type) => ['insert_static_section', 'update_static_section', 'move_static_section', 'remove_static_section'].includes(type);
export function validateStaticSectionOperation(op) {
  const insert = op.type === 'insert_static_section';
  const content = insert || op.type === 'update_static_section';
  const position = insert || op.type === 'move_static_section';
  exact(op, ['type', 'id', ...(content ? ['sectionType', 'content'] : []), ...(position ? ['afterId'] : [])]);
  id(op.id);
  if (position) { if (op.afterId !== null) id(op.afterId); if (op.afterId === op.id) fail('INVALID_SECTION_TARGET'); }
  if (content) {
    if (op.sectionType !== 'trust') fail('UNSUPPORTED_SECTION_TYPE');
    exact(op.content, ['title', 'description', 'items']);
    text(op.content.title, 120); text(op.content.description, 1000, true);
    if (!Array.isArray(op.content.items) || op.content.items.length < 1 || op.content.items.length > 8) fail('INVALID_SECTION_ITEMS');
    op.content.items.forEach((item) => text(item, 240));
  }
}
export function mutateStaticSection(state, op) {
  validateStaticSectionOperation(op);
  if (!Array.isArray(state.blocks) || !state.blocks.length || state.blocks.length > 100) fail('INVALID_SECTION_STRUCTURE');
  const ids = state.blocks.map((block) => block?.id);
  if (ids.some((key) => typeof key !== 'string' || !key) || new Set(ids).size !== ids.length) fail('DUPLICATE_SECTION_ID');
  // Array and display order must agree before introducing structural changes.
  const blocks = [...state.blocks].sort((a, b) => (Number.isFinite(a.order) ? a.order : 999) - (Number.isFinite(b.order) ? b.order : 999));
  const target = blocks.find((block) => block.id === op.id);
  if (op.type === 'insert_static_section') {
    if (target) fail('DUPLICATE_SECTION_ID');
    if (blocks.length >= 100) fail('SECTION_LIMIT');
  } else if (!target || target.canonicalStatic !== 1 || target.type !== 'trust') fail('UNSUPPORTED_SECTION_TARGET');
  if (Object.hasOwn(op, 'afterId') && op.afterId !== null && !blocks.some((block) => block.id === op.afterId)) fail('SECTION_TARGET_NOT_FOUND');
  let next = blocks;
  if (op.type === 'remove_static_section') next = blocks.filter((block) => block.id !== op.id);
  else if (op.type === 'update_static_section') next = blocks.map((block) => block.id === op.id ? { ...block, label: op.content.title, props: JSON.parse(JSON.stringify(op.content)) } : block);
  else {
    const section = target || { id: op.id, type: 'trust', canonicalStatic: 1, label: op.content.title, props: JSON.parse(JSON.stringify(op.content)) };
    next = blocks.filter((block) => block.id !== op.id);
    const index = op.afterId === null ? 0 : next.findIndex((block) => block.id === op.afterId) + 1;
    // A static section must remain below the hero rendered at the top.
    if (index === 0 || next.slice(index).some((block) => block.type === 'hero')) fail('SECTION_BEFORE_HERO');
    next.splice(index, 0, section);
  }
  return { ...state, blocks: next.map((block, order) => ({ ...block, order })) };
}
export function staticTrustDecision(state) {
  const blocks = [...(state.blocks || [])].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  return [{ type: 'insert_static_section', id: 'static-trust', sectionType: 'trust', afterId: blocks.at(-1)?.id || null,
    content: { title: 'Antes de decidir', description: 'Resuelve tus dudas antes de dar el siguiente paso.', items: ['Consulta qué incluye la propuesta.', 'Pregunta cómo funciona el proceso.', 'Confirma las condiciones antes de continuar.'] } }];
}
