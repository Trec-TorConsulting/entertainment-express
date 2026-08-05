#!/usr/bin/env python3
"""
Live Phase-4 DoD E2E against a tenant site (default: funytown.entx.app).

Flow: login → seed booking/crew → accept → check-in → customer crew-status +
dispatch day-view → check-out → booking completed.

Auth: Administrator password from EE_ADMIN_PASSWORD env, or kubectl secret ee-secrets.
Never prints the password.
"""

from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
import time
import uuid
from datetime import datetime, timedelta
from urllib import error, parse, request

BASE = os.environ.get("EE_E2E_BASE", "https://funytown.entx.app").rstrip("/")
TIMEOUT = int(os.environ.get("EE_E2E_TIMEOUT", "30"))


class Client:
    def __init__(self, base: str):
        self.base = base
        self.cookie = ""
        self.csrf = ""

    def _req(self, method: str, path: str, data=None, headers=None, form=False):
        url = path if path.startswith("http") else f"{self.base}{path}"
        hdrs = {"User-Agent": "EE-Phase4-E2E/1.0", "Accept": "application/json"}
        if self.cookie:
            hdrs["Cookie"] = self.cookie
        if self.csrf and method in ("POST", "PUT", "DELETE"):
            hdrs["X-Frappe-CSRF-Token"] = self.csrf
        if headers:
            hdrs.update(headers)
        body = None
        if data is not None:
            if form:
                body = parse.urlencode(data).encode()
                hdrs["Content-Type"] = "application/x-www-form-urlencoded"
            else:
                body = json.dumps(data).encode()
                hdrs["Content-Type"] = "application/json"
        req = request.Request(url, data=body, headers=hdrs, method=method)
        try:
            with request.urlopen(req, timeout=TIMEOUT) as resp:
                raw = resp.read().decode("utf-8", errors="ignore")
                for c in resp.headers.get_all("Set-Cookie") or []:
                    part = c.split(";", 1)[0]
                    if not part:
                        continue
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

    def login(self, user: str, password: str):
        status, body = self._req(
            "POST", "/api/method/login", {"usr": user, "pwd": password}, form=True
        )
        if status != 200:
            raise RuntimeError(f"login failed: {status} {body}")
        st, csrf = self._req("GET", "/api/method/frappe.sessions.get_csrf_token")
        if st == 200:
            msg = csrf.get("message")
            self.csrf = msg if isinstance(msg, str) else ""
        return body

    def method(self, dotted: str, params=None, http="POST", token=None):
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if http == "GET":
            qs = f"?{parse.urlencode(params or {})}" if params else ""
            return self._req("GET", f"/api/method/{dotted}{qs}", headers=headers)
        return self._req("POST", f"/api/method/{dotted}", params or {}, headers=headers)

    def resource(self, doctype: str, data: dict):
        return self._req("POST", f"/api/resource/{parse.quote(doctype)}", data)


def admin_password() -> str:
    env = os.environ.get("EE_ADMIN_PASSWORD")
    if env:
        return env
    out = subprocess.check_output(
        [
            "kubectl", "-n", "entertainment-express", "get", "secret", "ee-secrets",
            "-o", "jsonpath={.data.administrator-password}",
        ],
        text=True,
    ).strip()
    return base64.b64decode(out).decode()


def unwrap(body):
    if isinstance(body, dict) and "message" in body:
        return body["message"]
    return body


def company_name(c: Client) -> str:
    st, body = c._req("GET", "/api/resource/Company?fields=%5B%22name%22%5D&limit_page_length=1")
    if st != 200:
        return "Funytown"
    data = unwrap(body)
    rows = data if isinstance(data, list) else data.get("data") or []
    if rows:
        return rows[0].get("name") or rows[0]
    return "Funytown"


def gender_name(c: Client) -> str:
    st, body = c._req("GET", "/api/resource/Gender?fields=%5B%22name%22%5D&limit_page_length=10")
    if st == 200:
        data = unwrap(body)
        rows = data if isinstance(data, list) else data.get("data") or []
        if rows:
            return rows[0].get("name") or rows[0]
    # Seed a Gender master if the site has none (fresh tenant).
    for candidate in ("Male", "Female", "Other"):
        st, body = c.resource("Gender", {"gender": candidate})
        if st in (200, 201):
            return candidate
        st, _ = c._req("GET", f"/api/resource/Gender/{parse.quote(candidate)}")
        if st == 200:
            return candidate
    raise RuntimeError(f"Unable to seed Gender master: {body}")


def crew_role_name(c: Client) -> str:
    st, body = c._req("GET", "/api/resource/EE%20Crew%20Role?fields=%5B%22name%22%5D&limit_page_length=10")
    if st == 200:
        data = unwrap(body)
        rows = data if isinstance(data, list) else data.get("data") or []
        if rows:
            return rows[0].get("name") or rows[0]
    st, body = c.resource("EE Crew Role", {"role_name": "DJ", "active": 1})
    if st in (200, 201):
        return "DJ"
    st, _ = c._req("GET", "/api/resource/EE%20Crew%20Role/DJ")
    if st == 200:
        return "DJ"
    raise RuntimeError(f"Unable to seed EE Crew Role: {body}")


def mint_tokens(site: str, employee: str, customer: str) -> dict:
    def _issue(user: str, scopes: list[str]) -> str:
        kwargs = json.dumps({"user": user, "scopes": scopes})
        out = subprocess.check_output(
            [
                "kubectl", "-n", "entertainment-express", "exec", "deploy/frappe-python", "--",
                "bash", "-lc",
                f"cd /home/frappe/frappe-bench && bench --site {site} execute "
                f"entertainment_express.api.auth_jwt.issue_token_pair --kwargs {json.dumps(kwargs)}",
            ],
            text=True,
            stderr=subprocess.STDOUT,
        )
        for line in reversed(out.strip().splitlines()):
            line = line.strip()
            if line.startswith("{") and "access_token" in line:
                return json.loads(line)["access_token"]
        raise RuntimeError(f"token mint failed for {user}: {out[-500:]}")

    return {
        "crew": _issue(employee, ["crew_read", "crew_write"]),
        "customer": _issue(customer, ["customer_read", "customer_write"]),
        "dispatch": _issue("Administrator", ["dispatch_read", "dispatch_write"]),
    }


def main() -> int:
    print(f"E2E base: {BASE}")
    site = BASE.replace("https://", "").replace("http://", "").split("/")[0]
    c = Client(BASE)
    c.login("Administrator", admin_password())
    print("✓ logged in as Administrator")

    stamp = uuid.uuid4().hex[:8]
    today = datetime.utcnow().date()
    company = company_name(c)
    gender = gender_name(c)
    role = crew_role_name(c)

    st, cust = c.resource(
        "Customer",
        {
            "customer_name": f"E2E DoD {stamp}",
            "customer_type": "Individual",
            "customer_group": "Individual",
            "territory": "All Territories",
        },
    )
    if st not in (200, 201):
        raise RuntimeError(f"create Customer failed: {st} {cust}")
    customer = (unwrap(cust).get("name") if isinstance(unwrap(cust), dict) else None) or cust.get("data", {}).get("name")
    print(f"✓ customer {customer}")

    st, emp = c.resource(
        "Employee",
        {
            "first_name": "E2E",
            "last_name": f"Crew{stamp}",
            "employee_name": f"E2E Crew {stamp}",
            "status": "Active",
            "gender": gender,
            "date_of_birth": str(today - timedelta(days=365 * 28)),
            "date_of_joining": str(today - timedelta(days=30)),
            "company": company,
        },
    )
    if st not in (200, 201):
        raise RuntimeError(f"create Employee failed: {st} {emp}")
    employee = (unwrap(emp).get("name") if isinstance(unwrap(emp), dict) else None) or emp.get("data", {}).get("name")
    print(f"✓ employee {employee}")

    start = datetime.combine(today, datetime.strptime("18:00", "%H:%M").time())
    end = datetime.combine(today, datetime.strptime("22:00", "%H:%M").time())
    st, book = c.resource(
        "Event Booking",
        {
            "event_name": f"E2E DoD Event {stamp}",
            "event_date": str(today),
            "start_time": start.strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": end.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "confirmed",
            "customer": customer,
        },
    )
    if st not in (200, 201):
        raise RuntimeError(f"create Event Booking failed: {st} {book}")
    booking = (unwrap(book).get("name") if isinstance(unwrap(book), dict) else None) or book.get("data", {}).get("name")
    print(f"✓ booking {booking}")

    st, asg = c.resource(
        "Crew Assignment",
        {
            "booking": booking,
            "crew_member": employee,
            "role": role,
            "status": "offered",
        },
    )
    if st not in (200, 201):
        raise RuntimeError(f"create Crew Assignment failed: {st} {asg}")
    assignment = (unwrap(asg).get("name") if isinstance(unwrap(asg), dict) else None) or asg.get("data", {}).get("name")
    print(f"✓ assignment {assignment} (offered)")

    tokens = mint_tokens(site, employee, customer)
    crew_tok, cust_tok, disp_tok = tokens["crew"], tokens["customer"], tokens["dispatch"]
    print("✓ JWTs minted for crew / customer / dispatch")

    def assert_success(st, body, label):
        msg = unwrap(body)
        ok = st == 200 and (
            (isinstance(msg, dict) and msg.get("status") == "success")
            or (isinstance(msg, dict) and msg.get("data", {}).get("status"))
        )
        if not ok:
            raise RuntimeError(f"{label} failed: {st} {body}")
        return msg

    t0 = time.perf_counter()
    st, body = c.method(
        "entertainment_express.api.mobile_api_v2.crew_shift_accept",
        {"assignment_id": assignment, "token": crew_tok},
        token=crew_tok,
    )
    accept_ms = (time.perf_counter() - t0) * 1000
    assert_success(st, body, "accept")
    print(f"✓ crew accepted ({accept_ms:.0f}ms)")

    t0 = time.perf_counter()
    st, body = c.method(
        "entertainment_express.api.mobile_api_v2.crew_check_in",
        {
            "assignment_id": assignment,
            "latitude": 40.7128,
            "longitude": -74.0060,
            "photo_url": "https://cdn.example/e2e.jpg",
            "token": crew_tok,
        },
        token=crew_tok,
    )
    cin_ms = (time.perf_counter() - t0) * 1000
    assert_success(st, body, "check-in")
    print(f"✓ crew checked in ({cin_ms:.0f}ms)")

    st, body = c.method(
        "entertainment_express.api.mobile_api_v2.crew_location_ping",
        {
            "assignment_id": assignment,
            "latitude": 40.7130,
            "longitude": -74.0062,
            "token": crew_tok,
        },
        token=crew_tok,
    )
    assert_success(st, body, "location ping")
    print("✓ location ping")

    t0 = time.perf_counter()
    st, body = c.method(
        "entertainment_express.api.mobile_api_v2.customer_crew_status",
        {"booking_id": booking, "token": cust_tok},
        http="GET",
        token=cust_tok,
    )
    cust_ms = (time.perf_counter() - t0) * 1000
    msg = assert_success(st, body, "customer crew-status")
    crew_rows = msg.get("data", {}).get("crew") or []
    match = next((r for r in crew_rows if r.get("assignment_id") == assignment), None)
    if not match or match.get("status") != "checked_in" or match.get("latitude") is None:
        raise RuntimeError(f"customer missing GPS: {crew_rows}")
    print(f"✓ customer crew-status sees GPS ({cust_ms:.0f}ms)")

    t0 = time.perf_counter()
    st, body = c.method(
        "entertainment_express.api.mobile_api_v2.dispatch_day_view",
        {"event_date": str(today), "token": disp_tok},
        http="GET",
        token=disp_tok,
    )
    disp_ms = (time.perf_counter() - t0) * 1000
    msg = assert_success(st, body, "dispatch day-view")
    bookings = msg.get("data", {}).get("bookings") or []
    hit = next((b for b in bookings if b.get("name") == booking), None)
    if not hit:
        raise RuntimeError(f"booking missing from day view ({len(bookings)} rows)")
    ours = next((a for a in (hit.get("crew_assignments") or []) if a.get("name") == assignment), None)
    if not ours or ours.get("status") != "checked_in":
        raise RuntimeError(f"dispatch missing checked-in assignment: {hit.get('crew_assignments')}")
    print(f"✓ dispatch day-view shows checked-in crew ({disp_ms:.0f}ms)")

    t0 = time.perf_counter()
    st, body = c.method(
        "entertainment_express.api.mobile_api_v2.crew_check_out",
        {"assignment_id": assignment, "notes": "E2E complete", "token": crew_tok},
        token=crew_tok,
    )
    cout_ms = (time.perf_counter() - t0) * 1000
    msg = assert_success(st, body, "check-out")
    print(f"✓ crew checked out ({cout_ms:.0f}ms)")
    timesheet_id = (msg.get("data") or {}).get("timesheet", {}).get("timesheet_id")
    if not timesheet_id:
        raise RuntimeError(f"check-out did not return timesheet: {msg}")
    print(f"✓ timesheet auto-created {timesheet_id}")

    st, body = c.method(
        "entertainment_express.api.mobile_api_v2.crew_timesheets",
        {"token": crew_tok, "page": 1},
        http="GET",
        token=crew_tok,
    )
    msg = assert_success(st, body, "crew timesheets")
    items = (msg.get("data") or {}).get("items") or []
    if not any(i.get("name") == timesheet_id for i in items):
        raise RuntimeError(f"timesheet {timesheet_id} missing from crew list: {items[:3]}")
    print("✓ crew timesheets list includes auto-created sheet")

    st, body = c.method(
        "entertainment_express.api.mobile_api_v2.crew_timesheet_detail",
        {"timesheet_id": timesheet_id, "token": crew_tok},
        http="GET",
        token=crew_tok,
    )
    msg = assert_success(st, body, "crew timesheet detail")
    detail = msg.get("data") or {}
    if flt_or_zero(detail.get("total_hours")) <= 0:
        raise RuntimeError(f"timesheet detail has no hours: {detail}")
    print(f"✓ crew timesheet detail hours={detail.get('total_hours')}")

    st, body = c._req("GET", f"/api/resource/Event%20Booking/{parse.quote(booking)}")
    if st != 200:
        raise RuntimeError(f"reload booking failed: {st} {body}")
    doc = unwrap(body)
    status = (doc.get("data") or doc).get("status")
    if status != "completed":
        raise RuntimeError(f"booking status={status}, expected completed")
    print("✓ booking marked completed")

    latencies = [accept_ms, cin_ms, cust_ms, disp_ms, cout_ms]
    under_500 = sum(1 for x in latencies if x < 500)
    print(f"✓ latency samples ms: {[round(x) for x in latencies]} ({under_500}/{len(latencies)} <500ms)")
    print("\nDoD API path PASSED")
    return 0


def flt_or_zero(value) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"✗ E2E FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
