"""Preview-stream charge failures must not leave the SSE stream open.

Successful reservations, refunds and the admin free-test skip stay in the
existing economic operation. This module only classifies a failure that
happens before the preview work starts, records a separate pending charge
for later reconciliation, and chooses the SSE events the stream will emit.
"""
import logging
import os
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

PENDING_COLLECTION = "builder_pending_charges"
PLANS_URL = "/dashboard/billing"
PENDING_MESSAGE = "Cobro pendiente de confirmar"
INSUFFICIENT_MESSAGE = "No tienes gemas suficientes"
CONFLICT_MESSAGE = "Esta generación ya está en curso o esta clave ya se usó."

_CAUSE_CATEGORY = {
    "TimeoutError": "timeout",
    "ServerSelectionTimeoutError": "timeout",
    "NetworkTimeout": "timeout",
    "AutoReconnect": "ledger_error",
    "ConnectionFailure": "ledger_error",
    "PyMongoError": "ledger_error",
    "OperationFailure": "ledger_error",
}


def charge_failure_policy() -> str:
    """`notice` stops a 402 with a clear event. `continue` runs without gems.

    Unset, empty and unknown values stay on `notice`. Running for free on a
    typo would let any account without gems generate.
    """
    raw = os.environ.get("BUILDER_CHARGE_FAILURE_POLICY")
    if raw is None:
        return "notice"
    value = raw.strip().lower()
    if value == "continue":
        return "continue"
    return "notice"


def classify_charge_failure(exc: BaseException) -> str:
    """`insufficient`, `conflict` or `technical`.

    409 and other client errors are terminal. 402 follows the policy flag.
    Ledger, timeout, reconciliation and unexpected charge errors are technical
    and must not block the generation.
    """
    status = getattr(exc, "status_code", None)
    if status == 402:
        return "insufficient"
    if status in {400, 401, 403, 404, 409, 422}:
        return "conflict"
    return "technical"


def charge_error_category(exc: BaseException) -> str:
    """Stable category token. Never the exception text, which can carry URIs."""
    status = getattr(exc, "status_code", None)
    detail = getattr(exc, "detail", None)
    code = detail.get("code") if isinstance(detail, dict) else ""
    cause = exc.__cause__ or exc
    mapped = _CAUSE_CATEGORY.get(type(cause).__name__)
    if mapped:
        return mapped
    if code == "economic_reconciliation_required" or status == 503:
        return "reconciliation"
    if status == 402:
        return "insufficient_gems"
    if status == 409:
        return "conflict"
    return "unexpected"


def log_pending_charge(*, run_id: str, user_id: str, project_id: str, category: str) -> None:
    logger.error(
        "builder_charge_pending run_id=%s user_id=%s project_id=%s category=%s",
        run_id,
        user_id,
        project_id,
        category,
    )


async def record_pending_charge(
    database,
    *,
    run_id: str,
    user_id: str,
    project_id: str,
    operation_id: str,
    category: str,
) -> None:
    """A new collection. The credit ledger and its refund rules stay untouched."""
    document = {
        "_id": operation_id,
        "status": "pending",
        "run_id": run_id,
        "user_id": user_id,
        "project_id": project_id,
        "operation_id": operation_id,
        "category": category,
        "action": "builder_preview",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        collection = getattr(database, PENDING_COLLECTION)
        await collection.insert_one(document)
    except Exception:
        logger.error(
            "builder_pending_charge_record_failed run_id=%s user_id=%s project_id=%s category=%s",
            run_id,
            user_id,
            project_id,
            category,
        )


def pending_notice_event(category: str) -> dict:
    return {
        "type": "notice",
        "code": "pending_charge",
        "category": category,
        "message": PENDING_MESSAGE,
    }


def insufficient_events() -> list:
    payload = {
        "code": "insufficient_gems",
        "message": INSUFFICIENT_MESSAGE,
        "plansUrl": PLANS_URL,
    }
    return [
        {"type": "notice", **payload},
        {"type": "error", **payload},
    ]


def conflict_event() -> dict:
    return {
        "type": "error",
        "code": "duplicate_run",
        "message": CONFLICT_MESSAGE,
    }


async def settle_uncharged_stream(
    exc: BaseException,
    *,
    user: dict,
    project_id: str,
    operation_id: str,
    work,
    publish,
    database,
) -> None:
    """Publish SSE events for a charge that failed before work, then maybe run it.

    `publish` is an async callable that queues one SSE object. The caller closes
    the stream when `work` finishes or when this function queues the sentinel
    itself for a terminal refusal.
    """
    kind = classify_charge_failure(exc)
    if kind == "conflict":
        await publish(conflict_event())
        await publish(None)
        return
    if kind == "insufficient" and charge_failure_policy() != "continue":
        for event in insufficient_events():
            await publish(event)
        await publish(None)
        return

    category = charge_error_category(exc)
    user_id = str(user.get("user_id") or "")
    log_pending_charge(
        run_id=operation_id,
        user_id=user_id,
        project_id=project_id,
        category=category,
    )
    await record_pending_charge(
        database,
        run_id=operation_id,
        user_id=user_id,
        project_id=project_id,
        operation_id=operation_id,
        category=category,
    )
    await publish(pending_notice_event(category))
    await work({
        "status": "skipped",
        "reason": "pending_charge",
        "trace": {"operation_status": "pending"},
    })


async def emit_replay_or_conflict(result, publish) -> None:
    """A completed idempotent replay has no work task. Still end the stream."""
    if isinstance(result, dict) and isinstance(result.get("html"), str) and result.get("html"):
        await publish({"type": "done", **result})
    else:
        await publish(conflict_event())
    await publish(None)
