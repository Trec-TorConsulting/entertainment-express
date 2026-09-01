"""Canned portal reports. Amounts are fmt_money strings. No GL browser."""

from __future__ import annotations

import base64
import csv
import io

import frappe
from frappe.utils import flt, fmt_money, getdate, nowdate

from entertainment_express.api.portal_employee import EMPLOYEE_ROLES
from entertainment_express.api.portal_owner import OWNER_ROLES

GUEST_ROLE = "EE Event Guest"

OWNER_PACK_LABELS = {
    "from_date": "From",
    "to_date": "To",
    "jobs": "Jobs",
    "upcoming_jobs": "Upcoming jobs",
    "revenue": "Billed",
    "outstanding": "Still owed",
    "tax": "Tax",
    "deposits_held": "Deposits held",
    "at_risk": "Needs a crew",
    "pipeline_conversion": "Pipeline",
    "pipeline_value": "Open quotes",
    "avg_deal": "Average job",
    "payouts_due": "Payouts due",
    "crew_utilization": "People use",
    "gear_utilization": "Gear use",
    "leads": "Leads",
    "quotes": "Quotes",
}


def _currency() -> str:
    return frappe.db.get_default("currency") or "USD"


def _money(amount) -> str:
    return fmt_money(flt(amount), currency=_currency())


def _require_owner() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles:
        frappe.throw("Reports access denied.", frappe.PermissionError)
    if not roles.intersection(OWNER_ROLES):
        frappe.throw("Reports access denied.", frappe.PermissionError)


def _require_employee() -> set[str]:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles:
        frappe.throw("Reports access denied.", frappe.PermissionError)
    if not roles.intersection(EMPLOYEE_ROLES):
        frappe.throw("Reports access denied.", frappe.PermissionError)
    return roles


def _require_customer() -> None:
    roles = set(frappe.get_roles() or [])
    if "EE Event Guest" in roles and "EE Customer" not in roles:
        frappe.throw("Reports access denied.", frappe.PermissionError)
    if "EE Customer" not in roles and not roles.intersection(OWNER_ROLES | EMPLOYEE_ROLES):
        frappe.throw("Reports access denied.", frappe.PermissionError)


def _period(from_date: str | None, to_date: str | None) -> tuple[str, str]:
    end = str(getdate(to_date) if to_date else getdate())
    if from_date:
        start = str(getdate(from_date))
    else:
        day = getdate(end)
        start = str(day.replace(day=1)) if hasattr(day, "replace") else str(day)
    return start, end


def _invoices(from_date: str, to_date: str) -> list:
    try:
        return frappe.get_all(
            "Sales Invoice",
            filters=[
                ["docstatus", "=", 1],
                ["posting_date", ">=", from_date],
                ["posting_date", "<=", to_date],
            ],
            fields=["outstanding_amount", "grand_total", "total_taxes_and_charges", "name"],
            limit_page_length=500,
        )
    except Exception:
        return frappe.get_all(
            "Sales Invoice",
            filters={"docstatus": 1},
            fields=["outstanding_amount", "grand_total", "name"],
            limit_page_length=500,
        )


def _deposits_held() -> float:
    filters: dict = {"docstatus": 1, "outstanding_amount": 0}
    try:
        if frappe.get_meta("Sales Invoice").has_field("ee_is_deposit"):
            filters["ee_is_deposit"] = 1
        else:
            return 0.0
    except Exception:
        return 0.0
    rows = frappe.get_all(
        "Sales Invoice",
        filters=filters,
        fields=["grand_total"],
        limit_page_length=500,
    )
    return flt(sum(flt(r.get("grand_total")) for r in rows))


def _payouts_due() -> float:
    if not getattr(frappe.db, "table_exists", lambda *_: False)("Pay Run"):
        return 0.0
    rows = frappe.get_all(
        "Pay Run",
        filters={"status": ["in", ["finalized", "submitted", "pending_payout"]]},
        fields=["total_amount"],
        limit_page_length=100,
    )
    return flt(sum(flt(r.get("total_amount")) for r in rows))


def _by_offering(from_date: str, to_date: str) -> list[dict]:
    bookings = frappe.get_all(
        "Event Booking",
        filters=[
            ["event_date", ">=", from_date],
            ["event_date", "<=", to_date],
            ["status", "in", ["confirmed", "in_progress", "completed"]],
        ],
        fields=["name"],
        limit_page_length=500,
    )
    names = [r.name for r in bookings]
    if not names:
        return []
    buckets: dict[str, dict] = {}
    try:
        items = frappe.get_all(
            "Event Booking Item",
            filters=[["parent", "in", names]],
            fields=["item_name", "amount", "parent"],
            limit_page_length=2000,
        )
    except Exception:
        return []
    for row in items:
        key = row.get("item_name") or "Other"
        bucket = buckets.setdefault(key, {"amount": 0.0, "jobs": set()})
        bucket["amount"] = flt(bucket["amount"]) + flt(row.get("amount"))
        bucket["jobs"].add(row.get("parent"))
    out = []
    for name, bucket in sorted(buckets.items(), key=lambda kv: kv[1]["amount"], reverse=True)[:12]:
        out.append({"name": name, "amount": _money(bucket["amount"]), "jobs": len(bucket["jobs"])})
    return out


def _owner_snapshot(from_date: str | None = None, to_date: str | None = None) -> dict:
    start, end = _period(from_date, to_date)
    invoices = _invoices(start, end)
    outstanding = flt(sum(flt(r.get("outstanding_amount")) for r in invoices))
    billed = flt(sum(flt(r.get("grand_total")) for r in invoices))
    tax = flt(sum(flt(r.get("total_taxes_and_charges")) for r in invoices))
    jobs = 0
    upcoming = 0
    leads = 0
    quotes = 0
    try:
        jobs = frappe.db.count(
            "Event Booking",
            {
                "status": ["in", ["confirmed", "in_progress", "completed"]],
                "event_date": ["between", [start, end]],
            },
        ) or 0
        upcoming = frappe.db.count("Event Booking", {"status": ["in", ["confirmed", "in_progress"]], "event_date": [">=", str(nowdate())]}) or 0
        leads = frappe.db.count("Lead") or 0
        quotes = frappe.db.count("Quotation", {"docstatus": ["<", 2]}) or 0
    except Exception:
        jobs = jobs or 0
    quote_value = 0.0
    try:
        for row in frappe.get_all(
            "Quotation",
            filters={"docstatus": 1},
            fields=["grand_total"],
            limit_page_length=200,
        ):
            quote_value = flt(quote_value) + flt(row.get("grand_total"))
    except Exception:
        quote_value = 0.0
    at_risk = 0
    crew_util = "—"
    try:
        from entertainment_express.api.dispatch import get_dispatch_analytics
        from entertainment_express.api.dispatch_realtime import build_day_view

        at_risk = int((build_day_view().get("summary") or {}).get("at_risk_count") or 0)
        days = max(1, (getdate(end) - getdate(start)).days or 1)
        crew_util = f"{get_dispatch_analytics(days).get('utilization_pct') or 0}%"
    except Exception:
        at_risk = 0
    gear = "—"
    try:
        assets = frappe.db.count("Service Asset") or 0
        used = 0
        if assets and frappe.db.table_exists("Event Booking Asset"):
            used = len(
                {
                    r.parent
                    for r in frappe.get_all(
                        "Event Booking Asset",
                        fields=["parent"],
                        limit_page_length=500,
                    )
                }
            )
        gear = f"{used} of {assets} in use" if assets else "No gear yet"
    except Exception:
        gear = "—"
    avg = flt(billed) / jobs if jobs else 0.0
    conversion = f"{int(jobs)} jobs from {int(quotes)} quotes"
    return {
        "from_date": start,
        "to_date": end,
        "jobs": int(jobs or 0),
        "upcoming_jobs": int(upcoming or 0),
        "revenue": _money(billed),
        "outstanding": _money(outstanding),
        "tax": _money(tax),
        "deposits_held": _money(_deposits_held()),
        "at_risk": at_risk,
        "pipeline_conversion": conversion,
        "pipeline_value": _money(quote_value),
        "avg_deal": _money(avg),
        "payouts_due": _money(_payouts_due()),
        "crew_utilization": crew_util,
        "gear_utilization": gear,
        "leads": int(leads or 0),
        "quotes": int(quotes or 0),
        "by_service_type": _by_offering(start, end),
    }


@frappe.whitelist()
def owner_pack(from_date: str | None = None, to_date: str | None = None) -> dict:
    _require_owner()
    return _owner_snapshot(from_date, to_date)


def _pack_rows(pack: dict, labels: dict[str, str] | None = None) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    for key, val in pack.items():
        if key in {"by_service_type"} or isinstance(val, (list, dict)):
            continue
        label = (labels or {}).get(key, key.replace("_", " ").title())
        rows.append((label, str(val)))
    return rows


def _csv_from_rows(rows: list[tuple[str, str]]) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["metric", "value"])
    writer.writerows(rows)
    return buf.getvalue()


def simple_pdf(title: str, lines: list[str]) -> bytes:
    """Single-page Helvetica PDF. No wkhtmltopdf — amounts are already formatted strings."""

    def esc(text: str) -> str:
        out = []
        for ch in text:
            code = ord(ch)
            if ch in "\\()":
                out.append("?")
            elif 32 <= code < 127:
                out.append(ch)
            else:
                out.append("?")
        return "".join(out)

    y = 720
    ops = [f"BT /F1 16 Tf 72 {y} Td ({esc(title)}) Tj ET"]
    y -= 28
    for line in lines:
        ops.append(f"BT /F1 11 Tf 72 {y} Td ({esc(line)}) Tj ET")
        y -= 16
        if y < 72:
            break
    stream = "\n".join(ops).encode("ascii")

    objects = [
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
        (
            b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        ),
        b"4 0 obj << /Length %d >> stream\n" % len(stream) + stream + b"\nendstream endobj\n",
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    ]
    header = b"%PDF-1.4\n"
    body = b""
    offsets = []
    pos = len(header)
    for obj in objects:
        offsets.append(pos)
        body += obj
        pos += len(obj)
    xref = [b"xref\n0 6\n0000000000 65535 f \n"]
    xref.extend(f"{off:010d} 00000 n \n".encode() for off in offsets)
    trailer = b"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n" + str(pos).encode() + b"\n%%EOF\n"
    return header + body + b"".join(xref) + trailer


def _pdf_payload(filename: str, title: str, rows: list[tuple[str, str]]) -> dict:
    lines = [f"{label}: {value}" for label, value in rows]
    raw = simple_pdf(title, lines)
    return {"filename": filename, "content_b64": base64.b64encode(raw).decode("ascii")}


@frappe.whitelist()
def owner_pack_csv(from_date: str | None = None, to_date: str | None = None) -> str:
    return _csv_from_rows(_pack_rows(owner_pack(from_date, to_date), OWNER_PACK_LABELS))


@frappe.whitelist()
def owner_pack_pdf(from_date: str | None = None, to_date: str | None = None) -> dict:
    return _pdf_payload("company-reports.pdf", "Company reports", _pack_rows(owner_pack(from_date, to_date), OWNER_PACK_LABELS))


@frappe.whitelist()
def employee_pack() -> dict:
    roles = _require_employee()
    return _employee_snapshot(roles)


def _employee_snapshot(roles: set[str] | None = None) -> dict:
    roles = roles or EMPLOYEE_ROLES
    payload = {"role": sorted(roles)}
    if "EE Sales" in roles:
        payload["my_open_leads"] = frappe.db.count("Lead", {"status": "Open"})
    if "EE Dispatcher" in roles:
        payload["today_jobs"] = frappe.db.count("Event Booking", {"status": ["in", ["confirmed", "in_progress"]]})
    if "EE Accounting" in roles:
        outstanding = frappe.get_all(
            "Sales Invoice",
            filters={"docstatus": 1, "outstanding_amount": [">", 0]},
            fields=["outstanding_amount"],
            limit_page_length=200,
        )
        payload["aging_outstanding"] = _money(sum(flt(r.get("outstanding_amount")) for r in outstanding))
    if roles.intersection({"EE Crew", "EE Entertainer"}):
        emp = frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")
        payload["my_assignments"] = frappe.db.count("Crew Assignment", {"crew_member": emp}) if emp else 0
    if "EE Dispatcher" in roles:
        try:
            from entertainment_express.api.dispatch import get_dispatch_analytics

            payload["people_use"] = f"{get_dispatch_analytics(30).get('utilization_pct') or 0}%"
        except Exception:
            payload["people_use"] = "—"
    if "EE Accounting" in roles:
        payload["deposits_held"] = _money(_deposits_held())
        payload["payouts_due"] = _money(_payouts_due())
    return payload


@frappe.whitelist()
def employee_pack_csv() -> str:
    pack = employee_pack()
    return _csv_from_rows(_pack_rows(pack))


@frappe.whitelist()
def employee_pack_pdf() -> dict:
    return _pdf_payload("my-reports.pdf", "My reports", _pack_rows(employee_pack()))


@frappe.whitelist()
def client_money_summary(booking: str | None = None) -> dict:
    _require_customer()
    filters: dict = {"docstatus": 1}
    if booking:
        # invoices linked via Event Booking.quotation / customer
        customer = frappe.db.get_value("Event Booking", booking, "customer")
        if customer:
            filters["customer"] = customer
    else:
        user = frappe.session.user
        # Website users often match Customer email
        customer = frappe.db.get_value("Customer", {"email_id": user}, "name")
        if customer:
            filters["customer"] = customer
        elif "EE Customer" in set(frappe.get_roles() or []):
            pass
        else:
            return {"owed": _money(0), "paid": _money(0), "remaining": _money(0), "remaining_amount": 0}

    rows = frappe.get_all(
        "Sales Invoice",
        filters=filters,
        fields=["grand_total", "outstanding_amount"],
        limit_page_length=100,
    )
    owed = flt(sum(flt(r.get("grand_total")) for r in rows))
    remaining = flt(sum(flt(r.get("outstanding_amount")) for r in rows))
    paid = owed - remaining
    return {
        "owed": _money(owed),
        "paid": _money(paid),
        "remaining": _money(remaining),
        "remaining_amount": remaining,
    }


def _schedule_payload(doc) -> dict:
    return {
        "id": doc.name,
        "title": doc.title,
        "pack": doc.pack,
        "cadence": doc.cadence,
        "weekday": int(doc.weekday or 0),
        "recipients": doc.recipients or "",
        "active": bool(doc.active),
        "last_sent": str(doc.last_sent or ""),
    }


@frappe.whitelist()
def list_schedules() -> list[dict]:
    _require_owner()
    if not frappe.db.table_exists("EE Report Schedule"):
        return []
    rows = []
    for row in frappe.get_all(
        "EE Report Schedule",
        fields=["name", "title", "pack", "cadence", "weekday", "recipients", "active", "last_sent"],
        order_by="modified desc",
        limit_page_length=50,
    ):
        rows.append(
            {
                "id": row.name,
                "title": row.title,
                "pack": row.pack,
                "cadence": row.cadence,
                "weekday": int(row.weekday or 0),
                "recipients": row.recipients or "",
                "active": bool(row.active),
                "last_sent": str(row.last_sent or ""),
            }
        )
    return rows


@frappe.whitelist()
def save_schedule(title: str, recipients: str, pack: str = "owner", cadence: str = "weekly", weekday: int = 0) -> dict:
    _require_owner()
    emails = (recipients or "").strip()
    if not emails:
        frappe.throw("Add at least one email.")
    doc = frappe.get_doc(
        {
            "doctype": "EE Report Schedule",
            "title": (title or "Weekly snapshot")[:140],
            "pack": pack if pack in ("owner", "employee") else "owner",
            "cadence": cadence if cadence in ("weekly", "monthly") else "weekly",
            "weekday": int(weekday or 0),
            "recipients": emails[:500],
            "active": 1,
        }
    )
    doc.insert(ignore_permissions=True)
    return _schedule_payload(doc)


@frappe.whitelist()
def stop_schedule(name: str) -> dict:
    _require_owner()
    doc = frappe.get_doc("EE Report Schedule", name)
    doc.active = 0
    doc.save(ignore_permissions=True)
    return _schedule_payload(doc)


def _ensure_templates() -> None:
    if not frappe.db.table_exists("Notification Template"):
        return
    if frappe.db.exists("Notification Template", {"template_key": "report_digest"}):
        return
    frappe.get_doc(
        {
            "doctype": "Notification Template",
            "template_key": "report_digest",
            "name": "report_digest",
            "subject": "{{ title }}",
            "body_html": "<p>{{ body }}</p><p><a href='{{ reports_link }}'>Open reports</a></p>",
            "active": 1,
            "channels": "email",
            "priority": "promotional",
        }
    ).insert(ignore_permissions=True)


def run_schedules() -> None:
    if not frappe.db.table_exists("EE Report Schedule"):
        return
    today = getdate()
    weekday = int(today.weekday()) if hasattr(today, "weekday") else 0
    is_month_start = int(getattr(today, "day", 1) or 1) == 1
    from entertainment_express.notifications import send

    for row in frappe.get_all(
        "EE Report Schedule",
        filters={"active": 1},
        fields=["name", "title", "pack", "cadence", "weekday", "recipients", "last_sent"],
        limit_page_length=50,
    ):
        if str(row.last_sent or "") == str(today):
            continue
        if row.cadence == "weekly" and int(row.weekday or 0) != weekday:
            continue
        if row.cadence == "monthly" and not is_month_start:
            continue
        pack = _owner_snapshot() if row.pack != "employee" else _employee_snapshot()
        lines = [f"{label}: {value}" for label, value in _pack_rows(pack, OWNER_PACK_LABELS)]
        body = "<br>".join(lines) or "No numbers this period."
        site = frappe.utils.get_url() if hasattr(frappe.utils, "get_url") else ""
        link = f"{site}/owner/reports" if row.pack != "employee" else f"{site}/employee/reports"
        for email in [p.strip() for p in (row.recipients or "").replace(";", ",").split(",") if p.strip()]:
            try:
                send(
                    "report_digest",
                    email,
                    {"title": row.title or "Your snapshot", "body": body, "reports_link": link},
                )
            except Exception:
                frappe.logger().error("report digest failed")
        frappe.db.set_value("EE Report Schedule", row.name, "last_sent", str(today))
    frappe.db.commit()
