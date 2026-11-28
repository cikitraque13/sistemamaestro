import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../../lib/apiClient';

const attentionUrl = (projectId, suffix = '') => (
  `${API_BASE}/public/attention/${encodeURIComponent(projectId)}${suffix}`
);

async function readBody(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data && data.detail;
    const message = detail && typeof detail.message === 'string'
      ? detail.message
      : 'No se ha podido completar la operación.';
    const error = new Error(message);
    error.code = detail && detail.code;
    throw error;
  }
  return data;
}

const AttentionPage = () => {
  const { projectId = '' } = useParams();
  const [status, setStatus] = useState('loading');
  const [desk, setDesk] = useState(null);
  const [notice, setNotice] = useState('');
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [turns, setTurns] = useState([]);
  const [sending, setSending] = useState(false);
  const [day, setDay] = useState('');
  const [slots, setSlots] = useState(null);
  const [slot, setSlot] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [booking, setBooking] = useState(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setDesk(null);
    setNotice('');
    fetch(attentionUrl(projectId))
      .then(readBody)
      .then((data) => {
        if (!cancelled) {
          setDesk(data);
          setStatus('ready');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setNotice(error.message || 'No está disponible.');
          setStatus('missing');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    setNotice('');
    try {
      const data = await readBody(await fetch(attentionUrl(projectId, '/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message: text,
          ...(conversationId ? { conversation_id: conversationId } : {}),
        }),
      }));
      setConversationId(data.conversation_id || conversationId);
      setTurns((current) => [...current, { role: 'user', text }, { role: 'assistant', text: data.reply || '' }]);
      setMessage('');
      if (data.booking_id) setBooking({ booking_id: data.booking_id, slot_start: '' });
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSending(false);
    }
  };

  const loadSlots = async (event) => {
    event.preventDefault();
    if (!day || working) return;
    setWorking(true);
    setNotice('');
    setSlots(null);
    setSlot('');
    setBooking(null);
    try {
      const data = await readBody(await fetch(
        `${attentionUrl(projectId, '/availability')}?day=${encodeURIComponent(day)}`,
      ));
      setSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setWorking(false);
    }
  };

  const reserve = async (event) => {
    event.preventDefault();
    if (!slot || working) return;
    setWorking(true);
    setNotice('');
    try {
      const data = await readBody(await fetch(attentionUrl(projectId, '/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ slot_start: slot, customer_name: name, contact }),
      }));
      if (data && data.status === 'confirmed' && data.booking_id) {
        setBooking(data);
      } else {
        setNotice('No se ha podido reservar la cita.');
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setWorking(false);
    }
  };

  const title = (desk && desk.title) || 'Atención';
  const chatOn = Boolean(desk && desk.chat);
  const citasOn = Boolean(desk && desk.citas);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F3F4F6]">
      <main className="max-w-xl mx-auto px-6 py-12">
        <p className="text-sm text-[#A3A3A3]">Habla con nosotros · Reserva cita</p>
        <h1 className="text-3xl font-light mt-2 mb-6">{title}</h1>
        {status === 'loading' ? <p className="text-[#A3A3A3]">Cargando…</p> : null}
        {status === 'missing' ? <p>{notice || 'Esta página no está publicada.'}</p> : null}
        {status === 'ready' && !chatOn && !citasOn ? (
          <p>El asistente no está disponible ahora mismo.</p>
        ) : null}
        {status === 'ready' && chatOn ? (
          <section className="mb-10">
            <h2 className="text-xl font-light mb-3">Chat</h2>
            <div className="space-y-3 mb-4">
              {turns.map((turn, index) => (
                <p key={`${turn.role}-${index}`} className={turn.role === 'user' ? 'text-white' : 'text-[#D1D5DB]'}>
                  {turn.text}
                </p>
              ))}
            </div>
            <form onSubmit={sendMessage} className="space-y-3">
              <label className="block text-sm text-[#A3A3A3]" htmlFor="attention-message">Mensaje</label>
              <textarea
                id="attention-message"
                className="w-full bg-[#171717] border border-[#262626] rounded-md p-3 text-white"
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <button
                type="submit"
                className="bg-white text-black rounded-md px-4 py-2"
                disabled={sending || !message.trim()}
              >
                Enviar
              </button>
            </form>
          </section>
        ) : null}
        {status === 'ready' && citasOn ? (
          <section>
            <h2 className="text-xl font-light mb-3">Reserva cita</h2>
            <form onSubmit={loadSlots} className="space-y-3 mb-4">
              <label className="block text-sm text-[#A3A3A3]" htmlFor="attention-day">Día</label>
              <input
                id="attention-day"
                type="date"
                className="bg-[#171717] border border-[#262626] rounded-md p-3 text-white"
                value={day}
                onChange={(event) => setDay(event.target.value)}
              />
              <button type="submit" className="bg-white text-black rounded-md px-4 py-2" disabled={working || !day}>
                Ver huecos
              </button>
            </form>
            {slots && slots.length === 0 ? <p>Ese día no hay huecos libres.</p> : null}
            {slots && slots.length > 0 ? (
              <form onSubmit={reserve} className="space-y-3">
                <fieldset className="space-y-2">
                  <legend className="text-sm text-[#A3A3A3]">Horario</legend>
                  {slots.map((item) => (
                    <label key={item} className="flex gap-2 items-center">
                      <input
                        type="radio"
                        name="slot"
                        value={item}
                        checked={slot === item}
                        onChange={() => setSlot(item)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </fieldset>
                <label className="block text-sm text-[#A3A3A3]" htmlFor="attention-name">Nombre</label>
                <input
                  id="attention-name"
                  className="w-full bg-[#171717] border border-[#262626] rounded-md p-3 text-white"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <label className="block text-sm text-[#A3A3A3]" htmlFor="attention-contact">Teléfono o correo</label>
                <input
                  id="attention-contact"
                  className="w-full bg-[#171717] border border-[#262626] rounded-md p-3 text-white"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                />
                <button type="submit" className="bg-white text-black rounded-md px-4 py-2" disabled={working || !slot}>
                  Reservar cita
                </button>
              </form>
            ) : null}
            {booking && booking.booking_id ? <p>Cita reservada.</p> : null}
          </section>
        ) : null}
        {status === 'ready' && !citasOn && chatOn ? <p>La reserva online no está activada.</p> : null}
        {status === 'ready' && notice ? <p className="mt-4 text-[#FCA5A5]">{notice}</p> : null}
      </main>
    </div>
  );
};

export default AttentionPage;
