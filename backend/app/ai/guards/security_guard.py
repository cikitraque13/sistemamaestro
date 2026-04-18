"""
security_guard.py

Guard puente de seguridad.
Sin detección viva todavía.
"""

from dataclasses import dataclass, asdict
from typing import Dict, List


@dataclass(frozen=True)
class SecurityAssessment:
    risk_level: str
    flags: List[str]
    action: str


def assess_security_context(context: Dict[str, object]) -> Dict[str, object]:
    flags: List[str] = []

    if context.get("touches_auth"):
        flags.append("auth_surface")
    if context.get("touches_payments"):
        flags.append("payment_surface")
    if context.get("touches_tokens"):
        flags.append("token_surface")
    if context.get("touches_user_sessions"):
        flags.append("session_surface")

    if not flags:
        assessment = SecurityAssessment(
            risk_level="low",
            flags=[],
            action="allow_with_trace",
        )
    elif len(flags) == 1:
        assessment = SecurityAssessment(
            risk_level="medium",
            flags=flags,
            action="require_security_review",
        )
    else:
        assessment = SecurityAssessment(
            risk_level="high",
            flags=flags,
            action="require_explicit_security_gate",
        )

    return asdict(assessment)