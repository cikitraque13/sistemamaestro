"""Deterministic ephemeral projection of a project's user-authored refinements."""

from copy import deepcopy
from datetime import datetime
from typing import Any, Dict


class ProjectMemoryError(ValueError):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


def build_project_memory(
    project: Dict[str, Any],
    *,
    owner_id: str,
    project_id: str,
    expected_revision: str,
) -> Dict[str, Any]:
    """Project the current refine_answers map without inferring or persisting data."""
    if not isinstance(project, dict) or project.get("project_id") != project_id:
        raise ProjectMemoryError("invalid_project_identity")
    if project.get("user_id") != owner_id:
        raise ProjectMemoryError("project_owner_mismatch")

    revision = project.get("updated_at")
    if revision is None:
        revision = "0"
    elif (
        not isinstance(revision, str)
        or not revision
        or revision != revision.strip()
    ):
        raise ProjectMemoryError("invalid_project_revision")
    else:
        try:
            parsed = datetime.fromisoformat(revision)
        except ValueError as exc:
            raise ProjectMemoryError("invalid_project_revision") from exc
        if parsed.tzinfo is None:
            raise ProjectMemoryError("invalid_project_revision")

    if revision != expected_revision:
        raise ProjectMemoryError("stale_project_revision")

    answers = project.get("refine_answers", {})
    if not isinstance(answers, dict):
        raise ProjectMemoryError("invalid_project_memory_source")

    return {
        "schema_version": "project_refine_memory_v1",
        "owner_id": owner_id,
        "project_id": project_id,
        "source": "project.refine_answers",
        "provenance": "user_authored",
        "revision": revision,
        "answers": deepcopy(answers),
    }
