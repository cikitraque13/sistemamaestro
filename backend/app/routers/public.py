from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from backend.app.core.config import get_google_client_id
from backend.app.db.mongodb import db

router = APIRouter(prefix="/api", tags=["public"])


class NewsletterSubscribe(BaseModel):
    email: EmailStr


@router.get("/public/config")
async def get_public_config():
    return {
        "google_client_id": get_google_client_id()
    }


@router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe):
    email = data.email.strip().lower()

    existing = await db.newsletter_subscribers.find_one({"email": email})
    if existing:
        return {
            "ok": True,
            "message": "Email ya suscrito"
        }

    try:
        await db.newsletter_subscribers.insert_one({
            "email": email,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Newsletter subscribe failed: {str(e)}")

    return {
        "ok": True,
        "message": "Suscripción completada"
    }