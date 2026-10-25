"""Closed transport for user-authored plans, with no inference/build input."""
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, StrictInt, model_validator


class PlanOperation(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    kind: Literal["plan"]
    projectId: str = Field(min_length=1, max_length=100)
    operation_id: str = Field(min_length=36, max_length=36)
    operation_type: Literal["CREATE", "EDIT", "REVIEW", "CONFIRM", "CANCEL", "RESTART", "PROGRESS_UPDATE", "REPLAN"]
    plan_id: str | None = None
    generation: int | None = None
    plan_revision: int | None = None
    state_revision: int | None = None
    expected_status: str | None = None
    content: dict | None = None
    digest: str | None = None
    expected_progress_revision: StrictInt | None = None
    step_id: str | None = None
    status: Literal["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED"] | None = None

    @model_validator(mode="after")
    def validate_phase3b_request(self):
        if self.operation_type not in {"PROGRESS_UPDATE", "REPLAN"}:
            if self.model_fields_set & {"expected_progress_revision", "step_id", "status"}:
                raise ValueError("Phase 3B fields are not accepted by Phase 3A operations")
            return self
        common = {"kind", "projectId", "operation_id", "operation_type", "plan_id", "generation",
                  "plan_revision", "state_revision", "expected_status", "expected_progress_revision"}
        allowed = common | ({"step_id", "status"} if self.operation_type == "PROGRESS_UPDATE" else set())
        if self.model_fields_set != allowed or self.kind != "plan":
            raise ValueError("invalid Phase 3B request shape")
        if not 1 <= len(self.projectId) <= 100:
            raise ValueError("invalid project identity")
        for value in (self.operation_id, self.plan_id):
            try:
                valid_uuid = isinstance(value, str) and str(UUID(value)) == value
            except (ValueError, TypeError, AttributeError):
                valid_uuid = False
            if not valid_uuid:
                raise ValueError("invalid UUID")
        if self.operation_type == "PROGRESS_UPDATE":
            try:
                valid_step = isinstance(self.step_id, str) and str(UUID(self.step_id)) == self.step_id
            except (ValueError, TypeError, AttributeError):
                valid_step = False
            if not valid_step or self.expected_status != "CONFIRMED" or self.status not in {"NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED"}:
                raise ValueError("invalid progress request")
        elif self.expected_status not in {"CONFIRMED", "STALE"}:
            raise ValueError("invalid replan status")
        maximum = 9007199254740991
        for value, minimum in ((self.generation, 1), (self.plan_revision, 1), (self.state_revision, 1),
                               (self.expected_progress_revision, 0)):
            if type(value) is not int or not minimum <= value <= maximum:
                raise ValueError("invalid revision")
        return self
