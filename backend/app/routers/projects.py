import asyncio
import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Request

from backend.app.ai.memory.project_memory import (
    ProjectMemoryError,
    build_project_memory,
)
from backend.app.core.security import get_current_user
from backend.app.db.mongodb import db
from backend.app.schemas.consumption import ConsumptionRequest
from backend.app.schemas.projects import ProjectCreate, RefineInput
from backend.app.services.ai_analysis import analyze_with_ai
from backend.app.services.blueprint import generate_blueprint
from backend.app.services.economic_operation import (
    EconomicPersistenceUncertain, request_fingerprint, request_operation_id, run_economic_operation,
)
from backend.app.services.credits import get_credit_operation
from backend.app.services.plan_recommendation import build_plan_recommendation
from backend.app.services.project_memory_conflicts import (
    MemoryReviewError,
    input_digest as project_memory_input_digest,
    review_project_memory,
)
from backend.app.services.project_context_snapshot import (
    ProjectContextSnapshotError,
    build_project_context_snapshot,
)
from backend.app.services.semantic_admission import run_semantic_admission
from backend.app.services.semantic_admission_trace import (
    build_semantic_admission_trace_payload,
    emit_semantic_admission_trace,
    should_emit_semantic_admission_trace,
)
from backend.app.services.url_analysis import fetch_and_analyze_url


router = APIRouter(prefix="/api/projects", tags=["projects"])

logger = logging.getLogger(__name__)

MAX_REFINE_ANSWER_KEY_CHARS = 128
MAX_REFINE_ANSWER_VALUE_CHARS = 4000


def _merge_refine_answers(project, incoming_answers):
    """Validate current answers while preserving opaque historical entries.

    `refine_answers` is replaced as one map by the existing owner/revision CAS.
    Keep stored keys that no longer correspond to current questions, but never
    let a request create or rewrite such a key.
    """
    if not isinstance(incoming_answers, dict) or len(incoming_answers) > 100:
        raise HTTPException(422, detail={"code": "invalid_refine_answers"})

    stored_answers = project.get("refine_answers", {})
    if not isinstance(stored_answers, dict):
        raise HTTPException(422, detail={"code": "invalid_stored_refine_answers"})

    changed_entries = {}
    for key, value in incoming_answers.items():
        if not isinstance(key, str) or not isinstance(value, str):
            raise HTTPException(422, detail={"code": "invalid_refine_answer_entry"})
        # Exact round-trips of stored values are preservation, not new input.
        # In particular, don't make an old oversized/opaque answer impossible
        # to carry while the user updates a current answer.
        if key in stored_answers and stored_answers[key] == value:
            continue
        changed_entries[key] = value

    authorized_ids = set()
    if changed_entries:
        seen_ids = set()
        questions = project.get("refine_questions", [])
        if not isinstance(questions, list):
            raise HTTPException(422, detail={"code": "invalid_refine_questions"})
        for question in questions:
            if not isinstance(question, dict):
                raise HTTPException(422, detail={"code": "invalid_refine_questions"})
            question_id = question.get("id")
            if (
                not isinstance(question_id, str)
                or not question_id
                or question_id != question_id.strip()
                or len(question_id) > MAX_REFINE_ANSWER_KEY_CHARS
            ):
                raise HTTPException(422, detail={"code": "invalid_refine_questions"})
            if question_id in seen_ids:
                raise HTTPException(422, detail={"code": "duplicate_refine_question_id"})
            seen_ids.add(question_id)
            authorized_ids.add(question_id)

    for key, value in changed_entries.items():
        if (
            not key
            or key != key.strip()
            or len(key) > MAX_REFINE_ANSWER_KEY_CHARS
            or len(value) > MAX_REFINE_ANSWER_VALUE_CHARS
        ):
            raise HTTPException(422, detail={"code": "invalid_refine_answer_entry"})
        if key not in authorized_ids:
            raise HTTPException(422, detail={"code": "unauthorized_refine_answer_id"})

    merged = dict(stored_answers)
    merged.update(incoming_answers)
    return merged


def project_revision(project):
    if "updated_at" not in project:
        return "0"
    value = project["updated_at"]
    try:
        if not isinstance(value, str) or not value or value != value.strip():
            raise ValueError()
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            raise ValueError()
    except (ValueError, TypeError):
        raise HTTPException(409, detail={"code": "invalid_project_revision"})
    return value


def expected_project_revision(request):
    value = request.headers.get("If-Match")
    if value == "0":
        return value
    try:
        return project_revision({"updated_at": value})
    except HTTPException:
        raise HTTPException(400, detail={"code": "expected_revision_required"})


def project_cas(project_id, user, expected):
    return {"project_id": project_id, "user_id": user["user_id"],
            "updated_at": {"$exists": False} if expected == "0" else expected}


def assert_project_revision(project, expected):
    if project_revision(project) != expected:
        raise HTTPException(409, detail={"code": "stale_project_revision"})


async def assert_project_memory_compatible(project):
    try:
        review = await review_project_memory(project)
    except MemoryReviewError as exc:
        detail = {"code": exc.code}
        if exc.question_ids:
            detail["question_ids"] = list(exc.question_ids)
        raise HTTPException(exc.status_code, detail=detail) from exc
    if review.groups:
        kind = "project_memory_conflict" if any(
            group["kind"] == "conflict" for group in review.groups
        ) else "project_memory_uncertain"
        raise HTTPException(409, detail={"code": kind, "groups": list(review.groups)})
    return review


def next_project_revision(expected):
    now = datetime.now(timezone.utc)
    if expected != "0":
        now = max(now, datetime.fromisoformat(expected) + timedelta(microseconds=1))
    return now.isoformat()

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
    operation_id: str,
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
            "trace_id": operation_id,
        },
    )


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
    operation_id = request_operation_id(request, "create_project")

    semantic_admission_shadow: Optional[Dict[str, Any]] = None

    try:
        semantic_admission_shadow = _run_semantic_admission_shadow(project_data)

    except Exception:
        logger.exception("semantic_admission_shadow_error")
        semantic_admission_shadow = {
            "status": "shadow_error",
            "reason": "semantic_admission_exception",
        }

    project_id = "proj_" + request_fingerprint({
        "user_id": user["user_id"], "operation_id": operation_id,
    })[:24]
    consumption_payload = build_project_consumption_request(
        user=user,
        project_id=project_id,
        action_key=resolve_project_analysis_action_key(project_data),
        surface="projects",
        entry_point="create_project",
        operation_id=operation_id,
    )

    async def work(consumption_result):
        initial_revision = datetime.now(timezone.utc).isoformat()
        url_analysis = None
        if project_data.input_type == "url":
            url_analysis = await fetch_and_analyze_url(project_data.input_content)
            if not url_analysis.get("success"):
                raise HTTPException(400, detail=url_analysis.get("error", "No se pudo analizar la URL"))

        analysis = await analyze_with_ai(
            project_data.input_type, project_data.input_content, url_analysis,
            identity={"user_id": user["user_id"], "project_id": project_id,
                      "operation_id": operation_id, "revision": initial_revision},
        )
        plan_recommendation = build_plan_recommendation(
            input_type=project_data.input_type, input_content=project_data.input_content,
            analysis=analysis, url_analysis=url_analysis,
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
            "url_analysis": url_analysis.get("content") if url_analysis and url_analysis.get("success") else None,
            "analysis_consumption": consumption_result,
            "status": "analyzed",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": initial_revision,
        }
        try:
            await db.projects.insert_one(project_doc)
        except (Exception, asyncio.CancelledError) as exc:
            try:
                persisted = await db.projects.find_one(
                    {"project_id": project_id, "user_id": user["user_id"]}, {"_id": 0},
                )
            except Exception as read_error:
                raise EconomicPersistenceUncertain("Project write outcome unknown") from read_error
            if not persisted or persisted.get("analysis_consumption", {}).get("trace", {}).get("operation_id") != operation_id:
                raise EconomicPersistenceUncertain("Project write outcome unknown") from exc
            return persisted
        project_doc.pop("_id", None)
        return project_doc

    project_doc = await run_economic_operation(
        user=user, consumption_payload=consumption_payload,
        inputs=_model_to_dict(project_data), work=work,
    )

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
    expected = expected_project_revision(request)

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

    assert_project_revision(project, expected)
    merged_answers = _merge_refine_answers(project, refine_data.answers)
    proposed_project = {**project, "refine_answers": merged_answers}
    await assert_project_memory_compatible(proposed_project)
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
        refine_answers=merged_answers,
    )

    updated = await db.projects.find_one_and_update(
        project_cas(project_id, user, expected),
        {
            "$set": {
                "refine_answers": merged_answers,
                "plan_recommendation": plan_recommendation,
                "status": "refined",
                "updated_at": next_project_revision(expected),
            }
        }, projection={"_id": 0}, return_document=True,
    )
    if updated is None:
        raise HTTPException(409, detail={"code": "stale_project_revision"})
    return updated


@router.post("/{project_id}/blueprint")
async def create_blueprint(project_id: str, request: Request):
    user = await get_current_user(request)
    expected = expected_project_revision(request)
    operation_id = request_operation_id(request, "create_blueprint")

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

    prior_operation = await get_credit_operation(user["user_id"], operation_id)
    # A completed idempotent replay returns its durable result without another
    # provider call. A new attempt is checked before any economic reservation.
    if prior_operation is None:
        assert_project_revision(project, expected)
        try:
            context_snapshot = build_project_context_snapshot(
                project,
                project_id=project_id,
                expected_revision=expected,
                context_use="blueprint_generation",
            )
        except ProjectContextSnapshotError as exc:
            status_code = 409 if exc.code == "stale_project_revision" else 422
            raise HTTPException(status_code, detail={"code": exc.code}) from exc
        try:
            project_memory = build_project_memory(
                project,
                owner_id=user["user_id"],
                project_id=project_id,
                expected_revision=expected,
            )
        except ProjectMemoryError as exc:
            status_code = 409 if exc.code == "stale_project_revision" else 422
            raise HTTPException(status_code, detail={"code": exc.code}) from exc
        memory_review = await assert_project_memory_compatible(project)
    else:
        context_snapshot = None
        project_memory = None
        memory_review = None

    consumption_payload = build_project_consumption_request(
        user=user,
        project_id=project_id,
        action_key="blueprint_generation",
        surface="projects",
        entry_point="create_blueprint",
        operation_id=operation_id,
        project=project,
    )

    async def work(consumption_result):
        live_project = await db.projects.find_one(
            {
                "project_id": project_id,
                "user_id": user["user_id"],
            },
            {"_id": 0},
        )
        if not live_project:
            raise HTTPException(404, detail="Project not found")
        assert_project_revision(live_project, expected)
        if project_memory_input_digest(live_project) != memory_review.digest:
            raise HTTPException(409, detail={"code": "stale_project_revision"})

        blueprint_context = {
            item["field"]: item["value"] for item in context_snapshot["items"]
        }

        # Use the projection only as the source of the already-existing value.
        # Its identity and provenance metadata never enter the provider payload.
        blueprint_context["refine_answers"] = project_memory["answers"]
        blueprint = await generate_blueprint(blueprint_context)
        after_provider = await db.projects.find_one(
            {"project_id": project_id, "user_id": user["user_id"]},
            {"_id": 0},
        )
        if not after_provider:
            raise HTTPException(404, detail="Project not found")
        assert_project_revision(after_provider, expected)
        if project_memory_input_digest(after_provider) != memory_review.digest:
            raise HTTPException(409, detail={"code": "stale_project_revision"})
        revision = next_project_revision(expected)
        try:
            updated = await db.projects.find_one_and_update(
                project_cas(project_id, user, expected),
                {"$set": {
                    "blueprint": blueprint,
                    "blueprint_consumption": consumption_result,
                    "status": "blueprint_generated",
                    "updated_at": revision,
                }},
                projection={"_id": 0}, return_document=True,
            )
        except (Exception, asyncio.CancelledError) as exc:
            try:
                updated = await db.projects.find_one(
                    {"project_id": project_id, "user_id": user["user_id"]}, {"_id": 0},
                )
            except Exception as read_error:
                raise EconomicPersistenceUncertain("Blueprint write outcome unknown") from read_error
            if not updated or updated.get("updated_at") != revision or updated.get("blueprint_consumption", {}).get("trace", {}).get("operation_id") != operation_id:
                raise EconomicPersistenceUncertain("Blueprint write outcome unknown") from exc
        if updated is None:
            raise HTTPException(409, detail={"code": "stale_project_revision"})
        return updated

    return await run_economic_operation(
        user=user, consumption_payload=consumption_payload,
        inputs={"project_id": project_id, "expected_revision": expected}, work=work,
    )


@router.delete("/{project_id}")
async def delete_project(project_id: str, request: Request):
    user = await get_current_user(request)
    expected = expected_project_revision(request)

    result = await db.projects.delete_one(
        project_cas(project_id, user, expected)
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return {"message": "Proyecto eliminado"}
