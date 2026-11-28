"""Owner-scoped builder preferences.

Only tone, style, structure labels and counters are stored. Page text,
instructions and account fields are not copied into this collection.
"""
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

TONES = frozenset({"cercano", "formal", "directo"})
STYLES = frozenset({"sobrio", "calido", "comercial"})
ROLES = frozenset({"oferta", "prueba", "objecion", "paso", "cierre"})
_TONE_FORMAL = ("usted",)
_TONE_CLOSE = (" contigo", " tú ", " tu cita", "te espera", "escríbenos", "escribenos")
_STYLE_WARM = ("cerca", "acompa", "calma", "cuid")
_STYLE_SELL = ("reserva", "compra", "precio", "oferta")


def _now():
    return datetime.now(timezone.utc).isoformat()


def infer_preference(draft) -> dict:
    sections = [item for item in (draft or {}).get("sections") or [] if isinstance(item, dict)]
    text = " ".join([
        str((draft or {}).get("title") or ""),
        str((draft or {}).get("subtitle") or ""),
        str((draft or {}).get("cta") or ""),
        " ".join(str(item.get("text") or "") for item in sections),
    ]).lower()
    if any(word in text for word in _TONE_FORMAL):
        tone = "formal"
    elif any(word in text for word in _TONE_CLOSE):
        tone = "cercano"
    else:
        tone = "directo"
    if any(word in text for word in _STYLE_SELL):
        style = "comercial"
    elif any(word in text for word in _STYLE_WARM):
        style = "calido"
    else:
        style = "sobrio"
    roles = []
    for item in sections:
        role = item.get("role")
        if role not in ROLES:
            blob = (str(item.get("title") or "") + " " + str(item.get("text") or "")).lower()
            if any(word in blob for word in ("duda", "precio", "miedo", "objec")):
                role = "objecion"
            elif any(word in blob for word in ("caso", "prueba", "resultado", "reseña", "resena")):
                role = "prueba"
            elif any(word in blob for word in ("cita", "reserva", "paso", "contacto", "escribe")):
                role = "paso"
            else:
                role = "oferta"
        if role not in roles:
            roles.append(role)
    return {"tone": tone, "style": style, "structure": roles[:4] or ["oferta"]}


def _public(document, owner_id):
    if not isinstance(document, dict) or document.get("user_id") != owner_id:
        return None
    tone = document.get("tone") if document.get("tone") in TONES else "directo"
    style = document.get("style") if document.get("style") in STYLES else "sobrio"
    structure = [item for item in document.get("structure") or [] if item in ROLES][:4]
    kept = document.get("kept")
    reverted = document.get("reverted")
    return {
        "tone": tone,
        "style": style,
        "structure": structure or ["oferta"],
        "kept": int(kept) if isinstance(kept, int) and not isinstance(kept, bool) else 0,
        "reverted": int(reverted) if isinstance(reverted, int) and not isinstance(reverted, bool) else 0,
    }


async def load_preferences(collection, owner_id: str):
    if collection is None or not owner_id:
        return None
    document = await collection.find_one({"user_id": owner_id}, {"_id": 0})
    return _public(document, owner_id)


async def remember_saved(collection, owner_id: str, preview: dict) -> None:
    if collection is None or not owner_id or not isinstance(preview, dict):
        return
    versions = [item for item in preview.get("versions") or [] if isinstance(item, dict)]
    if not versions:
        return
    preference = versions[-1].get("preference")
    if not isinstance(preference, dict):
        return
    tone = preference.get("tone") if preference.get("tone") in TONES else None
    style = preference.get("style") if preference.get("style") in STYLES else None
    structure = [item for item in preference.get("structure") or [] if item in ROLES][:4]
    if not tone or not style or not structure:
        return
    current = await collection.find_one({"user_id": owner_id}, {"_id": 0})
    replaced = 0
    if isinstance(current, dict) and current.get("user_id") == owner_id:
        if (
            current.get("tone") != tone
            or current.get("style") != style
            or list(current.get("structure") or []) != structure
        ):
            replaced = 1
    await collection.update_one(
        {"user_id": owner_id},
        {"$set": {
            "user_id": owner_id,
            "tone": tone,
            "style": style,
            "structure": structure,
            "updated_at": _now(),
        }, "$inc": {"kept": 1, "reverted": replaced}},
        upsert=True,
    )


async def load_owner_memory(database, owner_id: str):
    collection = getattr(database, "builder_preferences", None)
    if collection is None:
        return None
    try:
        return await load_preferences(collection, owner_id)
    except Exception:
        logger.warning("executor_rejected category=memory")
        return None


async def remember_owner_preview(database, owner_id: str, preview: dict) -> None:
    collection = getattr(database, "builder_preferences", None)
    if collection is None:
        return
    try:
        await remember_saved(collection, owner_id, preview)
    except Exception:
        logger.warning("executor_rejected category=memory")
