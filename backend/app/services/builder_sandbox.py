"""In-app draft boundary for one executor build.

The build can load and save its own draft on builder_landing_states. It does
not receive the publications collection and it cannot mark a page published.
assert_promotable is the rule a later publish change can call. This front
does not edit the publish service.

A separate worker or an ephemeral container is not started here. That would
be a new Railway service (CPU, memory and egress on every build). The design
and the cost are a decision for Lucas; see docs/builder/EXECUTOR_SANDBOX.md.
"""
from backend.app.services.builder_evaluation import (
    EVAL_CRITERIA,
    EVAL_CRITERION_MAX,
    EVAL_PASS_THRESHOLD,
    EVAL_RUBRIC_VERSION,
)


class DraftBoundary:
    """The only store handle the preview stream is given."""

    def __init__(self, projects, landings, owner_id, project_id, *, load, save):
        self.projects = projects
        self.landings = landings
        self.owner_id = owner_id
        self.project_id = project_id
        self._load = load
        self._save = save

    async def load(self):
        from backend.app.services.builder_landing_state import LandingStateError

        try:
            loaded = await self._load(self.projects, self.landings, self.owner_id, self.project_id)
        except LandingStateError:
            return None
        if not isinstance(loaded, dict):
            return None
        return loaded.get("preview")

    async def save(self, preview):
        if not isinstance(preview, dict) or preview.get("stage") == "published":
            from backend.app.services.builder_landing_state import LandingStateError

            raise LandingStateError("invalid_record", 422)
        return await self._save(self.projects, self.landings, self.owner_id, self.project_id, preview)


class PromotionBlocked(Exception):
    code = "evaluation_required"


def assert_promotable(version: dict) -> None:
    """Refuse promotion when the stored evaluation missed the current bar."""
    evaluation = version.get("evaluation") if isinstance(version, dict) else None
    scores = evaluation.get("scores") if isinstance(evaluation, dict) else None
    values = []
    if isinstance(scores, dict):
        for key in EVAL_CRITERIA:
            value = scores.get(key)
            if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= EVAL_CRITERION_MAX:
                values = []
                break
            values.append(value)
    total = evaluation.get("total") if isinstance(evaluation, dict) else None
    passed = (
        isinstance(evaluation, dict)
        and evaluation.get("passed") is True
        and evaluation.get("rubricVersion") == EVAL_RUBRIC_VERSION
        and evaluation.get("threshold") == EVAL_PASS_THRESHOLD
        and len(values) == len(EVAL_CRITERIA)
        and total == sum(values)
        and total >= EVAL_PASS_THRESHOLD
    )
    if not passed:
        raise PromotionBlocked("La versión no ha superado la evaluación. No se ha publicado.")
