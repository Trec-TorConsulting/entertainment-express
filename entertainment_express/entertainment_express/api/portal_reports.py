"""Canned portal reports. Amounts are fmt_money strings. No GL browser."""

from __future__ import annotations

import base64
import csv
import io

import frappe
from frappe.utils import flt, fmt_money

from entertainment_express.api.portal_employee import EMPLOYEE_ROLES
from entertainment_express.api.portal_owner import OWNER_ROLES

OWNER_PACK_LABELS = {
    "jobs": "Jobs",
    "revenue": "Billed",
    "outstanding": "Still owed",
    "deposits_held": "Deposits held",
    "at_risk": "Needs a crew",
    "pipeline_conversion": "Pipeline",
    "payouts_due": "Payouts due",
}


def _currency() -> str:
    return frappe.db.get_default("currency") or "USD"


def _money(amount) -> str:
    return fmt_money(flt(amount), currency=_currency())


def _require_owner() -> None:
    if not set(frappe.get_roles() or []).intersection(OWNER_ROLES):
        frappe.throw("Reports access denied.", frappe.PermissionError)


def _require_employee() -> set[str]:
    roles = set(frappe.get_roles() or [])
    if not roles.intersection(EMPLOYEE_ROLES):
        frappe.throw("Reports access denied.", frappe.PermissionError)
    return roles


def _require_customer() -> None:
    roles = set(frappe.get_roles() or [])
    if "EE Event Guest" in roles and "EE Customer" not in roles:
        frappe.throw("Reports access denied.", frappe.PermissionError)
    if "EE Customer" not in roles and not roles.intersection(OWNER_ROLES | EMPLOYEE_ROLES):
        frappe.throw("Reports access denied.", frappe.PermissionError)


@frappe.whitelist()
def owner_pack() -> dict:
    _require_owner()
    invoices = frappe.get_all(
        "Sales Invoice",
        filters={"docstatus": 1},
        fields=["outstanding_amount", "grand_total", "status"],
        limit_page_length=500,
    )
    outstanding = flt(sum(flt(r.get("outstanding_amount")) for r in invoices))
    billed = flt(sum(flt(r.get("grand_total")) for r in invoices))
    jobs = frappe.db.count("Event Booking", {"status": ["in", ["confirmed", "in_progress", "completed"]]})
    at_risk = 0
    try:
        from entertainment_express.api.dispatch_realtime import build_day_view

        at_risk = int((build_day_view().get("summary") or {}).get("at_risk_count") or 0)
    except Exception:
        at_risk = 0
    return {
        "jobs": jobs,
        "revenue": _money(billed),
        "outstanding": _money(outstanding),
        "deposits_held": _money(0),
        "at_risk": at_risk,
        "pipeline_conversion": "—",
        "payouts_due": _money(0),
        "by_service_type": [],
    }


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
def owner_pack_csv() -> str:
    return _csv_from_rows(_pack_rows(owner_pack(), OWNER_PACK_LABELS))


@frappe.whitelist()
def owner_pack_pdf() -> dict:
    return _pdf_payload("company-reports.pdf", "Company reports", _pack_rows(owner_pack(), OWNER_PACK_LABELS))


@frappe.whitelist()
def employee_pack() -> dict:
    roles = _require_employee()
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
        payload["my_assignments"] = frappe.db.count("Crew Assignment", {"crew_member": ["in", [frappe.session.user]]})
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
            return {"owed": _money(0), "paid": _money(0), "remaining": _money(0)}

    rows = frappe.get_all(
        "Sales Invoice",
        filters=filters,
        fields=["grand_total", "outstanding_amount"],
        limit_page_length=100,
    )
    owed = flt(sum(flt(r.get("grand_total")) for r in rows))
    remaining = flt(sum(flt(r.get("outstanding_amount")) for r in rows))
    paid = owed - remaining
    return {"owed": _money(owed), "paid": _money(paid), "remaining": _money(remaining)}
