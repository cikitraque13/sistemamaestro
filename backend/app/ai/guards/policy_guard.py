"""
policy_guard.py

Capa puente de política.
No bloquea runtime todavía.
"""

from dataclasses import dataclass, asdict
from typing import Dict, List


@dataclass(frozen=True)
class PolicyDecision:
    allowed: bool
    reason: str
    blocked_domains: List[str]


DEFAULT_POLICY = {
    "discovery_agent": [],
    "audit_agent": [],
    "report_agent": [],
    "system_architect_agent": ["payments"],
    "builder_agent": ["pricing_strategy", "autonomous_deploy"],
    "rescue_sre_agent": ["ux_redesign", "pricing_strategy"],
    "security_architect_agent": ["general_ui_build"],
    "growth_agent": ["runtime_patch"],
    "cro_agent": ["backend_runtime", "auth_security"],
    "seo_architect_agent": ["payments", "runtime_patch"],
    "deploy_agent": ["pricing_strategy", "ui_copy"],
    "algorithmic_auditor_agent": ["code_write", "deploy", "payments"],
}


def evaluate_policy(agent_key: str, target_domain: str) -> Dict[str, object]:
    blocked = DEFAULT_POLICY.get(agent_key, [])
    allowed = target_domain not in blocked
    decision = PolicyDecision(
        allowed=allowed,
        reason="allowed" if allowed else "blocked_by_policy",
        blocked_domains=blocked,
    )
    return asdict(decision)