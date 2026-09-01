"""Owner/client proposal loop over existing quotes, contracts, and deposits.

No DocType names in payloads. Guests never reach this module's payer methods.
"""

from __future__ import annotations

from datetime import datetime, time

import frappe
from frappe.utils import add_days, flt, fmt_money, nowdate

from entertainment_express.api.portal_crud import _ensure_customer, _get_inquiry, _get_job
from entertainment_express.api.portal_owner import OWNER_ROLES, _require_owner

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"

WORKFLOW_STEPS = [
    {"key": "proposal", "label": "Send a proposal"},
    {"key": "contract", "label": "Get it signed"},
    {"key": "deposit", "label": "Collect the deposit"},
    {"key": "planning", "label": "Collect event details"},
    {"key": "crew", "label": "Assign a crew"},
]


def _money(amount) -> str:
    return fmt_money(flt(amount), currency=frappe.db.get_default("currency") or "USD")


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if not roles.intersection(OWNER_ROLES | {"EE Sales", "System Manager"}):
        frappe.throw("Proposal access denied.", frappe.PermissionError)


def _require_not_guest() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Only the host can do this.", frappe.PermissionError)


def _company() -> str:
    return frappe.db.get_single_value("Global Defaults", "default_company") or frappe.db.get_value("Company", {}, "name")


@frappe.whitelist()
def catalog_choices() -> list[dict]:
    _require_staff()
    rows = []
    if frappe.db.table_exists("Service Package"):
        for pkg in frappe.get_all(
            "Service Package",
            filters={"active": 1} if frappe.get_meta("Service Package").has_field("active") else {},
            fields=["name", "package_name", "package_price", "description"],
            limit_page_length=200,
        ):
            rows.append(
                {
                    "id": pkg.name,
                    "kind": "package",
                    "name": pkg.package_name or pkg.name,
                    "rate": _money(pkg.package_price),
                    "rate_raw": flt(pkg.package_price),
                    "description": pkg.description or "",
                }
            )
    filters: dict = {"disabled": 0}
    if frappe.get_meta("Item").has_field("ee_item_type"):
        filters["ee_item_type"] = ["in", ["service", "package", "addon", "rental"]]
    for item in frappe.get_all(
        "Item",
        filters=filters,
        fields=["name", "item_name", "standard_rate", "description"],
        order_by="item_name asc",
        limit_page_length=200,
    ):
        rows.append(
            {
                "id": item.name,
                "kind": "item",
                "name": item.item_name or item.name,
                "rate": _money(item.standard_rate),
                "rate_raw": flt(item.standard_rate),
                "description": item.description or "",
            }
        )
    return rows


def _quote_for(source: str, name: str):
    if source == "job":
        booking = frappe.get_doc("Event Booking", name)
        if booking.quotation and frappe.db.exists("Quotation", booking.quotation):
            return frappe.get_doc("Quotation", booking.quotation)
        existing = frappe.db.get_value("Quotation", {"ee_booking": name}, "name") if frappe.get_meta("Quotation").has_field("ee_booking") else None
        if existing:
            return frappe.get_doc("Quotation", existing)
        return None
    lead = frappe.get_doc("Lead", name)
    if frappe.get_meta("Quotation").has_field("ee_lead"):
        qname = frappe.db.get_value("Quotation", {"ee_lead": name}, "name")
        if qname:
            return frappe.get_doc("Quotation", qname)
    email = lead.email_id
    customer = frappe.db.get_value("Customer", {"email_id": email}, "name") if email else None
    if customer:
        qname = frappe.db.get_value("Quotation", {"party_name": customer, "docstatus": 0}, "name")
        if qname:
            return frappe.get_doc("Quotation", qname)
    return None


def _proposal_status(quote) -> str:
    if not quote:
        return "Draft"
    contract = frappe.db.get_value("EE Contract", {"quotation": quote.name}, ["name", "status"], as_dict=True)
    booking = None
    if frappe.get_meta("Quotation").has_field("ee_booking"):
        booking = quote.get("ee_booking")
    if not booking:
        booking = frappe.db.get_value("Event Booking", {"quotation": quote.name}, "name")
    deposit = None
    if booking:
        deposit = frappe.db.get_value("Event Booking", booking, "deposit_status")
    if deposit == "paid":
        return "Deposit paid"
    if contract and contract.status == "signed":
        return "Signed"
    if quote.docstatus == 1 or (quote.status or "") in ("Open", "Ordered"):
        return "Sent"
    if contract and contract.status in ("sent", "viewed"):
        return "Sent"
    return "Draft"


def _lines_from_quote(quote) -> list[dict]:
    if not quote:
        return []
    out = []
    for row in quote.items or []:
        out.append(
            {
                "id": row.item_code,
                "kind": "item",
                "name": row.item_name or row.item_code,
                "qty": flt(row.qty or 1),
                "rate": _money(row.rate),
                "amount": _money(row.amount),
            }
        )
    return out


@frappe.whitelist()
def get_proposal(source: str, name: str) -> dict:
    _require_staff()
    if source not in {"inquiry", "job"}:
        frappe.throw("Unknown proposal source.")
    quote = _quote_for(source, name)
    context = _get_inquiry(name) if source == "inquiry" else _get_job(name)
    total = flt(quote.grand_total) if quote else 0
    deposit_pct = flt(quote.get("ee_deposit_percent") or 25) if quote else 25
    return {
        "source": source,
        "name": name,
        "title": "Proposal",
        "party": context.get("contact_name") or context.get("customer_name") or context.get("event_name") or name,
        "status": _proposal_status(quote),
        "lines": _lines_from_quote(quote),
        "total": _money(total),
        "deposit": _money(total * deposit_pct / 100),
        "deposit_percent": deposit_pct,
        "catalog": catalog_choices(),
        "can_send": True,
        "checklist": job_checklist(name) if source == "job" else [],
        "conflicts": quote_conflicts(name) if source == "job" else [],
    }


def _explode_package(package_name: str) -> list[dict]:
    pkg = frappe.get_doc("Service Package", package_name)
    lines = []
    for row in getattr(pkg, "items", None) or []:
        code = getattr(row, "item", None)
        if not code:
            continue
        qty = flt(row.qty or 1)
        rate = flt(getattr(row, "unit_price", None) or frappe.db.get_value("Item", code, "standard_rate") or 0)
        lines.append({"item_code": code, "qty": qty, "rate": rate})
    if not lines:
        frappe.throw("This package isn't set up yet.")
    return lines


def _item_lines(selected: list) -> list[dict]:
    lines = []
    for row in selected or []:
        kind = row.get("kind") or "item"
        qty = flt(row.get("qty") or 1) or 1
        ident = row.get("id")
        if not ident:
            continue
        if kind == "package":
            lines.extend(_explode_package(ident))
        else:
            rate = flt(row.get("rate_raw"))
            if not rate:
                rate = flt(frappe.db.get_value("Item", ident, "standard_rate") or 0)
            lines.append({"item_code": ident, "qty": qty, "rate": rate})
    if not lines:
        frappe.throw("Pick at least one package or add-on.")
    return lines


def _upsert_quote(customer: str, lines: list[dict], deposit_percent: float, extras: dict):
    quote = extras.get("quote")
    if not quote:
        quote = frappe.get_doc(
            {
                "doctype": "Quotation",
                "quotation_to": "Customer",
                "party_name": customer,
                "order_type": "Sales",
                "company": _company(),
                "transaction_date": nowdate(),
                "valid_till": add_days(nowdate(), 14),
            }
        )
        if quote.meta.has_field("naming_series") and not quote.naming_series:
            options = [o for o in (quote.meta.get_field("naming_series").options or "").split("\n") if o.strip()]
            if options:
                quote.naming_series = options[0]
    quote.set("items", [])
    for line in lines:
        quote.append("items", {"item_code": line["item_code"], "qty": line["qty"], "rate": line["rate"]})
    if quote.meta.has_field("ee_deposit_percent"):
        quote.ee_deposit_percent = flt(deposit_percent or 25)
    if quote.meta.has_field("ee_event_date") and extras.get("event_date"):
        quote.ee_event_date = extras["event_date"]
    if quote.meta.has_field("ee_venue_address") and extras.get("venue"):
        quote.ee_venue_address = extras["venue"]
    if quote.meta.has_field("ee_lead") and extras.get("lead"):
        quote.ee_lead = extras["lead"]
    if quote.meta.has_field("ee_booking") and extras.get("booking"):
        quote.ee_booking = extras["booking"]
    if quote.name:
        quote.save(ignore_permissions=True)
    else:
        quote.insert(ignore_permissions=True)
    try:
        quote.run_method("calculate_taxes_and_totals")
        quote.save(ignore_permissions=True)
    except Exception:
        pass
    return quote


@frappe.whitelist()
def save_proposal(source: str, name: str, selected: list | str | None = None, deposit_percent: float = 25) -> dict:
    _require_staff()
    if isinstance(selected, str):
        selected = frappe.parse_json(selected) or []
    lines = _item_lines(selected or [])
    extras = {"quote": _quote_for(source, name)}
    if source == "inquiry":
        lead = frappe.get_doc("Lead", name)
        customer = _ensure_customer(lead.lead_name or lead.first_name or name)
        if lead.email_id and frappe.get_meta("Customer").has_field("email_id"):
            cust = frappe.get_doc("Customer", customer)
            if not cust.email_id:
                cust.email_id = lead.email_id
                cust.save(ignore_permissions=True)
        extras["lead"] = name
        quote = _upsert_quote(customer, lines, deposit_percent, extras)
    else:
        booking = frappe.get_doc("Event Booking", name)
        extras["booking"] = name
        extras["event_date"] = booking.event_date
        extras["venue"] = booking.venue_address
        quote = _upsert_quote(booking.customer, lines, deposit_percent, extras)
        booking.quotation = quote.name
        booking.status = "quoted"
        booking.save(ignore_permissions=True)
    return get_proposal(source, name)


@frappe.whitelist()
def send_proposal(source: str, name: str) -> dict:
    _require_staff()
    quote = _quote_for(source, name)
    if not quote or not quote.items:
        frappe.throw("Save the proposal with at least one package first.")
    from entertainment_express.api.quote import send_quote
    from entertainment_express.api.contract import create_contract, send_contract

    try:
        send_quote(quote.name)
    except Exception:
        frappe.logger().error("proposal quote send failed")
        if quote.docstatus == 0:
            quote.db_set("status", "Open")
    contract_name = frappe.db.get_value("EE Contract", {"quotation": quote.name}, "name")
    if not contract_name:
        try:
            created = create_contract(quote.name)
            contract_name = created.get("name")
        except Exception:
            frappe.throw("Could not prepare the contract. Add a contract template first.")
    try:
        send_contract(contract_name)
    except Exception:
        frappe.logger().error("proposal contract send failed")
    if source == "inquiry":
        lead = frappe.get_doc("Lead", name)
        if lead.status in ("Open", "Replied", "Lead"):
            lead.status = "Opportunity"
            lead.save(ignore_permissions=True)
    elif source == "job":
        frappe.db.set_value("Event Booking", name, "status", "quoted")
        if contract_name:
            frappe.db.set_value("Event Booking", name, "contract", contract_name)
    return get_proposal(source, name)


@frappe.whitelist()
def client_proposal(booking: str | None = None) -> dict:
    _require_not_guest()
    from entertainment_express.api.portal_client import _customer_name, _require_payer

    _require_payer()
    customer = _customer_name()
    quote = None
    if booking:
        qname = frappe.db.get_value("Event Booking", booking, "quotation")
        if qname:
            quote = frappe.get_doc("Quotation", qname)
    if not quote and customer:
        qname = frappe.db.get_value("Quotation", {"party_name": customer}, "name", order_by="modified desc")
        if qname:
            quote = frappe.get_doc("Quotation", qname)
    if not quote:
        return {"status": "none", "lines": [], "total": _money(0), "deposit": _money(0)}
    total = flt(quote.grand_total)
    pct = flt(quote.get("ee_deposit_percent") or 25)
    return {
        "status": _proposal_status(quote),
        "lines": _lines_from_quote(quote),
        "total": _money(total),
        "deposit": _money(total * pct / 100),
        "can_pay": _proposal_status(quote) in ("Signed", "Deposit paid", "Sent"),
    }


def _crew_assigned(booking: str) -> bool:
    if frappe.db.table_exists("Crew Assignment"):
        return bool(frappe.db.count("Crew Assignment", {"booking": booking}))
    doc = frappe.get_doc("Event Booking", booking)
    return bool(doc.assigned_assets)


@frappe.whitelist()
def job_checklist(name: str) -> list[dict]:
    _require_staff()
    if not frappe.db.exists("Event Booking", name):
        return []
    booking = frappe.get_doc("Event Booking", name)
    quote = _quote_for("job", name)
    contract_status = None
    if booking.contract:
        contract_status = frappe.db.get_value("EE Contract", booking.contract, "status")
    elif quote:
        contract_status = frappe.db.get_value("EE Contract", {"quotation": quote.name}, "status")
    planning_done = False
    if frappe.db.table_exists("Planning Form Instance"):
        row = frappe.db.get_value(
            "Planning Form Instance",
            {"booking": name},
            ["status", "completion_percent"],
            as_dict=True,
        )
        if row:
            planning_done = row.get("status") == "complete" or flt(row.get("completion_percent")) >= 100
    done = {
        "proposal": bool(quote and (quote.items or quote.docstatus)),
        "contract": contract_status == "signed",
        "deposit": (booking.deposit_status or "") == "paid",
        "planning": planning_done,
        "crew": _crew_assigned(name),
    }
    flags = {}
    try:
        settings = frappe.get_cached_doc("EE Portal Settings", "EE Portal Settings")
        raw = getattr(settings, "feature_flags", None) or "{}"
        parsed = frappe.parse_json(raw) if isinstance(raw, str) else (raw or {})
        checklists = (parsed or {}).get("checklists") or {}
        keys = checklists.get(booking.event_type) or checklists.get("default")
        if keys:
            flags = {k: True for k in keys}
    except Exception:
        flags = {}
    steps = []
    for step in WORKFLOW_STEPS:
        if flags and step["key"] not in flags:
            continue
        steps.append({**step, "done": bool(done.get(step["key"]))})
    return steps


@frappe.whitelist()
def quote_conflicts(booking: str) -> list[dict]:
    _require_staff()
    if not frappe.db.exists("Event Booking", booking):
        return []
    if not frappe.db.table_exists("EE Event Plan Item"):
        return []
    billed = set()
    doc = frappe.get_doc("Event Booking", booking)
    for row in doc.service_items or []:
        if row.item:
            billed.add(row.item)
    quote = _quote_for("job", booking)
    if quote:
        for row in quote.items or []:
            billed.add(row.item_code)
    conflicts = []
    for item in frappe.get_all(
        "EE Event Plan Item",
        filters={"booking": booking, "status": "approved"},
        fields=["name", "title", "item"],
    ):
        if item.item and item.item not in billed:
            conflicts.append(
                {
                    "id": item.name,
                    "title": item.title or item.item,
                    "message": "Approved but not on the proposal yet",
                }
            )
    return conflicts


@frappe.whitelist()
def today_workflows() -> list[dict]:
    _require_staff()
    rows = []
    for job in frappe.get_all(
        "Event Booking",
        filters={"status": ["in", ["inquiry", "quoted", "tentative", "confirmed"]]},
        fields=["name", "event_name", "event_date", "status"],
        order_by="event_date asc",
        limit_page_length=8,
    ):
        steps = job_checklist(job.name)
        open_steps = [s for s in steps if not s["done"]]
        rows.append(
            {
                "id": job.name,
                "event_name": job.event_name,
                "event_date": str(job.event_date or ""),
                "next": open_steps[0]["label"] if open_steps else "You're clear",
                "open_count": len(open_steps),
                "conflicts": quote_conflicts(job.name),
            }
        )
    return rows
