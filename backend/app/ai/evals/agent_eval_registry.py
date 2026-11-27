"""
agent_eval_registry.py

Registro puente de evaluación de agentes.
Sin scoring vivo todavía.
"""

from dataclasses import dataclass, asdict
from typing import Dict, Tuple


@dataclass(frozen=True)
class EvalContract:
    key: str
    target_agent: str
    objective: str
    phase: str
    metrics: Tuple[str, ...]


EVAL_REGISTRY: Dict[str, EvalContract] = {
    "routing_eval": EvalContract(
        key="routing_eval",
        target_agent="master_orchestrator",
        objective="No hay enrutado en vivo. Este registro no envía llamadas.",
        phase="not_connected",
        metrics=("scope_fit",),
    ),
    "report_eval": EvalContract(
        key="report_eval",
        target_agent="report_agent",
        objective="Evaluar consistencia, claridad y estructura del informe.",
        phase="not_connected",
        metrics=("structure_consistency", "clarity", "usefulness"),
    ),
    "builder_eval": EvalContract(
        key="builder_eval",
        target_agent="builder_agent",
        objective="Evaluar seguridad, ajuste al alcance y consistencia del cambio técnico.",
        phase="next",
        metrics=("scope_compliance", "code_consistency", "change_safety"),
    ),
    "security_eval": EvalContract(
        key="security_eval",
        target_agent="security_architect_agent",
        objective="Evaluar severidad, utilidad y prioridad de hallazgos de seguridad.",
        phase="next",
        metrics=("severity_quality", "mitigation_quality"),
    ),
}


def get_eval_manifest():
    return {key: asdict(value) for key, value in EVAL_REGISTRY.items()}