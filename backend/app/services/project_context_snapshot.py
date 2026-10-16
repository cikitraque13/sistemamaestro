"""Build an ephemeral, owner-authorized J04 project context snapshot."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict


CONTEXT_USE_SELECTORS = frozenset({
    "project_overview",
    "recommendation_review",
    "formatting_only",
})
SCORE_FIELDS = (
    "complexity",
    "economic_impact",
    "urgency",
    "structure_need",
    "continuity_need",
)


class ProjectContextSnapshotError(ValueError):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


def _revision(project: Dict[str, Any]) -> str:
    if "updated_at" not in project:
        return "0"
    value = project.get("updated_at")
    if not isinstance(value, str) or not value or value != value.strip():
        raise ProjectContextSnapshotError("invalid_project_revision")
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as exc:
        raise ProjectContextSnapshotError("invalid_project_revision") from exc
    if parsed.tzinfo is None:
        raise ProjectContextSnapshotError("invalid_project_revision")
    return value


def _required_text(project: Dict[str, Any], field: str, max_length: int) -> str:
    value = project.get(field)
    if not isinstance(value, str) or not value or len(value) > max_length:
        raise ProjectContextSnapshotError("invalid_project_context_source")
    return value


def _item(field: str, value: Any, revision: str, provenance: str) -> Dict[str, Any]:
    return {
        "field": field,
        "value": value,
        "source": f"project.{field}",
        "provenance": provenance,
        "revision": revision,
    }


def build_project_context_snapshot(
    project: Dict[str, Any],
    *,
    project_id: str,
    expected_revision: str,
    context_use: str,
) -> Dict[str, Any]:
    """Select only closed, source-backed fields from an already authorized project."""
    if not isinstance(context_use, str) or context_use not in CONTEXT_USE_SELECTORS:
        raise ProjectContextSnapshotError("invalid_project_context_selector")
    if not isinstance(project, dict) or project.get("project_id") != project_id:
        raise ProjectContextSnapshotError("invalid_project_identity")

    actual_revision = _revision(project)
    if actual_revision != expected_revision:
        raise ProjectContextSnapshotError("stale_project_revision")

    items = []
    if context_use == "project_overview":
        input_type = _required_text(project, "input_type", 4)
        if input_type not in {"text", "url"}:
            raise ProjectContextSnapshotError("invalid_project_context_source")
        items.append(_item("input_type", input_type, actual_revision, "user_supplied"))
        items.append(_item(
            "input_content",
            _required_text(project, "input_content", 50_000),
            actual_revision,
            "user_supplied",
        ))
        items.append(_item(
            "route",
            _required_text(project, "route", 80),
            actual_revision,
            "persisted_derived",
        ))
    elif context_use == "recommendation_review":
        items.append(_item(
            "route",
            _required_text(project, "route", 80),
            actual_revision,
            "persisted_derived",
        ))
        recommendation = project.get("plan_recommendation")
        if recommendation is not None and not isinstance(recommendation, dict):
            raise ProjectContextSnapshotError("invalid_project_context_source")
        scores = recommendation.get("scores") if recommendation is not None else None
        if scores is not None and not isinstance(scores, dict):
            raise ProjectContextSnapshotError("invalid_project_context_source")
        for field in SCORE_FIELDS:
            if scores is None or field not in scores:
                continue
            value = scores[field]
            if type(value) is not int or value < 0 or value > 4:
                raise ProjectContextSnapshotError("invalid_project_context_source")
            items.append(_item(
                f"plan_recommendation.scores.{field}",
                value,
                actual_revision,
                "persisted_derived",
            ))

    return {
        "schemaVersion": "J04_PROJECT_CONTEXT_SNAPSHOT_V1",
        "projectId": project_id,
        "revision": actual_revision,
        "selector": context_use,
        "items": items,
    }
