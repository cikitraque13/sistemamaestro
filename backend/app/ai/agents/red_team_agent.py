"""
red_team_agent.py

Agente puente de seguridad adversarial defensiva.
No ejecuta ataques.
No interactua con produccion.
No tiene logica viva todavia.
"""

from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple


AGENT_KEY = "red_team_agent"
AGENT_ROLE = "adversarial_security"
AGENT_PHASE = "next"


@dataclass(frozen=True)
class RedTeamFinding:
    vector: str
    severity: str
    affected_surface: str
    recommended_mitigation: str
    requires_human_review: bool


ALLOWED_TOOLS: Tuple[str, ...] = (
    "policy_validator",
    "session_audit",
    "abuse_patterns",
    "output_sampler",
    "consistency_checker",
)

FORBIDDEN_DOMAINS: Tuple[str, ...] = (
    "repo_writer",
    "autonomous_deploy",
    "live_attack_execution",
    "payment_mutation",
    "production_access",
)


def get_red_team_manifest() -> Dict[str, object]:
    return {
        "key": AGENT_KEY,
        "role": AGENT_ROLE,
        "phase": AGENT_PHASE,
        "mission": "Detect hostile patterns, abuse vectors and security gaps from a defensive adversarial perspective.",
        "allowed_tools": list(ALLOWED_TOOLS),
        "forbidden_domains": list(FORBIDDEN_DOMAINS),
        "output_type": "red_team_findings",
    }


def build_red_team_finding(
    vector: str,
    severity: str,
    affected_surface: str,
    recommended_mitigation: str,
    requires_human_review: bool = True,
) -> Dict[str, object]:
    finding = RedTeamFinding(
        vector=vector,
        severity=severity,
        affected_surface=affected_surface,
        recommended_mitigation=recommended_mitigation,
        requires_human_review=requires_human_review,
    )
    return asdict(finding)