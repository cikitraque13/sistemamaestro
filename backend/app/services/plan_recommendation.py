from typing import Any, Dict, Optional


def build_plan_recommendation(
    input_type: str,
    input_content: str,
    analysis: Dict[str, Any],
    url_analysis: Optional[Dict[str, Any]] = None,
    refine_answers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    raise NotImplementedError("Plan recommendation service not migrated yet")
