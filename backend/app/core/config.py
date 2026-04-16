from dotenv import load_dotenv
load_dotenv()

import os
import secrets
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = PROJECT_ROOT / "backend"

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "sistemamaestro")

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY") or os.environ.get("STRIPE_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

FRONTEND_BUILD_DIR = PROJECT_ROOT / "frontend" / "build"
FRONTEND_STATIC_DIR = FRONTEND_BUILD_DIR / "static"

CREDIT_LEDGER_COLLECTION = os.environ.get("CREDIT_LEDGER_COLLECTION", "credit_ledger")

PLAN_INCLUDED_CREDITS = {
    "free": int(os.environ.get("CREDITS_FREE", "0")),
    "blueprint": int(os.environ.get("CREDITS_BLUEPRINT", "60")),
    "sistema": int(os.environ.get("CREDITS_SISTEMA", "220")),
    "premium": int(os.environ.get("CREDITS_PREMIUM", "600"))
}


def get_google_client_id():
    return os.environ.get("REACT_APP_GOOGLE_CLIENT_ID") or os.environ.get("GOOGLE_CLIENT_ID") or ""
