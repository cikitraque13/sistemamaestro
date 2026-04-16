from fastapi import APIRouter, HTTPException, Request

from app.core.security import get_current_user
from app.db.mongodb import db
from app.domain.opportunities import OPPORTUNITIES
from app.domain.plans import PLANS

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


@router.get("")
async def get_opportunities(request: Request):
    user = await get_current_user(request)

    plan = user.get("plan", "free")
    role = user.get("role", "user")

    if plan == "free" and role != "admin":
        has_opportunities = "opportunities" in PLANS.get(plan, {}).get("features", [])
        if not has_opportunities:
            return OPPORTUNITIES[:2]

    return OPPORTUNITIES


@router.get("/{opportunity_id}")
async def get_opportunity(opportunity_id: str, request: Request):
    user = await get_current_user(request)

    plan = user.get("plan", "free")
    role = user.get("role", "user")

    opp = next((o for o in OPPORTUNITIES if o["opportunity_id"] == opportunity_id), None)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    if plan == "free" and role != "admin":
        allowed = OPPORTUNITIES[:2]
        if opp not in allowed:
            raise HTTPException(status_code=403, detail="Upgrade to access more opportunities")

    return opp
