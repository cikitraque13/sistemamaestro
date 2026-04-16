from fastapi import APIRouter, Request

from backend.app.core.security import get_current_user
from backend.app.db.mongodb import db
from backend.app.domain.plans import ONE_TIME_OFFERS, PLANS

router = APIRouter(prefix="/api/user", tags=["billing"])


@router.get("/billing")
async def get_billing(request: Request):
    user = await get_current_user(request)

    transactions = await db.payment_transactions.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    current_plan = PLANS.get(user.get("plan", "free"), PLANS["free"])

    return {
        "current_plan": {
            "id": user.get("plan", "free"),
            "name": current_plan["name"],
            "price": current_plan["price"],
            "features": current_plan["features"]
        },
        "transactions": transactions,
        "available_plans": [
            {"id": k, "name": v["name"], "price": v["price"], "features": v["features"]}
            for k, v in PLANS.items()
        ],
        "available_one_time_offers": [
            {"id": k, "name": v["name"], "price": v["price"], "description": v["description"]}
            for k, v in ONE_TIME_OFFERS.items()
        ]
    }


@router.put("/profile")
async def update_profile(request: Request):
    user = await get_current_user(request)
    body = await request.json()

    allowed_fields = ["name"]
    update_data = {k: v for k, v in body.items() if k in allowed_fields}

    if update_data:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_data}
        )

    updated_user = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "password_hash": 0}
    )
    return updated_user


@router.get("/stats")
async def get_user_stats(request: Request):
    user = await get_current_user(request)

    project_count = await db.projects.count_documents({"user_id": user["user_id"]})
    blueprint_count = await db.projects.count_documents(
        {"user_id": user["user_id"], "status": "blueprint_generated"}
    )

    return {
        "total_projects": project_count,
        "blueprints_generated": blueprint_count,
        "plan": user.get("plan", "free")
    }
