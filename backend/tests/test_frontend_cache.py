import unittest

from backend.app.services.frontend_cache import IMMUTABLE, NO_STORE, cache_control_for


class FrontendCacheTests(unittest.TestCase):
    def test_html_is_not_stored(self):
        self.assertEqual(cache_control_for("index.html"), NO_STORE)
        self.assertEqual(cache_control_for(""), NO_STORE)
        self.assertIn("no-cache", cache_control_for("index.html"))
        self.assertIn("no-store", cache_control_for("/"))

    def test_hashed_assets_are_immutable(self):
        header = cache_control_for("assets/index-DbSb2sQE.js")
        self.assertEqual(header, IMMUTABLE)
        self.assertIn("immutable", cache_control_for("assets/index-knBNG0H0.css"))

    def test_root_slash_is_not_an_asset(self):
        self.assertNotIn("immutable", cache_control_for("/"))


if __name__ == "__main__":
    unittest.main()
