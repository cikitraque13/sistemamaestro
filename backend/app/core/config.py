from pathlib import Path
import os

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = PROJECT_ROOT / "backend"
ENV_FILE = BACKEND_ROOT / ".env"

load_dotenv(ENV_FILE)


def required_env(name: str) -> str:
    value = os.environ.get(name)

    if not value or not value.strip():
        raise RuntimeError(f"Missing required environment variable: {name}")

    return value.strip()


MONGO_URL = required_env("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "sistemamaestro")

JWT_ALGORITHM = "HS256"
JWT_SECRET = required_env("JWT_SECRET")

if len(JWT_SECRET) < 32:
    raise RuntimeError("JWT_SECRET must be at least 32 characters")

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY") or os.environ.get("STRIPE_API_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"

FRONTEND_BUILD_DIR = PROJECT_ROOT / "frontend" / "build"
FRONTEND_STATIC_DIR = FRONTEND_BUILD_DIR / "static"

CREDIT_LEDGER_COLLECTION = os.environ.get("CREDIT_LEDGER_COLLECTION", "credit_ledger")

PLAN_INCLUDED_CREDITS = {
    "free": int(os.environ.get("CREDITS_FREE", "10")),
    "blueprint": int(os.environ.get("CREDITS_BLUEPRINT", "60")),
    "sistema": int(os.environ.get("CREDITS_SISTEMA", "220")),
    "premium": int(os.environ.get("CREDITS_PREMIUM", "600")),
}


def get_google_client_id():
    return os.environ.get("REACT_APP_GOOGLE_CLIENT_ID") or os.environ.get("GOOGLE_CLIENT_ID") or ""