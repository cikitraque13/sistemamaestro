"""
cost_guard.py

Guard puente de coste.
Sin integración de tokens o créditos todavía.
"""

from dataclasses import dataclass, asdict
from typing import Dict


@dataclass(frozen=True)
class CostAssessment:
    level: str
    action: str
    reason: str


def assess_cost(meta: Dict[str, object]) -> Dict[str, object]:
    estimated_units = int(meta.get("estimated_units", 0) or 0)

    if estimated_units >= 10000:
        assessment = CostAssessment(
            level="high",
            action="require_explicit_approval",
            reason="estimated_cost_too_high",
        )
    elif estimated_units >= 2500:
        assessment = CostAssessment(
            level="medium",
            action="allow_with_trace",
            reason="estimated_cost_moderate",
        )
    else:
        assessment = CostAssessment(
            level="low",
            action="allow",
            reason="estimated_cost_low",
        )

    return asdict(assessment)