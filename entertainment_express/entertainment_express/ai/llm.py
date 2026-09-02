"""Pluggable LLM client. Never raises. Never logs keys."""

from __future__ import annotations

import json
from urllib.request import Request, urlopen

UNAVAILABLE = "AI suggestion unavailable"


def complete(prompt: str, timeout: int = 20) -> str | None:
    try:
        settings = _settings()
        provider = (getattr(settings, "provider", None) or "ollama").strip().lower()
        model = (getattr(settings, "model", None) or "llama3.2").strip() or "llama3.2"
        if provider == "openai":
            return _openai(prompt, model, timeout, _password(settings, "openai_key"))
        if provider == "gemini":
            return _gemini(prompt, model, timeout, _password(settings, "gemini_key"))
        return _ollama(prompt, model, timeout)
    except Exception:
        return None


def _settings():
    import frappe

    if hasattr(frappe, "get_single"):
        try:
            return frappe.get_single("EE AI Settings")
        except Exception:
            pass
    return type("S", (), {"provider": "ollama", "model": "llama3.2"})()


def _password(settings, field: str) -> str:
    getter = getattr(settings, "get_password", None)
    if callable(getter):
        try:
            return getter(field) or ""
        except Exception:
            return ""
    return getattr(settings, field, None) or ""


def _conf_get(key: str, default: str) -> str:
    import frappe

    conf = getattr(frappe, "conf", None)
    if conf is None:
        return default
    getter = getattr(conf, "get", None)
    if callable(getter):
        return getter(key) or default
    if isinstance(conf, dict):
        return conf.get(key) or default
    return getattr(conf, key, None) or default


def _ollama(prompt: str, model: str, timeout: int) -> str | None:
    url = _conf_get("ee_ollama_url", "http://ollama.entertainment-express.svc:11434").rstrip("/") + "/api/generate"
    body = json.dumps({"model": model, "prompt": prompt, "stream": False}).encode()
    req = Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    with urlopen(req, timeout=timeout) as resp:
        payload = json.loads(resp.read().decode() or "{}")
    text = (payload.get("response") or "").strip()
    return text or None


def _openai(prompt: str, model: str, timeout: int, key: str) -> str | None:
    if not key:
        return None
    body = json.dumps(
        {
            "model": model or "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 400,
        }
    ).encode()
    req = Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
        method="POST",
    )
    with urlopen(req, timeout=timeout) as resp:
        payload = json.loads(resp.read().decode() or "{}")
    choices = payload.get("choices") or []
    if not choices:
        return None
    text = ((choices[0].get("message") or {}).get("content") or "").strip()
    return text or None


def _gemini(prompt: str, model: str, timeout: int, key: str) -> str | None:
    if not key:
        return None
    name = model or "gemini-2.0-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{name}:generateContent?key={key}"
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode()
    req = Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    with urlopen(req, timeout=timeout) as resp:
        payload = json.loads(resp.read().decode() or "{}")
    cands = payload.get("candidates") or []
    if not cands:
        return None
    parts = ((cands[0].get("content") or {}).get("parts") or [])
    text = " ".join(p.get("text") or "" for p in parts).strip()
    return text or None
