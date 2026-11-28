import React from 'react';

import { targetOrPending, validateSlug } from './builderPublish';

const fieldClass = 'mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/50';
const buttonClass = 'rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50';

function RecordValue({ value }) {
  const shown = targetOrPending(value);
  return (
    <span className={shown.pending ? 'text-amber-100' : 'font-mono text-cyan-100'}>{shown.value}</span>
  );
}

function DnsInstructions({ instructions, cnameTarget, apexTarget }) {
  if (!instructions) {
    return (
      <div className="mt-4 space-y-2 text-sm leading-6 text-zinc-300">
        <p>Cuando guardes el dominio verás el nombre de cada registro. Los destinos salen de la configuración.</p>
        <p>CNAME: <RecordValue value={cnameTarget} /></p>
        <p>ALIAS o A (raíz): <RecordValue value={apexTarget} /></p>
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-200">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Registros DNS</p>
      <p>TXT en <span className="font-mono text-cyan-100">{instructions.txt?.host}</span>: <span className="font-mono text-cyan-100">{instructions.txt?.value}</span></p>
      <p>CNAME de <span className="font-mono text-cyan-100">{instructions.cname?.host}</span> hacia <RecordValue value={instructions.cname?.value} /></p>
      {instructions.apex?.applies ? (
        <p>ALIAS o A de <span className="font-mono text-cyan-100">{instructions.apex?.host}</span> hacia <RecordValue value={instructions.apex?.value} /></p>
      ) : (
        <p>Si este nombre es un subdominio, basta el CNAME. No adivinamos la raíz de la zona.</p>
      )}
      <p>{instructions.ssl}</p>
    </div>
  );
}

export default function BuilderPublishSteps({
  publishLanding = false,
  customDomain = false,
  hasPreview = false,
  busy = false,
  pending = false,
  slug = '',
  domain = '',
  notice = '',
  publication = null,
  onSlugChange = () => {},
  onDomainChange = () => {},
  onPublish = () => {},
  onRepublish = () => {},
  onUnpublish = () => {},
  onSaveDomain = () => {},
  onVerifyDomain = () => {},
  scoreAllowed = true,
}) {
  if (!publishLanding || !hasPreview) return null;

  const check = validateSlug(slug);
  const published = publication?.status === 'published';
  const hasPublication = Boolean(publication?.status && publication.status !== 'none');
  const locked = busy || pending;
  const base = String(publication?.baseDomain || '').trim();
  const address = check.ok && base ? `https://${check.slug}.${base}` : '';
  const custom = publication?.customDomain || null;

  return (
    <div className="border-t border-white/10 bg-[#08070D] p-4" data-builder-steps="publish">
      <section aria-label="Publicar" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Paso final</p>
        <h2 className="mt-1 text-lg font-semibold text-white">Publicar</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-300">
          Elige el nombre y publica la última versión guardada con un clic.
          La preview sigue siendo tuya. Esta acción no toca el DNS ni Railway, y no descuenta gemas.
        </p>
        <label className="mt-4 block text-sm text-zinc-200" htmlFor="publish-slug">
          Nombre del subdominio
          <input
            id="publish-slug"
            value={slug}
            onChange={(event) => onSlugChange(event.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            className={fieldClass}
            placeholder="nombre"
          />
        </label>
        {slug && !check.ok ? <p role="alert" className="mt-2 text-sm text-amber-100">{check.message}</p> : null}
        {address ? <p className="mt-2 text-sm text-zinc-300">La dirección será {address}.</p> : null}
        {!base ? (
          <p className="mt-2 text-sm text-amber-100">
            El dominio base no está configurado. Puedes reservar el nombre, pero todavía no hay una dirección pública real.
          </p>
        ) : null}
        {publication?.message ? <p className="mt-3 text-sm leading-6 text-zinc-200">{publication.message}</p> : null}
        {publication?.url ? <p className="mt-2 text-sm text-cyan-100">{publication.url}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={buttonClass} disabled={locked || !check.ok || !scoreAllowed} onClick={() => onPublish(check.slug)}>
            Publicar
          </button>
          {!scoreAllowed ? <p className="mt-2 text-sm text-amber-100">La versión no ha superado la evaluación (12/20). No se ha publicado.</p> : null}
          {publication?.status && publication.status !== 'none' ? (
            <button type="button" className={buttonClass} disabled={locked || !publication?.slug} onClick={onRepublish}>
              Volver a publicar
            </button>
          ) : null}
          {published ? (
            <button type="button" className={buttonClass} disabled={locked} onClick={onUnpublish}>
              Despublicar
            </button>
          ) : null}
        </div>
        {busy ? <p className="mt-3 text-sm text-amber-100">Espera a que termine la versión en curso.</p> : null}
      </section>

      {customDomain ? (
        <section aria-label="Dominio propio" className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Opcional, después de publicar</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Dominio propio</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Cuando quieras, apunta un dominio tuyo. Sistema Maestro no crea los registros:
            los creas tú en tu DNS y luego pulsas Verificar.
          </p>
          {!hasPublication ? (
            <p className="mt-2 text-sm text-amber-100">Primero publica la landing. El dominio se apoya en esa copia.</p>
          ) : null}
          <label className="mt-4 block text-sm text-zinc-200" htmlFor="custom-domain">
            Tu dominio
            <input
              id="custom-domain"
              value={domain}
              onChange={(event) => onDomainChange(event.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              className={fieldClass}
              placeholder="cliente.com"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={buttonClass} disabled={locked || !hasPublication || !String(domain || '').trim()} onClick={() => onSaveDomain(domain)}>
              Guardar dominio
            </button>
            <button type="button" className={buttonClass} disabled={locked || !hasPublication || !custom?.host} onClick={onVerifyDomain}>
              Verificar
            </button>
          </div>
          <DnsInstructions
            instructions={custom?.instructions}
            cnameTarget={publication?.cnameTarget}
            apexTarget={publication?.apexTarget}
          />
          <p className="mt-4 text-sm font-semibold text-amber-100">Pendiente de activación por Sistema Maestro</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {custom?.instructions?.ssl || publication?.ssl || 'El certificado lo emite el borde de hosting (dominios personalizados de Railway). Esta pantalla no da de alta el dominio.'}
          </p>
          {custom?.status === 'verified' ? (
            <p className="mt-2 text-sm text-cyan-100">El TXT coincide. El dominio está verificado. Falta activarlo en el hosting.</p>
          ) : null}
        </section>
      ) : null}

      {notice ? <p role="status" className="mt-3 text-sm text-zinc-200">{notice}</p> : null}
    </div>
  );
}
