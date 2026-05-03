import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Request

from backend.app.core.security import get_current_user
from backend.app.db.mongodb import db
from backend.app.schemas.consumption import ConsumptionRequest
from backend.app.schemas.projects import ProjectCreate, RefineInput
from backend.app.services.ai_analysis import analyze_with_ai
from backend.app.services.blueprint import generate_blueprint
from backend.app.services.consumption_engine import execute_consumption_for_user
from backend.app.services.plan_recommendation import build_plan_recommendation
from backend.app.services.semantic_admission import run_semantic_admission
from backend.app.services.semantic_admission_trace import (
    build_semantic_admission_trace_payload,
    emit_semantic_admission_trace,
    should_emit_semantic_admission_trace,
)
from backend.app.services.url_analysis import fetch_and_analyze_url


router = APIRouter(prefix="/api/projects", tags=["projects"])

logger = logging.getLogger(__name__)

SEMANTIC_ADMISSION_SHADOW_ENABLED_ENV = "SEMANTIC_ADMISSION_SHADOW_ENABLED"


def _model_to_dict(model: Any) -> Dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump()

    if hasattr(model, "dict"):
        return model.dict()

    return {"value": model}


def clamp_score(value: Any, default: int = 2) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = default

    return max(1, min(4, parsed))


def get_project_scores(project: Optional[Dict[str, Any]]) -> Dict[str, int]:
    if not project:
        return {
            "project_complexity_score": 2,
            "journey_depth_score": 2,
            "output_value_score": 2,
            "operational_cost_score": 2,
        }

    recommendation = project.get("plan_recommendation") or {}
    scores = recommendation.get("scores") or {}

    urgency = clamp_score(scores.get("urgency"), 1)
    structure_need = clamp_score(scores.get("structure_need"), 1)

    return {
        "project_complexity_score": clamp_score(scores.get("complexity"), 2),
        "journey_depth_score": clamp_score(scores.get("continuity_need"), 2),
        "output_value_score": clamp_score(scores.get("economic_impact"), 2),
        "operational_cost_score": clamp_score(
            max(urgency, structure_need),
            2,
        ),
    }


def build_project_consumption_request(
    *,
    user: Dict[str, Any],
    project_id: str,
    action_key: str,
    surface: str,
    entry_point: str,
    project: Optional[Dict[str, Any]] = None,
) -> ConsumptionRequest:
    return ConsumptionRequest(
        mode="execute",
        action_key=action_key,
        user_context={
            "user_id": user["user_id"],
            "user_plan": user.get("plan", "free"),
            "credit_balance": 0,
            "special_credit_balance": 0,
        },
        project_context={
            "project_id": project_id,
            **get_project_scores(project),
        },
        usage_context={
            "action_count_in_session": 0,
            "action_count_on_project": 0,
        },
        meta={
            "surface": surface,
            "entry_point": entry_point,
            "trace_id": f"trace_{uuid.uuid4().hex[:12]}",
        },
    )


async def execute_project_consumption(
    *,
    user: Dict[str, Any],
    project_id: str,
    action_key: str,
    surface: str,
    entry_point: str,
    project: Optional[Dict[str, Any]] = None,
):
    consumption_payload = build_project_consumption_request(
        user=user,
        project_id=project_id,
        action_key=action_key,
        surface=surface,
        entry_point=entry_point,
        project=project,
    )

    consumption_result = await execute_consumption_for_user(
        runtime_user=user,
        payload=consumption_payload,
    )

    if consumption_result.status != "allowed":
        raise HTTPException(
            status_code=402,
            detail=_model_to_dict(consumption_result),
        )

    return consumption_result


def resolve_project_analysis_action_key(project_data: ProjectCreate) -> str:
    input_type = str(project_data.input_type or "").strip().lower()

    if input_type == "url":
        return "url_analysis"

    return "idea_analysis"


def _env_flag(name: str, default: bool = False) -> bool:
    """
    Lee flags de entorno de forma robusta.
    """
    raw = os.getenv(name)

    if raw is None:
        return default

    value = raw.strip().lower()

    return value in {"1", "true", "yes", "on"}


def _semantic_admission_shadow_enabled() -> bool:
    """
    Activa/desactiva shadow mode de admisión semántica.
    """
    return _env_flag(
        SEMANTIC_ADMISSION_SHADOW_ENABLED_ENV,
        default=False,
    )


def _resolve_semantic_admission_input_mode(project_data: ProjectCreate) -> str:
    """
    Resuelve input_mode para la capa de admisión sin romper el schema actual.

    Regla:
    - si en el futuro ProjectCreate trae input_mode, se usa;
    - si no existe, se cae a 'text';
    - para input_type=url no se usa admisión en esta microfase.
    """
    raw_mode = getattr(project_data, "input_mode", None)
    mode = str(raw_mode).strip().lower() if raw_mode is not None else ""

    aliases = {
        "voice": "voice_transcript",
        "audio": "voice_transcript",
        "speech": "voice_transcript",
        "dictation": "voice_transcript",
        "paste": "pasted_text",
        "pasted": "pasted_text",
        "typed": "text",
    }

    mode = aliases.get(mode, mode)

    if mode not in {"text", "pasted_text", "voice_transcript"}:
        return "text"

    return mode


def _run_semantic_admission_shadow(
    project_data: ProjectCreate,
) -> Optional[Dict[str, Any]]:
    """
    Ejecuta la capa de admisión semántica en modo sombra.

    Reglas críticas:
    - solo corre si shadow mode está activado;
    - en esta microfase solo corre sobre input_type='text';
    - nunca altera el flujo público;
    - si falla, el router sigue funcionando igual.
    """
    if not _semantic_admission_shadow_enabled():
        return None

    input_type = str(
        getattr(project_data, "input_type", "text")
    ).strip().lower()

    if input_type != "text":
        shadow_summary: Dict[str, Any] = {
            "status": "shadow_skipped",
            "reason": "unsupported_input_type",
            "input_type": input_type,
        }

        logger.info("semantic_admission_shadow=%s", shadow_summary)

        return shadow_summary

    input_mode = _resolve_semantic_admission_input_mode(project_data)

    admission_payload = run_semantic_admission(
        input_mode=input_mode,
        raw_input=project_data.input_content,
    )

    shadow_summary = {
        "status": str(admission_payload.get("status", "")),
        "input_mode": str(admission_payload.get("input_mode", input_mode)),
        "input_nature": str(admission_payload.get("input_nature", "")),
        "user_intent": str(admission_payload.get("user_intent", "")),
        "maturity_level": str(admission_payload.get("maturity_level", "")),
        "confidence": str(admission_payload.get("confidence", "")),
        "needs_clarification": bool(
            admission_payload.get("needs_clarification", False)
        ),
    }

    logger.info("semantic_admission_shadow=%s", shadow_summary)

    if should_emit_semantic_admission_trace():
        try:
            trace_payload = build_semantic_admission_trace_payload(
                admission_payload
            )
            emit_semantic_admission_trace(trace_payload)

        except Exception:
            logger.exception("semantic_admission_shadow_trace_error")

    return shadow_summary


@router.post("")
async def create_project(project_data: ProjectCreate, request: Request):
    user = await get_current_user(request)

    semantic_admission_shadow: Optional[Dict[str, Any]] = None

    try:
        semantic_admission_shadow = _run_semantic_admission_shadow(project_data)

    except Exception:
        logger.exception("semantic_admission_shadow_error")
        semantic_admission_shadow = {
            "status": "shadow_error",
            "reason": "semantic_admission_exception",
        }

    project_id = f"proj_{uuid.uuid4().hex[:12]}"

    url_analysis = None

    if project_data.input_type == "url":
        url_analysis = await fetch_and_analyze_url(project_data.input_content)

        if not url_analysis.get("success"):
            raise HTTPException(
                status_code=400,
                detail=url_analysis.get(
                    "error",
                    "No se pudo analizar la URL",
                ),
            )

    consumption_result = await execute_project_consumption(
        user=user,
        project_id=project_id,
        action_key=resolve_project_analysis_action_key(project_data),
        surface="projects",
        entry_point="create_project",
    )

    analysis = await analyze_with_ai(
        project_data.input_type,
        project_data.input_content,
        url_analysis,
    )

    plan_recommendation = build_plan_recommendation(
        input_type=project_data.input_type,
        input_content=project_data.input_content,
        analysis=analysis,
        url_analysis=url_analysis,
    )

    project_doc = {
        "project_id": project_id,
        "user_id": user["user_id"],
        "input_type": project_data.input_type,
        "input_content": project_data.input_content,
        "route": analysis.get("route", "idea"),
        "diagnosis": analysis.get("diagnosis", {}),
        "refine_questions": analysis.get("refine_questions", []),
        "plan_recommendation": plan_recommendation,
        "url_analysis": (
            url_analysis.get("content")
            if url_analysis and url_analysis.get("success")
            else None
        ),
        "analysis_consumption": _model_to_dict(consumption_result),
        "status": "analyzed",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.projects.insert_one(project_doc)

    project_doc.pop("_id", None)

    logger.info(
        "project_created=%s",
        {
            "project_id": project_id,
            "input_type": project_data.input_type,
            "route": project_doc.get("route"),
            "shadow_status": (semantic_admission_shadow or {}).get("status"),
            "shadow_input_nature": (
                semantic_admission_shadow or {}
            ).get("input_nature"),
            "shadow_user_intent": (
                semantic_admission_shadow or {}
            ).get("user_intent"),
            "shadow_confidence": (
                semantic_admission_shadow or {}
            ).get("confidence"),
            "shadow_needs_clarification": (
                semantic_admission_shadow or {}
            ).get("needs_clarification"),
        },
    )

    return project_doc


@router.get("")
async def get_projects(request: Request):
    user = await get_current_user(request)

    projects = await db.projects.find(
        {"user_id": user["user_id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(100)

    return projects


@router.get("/{project_id}")
async def get_project(project_id: str, request: Request):
    user = await get_current_user(request)

    project = await db.projects.find_one(
        {
            "project_id": project_id,
            "user_id": user["user_id"],
        },
        {"_id": 0},
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return project


@router.post("/{project_id}/refine")
async def refine_project(
    project_id: str,
    refine_data: RefineInput,
    request: Request,
):
    user = await get_current_user(request)

    project = await db.projects.find_one(
        {
            "project_id": project_id,
            "user_id": user["user_id"],
        }
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    analysis_for_recommendation = {
        "route": project.get("route", "idea"),
        "diagnosis": project.get("diagnosis", {}),
        "refine_questions": project.get("refine_questions", []),
    }

    plan_recommendation = build_plan_recommendation(
        input_type=project.get("input_type", "text"),
        input_content=project.get("input_content", ""),
        analysis=analysis_for_recommendation,
        url_analysis=project.get("url_analysis"),
        refine_answers=refine_data.answers,
    )

    await db.projects.update_one(
        {"project_id": project_id},
        {
            "$set": {
                "refine_answers": refine_data.answers,
                "plan_recommendation": plan_recommendation,
                "status": "refined",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    updated = await db.projects.find_one(
        {"project_id": project_id},
        {"_id": 0},
    )

    return updated


@router.post("/{project_id}/blueprint")
async def create_blueprint(project_id: str, request: Request):
    user = await get_current_user(request)

    project = await db.projects.find_one(
        {
            "project_id": project_id,
            "user_id": user["user_id"],
        }
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    consumption_result = await execute_project_consumption(
        user=user,
        project_id=project_id,
        action_key="blueprint_generation",
        surface="projects",
        entry_point="create_blueprint",
        project=project,
    )

    blueprint = await generate_blueprint(project)

    await db.projects.update_one(
        {"project_id": project_id},
        {
            "$set": {
                "blueprint": blueprint,
                "blueprint_consumption": _model_to_dict(consumption_result),
                "status": "blueprint_generated",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    updated = await db.projects.find_one(
        {"project_id": project_id},
        {"_id": 0},
    )

    return updated


@router.delete("/{project_id}")
async def delete_project(project_id: str, request: Request):
    user = await get_current_user(request)

    result = await db.projects.delete_one(
        {
            "project_id": project_id,
            "user_id": user["user_id"],
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return {"message": "Proyecto eliminado"}