"""CORS only for the public embed API.

The global allow-list stays closed. A visitor's site calls
``/api/public/embed/*`` from its own origin. These routes do not use
cookies. The handler still rejects origins that the agent does not allow.
"""

from backend.app.services.embed_agent import normalize_origin

EMBED_PUBLIC_PREFIX = "/api/public/embed/"


def _header(scope, name: bytes) -> str:
    for key, value in scope.get("headers") or []:
        if key.lower() == name:
            return value.decode("latin-1").strip()
    return ""


def _set_header(message, name: bytes, value: str) -> None:
    headers = [
        (key, current)
        for key, current in (message.get("headers") or [])
        if key.lower() != name
    ]
    headers.append((name, value.encode("latin-1")))
    message["headers"] = headers


class EmbedPublicCORSMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") != "http" or not str(scope.get("path") or "").startswith(EMBED_PUBLIC_PREFIX):
            await self.app(scope, receive, send)
            return

        origin = _header(scope, b"origin")
        allowed = bool(origin and normalize_origin(origin))
        if scope.get("method") == "OPTIONS":
            headers = [
                (b"vary", b"Origin"),
                (b"access-control-allow-methods", b"GET, POST, OPTIONS"),
                (
                    b"access-control-allow-headers",
                    b"accept, content-type, x-embed-key, x-embed-frame",
                ),
                (b"access-control-max-age", b"600"),
                (b"content-length", b"0"),
            ]
            if allowed:
                headers.insert(0, (b"access-control-allow-origin", origin.encode("latin-1")))
            await send({"type": "http.response.start", "status": 204, "headers": headers})
            await send({"type": "http.response.body", "body": b""})
            return

        async def send_wrapper(message):
            if message.get("type") == "http.response.start" and allowed:
                _set_header(message, b"access-control-allow-origin", origin)
                _set_header(message, b"vary", "Origin")
            await send(message)

        await self.app(scope, receive, send_wrapper)
