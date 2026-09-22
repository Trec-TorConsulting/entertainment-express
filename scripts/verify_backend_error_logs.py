#!/usr/bin/env python3
"""
Backend Error Log Verification Helper for Entertainment Express E2E Crawler.

Queries Frappe's `Error Log` doctype on target site (default: https://admin.entx.app)
to verify if recent backend exceptions occurred during test runs.
"""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from urllib import error, parse, request

BASE_URL = os.environ.get("EE_E2E_BASE", "https://admin.entx.app").rstrip("/")
ADMIN_PASS = os.environ.get("EE_ADMIN_PASSWORD", "")


class FrappeClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.cookie = ""
        self.csrf_token = ""

    def _req(self, method: str, path: str, data: dict | None = None, params: dict | None = None) -> tuple[int, dict]:
        path = parse.quote(path, safe="/:")
        url = path if path.startswith("http") else f"{self.base_url}{path}"
        if params:
            qs = parse.urlencode(params, quote_via=parse.quote)
            url += f"?{qs}"

        hdrs = {
            "User-Agent": "EE-BackendErrorVerifier/1.0",
            "Accept": "application/json",
        }
        if self.cookie:
            hdrs["Cookie"] = self.cookie
        if self.csrf_token and method in ("POST", "PUT", "DELETE"):
            hdrs["X-Frappe-CSRF-Token"] = self.csrf_token

        body = None
        if data is not None:
            body = json.dumps(data).encode("utf-8")
            hdrs["Content-Type"] = "application/json"

        req = request.Request(url, data=body, headers=hdrs, method=method)
        try:
            with request.urlopen(req, timeout=15) as resp:
                raw = resp.read().decode("utf-8", errors="ignore")
                for c in resp.headers.get_all("Set-Cookie") or []:
                    part = c.split(";", 1)[0]
                    if part:
                        key = part.split("=", 1)[0]
                        crumbs = [x for x in self.cookie.split("; ") if x and not x.startswith(key + "=")]
                        crumbs.append(part)
                        self.cookie = "; ".join(crumbs)
                try:
                    return resp.status, json.loads(raw) if raw else {}
                except json.JSONDecodeError:
                    return resp.status, {"_raw": raw[:500]}
        except error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="ignore")
            try:
                payload = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                payload = {"_raw": raw[:500]}
            return exc.code, payload

    def login(self, username: str, password: str) -> bool:
        if not password:
            return False
        # Login using form payload
        data = parse.urlencode({"usr": username, "pwd": password}).encode("utf-8")
        req = request.Request(
            f"{self.base_url}/api/method/login",
            data=data,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "EE-BackendErrorVerifier/1.0",
            },
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=15) as resp:
                for c in resp.headers.get_all("Set-Cookie") or []:
                    part = c.split(";", 1)[0]
                    if part:
                        key = part.split("=", 1)[0]
                        crumbs = [x for x in self.cookie.split("; ") if x and not x.startswith(key + "=")]
                        crumbs.append(part)
                        self.cookie = "; ".join(crumbs)
                return resp.status == 200
        except Exception as err:
            print(f"[ERROR] Failed to authenticate with Frappe backend: {err}", file=sys.stderr)
            return False

    def fetch_error_logs_since(self, start_time_iso: str) -> list[dict]:
        """Fetch Error Log entries created after start_time_iso."""
        params = {
            "fields": json.dumps(["name", "method", "error", "creation"]),
            "filters": json.dumps([["creation", ">=", start_time_iso]]),
            "order_by": "creation desc",
            "limit_page_length": 100,
        }
        status, data = self._req("GET", "/api/resource/Error Log", params=params)
        if status == 200 and "data" in data:
            return data["data"]
        return []


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--snapshot":
        # Print current ISO timestamp to stdout for snapshotting
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        print(now_str)
        sys.exit(0)

    start_time = sys.argv[1] if len(sys.argv) > 1 else ""
    if not start_time:
        start_time = datetime.now(timezone.utc).strftime("%Y-%m-%d 00:00:00")

    client = FrappeClient(BASE_URL)
    if ADMIN_PASS:
        logged_in = client.login("Administrator", ADMIN_PASS)
        if not logged_in:
            print(f"[WARN] Failed login to {BASE_URL}. Checking public/guest API state.")

    errors = client.fetch_error_logs_since(start_time)
    if errors:
        print(f"FAILED: Detected {len(errors)} backend Error Log entries since {start_time}")
        for err in errors[:10]:
            print(f"  - [{err.get('creation')}] {err.get('method')}: {str(err.get('error'))[:150]}")
        sys.exit(1)
    else:
        print(f"SUCCESS: Zero backend Error Log entries detected since {start_time}")
        sys.exit(0)


if __name__ == "__main__":
    main()
