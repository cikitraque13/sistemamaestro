"""The executor draft boundary cannot publish, and a low score cannot be promoted."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-that-is-at-least-32")

import asyncio
import inspect
from pathlib import Path

from backend.app.services.builder_evaluation import EVAL_PASS_THRESHOLD, EVAL_RUBRIC_VERSION
from backend.app.services.builder_landing_state import save_generated_preview
from backend.app.services.builder_sandbox import DraftBoundary, PromotionBlocked, assert_promotable

ROOT = Path(__file__).resolve().parents[2]


class Projects:
    async def find_one(self, query, projection=None):
        if query.get("project_id") == "proj_clara" and query.get("user_id") == "alice":
            return {"project_id": "proj_clara"}
        return None


class Landings:
    def __init__(self):
        self.documents = []

    async def find_one(self, query, projection=None):
        return None

    async def update_one(self, query, update, upsert=False):
        self.documents.append(update["$set"])


class Publications:
    def __init__(self):
        self.touched = False

    def __getattr__(self, name):
        self.touched = True
        raise AssertionError("the draft boundary touched publications")


def _passing():
    scores = {"visual_hierarchy": 4, "selling_microcopy": 4, "objections": 4, "specificity": 4}
    return {
        "rubricVersion": EVAL_RUBRIC_VERSION,
        "threshold": EVAL_PASS_THRESHOLD,
        "scores": scores,
        "total": sum(scores.values()),
        "passed": True,
    }


def test_executor_sources_do_not_reference_publications():
    for relative in (
        "backend/app/services/builder_executor.py",
        "backend/app/services/builder_claude_loop.py",
        "backend/app/services/builder_sandbox.py",
        "backend/app/routers/builder_preview.py",
    ):
        text = (ROOT / relative).read_text()
        assert "builder_publications" not in text
        assert "publish_project" not in text


def test_boundary_saves_a_draft_and_cannot_promote_a_low_score():
    publications = Publications()
    landings = Landings()
    preview = {
        "schema": "sm.builder.preview.v1",
        "ownerId": "alice",
        "projectId": "proj_clara",
        "versions": [{
            "version": 1,
            "instruction": "Clara",
            "createdAt": "2026-11-28T01:00:00+00:00",
            "html": "<h1>Clara</h1>",
            "evaluation": {"passed": False, "total": 4, "threshold": EVAL_PASS_THRESHOLD},
        }],
    }

    async def load(*_args, **_kwargs):
        return None

    async def save(projects, rows, owner_id, project_id, body):
        return await save_generated_preview(projects, rows, owner_id, project_id, body, "2026-11-28T01:00:00+00:00")

    boundary = DraftBoundary(Projects(), landings, "alice", "proj_clara", load=load, save=save)

    async def run():
        return await boundary.save(preview)

    saved = asyncio.run(run())
    assert saved["updated_at"] == "2026-11-28T01:00:00+00:00"
    assert landings.documents[0]["stage"] == "draft"
    assert publications.touched is False
    try:
        assert_promotable(preview["versions"][0])
    except PromotionBlocked as exc:
        assert exc.code == "evaluation_required"
    else:
        raise AssertionError("a low score must not be promotable")
    assert_promotable({"evaluation": _passing()})


def test_a_passed_flag_below_the_threshold_is_still_blocked():
    scores = {"visual_hierarchy": 1, "selling_microcopy": 1, "objections": 1, "specificity": 1}
    try:
        assert_promotable({"evaluation": {
            "rubricVersion": EVAL_RUBRIC_VERSION,
            "threshold": EVAL_PASS_THRESHOLD,
            "scores": scores,
            "total": 4,
            "passed": True,
        }})
    except PromotionBlocked:
        return
    raise AssertionError("passed below the threshold must stay a draft")
