import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChatCircle, GridFour, Plus } from '@phosphor-icons/react';

import AdvisorFlowPanel from '../advisor/AdvisorFlowPanel';
import { useAdvisorFlowConfig } from '../advisor/useAdvisorFlowConfig';
import { useBuilderStudio } from '../studio/BuilderStudioContext';
import { projectHumanName } from '../workspace/projectLabel';
import BuilderAccountMenu from './BuilderAccountMenu';
import BuilderProjectSelect from './BuilderProjectSelect';

const PLANS_PATH = '/dashboard/billing';

export default function BuilderShellHeader({
  projectItems = [],
  activeProjectId = '',
  onProjectChange = () => {},
  onNewProject = () => {},
  freeTestMode = false,
}) {
  const navigate = useNavigate();
  const studio = useBuilderStudio();
  const advisor = useAdvisorFlowConfig();
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [advisorNote, setAdvisorNote] = useState('');
  const active = projectItems.find((item) => (item.project_id || item.id) === activeProjectId);
  const projectName = active ? projectHumanName({ ...active, project_id: active.project_id || active.id, title: active.title || active.label }) : '';

  const openAdvisor = () => {
    if (!advisor.enabled) {
      setAdvisorNote('Próximamente disponible.');
      return;
    }
    setAdvisorNote('');
    setAdvisorOpen(true);
  };

  return (
    <header
      data-testid="builder-shell-header"
      className="z-40 flex h-14 items-center gap-2 border-b border-[#2a2a2d] bg-[#0b0b0c] px-4 text-[#f2f2f2]"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex h-8 items-center rounded-full bg-teal-400/20 px-3 text-xs font-semibold text-teal-200">
          Creador de apps
        </span>
        <button
          type="button"
          aria-label={studio?.state.ui.chatOpen === false ? 'Mostrar chat' : 'Ocultar chat'}
          onClick={() => studio?.dispatch({ type: 'toggle-chat' })}
          className="grid h-8 w-8 place-items-center rounded-lg border border-[#2a2a2d] text-[#f2f2f2]"
        >
          <ChatCircle size={16} aria-hidden="true" />
        </button>
        <Link
          to="/dashboard"
          data-testid="builder-inicio"
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-[#f2f2f2]"
        >
          <GridFour size={16} aria-hidden="true" />
          Inicio
        </Link>
        <div className="inline-flex h-8 min-w-0 items-center gap-1 rounded-lg border border-[#2a2a2d] bg-[#111113] pl-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" aria-hidden="true" />
          <BuilderProjectSelect
            variant="tab"
            projectItems={projectItems}
            activeProjectId={activeProjectId}
            onProjectChange={onProjectChange}
          />
          <button
            type="button"
            aria-label={projectName ? `Cerrar ${projectName}` : 'Cerrar proyecto'}
            onClick={() => navigate('/dashboard')}
            className="grid h-8 w-8 place-items-center text-[#9a9a9a]"
          >
            ×
          </button>
        </div>
        <button
          type="button"
          aria-label="Nuevo proyecto"
          onClick={onNewProject}
          className="grid h-8 w-8 place-items-center rounded-lg border border-[#2a2a2d] text-[#f2f2f2]"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      <div data-testid="builder-header-actions" className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          to={PLANS_PATH}
          data-testid="builder-header-upgrade"
          className="inline-flex h-8 items-center rounded-full bg-[#f5d90a] px-3 text-sm font-semibold text-black"
        >
          Mejorar plan
        </Link>
        <button
          type="button"
          data-testid="builder-advisor-pill"
          onClick={openAdvisor}
          className="inline-flex h-8 items-center gap-2 rounded-full border border-[#2a2a2d] px-2 text-sm text-[#f2f2f2]"
        >
          <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-full bg-[#6d28d9] text-[10px]">
            {advisor.photoUrl ? <img src={advisor.photoUrl} alt="" className="h-full w-full object-cover" /> : 'A'}
          </span>
          Conoce a tu asesor
        </button>
        {advisorNote ? <p role="status" className="text-xs text-[#9a9a9a]">{advisorNote}</p> : null}
        {freeTestMode ? (
          <p
            data-testid="builder-free-test-badge"
            className="inline-flex h-8 items-center rounded-full border border-[#2a2a2d] px-2 text-[11px] text-[#f2f2f2]"
          >
            Modo prueba · sin gemas
          </p>
        ) : null}
        <BuilderAccountMenu onNewProject={onNewProject} compact />
      </div>
      <AdvisorFlowPanel open={advisorOpen} onOpenChange={setAdvisorOpen} config={advisor} />
    </header>
  );
}
