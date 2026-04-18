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
        objective="Evaluar si la intención fue enviada al agente correcto.",
        phase="now",
        metrics=("route_accuracy", "scope_fit"),
    ),
    "report_eval": EvalContract(
        key="report_eval",
        target_agent="report_agent",
        objective="Evaluar consistencia, claridad y estructura del informe.",
        phase="now",
        metrics=("structure_consistency", "clarity", "usefulness"),
    ),
    "audit_eval": EvalContract(
        key="audit_eval",
        target_agent="audit_agent",
        objective="Evaluar calidad de hallazgos y detección de fricciones visibles.",
        phase="now",
        metrics=("signal_quality", "friction_detection"),
    ),
    "builder_eval": EvalContract(
        key="builder_eval",
        target_agent="builder_agent",
        objective="Evaluar seguridad, ajuste al alcance y consistencia del cambio técnico.",
        phase="next",
        metrics=("scope_compliance", "code_consistency", "change_safety"),
    ),
    "rescue_eval": EvalContract(
        key="rescue_eval",
        target_agent="rescue_sre_agent",
        objective="Evaluar calidad del diagnóstico y precisión de causa raíz.",
        phase="now",
        metrics=("root_cause_precision", "repair_safety"),
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