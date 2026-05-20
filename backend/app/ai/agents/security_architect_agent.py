"""
security_architect_agent.py

Agente fase 1 de seguridad de Sistema Maestro.
Función pura: clasifica riesgos y gates; no toca secretos ni runtime.
"""

from dataclasses import dataclass, asdict, field
from typing import Any, Dict, List


AGENT_KEY = "security_architect_agent"
AGENT_PHASE = "phase_1_minimal"


@dataclass(frozen=True)
class SecurityFinding:
    agent_key: str
    phase: str
    status: str
    risk_level: str
    findings: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    next_actions: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    confidence: float = 0.75
    meta: Dict[str, Any] = field(default_factory=dict)


def run_security_architect_agent(context: Dict[str, Any]) -> Dict[str, Any]:
    touched_surfaces = set(context.get("touched_surfaces") or [])
    sensitive = {"auth", "payments", "tokens", "sessions", "production", "deploy"}
    flags = sorted(touched_surfaces.intersection(sensitive))

    risk_level = "low"
    if len(flags) == 1:
        risk_level = "medium"
    elif len(flags) > 1:
        risk_level = "high"

    finding = SecurityFinding(
        agent_key=AGENT_KEY,
        phase=AGENT_PHASE,
        status="reviewed",
        risk_level=risk_level,
        findings=[
            "Acciones sensibles requieren guard explícito y traza.",
            "No deben exponerse secretos ni variables en salidas de agentes.",
        ],
        recommendations=[
            "Bloquear deploy, pagos y auth si no hay autorización explícita.",
            "Mantener trazas mínimas sin datos sensibles.",
        ],
        next_actions=["aplicar_policy_security_cost_guards_en_flujos_vivos"],
        warnings=[f"sensitive_surface:{flag}" for flag in flags],
        meta={"touched_surfaces": sorted(touched_surfaces)},
    )
    return asdict(finding)
