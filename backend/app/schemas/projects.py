from typing import Dict, Literal

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    input_type: Literal["text", "url"] = "text"
    input_content: str = Field(min_length=1, max_length=50_000)


class RefineInput(BaseModel):
    answers: Dict[str, str] = Field(max_length=100)
