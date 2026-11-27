"""Owner project list: indexed sort, summary projection, pages past 100."""
import os
import unittest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-jwt-secret-value-32chars-min")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

from backend.app.routers import projects as projects_router


INTERNAL_FIELDS = (
    "j06_1_operation_receipts",
    "active_j06_1_intent",
    "j06_2_plan",
    "history",
    "diagnosis",
    "analysis_consumption",
    "url_analysis",
    "refine_questions",
    "refine_answers",
    "blueprint",
    "plan_recommendation",
    "user_id",
)


def _matches(doc, query):
    for key, expected in query.items():
        if key == "$or":
            if not any(_matches(doc, branch) for branch in expected):
                return False
            continue
        actual = doc.get(key)
        if isinstance(expected, dict):
            if "$lt" in expected and not (actual is not None and actual < expected["$lt"]):
                return False
            continue
        if actual != expected:
            return False
    return True


class _Cursor:
    def __init__(self, docs):
        self.docs = list(docs)
        self.spec = None
        self.cap = None

    def sort(self, spec):
        self.spec = spec
        if spec == [("created_at", -1), ("project_id", -1)]:
            self.docs.sort(key=lambda doc: (doc.get("created_at") or "", doc.get("project_id") or ""), reverse=True)
        return self

    def limit(self, length):
        self.cap = length
        return self

    async def to_list(self, length=None):
        cap = self.cap if length is None else length if self.cap is None else min(self.cap, length)
        return [self._project(doc) for doc in self.docs[:cap]]

    def _project(self, doc):
        return {key: doc[key] for key in doc if self.projection.get(key) == 1}


class _Projects:
    def __init__(self, documents):
        self.documents = documents
        self.queries = []
        self.cursors = []

    def find(self, query, projection):
        self.queries.append((query, projection))
        cursor = _Cursor(doc for doc in self.documents if _matches(doc, query))
        cursor.projection = projection
        self.cursors.append(cursor)
        return cursor


class _Response:
    def __init__(self):
        self.headers = {}


def _project(owner, number, created_at=None):
    stamp = created_at or f"2026-11-{(number % 27) + 1:02d}T12:{number % 60:02d}:{number % 60:02d}+00:00"
    return {
        "project_id": f"proj_{owner}_{number:04d}",
        "user_id": owner,
        "input_content": f"Idea {number} for {owner}",
        "input_url": f"https://example.test/{number}",
        "input_type": "text",
        "status": "analyzed",
        "route": "idea",
        "created_at": stamp,
        "updated_at": stamp,
        "j06_1_operation_receipts": [{"response": {"history": f"full-body-{number}"}, "scope_key": f"k{number}"}],
        "active_j06_1_intent": {"history": [{"superseded_value": f"old-{number}"}], "text": "secret intent"},
        "j06_2_plan": {"history": [f"plan-{number}"], "status": "DRAFT"},
        "history": [{"event": "internal"}],
        "diagnosis": {"summary": "internal diagnosis"},
        "analysis_consumption": {"trace": {"operation_id": "secret"}},
        "url_analysis": "full fetched page",
        "refine_questions": [{"id": "q", "question": "internal"}],
        "refine_answers": {"q": "internal"},
        "blueprint": {"steps": ["internal"]},
        "plan_recommendation": {"score_total": number},
    }


class ProjectListingTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.owner = "user_owner"
        self.response = _Response()
        self.request = object()

    async def _list(self, documents, user_id, limit=None, cursor=None):
        collection = _Projects(documents)
        db = type("DB", (), {"projects": collection})()
        with patch.object(projects_router, "db", db), patch.object(
            projects_router, "get_current_user", new=AsyncMock(return_value={"user_id": user_id})
        ):
            listed = await projects_router.get_projects(self.request, self.response, limit=limit, cursor=cursor)
        return listed, collection

    async def test_more_than_100_projects_come_back_in_one_default_page(self):
        documents = [_project(self.owner, number) for number in range(120)]
        documents.extend(_project("someone_else", number) for number in range(7))
        listed, collection = await self._list(documents, self.owner)
        self.assertIsInstance(listed, list)
        self.assertEqual(len(listed), 120)
        self.assertEqual(
            [item["project_id"] for item in listed],
            [doc["project_id"] for doc in sorted(documents[:120], key=lambda doc: (doc["created_at"], doc["project_id"]), reverse=True)],
        )
        self.assertTrue(all(not item["project_id"].startswith("proj_someone_else_") for item in listed))
        self.assertEqual(collection.queries[0][0], {"user_id": self.owner})
        self.assertEqual(collection.queries[0][1], projects_router._PROJECT_LIST_PROJECTION)
        self.assertEqual(collection.cursors[0].spec, projects_router._PROJECT_LIST_SORT)
        self.assertEqual(collection.cursors[0].cap, projects_router.DEFAULT_PROJECT_LIST_LIMIT + 1)

    async def test_projection_drops_internal_history_and_keeps_list_fields(self):
        document = _project(self.owner, 1, created_at="2026-11-02T00:00:00+00:00")
        listed, _collection = await self._list([document], self.owner)
        self.assertEqual(len(listed), 1)
        item = listed[0]
        for field in INTERNAL_FIELDS:
            self.assertNotIn(field, item)
        self.assertEqual(set(item), set(projects_router.PROJECT_LIST_SUMMARY_FIELDS))
        self.assertEqual(item["input_content"], document["input_content"])
        self.assertEqual(item["input_url"], document["input_url"])
        self.assertEqual(item["status"], "analyzed")
        self.assertEqual(item["route"], "idea")
        self.assertEqual(item["created_at"], document["created_at"])
        self.assertEqual(item["updated_at"], document["updated_at"])
        self.assertNotIn("full-body-1", str(item))
        self.assertNotIn("secret", str(item))

    async def test_other_user_sees_only_their_projects(self):
        documents = [_project(self.owner, number) for number in range(101)]
        documents.append(_project("other_user", 1, created_at="2026-12-01T00:00:00+00:00"))
        owner_page, _owner_query = await self._list(documents, self.owner)
        self.response = _Response()
        other_page, _other_query = await self._list(documents, "other_user")
        self.assertEqual(len(owner_page), 101)
        self.assertEqual(len(other_page), 1)
        self.assertEqual(other_page[0]["project_id"], "proj_other_user_0001")
        self.assertTrue(all(item["project_id"].startswith("proj_user_owner_") for item in owner_page))

    async def test_cursor_pages_cover_every_project_past_the_page_size(self):
        documents = [_project(self.owner, number, created_at=f"2026-01-01T00:00:{number % 60:02d}+00:00") for number in range(250)]
        # Same timestamp for the first two ids exercises the project_id tie-break.
        documents[0]["created_at"] = "2026-06-01T00:00:00+00:00"
        documents[1]["created_at"] = "2026-06-01T00:00:00+00:00"
        first, _collection = await self._list(documents, self.owner, limit=200)
        self.assertEqual(len(first), 200)
        token = self.response.headers["X-Next-Cursor"]
        self.response = _Response()
        second, _again = await self._list(documents, self.owner, limit=200, cursor=token)
        self.assertEqual(len(second), 50)
        self.assertNotIn("X-Next-Cursor", self.response.headers)
        seen = [item["project_id"] for item in first + second]
        self.assertEqual(len(seen), len(set(seen)))
        self.assertEqual(set(seen), {doc["project_id"] for doc in documents})
        tied = [item["project_id"] for item in first + second if item["created_at"] == "2026-06-01T00:00:00+00:00"]
        self.assertEqual(tied, sorted(tied, reverse=True))

    async def test_invalid_limit_and_cursor_rejected(self):
        documents = [_project(self.owner, 1)]
        for limit in (0, 201, True):
            with self.assertRaises(projects_router.HTTPException) as error:
                await self._list(documents, self.owner, limit=limit)
            self.assertEqual(error.exception.status_code, 422)
            self.assertEqual(error.exception.detail["code"], "invalid_project_list_limit")
        with self.assertRaises(projects_router.HTTPException) as error:
            await self._list(documents, self.owner, cursor="not-a-cursor")
        self.assertEqual(error.exception.status_code, 422)
        self.assertEqual(error.exception.detail["code"], "invalid_project_cursor")

    def test_startup_creates_owner_created_at_index(self):
        import ast
        from pathlib import Path

        source = Path(__file__).parents[1].joinpath("app", "main.py").read_text(encoding="utf-8-sig")
        tree = ast.parse(source)
        startup = next(
            node for node in tree.body
            if isinstance(node, ast.AsyncFunctionDef) and node.name == "startup_event"
        )
        indexes = []
        for node in ast.walk(startup):
            if not isinstance(node, ast.Call) or not isinstance(node.func, ast.Attribute):
                continue
            if node.func.attr != "create_index" or not node.args:
                continue
            indexes.append(ast.literal_eval(node.args[0]))
        self.assertIn([("user_id", 1), ("created_at", -1), ("project_id", -1)], indexes)


if __name__ == "__main__":
    unittest.main()
