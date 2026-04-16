import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from backend.app.core.config import CREDIT_LEDGER_COLLECTION, PLAN_INCLUDED_CREDITS
from backend.app.db.mongodb import db


def get_plan_included_credits(plan_id: str) -> int:
    raw_value = PLAN_INCLUDED_CREDITS.get(plan_id, 0)
    try:
        return max(0, int(raw_value))
    except (TypeError, ValueError):
        return 0


async def ensure_user_credit_profile(user_id: str) -> Dict[str, int]:
    user = await db.users.find_one(
        {"user_id": user_id},
        {
            "_id": 0,
            "credit_balance": 1,
            "credit_lifetime_used": 1,
            "credit_lifetime_granted": 1
        }
    )

    if not user:
        raise ValueError("User not found")

    credit_balance = int(user.get("credit_balance", 0) or 0)
    credit_lifetime_used = int(user.get("credit_lifetime_used", 0) or 0)
    credit_lifetime_granted = int(user.get("credit_lifetime_granted", 0) or 0)

    update_fields = {}

    if "credit_balance" not in user:
        update_fields["credit_balance"] = credit_balance

    if "credit_lifetime_used" not in user:
        update_fields["credit_lifetime_used"] = credit_lifetime_used

    if "credit_lifetime_granted" not in user:
        update_fields["credit_lifetime_granted"] = credit_lifetime_granted

    if update_fields:
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": update_fields}
        )

    return {
        "credit_balance": credit_balance,
        "credit_lifetime_used": credit_lifetime_used,
        "credit_lifetime_granted": credit_lifetime_granted
    }


async def get_user_credit_summary(user_id: str) -> Dict[str, int]:
    profile = await ensure_user_credit_profile(user_id)
    return {
        "credit_balance": profile["credit_balance"],
        "credit_lifetime_used": profile["credit_lifetime_used"],
        "credit_lifetime_granted": profile["credit_lifetime_granted"]
    }


async def create_credit_ledger_entry(
    user_id: str,
    credits_delta: int,
    credits_balance_after: int,
    reason_code: str,
    meta: Optional[Dict[str, Any]] = None,
    project_id: Optional[str] = None
) -> Dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()

    entry = {
        "entry_id": f"cled_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "project_id": project_id,
        "type": "grant" if credits_delta >= 0 else "consumption",
        "credits_delta": int(credits_delta),
        "credits_balance_after": int(credits_balance_after),
        "reason_code": reason_code,
        "meta": meta or {},
        "created_at": now_iso
    }

    await db[CREDIT_LEDGER_COLLECTION].insert_one(entry)
    return entry


async def grant_plan_credits(
    user_id: str,
    plan_id: str,
    source_ref: str,
    source_type: str = "plan_payment"
) -> Dict[str, Any]:
    included_credits = get_plan_included_credits(plan_id)

    current_profile = await ensure_user_credit_profile(user_id)

    if included_credits <= 0:
        return {
            "granted": False,
            "effective": False,
            "reason": "no_credits_configured",
            "credits_delta": 0,
            "balance_after": current_profile["credit_balance"],
            "created_at": None
        }

    existing_entry = await db[CREDIT_LEDGER_COLLECTION].find_one(
        {
            "user_id": user_id,
            "reason_code": "plan_grant",
            "meta.plan_id": plan_id,
            "meta.source_ref": source_ref
        },
        {"_id": 0}
    )

    if existing_entry:
        return {
            "granted": False,
            "effective": True,
            "reason": "already_granted",
            "credits_delta": 0,
            "balance_after": int(existing_entry.get("credits_balance_after", current_profile["credit_balance"])),
            "created_at": existing_entry.get("created_at")
        }

    new_balance = current_profile["credit_balance"] + included_credits
    now_iso = datetime.now(timezone.utc).isoformat()

    await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "credit_balance": new_balance,
                "credit_last_grant_at": now_iso
            },
            "$inc": {
                "credit_lifetime_granted": included_credits
            }
        }
    )

    ledger_entry = await create_credit_ledger_entry(
        user_id=user_id,
        credits_delta=included_credits,
        credits_balance_after=new_balance,
        reason_code="plan_grant",
        meta={
            "plan_id": plan_id,
            "source_ref": source_ref,
            "source_type": source_type
        }
    )

    return {
        "granted": True,
        "effective": True,
        "reason": "plan_grant",
        "credits_delta": included_credits,
        "balance_after": new_balance,
        "created_at": ledger_entry["created_at"],
        "entry_id": ledger_entry["entry_id"]
    }


async def apply_manual_credit_adjustment(
    user_id: str,
    credits_delta: int,
    reason_code: str = "admin_adjustment",
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    current_profile = await ensure_user_credit_profile(user_id)
    new_balance = current_profile["credit_balance"] + int(credits_delta)

    if new_balance < 0:
        raise ValueError("Credit balance cannot go below zero")

    await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {"credit_balance": new_balance},
            "$inc": {
                "credit_lifetime_granted": max(0, int(credits_delta)),
                "credit_lifetime_used": abs(min(0, int(credits_delta)))
            }
        }
    )

    ledger_entry = await create_credit_ledger_entry(
        user_id=user_id,
        credits_delta=int(credits_delta),
        credits_balance_after=new_balance,
        reason_code=reason_code,
        meta=meta or {}
    )

    return {
        "granted": int(credits_delta) > 0,
        "effective": True,
        "reason": reason_code,
        "credits_delta": int(credits_delta),
        "balance_after": new_balance,
        "created_at": ledger_entry["created_at"],
        "entry_id": ledger_entry["entry_id"]
    }
