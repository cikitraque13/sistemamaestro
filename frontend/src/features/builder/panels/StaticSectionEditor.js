import React, { useState } from 'react';

export default function StaticSectionEditor({ state, transaction }) {
  const [selected, setSelected] = useState('');
  const [title, setTitle] = useState('Antes de decidir');
  const [description, setDescription] = useState('Resuelve tus dudas antes de continuar.');
  const [items, setItems] = useState('Consulta qué incluye la propuesta.');
  const [afterId, setAfterId] = useState('');
  const blocks = [...(state?.blocks || [])].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const sections = blocks.filter((b) => b.canonicalStatic === 1 && b.type === 'trust');
  const choose = (id) => {
    setSelected(id);
    const section = sections.find((b) => b.id === id);
    if (section) { setTitle(section.props.title); setDescription(section.props.description); setItems(section.props.items.join('\n')); }
  };
  const propose = (type) => {
    const id = selected || `static-${globalThis.crypto.randomUUID()}`;
    const composite = type === 'edit_and_move';
    if (composite) type = 'update_static_section';
    const op = { type, id };
    if (type === 'insert_static_section' || type === 'update_static_section') {
      op.sectionType = 'trust'; op.content = { title, description, items: items.split('\n').map((s) => s.trim()).filter(Boolean) };
    }
    if (type === 'insert_static_section' || type === 'move_static_section') op.afterId = afterId || blocks.filter((b) => b.id !== id).at(-1)?.id || null;
    return transaction.propose(composite ? [op, { type: 'move_static_section', id, afterId: afterId || blocks.filter((b) => b.id !== id).at(-1)?.id || null }] : [op]);
  };
  return <details className="border-b border-white/10 p-3 text-sm text-white">
    <summary>Editar sección de información</summary>
    <fieldset disabled={transaction.busy || Boolean(transaction.pending)} className="grid gap-2 py-3">
      <label>Sección<select aria-label="Sección" value={selected} onChange={(e) => choose(e.target.value)} className="block w-full bg-zinc-900"><option value="">Nueva sección</option>{sections.map((b) => <option key={b.id} value={b.id}>{b.props.title}</option>)}</select></label>
      <label>Título<input aria-label="Título de sección" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} className="block w-full bg-zinc-900" /></label>
      <label>Descripción<textarea aria-label="Descripción de sección" value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} className="block w-full bg-zinc-900" /></label>
      <label>Puntos, uno por línea<textarea aria-label="Puntos de sección" value={items} onChange={(e) => setItems(e.target.value)} className="block w-full bg-zinc-900" /></label>
      <label>Situar después de<select aria-label="Posición de sección" value={afterId} onChange={(e) => setAfterId(e.target.value)} className="block w-full bg-zinc-900"><option value="">Última sección</option>{blocks.filter((b) => b.id !== selected).map((b) => <option key={b.id} value={b.id}>{b.props?.title || b.label || b.id}</option>)}</select></label>
      <button type="button" onClick={() => propose(selected ? 'update_static_section' : 'insert_static_section')}>Proponer {selected ? 'contenido' : 'sección'}</button>
      {selected && <><button type="button" onClick={() => propose('edit_and_move')}>Proponer contenido y posición</button><button type="button" onClick={() => propose('move_static_section')}>Proponer nueva posición</button><button type="button" onClick={() => propose('remove_static_section')}>Proponer eliminación</button></>}
    </fieldset>
    <p className="text-xs text-zinc-400">Texto estático. Revisa la propuesta antes de aplicar.</p>
  </details>;
}
