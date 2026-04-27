from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


BuilderMode = Literal["build", "iterate", "repair"]
ProjectKind = Literal["landing", "web", "app", "dashboard", "logo", "component", "unknown"]


class BuilderAIInput(BaseModel):
    userInput: str = Field(..., min_length=1)
    currentBuildState: Optional[Dict[str, Any]] = None
    projectId: Optional[str] = None
    userId: Optional[str] = None
    mode: BuilderMode = "build"


class BuilderAIMutation(BaseModel):
    id: str
    type: str
    target: str
    action: str
    reason: str = ""
    payload: Dict[str, Any] = Field(default_factory=dict)


class BuilderAIOutput(BaseModel):
    intent: str
    projectKind: ProjectKind = "unknown"
    sector: str = ""
    objective: str = ""
    tone: str = ""
    mutations: List[BuilderAIMutation] = Field(default_factory=list)
    previewModelPatch: Dict[str, Any] = Field(default_factory=dict)
    codeModelPatch: Dict[str, Any] = Field(default_factory=dict)
    structureModelPatch: Dict[str, Any] = Field(default_factory=dict)
    assistantMessage: str
    nextAction: str
    monetizationSignal: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)


def get_builder_ai_output_contract() -> Dict[str, Any]:
    return {
        "required_keys": [
            "intent",
            "projectKind",
            "sector",
            "objective",
            "tone",
            "mutations",
            "previewModelPatch",
            "codeModelPatch",
            "structureModelPatch",
            "assistantMessage",
            "nextAction",
            "monetizationSignal",
            "warnings",
        ],
        "projectKind_allowed": [
            "landing",
            "web",
            "app",
            "dashboard",
            "logo",
            "component",
            "unknown",
        ],
        "rule": "OpenAI devuelve patches/mutaciones. No sustituye BuilderBuildState completo.",
    }
