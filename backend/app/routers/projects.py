import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from app.core.security import get_current_user
from app.db.mongodb import db
from app.schemas.projects import ProjectCreate, RefineInput
from app.services.ai_analysis import analyze_with_ai
from app.services.blueprint import generate_blueprint
from app.services.plan_recommendation import build_plan_recommendation
from app.services.url_analysis import fetch_and_analyze_url

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("")
async def create_project(project_data: ProjectCreate, request: Request):
    user = await get_current_user(request)

    url_analysis = None
    if project_data.input_type == "url":
        url_analysis = await fetch_and_analyze_url(project_data.input_content)
        if not url_analysis.get("success"):
            raise HTTPException(
                status_code=400,
                detail=url_analysis.get("error", "No se pudo analizar la URL")
            )

    analysis = await analyze_with_ai(
        project_data.input_type,
        project_data.input_content,
        url_analysis
    )

    plan_recommendation = build_plan_recommendation(
        input_type=project_data.input_type,
        input_content=project_data.input_content,
        analysis=analysis,
        url_analysis=url_analysis
    )

    project_id = f"proj_{uuid.uuid4().hex[:12]}"
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
        "status": "analyzed",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    await db.projects.insert_one(project_doc)
    project_doc.pop("_id", None)
    return project_doc


@router.get("")
async def get_projects(request: Request):
    user = await get_current_user(request)

    projects = await db.projects.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    return projects


@router.get("/{project_id}")
async def get_project(project_id: str, request: Request):
    user = await get_current_user(request)

    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.post("/{project_id}/refine")
async def refine_project(project_id: str, refine_data: RefineInput, request: Request):
    user = await get_current_user(request)

    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user["user_id"]}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    analysis_for_recommendation = {
        "route": project.get("route", "idea"),
        "diagnosis": project.get("diagnosis", {}),
        "refine_questions": project.get("refine_questions", [])
    }

    plan_recommendation = build_plan_recommendation(
        input_type=project.get("input_type", "text"),
        input_content=project.get("input_content", ""),
        analysis=analysis_for_recommendation,
        url_analysis=project.get("url_analysis"),
        refine_answers=refine_data.answers
    )

    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {
            "refine_answers": refine_data.answers,
            "plan_recommendation": plan_recommendation,
            "status": "refined",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    updated = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return updated


@router.post("/{project_id}/blueprint")
async def create_blueprint(project_id: str, request: Request):
    user = await get_current_user(request)

    if user.get("plan") == "free" and user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Upgrade to Blueprint plan to unlock this feature"
        )

    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user["user_id"]}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    blueprint = await generate_blueprint(project)

    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {
            "blueprint": blueprint,
            "status": "blueprint_generated",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    updated = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return updated


@router.delete("/{project_id}")
async def delete_project(project_id: str, request: Request):
    user = await get_current_user(request)

    result = await db.projects.delete_one(
        {"project_id": project_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"message": "Proyecto eliminado"}
