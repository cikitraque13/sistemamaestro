"""Startup log for the chat providers actually used by the app.

Grok handles reasoning, analysis, blueprint, J06 and memory review.
Claude handles builder code generation. There is no second-vendor fallback.
"""
import logging
import os

logger = logging.getLogger("sistemamaestro.llm")

_logged = False


def log_llm_startup() -> None:
    global _logged
    if _logged:
        return
    _logged = True
    logger.info(
        "llm_startup grok_model=%s grok_key=%s anthropic_model=%s anthropic_key=%s",
        (os.environ.get("GROK_MODEL") or "grok-4.3").strip() or "grok-4.3",
        "present" if (os.environ.get("GROK_API_KEY") or "").strip() else "absent",
        (os.environ.get("ANTHROPIC_MODEL") or "claude-haiku-5-5").strip() or "claude-haiku-5-5",
        "present" if (os.environ.get("ANTHROPIC_API_KEY") or "").strip() else "absent",
    )
