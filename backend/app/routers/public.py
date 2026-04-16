from fastapi import APIRouter
from backend.app.core.config import get_google_client_id

router = APIRouter(prefix="/api", tags=["public"])

router = APIRouter(prefix="/api", tags=["public"])


@router.get("/public/config")
async def get_public_config():
    return {
        "google_client_id": get_google_client_id()
    }
