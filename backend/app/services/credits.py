import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from backend.app.core.config import CREDIT_LEDGER_COLLECTION, PLAN_INCLUDED_CREDITS
from backend.app.db.mongodb import db

INITIAL_FREE_GRANT_REASON = "initial_free_grant"
INITIAL_FREE_GRANT_SOURCE_REF = "registration_free_grant_v1"


class InsufficientCreditsError(ValueError):
    """The atomic balance gate rejected a standard consumption."""


class CreditOperationBusyError(RuntimeError):
    """Another consumption is being finalized for the same user."""

    def __init__(self, message: str, *, operation_status: str = "pending"):
        super().__init__(message)
        # An active same-key operation is not an unapplied contended intent.
        self.operation_status = operation_status


class CreditLedgerPersistenceError(RuntimeError):
    """A debit could not be durably finalized in the credit ledger."""

    def __init__(self, message: str, *, compensated: bool):
        super().__init__(message)
        self.compensated = compensated


def _consumption_ledger_id(user_id: str, operation_id: str) -> str:
    identity = f"{user_id}\x00{operation_id}".encode("utf-8")
    return f"cled_consume_{hashlib.sha256(identity).hexdigest()[:32]}"


def _consumption_fingerprint(
    *,
    credits_amount: int,
    reason_code: str,
    project_id: Optional[str],
    meta: Dict[str, Any],
) -> Dict[str, Any]:
    return {
        "credits_amount": int(credits_amount),
        "reason_code": reason_code,
        "project_id": project_id,
        "action_key": meta.get("action_key"),
        "request_fingerprint": meta.get("request_fingerprint"),
    }


def _assert_matching_consumption(
    entry: Dict[str, Any],
    fingerprint: Dict[str, Any],
) -> None:
    recorded = entry.get("operation_fingerprint") or {}
    if recorded != fingerprint:
        raise ValueError("Credit operation identity was reused with different inputs")


async def consume_standard_credits(
    *,
    user_id: str,
    credits_amount: int,
    operation_id: str,
    reason_code: str = "consumption_execute",
    meta: Optional[Dict[str, Any]] = None,
    project_id: Optional[str] = None,
    defer_finalization: bool = False,
) -> Dict[str, Any]:
    if int(credits_amount) <= 0:
        raise ValueError("Credit consumption amount must be positive")
    return await _apply_credit_movement(
        user_id=user_id, credits_delta=-int(credits_amount), operation_id=operation_id,
        reason_code=reason_code, meta=meta, project_id=project_id,
        defer_finalization=defer_finalization,
    )


async def _apply_credit_movement(
    *,
    user_id: str,
    credits_delta: int,
    operation_id: str,
    reason_code: str,
    meta: Optional[Dict[str, Any]] = None,
    project_id: Optional[str] = None,
    defer_finalization: bool = False,
) -> Dict[str, Any]:
    """Atomically debit standard credits and durably record one logical operation.

    MongoDB's built-in unique ``_id`` index provides the idempotency lock without
    requiring a migration. A short-lived marker on the user document serializes
    balance mutations. If ledger finalization fails after the debit, the debit is
    compensated before the error is returned.
    """

    delta = int(credits_delta)
    amount = abs(delta)
    required_balance = max(0, -delta)
    lifetime_used_delta = max(0, -delta)
    lifetime_granted_delta = max(0, delta)
    normalized_operation_id = str(operation_id or "").strip()
    operation_meta = dict(meta or {})

    if not normalized_operation_id:
        raise ValueError("Credit consumption requires an operation identity")

    ledger = db[CREDIT_LEDGER_COLLECTION]
    ledger_id = _consumption_ledger_id(user_id, normalized_operation_id)
    fingerprint = _consumption_fingerprint(
        credits_amount=amount,
        reason_code=reason_code,
        project_id=project_id,
        meta=operation_meta,
    )
    fingerprint["credits_delta"] = delta
    now_iso = datetime.now(timezone.utc).isoformat()
    intent = {
        "_id": ledger_id,
        "entry_id": ledger_id,
        "operation_id": normalized_operation_id,
        "operation_fingerprint": fingerprint,
        "operation_status": "pending",
        "user_id": user_id,
        "project_id": project_id,
        "type": "consumption" if delta < 0 else "grant",
        "credits_delta": delta,
        "credits_balance_after": None,
        "reason_code": reason_code,
        "meta": operation_meta,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    existing_entry = None
    try:
        await ledger.insert_one(intent)
    except Exception:
        existing_entry = await ledger.find_one({"_id": ledger_id}, {"_id": 0})
        if existing_entry is None:
            raise
        _assert_matching_consumption(existing_entry, fingerprint)

        status = existing_entry.get("operation_status")
        if status == "completed":
            await db.users.update_one(
                {
                    "user_id": user_id,
                    "credit_pending_consumption.operation_id": normalized_operation_id,
                },
                {"$unset": {"credit_pending_consumption": ""}},
            )
            return {
                "effective": True,
                "reason": reason_code,
                "credits_delta": delta,
                "balance_after": int(existing_entry["credits_balance_after"]),
                "created_at": existing_entry.get("created_at"),
                "entry_id": existing_entry.get("entry_id", ledger_id),
                "operation_id": normalized_operation_id,
                "operation_status": "completed",
                "durable_result": existing_entry.get("durable_result"),
                "idempotent_replay": True,
            }
        if status == "blocked_busy":
            # This state is written only after the balance update matched no
            # user: no effect occurred. CAS elects exactly one retry owner.
            # Any ambiguous CAS outcome remains pending and is NOT stolen.
            reclaimed = await ledger.update_one(
                {"_id": ledger_id, "operation_status": "blocked_busy"},
                {"$set": {"operation_status": "pending", "updated_at": now_iso}},
            )
            if reclaimed.modified_count != 1:
                raise CreditOperationBusyError("Another retry owns the credit operation")
            existing_entry = None
        elif status in {"pending", "reserved", "compensating"}:
            # Only the insert winner owns execution. A stale/crashed operation
            # must be reconciled, never resumed by a competing HTTP retry.
            raise CreditOperationBusyError(
                "Credit operation is in progress or requires reconciliation",
                operation_status=status,
            )
        elif status == "blocked_insufficient":
            raise InsufficientCreditsError("Credit balance is insufficient")
        elif status in {"compensated", "reconciliation_required"}:
            raise CreditLedgerPersistenceError(
                "Prior credit operation did not complete durably",
                compensated=status == "compensated",
            )
        elif status != "blocked_busy":
            raise CreditLedgerPersistenceError("Unknown credit operation state", compensated=False)

    pending_marker = {
        "operation_id": normalized_operation_id,
        "ledger_id": ledger_id,
        "credits_amount": amount,
        "credits_delta": delta,
        "created_at": now_iso,
    }
    updated_user = await db.users.find_one_and_update(
        {
            "user_id": user_id,
            "credit_balance": {"$gte": required_balance},
            "$or": [
                {"credit_pending_consumption": {"$exists": False}},
                {"credit_pending_consumption": None},
            ],
        },
        {
            "$inc": {
                "credit_balance": delta,
                "credit_lifetime_used": lifetime_used_delta,
                "credit_lifetime_granted": lifetime_granted_delta,
            },
            "$set": {"credit_pending_consumption": pending_marker},
        },
        projection={
            "_id": 0,
            "credit_balance": 1,
            "credit_pending_consumption": 1,
        },
        return_document=True,
    )

    if updated_user is None:
        user = await db.users.find_one(
            {"user_id": user_id},
            {
                "_id": 0,
                "credit_balance": 1,
                "credit_pending_consumption": 1,
            },
        )
        if user is None:
            raise ValueError("User not found")

        current_pending = user.get("credit_pending_consumption") or {}
        if current_pending:
            await ledger.update_one(
                {"_id": ledger_id, "operation_status": "pending"},
                {"$set": {"operation_status": "blocked_busy", "updated_at": now_iso}},
            )
            raise CreditOperationBusyError(
                "Another credit operation is in progress", operation_status="blocked_busy",
            )
        elif int(user.get("credit_balance", 0) or 0) < required_balance:
            blocked_at = datetime.now(timezone.utc).isoformat()
            await ledger.update_one(
                {"_id": ledger_id, "operation_status": "pending"},
                {
                    "$set": {
                        "operation_status": "blocked_insufficient",
                        "updated_at": blocked_at,
                    }
                },
            )
            raise InsufficientCreditsError("Credit balance is insufficient")
        else:
            await ledger.update_one(
                {"_id": ledger_id, "operation_status": "pending"},
                {"$set": {"operation_status": "blocked_busy", "updated_at": now_iso}},
            )
            raise CreditOperationBusyError(
                "Another credit operation is being finalized; retry is safe",
                operation_status="blocked_busy",
            )

    balance_after = int(updated_user.get("credit_balance", 0) or 0)
    finalized_at = datetime.now(timezone.utc).isoformat()
    target_status = "reserved" if defer_finalization else "completed"

    try:
        completion = await ledger.update_one(
            {"_id": ledger_id, "operation_status": "pending"},
            {
                "$set": {
                    "operation_status": target_status,
                    "credits_balance_after": balance_after,
                    "updated_at": finalized_at,
                    f"{target_status}_at": finalized_at,
                }
            },
        )
        if completion.modified_count == 0:
            completed_entry = await ledger.find_one({"_id": ledger_id}, {"_id": 0})
            if not completed_entry or completed_entry.get("operation_status") != target_status:
                raise RuntimeError("Credit ledger intent could not be finalized")
            _assert_matching_consumption(completed_entry, fingerprint)
            balance_after = int(completed_entry["credits_balance_after"])
    except Exception as exc:
        completed_entry = await ledger.find_one({"_id": ledger_id}, {"_id": 0})
        if completed_entry and completed_entry.get("operation_status") == target_status:
            _assert_matching_consumption(completed_entry, fingerprint)
            balance_after = int(completed_entry["credits_balance_after"])
        else:
            await compensate_standard_credit_consumption(
                user_id=user_id,
                operation_id=normalized_operation_id,
                failure_type=exc.__class__.__name__,
            )
            raise CreditLedgerPersistenceError(
                "Credit ledger finalization failed",
                compensated=True,
            ) from exc

    if not defer_finalization:
        await db.users.update_one(
            {
                "user_id": user_id,
                "credit_pending_consumption.operation_id": normalized_operation_id,
            },
            {"$unset": {"credit_pending_consumption": ""}},
        )

    return {
        "effective": True,
        "reason": reason_code,
        "credits_delta": delta,
        "balance_after": balance_after,
        "created_at": finalized_at,
        "entry_id": ledger_id,
        "operation_id": normalized_operation_id,
        "operation_status": target_status,
        "durable_result": None,
        "idempotent_replay": existing_entry is not None,
    }


async def finalize_standard_credit_consumption(
    *,
    user_id: str,
    operation_id: str,
    durable_result: Dict[str, Any],
) -> Dict[str, Any]:
    normalized_operation_id = str(operation_id or "").strip()
    if not normalized_operation_id:
        raise ValueError("Credit finalization requires an operation identity")

    ledger = db[CREDIT_LEDGER_COLLECTION]
    ledger_id = _consumption_ledger_id(user_id, normalized_operation_id)
    entry = await ledger.find_one({"_id": ledger_id}, {"_id": 0})
    if entry is None:
        raise ValueError("Credit reservation not found")
    if entry.get("user_id") != user_id:
        raise ValueError("Credit reservation ownership mismatch")
    if entry.get("operation_status") == "completed":
        return entry
    if entry.get("operation_status") != "reserved":
        raise CreditLedgerPersistenceError(
            "Credit reservation is not finalizable",
            compensated=entry.get("operation_status") == "compensated",
        )

    completed_at = datetime.now(timezone.utc).isoformat()
    try:
        await ledger.update_one(
            {"_id": ledger_id, "operation_status": "reserved"},
            {
                "$set": {
                    "operation_status": "completed",
                    "durable_result": dict(durable_result),
                    "updated_at": completed_at,
                    "completed_at": completed_at,
                }
            },
        )
    except Exception:
        # A timeout is not proof that the write failed. Read back the durable
        # terminal state; never refund a potentially completed result.
        entry = await ledger.find_one({"_id": ledger_id}, {"_id": 0})
        if not entry or entry.get("operation_status") != "completed":
            raise CreditLedgerPersistenceError(
                "Credit reservation finalization requires reconciliation",
                compensated=False,
            )
    else:
        entry = await ledger.find_one({"_id": ledger_id}, {"_id": 0})
        if not entry or entry.get("operation_status") != "completed":
            raise CreditLedgerPersistenceError(
                "Credit reservation finalization lost its state transition",
                compensated=False,
            )

    await db.users.update_one(
        {
            "user_id": user_id,
            "credit_pending_consumption.operation_id": normalized_operation_id,
        },
        {"$unset": {"credit_pending_consumption": ""}},
    )
    return entry or {}


async def compensate_standard_credit_consumption(
    *,
    user_id: str,
    operation_id: str,
    failure_type: str,
) -> Dict[str, Any]:
    normalized_operation_id = str(operation_id or "").strip()
    ledger = db[CREDIT_LEDGER_COLLECTION]
    ledger_id = _consumption_ledger_id(user_id, normalized_operation_id)
    entry = await ledger.find_one({"_id": ledger_id}, {"_id": 0})
    if entry is None:
        raise ValueError("Credit reservation not found")
    if entry.get("operation_status") == "compensated":
        return entry
    if entry.get("operation_status") == "completed":
        raise CreditLedgerPersistenceError(
            "Completed credit consumption cannot be compensated",
            compensated=False,
        )

    # Claim the ledger before refunding, mutually exclusive with finalization.
    claim = await ledger.update_one(
        {"_id": ledger_id, "operation_status": {"$in": ["pending", "reserved"]}},
        {"$set": {
            "operation_status": "compensating",
            "failure_type": failure_type,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    if claim.modified_count != 1:
        raise CreditLedgerPersistenceError("Credit compensation is not owned", compensated=False)

    delta = int(entry.get("credits_delta", 0) or 0)
    compensation = await db.users.update_one(
        {
            "user_id": user_id,
            "credit_pending_consumption.operation_id": normalized_operation_id,
            "credit_pending_consumption.refunded": {"$exists": False},
        },
        {
            "$inc": {
                "credit_balance": -delta,
                "credit_lifetime_used": -max(0, -delta),
                "credit_lifetime_granted": -max(0, delta),
            },
            # Retain proof of refund until the ledger acknowledges it. A crash
            # here cannot masquerade as an uncharged pending operation.
            "$set": {"credit_pending_consumption.refunded": True},
        },
    )
    status = "compensated" if compensation.modified_count == 1 else "reconciliation_required"
    compensated_at = datetime.now(timezone.utc).isoformat()
    await ledger.update_one(
        {"_id": ledger_id, "operation_status": "compensating"},
        {
            "$set": {
                "operation_status": status,
                "failure_type": failure_type,
                "updated_at": compensated_at,
                "compensated_at": compensated_at if status == "compensated" else None,
            }
        },
    )
    entry = await ledger.find_one({"_id": ledger_id}, {"_id": 0})
    if status != "compensated":
        raise CreditLedgerPersistenceError(
            "Credit compensation requires reconciliation",
            compensated=False,
        )
    await db.users.update_one(
        {
            "user_id": user_id,
            "credit_pending_consumption.operation_id": normalized_operation_id,
            "credit_pending_consumption.refunded": True,
        },
        {"$unset": {"credit_pending_consumption": ""}},
    )
    return entry or {}


async def get_credit_operation(user_id: str, operation_id: str) -> Optional[Dict[str, Any]]:
    entry = await db[CREDIT_LEDGER_COLLECTION].find_one(
        {"_id": _consumption_ledger_id(user_id, operation_id)}, {"_id": 0}
    )
    # Repair only harmless post-terminal marker cleanup, never infer/replay an
    # unresolved balance mutation. Useful when commit succeeded but reply died.
    if entry and entry.get("operation_status") in {"completed", "compensated"}:
        query = {"user_id": user_id, "credit_pending_consumption.operation_id": operation_id}
        if entry["operation_status"] == "compensated":
            query["credit_pending_consumption.refunded"] = True
        await db.users.update_one(query, {"$unset": {"credit_pending_consumption": ""}})
    return entry


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
            "plan": 1,
            "credit_balance": 1,
            "credit_lifetime_used": 1,
            "credit_lifetime_granted": 1,
            "credit_pending_consumption": 1,
            "credit_initial_free_grant_at": 1
        }
    )

    if user is None:
        raise ValueError("User not found")

    pending = user.get("credit_pending_consumption") or {}
    if pending.get("operation_id"):
        await get_credit_operation(user_id, pending["operation_id"])

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

    for field, value in update_fields.items():
        await db.users.update_one(
            {"user_id": user_id, field: {"$exists": False}},
            {"$set": {field: value}}
        )

    initial_free_credits = get_plan_included_credits("free")
    has_initial_grant = bool(user.get("credit_initial_free_grant_at"))
    has_credit_history = (
        credit_balance > 0 or
        credit_lifetime_used > 0 or
        credit_lifetime_granted > 0
    )

    if initial_free_credits > 0 and not has_initial_grant and not has_credit_history:
        existing_initial_grant = await db[CREDIT_LEDGER_COLLECTION].find_one(
            {
                "user_id": user_id,
                "reason_code": INITIAL_FREE_GRANT_REASON
            },
            {"_id": 0}
        )

        if not existing_initial_grant or existing_initial_grant.get("operation_status") not in {None, "completed"}:
            now_iso = datetime.now(timezone.utc).isoformat()
            movement = await _apply_credit_movement(
                user_id=user_id, credits_delta=initial_free_credits,
                operation_id=INITIAL_FREE_GRANT_SOURCE_REF,
                reason_code=INITIAL_FREE_GRANT_REASON,
                meta={"plan_id": "free", "source_ref": INITIAL_FREE_GRANT_SOURCE_REF,
                      "source_type": "registration_initial_capacity"},
            )
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"credit_last_grant_at": now_iso, "credit_initial_free_grant_at": now_iso}},
            )
            credit_balance = movement["balance_after"]
            if not movement["idempotent_replay"]:
                credit_lifetime_granted += initial_free_credits

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

    if existing_entry and existing_entry.get("operation_status") in {None, "completed"}:
        return {
            "granted": False,
            "effective": True,
            "reason": "already_granted",
            "credits_delta": 0,
            "balance_after": int(existing_entry.get("credits_balance_after", current_profile["credit_balance"])),
            "created_at": existing_entry.get("created_at")
        }

    now_iso = datetime.now(timezone.utc).isoformat()

    movement = await _apply_credit_movement(
        user_id=user_id,
        credits_delta=included_credits,
        operation_id=f"plan_grant:{plan_id}:{source_ref}",
        reason_code="plan_grant",
        meta={
            "plan_id": plan_id,
            "source_ref": source_ref,
            "source_type": source_type
        }
    )
    await db.users.update_one(
        {"user_id": user_id}, {"$set": {"credit_last_grant_at": now_iso}},
    )

    return {
        "granted": not movement["idempotent_replay"],
        "effective": True,
        "reason": "already_granted" if movement["idempotent_replay"] else "plan_grant",
        "credits_delta": 0 if movement["idempotent_replay"] else included_credits,
        "balance_after": movement["balance_after"],
        "created_at": movement["created_at"],
        "entry_id": movement["entry_id"],
    }


async def apply_manual_credit_adjustment(
    user_id: str,
    credits_delta: int,
    reason_code: str = "admin_adjustment",
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    await ensure_user_credit_profile(user_id)
    operation_meta = dict(meta or {})
    # Legacy callers without a retry identity still get a durable trace. Their
    # HTTP-level retry identity cannot be inferred safely from amount/reason.
    operation_id = str(operation_meta.get("operation_id") or uuid.uuid4().hex)
    movement = await _apply_credit_movement(
        user_id=user_id,
        credits_delta=int(credits_delta),
        operation_id=f"manual_adjustment:{operation_id}",
        reason_code=reason_code,
        meta=operation_meta,
    )

    return {
        "granted": int(credits_delta) > 0,
        "effective": True,
        "reason": reason_code,
        "credits_delta": int(credits_delta),
        "balance_after": movement["balance_after"],
        "created_at": movement["created_at"],
        "entry_id": movement["entry_id"],
        "operation_id": movement["operation_id"],
        "idempotent_replay": movement["idempotent_replay"],
    }
