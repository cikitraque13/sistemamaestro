"""
agent_trace.py

Telemetría puente para agentes.
Sin persistencia ni integración viva todavía.
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid


@dataclass(frozen=True)
class AgentTrace:
    trace_id: str
    agent_key: str
    phase: str
    status: str
    request_id: Optional[str] = None
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    notes: List[str] = field(default_factory=list)
    meta: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def build_trace(
    agent_key: str,
    phase: str,
    status: str,
    request_id: Optional[str] = None,
    project_id: Optional[str] = None,
    user_id: Optional[str] = None,
    notes: Optional[List[str]] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    trace = AgentTrace(
        trace_id=f"atr_{uuid.uuid4().hex[:12]}",
        agent_key=agent_key,
        phase=phase,
        status=status,
        request_id=request_id,
        project_id=project_id,
        user_id=user_id,
        notes=notes or [],
        meta=meta or {},
    )
    return asdict(trace)