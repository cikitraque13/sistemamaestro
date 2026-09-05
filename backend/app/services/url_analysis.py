import asyncio
import ipaddress
import socket
import ssl
from dataclasses import dataclass
from typing import Any, Dict, Iterable, Union
from urllib.parse import urljoin, urlsplit, urlunsplit

import aiohttp
from aiohttp.abc import AbstractResolver


MAX_RESPONSE_BYTES = 2 * 1024 * 1024
MAX_REDIRECTS = 5
REQUEST_TIMEOUT_SECONDS = 15.0
REDIRECT_STATUSES = frozenset({301, 302, 303, 307, 308})
NAT64_PREFIXES = (
    ipaddress.ip_network("64:ff9b::/96"),
    ipaddress.ip_network("64:ff9b:1::/48"),
)


@dataclass(frozen=True)
class _PinnedTarget:
    url: str
    hostname: str
    port: int
    ip: str
    family: int


class _PinnedResolver(AbstractResolver):
    """Resolve one authority to one pre-approved numeric address."""

    def __init__(self, target: _PinnedTarget):
        self._target = target
        self.calls: list[tuple[str, int, int]] = []

    async def resolve(
        self, host: str, port: int = 0, family: int = socket.AF_INET
    ) -> list[dict[str, Any]]:
        self.calls.append((host, port, family))
        if host != self._target.hostname or port != self._target.port:
            raise OSError("El destino efectivo no coincide con el destino validado")
        return [{
            "hostname": self._target.hostname,
            "host": self._target.ip,
            "port": self._target.port,
            "family": self._target.family,
            "proto": socket.IPPROTO_TCP,
            "flags": socket.AI_NUMERICHOST,
        }]

    async def close(self) -> None:
        return None


class _UpstreamHTTPError(Exception):
    def __init__(self, status: int):
        super().__init__(f"upstream status {status}")
        self.status = status


def _system_getaddrinfo(hostname: str, port: int) -> list[tuple]:
    return socket.getaddrinfo(
        hostname, port, family=socket.AF_UNSPEC, type=socket.SOCK_STREAM
    )


def _is_public_address(value: str) -> bool:
    try:
        address = ipaddress.ip_address(value.split("%", 1)[0])
    except ValueError:
        return False
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped:
        address = address.ipv4_mapped
    elif isinstance(address, ipaddress.IPv6Address) and (
        address.sixtofour is not None
        or address.teredo is not None
        or any(address in prefix for prefix in NAT64_PREFIXES)
    ):
        return False
    return address.is_global and not (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_multicast
        or address.is_reserved
        or address.is_unspecified
    )


def _canonical_hostname(hostname: str) -> str:
    hostname = hostname.rstrip(".").lower()
    if not hostname or hostname == "localhost" or hostname.endswith(".localhost"):
        raise ValueError("El destino no es público")
    try:
        address = ipaddress.ip_address(hostname.split("%", 1)[0])
    except ValueError:
        try:
            hostname = hostname.encode("idna").decode("ascii")
        except UnicodeError as exc:
            raise ValueError("URL no válida") from exc
        if len(hostname) > 253:
            raise ValueError("URL no válida")
        labels = hostname.split(".")
        if any(
            not label
            or len(label) > 63
            or label.startswith("-")
            or label.endswith("-")
            or not all(char.isalnum() or char == "-" for char in label)
            for label in labels
        ):
            raise ValueError("URL no válida")
        return hostname
    if "%" in hostname or not _is_public_address(str(address)):
        raise ValueError("El destino no es público")
    return str(address)


def _normalise_url(url: str) -> tuple[str, str, int]:
    try:
        parsed = urlsplit(url)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError as exc:
        raise ValueError("URL no válida") from exc
    if parsed.scheme.lower() not in {"http", "https"} or not hostname:
        raise ValueError("URL no válida")
    if parsed.username is not None or parsed.password is not None or "\\" in parsed.netloc:
        raise ValueError("URL no válida")
    hostname = _canonical_hostname(hostname)
    if port is None:
        port = 443 if parsed.scheme.lower() == "https" else 80
    if not 1 <= port <= 65535:
        raise ValueError("URL no válida")
    display_host = f"[{hostname}]" if ":" in hostname else hostname
    default_port = 443 if parsed.scheme.lower() == "https" else 80
    authority = display_host if port == default_port else f"{display_host}:{port}"
    normalised = urlunsplit(
        (parsed.scheme.lower(), authority, parsed.path or "/", parsed.query, "")
    )
    return normalised, hostname, port


def _unique_addresses(
    addresses: Iterable[tuple],
) -> list[tuple[Union[ipaddress.IPv4Address, ipaddress.IPv6Address], int]]:
    unique: dict[
        tuple[int, bytes],
        tuple[Union[ipaddress.IPv4Address, ipaddress.IPv6Address], int],
    ] = {}
    for item in addresses:
        try:
            raw = item[4][0].split("%", 1)[0]
            address = ipaddress.ip_address(raw)
        except (IndexError, TypeError, ValueError):
            raise ValueError("Resultado DNS no válido") from None
        if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped:
            address = address.ipv4_mapped
        family = socket.AF_INET6 if address.version == 6 else socket.AF_INET
        unique[(address.version, address.packed)] = (address, family)
    return [unique[key] for key in sorted(unique)]


async def _resolve_public_target(url: str) -> _PinnedTarget:
    normalised, hostname, port = _normalise_url(url)
    try:
        literal = ipaddress.ip_address(hostname)
    except ValueError:
        try:
            answers = await asyncio.to_thread(_system_getaddrinfo, hostname, port)
        except (socket.gaierror, OSError) as exc:
            raise ValueError("No se pudo resolver el servidor") from exc
        if not answers:
            raise ValueError("No se pudo resolver el servidor")
        addresses = _unique_addresses(answers)
    else:
        addresses = [(literal, socket.AF_INET6 if literal.version == 6 else socket.AF_INET)]

    # Reject the complete set before selection. In an all-public set the lowest
    # family then packed bytes wins, deterministically (IPv4 before IPv6).
    if not addresses or any(not _is_public_address(str(address)) for address, _ in addresses):
        raise ValueError("El destino no es público")
    selected, family = addresses[0]
    return _PinnedTarget(normalised, hostname, port, str(selected), family)


async def _validate_public_url(url: str) -> str:
    """Compatibility helper retained for existing direct tests/callers."""
    return (await _resolve_public_target(url)).url


async def _read_response(response: aiohttp.ClientResponse) -> str:
    content_type = response.headers.get("content-type", "").lower()
    if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
        raise ValueError("La URL no contiene una página HTML")
    chunks = bytearray()
    async for chunk in response.content.iter_chunked(64 * 1024):
        chunks.extend(chunk)
        if len(chunks) > MAX_RESPONSE_BYTES:
            raise ValueError("La página es demasiado grande")
    return bytes(chunks).decode(response.charset or "utf-8", errors="replace")


async def _request_pinned(target: _PinnedTarget) -> tuple[int, dict[str, str], str | None]:
    resolver = _PinnedResolver(target)
    tls_context = ssl.create_default_context()
    if tls_context.verify_mode != ssl.CERT_REQUIRED or not tls_context.check_hostname:
        raise RuntimeError("La validación TLS no está disponible")
    connector = aiohttp.TCPConnector(
        resolver=resolver,
        ssl=tls_context,
        force_close=True,
        use_dns_cache=False,
    )
    timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT_SECONDS)
    async with aiohttp.ClientSession(
        connector=connector, timeout=timeout, trust_env=False
    ) as session:
        async with session.get(
            target.url,
            headers={"User-Agent": "SistemaMaestro/1.0 URL analyzer"},
            allow_redirects=False,
        ) as response:
            headers = {key.lower(): value for key, value in response.headers.items()}
            if response.status in REDIRECT_STATUSES:
                return response.status, headers, None
            if response.status >= 400:
                raise _UpstreamHTTPError(response.status)
            return response.status, headers, await _read_response(response)


async def _fetch_public_html(url: str) -> tuple[str, str]:
    current_url = url
    visited: set[str] = set()
    for redirect_count in range(MAX_REDIRECTS + 1):
        target = await _resolve_public_target(current_url)
        if target.url in visited:
            raise ValueError("Ciclo de redirecciones")
        visited.add(target.url)
        status, headers, body = await _request_pinned(target)
        if status not in REDIRECT_STATUSES:
            if body is None:
                raise ValueError("Respuesta no válida")
            return target.url, body
        location = headers.get("location")
        if not location:
            raise ValueError("Redirección no válida")
        if redirect_count >= MAX_REDIRECTS:
            raise ValueError("Demasiadas redirecciones")
        current_url = urljoin(target.url, location)
    raise ValueError("Demasiadas redirecciones")


async def fetch_and_analyze_url(url: str) -> Dict[str, Any]:
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    try:
        final_url, html = await _fetch_public_html(url)
        parsed = urlsplit(final_url)
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        title = soup.title.string.strip() if soup.title and soup.title.string else "Sin título"
        meta_desc = ""
        meta_tag = soup.find("meta", attrs={"name": "description"})
        if meta_tag:
            meta_desc = meta_tag.get("content", "")
        h1 = [tag.get_text(strip=True) for tag in soup.find_all("h1")][:5]
        h2 = [tag.get_text(strip=True) for tag in soup.find_all("h2")][:10]
        paragraphs = [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 30][:5]
        ctas = []
        for link in soup.find_all("a", href=True):
            text = link.get_text(strip=True).lower()
            if any(word in text for word in ["comprar", "buy", "sign up", "registr", "empieza", "start", "contact", "demo", "free", "gratis", "prueba"]):
                ctas.append(link.get_text(strip=True))
        for button in soup.find_all("button"):
            text = button.get_text(strip=True)
            if text:
                ctas.append(text)
        return {"success": True, "content": {
            "url": final_url,
            "domain": parsed.netloc,
            "title": title,
            "meta_description": meta_desc,
            "h1": h1,
            "h2": h2,
            "main_text": paragraphs,
            "ctas": list(set(ctas))[:10],
            "forms_count": len(soup.find_all("form")),
            "navigation": [a.get_text(strip=True) for a in soup.find_all("nav")][:5],
        }}
    except (asyncio.TimeoutError, aiohttp.ServerTimeoutError):
        return {"success": False, "error": "Tiempo de espera agotado al acceder a la URL"}
    except (aiohttp.ClientConnectionError, ssl.SSLError):
        return {"success": False, "error": "No se pudo conectar con el servidor"}
    except _UpstreamHTTPError as exc:
        return {"success": False, "error": f"No se pudo acceder a la web (código {exc.status})"}
    except ValueError as exc:
        return {"success": False, "error": str(exc)}
    except Exception:
        return {"success": False, "error": "No se pudo analizar la URL"}
