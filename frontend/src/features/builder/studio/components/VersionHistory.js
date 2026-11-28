import React, { useState } from 'react';
import { ClockCounterClockwise } from '@phosphor-icons/react';

import { finishedStamp, versionRows } from '../model';

const toolButton = 'sq';

export default function VersionHistory({
  versions = [],
  htmlByVersion = {},
  visibleVersion = null,
  canUndo = false,
  undoError = '',
  onRestore,
  onUndo,
}) {
  const [open, setOpen] = useState(false);
  const rows = versionRows(versions, htmlByVersion);
  return (
    <div className="relative">
      <button type="button" aria-label="Versiones" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={toolButton}>
        <ClockCounterClockwise size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div data-testid="builder-version-menu" className="absolute right-0 top-10 z-20 w-72 rounded-xl border border-[#2a2a2d] bg-[#111113] p-2 text-xs text-[#f2f2f2] shadow-lg">
          {rows.length === 0 ? <p className="px-2 py-1 text-[#9a9a9a]">Todavía no hay versiones guardadas.</p> : null}
          {rows.map((row) => (
            <div key={row.version} className="flex items-start gap-2 rounded-lg px-2 py-1.5">
              <div className="min-w-0 flex-1">
                <p>v{row.version}{visibleVersion === row.version ? ' · visible' : ''}</p>
                <p className="truncate text-[#9a9a9a]">{row.instruction}</p>
                {row.createdAt ? <p className="text-[#9a9a9a]">{finishedStamp(row.createdAt)}</p> : null}
              </div>
              <button
                type="button"
                disabled={!row.canRestore}
                title={row.canRestore ? 'Restaurar esta vista' : 'Esta versión no trae el HTML en la respuesta guardada.'}
                onClick={() => onRestore?.(row.version)}
                className="shrink-0 text-[#f2f2f2] disabled:opacity-40"
              >
                Restaurar
              </button>
            </div>
          ))}
          <button type="button" disabled={!canUndo} onClick={onUndo} className="mt-1 w-full rounded-lg px-2 py-1.5 text-left disabled:opacity-40">
            Deshacer
          </button>
          {undoError ? <p role="alert" className="px-2 py-1 text-[#f2f2f2]">{undoError}</p> : null}
          <p className="px-2 pt-1 text-[#9a9a9a]">Restaurar muestra una copia que esta sesión ya tiene. No reescribe el servidor.</p>
        </div>
      ) : null}
    </div>
  );
}
