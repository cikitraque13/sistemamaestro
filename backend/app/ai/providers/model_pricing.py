"""Pinned Grok and Claude rates. An unlisted model is refused before any call.

Prices are short-context public rates checked against the vendor docs on 2026-11-27.
Grok: https://docs.x.ai/developers/models
Claude: https://platform.claude.com/docs/en/about-claude/models
"""

GROK_DEFAULT_MODEL = "grok-4.3"
ANTHROPIC_DEFAULT_MODEL = "claude-haiku-5-5"
ANTHROPIC_EFFORTS = ("low", "medium", "high", "xhigh", "max")

GROK_RATES = {
    "grok-4.3": {
        "model": "grok-4.3",
        "input_usd_per_million": 1.25,
        "output_usd_per_million": 2.50,
        "source": "https://docs.x.ai/developers/models",
        "verified_on": "2026-11-27",
    },
    "grok-4.7": {
        "model": "grok-4.7",
        "input_usd_per_million": 2.00,
        "output_usd_per_million": 6.00,
        "source": "https://docs.x.ai/developers/models",
        "verified_on": "2026-11-27",
    },
}

ANTHROPIC_RATES = {
    "claude-haiku-5-5": {
        "model": "claude-haiku-5-5",
        "input_usd_per_million": 0.10,
        "output_usd_per_million": 0.50,
        "source": "https://platform.claude.com/docs/en/models/haiku-5-5/overview",
        "verified_on": "2026-11-27",
    },
    "claude-sonnet-5-5": {
        "model": "claude-sonnet-5-5",
        "input_usd_per_million": 2.00,
        "output_usd_per_million": 10.00,
        "source": "https://platform.claude.com/docs/en/models/sonnet-5-5/overview",
        "verified_on": "2026-11-27",
    },
}


def estimate_tokens(text: str) -> int:
    """Upper bound that does not depend on a vendor tokenizer.

    Current Grok and Claude tokenizers are about 2.5 characters per token.
    Counting one token per two characters overestimates and fails closed.
    """
    if not text:
        return 0
    return (len(text) + 1) // 2


def worst_case_usd(input_usd_per_million: float, output_usd_per_million: float, input_tokens: int, output_tokens: int) -> float:
    return (input_tokens * float(input_usd_per_million) + output_tokens * float(output_usd_per_million)) / 1_000_000
