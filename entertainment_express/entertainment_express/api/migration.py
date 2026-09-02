"""Tenant CSV import/export. Site-scoped. Dry-run writes nothing. Money via flt."""

from __future__ import annotations

import csv
import io
import json

import frappe
from frappe.utils import cint, flt, nowdate

from entertainment_express.api.migration_presets import PRESETS, load_json_presets

TARGETS = ("customers", "leads", "bookings", "packages", "gear", "venues", "vendors", "songs")
ROW_CAP = 5000
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
OWNER_ROLE = "EE Tenant Admin"


def _require() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if OWNER_ROLE not in roles:
        frappe.throw("Owner portal access denied.", frappe.PermissionError)


def _parse_mapping(raw) -> dict:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        return frappe.parse_json(raw) or {}
    return {}


def _cell(row: dict, mapping: dict, field: str) -> str:
    header = mapping.get(field) or field
    if header in row and row.get(header) not in (None, ""):
        return str(row.get(header) or "").strip()
    # case-insensitive header match
    lower = {str(k).strip().lower(): k for k in row.keys()}
    key = lower.get(str(header).strip().lower())
    if key:
        return str(row.get(key) or "").strip()
    return str(row.get(field) or "").strip()


def _read_rows(text: str) -> list[dict]:
    sample = (text or "").lstrip("\ufeff")
    if not sample.strip():
        return []
    if sample.startswith("PK"):
        frappe.throw("Save the spreadsheet as CSV and try again.")
    try:
        reader = csv.DictReader(io.StringIO(sample))
        rows = []
        for i, row in enumerate(reader, start=2):
            if i > ROW_CAP + 1:
                break
            rows.append(row)
        return rows
    except csv.Error:
        frappe.throw("That file is not a readable CSV. Save as CSV and try again.")


def _ensure_customer(name: str, email: str, phone: str = "") -> str | None:
    email = (email or "").strip()
    name = (name or "").strip() or email.split("@")[0]
    if email and frappe.db.exists("Customer", {"email_id": email}):
        return frappe.db.get_value("Customer", {"email_id": email}, "name")
    if not name:
        return None
    doc = frappe.get_doc(
        {
            "doctype": "Customer",
            "customer_name": name[:140],
            "customer_type": "Individual",
            "email_id": email[:140] if email else "",
            "mobile_no": (phone or "")[:30],
        }
    )
    if doc.meta.has_field("customer_group"):
        doc.customer_group = frappe.db.get_single_value("Selling Settings", "customer_group") or "Individual"
    if doc.meta.has_field("territory"):
        doc.territory = frappe.db.get_single_value("Selling Settings", "territory") or "All Territories"
    doc.insert(ignore_permissions=True)
    return doc.name


def _import_row(target: str, row: dict, mapping: dict, dry: bool) -> str | None:
    """Return skip reason or None if ok / would-ok."""
    if target == "customers":
        email = _cell(row, mapping, "email")
        name = _cell(row, mapping, "name")
        if not email and not name:
            return "Name or email is required."
        if email and frappe.db.exists("Customer", {"email_id": email}):
            return "skip"
        if not dry:
            _ensure_customer(name, email, _cell(row, mapping, "phone"))
        return None
    if target == "leads":
        email = _cell(row, mapping, "email")
        name = _cell(row, mapping, "name")
        if not email or "@" not in email:
            return "Email is required."
        if frappe.db.exists("Lead", {"email_id": email}):
            return "skip"
        if not dry:
            lead = frappe.get_doc({"doctype": "Lead", "lead_name": (name or email)[:140], "email_id": email[:240], "status": "Open"})
            lead.insert(ignore_permissions=True)
        return None
    if target == "bookings":
        email = _cell(row, mapping, "email")
        event = _cell(row, mapping, "name") or "Imported job"
        date = _cell(row, mapping, "date") or nowdate()
        if email:
            existing = frappe.db.get_value(
                "Event Booking",
                {"event_name": event, "event_date": date},
                "name",
            )
            if existing:
                cust = frappe.db.get_value("Event Booking", existing, "customer")
                cust_email = frappe.db.get_value("Customer", cust, "email_id") if cust else ""
                if (cust_email or "").lower() == email.lower():
                    return "skip"
        if not dry:
            customer = _ensure_customer(_cell(row, mapping, "client") or event, email, _cell(row, mapping, "phone"))
            if not customer:
                return "Client is required."
            doc = frappe.get_doc(
                {
                    "doctype": "Event Booking",
                    "event_name": event[:140],
                    "customer": customer,
                    "event_date": date,
                    "start_time": _cell(row, mapping, "start") or "18:00:00",
                    "end_time": _cell(row, mapping, "end") or "22:00:00",
                    "venue_address": _cell(row, mapping, "address"),
                    "status": "inquiry",
                    "source": "import",
                    "timezone": "America/New_York",
                }
            )
            doc.insert(ignore_permissions=True)
        return None
    if target == "packages":
        name = _cell(row, mapping, "name")
        if not name:
            return "Name is required."
        if frappe.db.exists("Item", {"item_name": name}):
            return "skip"
        if not dry:
            from entertainment_express.api.portal_crud import _save_package

            _save_package(None, {"item_name": name, "rate": flt(_cell(row, mapping, "rate") or 0), "unit": "event"})
        return None
    if target == "gear":
        name = _cell(row, mapping, "name")
        if not name:
            return "Name is required."
        if frappe.db.exists("Service Asset", {"asset_name": name}):
            return "skip"
        if not dry:
            frappe.get_doc(
                {
                    "doctype": "Service Asset",
                    "asset_name": name[:140],
                    "asset_type": _cell(row, mapping, "type") or "other",
                    "status": "available",
                    "condition": "good",
                    "quantity": 1,
                }
            ).insert(ignore_permissions=True)
        return None
    if target == "venues":
        name = _cell(row, mapping, "name")
        if not name:
            return "Name is required."
        if frappe.db.exists("EE Venue", {"venue_name": name}):
            return "skip"
        if not dry:
            frappe.get_doc(
                {
                    "doctype": "EE Venue",
                    "venue_name": name[:140],
                    "address": _cell(row, mapping, "address"),
                    "load_in_notes": _cell(row, mapping, "load_in"),
                    "coi_required": 1 if _cell(row, mapping, "coi") in ("1", "yes", "true", "Y") else 0,
                }
            ).insert(ignore_permissions=True)
        return None
    if target == "vendors":
        name = _cell(row, mapping, "name")
        if not name:
            return "Name is required."
        if frappe.db.exists("EE Vendor", {"vendor_name": name}):
            return "skip"
        if not dry:
            frappe.get_doc(
                {
                    "doctype": "EE Vendor",
                    "vendor_name": name[:140],
                    "category": _cell(row, mapping, "category") or "Partner",
                }
            ).insert(ignore_permissions=True)
        return None
    if target == "songs":
        title = _cell(row, mapping, "title")
        artist = _cell(row, mapping, "artist") or "Unknown"
        if not title:
            return "Title is required."
        if frappe.db.exists("Song", {"title": title, "artist": artist}):
            return "skip"
        if not dry:
            frappe.get_doc({"doctype": "Song", "title": title[:140], "artist": artist[:140], "in_library": 1}).insert(ignore_permissions=True)
        return None
    return "Unknown list."


def run_import(job_name: str) -> dict:
    job = frappe.get_doc("EE Import Job", job_name)
    job.status = "running"
    job.save(ignore_permissions=True)
    mapping = _parse_mapping(job.mapping)
    rows = _read_rows(job.source_csv or "")
    job.rows_total = len(rows)
    ok = 0
    failed = 0
    skipped = 0
    job.set("errors", [])
    dry = cint(job.dry_run)
    for idx, row in enumerate(rows, start=2):
        try:
            reason = _import_row(job.target, row, mapping, bool(dry))
        except Exception as exc:
            reason = str(exc)
        if reason == "skip":
            skipped += 1
            continue
        if reason:
            failed += 1
            job.append("errors", {"row_number": idx, "message": reason[:500]})
            continue
        ok += 1
    job.rows_ok = ok
    job.rows_failed = failed
    job.status = "completed"
    job.save(ignore_permissions=True)
    return _job_payload(job, skipped=skipped)


def _job_payload(job, skipped: int = 0) -> dict:
    total = cint(job.rows_total)
    ok = cint(job.rows_ok)
    failed = cint(job.rows_failed)
    if not skipped:
        skipped = max(0, total - ok - failed)
    return {
        "id": job.name,
        "target": job.target,
        "status": job.status,
        "dry_run": bool(cint(job.dry_run)),
        "rows_total": total,
        "rows_ok": ok,
        "rows_failed": failed,
        "skipped": skipped,
        "errors": [{"row": e.row_number, "message": e.message} for e in (job.get("errors") or [])][:50],
    }


@frappe.whitelist()
def list_presets() -> dict:
    _require()
    return load_json_presets() or PRESETS


@frappe.whitelist()
def preview_headers(csv_text: str) -> list[str]:
    _require()
    rows = _read_rows(csv_text or "")
    if not rows:
        return []
    return [str(k) for k in rows[0].keys()]


@frappe.whitelist()
def start_import(target: str, csv_text: str, mapping: dict | str | None = None, dry_run: int = 1) -> dict:
    _require()
    if target not in TARGETS:
        frappe.throw("Pick what you are moving in.")
    if isinstance(mapping, str):
        mapping = frappe.parse_json(mapping) or {}
    job = frappe.get_doc(
        {
            "doctype": "EE Import Job",
            "target": target,
            "source_type": "csv",
            "status": "pending",
            "dry_run": 1 if cint(dry_run) else 0,
            "mapping": json.dumps(mapping or {}),
            "source_csv": csv_text or "",
        }
    )
    job.insert(ignore_permissions=True)
    if cint(dry_run):
        return run_import(job.name)
    try:
        frappe.enqueue("entertainment_express.api.migration.run_import", job_name=job.name, queue="long")
        return _job_payload(job)
    except Exception:
        return run_import(job.name)


@frappe.whitelist()
def get_job(name: str) -> dict:
    _require()
    return _job_payload(frappe.get_doc("EE Import Job", name))


@frappe.whitelist()
def export_csv(target: str) -> dict:
    _require()
    if target not in TARGETS:
        frappe.throw("Pick what you are moving out.")
    buf = io.StringIO()
    if target == "customers":
        rows = frappe.get_all("Customer", fields=["customer_name", "email_id", "mobile_no"], limit_page_length=2000)
        writer = csv.DictWriter(buf, fieldnames=["name", "email", "phone"])
        writer.writeheader()
        for row in rows:
            writer.writerow({"name": row.customer_name or "", "email": row.email_id or "", "phone": row.mobile_no or ""})
    elif target == "leads":
        rows = frappe.get_all("Lead", fields=["lead_name", "email_id", "mobile_no"], limit_page_length=2000)
        writer = csv.DictWriter(buf, fieldnames=["name", "email", "phone"])
        writer.writeheader()
        for row in rows:
            writer.writerow({"name": row.lead_name or "", "email": row.email_id or "", "phone": row.mobile_no or ""})
    elif target == "bookings":
        rows = frappe.get_all("Event Booking", fields=["event_name", "event_date", "venue_address", "customer"], limit_page_length=2000)
        writer = csv.DictWriter(buf, fieldnames=["name", "date", "address", "email"])
        writer.writeheader()
        for row in rows:
            email = frappe.db.get_value("Customer", row.customer, "email_id") if row.customer else ""
            writer.writerow({"name": row.event_name or "", "date": str(row.event_date or ""), "address": row.venue_address or "", "email": email or ""})
    elif target == "packages":
        rows = frappe.get_all("Item", fields=["item_name", "standard_rate"], filters={"is_sales_item": 1}, limit_page_length=2000)
        writer = csv.DictWriter(buf, fieldnames=["name", "rate"])
        writer.writeheader()
        for row in rows:
            writer.writerow({"name": row.item_name or "", "rate": str(flt(row.standard_rate))})
    elif target == "gear":
        rows = frappe.get_all("Service Asset", fields=["asset_name", "asset_type"], limit_page_length=2000)
        writer = csv.DictWriter(buf, fieldnames=["name", "type"])
        writer.writeheader()
        for row in rows:
            writer.writerow({"name": row.asset_name or "", "type": row.asset_type or ""})
    elif target == "venues":
        rows = frappe.get_all("EE Venue", fields=["venue_name", "address"], limit_page_length=2000) if frappe.db.table_exists("EE Venue") else []
        writer = csv.DictWriter(buf, fieldnames=["name", "address"])
        writer.writeheader()
        for row in rows:
            writer.writerow({"name": row.venue_name or "", "address": row.address or ""})
    elif target == "vendors":
        rows = frappe.get_all("EE Vendor", fields=["vendor_name", "category"], limit_page_length=2000) if frappe.db.table_exists("EE Vendor") else []
        writer = csv.DictWriter(buf, fieldnames=["name", "category"])
        writer.writeheader()
        for row in rows:
            writer.writerow({"name": row.vendor_name or "", "category": row.category or ""})
    else:
        rows = frappe.get_all("Song", fields=["title", "artist"], limit_page_length=2000) if frappe.db.table_exists("Song") else []
        writer = csv.DictWriter(buf, fieldnames=["title", "artist"])
        writer.writeheader()
        for row in rows:
            writer.writerow({"title": row.title or "", "artist": row.artist or ""})
    text = buf.getvalue()
    job = frappe.get_doc({"doctype": "EE Export Job", "target": target, "status": "completed", "csv_text": text})
    job.insert(ignore_permissions=True)
    return {"id": job.name, "filename": f"{target}.csv", "content": text}


@frappe.whitelist()
def onboarding() -> dict:
    _require()
    brand = ""
    try:
        brand = frappe.db.get_single_value("EE Portal Settings", "brand_name") or ""
    except Exception:
        brand = ""
    payments = False
    try:
        from entertainment_express.billing_payments.processors import get_processor

        get_processor("stripe")
        payments = True
    except Exception:
        payments = False
    packages = cint(frappe.db.count("Item", {"is_sales_item": 1}) if frappe.db.table_exists("Item") else 0)
    jobs = cint(frappe.db.count("Event Booking") if frappe.db.table_exists("Event Booking") else 0)
    imported = False
    if frappe.db.table_exists("EE Import Job"):
        imported = bool(frappe.db.exists("EE Import Job", {"status": "completed", "dry_run": 0}))
    steps = [
        {"key": "brand", "label": "Set your public name", "done": bool(brand), "href": "/brand"},
        {"key": "catalog", "label": "Add what you sell", "done": packages > 0, "href": "/catalog"},
        {"key": "payments", "label": "Connect card payments", "done": payments, "href": "/money"},
        {"key": "import", "label": "Move in a customer list", "done": imported or jobs > 0, "href": "/move"},
        {"key": "job", "label": "Add your first job", "done": jobs > 0, "href": "/calendar/new"},
    ]
    return {"steps": steps, "complete": all(s["done"] for s in steps)}
