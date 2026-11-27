"""Minimal async client for the xAI Chat Completions API.

The official base URL is https://api.x.ai/v1. httpx is imported only when a
request is sent.
"""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any, Dict, List, Optional


class GrokChatClient:
    def __init__(self, *, api_key: str, timeout: float, max_retries: int = 0, base_url: str = "https://api.x.ai/v1"):
        self.api_key = api_key
        self.timeout = timeout
        self.max_retries = max_retries
        self.base_url = (base_url or "https://api.x.ai/v1").rstrip("/")
        self._http = None
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.close()
        return False

    async def close(self) -> None:
        http = self._http
        self._http = None
        if http is not None:
            await http.aclose()

    async def _create(
        self,
        *,
        model: str,
        messages: List[Dict[str, Any]],
        temperature: float = 0,
        max_tokens: Optional[int] = None,
        response_format: Optional[Dict[str, Any]] = None,
        reasoning_effort: Optional[str] = None,
    ):
        import httpx

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens
        if response_format is not None:
            payload["response_format"] = response_format
        if reasoning_effort is not None:
            payload["reasoning_effort"] = reasoning_effort

        if self._http is None:
            self._http = httpx.AsyncClient(timeout=self.timeout)
        # max_retries is part of the call contract and stays at 0: one attempt.
        response = await self._http.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        choice = (data.get("choices") or [{}])[0]
        message = choice.get("message") or {}
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    finish_reason=choice.get("finish_reason"),
                    message=SimpleNamespace(content=message.get("content")),
                )
            ]
        )
