"""OpenAI-compatible chat client via stdlib (no openai SDK install needed).

Supports MiniMax / DeepSeek / Moonshot / OpenAI / any OpenAI-compatible endpoint.
"""
from __future__ import annotations
import json
import os
import urllib.request
import urllib.error
from dataclasses import dataclass


@dataclass
class LlmResult:
    text: str
    input_tokens: int
    output_tokens: int
    raw: dict


def chat(
    prompt: str,
    *,
    system: str | None = None,
    model: str | None = None,
    base_url: str | None = None,
    api_key_env: str = "POLYGLOT_LLM_API_KEY",
    temperature: float = 0.2,
    max_tokens: int = 4096,
    timeout: float = 60.0,
) -> LlmResult:
    # Provider autodetect in priority order.
    provider = os.environ.get("POLYGLOT_LLM_PROVIDER")
    if provider is None:
        if os.environ.get("MOONSHOT_API_KEY"):
            provider = "moonshot"
        elif os.environ.get("MINIMAX_API_KEY"):
            provider = "minimax"
        elif os.environ.get("OPENAI_API_KEY") or os.environ.get(api_key_env):
            provider = "openai-compatible"
        elif os.environ.get("ANTHROPIC_API_KEY"):
            provider = "anthropic"
        else:
            provider = "openai-compatible"

    if provider == "anthropic":
        return _chat_anthropic(prompt, system=system, model=model,
                               temperature=temperature, max_tokens=max_tokens, timeout=timeout)

    # OpenAI-compatible dispatch with per-provider defaults.
    if provider == "moonshot":
        base_url = base_url or "https://api.moonshot.cn/v1"
        model = model or os.environ.get("POLYGLOT_LLM_MODEL", "moonshot-v1-8k")
        api_key = os.environ.get("MOONSHOT_API_KEY")
    elif provider == "minimax":
        base_url = base_url or "https://api.minimax.chat/v1"
        model = model or os.environ.get("POLYGLOT_LLM_MODEL", "abab6.5s-chat")
        api_key = os.environ.get("MINIMAX_API_KEY")
    else:
        base_url = base_url or os.environ.get("POLYGLOT_LLM_BASE_URL", "https://api.deepseek.com/v1")
        model = model or os.environ.get("POLYGLOT_LLM_MODEL", "deepseek-chat")
        api_key = os.environ.get(api_key_env) or os.environ.get("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError(
            f"Missing API key for provider={provider}. "
            f"Set $MOONSHOT_API_KEY / $MINIMAX_API_KEY / $OPENAI_API_KEY / $ANTHROPIC_API_KEY."
        )

    msgs = []
    if system:
        msgs.append({"role": "system", "content": system})
    msgs.append({"role": "user", "content": prompt})

    body = json.dumps({
        "model": model,
        "messages": msgs,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }).encode()

    req = urllib.request.Request(
        base_url.rstrip("/") + "/chat/completions",
        data=body,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"LLM HTTP {e.code}: {e.read().decode(errors='replace')[:500]}")

    text = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    return LlmResult(
        text=text,
        input_tokens=usage.get("prompt_tokens", 0),
        output_tokens=usage.get("completion_tokens", 0),
        raw=data,
    )


def _chat_anthropic(
    prompt: str,
    *,
    system: str | None,
    model: str | None,
    temperature: float,
    max_tokens: int,
    timeout: float,
) -> LlmResult:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("Missing ANTHROPIC_API_KEY")
    model = model or os.environ.get("POLYGLOT_LLM_MODEL", "claude-haiku-4-5-20251001")
    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        payload["system"] = system
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(payload).encode(),
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Anthropic HTTP {e.code}: {e.read().decode(errors='replace')[:500]}")
    text = "".join(
        block.get("text", "") for block in data.get("content", []) if block.get("type") == "text"
    )
    usage = data.get("usage", {})
    return LlmResult(
        text=text,
        input_tokens=usage.get("input_tokens", 0),
        output_tokens=usage.get("output_tokens", 0),
        raw=data,
    )


def extract_code_block(text: str, lang: str = "python") -> str:
    """Extract first fenced code block. Fall back to whole text if no fence."""
    fence = f"```{lang}"
    if fence in text:
        after = text.split(fence, 1)[1]
        return after.split("```", 1)[0].strip()
    if "```" in text:
        after = text.split("```", 1)[1]
        return after.split("```", 1)[0].strip()
    return text.strip()


def extract_json_block(text: str) -> str:
    for fence in ("```json", "```"):
        if fence in text:
            after = text.split(fence, 1)[1]
            return after.split("```", 1)[0].strip()
    return text.strip()
