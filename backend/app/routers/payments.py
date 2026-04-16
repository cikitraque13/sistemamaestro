import json
import logging
import uuid
from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, HTTPException, Request

from backend.app.core.config import STRIPE_SECRET_KEY
from backend.app.core.security import get_current_user
from backend.app.db.mongodb import db
from backend.app.domain.plans import ONE_TIME_OFFERS, PLANS
from backend.app.schemas.payments import CheckoutCreate
from backend.app.services.credits import grant_plan_credits

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["payments"])


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
            "description": offer["description"]
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
        "description": f"Acceso al plan {plan['name']}"
    }


async def finalize_paid_transaction(transaction: dict, session_id: str):
    tx_updates = {
        "status": "complete",
        "payment_status": "paid"
    }

    if transaction.get("item_type", "plan") == "plan":
        plan_id = transaction.get("item_id") or transaction.get("plan_id")

        if plan_id:
            await db.users.update_one(
                {"user_id": transaction["user_id"]},
                {"$set": {"plan": plan_id}}
            )

            grant_result = await grant_plan_credits(
                user_id=transaction["user_id"],
                plan_id=plan_id,
                source_ref=session_id,
                source_type="plan_payment"
            )

            grant_status = "granted" if grant_result.get("effective") else grant_result.get("reason", "unknown")
            tx_updates["credits_grant_status"] = grant_status
            tx_updates["credits_grant_delta"] = grant_result.get("credits_delta", 0)

            if grant_result.get("created_at"):
                tx_updates["credits_granted_at"] = grant_result["created_at"]

    await db.payment_transactions.update_one(
        {"stripe_session_id": session_id},
        {"$set": tx_updates}
    )


@router.post("/checkout")
async def create_checkout(checkout_data: CheckoutCreate, request: Request):
    user = await get_current_user(request)

    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Missing Stripe secret key")

    item = resolve_checkout_item(checkout_data)
    amount = int(item["price"] * 100)

    stripe.api_key = STRIPE_SECRET_KEY

    host_url = checkout_data.origin_url.rstrip("/")
    success_url = f"{host_url}/dashboard/billing?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/dashboard/billing"

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": f"Sistema Maestro - {item['name']}",
                        "description": item["description"]
                    },
                    "unit_amount": amount
                },
                "quantity": 1
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user["user_id"],
                "user_email": user["email"],
                "item_type": item["item_type"],
                "item_id": item["item_id"]
            }
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
            "credits_grant_status": "not_applicable" if item["item_type"] != "plan" else "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        if item["item_type"] == "plan":
            transaction_doc["plan_id"] = item["item_id"]
        else:
            transaction_doc["offer_id"] = item["item_id"]

        await db.payment_transactions.insert_one(transaction_doc)

        return {"url": session.url, "session_id": session.id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Error al crear sesión de pago")


@router.get("/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    user = await get_current_user(request)

    transaction = await db.payment_transactions.find_one(
        {"stripe_session_id": session_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.get("payment_status") == "paid":
        if transaction.get("item_type", "plan") == "plan" and transaction.get("credits_grant_status") != "granted":
            await finalize_paid_transaction(transaction, session_id)

        return {
            "status": "complete",
            "payment_status": "paid",
            "item_type": transaction.get("item_type", "plan"),
            "item_id": transaction.get("item_id") or transaction.get("plan_id")
        }

    if not STRIPE_SECRET_KEY:
        return {
            "status": transaction.get("status"),
            "payment_status": transaction.get("payment_status"),
            "item_type": transaction.get("item_type", "plan"),
            "item_id": transaction.get("item_id") or transaction.get("plan_id")
        }

    stripe.api_key = STRIPE_SECRET_KEY

    try:
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status == "paid":
            await finalize_paid_transaction(transaction, session_id)

        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "item_type": transaction.get("item_type", "plan"),
            "item_id": transaction.get("item_id") or transaction.get("plan_id")
        }

    except Exception as e:
        logger.error(f"Payment status check error: {e}")
        return {
            "status": transaction.get("status"),
            "payment_status": transaction.get("payment_status"),
            "item_type": transaction.get("item_type", "plan"),
            "item_id": transaction.get("item_id") or transaction.get("plan_id")
        }


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")

    webhook_secret = None
    try:
        import os
        webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    except Exception:
        webhook_secret = None

    try:
        if webhook_secret and signature and STRIPE_SECRET_KEY:
            stripe.api_key = STRIPE_SECRET_KEY
            event = stripe.Webhook.construct_event(body, signature, webhook_secret)
        else:
            event = json.loads(body)

        if event.get("type") == "checkout.session.completed":
            session = event["data"]["object"]
            session_id = session["id"]

            if session.get("payment_status") == "paid":
                transaction = await db.payment_transactions.find_one({"stripe_session_id": session_id}, {"_id": 0})

                if transaction:
                    await finalize_paid_transaction(transaction, session_id)

        return {"received": True}

    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}
