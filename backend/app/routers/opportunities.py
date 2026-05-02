from fastapi import APIRouter, HTTPException, Request

from backend.app.core.security import get_current_user
from backend.app.domain.opportunities import OPPORTUNITIES

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])

PRO_PLAN_ID = "blueprint"
PRO_PLAN_LABEL = "Pro"

GROWTH_PLAN_ID = "sistema"
GROWTH_PLAN_LABEL = "Growth"

AI_MASTER_PLAN_ID = "premium"
AI_MASTER_PLAN_LABEL = "AI Master 199"

ADMIN_ROLES = {"admin"}

PLAN_ACCESS_RANK = {
    "free": 0,
    PRO_PLAN_ID: 1,
    GROWTH_PLAN_ID: 2,
    AI_MASTER_PLAN_ID: 3
}

CATALOG_ORDER = [
    "opp_002",
    "opp_003",
    "opp_007",
    "opp_001",
    "opp_005",
    "opp_006",
    "opp_009",
    "opp_004",
    "opp_008",
    "opp_010"
]

CATALOG_ORDER_INDEX = {
    opportunity_id: index
    for index, opportunity_id in enumerate(CATALOG_ORDER)
}

OPPORTUNITY_ACCESS = {
    "opp_002": {
        "required_plan": PRO_PLAN_ID,
        "required_plan_label": PRO_PLAN_LABEL,
        "plan_tier": "pro",
        "unlock_message": "Disponible con Pro.",
        "cta_label": "Desbloquear con Pro",
        "teaser": "Una ruta para convertir una oferta clara en una página preparada para captar interés y avanzar hacia venta."
    },
    "opp_003": {
        "required_plan": PRO_PLAN_ID,
        "required_plan_label": PRO_PLAN_LABEL,
        "plan_tier": "pro",
        "unlock_message": "Disponible con Pro.",
        "cta_label": "Desbloquear con Pro",
        "teaser": "Una base para presentar un negocio local con claridad, confianza y llamada a contacto."
    },
    "opp_007": {
        "required_plan": PRO_PLAN_ID,
        "required_plan_label": PRO_PLAN_LABEL,
        "plan_tier": "pro",
        "unlock_message": "Disponible con Pro.",
        "cta_label": "Desbloquear con Pro",
        "teaser": "Un flujo para transformar solicitudes, citas o disponibilidad en una experiencia más ordenada."
    },
    "opp_001": {
        "required_plan": GROWTH_PLAN_ID,
        "required_plan_label": GROWTH_PLAN_LABEL,
        "plan_tier": "growth",
        "unlock_message": "Disponible al ampliar con Growth.",
        "cta_label": "Ampliar con Growth",
        "teaser": "Una ruta para convertir preguntas frecuentes y captación inicial en una experiencia guiada."
    },
    "opp_005": {
        "required_plan": GROWTH_PLAN_ID,
        "required_plan_label": GROWTH_PLAN_LABEL,
        "plan_tier": "growth",
        "unlock_message": "Disponible al ampliar con Growth.",
        "cta_label": "Ampliar con Growth",
        "teaser": "Una base para mostrar avances, próximos pasos y estado de servicio a clientes."
    },
    "opp_006": {
        "required_plan": GROWTH_PLAN_ID,
        "required_plan_label": GROWTH_PLAN_LABEL,
        "plan_tier": "growth",
        "unlock_message": "Disponible al ampliar con Growth.",
        "cta_label": "Ampliar con Growth",
        "teaser": "Una ruta para transformar solicitudes o briefings en propuestas más claras y consistentes."
    },
    "opp_009": {
        "required_plan": GROWTH_PLAN_ID,
        "required_plan_label": GROWTH_PLAN_LABEL,
        "plan_tier": "growth",
        "unlock_message": "Disponible al ampliar con Growth.",
        "cta_label": "Ampliar con Growth",
        "teaser": "Una estructura para organizar recursos premium y activar una experiencia recurrente de valor."
    },
    "opp_004": {
        "required_plan": AI_MASTER_PLAN_ID,
        "required_plan_label": AI_MASTER_PLAN_LABEL,
        "plan_tier": "ai_master",
        "unlock_message": "Disponible con AI Master 199.",
        "cta_label": "Acceder con AI Master",
        "teaser": "Una oportunidad avanzada para convertir análisis web en diagnóstico y prioridades de mejora."
    },
    "opp_008": {
        "required_plan": AI_MASTER_PLAN_ID,
        "required_plan_label": AI_MASTER_PLAN_LABEL,
        "plan_tier": "ai_master",
        "unlock_message": "Disponible con AI Master 199.",
        "cta_label": "Acceder con AI Master",
        "teaser": "Una ruta para ordenar un nicho, conectar oferta y demanda y construir un activo escalable."
    },
    "opp_010": {
        "required_plan": AI_MASTER_PLAN_ID,
        "required_plan_label": AI_MASTER_PLAN_LABEL,
        "plan_tier": "ai_master",
        "unlock_message": "Disponible con AI Master 199.",
        "cta_label": "Acceder con AI Master",
        "teaser": "Una base avanzada para convertir seguimiento de procesos en una herramienta ligera con continuidad."
    }
}

DEFAULT_OPPORTUNITY_ACCESS = {
    "required_plan": PRO_PLAN_ID,
    "required_plan_label": PRO_PLAN_LABEL,
    "plan_tier": "pro",
    "unlock_message": "Disponible con Pro.",
    "cta_label": "Desbloquear con Pro",
    "teaser": "Ruta premium disponible para convertir una oportunidad en una base construible dentro de Sistema Maestro."
}


def _normalize_token(value):
    return str(value or "").strip().lower()


def _get_plan_rank(plan):
    return PLAN_ACCESS_RANK.get(_normalize_token(plan), 0)


def _get_access_meta(opportunity):
    opportunity_id = opportunity.get("opportunity_id")
    return OPPORTUNITY_ACCESS.get(opportunity_id, DEFAULT_OPPORTUNITY_ACCESS)


def _get_sorted_opportunities():
    return sorted(
        OPPORTUNITIES,
        key=lambda opportunity: CATALOG_ORDER_INDEX.get(
            opportunity.get("opportunity_id"),
            len(CATALOG_ORDER)
        )
    )


def _can_access_opportunity(required_plan, plan, role):
    normalized_role = _normalize_token(role)

    if normalized_role in ADMIN_ROLES:
        return True

    return _get_plan_rank(plan) >= _get_plan_rank(required_plan)


def _build_locked_opportunity(opportunity, access_meta):
    return {
        "opportunity_id": opportunity.get("opportunity_id"),
        "title": opportunity.get("title", "Oportunidad premium"),
        "description": access_meta["teaser"],
        "teaser": access_meta["teaser"],
        "route": opportunity.get("route", "idea"),
        "difficulty": opportunity.get("difficulty", "media"),
        "locked": True,
        "access_level": "locked",
        "required_plan": access_meta["required_plan"],
        "required_plan_label": access_meta["required_plan_label"],
        "plan_tier": access_meta["plan_tier"],
        "unlock_message": access_meta["unlock_message"],
        "cta_label": access_meta["cta_label"]
    }


def _build_unlocked_opportunity(opportunity, access_meta):
    return {
        **opportunity,
        "teaser": access_meta["teaser"],
        "locked": False,
        "access_level": "unlocked",
        "required_plan": access_meta["required_plan"],
        "required_plan_label": access_meta["required_plan_label"],
        "plan_tier": access_meta["plan_tier"],
        "unlock_message": None,
        "cta_label": None
    }


def _serialize_opportunity(opportunity, plan, role):
    access_meta = _get_access_meta(opportunity)
    has_access = _can_access_opportunity(
        access_meta["required_plan"],
        plan,
        role
    )

    if has_access:
        return _build_unlocked_opportunity(opportunity, access_meta)

    return _build_locked_opportunity(opportunity, access_meta)


@router.get("")
async def get_opportunities(request: Request):
    user = await get_current_user(request)

    plan = user.get("plan", "free")
    role = user.get("role", "user")

    return [
        _serialize_opportunity(opportunity, plan, role)
        for opportunity in _get_sorted_opportunities()
    ]


@router.get("/{opportunity_id}")
async def get_opportunity(opportunity_id: str, request: Request):
    user = await get_current_user(request)

    plan = user.get("plan", "free")
    role = user.get("role", "user")

    opportunity = next(
        (
            item
            for item in OPPORTUNITIES
            if item["opportunity_id"] == opportunity_id
        ),
        None
    )

    if opportunity is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    access_meta = _get_access_meta(opportunity)
    has_access = _can_access_opportunity(
        access_meta["required_plan"],
        plan,
        role
    )

    if not has_access:
        raise HTTPException(
            status_code=403,
            detail={
                "message": access_meta["unlock_message"],
                "required_plan": access_meta["required_plan"],
                "required_plan_label": access_meta["required_plan_label"],
                "cta_label": access_meta["cta_label"]
            }
        )

    return _build_unlocked_opportunity(opportunity, access_meta)