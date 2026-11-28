import React, { useEffect, useState } from 'react';

import { api } from '../../../lib/apiClient';

const inputClass = 'mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/50';
const buttonClass = 'rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60';

const statusOf = (error) => error?.response?.status;

const detailMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (detail && typeof detail.message === 'string' && detail.message) return detail.message;
  return fallback;
};

export default function EmbedInstallStep({ projectId = '' }) {
  const [agent, setAgent] = useState(null);
  const [missing, setMissing] = useState(false);
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(Boolean(projectId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return undefined;
    }
    let live = true;
    setLoading(true);
    setError('');
    api.get('/embed/agents', { params: { project_id: projectId } })
      .then((response) => {
        if (!live) return;
        const next = response?.data || null;
        setAgent(next);
        setOrigin((next?.allowed_origins && next.allowed_origins[0]) || '');
        setMissing(false);
      })
      .catch((requestError) => {
        if (!live) return;
        if (statusOf(requestError) === 404) {
          setAgent(null);
          setMissing(true);
          return;
        }
        setError(detailMessage(requestError, 'No se ha podido leer el agente.'));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const applyAgent = (next, nextNotice = '') => {
    setAgent(next);
    setMissing(false);
    setOrigin((next?.allowed_origins && next.allowed_origins[0]) || origin);
    setNotice(nextNotice);
    setCopied(false);
    setError('');
  };

  const createAgent = async () => {
    const domain = origin.trim();
    if (!domain) {
      setError('Escribe el dominio completo, por ejemplo https://tuempresa.com.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await api.post('/embed/agents', {
        project_id: projectId,
        allowed_origins: [domain],
      });
      applyAgent(response.data, 'Fragmento listo. Pégalo en tu web.');
    } catch (requestError) {
      setError(detailMessage(requestError, 'No se ha podido crear el agente.'));
    } finally {
      setBusy(false);
    }
  };

  const saveOrigin = async () => {
    const domain = origin.trim();
    if (!agent?.agent_id || !domain) {
      setError('Escribe el dominio completo, por ejemplo https://tuempresa.com.');
      return;
    }
    setBusy(true);
    try {
      const response = await api.patch(`/embed/agents/${agent.agent_id}`, {
        allowed_origins: [domain],
      });
      applyAgent(response.data, 'Dominio guardado.');
    } catch (requestError) {
      setError(detailMessage(requestError, 'No se ha podido guardar el dominio.'));
    } finally {
      setBusy(false);
    }
  };

  const rotateKey = async () => {
    if (!agent?.agent_id) return;
    setBusy(true);
    try {
      const response = await api.post(`/embed/agents/${agent.agent_id}/rotate`);
      applyAgent(response.data, 'Clave nueva. La anterior ya no funciona.');
    } catch (requestError) {
      setError(detailMessage(requestError, 'No se ha podido cambiar la clave.'));
    } finally {
      setBusy(false);
    }
  };

  const revokeAgent = async () => {
    if (!agent?.agent_id) return;
    setBusy(true);
    try {
      const response = await api.post(`/embed/agents/${agent.agent_id}/revoke`);
      applyAgent(response.data, 'Agente desactivado. El fragmento deja de funcionar.');
    } catch (requestError) {
      setError(detailMessage(requestError, 'No se ha podido desactivar el agente.'));
    } finally {
      setBusy(false);
    }
  };

  const copySnippet = async () => {
    const snippet = agent?.snippet || '';
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setError('');
    } catch {
      setCopied(false);
      setError('No se ha podido copiar. Selecciona el fragmento y cópialo a mano.');
    }
  };

  if (!projectId) {
    return <p className="p-6 text-sm text-zinc-300">Abre un proyecto para instalar el agente.</p>;
  }

  return (
    <section data-testid="embed-install-step" className="h-full overflow-auto bg-[#090b12] p-6 text-zinc-100">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Ya tienes web</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Instalar en tu web</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300" data-testid="embed-instructions">
        Copia el fragmento y pégalo en el HTML de tu página, justo antes de <code>{'</body>'}</code>.
        El visitante verá el agente de voz de este proyecto. Este agente habla en tu página.
        No conecta WhatsApp, no reserva citas y no atiende llamadas.
      </p>

      {loading ? <p className="mt-6 text-sm text-zinc-400">Cargando el agente…</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-amber-100">{error}</p> : null}
      {notice ? <p role="status" className="mt-4 text-sm text-cyan-100">{notice}</p> : null}

      <label className="mt-6 block max-w-xl text-sm text-zinc-200" htmlFor="embed-origin">
        Dominio permitido
        <input
          id="embed-origin"
          data-testid="embed-origin"
          className={inputClass}
          value={origin}
          placeholder="https://tuempresa.com"
          onChange={(event) => setOrigin(event.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
      </label>
      <p className="mt-2 max-w-xl text-xs leading-5 text-zinc-500">
        El agente solo responde desde ese dominio. Escribe el origen completo, con https.
      </p>

      {missing ? (
        <button type="button" className={`${buttonClass} mt-4`} data-testid="embed-create" onClick={createAgent} disabled={busy}>
          Generar fragmento
        </button>
      ) : null}

      {agent?.active && agent.snippet ? (
        <div className="mt-6 max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Fragmento</p>
            <button type="button" className={buttonClass} data-testid="embed-copy" onClick={copySnippet}>
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <pre className="mt-3 overflow-auto rounded-2xl border border-white/10 bg-black/50 p-4 text-xs leading-5 text-cyan-50">
            <code data-testid="embed-snippet">{agent.snippet}</code>
          </pre>
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            La clave empieza por pk_ y es pública. No es un secreto: la protege el dominio permitido.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={buttonClass} data-testid="embed-save-origin" onClick={saveOrigin} disabled={busy}>
              Guardar dominio
            </button>
            <button type="button" className={buttonClass} onClick={rotateKey} disabled={busy}>
              Nueva clave
            </button>
            <button type="button" className={buttonClass} onClick={revokeAgent} disabled={busy}>
              Desactivar
            </button>
          </div>
        </div>
      ) : null}

      {agent && agent.active === false ? (
        <div className="mt-6">
          <p className="text-sm text-zinc-300">El agente está desactivado. El fragmento ya no abre sesiones.</p>
          <button type="button" className={`${buttonClass} mt-4`} onClick={createAgent} disabled={busy}>
            Generar otro fragmento
          </button>
        </div>
      ) : null}
    </section>
  );
}
