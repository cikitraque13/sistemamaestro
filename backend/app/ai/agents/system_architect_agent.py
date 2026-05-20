"""
system_architect_agent.py

Agente fase 1 de arquitectura de Sistema Maestro.
Función pura: no llama OpenAI, no escribe archivos, no toca runtime.
"""

from dataclasses import dataclass, asdict, field
from typing import Any, Dict, List


AGENT_KEY = "system_architect_agent"
AGENT_PHASE = "phase_1_minimal"


@dataclass(frozen=True)
class ArchitectureDecision:
    agent_key: str
    phase: str
    status: str
    scope: str
    findings: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    next_actions: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    confidence: float = 0.7
    meta: Dict[str, Any] = field(default_factory=dict)


def run_system_architect_agent(context: Dict[str, Any]) -> Dict[str, Any]:
    scope = str(context.get("scope") or context.get("project_id") or "sistema_maestro")
    layers = context.get("layers") or ["backend", "frontend", "builder", "ai"]

    findings = [
        "BuilderBuildState debe seguir siendo fuente de verdad.",
        "Los agentes fase 1 deben producir decisiones estructuradas, no mutaciones directas.",
    ]

    recommendations = [
        "Mantener contratos pequeños entre agente, guard y salida.",
        "Separar decisión arquitectónica de escritura de código.",
    ]

    decision = ArchitectureDecision(
        agent_key=AGENT_KEY,
        phase=AGENT_PHASE,
        status="ready",
        scope=scope,
        findings=findings,
        recommendations=recommendations,
        next_actions=["validar_contrato_builder_antes_de_nuevas_mutaciones"],
        warnings=["no_runtime_multiagent_yet"],
        meta={"layers": layers},
    )
    return asdict(decision)
