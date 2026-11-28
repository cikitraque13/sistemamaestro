import React, { useMemo } from 'react';

const messageSets = {
  create: [
    { id: 'u1', role: 'user', text: 'Quiero que el hero sea más claro y que el CTA conecte mejor con el valor.' },
    { id: 'a1', role: 'assistant', text: 'He reforzado promesa, estructura del primer fold y continuidad del CTA principal.' },
  ],
  improve: [
    { id: 'u1', role: 'user', text: 'La web se ve bien, pero no convierte. Quiero saber qué debería tocar primero.' },
    { id: 'a1', role: 'assistant', text: 'La prioridad es claridad de mensaje, estructura del hero y continuidad comercial.' },
  ],
  scale: [
    { id: 'u1', role: 'user', text: 'Quiero automatizar más partes del proceso sin perder control.' },
    { id: 'a1', role: 'assistant', text: 'Estoy ordenando rutas, puntos críticos y bloques que conviene automatizar primero.' },
  ],
};

const BuilderChatDock = ({ activeIntent, projectLabel }) => {
  const messages = useMemo(
    () => messageSets[activeIntent] || messageSets.create,
    [activeIntent]
  );

  return (
    <div className="rounded-[28px] border border-white/10 bg-black/35 p-4 shadow-[0_0_30px_rgba(0,0,0,0.25)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Chat de trabajo
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-300">{projectLabel}</p>
        </div>

        <div className="rounded-full border border-zinc-700 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
          Activo
        </div>
      </div>

      <div className="space-y-3">
        {messages.map((message) => {
          const isAssistant = message.role === 'assistant';

          return (
            <div
              key={message.id}
              className={`max-w-[92%] rounded-2xl border px-4 py-3 text-sm leading-6 ${
                isAssistant
                  ? 'ml-auto border-cyan-500/20 bg-cyan-500/10 text-zinc-100'
                  : 'border-zinc-800 bg-zinc-950/90 text-zinc-300'
              }`}
            >
              {message.text}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/40 p-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Corrige, afina o pide un nuevo enfoque..."
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
          />
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-gradient-to-r from-amber-200 via-white to-amber-100 px-4 py-2 text-xs font-semibold text-black transition hover:opacity-95"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuilderChatDock;