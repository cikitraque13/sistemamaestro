"""
output_guard.py

Guard puente de salida.
Valida forma mínima del output, no calidad final.
"""

from dataclasses import dataclass, asdict
from typing import Dict, List


@dataclass(frozen=True)
class OutputAssessment:
    valid: bool
    issues: List[str]
    action: str


def validate_output_shape(output_type: str, payload: Dict[str, object]) -> Dict[str, object]:
    issues: List[str] = []

    if not output_type:
        issues.append("missing_output_type")
    if not isinstance(payload, dict):
        issues.append("payload_not_dict")

    if isinstance(payload, dict) and not payload:
        issues.append("empty_payload")

    valid = len(issues) == 0

    assessment = OutputAssessment(
        valid=valid,
        issues=issues,
        action="allow" if valid else "reject_or_repair",
    )
    return asdict(assessment)