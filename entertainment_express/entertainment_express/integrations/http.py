"""HTTP helper that never logs Authorization or password fields."""

from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def request(method: str, url: str, headers: dict | None = None, body: dict | bytes | None = None, timeout: int = 20) -> dict | str:
    hdrs = dict(headers or {})
    data = None
    if body is not None and not isinstance(body, (bytes, bytearray)):
        data = json.dumps(body).encode()
        hdrs.setdefault("Content-Type", "application/json")
    elif isinstance(body, (bytes, bytearray)):
        data = body
    req = Request(url, data=data, headers=hdrs, method=method.upper())
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                return json.loads(raw) if raw else {}
            except Exception:
                return raw
    except HTTPError as err:
        raise RuntimeError(f"HTTP {err.code} {url.split('?')[0]}") from None
    except URLError as err:
        raise RuntimeError(f"network error calling provider") from None
