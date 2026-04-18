"""
abuse_guard.py

Guard puente de abuso.
Sin scoring vivo todavía.
"""

from dataclasses import dataclass, asdict
from typing import Dict


@dataclass(frozen=True)
class AbuseAssessment:
    risk_score: int
    decision: str
    reason: str


def assess_abuse(signals: Dict[str, object]) -> Dict[str, object]:
    score = 0

    if signals.get("high_frequency_requests"):
        score += 2
    if signals.get("prompt_injection_attempt"):
        score += 3
    if signals.get("suspicious_checkout_pattern"):
        score += 3
    if signals.get("repeated_guard_hits"):
        score += 2

    if score >= 5:
        assessment = AbuseAssessment(
            risk_score=score,
            decision="block_or_step_up_review",
            reason="high_risk_pattern",
        )
    elif score >= 2:
        assessment = AbuseAssessment(
            risk_score=score,
            decision="allow_with_warning",
            reason="moderate_risk_pattern",
        )
    else:
        assessment = AbuseAssessment(
            risk_score=score,
            decision="allow",
            reason="no_relevant_abuse_signals",
        )

    return asdict(assessment)