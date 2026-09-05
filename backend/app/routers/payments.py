import logging
import uuid
from datetime import datetime, timezone
from urllib.parse import urlsplit

import stripe
from fastapi import APIRouter, HTTPException, Request

from backend.app.core.config import ALLOWED_ORIGINS, CREDIT_LEDGER_COLLECTION, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
from backend.app.core.security import get_current_user
from backend.app.db.mongodb import db
from backend.app.domain.plans import ONE_TIME_OFFERS, PLANS
from backend.app.schemas.payments import CheckoutCreate
from backend.app.services.credits import get_plan_included_credits, grant_plan_credits


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["payments"])


def resolve_checkout_origin(origin_url) -> str:
    requested = urlsplit(str(origin_url))
    requested_origin = f"{requested.scheme}://{requested.netloc}".rstrip("/")
    allowed = {
        f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
        for parsed in (urlsplit(origin) for origin in ALLOWED_ORIGINS)
    }
    if requested_origin not in allowed:
        raise HTTPException(status_code=400, detail="Invalid checkout origin")
    return requested_origin


def resolve_checkout_item(checkout_data: CheckoutCreate):
    if checkout_data.item_type == "one_time_offer":
        offer_id = checkout_data.item_id
        offer = ONE_TIME_OFFERS.get(offer_id)

        if not offer:
            raise HTTPException(status_code=400, detail="Invalid one-time offer")

        return {
            "item_type": "one_time_offer",
            "item_id": offer_id,
            "name": offer["name"],
            "price": offer["price"],
            "description": offer["description"],
        }

    plan_id = checkout_data.plan_id or checkout_data.item_id
    plan = PLANS.get(plan_id)

    if not plan or plan_id == "free":
        raise HTTPException(status_code=400, detail="Invalid plan")

    return {
        "item_type": "plan",
        "item_id": plan_id,
        "name": plan["name"],
        "price": plan["price"],
        "description": f"Acceso al plan {plan['name']}",
    }


async def finalize_paid_transaction(transaction: dict, session_id: str):
    """Resume only from durable evidence; never retry an ambiguous grant.

    The grant identity belongs to credits.py and is unchanged. A stranded claim
    without an effective ledger entry requires reconciliation, not lease expiry.
    Plan assignment is claimed separately; interrupted assignment is recoverable
    only when the user document proves the intended effect.
    """
    identity = {"stripe_session_id": session_id, "user_id": transaction["user_id"]}
    current = await db.payment_transactions.find_one(identity, {"_id": 0})
    if not current or _provision_complete(current):
        return current
    if current.get("finalization_status") == "complete":
        # Pre-recovery code could synthesize terminal success after zero-match
        # effects. It has no validated receipt; re-evaluate without regranting.
        await db.payment_transactions.update_one(
            {**identity, "finalization_status": "complete", "finalization_version": {"$exists": False}},
            {"$set": {"finalization_status": "reconciliation_required", "status": "pending"}},
        )
    before_user = await db.users.find_one({"user_id": current["user_id"]}, {"_id": 0, "plan": 1})
    owner = uuid.uuid4().hex
    claimed = await db.payment_transactions.find_one_and_update(
        {**identity, "finalization_status": {"$exists": False}},
        {"$set": {"finalization_status": "processing", "finalization_owner": owner,
                  "finalization_phase": "grant", "payment_status": "paid", "status": "pending",
                  "finalization_previous_plan": (before_user or {}).get("plan")}},
        projection={"_id": 0},
        return_document=True,
    )
    try:
        current = claimed or await db.payment_transactions.find_one(identity, {"_id": 0})
        if not current or _provision_complete(current):
            return current
        is_plan = current.get("item_type", "plan") == "plan"
        plan_id = current.get("item_id") or current.get("plan_id")
        if is_plan and (not plan_id or plan_id not in PLANS or plan_id == "free"):
            raise RuntimeError("Invalid persisted payment plan")
        if claimed and is_plan:
            # Only the first claim may enter the grant service. Recovery below
            # reads its ledger directly and never clears credit pending markers.
            await grant_plan_credits(user_id=current["user_id"], plan_id=plan_id,
                                     source_ref=session_id, source_type="plan_payment")
        return await _resume_paid_transaction(identity, current, is_plan, plan_id)
    except BaseException:
        # Includes task cancellation. A hard process loss needs no catch: its
        # durable processing phase is handled by the same evidence-only path.
        try:
            await db.payment_transactions.update_one(
                {**identity, "finalization_status": {"$ne": "complete"}},
                {"$set": {"finalization_resolution": "reconciliation_required"}},
            )
        except BaseException:
            pass  # Do not replace the original failure or erase its claim.
        raise


async def _resume_paid_transaction(identity, current, is_plan, plan_id):
    evidence = {}
    if is_plan:
        expected_credits = get_plan_included_credits(plan_id)
        entry = await db[CREDIT_LEDGER_COLLECTION].find_one({
            "user_id": current["user_id"], "reason_code": "plan_grant",
            "meta.plan_id": plan_id, "meta.source_ref": identity["stripe_session_id"],
        }, {"_id": 0})
        recorded_credits = entry.get("credits_delta") if entry else None
        valid_credit_evidence = (
            expected_credits > 0
            and isinstance(recorded_credits, int)
            and not isinstance(recorded_credits, bool)
            and recorded_credits == expected_credits
        )
        if (not entry or entry.get("operation_status") not in {None, "completed"}
                or not valid_credit_evidence):
            await db.payment_transactions.update_one(
                {**identity, "finalization_status": {"$ne": "complete"}},
                {"$set": {"payment_status": "paid", "status": "pending",
                          "finalization_resolution": "reconciliation_required"}},
            )
            return await db.payment_transactions.find_one(identity, {"_id": 0})
        evidence = {"credits_grant_status": "granted",
                    "credits_grant_delta": entry["credits_delta"],
                    "credits_granted_at": entry.get("created_at"),
                    "credits_grant_entry_id": entry.get("entry_id")}

    await db.payment_transactions.update_one(
        {**identity, "finalization_status": {"$in": ["processing", "reconciliation_required"]}},
        {"$set": {**evidence, "finalization_status": "grant_confirmed",
                  "finalization_phase": "plan", "payment_status": "paid", "status": "pending"}},
    )
    plan_owner = uuid.uuid4().hex
    plan_claim = await db.payment_transactions.find_one_and_update(
        {**identity, "finalization_status": "grant_confirmed"},
        {"$set": {"finalization_status": "plan_applying", "finalization_owner": plan_owner}},
        projection={"_id": 0}, return_document=True,
    )
    if plan_claim and is_plan:
        if "finalization_previous_plan" not in plan_claim:
            # Historical claims have no baseline. Only an already-applied plan
            # can be confirmed; do not overwrite an unknown intervening change.
            result = None
        else:
            result = await db.users.update_one(
                {"user_id": current["user_id"], "plan": plan_claim["finalization_previous_plan"]},
                {"$set": {"plan": plan_id}},
            )
        if result is not None and result.matched_count != 1:
            user = await db.users.find_one({"user_id": current["user_id"]}, {"_id": 0, "plan": 1})
            if not user or user.get("plan") != plan_id:
                raise RuntimeError("Payment plan baseline no longer matches")
    if is_plan:
        user = await db.users.find_one({"user_id": current["user_id"]}, {"_id": 0, "plan": 1})
        if not user or user.get("plan") != plan_id:
            await db.payment_transactions.update_one(
                {**identity, "finalization_status": "plan_applying"},
                {"$set": {"finalization_resolution": "reconciliation_required"}},
            )
            return await db.payment_transactions.find_one(identity, {"_id": 0})
    # A losing recovery may close only after reading the same durable effects.
    # An unknown/zero-match write never becomes a synthesized success response.
    await db.payment_transactions.update_one(
        {**identity, "finalization_status": "plan_applying"},
        {"$set": {"finalization_status": "complete", "finalization_phase": "complete",
                  "finalization_version": 1,
                  "finalization_resolution": "resolved", "status": "complete", "payment_status": "paid"}},
    )
    return await db.payment_transactions.find_one(identity, {"_id": 0})


def _provision_complete(transaction):
    return bool(transaction and transaction.get("finalization_status") == "complete"
                and transaction.get("finalization_version") == 1)


def _payment_response(transaction):
    transaction = transaction or {}
    return {
        "status": ("complete" if _provision_complete(transaction)
                   else "pending" if transaction.get("payment_status") == "paid"
                   else transaction.get("status", "pending")),
        "payment_status": transaction.get("payment_status"),
        "item_type": transaction.get("item_type", "plan"),
        "item_id": transaction.get("item_id") or transaction.get("plan_id"),
    }


@router.post("/checkout")
async def create_checkout(checkout_data: CheckoutCreate, request: Request):
    user = await get_current_user(request)

    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Missing Stripe secret key")

    item = resolve_checkout_item(checkout_data)
    amount = int(item["price"] * 100)

    stripe.api_key = STRIPE_SECRET_KEY

    host_url = resolve_checkout_origin(checkout_data.origin_url)
    success_url = f"{host_url}/dashboard/billing?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/dashboard/billing"

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": f"Sistema Maestro - {item['name']}",
                            "description": item["description"],
                        },
                        "unit_amount": amount,
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user["user_id"],
                "user_email": user["email"],
                "item_type": item["item_type"],
                "item_id": item["item_id"],
            },
        )

        transaction_doc = {
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "user_email": user["email"],
            "item_type": item["item_type"],
            "item_id": item["item_id"],
            "amount": item["price"],
            "currency": "eur",
            "stripe_session_id": session.id,
            "status": "pending",
            "payment_status": "initiated",
            "credits_grant_status": (
                "not_applicable"
                if item["item_type"] != "plan"
                else "pending"
            ),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if item["item_type"] == "plan":
            transaction_doc["plan_id"] = item["item_id"]
        else:
            transaction_doc["offer_id"] = item["item_id"]

        await db.payment_transactions.insert_one(transaction_doc)

        return {
            "url": session.url,
            "session_id": session.id,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.error(f"Stripe checkout error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Error al crear sesión de pago",
        )


@router.get("/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    user = await get_current_user(request)

    transaction = await db.payment_transactions.find_one(
        {
            "stripe_session_id": session_id,
            "user_id": user["user_id"],
        },
        {"_id": 0},
    )

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.get("payment_status") == "paid":
        if not _provision_complete(transaction):
            try:
                transaction = await finalize_paid_transaction(transaction, session_id)
            except Exception:
                transaction = await db.payment_transactions.find_one(
                    {"stripe_session_id": session_id, "user_id": user["user_id"]}, {"_id": 0})
        return _payment_response(transaction)

    if not STRIPE_SECRET_KEY:
        return {
            "status": transaction.get("status"),
            "payment_status": transaction.get("payment_status"),
            "item_type": transaction.get("item_type", "plan"),
            "item_id": transaction.get("item_id") or transaction.get("plan_id"),
        }

    stripe.api_key = STRIPE_SECRET_KEY

    try:
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status == "paid":
            transaction = await finalize_paid_transaction(transaction, session_id)
            return _payment_response(transaction)

        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "item_type": transaction.get("item_type", "plan"),
            "item_id": transaction.get("item_id") or transaction.get("plan_id"),
        }

    except Exception as exc:
        logger.error(f"Payment status check error: {exc}")

        transaction = await db.payment_transactions.find_one(
            {"stripe_session_id": session_id, "user_id": user["user_id"]}, {"_id": 0})
        return _payment_response(transaction)


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Missing Stripe secret key",
        )

    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Missing Stripe webhook secret",
        )

    body = await request.body()
    signature = request.headers.get("Stripe-Signature")

    if not signature:
        raise HTTPException(
            status_code=400,
            detail="Missing Stripe signature",
        )

    stripe.api_key = STRIPE_SECRET_KEY

    try:
        event = stripe.Webhook.construct_event(
            payload=body,
            sig_header=signature,
            secret=STRIPE_WEBHOOK_SECRET,
        )

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook payload",
        )

    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=400,
            detail="Invalid Stripe signature",
        )

    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session["id"]

        if session.get("payment_status") == "paid":
            transaction = await db.payment_transactions.find_one(
                {"stripe_session_id": session_id},
                {"_id": 0},
            )

            if transaction:
                result = await finalize_paid_transaction(transaction, session_id)
                if not _provision_complete(result):
                    raise HTTPException(status_code=503, detail="Payment finalization pending reconciliation")

    return {"received": True}
