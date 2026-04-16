from typing import Dict

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    input_type: str = "text"
    input_content: str


class RefineInput(BaseModel):
    answers: Dict[str, str]
