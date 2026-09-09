"""HTTP economic boundary: stable intent, exclusive work, durable response.

No leases or automatic crash recovery: unresolved operations fail closed and
remain discoverable by operation_id and the user's pending marker.
"""
import hashlib
import json
import re
from typing import Any, Awaitable, Callable, Dict

from fastapi import HTTPException, Request
from fastapi.encoders import jsonable_encoder

from backend.app.schemas.consumption import ConsumptionRequest
from backend.app.services.consumption_engine import execute_consumption_for_user
from backend.app.services.credits import (
    compensate_standard_credit_consumption,
    finalize_standard_credit_consumption,
    get_credit_operation,
)


class EconomicPersistenceUncertain(RuntimeError):
    """A result write may have committed; refund would be unsafe."""


def request_operation_id(request: Request, scope: str) -> str:
    key = request.headers.get("Idempotency-Key", "")
    if not re.fullmatch(r"[A-Za-z0-9_-]{8,128}", key):
        raise HTTPException(400, detail={
            "code": "idempotency_key_required",
            "message": "Provide a stable Idempotency-Key (8-128 letters, digits, _ or -).",
        })
    return f"{scope}:{key}"


def request_fingerprint(value: Dict[str, Any]) -> str:
    encoded = json.dumps(jsonable_encoder(value), sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


async def run_economic_operation(
    *,
    user: Dict[str, Any],
    consumption_payload: ConsumptionRequest,
    inputs: Dict[str, Any],
    work: Callable[[Dict[str, Any]], Awaitable[Dict[str, Any]]],
) -> Dict[str, Any]:
    operation_id = consumption_payload.meta.trace_id
    fingerprint = request_fingerprint(inputs)
    consumption_payload.meta.request_fingerprint = fingerprint
    prior = await get_credit_operation(user["user_id"], operation_id)
    if prior:
        if prior.get("meta", {}).get("request_fingerprint") != fingerprint:
            raise HTTPException(409, detail={"code": "idempotency_key_conflict"})
        if prior.get("operation_status") == "completed" and prior.get("durable_result") is not None:
            return prior["durable_result"]
        raise HTTPException(409, detail={
            "code": "economic_operation_unresolved",
            "operation_id": operation_id,
            "operation_status": prior.get("operation_status"),
            "retry_with_new_key": prior.get("operation_status") in {
                "compensated", "blocked_insufficient", "blocked_busy"
            },
        })

    try:
        consumption = await execute_consumption_for_user(
            runtime_user=user, payload=consumption_payload, defer_finalization=True
        )
    except ValueError as exc:
        raise HTTPException(409, detail={"code": "idempotency_key_conflict"}) from exc
    except Exception as exc:
        raise HTTPException(503, detail={
            "code": "economic_reconciliation_required", "operation_id": operation_id,
        }) from exc
    if consumption.status != "allowed":
        state = consumption.trace.operation_status
        status_code = 503 if state == "reconciliation_required" else 409 if state else 402
        detail = consumption.model_dump()
        if state in {"compensated", "blocked_busy", "blocked_insufficient"}:
            detail["retry_with_new_key"] = True
        raise HTTPException(status_code, detail=detail)
    if consumption.trace.idempotent_replay:
        # Another request may finish between our lookup and atomic reservation.
        prior = await get_credit_operation(user["user_id"], operation_id)
        if prior and prior.get("durable_result") is not None:
            return prior["durable_result"]
        raise HTTPException(409, detail={"code": "economic_operation_unresolved"})

    reserved = consumption.trace.operation_status == "reserved"
    try:
        result = jsonable_encoder(await work(consumption.model_dump()))
    except EconomicPersistenceUncertain as exc:
        raise HTTPException(503, detail={
            "code": "economic_reconciliation_required", "operation_id": operation_id,
        }) from exc
    except BaseException as exc:
        if reserved:
            try:
                await compensate_standard_credit_consumption(
                    user_id=user["user_id"], operation_id=operation_id,
                    failure_type=type(exc).__name__,
                )
            except Exception as compensation_error:
                raise HTTPException(503, detail={
                    "code": "economic_reconciliation_required", "operation_id": operation_id,
                }) from compensation_error
        raise

    if reserved:
        # Project documents retain the reservation reference, not a premature
        # completed assertion. The ledger is the authoritative terminal state.
        for field in ("consumption", "analysis_consumption", "blueprint_consumption"):
            economic = result.get(field)
            if economic and economic.get("trace", {}).get("operation_id") == operation_id:
                economic["trace"]["executed"] = True
                economic["trace"]["operation_status"] = "completed"
                economic["ux"]["message"] = "Consumo ejecutado correctamente."
        try:
            await finalize_standard_credit_consumption(
                user_id=user["user_id"], operation_id=operation_id, durable_result=result,
            )
        except Exception as exc:
            # Work may already be durable. Never refund on an ambiguous commit.
            raise HTTPException(503, detail={
                "code": "economic_reconciliation_required", "operation_id": operation_id,
            }) from exc
    return result
