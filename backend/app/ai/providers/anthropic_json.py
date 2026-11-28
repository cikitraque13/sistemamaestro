"""Builder JSON generation through the official Anthropic Messages API.

Builder patches are open objects (code files, preview sections). Claude
structured outputs require additionalProperties false, which would force those
patches to {}. A strict tool carries the JSON document as one string; the
caller still validates it with BuilderAIOutput.
"""

from __future__ import annotations

import json
from typing import Any, Dict

_TOOL_NAME = "submit_builder_output"


def _text_from_response(response: Any) -> str:
    for block in getattr(response, "content", None) or []:
        if getattr(block, "type", None) == "tool_use" and getattr(block, "name", None) == _TOOL_NAME:
            tool_input = getattr(block, "input", None) or {}
            document = tool_input.get("document") if isinstance(tool_input, dict) else None
            if isinstance(document, dict):
                return json.dumps(document)
            if isinstance(document, str) and document.strip():
                return document
    parts = []
    for block in getattr(response, "content", None) or []:
        if getattr(block, "type", None) == "text" and getattr(block, "text", None):
            parts.append(block.text)
    return "\n".join(parts)


async def complete_builder_json(
    *,
    api_key: str,
    model: str,
    system: str,
    user: str,
    max_tokens: int,
    effort: str,
) -> str:
    from anthropic import AsyncAnthropic

    from backend.app.ai.guards.llm_budget import (
        LlmBudgetError,
        guard_anthropic_request,
        record_call,
        usage_from_anthropic_response,
    )

    client = AsyncAnthropic(api_key=api_key, max_retries=0, timeout=120.0)
    request, decision = await guard_anthropic_request({
        "model": model,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user}],
        "tools": [
            {
                "name": _TOOL_NAME,
                "description": "Submit the BuilderAIOutput document as one JSON object string.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "document": {
                            "type": "string",
                            "description": "Raw JSON object for BuilderAIOutput. No markdown fences.",
                        }
                    },
                    "required": ["document"],
                    "additionalProperties": False,
                },
            }
        ],
        "tool_choice": {"type": "auto"},
        "output_config": {"effort": effort},
    })
    try:
        try:
            response = await client.messages.create(**request)
        except LlmBudgetError:
            raise
        except Exception:
            await record_call(decision)
            raise
        usage = usage_from_anthropic_response(response)
        await record_call(
            decision,
            input_tokens=usage["input_tokens"],
            output_tokens=usage["output_tokens"],
            cached_tokens=usage["cached_tokens"],
        )
    finally:
        closer = getattr(client, "close", None)
        if closer is not None:
            maybe = closer()
            if hasattr(maybe, "__await__"):
                await maybe
    return _text_from_response(response)
