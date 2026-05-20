"""
report_agent.py

Agente fase 1 de reporting de Sistema Maestro.
Función pura: convierte hallazgos en informe estructurado auditable.
"""

from dataclasses import dataclass, asdict, field
from typing import Any, Dict, List


AGENT_KEY = "report_agent"
AGENT_PHASE = "phase_1_minimal"


@dataclass(frozen=True)
class ReportDocument:
    agent_key: str
    phase: str
    status: str
    title: str
    summary: str
    findings: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    next_actions: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    confidence: float = 0.8
    meta: Dict[str, Any] = field(default_factory=dict)


def run_report_agent(context: Dict[str, Any]) -> Dict[str, Any]:
    title = str(context.get("title") or "Informe Sistema Maestro")
    findings = [str(item) for item in context.get("findings") or [] if str(item).strip()]
    recommendations = [
        str(item) for item in context.get("recommendations") or [] if str(item).strip()
    ]
    next_actions = [str(item) for item in context.get("next_actions") or [] if str(item).strip()]

    report = ReportDocument(
        agent_key=AGENT_KEY,
        phase=AGENT_PHASE,
        status="ready",
        title=title,
        summary=str(context.get("summary") or "Informe estructurado generado sin ejecución externa."),
        findings=findings,
        recommendations=recommendations,
        next_actions=next_actions,
        warnings=["report_agent_no_verifica_runtime"],
        meta={"source": context.get("source") or "manual_context"},
    )
    return asdict(report)
