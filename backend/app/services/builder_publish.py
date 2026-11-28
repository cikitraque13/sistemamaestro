"""Publish a saved landing without touching DNS or the hosting edge.

The product flags default to off. An admin can use the steps the same way
they can open the Builder while BUILDER_ENABLED is off. Nothing here creates
a Railway domain, writes a DNS record, or charges gems.

TODO(founder): gem charge for publishing. Do not add it until you say so.
TODO(founder): DomainActivationAdapter.request_attachment must stay a no-network
stub until you approve the Railway custom-domain call.
"""
import copy
import logging
import os
import re
import secrets
from dataclasses import dataclass
from html import escape

from starlette.responses import HTMLResponse

logger = logging.getLogger(__name__)

PUBLISHED_SCHEMA = "sm.builder.published.v1"
_ENABLED = {"1", "true", "yes", "on"}

RESERVED_SLUGS = frozenset({
    "www", "api", "app", "admin", "dashboard", "mail",
    "ftp", "smtp", "imap", "pop", "pop3", "ns", "ns1", "ns2", "dns",
    "cdn", "static", "assets", "blog", "status", "help", "support",
    "docs", "doc", "dev", "staging", "stage", "test", "beta",
    "preview", "auth", "login", "logout", "account", "accounts", "billing",
    "pay", "payments", "stripe", "webhook", "webhooks", "mx", "mx1", "mx2",
    "email", "newsletter", "nova", "builder", "public", "health", "files",
    "media", "img", "images", "css", "js", "localhost", "root",
    "sistemamaestro", "sistema", "maestro", "home", "about", "legal",
    "privacy", "terms", "security", "monitor", "metrics", "grafana",
    "autoconfig", "autodiscover", "cpanel", "webmail", "git", "ssh", "sftp",
    "vpn", "internal", "intranet", "portal", "studio", "embed", "agent",
    "agents", "gems", "gema", "gemas", "www2", "m", "mobile", "origin",
    "edge", "railway",
})

_SLUG_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$")
_DOMAIN_RE = re.compile(
    r"^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$"
)
_UNSAFE_HTML = re.compile(
    r"<\s*script\b|javascript\s*:|\son[a-z]+\s*=",
    re.IGNORECASE,
)

PREVIEW_CSP = (
    "default-src 'none'; style-src 'unsafe-inline'; img-src data:; "
    "base-uri 'none'; form-action 'none'"
)
SERVE_CSP = PREVIEW_CSP + "; script-src 'none'; frame-ancestors 'none'; object-src 'none'"
SAFE_HEADERS = {
    "Content-Security-Policy": SERVE_CSP,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Cache-Control": "no-store",
}

NOT_FOUND_HTML = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content=\"""" + SERVE_CSP + """">
<title>Página no publicada</title>
<style>body{margin:0;background:#090b12;color:#f5f5f7;font:18px/1.6 system-ui,sans-serif}main{max-width:40rem;margin:auto;padding:72px 24px}p{color:#c9ccd5}</style>
</head>
<body><main>
<h1>Esta página no está publicada</h1>
<p>No hay una landing de Sistema Maestro en esta dirección.</p>
</main></body>
</html>
"""

UNAVAILABLE_HTML = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Página no disponible</title>
<meta http-equiv="Content-Security-Policy" content=\"""" + SERVE_CSP + """">
</head>
<body><main>
<h1>No se ha podido abrir esta página</h1>
<p>Inténtalo de nuevo dentro de un momento.</p>
</main></body>
</html>
"""

ACTIVATION_PENDING = "Pendiente de activación por Sistema Maestro"
SSL_NOTE = (
    "El certificado lo emite el borde de hosting (dominios personalizados de Railway). "
    "Esta acción no lo solicita."
)


class PublishError(Exception):
    def __init__(self, code: str, status: int, message: str):
        super().__init__(message)
        self.code = code
        self.status = status
        self.message = message


class DomainActivationAdapter:
    """Seam for the hosting edge. It does not call Railway.

    TODO(founder): when you approve it, attach the host on the Railway service
    and let that edge issue the certificate. Do not add an HTTP client here
    before that OK.
    """

    async def request_attachment(self, host: str) -> dict:
        return {
            "ok": False,
            "status": "pending_sistema_maestro",
            "message": ACTIVATION_PENDING,
            "host": host,
        }


domain_activation = DomainActivationAdapter()


def _flag(name: str) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return False
    return raw.strip().lower() in _ENABLED


def publish_landing_enabled() -> bool:
    """Product switch. BUILDER_PUBLISH_ENABLED is the earlier name of the same switch."""
    return _flag("PUBLISH_LANDING_ENABLED") or _flag("BUILDER_PUBLISH_ENABLED")


def custom_domain_enabled() -> bool:
    return _flag("CUSTOM_DOMAIN_ENABLED")


def _user_is_admin(user) -> bool:
    from backend.app.core.builder_access import user_is_admin

    return user_is_admin(user)


def user_may_publish(user) -> bool:
    """Admins can open publish while PUBLISH_LANDING_ENABLED is off.

    That bypass does not skip the score. publish_project still refuses a
    version that missed the evaluation, for an admin and for anyone else.
    This route does not charge gems.
    """
    return publish_landing_enabled() or _user_is_admin(user)


def user_may_custom_domain(user) -> bool:
    return custom_domain_enabled() or _user_is_admin(user)


@dataclass(frozen=True)
class PublishSettings:
    base_domain: str
    cname_target: str
    apex_target: str
    app_hosts: frozenset
    resolve_custom_hosts: bool


def publish_settings() -> PublishSettings:
    base = os.environ.get("PUBLISH_BASE_DOMAIN", "").strip().lower().rstrip(".")
    cname = os.environ.get("PUBLISH_CNAME_TARGET", "").strip()
    apex = os.environ.get("PUBLISH_APEX_TARGET", "").strip()
    hosts = {"localhost", "127.0.0.1", "::1"}
    for item in os.environ.get("PUBLISH_APP_HOSTS", "").split(","):
        item = item.strip().lower().rstrip(".")
        if item:
            hosts.add(item.split(":")[0])
    resolve_custom = custom_domain_enabled() or _flag("PUBLISH_RESOLVE_CUSTOM_HOSTS")
    return PublishSettings(base, cname, apex, frozenset(hosts), resolve_custom)


def normalize_host(value: str) -> str:
    text = str(value or "").strip().lower()
    if text.startswith("["):
        end = text.find("]")
        return text[1:end] if end > 1 else ""
    return text.split(":")[0].rstrip(".")


def normalize_slug(raw: str) -> str:
    return str(raw or "").strip().lower()


def validate_slug(raw: str) -> str:
    slug = normalize_slug(raw)
    if not slug:
        raise PublishError("invalid_slug", 422, "Escribe el nombre del subdominio.")
    if slug in RESERVED_SLUGS:
        raise PublishError("reserved_slug", 422, "Ese nombre está reservado.")
    if not _SLUG_RE.match(slug) or "--" in slug:
        raise PublishError(
            "invalid_slug",
            422,
            "Usa entre 3 y 48 letras minúsculas, números o guiones, sin empezar ni terminar en guion.",
        )
    return slug


def normalize_domain(raw: str, settings: PublishSettings) -> str:
    text = str(raw or "").strip().lower()
    text = re.sub(r"^[a-z][a-z0-9+.-]*://", "", text)
    text = text.split("/")[0].split("?")[0].split("#")[0]
    if text.startswith("["):
        raise PublishError("invalid_domain", 422, "Escribe un dominio como cliente.com, sin ruta.")
    text = text.split(":")[0].rstrip(".")
    if text.startswith("*.") or not _DOMAIN_RE.match(text):
        raise PublishError("invalid_domain", 422, "Escribe un dominio como cliente.com, sin ruta.")
    base = settings.base_domain
    if base and (text == base or text.endswith("." + base)):
        raise PublishError(
            "invalid_domain",
            422,
            "Ese dominio es de Sistema Maestro. Elige un dominio tuyo.",
        )
    if text in settings.app_hosts:
        raise PublishError("invalid_domain", 422, "Ese dominio no se puede usar aquí.")
    return text


def safe_html(html) -> bool:
    return isinstance(html, str) and bool(html.strip()) and _UNSAFE_HTML.search(html) is None


ATTENDANT_LABEL = "Habla con nosotros · Reserva cita"
_ATTENDANT_ID = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
_ATTENDANT_HOST = re.compile(
    r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$"
)


def attendant_page_url(project_id: str, settings: PublishSettings) -> str | None:
    """Public chat and booking page on the product host. No script on the landing."""
    if not _ATTENDANT_ID.fullmatch(project_id or ""):
        return None
    host = (settings.base_domain or "sistemamaestro.com").strip().lower().rstrip(".")
    if not _ATTENDANT_HOST.fullmatch(host):
        host = "sistemamaestro.com"
    return f"https://{host}/atencion/{project_id}"


def with_attendant_link(html: str, project_id: str, settings: PublishSettings) -> str:
    """Insert one scriptless link. A landing that already has the marker is left as-is."""
    if not isinstance(html, str) or "data-sm-attention=" in html:
        return html
    url = attendant_page_url(project_id, settings)
    if not url:
        return html
    snippet = (
        '<p><a href="'
        + escape(url, quote=True)
        + '" data-sm-attention="1">'
        + ATTENDANT_LABEL
        + "</a></p>"
    )
    match = re.search(r"</body>", html, flags=re.IGNORECASE)
    linked = html + snippet if match is None else html[: match.start()] + snippet + html[match.start() :]
    if not safe_html(linked):
        logger.warning("publish_attendant_link_rejected")
        return html
    return linked


def _now_iso(now: str | None) -> str:
    if now:
        return now
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def _latest_version(preview: dict) -> dict:
    versions = [item for item in (preview or {}).get("versions") or [] if isinstance(item, dict)]
    if not versions:
        raise PublishError("no_version", 404, "Aún no hay una versión guardada para publicar.")
    return max(versions, key=lambda item: int(item.get("version") or 0))


def _snapshot(version: dict, source_updated_at: str, now: str) -> dict:
    html = version.get("html")
    if not safe_html(html):
        raise PublishError("unsafe_html", 422, "La versión guardada no se puede publicar.")
    return {
        "schema": PUBLISHED_SCHEMA,
        "version": int(version.get("version") or 0),
        "html": html,
        "instruction": str(version.get("instruction") or ""),
        "createdAt": str(version.get("createdAt") or ""),
        "publishedAt": now,
        "sourcePreviewUpdatedAt": source_updated_at or "",
    }


def _public_url(slug: str, settings: PublishSettings, status: str):
    if status == "published" and settings.base_domain and slug:
        return f"https://{slug}.{settings.base_domain}"
    return None


def dns_plan(host: str) -> dict:
    labels = host.split(".")
    if labels[0] == "www" and len(labels) > 2:
        return {"cname_host": host, "apex_host": ".".join(labels[1:]), "show_apex": True}
    if len(labels) == 2:
        return {"cname_host": f"www.{host}", "apex_host": host, "show_apex": True}
    return {"cname_host": host, "apex_host": "", "show_apex": False}


def dns_instructions(host: str, token: str, settings: PublishSettings) -> dict:
    plan = dns_plan(host)
    cname_value = settings.cname_target
    apex_value = settings.apex_target
    return {
        "txt": {
            "type": "TXT",
            "host": f"_sistemamaestro-verify.{host}",
            "value": token,
        },
        "cname": {
            "type": "CNAME",
            "host": plan["cname_host"],
            "value": cname_value,
            "configured": bool(cname_value),
        },
        "apex": {
            "type": "ALIAS",
            "alternative": "A",
            "host": plan["apex_host"],
            "value": apex_value,
            "configured": bool(apex_value),
            "applies": plan["show_apex"],
        },
        "ssl": SSL_NOTE,
        "activation": ACTIVATION_PENDING,
    }


def _custom_public(custom, settings: PublishSettings):
    if not isinstance(custom, dict) or not custom.get("host"):
        return None
    return {
        "host": custom["host"],
        "status": custom.get("status") or "pending",
        "activation": "pending_sistema_maestro",
        "activationLabel": ACTIVATION_PENDING,
        "verifiedAt": custom.get("verified_at"),
        "instructions": dns_instructions(custom["host"], custom.get("token") or "", settings),
    }


def public_publication(document, settings: PublishSettings) -> dict:
    base = {
        "baseDomain": settings.base_domain,
        "cnameTarget": settings.cname_target,
        "apexTarget": settings.apex_target,
        "ssl": SSL_NOTE,
        "activationLabel": ACTIVATION_PENDING,
    }
    if not document:
        return {
            **base,
            "status": "none",
            "slug": "",
            "url": None,
            "version": None,
            "publishedAt": None,
            "customDomain": None,
            "message": "Todavía no hay una copia publicada.",
        }
    status = document.get("status") or "unpublished"
    slug = document.get("slug") or ""
    snapshot = document.get("snapshot") if isinstance(document.get("snapshot"), dict) else {}
    if status == "published":
        message = (
            f"Publicada la versión {snapshot.get('version')}. "
            "Es una copia fija: si cambias la preview, esta dirección no cambia hasta que vuelvas a publicar."
        )
    elif status == "unpublished":
        message = "Despublicada. La dirección ya no muestra la página. El nombre sigue reservado para este proyecto."
    else:
        message = "Todavía no hay una copia publicada."
    return {
        **base,
        "status": status,
        "slug": slug,
        "url": _public_url(slug, settings, status),
        "version": snapshot.get("version"),
        "publishedAt": document.get("published_at"),
        "customDomain": _custom_public(document.get("custom_domain"), settings),
        "message": message,
    }


def _matches(document: dict, query: dict) -> bool:
    for key, expected in query.items():
        current = document
        found = True
        for part in key.split("."):
            if not isinstance(current, dict) or part not in current:
                found = False
                break
            current = current[part]
        if not found or current != expected:
            return False
    return True


async def _owned_preview(projects, landings, owner_id: str, project_id: str):
    from backend.app.services.builder_landing_state import LandingStateError, load_generated_preview

    try:
        loaded = await load_generated_preview(projects, landings, owner_id, project_id)
    except LandingStateError as exc:
        if exc.code == "not_found":
            raise PublishError("not_found", 404, "Aún no hay una versión guardada para publicar.") from None
        raise PublishError("not_found", exc.status, "No se ha podido leer la versión guardada.") from None
    return loaded


async def _publication_for(publications, owner_id: str, project_id: str):
    return await publications.find_one({"project_id": project_id, "user_id": owner_id})


async def _require_publication(publications, owner_id: str, project_id: str):
    document = await _publication_for(publications, owner_id, project_id)
    if not document:
        raise PublishError("not_published", 404, "Este proyecto todavía no tiene una publicación.")
    return document


def _require_promotable(version: dict) -> None:
    from backend.app.services.builder_sandbox import PromotionBlocked, assert_promotable

    try:
        assert_promotable(version)
    except PromotionBlocked as exc:
        raise PublishError("evaluation_required", 422, str(exc)) from exc


async def _slug_available(publications, slug: str, project_id: str) -> None:
    taken = await publications.find_one({"slug": slug})
    if taken and taken.get("project_id") != project_id:
        raise PublishError("slug_taken", 409, "Ese nombre ya está en uso.")


async def publish_project(
    projects, landings, publications, *, owner_id: str, project_id: str, slug: str,
    now: str | None = None, settings: PublishSettings | None = None,
    modules=None,
) -> dict:
    """Copy the latest saved version into an immutable snapshot and mark it published.

    The version has to pass assert_promotable first. A missing score or a
    total under the threshold is a 422, including for an admin. This path
    does not charge gems. After the snapshot is stored, chat and citas turn
    on. That step logs and continues if it fails; the publication stays.
    TODO(founder): gem charge for publishing is still not wired.
    """
    settings = settings or publish_settings()
    stamp = _now_iso(now)
    chosen = validate_slug(slug)
    loaded = await _owned_preview(projects, landings, owner_id, project_id)
    version = _latest_version(loaded["preview"])
    _require_promotable(version)
    snapshot = copy.deepcopy(_snapshot(version, loaded.get("updated_at") or "", stamp))
    snapshot["html"] = with_attendant_link(snapshot["html"], project_id, settings)
    await _slug_available(publications, chosen, project_id)
    current = await _publication_for(publications, owner_id, project_id)
    history = []
    custom = None
    if isinstance(current, dict):
        history = [copy.deepcopy(item) for item in current.get("history") or [] if isinstance(item, dict)]
        if isinstance(current.get("snapshot"), dict):
            history.append(copy.deepcopy(current["snapshot"]))
        history = history[-8:]
        custom = copy.deepcopy(current.get("custom_domain")) if isinstance(current.get("custom_domain"), dict) else None
    document = {
        "project_id": project_id,
        "user_id": owner_id,
        "slug": chosen,
        "status": "published",
        "snapshot": snapshot,
        "history": history,
        "published_at": stamp,
        "unpublished_at": None,
        "updated_at": stamp,
    }
    if custom:
        document["custom_domain"] = custom
    await publications.update_one(
        {"project_id": project_id, "user_id": owner_id},
        {"$set": document},
        upsert=True,
    )
    stored = await _publication_for(publications, owner_id, project_id)
    from backend.app.services.agent_modules import activate_published_attendant

    await activate_published_attendant(
        modules, {"project_id": project_id, "user_id": owner_id},
    )
    return public_publication(stored, settings)


async def republish_project(
    projects, landings, publications, *, owner_id: str, project_id: str,
    now: str | None = None, settings: PublishSettings | None = None,
    modules=None,
) -> dict:
    current = await _require_publication(publications, owner_id, project_id)
    return await publish_project(
        projects, landings, publications,
        owner_id=owner_id, project_id=project_id, slug=current.get("slug") or "",
        now=now, settings=settings, modules=modules,
    )


async def unpublish_project(
    publications, *, owner_id: str, project_id: str,
    now: str | None = None, settings: PublishSettings | None = None,
) -> dict:
    settings = settings or publish_settings()
    current = await _require_publication(publications, owner_id, project_id)
    if current.get("status") == "unpublished":
        return public_publication(current, settings)
    stamp = _now_iso(now)
    await publications.update_one(
        {"project_id": project_id, "user_id": owner_id},
        {"$set": {"status": "unpublished", "unpublished_at": stamp, "updated_at": stamp}},
    )
    stored = await _publication_for(publications, owner_id, project_id)
    return public_publication(stored, settings)


async def read_publication(
    publications, *, owner_id: str, project_id: str, settings: PublishSettings | None = None,
) -> dict:
    settings = settings or publish_settings()
    document = await _publication_for(publications, owner_id, project_id)
    return public_publication(document, settings)


def _new_token() -> str:
    return "sm-verify=" + secrets.token_urlsafe(18)


async def set_custom_domain(
    publications, *, owner_id: str, project_id: str, domain: str,
    now: str | None = None, settings: PublishSettings | None = None,
) -> dict:
    settings = settings or publish_settings()
    current = await _require_publication(publications, owner_id, project_id)
    host = normalize_domain(domain, settings)
    taken = await publications.find_one({"custom_domain.host": host})
    if taken and taken.get("project_id") != project_id:
        raise PublishError("domain_taken", 409, "Ese dominio ya está en uso.")
    previous = current.get("custom_domain") if isinstance(current.get("custom_domain"), dict) else None
    if previous and previous.get("host") == host and previous.get("token"):
        custom = copy.deepcopy(previous)
    else:
        token = _new_token()
        custom = {
            "host": host,
            "status": "pending",
            "token": token,
            "txt_host": f"_sistemamaestro-verify.{host}",
            "verified_at": None,
            "activation": "pending_sistema_maestro",
        }
    stamp = _now_iso(now)
    await publications.update_one(
        {"project_id": project_id, "user_id": owner_id},
        {"$set": {"custom_domain": custom, "updated_at": stamp}},
    )
    stored = await _publication_for(publications, owner_id, project_id)
    payload = public_publication(stored, settings)
    payload["message"] = "Dominio guardado. Crea los registros y pulsa Verificar. No hemos cambiado tu DNS."
    return payload


async def clear_custom_domain(
    publications, *, owner_id: str, project_id: str,
    now: str | None = None, settings: PublishSettings | None = None,
) -> dict:
    settings = settings or publish_settings()
    await _require_publication(publications, owner_id, project_id)
    stamp = _now_iso(now)
    await publications.update_one(
        {"project_id": project_id, "user_id": owner_id},
        {"$unset": {"custom_domain": ""}, "$set": {"updated_at": stamp}},
    )
    stored = await _publication_for(publications, owner_id, project_id)
    payload = public_publication(stored, settings)
    payload["message"] = "Se ha quitado el dominio de este proyecto."
    return payload


def dns_txt_values(name: str) -> list:
    import dns.exception
    import dns.resolver

    resolver = dns.resolver.Resolver()
    resolver.lifetime = 3.0
    try:
        answers = resolver.resolve(name, "TXT")
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers, dns.exception.Timeout):
        return []
    values = []
    for rdata in answers:
        chunks = getattr(rdata, "strings", None)
        if not chunks:
            values.append(str(rdata).strip().strip('"'))
            continue
        values.append(b"".join(chunks).decode("utf-8", "replace").strip())
    return values


async def _lookup_txt(resolve_txt, name: str) -> list:
    try:
        result = resolve_txt(name)
        if hasattr(result, "__await__"):
            result = await result
    except PublishError:
        raise
    except Exception as exc:
        raise PublishError("dns_unavailable", 503, "No se ha podido comprobar el DNS.") from exc
    if not isinstance(result, (list, tuple)):
        raise PublishError("dns_unavailable", 503, "No se ha podido comprobar el DNS.")
    return [str(item).strip() for item in result]


async def verify_custom_domain(
    publications, *, owner_id: str, project_id: str,
    now: str | None = None, settings: PublishSettings | None = None,
    resolve_txt=None, activation=None,
) -> dict:
    """Check the TXT record. A match marks the domain verified.

    The hosting edge is not updated. The adapter is the only place that would
    talk to Railway, and the default adapter does not.
    """
    settings = settings or publish_settings()
    current = await _require_publication(publications, owner_id, project_id)
    custom = current.get("custom_domain") if isinstance(current.get("custom_domain"), dict) else None
    if not custom or not custom.get("host") or not custom.get("token"):
        raise PublishError("domain_missing", 422, "Primero guarda el dominio.")
    lookup = resolve_txt or dns_txt_values
    txt_host = custom.get("txt_host") or f"_sistemamaestro-verify.{custom['host']}"
    values = await _lookup_txt(lookup, txt_host)
    stamp = _now_iso(now)
    matched = custom["token"] in values
    updated = copy.deepcopy(custom)
    if matched:
        adapter = activation or domain_activation
        pending = await adapter.request_attachment(updated["host"])
        updated["status"] = "verified"
        updated["verified_at"] = stamp
        updated["activation"] = (pending or {}).get("status") or "pending_sistema_maestro"
        message = "El TXT coincide. El dominio está verificado. " + ACTIVATION_PENDING + "."
    else:
        updated["status"] = "pending"
        updated["verified_at"] = None
        updated["activation"] = "pending_sistema_maestro"
        message = "El TXT todavía no coincide. Revisa el registro y vuelve a verificar."
    await publications.update_one(
        {"project_id": project_id, "user_id": owner_id},
        {"$set": {"custom_domain": updated, "updated_at": stamp}},
    )
    stored = await _publication_for(publications, owner_id, project_id)
    payload = public_publication(stored, settings)
    payload["message"] = message
    return payload


def classify_host(host: str, settings: PublishSettings) -> str:
    """Return pass, subdomain, or custom.

    Reserved product names (www, api, app, …) and the apex stay with the app.
    A label under the configured base domain is a landing host. Anything else
    might be a customer domain; the caller decides whether to look it up.
    """
    parsed = normalize_host(host)
    if not parsed or parsed in settings.app_hosts:
        return "pass"
    base = settings.base_domain
    if not base:
        return "custom"
    if parsed == base or parsed == f"www.{base}":
        return "pass"
    suffix = "." + base
    if parsed.endswith(suffix):
        label = parsed[: -len(suffix)]
        if not label or "." in label:
            return "subdomain"
        if label in RESERVED_SLUGS:
            return "pass"
        return "subdomain"
    return "custom"


def _page(html: str, status: int) -> dict:
    return {"html": html, "status": status}


async def resolve_host(publications, host: str, settings: PublishSettings, kind: str):
    """Return a page dict, or None when the request should reach the normal app."""
    parsed = normalize_host(host)
    if kind == "subdomain":
        label = parsed[: -(len(settings.base_domain) + 1)] if settings.base_domain else ""
        if not label or "." in label or label in RESERVED_SLUGS:
            return _page(NOT_FOUND_HTML, 404)
        document = await publications.find_one({"slug": label, "status": "published"})
        return _published_page(document)
    if kind == "custom":
        document = await publications.find_one({"custom_domain.host": parsed})
        if not document:
            return None
        custom = document.get("custom_domain") if isinstance(document.get("custom_domain"), dict) else {}
        if document.get("status") == "published" and custom.get("status") == "verified":
            return _published_page(document)
        return _page(NOT_FOUND_HTML, 404)
    return None


def _published_page(document) -> dict:
    snapshot = document.get("snapshot") if isinstance(document, dict) else None
    html = snapshot.get("html") if isinstance(snapshot, dict) else ""
    if document and document.get("status") == "published" and safe_html(html):
        return _page(html, 200)
    return _page(NOT_FOUND_HTML, 404)


def html_response(html: str, status: int) -> HTMLResponse:
    return HTMLResponse(html, status_code=status, headers=dict(SAFE_HEADERS))


async def published_landing_response(publications, host: str, settings: PublishSettings | None = None):
    settings = settings or publish_settings()
    kind = classify_host(host, settings)
    if kind == "pass":
        return None
    if kind == "custom" and not settings.resolve_custom_hosts:
        return None
    try:
        page = await resolve_host(publications, host, settings, kind)
    except Exception:
        logger.exception("published_landing_lookup_failed")
        if kind == "subdomain":
            return html_response(UNAVAILABLE_HTML, 503)
        return None
    if page is None:
        return None
    return html_response(page["html"], page["status"])


class PublishedLandingMiddleware:
    """Serve a published landing before the app when the Host header says so.

    Product hosts pass through. Customer-domain lookups stay off until
    CUSTOM_DOMAIN_ENABLED or PUBLISH_RESOLVE_CUSTOM_HOSTS is on, so the
    current Railway hostname is left alone.
    """

    def __init__(self, app, publications, settings_provider=publish_settings):
        self.app = app
        self.publications = publications
        self.settings_provider = settings_provider

    async def __call__(self, scope, receive, send):
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return
        headers = {
            key.decode("latin1").lower(): value.decode("latin1")
            for key, value in scope.get("headers") or []
        }
        response = await published_landing_response(
            self.publications, headers.get("host", ""), self.settings_provider(),
        )
        if response is None:
            await self.app(scope, receive, send)
            return
        if scope.get("method") not in {"GET", "HEAD"}:
            response = html_response(NOT_FOUND_HTML, 404)
        await response(scope, receive, send)
