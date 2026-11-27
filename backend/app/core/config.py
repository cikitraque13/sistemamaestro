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

def _positive_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    return value if value > 0 else default


def _choice(name: str, default: str, allowed: set) -> str:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    return raw if raw in allowed else default


# Reasoning, analysis, blueprint, J06 and memory review. Priced models only.
GROK_API_KEY = os.environ.get("GROK_API_KEY")
GROK_MODEL = _choice("GROK_MODEL", "grok-4.3", {"grok-4.3", "grok-4.7"})
GROK_BASE_URL = os.environ.get("GROK_BASE_URL", "https://api.x.ai/v1").strip() or "https://api.x.ai/v1"

# Long code generation in the builder. Priced models only.
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = _choice("ANTHROPIC_MODEL", "claude-haiku-5-5", {"claude-haiku-5-5", "claude-sonnet-5-5"})
ANTHROPIC_MAX_TOKENS = _positive_int("ANTHROPIC_MAX_TOKENS", 8192)
ANTHROPIC_EFFORT = _choice("ANTHROPIC_EFFORT", "medium", {"low", "medium", "high", "xhigh", "max"})

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

if not ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS:
    raise RuntimeError("ALLOWED_ORIGINS must contain explicit origins when credentials are enabled")

COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"

FRONTEND_BUILD_DIR = PROJECT_ROOT / "frontend" / "dist"
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
