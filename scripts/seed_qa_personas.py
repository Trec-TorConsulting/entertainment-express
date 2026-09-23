#!/usr/bin/env python3
"""Create the three live QA personas on the EntX smoke tenant.

Required env:
  EE_E2E_BASE
  EE_ADMIN_PASSWORD
  EE_OWNER_EMAIL EE_OWNER_PASSWORD
  EE_EMPLOYEE_EMAIL EE_EMPLOYEE_PASSWORD
  EE_CLIENT_EMAIL EE_CLIENT_PASSWORD

Owner gets EE Tenant Admin. Employee gets EE Crew and EE Dispatcher.
Client gets EE Customer. Passwords are never printed.
"""

from __future__ import annotations

import json
import os
import sys
from urllib import error, parse, request

BASE = os.environ.get("EE_E2E_BASE", "").rstrip("/")
if not BASE:
    raise SystemExit("Set EE_E2E_BASE to a live QA tenant. e2esmoke.entx.app is not provisioned.")


class Client:
    def __init__(self) -> None:
        self.cookie = ""
        self.csrf = ""

    def _req(self, method: str, path: str, data=None, form: bool = False):
        url = path if path.startswith("http") else f"{BASE}{path}"
        headers = {"User-Agent": "EE-QA-Seed/1.0", "Accept": "application/json"}
        if self.cookie:
            headers["Cookie"] = self.cookie
        if self.csrf and method in ("POST", "PUT", "DELETE"):
            headers["X-Frappe-CSRF-Token"] = self.csrf
        body = None
        if data is not None:
            if form:
                body = parse.urlencode(data).encode()
                headers["Content-Type"] = "application/x-www-form-urlencoded"
            else:
                body = json.dumps(data).encode()
                headers["Content-Type"] = "application/json"
        req = request.Request(url, data=body, headers=headers, method=method)
        try:
            with request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8", errors="ignore")
                self._eat_cookies(resp.headers.get_all("Set-Cookie") or [])
                return resp.status, json.loads(raw) if raw else {}
        except error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="ignore")
            self._eat_cookies(exc.headers.get_all("Set-Cookie") or [])
            try:
                payload = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                payload = {"_raw": raw[:400]}
            return exc.code, payload

    def _eat_cookies(self, cookies: list[str]) -> None:
        for crumb in cookies:
            part = crumb.split(";", 1)[0]
            if not part or "=" not in part:
                continue
            key = part.split("=", 1)[0]
            kept = [item for item in self.cookie.split("; ") if item and not item.startswith(key + "=")]
            kept.append(part)
            self.cookie = "; ".join(kept)

    def login(self, user: str, password: str) -> None:
        status, body = self._req("POST", "/api/method/login", {"usr": user, "pwd": password}, form=True)
        if status != 200:
            raise SystemExit(f"Administrator login failed ({status}).")
        status, token = self._req("GET", "/api/method/frappe.sessions.get_csrf_token")
        if status == 200 and isinstance(token.get("message"), str):
            self.csrf = token["message"]

    def method(self, dotted: str, params: dict | None = None):
        return self._req("POST", f"/api/method/{dotted}", params or {})


def env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Set {name}.")
    return value


def ensure_user(client: Client, email: str, first: str, password: str, roles: list[str]) -> None:
    status, existing = client.method("frappe.client.get", {"doctype": "User", "name": email})
    doc = {
        "doctype": "User",
        "email": email,
        "first_name": first,
        "send_welcome_email": 0,
        "user_type": "System User",
        "enabled": 1,
        "new_password": password,
        "roles": [{"role": role} for role in roles],
    }
    if status == 200 and existing.get("message"):
        current = existing["message"]
        current["enabled"] = 1
        current["new_password"] = password
        have = {row.get("role") for row in current.get("roles") or []}
        for role in roles:
            if role not in have:
                current.setdefault("roles", []).append({"role": role})
        status, saved = client.method("frappe.client.save", {"doc": current})
        if status != 200:
            raise SystemExit(f"Could not update {email}: {saved}")
        print(f"updated {email} roles={','.join(roles)}")
        return
    status, created = client.method("frappe.client.insert", {"doc": doc})
    if status != 200:
        raise SystemExit(f"Could not create {email}: {created}")
    print(f"created {email} roles={','.join(roles)}")


def main() -> None:
    admin_password = env("EE_ADMIN_PASSWORD")
    client = Client()
    client.login("Administrator", admin_password)
    ensure_user(client, env("EE_OWNER_EMAIL"), "QA Owner", env("EE_OWNER_PASSWORD"), ["EE Tenant Admin"])
    ensure_user(
        client,
        env("EE_EMPLOYEE_EMAIL"),
        "QA Employee",
        env("EE_EMPLOYEE_PASSWORD"),
        ["EE Crew", "EE Dispatcher"],
    )
    ensure_user(client, env("EE_CLIENT_EMAIL"), "QA Client", env("EE_CLIENT_PASSWORD"), ["EE Customer"])
    print(f"personas ready on {BASE}")


if __name__ == "__main__":
    main()
