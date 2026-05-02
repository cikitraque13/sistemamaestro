

from fastapi import APIRouter, HTTPException, Request

from backend.app.core.security import get_current_user
from backend.app.domain.opportunities import OPPORTUNITIES

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])

PRO_PLAN_ID = "blueprint"
PRO_PLAN_LABEL = "Pro"

GROWTH_PLAN_ID = "sistema"
GROWTH_PLAN_LABEL = "Growth"

PRO_UNLOCK_LIMIT = 2
FULL_ACCESS_PLANS = {"sistema", "premium"}
ADMIN_ROLES = {"admin"}

ROUTE_TEASERS = {
    "sell": "Ruta orientada a convertir una oferta en una pantalla preparada para captar interés y avanzar hacia venta.",
    "automate": "Ruta para transformar una necesidad repetitiva en una experiencia guiada, ordenada y más fácil de activar.",
    "improve": "Ruta para mejorar un activo existente y convertirlo en una versión más clara, confiable y accionable.",
    "idea": "Ruta para convertir una idea o nicho en una primera estructura digital con dirección y potencial de continuidad."
}


def _normalize_token(value):
    return str(value or "").strip().lower()


def _get_access_limit(plan, role):
    normalized_plan = _normalize_token(plan)
    normalized_role = _normalize_token(role)

    if normalized_role in ADMIN_ROLES:
        return len(OPPORTUNITIES)

    if normalized_plan in FULL_ACCESS_PLANS:
        return len(OPPORTUNITIES)

    if normalized_plan == PRO_PLAN_ID:
        return PRO_UNLOCK_LIMIT

    return 0


def _get_required_plan_for_locked(plan):
    normalized_plan = _normalize_token(plan)

    if normalized_plan == PRO_PLAN_ID:
        return {
            "required_plan": GROWTH_PLAN_ID,
            "required_plan_label": GROWTH_PLAN_LABEL,
            "unlock_message": "Disponible al ampliar tu continuidad con Growth."
        }

    return {
        "required_plan": PRO_PLAN_ID,
        "required_plan_label": PRO_PLAN_LABEL,
        "unlock_message": "Disponible al desbloquear las primeras plantillas con Pro."
    }


def _build_locked_opportunity(opportunity, plan):
    route = opportunity.get("route", "idea")
    required_plan = _get_required_plan_for_locked(plan)

    teaser = ROUTE_TEASERS.get(
        route,
        "Ruta premium disponible para convertir una oportunidad en una base construible dentro de Sistema Maestro."
    )

    return {
        "opportunity_id": opportunity.get("opportunity_id"),
        "title": opportunity.get("title", "Oportunidad premium"),
        "description": teaser,
        "teaser": teaser,
        "route": route,
        "difficulty": opportunity.get("difficulty", "media"),
        "locked": True,
        "access_level": "locked",
        "required_plan": required_plan["required_plan"],
        "required_plan_label": required_plan["required_plan_label"],
        "unlock_message": required_plan["unlock_message"]
    }


def _build_unlocked_opportunity(opportunity):
    return {
        **opportunity,
        "locked": False,
        "access_level": "unlocked",
        "required_plan": None,
        "required_plan_label": None,
        "unlock_message": None
    }


def _serialize_opportunity(opportunity, index, access_limit, plan):
    if index < access_limit:
        return _build_unlocked_opportunity(opportunity)

    return _build_locked_opportunity(opportunity, plan)


@router.get("")
async def get_opportunities(request: Request):
    user = await get_current_user(request)

    plan = user.get("plan", "free")
    role = user.get("role", "user")
    access_limit = _get_access_limit(plan, role)

    return [
        _serialize_opportunity(opportunity, index, access_limit, plan)
        for index, opportunity in enumerate(OPPORTUNITIES)
    ]


@router.get("/{opportunity_id}")
async def get_opportunity(opportunity_id: str, request: Request):
    user = await get_current_user(request)

    plan = user.get("plan", "free")
    role = user.get("role", "user")
    access_limit = _get_access_limit(plan, role)

    opportunity_index = next(
        (
            index
            for index, opportunity in enumerate(OPPORTUNITIES)
            if opportunity["opportunity_id"] == opportunity_id
        ),
        None
    )

    if opportunity_index is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    if opportunity_index >= access_limit:
        required_plan = _get_required_plan_for_locked(plan)
        raise HTTPException(
            status_code=403,
            detail={
                "message": required_plan["unlock_message"],
                "required_plan": required_plan["required_plan"],
                "required_plan_label": required_plan["required_plan_label"]
            }
        )

    return _build_unlocked_opportunity(OPPORTUNITIES[opportunity_index])