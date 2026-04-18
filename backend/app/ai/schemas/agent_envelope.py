"""
agent_envelope.py

Contrato puente común para entradas y salidas de agentes.
Sin lógica viva.
"""

from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class AgentInputEnvelope:
    agent_key: str
    request_id: str
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    intent: Optional[str] = None
    payload: Dict[str, Any] = field(default_factory=dict)
    context: Dict[str, Any] = field(default_factory=dict)
    allowed_tools: List[str] = field(default_factory=list)
    guard_layers: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class AgentOutputEnvelope:
    agent_key: str
    request_id: str
    status: str
    output_type: str
    data: Dict[str, Any] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    trace_id: Optional[str] = None


def serialize_input(envelope: AgentInputEnvelope) -> Dict[str, Any]:
    return asdict(envelope)


def serialize_output(envelope: AgentOutputEnvelope) -> Dict[str, Any]:
    return asdict(envelope)