"""Central AI cost guard.

Every provider call asks this module before it spends money. The limits are
USD cost caps for the model providers. They do not read or write the gem ledger.

Prices default to the short-context public rates the founder named:
Sonnet 5.5 $2 / $10 per million tokens, Haiku 5.5 $0.10 / $0.50 up to 100k
input tokens and $0.50 / $2.50 above that, Grok 4.3 $1.25 / $2.50 under 200k
and double above that, voice $0.08 per minute. Each figure is an env var.
"""

from __future__ import annotations

import asyncio
import logging
import os
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Iterator, Mapping
from zoneinfo import ZoneInfo

from backend.app.ai.providers.model_pricing import estimate_tokens

logger = logging.getLogger("sistemamaestro.llm_budget")

HAIKU_MODEL = "claude-haiku-5-5"
SONNET_MODEL = "claude-sonnet-5-5"
GROK_43 = "grok-4.3"
GROK_47 = "grok-4.7"

WEB_FEATURES = frozenset({"builder", "evaluation", "classifier"})
PUBLIC_MESSAGES = {
    "usage_limit": "Has alcanzado el límite de uso de hoy",
    "usage_limit_month": "Has alcanzado el límite de uso de este mes",
    "usage_limit_request": "No se ha podido completar la solicitud.",
    "input_too_long": "La solicitud es demasiado larga.",
    "voice_limit": "La sesión de voz ha alcanzado su límite.",
}

_SCOPE: ContextVar[dict | None] = ContextVar("llm_budget_scope", default=None)
_collection = None
_events: list[dict] = []
_spend: dict[tuple, float] = {}
_escalations: dict[str, int] = {}
_voice: dict[tuple, dict] = {}


class LlmBudgetError(Exception):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code if code in PUBLIC_MESSAGES else "usage_limit"

    @property
    def message(self) -> str:
        return PUBLIC_MESSAGES[self.code]


@dataclass(frozen=True)
class BudgetDecision:
    action: str
    code: str
    model: str
    provider: str
    feature: str
    user_id: str
    project_id: str
    max_output_tokens: int
    input_tokens: int
    estimated_cost_usd: float
    reason: str


async def owner_plan(database, user_id: str) -> str:
    """Read the plan already stored on the user. This does not touch billing."""
    users = getattr(database, "users", None)
    finder = getattr(users, "find_one", None) if users is not None else None
    if finder is None or not user_id:
        return "free"
    try:
        document = await finder({"user_id": user_id}, {"_id": 0, "plan": 1})
    except Exception:
        return "free"
    if isinstance(document, dict) and isinstance(document.get("plan"), str) and document["plan"].strip():
        return document["plan"].strip()
    return "free"


def public_message(code: str) -> str:
    return PUBLIC_MESSAGES.get(code, PUBLIC_MESSAGES["usage_limit"])


def reset_budget_state() -> None:
    """Drop in-process counters. Tests and a fresh process start here."""
    _events.clear()
    _spend.clear()
    _escalations.clear()
    _voice.clear()


def install_usage_collection(collection) -> None:
    """Remember the Mongo collection. Startup calls this; unit tests do not."""
    global _collection
    _collection = collection


def usage_events() -> list[dict]:
    return [dict(item) for item in _events]


@contextmanager
def llm_scope(**kwargs) -> Iterator[dict]:
    current = dict(_SCOPE.get() or {})
    for key, value in kwargs.items():
        if value is not None:
            current[key] = value
    token = _SCOPE.set(current)
    try:
        yield current
    finally:
        _SCOPE.reset(token)


def current_scope() -> dict:
    return dict(_SCOPE.get() or {})


def _raw(name: str) -> str:
    return (os.environ.get(name) or "").strip()


def _int_env(name: str, default: int, *, low: int, high: int) -> int:
    raw = _raw(name)
    if not raw:
        value = default
    else:
        try:
            value = int(raw)
        except ValueError:
            value = default
    return min(max(value, low), high)


def _float_env(name: str, default: float, *, low: float = 0.0) -> float:
    raw = _raw(name)
    if not raw:
        value = default
    else:
        try:
            value = float(raw)
        except ValueError:
            value = default
    if value < low:
        return default
    return value


def max_input_tokens() -> int:
    return _int_env("AI_MAX_INPUT_TOKENS", 24000, low=256, high=2_000_000)


def max_output_tokens() -> int:
    return _int_env("AI_MAX_OUTPUT_TOKENS", 8192, low=32, high=128_000)


def max_judge_calls_per_web() -> int:
    return _int_env("AI_MAX_JUDGE_CALLS_PER_WEB", 3, low=1, high=20)


def max_regenerations_per_web() -> int:
    return _int_env("AI_MAX_REGENERATIONS_PER_WEB", 2, low=0, high=10)


def request_downgrade_usd() -> float:
    return _float_env("AI_REQUEST_DOWNGRADE_USD", 0.08)


def request_reject_usd() -> float:
    return _float_env("AI_REQUEST_REJECT_USD", 0.50)


def web_downgrade_usd() -> float:
    return _float_env("AI_WEB_DOWNGRADE_USD", 0.40)


def web_reject_usd() -> float:
    return _float_env("AI_WEB_REJECT_USD", 1.50)


def daily_soft_usd() -> float:
    return _float_env("AI_DAILY_SOFT_USD", 1.0)


def daily_hard_usd() -> float:
    return _float_env("AI_DAILY_HARD_USD", 5.0)


def monthly_soft_usd() -> float:
    return _float_env("AI_MONTHLY_SOFT_USD", 10.0)


def monthly_hard_usd() -> float:
    return _float_env("AI_MONTHLY_HARD_USD", 30.0)


def voice_usd_per_minute() -> float:
    return _float_env("AI_PRICE_VOICE_USD_PER_MINUTE", 0.08)


def voice_demo_max_seconds() -> int:
    return _int_env("AI_VOICE_DEMO_MAX_SECONDS", 300, low=30, high=3600)


def voice_embed_max_seconds() -> int:
    return _int_env("AI_VOICE_EMBED_MAX_SECONDS", 600, low=30, high=7200)


def voice_session_gap_seconds() -> int:
    return _int_env("AI_VOICE_SESSION_GAP_SECONDS", 120, low=0, high=3600)


def escalation_below() -> int:
    return _int_env("AI_WRITER_ESCALATION_BELOW", 12, low=0, high=20)


def max_escalations_per_web() -> int:
    return _int_env("AI_WRITER_MAX_ESCALATIONS", 1, low=0, high=5)


def default_writer_model() -> str:
    raw = _raw("AI_WRITER_DEFAULT_MODEL") or HAIKU_MODEL
    return raw if raw in {HAIKU_MODEL, SONNET_MODEL} else HAIKU_MODEL


def escalation_model() -> str:
    raw = _raw("AI_WRITER_ESCALATION_MODEL") or SONNET_MODEL
    return raw if raw == SONNET_MODEL else SONNET_MODEL


def spend_zone() -> ZoneInfo:
    name = _raw("AI_SPEND_TIMEZONE") or "Europe/Madrid"
    try:
        return ZoneInfo(name)
    except Exception:
        return ZoneInfo("Europe/Madrid")


def plan_multiplier(plan: str | None) -> float:
    key = (plan or "free").strip().lower() or "free"
    defaults = {"free": 1.0, "blueprint": 2.0, "sistema": 4.0, "premium": 8.0}
    env_name = "AI_CAP_MULTIPLIER_" + key.upper()
    return _float_env(env_name, defaults.get(key, 1.0), low=0.1)


def _period_keys(now: datetime | None = None) -> tuple[str, str]:
    moment = now or datetime.now(timezone.utc)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    local = moment.astimezone(spend_zone())
    return local.date().isoformat(), local.strftime("%Y-%m")


def token_rates(model: str, input_tokens: int) -> tuple[float, float] | None:
    """USD per million input and output tokens, or None when the model is unpriced."""
    name = (model or "").strip()
    tokens = max(int(input_tokens or 0), 0)
    if name == SONNET_MODEL:
        return (
            _float_env("AI_PRICE_SONNET_IN_USD_PER_MTOK", 2.0),
            _float_env("AI_PRICE_SONNET_OUT_USD_PER_MTOK", 10.0),
        )
    if name == HAIKU_MODEL:
        cutoff = _int_env("AI_PRICE_HAIKU_LONG_AFTER_TOKENS", 100_000, low=1, high=10_000_000)
        if tokens > cutoff:
            return (
                _float_env("AI_PRICE_HAIKU_LONG_IN_USD_PER_MTOK", 0.50),
                _float_env("AI_PRICE_HAIKU_LONG_OUT_USD_PER_MTOK", 2.50),
            )
        return (
            _float_env("AI_PRICE_HAIKU_IN_USD_PER_MTOK", 0.10),
            _float_env("AI_PRICE_HAIKU_OUT_USD_PER_MTOK", 0.50),
        )
    long_after = _int_env("AI_PRICE_GROK_LONG_AFTER_TOKENS", 200_000, low=1, high=10_000_000)
    multiplier = _float_env("AI_PRICE_GROK_LONG_MULTIPLIER", 2.0, low=1.0)
    if name == GROK_43:
        in_rate = _float_env("AI_PRICE_GROK43_IN_USD_PER_MTOK", 1.25)
        out_rate = _float_env("AI_PRICE_GROK43_OUT_USD_PER_MTOK", 2.50)
    elif name == GROK_47:
        in_rate = _float_env("AI_PRICE_GROK47_IN_USD_PER_MTOK", 2.0)
        out_rate = _float_env("AI_PRICE_GROK47_OUT_USD_PER_MTOK", 6.0)
    else:
        return None
    if tokens > long_after:
        return in_rate * multiplier, out_rate * multiplier
    return in_rate, out_rate


def estimate_cost_usd(model: str, input_tokens: int, output_tokens: int) -> float | None:
    rates = token_rates(model, input_tokens)
    if rates is None:
        return None
    in_rate, out_rate = rates
    cost = (max(input_tokens, 0) * in_rate + max(output_tokens, 0) * out_rate) / 1_000_000
    return round(cost, 8)


def voice_cost_usd(seconds: float) -> float:
    minutes = max(float(seconds), 0.0) / 60.0
    return round(minutes * voice_usd_per_minute(), 8)


def cap_output_tokens(requested: int | None) -> int:
    ceiling = max_output_tokens()
    if requested is None:
        return ceiling
    try:
        value = int(requested)
    except (TypeError, ValueError):
        return ceiling
    return max(1, min(value, ceiling))


def _content_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and isinstance(block.get("text"), str):
                parts.append(block["text"])
        return "\n".join(parts)
    return ""


def _shrink_text(text: str, keep_tokens: int) -> str:
    if keep_tokens <= 0:
        return ""
    keep_chars = max(keep_tokens, 1) * 2
    if len(text) <= keep_chars:
        return text
    return text[:keep_chars]


def _shrink_content(content: Any) -> tuple[Any, bool]:
    """Halve the last text block. Cache-control and tool blocks stay in place."""
    if isinstance(content, str):
        if estimate_tokens(content) <= 32:
            return content, False
        return _shrink_text(content, estimate_tokens(content) // 2), True
    if isinstance(content, list):
        updated = [dict(block) if isinstance(block, dict) else block for block in content]
        for index in range(len(updated) - 1, -1, -1):
            block = updated[index]
            if isinstance(block, str):
                if estimate_tokens(block) <= 32:
                    continue
                updated[index] = _shrink_text(block, estimate_tokens(block) // 2)
                return updated, True
            if isinstance(block, dict) and isinstance(block.get("text"), str):
                if estimate_tokens(block["text"]) <= 32:
                    continue
                block["text"] = _shrink_text(block["text"], estimate_tokens(block["text"]) // 2)
                return updated, True
        return updated, False
    return content, False


def compact_messages(messages: list, max_tokens: int | None = None) -> tuple[list, int, bool]:
    """Copy messages and shorten user text, then system text, until the estimate fits.

    Returns the copy, the estimated input tokens, and whether it still exceeds the cap.
    """
    ceiling = max_input_tokens() if max_tokens is None else max(1, int(max_tokens))
    copied = []
    for item in messages or []:
        if isinstance(item, dict):
            copied.append(dict(item))
        else:
            copied.append({"role": "user", "content": str(item)})

    def total() -> int:
        return sum(estimate_tokens(_content_text(item.get("content"))) for item in copied if isinstance(item, dict))

    if total() <= ceiling:
        return copied, total(), False

    def shrink_roles(roles: set[str]) -> None:
        for item in reversed(copied):
            if not isinstance(item, dict) or item.get("role") not in roles:
                continue
            while total() > ceiling:
                updated, changed = _shrink_content(item.get("content"))
                if not changed:
                    break
                item["content"] = updated
            if total() <= ceiling:
                return

    shrink_roles({"user"})
    if total() > ceiling:
        shrink_roles({"system", "assistant"})
    return copied, total(), total() > ceiling


def compact_text(text: str, max_tokens: int | None = None) -> tuple[str, int, bool]:
    messages, tokens, rejected = compact_messages([{"role": "user", "content": text or ""}], max_tokens)
    content = messages[0].get("content") if messages else ""
    return content if isinstance(content, str) else _content_text(content), tokens, rejected


def _spent(bucket: tuple) -> float:
    return _spend.get(bucket, 0.0)


def _add_spend(bucket: tuple, amount: float) -> None:
    if amount:
        _spend[bucket] = round(_spent(bucket) + amount, 8)


def user_spend(user_id: str, now: datetime | None = None) -> tuple[float, float]:
    day, month = _period_keys(now)
    return _spent(("user-day", user_id or "anonymous", day)), _spent(("user-month", user_id or "anonymous", month))


def web_spend(project_id: str) -> float:
    if not project_id:
        return 0.0
    return _spent(("web", project_id))


def escalations_used(project_id: str) -> int:
    return int(_escalations.get(project_id or "", 0))


def _log_trip(decision: BudgetDecision) -> None:
    if decision.action == "allow":
        return
    logger.warning(
        "llm_breaker_trip action=%s reason=%s feature=%s code=%s estimated_usd=%.6f provider=%s model=%s",
        decision.action,
        decision.reason,
        decision.feature,
        decision.code,
        decision.estimated_cost_usd,
        decision.provider,
        decision.model,
    )


def decide_call(
    *,
    provider: str,
    model: str,
    input_tokens: int,
    max_output_tokens_requested: int | None,
    feature: str,
    user_id: str = "",
    project_id: str = "",
    plan: str = "",
    now: datetime | None = None,
) -> BudgetDecision:
    """Pure decision. It does not reserve spend and it does not call a provider."""
    scope = current_scope()
    feature = feature or str(scope.get("feature") or "builder")
    user_id = user_id or str(scope.get("user_id") or "")
    project_id = project_id or str(scope.get("project_id") or "")
    plan = plan or str(scope.get("plan") or "")
    output = cap_output_tokens(max_output_tokens_requested)
    tokens_in = max(int(input_tokens or 0), 0)
    priced = token_rates(model, tokens_in)

    def finish(action: str, code: str, chosen: str, cost: float, reason: str) -> BudgetDecision:
        decision = BudgetDecision(
            action=action,
            code=code,
            model=chosen,
            provider=provider,
            feature=feature,
            user_id=user_id or "anonymous",
            project_id=project_id,
            max_output_tokens=output,
            input_tokens=tokens_in,
            estimated_cost_usd=round(max(cost, 0.0), 8),
            reason=reason,
        )
        _log_trip(decision)
        return decision

    if tokens_in > max_input_tokens():
        return finish("reject", "input_too_long", model, 0.0, "input_tokens")
    if priced is None:
        return finish("reject", "usage_limit_request", model, 0.0, "unpriced_model")

    def cost_for(name: str) -> float:
        return estimate_cost_usd(name, tokens_in, output) or 0.0

    def hard_code(cost: float) -> str | None:
        day_spent, month_spent = user_spend(user_id or "anonymous", now)
        multiplier = plan_multiplier(plan)
        if day_spent + cost >= daily_hard_usd() * multiplier:
            return "usage_limit"
        if month_spent + cost >= monthly_hard_usd() * multiplier:
            return "usage_limit_month"
        return None

    def over_reject(cost: float) -> bool:
        if cost >= request_reject_usd():
            return True
        if feature in WEB_FEATURES and project_id and web_spend(project_id) + cost >= web_reject_usd():
            return True
        return False

    def over_soft(cost: float) -> bool:
        if cost >= request_downgrade_usd():
            return True
        if feature in WEB_FEATURES and project_id and web_spend(project_id) + cost >= web_downgrade_usd():
            return True
        day_spent, month_spent = user_spend(user_id or "anonymous", now)
        multiplier = plan_multiplier(plan)
        if day_spent + cost >= daily_soft_usd() * multiplier:
            return True
        if month_spent + cost >= monthly_soft_usd() * multiplier:
            return True
        return False

    original = cost_for(model)
    blocked = hard_code(original)
    if blocked:
        return finish("reject", blocked, model, original, "spend_cap")

    chosen = model
    action = "allow"
    reason = "ok"
    cost = original
    if model == SONNET_MODEL and (over_soft(original) or over_reject(original)):
        cheaper = cost_for(HAIKU_MODEL)
        blocked = hard_code(cheaper)
        if blocked:
            return finish("reject", blocked, HAIKU_MODEL, cheaper, "spend_cap")
        if over_reject(cheaper):
            return finish("reject", "usage_limit_request", HAIKU_MODEL, cheaper, "reject_threshold")
        chosen = HAIKU_MODEL
        action = "downgrade"
        reason = "downgrade_threshold"
        cost = cheaper
    elif over_reject(original):
        return finish("reject", "usage_limit_request", model, original, "reject_threshold")

    return finish(action, "ok", chosen, cost, reason)


def _stamp(now: datetime | None = None) -> str:
    moment = now or datetime.now(timezone.utc)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    return moment.astimezone(timezone.utc).isoformat()


def _remember(
    *,
    feature: str,
    user_id: str,
    project_id: str,
    provider: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
    cached_tokens: int,
    estimated_cost_usd: float,
    breaker_action: str,
    now: datetime | None = None,
) -> dict:
    event = {
        "created_at": _stamp(now),
        "user_id": user_id or "anonymous",
        "project_id": project_id or "",
        "feature": feature,
        "provider": provider,
        "model": model,
        "input_tokens": int(input_tokens or 0),
        "output_tokens": int(output_tokens or 0),
        "cached_tokens": int(cached_tokens or 0),
        "estimated_cost_usd": round(float(estimated_cost_usd or 0.0), 8),
        "breaker_action": breaker_action,
    }
    _events.append(event)
    if breaker_action != "reject" and event["estimated_cost_usd"]:
        day, month = _period_keys(now)
        _add_spend(("user-day", event["user_id"], day), event["estimated_cost_usd"])
        _add_spend(("user-month", event["user_id"], month), event["estimated_cost_usd"])
        if feature in WEB_FEATURES and event["project_id"]:
            _add_spend(("web", event["project_id"]), event["estimated_cost_usd"])
    return event


async def persist_recorded(event: dict | None) -> None:
    collection = _collection
    if collection is None or not event:
        return
    try:
        await asyncio.wait_for(collection.insert_one(dict(event)), timeout=0.25)
    except Exception:
        logger.warning("llm_usage_persist_failed")


async def record_call(
    decision: BudgetDecision,
    *,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
    cached_tokens: int = 0,
    now: datetime | None = None,
) -> dict:
    tokens_in = decision.input_tokens if input_tokens is None else int(input_tokens)
    tokens_out = decision.max_output_tokens if output_tokens is None else int(output_tokens)
    if decision.action == "reject":
        cost = 0.0
    elif input_tokens is None and output_tokens is None:
        cost = decision.estimated_cost_usd
    else:
        priced = estimate_cost_usd(decision.model, tokens_in, tokens_out)
        # A provider payload with no usage block reports zeros. Keep the pre-call estimate.
        if priced is None or (tokens_in == 0 and tokens_out == 0 and decision.estimated_cost_usd > 0):
            cost = decision.estimated_cost_usd
            tokens_in = decision.input_tokens
            tokens_out = decision.max_output_tokens
        else:
            cost = priced
    event = _remember(
        feature=decision.feature,
        user_id=decision.user_id,
        project_id=decision.project_id,
        provider=decision.provider,
        model=decision.model,
        input_tokens=tokens_in,
        output_tokens=0 if decision.action == "reject" else tokens_out,
        cached_tokens=0 if decision.action == "reject" else cached_tokens,
        estimated_cost_usd=cost,
        breaker_action=decision.action,
        now=now,
    )
    await persist_recorded(event)
    return event


def record_template(
    *,
    feature: str = "whatsapp_reminder",
    user_id: str = "",
    project_id: str = "",
    now: datetime | None = None,
) -> dict:
    """WhatsApp reminders are templates. They log a call with zero tokens."""
    event = _remember(
        feature=feature,
        user_id=user_id,
        project_id=project_id,
        provider="whatsapp",
        model="template",
        input_tokens=0,
        output_tokens=0,
        cached_tokens=0,
        estimated_cost_usd=0.0,
        breaker_action="allow",
        now=now,
    )
    return event


def usage_from_grok_payload(data: Mapping | None) -> dict:
    usage = data.get("usage") if isinstance(data, Mapping) else None
    if not isinstance(usage, Mapping):
        usage = {}
    details = usage.get("prompt_tokens_details")
    if not isinstance(details, Mapping):
        details = {}
    cached = details.get("cached_tokens", usage.get("cached_tokens", 0))
    try:
        cached_tokens = int(cached or 0)
    except (TypeError, ValueError):
        cached_tokens = 0
    def number(*names: str) -> int:
        for name in names:
            try:
                if usage.get(name) is not None:
                    return int(usage.get(name) or 0)
            except (TypeError, ValueError):
                return 0
        return 0
    return {
        "input_tokens": number("prompt_tokens", "input_tokens"),
        "output_tokens": number("completion_tokens", "output_tokens"),
        "cached_tokens": max(cached_tokens, 0),
    }


def usage_from_anthropic_response(response: Any) -> dict:
    usage = getattr(response, "usage", None)
    def number(name: str) -> int:
        if isinstance(usage, Mapping):
            raw = usage.get(name, 0)
        else:
            raw = getattr(usage, name, 0)
        try:
            return int(raw or 0)
        except (TypeError, ValueError):
            return 0
    cached = number("cache_read_input_tokens") + number("cache_creation_input_tokens")
    return {
        "input_tokens": number("input_tokens"),
        "output_tokens": number("output_tokens"),
        "cached_tokens": cached,
    }


async def guard_chat_payload(payload: dict, *, provider: str = "xai") -> tuple[dict, BudgetDecision]:
    """Cap one chat-completions payload. Rejects before the HTTP call."""
    body = dict(payload)
    messages = body.get("messages") if isinstance(body.get("messages"), list) else []
    compacted, tokens, rejected = compact_messages(messages)
    body["messages"] = compacted
    if rejected:
        decision = decide_call(
            provider=provider,
            model=str(body.get("model") or ""),
            input_tokens=max_input_tokens() + 1,
            max_output_tokens_requested=body.get("max_tokens"),
            feature=str(current_scope().get("feature") or "classifier"),
        )
        await record_call(decision, input_tokens=tokens, output_tokens=0)
        raise LlmBudgetError(decision.code)
    decision = decide_call(
        provider=provider,
        model=str(body.get("model") or ""),
        input_tokens=tokens,
        max_output_tokens_requested=body.get("max_tokens"),
        feature=str(current_scope().get("feature") or "classifier"),
    )
    body["model"] = decision.model
    body["max_tokens"] = decision.max_output_tokens
    if decision.action == "reject":
        await record_call(decision)
        raise LlmBudgetError(decision.code)
    return body, decision


def _compact_anthropic_request(request: dict) -> tuple[dict, int, bool]:
    body = dict(request)
    messages = body.get("messages") if isinstance(body.get("messages"), list) else []
    system = body.get("system")
    blob = [{"role": "system", "content": system}] if system else []
    blob.extend(messages)
    compacted, tokens, rejected = compact_messages(blob)
    if compacted and compacted[0].get("role") == "system":
        body["system"] = compacted[0].get("content")
        body["messages"] = compacted[1:]
    else:
        body["messages"] = compacted
    return body, tokens, rejected


async def guard_anthropic_request(request: dict) -> tuple[dict, BudgetDecision]:
    body, tokens, rejected = _compact_anthropic_request(request)
    feature = str(current_scope().get("feature") or "builder")
    if rejected:
        decision = decide_call(
            provider="anthropic",
            model=str(body.get("model") or ""),
            input_tokens=max_input_tokens() + 1,
            max_output_tokens_requested=body.get("max_tokens"),
            feature=feature,
        )
        await record_call(decision, input_tokens=tokens, output_tokens=0)
        raise LlmBudgetError(decision.code)
    decision = decide_call(
        provider="anthropic",
        model=str(body.get("model") or ""),
        input_tokens=tokens,
        max_output_tokens_requested=body.get("max_tokens"),
        feature=feature,
    )
    body["model"] = decision.model
    body["max_tokens"] = decision.max_output_tokens
    if decision.model == HAIKU_MODEL and isinstance(body.get("thinking"), dict):
        # Both priced Claude models use adaptive thinking. A downgrade keeps that shape.
        body["thinking"] = {"type": "adaptive", "display": "summarized"}
    if decision.action == "reject":
        await record_call(decision)
        raise LlmBudgetError(decision.code)
    return body, decision


def decide_writer_escalation(*, score: int | None, project_id: str, plan: str = "") -> str:
    """Return escalate, stay, or stop. One Sonnet escalation per web, and only below the score."""
    if max_escalations_per_web() <= 0:
        return "stay"
    if score is None or int(score) >= escalation_below():
        return "stay"
    if escalations_used(project_id) >= max_escalations_per_web():
        return "stay"
    sample_in = _int_env("AI_WRITER_ESCALATION_INPUT_TOKENS", 4000, low=1, high=200_000)
    sample_out = _int_env("AI_WRITER_ESCALATION_OUTPUT_TOKENS", 4096, low=1, high=128_000)
    decision = decide_call(
        provider="anthropic",
        model=escalation_model(),
        input_tokens=sample_in,
        max_output_tokens_requested=sample_out,
        feature="builder",
        project_id=project_id,
        plan=plan or str(current_scope().get("plan") or ""),
        user_id=str(current_scope().get("user_id") or ""),
    )
    if decision.action == "reject" and decision.code in {"usage_limit", "usage_limit_month"}:
        return "stop"
    if decision.action != "allow" or decision.model != SONNET_MODEL:
        return "stay"
    return "escalate"


def mark_escalation(project_id: str) -> int:
    key = project_id or ""
    _escalations[key] = escalations_used(key) + 1
    return _escalations[key]


def authorize_voice(
    *,
    surface: str,
    subject: str,
    token_seconds: int,
    user_id: str = "",
    project_id: str = "",
    plan: str = "",
    now: datetime | None = None,
) -> dict:
    """Allow a voice token refresh inside the session cap. Coverage is not double-charged."""
    moment = now or datetime.now(timezone.utc)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    stamp = moment.timestamp()
    cap = voice_demo_max_seconds() if surface == "demo" else voice_embed_max_seconds()
    key = (surface, subject or "anonymous")
    state = _voice.get(key)
    gap = voice_session_gap_seconds()
    if state is None or stamp >= state["start"] + cap + gap:
        state = {"start": stamp, "covered_until": stamp}
        _voice[key] = state
    if stamp >= state["start"] + cap:
        _log_trip(BudgetDecision(
            action="reject", code="voice_limit", model="voice", provider="xai",
            feature="voice", user_id=user_id or "anonymous", project_id=project_id,
            max_output_tokens=0, input_tokens=0, estimated_cost_usd=0.0, reason="voice_duration",
        ))
        return {"allowed": False, "code": "voice_limit", "message": public_message("voice_limit"), "seconds": 0}
    new_until = min(state["start"] + cap, stamp + max(int(token_seconds), 0))
    added = max(0.0, new_until - state["covered_until"])
    cost = voice_cost_usd(added)
    day_spent, month_spent = user_spend(user_id or subject or "anonymous", moment)
    multiplier = plan_multiplier(plan)
    if day_spent + cost >= daily_hard_usd() * multiplier:
        code = "usage_limit"
    elif month_spent + cost >= monthly_hard_usd() * multiplier:
        code = "usage_limit_month"
    else:
        code = ""
    if code:
        _log_trip(BudgetDecision(
            action="reject", code=code, model="voice", provider="xai", feature="voice",
            user_id=user_id or "anonymous", project_id=project_id, max_output_tokens=0,
            input_tokens=0, estimated_cost_usd=cost, reason="spend_cap",
        ))
        return {"allowed": False, "code": code, "message": public_message(code), "seconds": 0}
    state["covered_until"] = max(state["covered_until"], new_until)
    event = _remember(
        feature="voice",
        user_id=user_id or subject or "anonymous",
        project_id=project_id,
        provider="xai",
        model="voice",
        input_tokens=0,
        output_tokens=0,
        cached_tokens=0,
        estimated_cost_usd=cost,
        breaker_action="allow",
        now=moment,
    )
    return {
        "allowed": True,
        "code": "ok",
        "message": "",
        "seconds": int(added),
        "estimated_cost_usd": cost,
        "event": event,
    }


def aggregate_usage(events: list[dict] | None = None) -> dict:
    """Read-only totals. Model ids stay in this internal aggregate, not in product copy."""
    rows = list(_events if events is None else events)
    by_feature: dict[str, dict] = {}
    by_user: dict[str, dict] = {}
    breaker = {"allow": 0, "downgrade": 0, "reject": 0}
    total = 0.0
    calls = 0
    for event in rows:
        if not isinstance(event, dict):
            continue
        calls += 1
        cost = float(event.get("estimated_cost_usd") or 0.0)
        total += cost
        feature = str(event.get("feature") or "unknown")
        user_id = str(event.get("user_id") or "anonymous")
        action = str(event.get("breaker_action") or "allow")
        if action not in breaker:
            breaker[action] = 0
        breaker[action] += 1
        bucket = by_feature.setdefault(feature, {"calls": 0, "estimated_cost_usd": 0.0, "input_tokens": 0, "output_tokens": 0})
        bucket["calls"] += 1
        bucket["estimated_cost_usd"] = round(bucket["estimated_cost_usd"] + cost, 8)
        bucket["input_tokens"] += int(event.get("input_tokens") or 0)
        bucket["output_tokens"] += int(event.get("output_tokens") or 0)
        person = by_user.setdefault(user_id, {"calls": 0, "estimated_cost_usd": 0.0})
        person["calls"] += 1
        person["estimated_cost_usd"] = round(person["estimated_cost_usd"] + cost, 8)
    return {
        "calls": calls,
        "estimated_cost_usd": round(total, 8),
        "by_feature": by_feature,
        "by_user": by_user,
        "breaker": breaker,
    }


async def load_stored_events(limit: int = 5000) -> list[dict]:
    collection = _collection
    if collection is None:
        return usage_events()
    try:
        cursor = collection.find({}, {"_id": 0})
        if hasattr(cursor, "to_list"):
            rows = await cursor.to_list(length=limit)
        else:
            rows = []
            if hasattr(cursor, "__aiter__"):
                async for document in cursor:
                    rows.append(document)
                    if len(rows) >= limit:
                        break
        return list(rows) if rows else usage_events()
    except Exception:
        logger.warning("llm_usage_read_failed")
        return usage_events()
