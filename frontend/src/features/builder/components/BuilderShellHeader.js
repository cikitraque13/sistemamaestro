import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChatCircle, GridFour, Plus } from '@phosphor-icons/react';

import AdvisorFlowPanel from '../advisor/AdvisorFlowPanel';
import { useAdvisorFlowConfig } from '../advisor/useAdvisorFlowConfig';
import { useBuilderStudio } from '../studio/BuilderStudioContext';
import '../studio/studio.css';
import { projectHumanName } from '../workspace/projectLabel';
import AdvisorMark from './AdvisorMark';
import BuilderAccountMenu from './BuilderAccountMenu';
import BuilderProjectSelect from './BuilderProjectSelect';

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
    <header data-testid="builder-shell-header" className="studio-topbar">
      <div className="tl">
        <span className="pill-teal">Creador de apps</span>
        <button
          type="button"
          aria-label={studio?.state.ui.chatOpen === false ? 'Mostrar chat' : 'Ocultar chat'}
          onClick={() => studio?.dispatch({ type: 'toggle-chat' })}
          className="sq"
        >
          <ChatCircle size={15} aria-hidden="true" />
        </button>
        <Link to="/dashboard" data-testid="builder-inicio" className="tab">
          <GridFour size={14} aria-hidden="true" />
          Inicio
        </Link>
        <span className="tab on">
          <i className="live" />
          <BuilderProjectSelect
            variant="tab"
            projectItems={projectItems}
            activeProjectId={activeProjectId}
            onProjectChange={onProjectChange}
          />
          <button
            type="button"
            className="x"
            aria-label={projectName ? `Cerrar ${projectName}` : 'Cerrar proyecto'}
            onClick={() => navigate('/dashboard')}
          >
            ×
          </button>
        </span>
        <button type="button" aria-label="Nuevo proyecto" onClick={onNewProject} className="sq">
          <Plus size={15} aria-hidden="true" />
        </button>
      </div>
      <div data-testid="builder-header-actions" className="tr">
        <button type="button" data-testid="builder-advisor-pill" onClick={openAdvisor} className="pill-adv">
          <span className="av-s">
            {advisor.photoUrl ? <img src={advisor.photoUrl} alt="" className="h-full w-full object-cover" /> : <AdvisorMark />}
          </span>
          Conoce a tu asesor
        </button>
        {advisorNote ? <p role="status" className="sr-only">{advisorNote}</p> : null}
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
