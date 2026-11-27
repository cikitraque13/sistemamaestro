"""OpenAI-compatible chat client. Prefers xAI (Grok); falls back to OpenAI."""
import logging
import os

logger = logging.getLogger("sistemamaestro.llm")

XAI_BASE_URL = "https://api.x.ai/v1"
# grok-4-fast was retired (2026-05-15) and redirects to grok-4.3.
# grok-4.3 accepts response_format json_object on /v1/chat/completions.
DEFAULT_MODEL = "grok-4.3"
# USD per million tokens. Unknown models use this instead of crashing or pricing at 0.
SAFE_INPUT_USD_PER_MILLION = 0.15
SAFE_OUTPUT_USD_PER_MILLION = 0.60

_logged = False


def chat_model() -> str:
    return (os.environ.get("LLM_MODEL") or DEFAULT_MODEL).strip() or DEFAULT_MODEL


def provider_name() -> str:
    if (os.environ.get("GROK_API_KEY") or "").strip():
        return "grok"
    if (os.environ.get("OPENAI_API_KEY") or "").strip():
        return "openai"
    return "none"


def resolve_api_key() -> str | None:
    if provider_name() == "grok":
        return os.environ["GROK_API_KEY"].strip()
    if provider_name() == "openai":
        return os.environ["OPENAI_API_KEY"].strip()
    return None


def provider_base_url() -> str | None:
    if provider_name() == "grok":
        return XAI_BASE_URL
    return None


def async_client_kwargs(**extra):
    key = resolve_api_key()
    if not key:
        return None
    kwargs = {"api_key": key, **extra}
    base_url = provider_base_url()
    if base_url:
        kwargs["base_url"] = base_url
    return kwargs


def safe_token_rates(model: str) -> tuple[float, float]:
    """Return (input, output) USD per million tokens. Unknown models use the safe default."""
    known = {
        "gpt-4o-mini": (0.15, 0.60),
        "gpt-4o": (2.50, 10.0),
        "grok-4-fast": (SAFE_INPUT_USD_PER_MILLION, SAFE_OUTPUT_USD_PER_MILLION),
        "grok-4.3": (SAFE_INPUT_USD_PER_MILLION, SAFE_OUTPUT_USD_PER_MILLION),
    }
    return known.get(model, (SAFE_INPUT_USD_PER_MILLION, SAFE_OUTPUT_USD_PER_MILLION))


def log_llm_startup() -> None:
    global _logged
    if _logged:
        return
    _logged = True
    logger.info(
        "llm_startup provider=%s model=%s grok_key=%s openai_key=%s anthropic_key=%s",
        provider_name(),
        chat_model(),
        "present" if (os.environ.get("GROK_API_KEY") or "").strip() else "absent",
        "present" if (os.environ.get("OPENAI_API_KEY") or "").strip() else "absent",
        "present" if (os.environ.get("ANTHROPIC_API_KEY") or "").strip() else "absent",
    )
