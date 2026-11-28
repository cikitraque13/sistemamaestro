"""One quality rubric for the loop judge. The threshold is a versioned constant."""

from backend.app.services.builder_copy_rubric import critique_copy, draft_text, fold

EVAL_RUBRIC_VERSION = "builder-eval-v1"
EVAL_CRITERIA = ("visual_hierarchy", "selling_microcopy", "objections", "specificity")
EVAL_PASS_THRESHOLD = 12
EVAL_CRITERION_MAX = 5

_OBJECTION_WORDS = ("duda", "precio", "miedo", "primera", "plazo", "objec", "cita", "reserva", "paso")


def _clamp(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return max(0, min(EVAL_CRITERION_MAX, int(value)))


def model_scores(verdict) -> dict | None:
    raw = (verdict or {}).get("scores")
    if not isinstance(raw, dict):
        return None
    cleaned = {}
    for key in EVAL_CRITERIA:
        value = _clamp(raw.get(key))
        if value is None:
            return None
        cleaned[key] = value
    return cleaned


def deterministic_scores(draft, context) -> dict:
    """Floor used when the judge omits scores, and the fixture the tests pin."""
    critique = critique_copy(draft, context)
    text = draft_text(draft)
    sections = [item for item in (draft or {}).get("sections") or [] if isinstance(item, dict)]
    titles = [fold(item.get("title")).strip() for item in sections if fold(item.get("title")).strip()]
    distinct = len(titles) == len(set(titles)) and len(titles) >= 1
    has_header = bool(fold((draft or {}).get("title")).strip() and fold((draft or {}).get("subtitle")).strip() and fold((draft or {}).get("cta")).strip())
    if not critique["ok"]:
        visual = 1 if has_header else 0
        micro = 0
        objections = 0
        specificity = 0
    else:
        visual = 5 if distinct and has_header and len(titles) >= 2 else (4 if distinct and has_header else 2)
        micro = 5 if has_header else 1
        objections = 4 if any(word in text for word in _OBJECTION_WORDS) else 2
        specificity = 5
    scores = {
        "visual_hierarchy": visual,
        "selling_microcopy": micro,
        "objections": objections,
        "specificity": specificity,
    }
    return {"scores": scores, "total": sum(scores.values())}


def evaluation_from_verdict(verdict, draft, context) -> dict:
    """The loop's single judge result. A low total cannot pass."""
    critique = critique_copy(draft, context)
    scores = model_scores(verdict) or deterministic_scores(draft, context)["scores"]
    if not critique["ok"]:
        scores = {**scores, "specificity": 0}
    total = sum(scores[key] for key in EVAL_CRITERIA)
    model_ok = isinstance(verdict, dict) and verdict.get("ok") is True
    passed = bool(model_ok and critique["ok"] and total >= EVAL_PASS_THRESHOLD)
    return {
        "rubricVersion": EVAL_RUBRIC_VERSION,
        "threshold": EVAL_PASS_THRESHOLD,
        "scores": {key: scores[key] for key in EVAL_CRITERIA},
        "total": total,
        "passed": passed,
    }


def assert_score_record(evaluation) -> None:
    """Raise ValueError when a stored score would pass below the threshold."""
    if not isinstance(evaluation, dict):
        raise ValueError("missing evaluation")
    if evaluation.get("threshold") != EVAL_PASS_THRESHOLD:
        raise ValueError("threshold drifted")
    if evaluation.get("rubricVersion") != EVAL_RUBRIC_VERSION:
        raise ValueError("rubric drifted")
    scores = evaluation.get("scores")
    if not isinstance(scores, dict):
        raise ValueError("missing scores")
    values = []
    for key in EVAL_CRITERIA:
        value = scores.get(key)
        if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= EVAL_CRITERION_MAX:
            raise ValueError("bad score")
        values.append(value)
    total = evaluation.get("total")
    if total != sum(values):
        raise ValueError("total mismatch")
    if evaluation.get("passed") is True and total < EVAL_PASS_THRESHOLD:
        raise ValueError("passed below threshold")
