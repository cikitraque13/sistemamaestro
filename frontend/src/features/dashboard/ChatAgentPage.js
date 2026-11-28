import React, { useEffect, useState } from 'react';

import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../lib/apiClient';
import { loadOwnerProjects } from '../builder/components/BuilderProjectSelect';
import { projectHumanName } from '../builder/workspace/projectLabel';
import { resolveActiveProject } from './dashboardModel';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const detailMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail && typeof detail.message === 'string' && detail.message.trim()) return detail.message;
  return fallback;
};

const panel = 'rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,19,26,0.92),rgba(10,14,19,0.92))] p-5';

const fullDay = () => Object.fromEntries(DAYS.map((day) => [day, [['00:00', '23:59']]]));

const ChatAgentPage = () => {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [brief, setBrief] = useState('');
  const [widgetKey, setWidgetKey] = useState('');
  const [draft, setDraft] = useState('');
  const [reply, setReply] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [allDay, setAllDay] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadProject = async (id) => {
    const match = projects.find((item) => item.project_id === id);
    setBrief(match?.input_content || '');
    setWidgetKey('');
    setReply('');
    setBookings([]);
    if (!id) return;
    try {
      const modules = await api.get(`/projects/${encodeURIComponent(id)}/modules`);
      const chat = modules?.data?.modules?.chat;
      if (chat?.settings?.widget_key) setWidgetKey(chat.settings.widget_key);
    } catch (requestError) {
      setError(detailMessage(requestError, 'No se ha podido leer el agente.'));
    }
    try {
      const listed = await api.get(`/projects/${encodeURIComponent(id)}/bookings`);
      setBookings(Array.isArray(listed?.data?.bookings) ? listed.data.bookings : []);
    } catch (requestError) {
      setBookings([]);
      if (requestError?.response?.status !== 503) {
        setError(detailMessage(requestError, 'No se han podido leer las reservas.'));
      }
    }
  };

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

  useEffect(() => {
    if (projectId) loadProject(projectId);
  }, [projectId, projects]);

  const activateChat = async () => {
    if (!projectId) return;
    setBusy(true);
    setError('');
    try {
      const response = await api.put(`/projects/${encodeURIComponent(projectId)}/modules/chat`, {
        enabled: true,
        settings: {},
      });
      const key = response?.data?.modules?.chat?.settings?.widget_key || '';
      setWidgetKey(key);
    } catch (requestError) {
      setError(detailMessage(requestError, 'No se ha podido activar el chat.'));
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    const message = draft.trim();
    if (!projectId || !message) return;
    if (!widgetKey) {
      setError('Activa el chat antes de probarlo.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await api.post(
        `/agent/chat/${encodeURIComponent(projectId)}/messages`,
        { message, ...(conversationId ? { conversation_id: conversationId } : {}) },
        { headers: { 'X-Widget-Key': widgetKey } },
      );
      setReply(response?.data?.reply || response?.data?.text || '');
      if (response?.data?.conversation_id) setConversationId(response.data.conversation_id);
      setDraft('');
    } catch (requestError) {
      setReply('');
      setError(detailMessage(requestError, 'El agente no ha respondido.'));
    } finally {
      setBusy(false);
    }
  };

  const saveHours = async (nextAllDay) => {
    if (!projectId) return;
    setAllDay(nextAllDay);
    setBusy(true);
    setError('');
    try {
      await api.put(`/projects/${encodeURIComponent(projectId)}/modules/citas`, {
        enabled: true,
        settings: {
          timezone: 'Europe/Madrid',
          slot_minutes: 30,
          reminder_hours_before: 24,
          weekly_hours: nextAllDay ? fullDay() : {},
        },
      });
    } catch (requestError) {
      setError(detailMessage(requestError, 'No se ha podido guardar la disponibilidad.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout title="Agente de chat">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <div>
          <p className="dash-kicker text-[11px] font-semibold">AGENTE DE CHAT</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white">Chat del proyecto</h2>
          <p className="mt-2 text-sm leading-6 text-[#b4bec8]">
            El agente usa el texto de este proyecto. Las reservas viven en esta misma página.
          </p>
        </div>

        <section className={panel}>
          <label className="block text-sm text-zinc-300">
            Proyecto
            <select
              data-testid="chat-project"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              {projects.map((project) => (
                <option key={project.project_id} value={project.project_id}>
                  {projectHumanName(project)}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-zinc-500">Texto del proyecto</p>
          <p data-testid="chat-brief" className="mt-2 text-sm leading-6 text-zinc-200">
            {brief || 'Este proyecto no tiene texto.'}
          </p>
          <button
            type="button"
            data-testid="chat-activate"
            onClick={activateChat}
            disabled={busy || !projectId}
            className="mt-4 rounded-full bg-[linear-gradient(95deg,#fde68a,#fbbf24,#67e8f9)] px-4 py-2 text-sm font-extrabold text-[#04141a] disabled:opacity-50"
          >
            Activar chat
          </button>
        </section>

        <section className={panel}>
          <h3 className="text-sm font-semibold text-white">Probar el agente</h3>
          <textarea
            data-testid="chat-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
          />
          <button
            type="button"
            data-testid="chat-send"
            onClick={sendTest}
            disabled={busy}
            className="mt-3 rounded-full border border-[#67e8f9]/40 px-4 py-2 text-sm text-[#67e8f9] disabled:opacity-50"
          >
            Enviar prueba
          </button>
          {reply ? <p data-testid="chat-reply" className="mt-3 text-sm text-zinc-100">{reply}</p> : null}
        </section>

        <section className={panel}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Reservas</h3>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                data-testid="chat-all-day"
                type="checkbox"
                checked={allDay}
                onChange={(event) => saveHours(event.target.checked)}
              />
              Disponible todo el día
            </label>
          </div>
          <p className="mt-2 text-xs text-zinc-500">El recordatorio previsto es de 24 horas. WhatsApp no está conectado.</p>
          {bookings.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">Sin reservas</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {bookings.map((booking) => (
                <li key={booking.booking_id} className="text-sm text-zinc-200">
                  {booking.customer_name} · {booking.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={panel}>
          <h3 className="text-sm font-semibold text-white">WhatsApp</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Conectar WhatsApp está pendiente. Esta cuenta no tiene credenciales de WhatsApp que el panel pueda guardar.
          </p>
          <button type="button" disabled data-testid="chat-whatsapp" className="mt-3 cursor-not-allowed rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-500">
            Conectar WhatsApp
          </button>
        </section>

        {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
      </div>
    </DashboardLayout>
  );
};

export default ChatAgentPage;
