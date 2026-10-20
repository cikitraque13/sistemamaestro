"""Closed J06.1 transport and inference schemas; no Builder mutations."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

LABELS = {"title":"Título","goal":"Objetivo","scope":"Alcance","assumptions":"Supuestos","success_criteria":"Criterios de éxito","clarifications":"Aclaraciones","sources":"Fuentes","question_id":"ID de pregunta","question":"Pregunta","answer":"Respuesta","source_label":"Fuente","field_path":"Campo","revision":"Revisión"}
POLICY_VERSION = "sm.j06.1.intent.v1"
class Closed(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
class IntentOperation(Closed):
    kind: Literal["intent"]
    projectId: str = Field(min_length=1,max_length=100)
    operation_id: str = Field(min_length=36,max_length=36)
    operation_type: Literal["CREATE_INTENT","SAVE_DRAFT","ANSWER","EDIT","REFRESH","CONFIRM","CANCEL","SUPERSEDE_AND_CREATE"]
    intent_id: str | None = None
    draft_revision: str | None = None
    state_revision: str | None = None
    text: str | None = Field(default=None,min_length=1,max_length=8000)
    answers: dict[str,str] = Field(default_factory=dict)
    digest: str | None = Field(default=None,min_length=64,max_length=64)
class Question(Closed):
    question_id: str = Field(min_length=1,max_length=80)
    question: str = Field(min_length=1,max_length=1000)
    depends_on: list[str] = Field(max_length=6)
class Inference(Closed):
    title: str = Field(min_length=1,max_length=200)
    goal: str = Field(min_length=1,max_length=2000)
    scope: list[str] = Field(max_length=10)
    assumptions: list[str] = Field(max_length=10)
    success_criteria: list[str] = Field(max_length=10)
    questions: list[Question] = Field(max_length=5)
    blocker_ids: list[str] = Field(max_length=5)
