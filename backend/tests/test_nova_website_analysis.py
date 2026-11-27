import asyncio
import json
import unittest
from unittest.mock import patch

from fastapi.responses import JSONResponse

from backend.app.routers import nova_voice as voice_router
from backend.app.services.nova_voice import RateLimiter


class _Client:
    def __init__(self, host):
        self.host = host


class _Request:
    def __init__(self, host):
        self.headers = {}
        self.client = _Client(host)


class _Memory:
    def __init__(self, fail=False):
        self.docs = []
        self.fail = fail

    async def insert_one(self, doc):
        if self.fail:
            raise RuntimeError("store down")
        self.docs.append(dict(doc))
        return {"inserted_id": "1"}


def _body(result):
    if isinstance(result, JSONResponse):
        return result.status_code, json.loads(result.body)
    return 200, result


class WebsiteAnalysisEndpointTests(unittest.TestCase):
    def setUp(self):
        self.memory = _Memory()
        voice_router._analysis_limiter = RateLimiter(limit=5, window_seconds=600)
        self.collection = patch.object(
            voice_router, "analysis_requests_collection", return_value=self.memory
        )
        self.collection.start()

    def tearDown(self):
        self.collection.stop()

    def _post(self, host="203.0.113.20", **fields):
        payload = {
            "business_name": "Creative Flow",
            "website_url": "https://creativeflow.example",
            "contact": "",
            "consent": False,
        }
        payload.update(fields)
        body = voice_router.WebsiteAnalysisIn(**payload)
        result = asyncio.run(
            voice_router.nova_website_analysis(body, _Request(host))
        )
        return _body(result)

    def test_valid_url_is_stored_as_queued(self):
        status, body = self._post(
            contact="lucas@example.com",
            consent=True,
            website_url="creativeflow.example/servicios",
        )
        self.assertEqual(status, 200)
        self.assertTrue(body["registered"])
        self.assertEqual(body["status"], "queued")
        self.assertTrue(body["contact_stored"])
        self.assertIn("queda registrado para el análisis", body["message"])
        self.assertNotIn("lucas@example.com", body["message"])
        self.assertEqual(len(self.memory.docs), 1)
        stored = self.memory.docs[0]
        self.assertEqual(stored["business_name"], "Creative Flow")
        self.assertEqual(stored["url"], "https://creativeflow.example/servicios")
        self.assertEqual(stored["contact"], "lucas@example.com")
        self.assertTrue(stored["consent"])
        self.assertEqual(stored["source"], "nova_voice")
        self.assertEqual(stored["status"], "queued")
        self.assertIn("T", stored["created_at"])

    def test_invalid_url_is_rejected_and_not_stored(self):
        websites = (
            "http://127.0.0.1",
            "http://localhost",
            "http://10.1.1.1",
            "notaurl",
            "javascript:alert(1)",
            "",
            "https://user:pass@creativeflow.example",
        )
        for index, website in enumerate(websites):
            with self.subTest(website=website):
                status, body = self._post(host=f"203.0.113.{50 + index}", website_url=website)
                self.assertEqual(status, 400, body)
                self.assertFalse(body["registered"])
                self.assertEqual(body["detail"], "invalid_url")
        self.assertEqual(self.memory.docs, [])

    def test_storage_failure_does_not_claim_registration(self):
        self.memory.fail = True
        status, body = self._post(host="203.0.113.40", contact="+34 600 000 000", consent=True)
        self.assertEqual(status, 503)
        self.assertFalse(body["registered"])
        self.assertEqual(body["detail"], "store_failed")
        self.assertIn("No digas que quedó registrada", body["message"])
        self.assertEqual(self.memory.docs, [])

    def test_contact_without_consent_is_not_stored(self):
        status, body = self._post(
            host="203.0.113.41",
            contact="lucas@example.com",
            consent=False,
        )
        self.assertEqual(status, 200)
        self.assertTrue(body["registered"])
        self.assertFalse(body["contact_stored"])
        stored = self.memory.docs[0]
        self.assertEqual(stored["contact"], "")
        self.assertFalse(stored["consent"])
        self.assertNotIn("lucas@example.com", json.dumps(body))


if __name__ == "__main__":
    unittest.main()
