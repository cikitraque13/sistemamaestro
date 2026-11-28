"""Choose the writer for one build from a pace.

Both targets are already on the Anthropic allowlist. This module does not
read or write the gem ledger, and it does not add a provider.
"""

from backend.app.ai.providers.model_pricing import ANTHROPIC_RATES

PACE_WRITER_MODELS = {
    "rapido": "claude-haiku-5-5",
    "profundo": "claude-sonnet-5-5",
}


class PaceError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def writer_model_for_pace(pace, *, configured: str) -> str:
    """Empty pace keeps the configured model. A named pace must be allowlisted."""
    if pace is None or pace == "":
        model = (configured or "").strip()
    elif not isinstance(pace, str):
        raise PaceError("El modo no está disponible.")
    else:
        model = PACE_WRITER_MODELS.get(pace.strip().lower())
        if not model:
            raise PaceError("El modo no está disponible.")
    if model not in ANTHROPIC_RATES:
        raise PaceError("El modo no está disponible.")
    return model
