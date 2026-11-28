import React, { useState } from 'react';
import {
  ArrowClockwise,
  ArrowSquareOut,
  Code,
  Eye,
  GearSix,
  PencilSimple,
  ShareNetwork,
  SidebarSimple,
  X,
} from '@phosphor-icons/react';

import PublishButton from './PublishButton';
import VersionHistory from './VersionHistory';

const toolButton = 'sq';

const SCORE_LABELS = {
  visual_hierarchy: 'Jerarquía visual',
  selling_microcopy: 'Microcopy',
  objections: 'Objeciones',
  specificity: 'Especificidad',
};

export default function PreviewToolbar({
  chatOpen = true,
  onToggleChat,
  surface = 'preview',
  onSurface,
  onEdit,
  codeOpen = false,
  onToggleCode,
  onOpen,
  onRefresh,
  onShare,
  shareEnabled = false,
  evaluation = null,
  publishEnabled = false,
  publishReason = '',
  onPublish,
  onClose,
  versions,
  htmlByVersion,
  visibleVersion,
  canUndo,
  undoError,
  onRestore,
  onUndo,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div data-testid="builder-preview-toolbar" className="rbar">
      <div className="rl">
      <button type="button" aria-label={chatOpen ? 'Ocultar chat' : 'Mostrar chat'} onClick={onToggleChat} className={toolButton}>
        <SidebarSimple size={16} aria-hidden="true" />
      </button>
      <div className="seg">
        <button type="button" aria-pressed={surface === 'preview'} onClick={() => onSurface?.('preview')} className={surface === 'preview' ? 'on' : ''}>
          <Eye size={14} aria-hidden="true" />
          Vista previa
        </button>
        <button type="button" aria-pressed={surface === 'live'} onClick={() => onSurface?.('live')} className={surface === 'live' ? 'on' : ''}>
          <i className="dot" />
          En vivo
        </button>
      </div>
      <div className="relative">
        <button type="button" aria-label="Ajustes de la vista" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)} className={toolButton}>
          <GearSix size={16} aria-hidden="true" />
        </button>
        {settingsOpen ? (
          <div data-testid="builder-preview-settings" className="absolute left-0 top-10 z-20 w-64 rounded-xl border border-[#2a2a2d] bg-[#111113] p-3 text-xs text-[#9a9a9a]">
            {evaluation?.scores ? (
              <ul className="space-y-1">
                {Object.entries(SCORE_LABELS).map(([key, label]) => (
                  <li key={key} className="flex justify-between gap-3">
                    <span>{label}</span>
                    <span className="text-[#f2f2f2]">{evaluation.scores[key] ?? '—'}/5</span>
                  </li>
                ))}
              </ul>
            ) : <p>Esta versión no tiene evaluación.</p>}
          </div>
        ) : null}
      </div>
      <button type="button" aria-label="Código" aria-pressed={codeOpen} onClick={onToggleCode} className={toolButton}>
        <Code size={16} aria-hidden="true" />
      </button>
      <button type="button" aria-label="Editar" onClick={onEdit} className={toolButton}>
        <PencilSimple size={15} aria-hidden="true" />
      </button>
      </div>
      <div className="rr">
        <button type="button" aria-label="Abrir vista" onClick={onOpen} disabled={!onOpen} className={toolButton}>
          <ArrowSquareOut size={16} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Actualizar vista" onClick={onRefresh} className={toolButton}>
          <ArrowClockwise size={16} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Compartir" disabled={!shareEnabled} title={shareEnabled ? 'Copiar la dirección publicada' : 'No hay una dirección publicada.'} onClick={onShare} className={toolButton}>
          <ShareNetwork size={16} aria-hidden="true" />
        </button>
        <VersionHistory
          versions={versions}
          htmlByVersion={htmlByVersion}
          visibleVersion={visibleVersion}
          canUndo={canUndo}
          undoError={undoError}
          onRestore={onRestore}
          onUndo={onUndo}
        />
        {evaluation ? (
          <span data-testid="builder-score-badge" className={`text-sm font-semibold ${evaluation.passed ? 'text-[#22c55e]' : 'text-[#9a9a9a]'}`}>
            {evaluation.total}/{evaluation.max}
          </span>
        ) : null}
        <PublishButton enabled={publishEnabled} reason={publishReason} onClick={onPublish} />
        <button type="button" aria-label="Cerrar vista" onClick={onClose} className={toolButton}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
