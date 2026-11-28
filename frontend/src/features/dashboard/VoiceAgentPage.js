import React, { useEffect, useState } from 'react';

import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../lib/apiClient';
import { loadOwnerProjects } from '../builder/components/BuilderProjectSelect';
import { projectHumanName } from '../builder/workspace/projectLabel';
import { embedOriginFromHost, resolveActiveProject } from './dashboardModel';

const detailMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail && typeof detail.message === 'string' && detail.message.trim()) return detail.message;
  return fallback;
};

const panel = 'rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,19,26,0.92),rgba(10,14,19,0.92))] p-5';

function ProjectPicker({ projects, projectId, onChange }) {
  return (
    <label className="block text-sm text-zinc-300">
      Proyecto
      <select
        data-testid="voice-project"
        value={projectId}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
      >
        {projects.length === 0 ? <option value="">Sin proyectos</option> : null}
        {projects.map((project) => (
          <option key={project.project_id} value={project.project_id}>
            {projectHumanName(project)}
          </option>
        ))}
      </select>
    </label>
  );
}

const VoiceAgentPage = () => {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [host, setHost] = useState('');
  const [greeting, setGreeting] = useState('');
  const [ownedNumber, setOwnedNumber] = useState('');
  const [snippet, setSnippet] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let live = true;
    loadOwnerProjects()
      .then((items) => {
        if (!live) return;
        setProjects(items);
        const active = resolveActiveProject(items);
        if (active) setProjectId(active.project_id);
      })
      .catch(() => {
        if (live) setProjects([]);
      });
    return () => {
      live = false;
    };
  }, []);

  const activateOnSite = async () => {
    const origin = embedOriginFromHost(host);
    if (!projectId) {
      setError('Elige un proyecto. El agente de voz se instala sobre uno que ya existe.');
      return;
    }
    if (!origin) {
      setError('Escribe el dominio completo, por ejemplo https://tuempresa.com.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post('/embed/agents', {
        project_id: projectId,
        allowed_origins: [origin],
      });
      const agent = response?.data || {};
      if (greeting.trim() && agent.agent_id) {
        const patched = await api.patch(`/embed/agents/${agent.agent_id}`, {
          allowed_origins: [origin],
          greeting: greeting.trim(),
        });
        setSnippet(patched?.data?.snippet || agent.snippet || '');
      } else {
        setSnippet(agent.snippet || '');
      }
      setNotice(agent.snippet || greeting.trim() ? 'Fragmento listo. Pégalo en tu web.' : 'El agente no devolvió el fragmento.');
    } catch (requestError) {
      setSnippet('');
      setError(detailMessage(requestError, 'No se ha podido crear el agente.'));
    } finally {
      setBusy(false);
    }
  };

  const saveOwnedNumber = async () => {
    const number = ownedNumber.trim();
    if (!projectId || !number) {
      setError('Escribe el número que ya tienes, en formato internacional.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.put(`/projects/${encodeURIComponent(projectId)}/modules/voz`, {
        enabled: true,
        settings: {
          inbound_number: number,
          ...(greeting.trim() ? { greeting: greeting.trim() } : {}),
        },
      });
      setNotice('Número guardado. No se ha dado de alta una línea nueva.');
    } catch (requestError) {
      setError(detailMessage(requestError, 'No se ha podido guardar el número.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout title="Agente de voz">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <div>
          <p className="dash-kicker text-[11px] font-semibold">AGENTE DE VOZ</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white">Instalar la voz en una web</h2>
          <p className="mt-2 text-sm leading-6 text-[#b4bec8]">
            La voz canónica de este panel es el agente embebible: se pega en una web que ya existe.
            Las llamadas de teléfono no se contratan aquí.
          </p>
        </div>

        <section className={panel}>
          <ProjectPicker projects={projects} projectId={projectId} onChange={setProjectId} />
          <label className="mt-4 block text-sm text-zinc-300" htmlFor="voice-host">
            Web donde sonará
            <span className="mt-2 flex h-11 items-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <span className="border-r border-white/10 px-3 text-zinc-400">https://</span>
              <input
                id="voice-host"
                data-testid="voice-host"
                value={host}
                placeholder="tunegocio.com"
                onChange={(event) => setHost(event.target.value.replace(/^https?:\/\//i, ''))}
                className="h-full w-full bg-transparent px-3 text-white outline-none"
              />
            </span>
          </label>
          <label className="mt-4 block text-sm text-zinc-300" htmlFor="voice-greeting">
            Saludo
            <textarea
              id="voice-greeting"
              data-testid="voice-greeting"
              value={greeting}
              onChange={(event) => setGreeting(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
            />
          </label>
          <button
            type="button"
            data-testid="voice-activate"
            onClick={activateOnSite}
            disabled={busy}
            className="mt-4 inline-flex h-10 items-center rounded-full bg-[linear-gradient(95deg,#fde68a,#fbbf24,#f9a8d4,#67e8f9)] px-4 text-sm font-extrabold text-[#04141a] disabled:opacity-50"
          >
            Activar en la web
          </button>
          {snippet ? (
            <pre className="mt-4 max-h-40 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-cyan-50">
              <code data-testid="voice-snippet">{snippet}</code>
            </pre>
          ) : null}
        </section>

        <section className={`${panel} opacity-80`}>
          <h3 className="text-sm font-semibold text-white">Tipo de voz</h3>
          <p className="mt-2 text-sm text-zinc-400">No se puede elegir. Lo fija el servidor.</p>
          <h3 className="mt-4 text-sm font-semibold text-white">Llamada de prueba</h3>
          <p className="mt-2 text-sm text-zinc-400">
            No hay una llamada de demostración en este panel. La voz se oye en tu web con el fragmento.
          </p>
          <button type="button" disabled className="mt-3 cursor-not-allowed rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-500">
            Llamada de prueba no disponible
          </button>
        </section>

        <section className={panel}>
          <h3 className="text-sm font-semibold text-white">Número que ya tienes</h3>
          <p className="mt-2 text-sm text-zinc-400">
            No damos de alta números. Si ya tienes uno en formato internacional, se puede guardar para las llamadas entrantes.
          </p>
          <input
            data-testid="voice-owned-number"
            value={ownedNumber}
            onChange={(event) => setOwnedNumber(event.target.value)}
            placeholder="+34600111222"
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
          />
          <button
            type="button"
            data-testid="voice-save-number"
            onClick={saveOwnedNumber}
            disabled={busy}
            className="mt-3 rounded-full border border-[#67e8f9]/40 px-4 py-2 text-sm text-[#67e8f9] disabled:opacity-50"
          >
            Guardar número existente
          </button>
        </section>

        {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
        {notice ? <p role="status" className="text-sm text-cyan-100">{notice}</p> : null}
      </div>
    </DashboardLayout>
  );
};

export default VoiceAgentPage;
