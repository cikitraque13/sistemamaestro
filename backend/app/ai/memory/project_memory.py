"""
project_memory.py

Memoria puente por proyecto.
Sin persistencia viva todavía.
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class ProjectMemoryRecord:
    project_id: str
    memory_version: str
    context_summary: str = ""
    active_routes: List[str] = field(default_factory=list)
    important_decisions: List[str] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)
    meta: Dict[str, Any] = field(default_factory=dict)
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def build_project_memory(
    project_id: str,
    context_summary: str = "",
    active_routes: Optional[List[str]] = None,
    important_decisions: Optional[List[str]] = None,
    constraints: Optional[List[str]] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    record = ProjectMemoryRecord(
        project_id=project_id,
        memory_version="v1",
        context_summary=context_summary,
        active_routes=active_routes or [],
        important_decisions=important_decisions or [],
        constraints=constraints or [],
        meta=meta or {},
    )
    return asdict(record)