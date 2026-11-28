"""Claude tool loop for landing copy.

Claude Haiku 5.5 and Claude Sonnet 5.5 reject extended thinking
(`thinking.type = enabled` plus `budget_tokens`) with HTTP 400. Thinking on
those models is adaptive and already on. This module does not switch models.
The bound is `max_tokens` (thinking counts toward it) and effort `high` or
lower. `xhigh` and `max` are not accepted: they remove the bound.

The stable system prompt and the business context carry cache_control so
later turns and later iterations read that prefix instead of paying it again.
"""
import json
import logging
import os

from backend.app.ai.providers.model_pricing import ANTHROPIC_RATES
from backend.app.services.builder_copy_tools import TOOL_NAME, tool_definition, validate_tool_input
from backend.app.services.builder_pipeline import PipelineError
from backend.app.services.builder_system_prompt import PROMPT_VERSION, SYSTEM_PROMPT

logger = logging.getLogger(__name__)

MAX_TOOL_TURNS = 3
DEFAULT_MAX_TOKENS = 4096
ALLOWED_EFFORT = {"low", "medium", "high"}
_STABLE_KEYS = (
    "instruction",
    "intentTitle",
    "intentGoal",
    "blueprintTitle",
    "blueprintSummary",
    "priorities",
    "diagnosis",
    "preferences",
    "promptVersion",
)


def executor_max_tokens() -> int:
    raw = (os.environ.get("BUILDER_EXECUTOR_MAX_TOKENS") or "").strip()
    try:
        value = int(raw) if raw else DEFAULT_MAX_TOKENS
    except ValueError:
        value = DEFAULT_MAX_TOKENS
    return min(max(value, 256), 8192)


def executor_thinking_effort() -> str:
    raw = (os.environ.get("BUILDER_EXECUTOR_THINKING_EFFORT") or "high").strip().lower()
    if raw not in ALLOWED_EFFORT:
        logger.warning("executor_rejected category=config")
        return "high"
    return raw


def thinking_config(model: str) -> dict:
    """Adaptive thinking. budget_tokens is not sent for the priced models."""
    if model not in ANTHROPIC_RATES:
        raise PipelineError("landing_unavailable")
    return {"type": "adaptive", "display": "summarized"}


def stable_context(brief: dict) -> str:
    payload = {}
    for key in _STABLE_KEYS:
        if key == "promptVersion":
            payload[key] = PROMPT_VERSION
            continue
        if key in (brief or {}):
            payload[key] = brief[key]
    return json.dumps(payload, ensure_ascii=False, sort_keys=True)


def build_copy_request(*, model: str, brief: dict, messages: list, max_tokens: int, effort: str) -> dict:
    notes = " ".join(str((brief or {}).get("revisionNotes") or "").split())
    request = {
        "model": model,
        "max_tokens": max_tokens,
        "thinking": thinking_config(model),
        "output_config": {"effort": effort},
        "system": [
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            },
            {
                "type": "text",
                "text": stable_context(brief),
                "cache_control": {"type": "ephemeral"},
            },
        ],
        "tools": [tool_definition()],
        "tool_choice": {"type": "auto"},
        "messages": messages,
    }
    if notes and messages and isinstance(messages[0], dict):
        # Revision notes change every attempt, so they stay off the cached prefix.
        first = dict(messages[0])
        content = first.get("content")
        if isinstance(content, str) and notes not in content:
            first["content"] = content + " Revisión anterior: " + notes[:240]
            request["messages"] = [first, *messages[1:]]
    return request


def _usage_pair(response):
    usage = response.get("usage") if isinstance(response, dict) else getattr(response, "usage", None)
    def pick(name):
        if isinstance(usage, dict):
            return int(usage.get(name) or 0)
        return int(getattr(usage, name, 0) or 0)
    return pick("cache_read_input_tokens"), pick("cache_creation_input_tokens")


def log_cache_usage(response) -> None:
    read, created = _usage_pair(response)
    logger.info(
        "builder_executor_cache cache_read_input_tokens=%s cache_creation_input_tokens=%s",
        read,
        created,
    )


def message_content(response):
    if isinstance(response, dict):
        content = response.get("content")
        return content if isinstance(content, list) else []
    return list(getattr(response, "content", None) or [])


def _block_field(block, name):
    if isinstance(block, dict):
        return block.get(name)
    return getattr(block, name, None)


def _tool_use(content):
    for block in content:
        if _block_field(block, "type") == "tool_use" and _block_field(block, "name") == TOOL_NAME:
            return block
    return None


def _tool_result(tool_id, text, *, is_error):
    return {
        "role": "user",
        "content": [{
            "type": "tool_result",
            "tool_use_id": tool_id or "submit_landing_copy",
            "is_error": is_error,
            "content": text,
        }],
    }


async def run_copy_tool_loop(brief, complete) -> dict:
    """Call Claude until the tool input is valid or the turn cap is hit.

    A provider exception fails the build. It is not retried here.
    """
    messages = [{
        "role": "user",
        "content": "Escribe la landing de este negocio con submit_landing_copy.",
    }]
    last_errors = ["missing:tool"]
    for _turn in range(MAX_TOOL_TURNS):
        try:
            response = await complete(messages)
        except PipelineError:
            raise
        except Exception as exc:
            logger.warning("executor_rejected category=provider")
            raise PipelineError("landing_unavailable") from exc
        log_cache_usage(response)
        content = message_content(response)
        tool = _tool_use(content)
        if tool is None:
            logger.warning("executor_rejected category=schema")
            raise PipelineError("landing_unavailable")
        cleaned, errors = validate_tool_input(_block_field(tool, "input"))
        if cleaned is not None and not any(item.startswith(("missing:", "enum:", "type")) for item in errors):
            if errors:
                logger.warning("executor_rejected category=schema_repair")
            return cleaned
        last_errors = errors or ["missing:tool"]
        messages.append({"role": "assistant", "content": content})
        messages.append(_tool_result(
            _block_field(tool, "id"),
            "Corrige la herramienta. " + " ".join(last_errors),
            is_error=True,
        ))
    logger.warning("executor_rejected category=schema")
    raise PipelineError("landing_unavailable")


async def write_landing_with_tools(brief: dict) -> dict:
    from anthropic import AsyncAnthropic

    from backend.app.core.config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL

    model = (ANTHROPIC_MODEL or "").strip()
    if model not in ANTHROPIC_RATES or not (ANTHROPIC_API_KEY or "").strip():
        raise PipelineError("landing_unavailable")
    max_tokens = executor_max_tokens()
    effort = executor_thinking_effort()
    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY, max_retries=0, timeout=40.0)

    async def complete(messages):
        request = build_copy_request(
            model=model, brief=brief, messages=messages, max_tokens=max_tokens, effort=effort,
        )
        return await client.messages.create(**request)

    try:
        return await run_copy_tool_loop(brief, complete)
    finally:
        closer = getattr(client, "close", None)
        if closer is not None:
            maybe = closer()
            if hasattr(maybe, "__await__"):
                await maybe
