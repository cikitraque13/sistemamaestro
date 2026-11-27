import asyncio
import unittest

from backend.app.services import nova_voice


class ResolveTests(unittest.TestCase):
    def test_without_key_the_provider_is_the_browser(self):
        self.assertEqual(nova_voice.resolve_nova_voice_provider({}), "browser")

    def test_key_selects_grok(self):
        self.assertEqual(
            nova_voice.resolve_nova_voice_provider({"GROK_API_KEY": "xai-secret"}),
            "grok",
        )

    def test_off_disables_grok_and_keeps_browser_voice(self):
        self.assertEqual(
            nova_voice.resolve_nova_voice_provider(
                {"NOVA_VOICE_PROVIDER": "off", "GROK_API_KEY": "xai-secret"}
            ),
            "browser",
        )

    def test_text_flag_skips_voice(self):
        self.assertEqual(
            nova_voice.resolve_nova_voice_provider(
                {"NOVA_VOICE_PROVIDER": "text", "GROK_API_KEY": "xai-secret"}
            ),
            "text",
        )

    def test_unknown_voice_id_is_not_used(self):
        self.assertEqual(nova_voice.nova_voice_id({"NOVA_GROK_VOICE": "library-voice"}), "ara")
        self.assertEqual(nova_voice.nova_voice_id({"NOVA_GROK_VOICE": "Ara"}), "ara")

    def test_public_session_does_not_include_the_api_key(self):
        body = nova_voice.public_session("xai-realtime-client-secret-abc", 1700000000, "ara")
        blob = str(body)
        self.assertNotIn("xai-secret", blob)
        self.assertNotIn("GROK_API_KEY", blob)
        self.assertEqual(body["provider"], "grok")
        self.assertEqual(body["language"], "es-ES")
        self.assertEqual(body["voice"], "ara")
        self.assertIn(nova_voice.NOVA_GREETING, body["instructions"])
        self.assertIn("es-ES", body["instructions"])
        self.assertIn("acento neutro de España", body["instructions"])
        self.assertIn(
            "No uses acento andaluz, malagueño ni de ninguna otra región.",
            body["instructions"],
        )
        self.assertNotIn("acento malagueño", body["instructions"])
        self.assertIn("29 € al mes", body["instructions"])
        self.assertIn("Reglamento de IA", body["instructions"])
        self.assertNotIn("[", body["instructions"])
        self.assertIn("xAI Grok Voice", body["instructions"])
        self.assertIn("La voz es ara.", body["instructions"])
        self.assertIn("https://sistemamaestro.com", body["instructions"])
        self.assertIn("https://sistemamaestro.com/privacy", body["instructions"])
        self.assertIn("privacidad@sistemamaestro.com", body["instructions"])
        self.assertIn(
            "Los datos los trata Sistema Maestro; tienes todos los detalles y el contacto de privacidad en sistemamaestro.com/privacy.",
            body["instructions"],
        )
        self.assertIn(
            "No hay fecha de cierre, cupo ni oferta que termine. Nunca uses urgencia.",
            body["instructions"],
        )
        self.assertIn(
            "No te voy a presionar con una fecha que no tengo.",
            body["instructions"],
        )
        self.assertNotIn("solo quedan", body["instructions"].lower())
        self.assertNotIn("acaba hoy", body["instructions"].lower())
        self.assertIn("no es un cliente real", body["instructions"])
        self.assertIn("una clínica pequeña podría entrar Gratis", body["instructions"])
        self.assertIn("un comercio o restaurante de barrio podría entrar Gratis", body["instructions"])
        self.assertNotIn("session", body["websocket_url"])

    def test_rate_limit(self):
        limiter = nova_voice.RateLimiter(limit=2, window_seconds=10)
        self.assertTrue(limiter.allow("203.0.113.5", now=100))
        self.assertTrue(limiter.allow("203.0.113.5", now=101))
        self.assertFalse(limiter.allow("203.0.113.5", now=102))
        self.assertTrue(limiter.allow("203.0.113.5", now=120))


class _Response:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class _Client:
    def __init__(self, response):
        self.response = response
        self.calls = []

    async def post(self, url, headers=None, json=None):
        self.calls.append((url, headers, json))
        return self.response


class MintTests(unittest.TestCase):
    def test_mint_uses_client_secrets_without_a_session_field(self):
        client = _Client(_Response(200, {"value": "xai-realtime-client-secret-abc", "expires_at": 1700000000}))
        result = asyncio.run(nova_voice.mint_ephemeral_token("super-secret-key", client=client))
        self.assertEqual(result["token"], "xai-realtime-client-secret-abc")
        self.assertEqual(result["expires_at"], 1700000000)
        url, headers, body = client.calls[0]
        self.assertEqual(url, nova_voice.XAI_CLIENT_SECRETS_URL)
        self.assertEqual(headers["Authorization"], "Bearer super-secret-key")
        self.assertEqual(body, {"expires_after": {"seconds": 60}})
        self.assertNotIn("session", body)
        self.assertNotIn("super-secret-key", result["token"])

    def test_mint_refuses_to_return_the_api_key(self):
        client = _Client(_Response(200, {"value": "super-secret-key", "expires_at": 1}))
        with self.assertRaises(nova_voice.NovaVoiceUnavailable):
            asyncio.run(nova_voice.mint_ephemeral_token("super-secret-key", client=client))

    def test_mint_upstream_error_is_unavailable(self):
        client = _Client(_Response(401, {"error": "nope"}))
        with self.assertRaises(nova_voice.NovaVoiceUnavailable):
            asyncio.run(nova_voice.mint_ephemeral_token("k", client=client))


class DiagTests(unittest.TestCase):
    def test_diag_drops_tokens_and_unknown_fields(self):
        clean = nova_voice.sanitize_nova_diag(
            {
                "stage": "ws",
                "http_status": 503,
                "ws_code": 1006,
                "ws_reason": "bye",
                "message": "Bearer super-secret-key xai-realtime-client-secret-abc",
                "token": "xai-realtime-client-secret-abc",
                "email": "lucas@example.com",
            }
        )
        self.assertEqual(clean["stage"], "ws")
        self.assertEqual(clean["http_status"], 503)
        self.assertEqual(clean["ws_code"], 1006)
        self.assertNotIn("super-secret-key", clean["message"])
        self.assertNotIn("xai-realtime", clean["message"])
        self.assertNotIn("token", clean)
        self.assertNotIn("email", clean)
        self.assertEqual(set(clean), {"stage", "http_status", "ws_code", "ws_reason", "message"})


if __name__ == "__main__":
    unittest.main()
