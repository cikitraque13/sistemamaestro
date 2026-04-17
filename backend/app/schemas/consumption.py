from __future__ import annotations

from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, Field


ConsumptionMode = Literal["simulate", "execute"]

ConsumptionStatus = Literal[
    "allowed",
    "blocked_plan",
    "blocked_balance",
    "blocked_special_credit",
    "blocked_invalid_action",
]

DecisionMode = Literal[
    "base",
    "reinforced",
    "escalated",
    "special_gated",
]

ConsumptionType = Literal[
    "none",
    "standard",
    "special",
]

TierName = Literal["T1", "T2", "T3"]


class UserContext(BaseModel):
    user_id: str = Field(..., min_length=1)
    user_plan: str = Field(..., min_length=1)
    credit_balance: int = Field(..., ge=0)
    special_credit_balance: int = Field(..., ge=0)


class ProjectContext(BaseModel):
    project_id: str = Field(..., min_length=1)
    project_complexity_score: int = Field(..., ge=1, le=4)
    journey_depth_score: int = Field(..., ge=1, le=4)
    output_value_score: int = Field(..., ge=1, le=4)
    operational_cost_score: int = Field(..., ge=1, le=4)


class UsageContext(BaseModel):
    action_count_in_session: int = Field(0, ge=0)
    action_count_on_project: int = Field(0, ge=0)


class ConsumptionMeta(BaseModel):
    surface: Optional[str] = None
    entry_point: Optional[str] = None
    trace_id: Optional[str] = None


class ConsumptionRequest(BaseModel):
    mode: ConsumptionMode
    action_key: str = Field(..., min_length=1)
    user_context: UserContext
    project_context: ProjectContext
    usage_context: UsageContext = Field(default_factory=UsageContext)
    meta: ConsumptionMeta = Field(default_factory=ConsumptionMeta)


class ConsumptionDecision(BaseModel):
    base_tier: Optional[TierName] = None
    final_tier: Optional[TierName] = None
    decision_mode: Optional[DecisionMode] = None
    consumption_type: ConsumptionType = "none"
    consumption_amount: int = Field(0, ge=0)
    scale_reason: Optional[str] = None


class ConsumptionGates(BaseModel):
    plan_gate_triggered: bool = False
    balance_gate_triggered: bool = False
    special_credit_gate_triggered: bool = False


class ConsumptionUX(BaseModel):
    ux_label: str = ""
    message: str = ""
    next_step_hint: Optional[str] = None


class TraceSnapshot(BaseModel):
    trace_id: Optional[str] = None
    engine_version: str = "consumption_v1"
    catalog_version: str = "credits_v1"
    scores_snapshot: Dict[str, int] = Field(default_factory=dict)
    repetition_snapshot: Dict[str, int] = Field(default_factory=dict)


class ConsumptionResponse(BaseModel):
    status: ConsumptionStatus
    action_key: str
    mode: ConsumptionMode
    decision: ConsumptionDecision
    gates: ConsumptionGates = Field(default_factory=ConsumptionGates)
    ux: ConsumptionUX = Field(default_factory=ConsumptionUX)
    trace: TraceSnapshot = Field(default_factory=TraceSnapshot)


class InvalidPayloadResponse(BaseModel):
    status: Literal["invalid_payload"] = "invalid_payload"
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


class InvalidActionResponse(BaseModel):
    status: Literal["blocked_invalid_action"] = "blocked_invalid_action"
    action_key: str
    message: str


class ConsumptionSimulationEnvelope(BaseModel):
    ok: bool = True
    data: ConsumptionResponse


class ConsumptionExecutionEnvelope(BaseModel):
    ok: bool = True
    data: ConsumptionResponse


class ConsumptionErrorEnvelope(BaseModel):
    ok: bool = False
    error: str
    details: Dict[str, Any] = Field(default_factory=dict)
