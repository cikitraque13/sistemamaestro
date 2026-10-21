"""Closed transport for user-authored plans, with no inference/build input."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class PlanOperation(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    kind: Literal["plan"]
    projectId: str = Field(min_length=1, max_length=100)
    operation_id: str = Field(min_length=36, max_length=36)
    operation_type: Literal["CREATE", "EDIT", "REVIEW", "CONFIRM", "CANCEL", "RESTART"]
    plan_id: str | None = None
    generation: int | None = None
    plan_revision: int | None = None
    state_revision: int | None = None
    expected_status: str | None = None
    content: dict | None = None
    digest: str | None = None
