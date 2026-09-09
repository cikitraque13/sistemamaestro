import asyncio
import json
import os
import socket
import ssl
import unittest
from unittest.mock import patch
from urllib.parse import urlsplit

import aiohttp

from backend.app.services import url_analysis


AUDIT_LOG = []


def _answer(ip, port=443):
    family = socket.AF_INET6 if ":" in ip else socket.AF_INET
    return (family, socket.SOCK_STREAM, socket.IPPROTO_TCP, "", (ip, port))


class _FakeContent:
    def __init__(self, chunks):
        self._chunks = chunks

    async def iter_chunked(self, _size):
        for chunk in self._chunks:
            yield chunk


class _FakeResponse:
    def __init__(self, status=200, headers=None, chunks=None, charset="utf-8", error=None):
        self.status = status
        self.headers = headers or {"content-type": "text/html"}
        self.content = _FakeContent(chunks if chunks is not None else [b"<html>ok</html>"])
        self.charset = charset
        self.error = error

    async def __aenter__(self):
        if self.error:
            raise self.error
        return self

    async def __aexit__(self, *_args):
        return False


class _FakeConnector:
    instances = []

    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self.resolver = kwargs["resolver"]
        type(self).instances.append(self)


class _FakeSession:
    routes = {}
    instances = []
    connections = []

    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self.connector = kwargs["connector"]
        type(self).instances.append(self)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return False

    def get(self, url, **kwargs):
        parsed = urlsplit(url)
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        fixture = self.routes.get(url)
        if fixture is None:
            fixture = _FakeResponse()

        class _Request:
            async def __aenter__(inner_self):
                resolved = await self.connector.resolver.resolve(
                    parsed.hostname, port, socket.AF_UNSPEC
                )
                _FakeSession.connections.append({
                    "url": url,
                    "hostname": parsed.hostname,
                    "port": port,
                    "ip": resolved[0]["host"],
                    "allow_redirects": kwargs.get("allow_redirects"),
                })
                AUDIT_LOG.append({
                    "event": "connection_attempt",
                    "hostname": parsed.hostname,
                    "port": port,
                    "selected_ip": resolved[0]["host"],
                    "automatic_redirects": kwargs.get("allow_redirects"),
                })
                return await fixture.__aenter__()

            async def __aexit__(inner_self, *args):
                return await fixture.__aexit__(*args)

        return _Request()


class SSRFHardeningTests(unittest.TestCase):
    def setUp(self):
        _FakeConnector.instances.clear()
        _FakeSession.instances.clear()
        _FakeSession.connections.clear()
        _FakeSession.routes = {}
        self.network_patch = patch.multiple(
            url_analysis.aiohttp,
            TCPConnector=_FakeConnector,
            ClientSession=_FakeSession,
        )
        self.network_patch.start()

    def tearDown(self):
        self.network_patch.stop()

    def resolve(self, url, answers):
        with patch.object(url_analysis, "_system_getaddrinfo", return_value=answers):
            return asyncio.run(url_analysis._resolve_public_target(url))

    def fetch(self, url, dns):
        def resolve(host, port):
            value = dns[host]
            if isinstance(value, BaseException):
                raise value
            AUDIT_LOG.append({
                "event": "dns_answer",
                "hostname": host,
                "port": port,
                "addresses": list(value),
            })
            return [_answer(ip, port) for ip in value]

        with patch.object(url_analysis, "_system_getaddrinfo", side_effect=resolve):
            return asyncio.run(url_analysis._fetch_public_html(url))

    def test_public_ipv4_and_ipv6_are_valid(self):
        ipv4 = self.resolve("https://v4.test/", [_answer("93.184.216.34")])
        ipv6 = self.resolve("https://v6.test/", [_answer("2606:4700:4700::1111")])
        self.assertEqual(ipv4.ip, "93.184.216.34")
        self.assertEqual(ipv6.ip, "2606:4700:4700::1111")
        self.assertEqual(ipv6.family, socket.AF_INET6)

    def test_public_literals_do_not_use_dns(self):
        with patch.object(url_analysis, "_system_getaddrinfo") as resolver:
            v4 = asyncio.run(url_analysis._resolve_public_target("http://93.184.216.34/x"))
            v6 = asyncio.run(url_analysis._resolve_public_target("https://[2606:4700:4700::1111]/x"))
        resolver.assert_not_called()
        self.assertEqual((v4.ip, v6.ip), ("93.184.216.34", "2606:4700:4700::1111"))

    def test_all_forbidden_address_classes_fail_closed(self):
        forbidden = [
            "127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.0.1",
            "169.254.169.254", "100.64.0.1", "192.0.0.1", "224.0.0.1",
            "0.0.0.0", "::1", "fc00::1", "fe80::1", "ff00::1", "::",
            "::ffff:127.0.0.1", "64:ff9b::a9fe:a9fe", "2002:0a00:0001::",
        ]
        for ip in forbidden:
            with self.subTest(ip=ip), self.assertRaisesRegex(ValueError, "no es público"):
                self.resolve("https://blocked.test/", [_answer(ip)])

    def test_mixed_dns_rejected_before_any_connection(self):
        with self.assertRaisesRegex(ValueError, "no es público"):
            self.fetch("https://mixed.test/", {"mixed.test": ["93.184.216.34", "127.0.0.1"]})
        self.assertEqual(_FakeSession.connections, [])

    def test_multiple_public_addresses_use_stable_lowest_address(self):
        target = self.resolve(
            "https://multi.test/",
            [_answer("2606:4700:4700::1111"), _answer("93.184.216.35"), _answer("93.184.216.34")],
        )
        self.assertEqual(target.ip, "93.184.216.34")

    def test_rebinding_cannot_trigger_second_system_resolution(self):
        calls = []

        def rebinding(host, port):
            calls.append((host, port))
            return [_answer("93.184.216.34", port)] if len(calls) == 1 else [_answer("127.0.0.1", port)]

        with patch.object(url_analysis, "_system_getaddrinfo", side_effect=rebinding):
            final_url, _html = asyncio.run(url_analysis._fetch_public_html("https://rebind.test/"))
        self.assertEqual(final_url, "https://rebind.test/")
        self.assertEqual(calls, [("rebind.test", 443)])
        self.assertEqual(_FakeSession.connections[0]["ip"], "93.184.216.34")

    def test_public_to_private_redirect_never_connects_to_private_target(self):
        _FakeSession.routes = {
            "https://public.test/": _FakeResponse(302, {"location": "http://metadata.test/latest"})
        }
        with self.assertRaisesRegex(ValueError, "no es público"):
            self.fetch(
                "https://public.test/",
                {"public.test": ["93.184.216.34"], "metadata.test": ["169.254.169.254"]},
            )
        self.assertEqual([c["hostname"] for c in _FakeSession.connections], ["public.test"])

    def test_relative_redirect_is_revalidated_and_pinned(self):
        _FakeSession.routes = {
            "https://relative.test/start": _FakeResponse(302, {"location": "/final"}),
            "https://relative.test/final": _FakeResponse(200),
        }
        final_url, _html = self.fetch(
            "https://relative.test/start", {"relative.test": ["93.184.216.34"]}
        )
        self.assertEqual(final_url, "https://relative.test/final")
        self.assertEqual(len(_FakeConnector.instances), 2)
        self.assertEqual(len(_FakeSession.connections), 2)

    def test_redirect_cycle_is_rejected(self):
        _FakeSession.routes = {
            "https://cycle.test/a": _FakeResponse(302, {"location": "/b"}),
            "https://cycle.test/b": _FakeResponse(302, {"location": "/a"}),
        }
        with self.assertRaisesRegex(ValueError, "Ciclo"):
            self.fetch("https://cycle.test/a", {"cycle.test": ["93.184.216.34"]})

    def test_redirect_limit_is_enforced(self):
        _FakeSession.routes = {
            f"https://limit.test/{index}": _FakeResponse(302, {"location": f"/{index + 1}"})
            for index in range(url_analysis.MAX_REDIRECTS + 1)
        }
        with self.assertRaisesRegex(ValueError, "Demasiadas"):
            self.fetch("https://limit.test/0", {"limit.test": ["93.184.216.34"]})

    def test_credentials_schemes_hosts_and_ports_are_rejected(self):
        invalid = [
            "file:///etc/passwd", "ftp://example.test/", "https://u:p@example.test/",
            "https://bad_host.test/", "https://example.test:0/", "https://example.test:70000/",
            "https://example.test\\@127.0.0.1/",
        ]
        for value in invalid:
            with self.subTest(value=value), self.assertRaises(ValueError):
                asyncio.run(url_analysis._resolve_public_target(value))

    def test_dns_failure_fails_closed_without_connection(self):
        with patch.object(url_analysis, "_system_getaddrinfo", side_effect=socket.gaierror("no")):
            with self.assertRaisesRegex(ValueError, "No se pudo resolver"):
                asyncio.run(url_analysis._fetch_public_html("https://dns.test/"))
        self.assertEqual(_FakeSession.connections, [])

    def test_timeout_and_tls_fail_closed(self):
        _FakeSession.routes = {
            "https://timeout.test/": _FakeResponse(error=asyncio.TimeoutError()),
            "https://tls.test/": _FakeResponse(error=ssl.SSLCertVerificationError("hostname")),
        }
        dns = {"timeout.test": ["93.184.216.34"], "tls.test": ["93.184.216.34"]}
        with self.assertRaises(asyncio.TimeoutError):
            self.fetch("https://timeout.test/", dns)
        with self.assertRaises(ssl.SSLCertVerificationError):
            self.fetch("https://tls.test/", dns)

    def test_proxy_environment_is_ignored_and_redirects_are_manual(self):
        with patch.dict(os.environ, {"HTTPS_PROXY": "http://127.0.0.1:9"}):
            self.fetch("https://proxy.test/", {"proxy.test": ["93.184.216.34"]})
        self.assertTrue(all(session.kwargs["trust_env"] is False for session in _FakeSession.instances))
        self.assertTrue(all(connection["allow_redirects"] is False for connection in _FakeSession.connections))

    def test_every_hop_has_fresh_non_caching_connector_and_strict_tls(self):
        _FakeSession.routes = {
            "http://fresh.test/a": _FakeResponse(302, {"location": "/b"}),
            "http://fresh.test/b": _FakeResponse(200),
        }
        self.fetch("http://fresh.test/a", {"fresh.test": ["93.184.216.34"]})
        self.assertEqual(len(_FakeConnector.instances), 2)
        for connector in _FakeConnector.instances:
            self.assertTrue(connector.kwargs["force_close"])
            self.assertFalse(connector.kwargs["use_dns_cache"])
            context = connector.kwargs["ssl"]
            self.assertEqual(context.verify_mode, ssl.CERT_REQUIRED)
            self.assertTrue(context.check_hostname)

    def test_pinned_resolver_rejects_authority_or_port_change(self):
        target = url_analysis._PinnedTarget("https://a.test/", "a.test", 443, "93.184.216.34", socket.AF_INET)
        resolver = url_analysis._PinnedResolver(target)
        with self.assertRaises(OSError):
            asyncio.run(resolver.resolve("b.test", 443))
        with self.assertRaises(OSError):
            asyncio.run(resolver.resolve("a.test", 444))

    def test_public_url_success_preserves_response_and_limits(self):
        body = b"<html><h1>public</h1></html>"
        _FakeSession.routes = {"https://ok.test/": _FakeResponse(200, chunks=[body])}
        final_url, html = self.fetch("https://ok.test/", {"ok.test": ["93.184.216.34"]})
        self.assertEqual(final_url, "https://ok.test/")
        self.assertEqual(html, body.decode())
        timeout = _FakeSession.instances[0].kwargs["timeout"]
        self.assertEqual(timeout.total, url_analysis.REQUEST_TIMEOUT_SECONDS)
        self.assertEqual(_FakeSession.connections[0]["hostname"], "ok.test")

    def test_response_size_limit_is_preserved(self):
        oversized = b"x" * (url_analysis.MAX_RESPONSE_BYTES + 1)
        _FakeSession.routes = {"https://large.test/": _FakeResponse(200, chunks=[oversized])}
        with self.assertRaisesRegex(ValueError, "demasiado grande"):
            self.fetch("https://large.test/", {"large.test": ["93.184.216.34"]})

    def test_non_html_content_is_rejected(self):
        _FakeSession.routes = {
            "https://json.test/": _FakeResponse(200, {"content-type": "application/json"})
        }
        with self.assertRaisesRegex(ValueError, "no contiene"):
            self.fetch("https://json.test/", {"json.test": ["93.184.216.34"]})

    def test_external_contract_fails_closed_for_private_destination(self):
        with patch.object(
            url_analysis, "_system_getaddrinfo", return_value=[_answer("127.0.0.1")]
        ):
            result = asyncio.run(url_analysis.fetch_and_analyze_url("https://private.test/"))
        self.assertEqual(result, {"success": False, "error": "El destino no es público"})


class ExistingInputHardeningTests(unittest.TestCase):
    def test_project_input_is_bounded_and_typed(self):
        from pydantic import ValidationError
        from backend.app.schemas.projects import ProjectCreate

        with self.assertRaises(ValidationError):
            ProjectCreate(input_type="other", input_content="valid")
        with self.assertRaises(ValidationError):
            ProjectCreate(input_type="text", input_content="")
        with self.assertRaises(ValidationError):
            ProjectCreate(input_type="text", input_content="x" * 50_001)

    def test_checkout_origin_must_be_http(self):
        from pydantic import ValidationError
        from backend.app.schemas.payments import CheckoutCreate

        with self.assertRaises(ValidationError):
            CheckoutCreate(origin_url="javascript:alert(1)")


if __name__ == "__main__":
    program = unittest.main(exit=False, verbosity=2)
    print("SSRF_AUDIT_TRACE=" + json.dumps(AUDIT_LOG, sort_keys=True))
    raise SystemExit(0 if program.result.wasSuccessful() else 1)
