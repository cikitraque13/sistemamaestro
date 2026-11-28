import React, { useEffect, useState } from 'react';

import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../lib/apiClient';
import { loadOwnerProjects } from '../builder/components/BuilderProjectSelect';
import { projectHumanName } from '../builder/workspace/projectLabel';
import { resolveActiveProject } from './dashboardModel';

const STATUS_LABELS = {
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
};

const formatSlot = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const readError = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail && typeof detail.message === 'string' && detail.message.trim()) return detail.message;
  return 'No se han podido leer las reservas.';
};

function BookingsPanel({ project }) {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!project?.project_id) return undefined;
    let live = true;
    api
      .get(`/projects/${encodeURIComponent(project.project_id)}/bookings`)
      .then((response) => {
        if (!live) return;
        const rows = Array.isArray(response?.data?.bookings) ? response.data.bookings : [];
        setBookings(rows);
      })
      .catch((requestError) => {
        if (!live) return;
        setBookings([]);
        setError(readError(requestError));
      });
    return () => {
      live = false;
    };
  }, [project?.project_id]);

  if (!project?.project_id) {
    return <p className="text-sm text-zinc-400">Abre un proyecto para ver sus reservas.</p>;
  }

  return (
    <div data-testid="agent-bookings">
      <p className="text-xs text-zinc-500">{projectHumanName(project)}</p>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {bookings == null ? (
        <p className="mt-3 text-sm text-zinc-400">Cargando…</p>
      ) : bookings.length === 0 && !error ? (
        <p className="mt-3 text-sm text-zinc-400">Sin reservas</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {bookings.map((booking) => (
            <li
              key={booking.booking_id}
              className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-zinc-200"
            >
              <p className="font-medium text-white">{booking.customer_name || 'Sin nombre'}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {[formatSlot(booking.slot_start), STATUS_LABELS[booking.status] || booking.status]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {booking.contact ? <p className="mt-1 text-xs text-zinc-500">{booking.contact}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const AgentModulePage = ({ title }) => {
  const [tab, setTab] = useState('modulo');
  const [project, setProject] = useState(null);

  useEffect(() => {
    let live = true;
    loadOwnerProjects()
      .then((items) => {
        if (live) setProject(resolveActiveProject(items));
      })
      .catch(() => {
        if (live) setProject(null);
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <DashboardLayout title={title}>
      <section className="mx-auto max-w-2xl">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            aria-pressed={tab === 'modulo'}
            onClick={() => setTab('modulo')}
            className={`rounded-full px-3 py-1.5 text-sm ${
              tab === 'modulo' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {title}
          </button>
          <button
            type="button"
            data-testid="agent-reservas-tab"
            aria-pressed={tab === 'reservas'}
            onClick={() => setTab('reservas')}
            className={`rounded-full px-3 py-1.5 text-sm ${
              tab === 'reservas' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Reservas
          </button>
        </div>

        {tab === 'reservas' ? (
          <BookingsPanel project={project} />
        ) : (
          <p className="text-sm text-zinc-400">Próximamente</p>
        )}
      </section>
    </DashboardLayout>
  );
};

export default AgentModulePage;
