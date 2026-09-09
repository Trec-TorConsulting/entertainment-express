"""Subcontractor jobs, partner directory, offer & acceptance workflow, margin tracking."""

from __future__ import annotations

import uuid
import frappe
from frappe.utils import cint, flt, fmt_money, now_datetime

STAFF_ROLES = {"EE Tenant Admin", "EE Dispatcher", "System Manager"}


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if not roles.intersection(STAFF_ROLES):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _money(amount: float | int | str | None) -> str:
    currency = frappe.db.get_default("currency") or "USD"
    return fmt_money(flt(amount), currency=currency)


def _serialize_subcontractor(doc) -> dict:
    contacts = []
    for row in doc.get("contacts") or []:
        contacts.append(
            {
                "name": row.contact_name,
                "role": row.role or "",
                "phone": row.phone or "",
                "email": row.email or "",
            }
        )
    return {
        "id": doc.name,
        "name": doc.vendor_name,
        "category": doc.category or "",
        "preferred": bool(cint(doc.preferred)),
        "subcontractor": bool(cint(doc.subcontractor)),
        "rating": flt(doc.rating),
        "w9_on_file": bool(cint(doc.w9_on_file)),
        "coi_on_file": bool(cint(doc.coi_on_file)),
        "default_pay_terms": doc.default_pay_terms or "",
        "notes": doc.notes or "",
        "contacts": contacts,
    }


def _serialize_job(doc) -> dict:
    booking_title = ""
    event_date = ""
    venue_name = ""
    client_name = ""
    client_phone = ""
    client_email = ""

    if doc.booking and frappe.db and frappe.db.exists("Event Booking", doc.booking):
        b = frappe.get_doc("Event Booking", doc.booking)
        booking_title = getattr(b, "title", "") or getattr(b, "event_name", "") or doc.booking
        event_date = str(getattr(b, "event_date", "") or getattr(b, "start_date", "") or "")
        venue_name = getattr(b, "venue", "") or getattr(b, "venue_name", "") or ""
        client_name = getattr(b, "customer", "") or getattr(b, "client_name", "") or ""
        client_phone = getattr(b, "phone", "") or getattr(b, "contact_phone", "") or ""
        client_email = getattr(b, "email", "") or getattr(b, "contact_email", "") or ""

    vendor_name = ""
    if doc.vendor and frappe.db and frappe.db.exists("EE Vendor", doc.vendor):
        vendor_name = frappe.db.get_value("EE Vendor", doc.vendor, "vendor_name") or doc.vendor

    agreed_cost = flt(getattr(doc, "agreed_cost", 0))
    client_price = flt(getattr(doc, "client_price", 0))
    expected_margin = flt(getattr(doc, "expected_margin", 0))
    margin_percent = flt(getattr(doc, "margin_percent", 0))

    return {
        "id": getattr(doc, "name", ""),
        "booking": getattr(doc, "booking", ""),
        "booking_title": booking_title,
        "event_date": event_date,
        "venue_name": venue_name,
        "client_name": client_name,
        "client_phone": client_phone,
        "client_email": client_email,
        "vendor": getattr(doc, "vendor", ""),
        "vendor_name": vendor_name,
        "status": getattr(doc, "status", "") or "draft",
        "scope_type": getattr(doc, "scope_type", "") or "full_booking",
        "agreed_cost": agreed_cost,
        "agreed_cost_formatted": _money(agreed_cost),
        "client_price": client_price,
        "client_price_formatted": _money(client_price),
        "expected_margin": expected_margin,
        "expected_margin_formatted": _money(expected_margin),
        "margin_percent": margin_percent,
        "pay_terms": getattr(doc, "pay_terms", "") or "",
        "white_label": bool(cint(getattr(doc, "white_label", 1))),
        "special_instructions": getattr(doc, "special_instructions", "") or "",
        "offer_token": getattr(doc, "offer_token", "") or "",
        "offer_sent_at": str(getattr(doc, "offer_sent_at", "") or ""),
        "response_at": str(getattr(doc, "response_at", "") or ""),
        "decline_reason": getattr(doc, "decline_reason", "") or "",
        "purchase_invoice": getattr(doc, "purchase_invoice", "") or "",
        "creation": str(getattr(doc, "creation", "") or ""),
        "modified": str(getattr(doc, "modified", "") or ""),
    }


@frappe.whitelist()
def list_subcontractors() -> list[dict]:
    """Returns active subcontractor partner companies, rating, and COI/W-9 status."""
    _require_staff()
    if not frappe.db.table_exists("EE Vendor"):
        return []
    
    vendors = frappe.get_all(
        "EE Vendor",
        filters={"subcontractor": 1},
        fields=["name"],
        order_by="vendor_name asc",
        limit_page_length=200,
    )
    return [_serialize_subcontractor(frappe.get_doc("EE Vendor", row.name)) for row in vendors]


@frappe.whitelist()
def list_subcontract_jobs(status: str | None = None, vendor: str | None = None, booking: str | None = None) -> list[dict]:
    """Supporting status, vendor, and booking filters with backend-formatted money values."""
    _require_staff()
    if not frappe.db.table_exists("EE Subcontract Job"):
        return []

    filters = {}
    if status:
        filters["status"] = status
    if vendor:
        filters["vendor"] = vendor
    if booking:
        filters["booking"] = booking

    jobs = frappe.get_all(
        "EE Subcontract Job",
        filters=filters,
        fields=["name"],
        order_by="modified desc",
        limit_page_length=300,
    )
    return [_serialize_job(frappe.get_doc("EE Subcontract Job", row.name)) for row in jobs]


@frappe.whitelist()
def create_subcontract_job(values: dict | str | None = None) -> dict:
    """Compliance check (warning if COI expired/missing), auto-populates client price from booking and calculates margin."""
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = dict(values or {})

    booking_id = values.get("booking")
    vendor_id = values.get("vendor")

    if not booking_id:
        frappe.throw("Booking is required.", frappe.ValidationError)
    if not vendor_id:
        frappe.throw("Vendor is required.", frappe.ValidationError)

    # Compliance check on vendor
    compliance_warning = None
    if frappe.db.exists("EE Vendor", vendor_id):
        vendor_doc = frappe.get_doc("EE Vendor", vendor_id)
        vendor_name = getattr(vendor_doc, "vendor_name", vendor_id)
        if not getattr(vendor_doc, "coi_on_file", 0):
            compliance_warning = f"Notice: Vendor '{vendor_name}' does not have a Certificate of Insurance (COI) on file."
        elif not getattr(vendor_doc, "w9_on_file", 0):
            compliance_warning = f"Notice: Vendor '{vendor_name}' does not have a W-9 on file."

    # Auto-populate client price from booking if not provided
    client_price = values.get("client_price")
    if client_price is None and frappe.db.exists("Event Booking", booking_id):
        client_price = frappe.db.get_value("Event Booking", booking_id, "grand_total") or frappe.db.get_value("Event Booking", booking_id, "total_amount")

    # If pay_terms not provided, pick up vendor default pay terms
    pay_terms = values.get("pay_terms")
    if not pay_terms and frappe.db.exists("EE Vendor", vendor_id):
        pay_terms = frappe.db.get_value("EE Vendor", vendor_id, "default_pay_terms")

    client_price_flt = flt(client_price or 0)
    agreed_cost_flt = flt(values.get("agreed_cost", 0))
    expected_margin_flt = flt(client_price_flt - agreed_cost_flt, 2)
    margin_percent_flt = flt((expected_margin_flt / client_price_flt) * 100.0, 2) if client_price_flt > 0 else 0.0

    job_data = {
        "doctype": "EE Subcontract Job",
        "booking": booking_id,
        "vendor": vendor_id,
        "status": values.get("status") or "draft",
        "scope_type": values.get("scope_type") or "full_booking",
        "agreed_cost": agreed_cost_flt,
        "client_price": client_price_flt,
        "expected_margin": expected_margin_flt,
        "margin_percent": margin_percent_flt,
        "pay_terms": pay_terms or "Due on Completion",
        "white_label": 1 if values.get("white_label", True) else 0,
        "special_instructions": values.get("special_instructions") or "",
    }

    doc = frappe.get_doc(job_data)
    doc.insert()

    result = _serialize_job(doc)
    if compliance_warning:
        result["compliance_warning"] = compliance_warning
    return result


@frappe.whitelist()
def send_subcontract_offer(job_id: str) -> dict:
    """Generates a secure UUID token and dispatches offer notification to the partner company."""
    _require_staff()
    if not frappe.db.exists("EE Subcontract Job", job_id):
        frappe.throw(f"Subcontract Job {job_id} not found", frappe.DoesNotExistError)

    doc = frappe.get_doc("EE Subcontract Job", job_id)

    if not doc.offer_token:
        doc.offer_token = str(uuid.uuid4())

    doc.status = "offered"
    doc.offer_sent_at = now_datetime()
    doc.save()

    # Find recipient from vendor contacts or vendor email
    recipient_email = None
    vendor_name = doc.vendor
    if frappe.db.exists("EE Vendor", doc.vendor):
        vendor_doc = frappe.get_doc("EE Vendor", doc.vendor)
        vendor_name = vendor_doc.vendor_name
        for c in vendor_doc.get("contacts") or []:
            if c.email:
                recipient_email = c.email
                break

    # Send notification if recipient found
    if recipient_email:
        try:
            from entertainment_express.notifications import send
            send(
                template_key="shift_offered",
                recipient=recipient_email,
                context={
                    "vendor_name": vendor_name,
                    "job_id": doc.name,
                    "agreed_cost": _money(doc.agreed_cost),
                    "offer_token": doc.offer_token,
                },
                party_type="EE Vendor",
                party=doc.vendor,
                related_doctype="EE Subcontract Job",
                related_name=doc.name,
            )
        except Exception:
            pass

    return _serialize_job(doc)


@frappe.whitelist()
def complete_subcontract_job(job_id: str) -> dict:
    """Marks job completed and initiates payout tracking hooks."""
    _require_staff()
    if not frappe.db.exists("EE Subcontract Job", job_id):
        frappe.throw(f"Subcontract Job {job_id} not found", frappe.DoesNotExistError)

    doc = frappe.get_doc("EE Subcontract Job", job_id)
    doc.status = "completed"

    # ERPNext purchase invoice hook if available
    if not doc.purchase_invoice and frappe.db.table_exists("Purchase Invoice"):
        try:
            # If supplier exists for this vendor, draft Purchase Invoice
            supplier = frappe.db.get_value("Supplier", {"supplier_name": doc.vendor}) or frappe.db.get_value("Supplier", {"name": doc.vendor})
            if supplier:
                company = frappe.db.get_default("company") or frappe.db.get_single_value("Global Defaults", "default_company")
                pi = frappe.get_doc({
                    "doctype": "Purchase Invoice",
                    "supplier": supplier,
                    "company": company,
                    "bill_no": f"SUB-{doc.name}",
                    "remarks": f"Subcontract payout for job {doc.name} (Booking {doc.booking})",
                    "items": [
                        {
                            "item_name": f"Subcontractor Entertainment Service ({doc.name})",
                            "description": f"Subcontract fulfillment for booking {doc.booking}",
                            "qty": 1,
                            "rate": flt(doc.agreed_cost),
                            "amount": flt(doc.agreed_cost),
                        }
                    ]
                })
                pi.insert(ignore_permissions=True)
                doc.purchase_invoice = pi.name
        except Exception:
            pass

    doc.save()
    return _serialize_job(doc)


# -------------------------------------------------------------------------
# Guest-Safe External Offer Review & Acceptance APIs (allow_guest=True)
# -------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True)
def get_subcontract_offer(token: str) -> dict:
    """Guest-safe API returning sanitized event schedule, venue access notes, payout amount, and payment terms."""
    if not token:
        frappe.throw("Invalid token.", frappe.PermissionError)

    job_names = frappe.get_all("EE Subcontract Job", filters={"offer_token": token}, fields=["name"])
    if not job_names:
        frappe.throw("Subcontract offer not found or link has expired.", frappe.DoesNotExistError)

    doc = frappe.get_doc("EE Subcontract Job", job_names[0].name)
    white_label = bool(cint(doc.white_label))

    booking_title = ""
    event_date = ""
    venue_name = ""
    venue_address = ""
    service_items = []
    coordinator_name = ""
    coordinator_phone = ""

    if doc.booking and frappe.db and frappe.db.exists("Event Booking", doc.booking):
        b = frappe.get_doc("Event Booking", doc.booking)
        booking_title = getattr(b, "title", "") or getattr(b, "event_name", "") or "Event Engagement"
        event_date = str(getattr(b, "event_date", "") or getattr(b, "start_date", "") or "")
        venue_name = getattr(b, "venue", "") or getattr(b, "venue_name", "") or ""
        venue_address = getattr(b, "venue_address", "") or getattr(b, "address", "") or ""
        coordinator_name = getattr(b, "coordinator_name", "") or getattr(b, "planner_contact", "") or ""
        coordinator_phone = getattr(b, "coordinator_phone", "") or ""

        # Collect service line items
        for item in getattr(b, "items", []) or []:
            service_items.append({
                "item_name": getattr(item, "item_name", "") or getattr(item, "package_name", ""),
                "description": getattr(item, "description", ""),
                "qty": getattr(item, "qty", 1),
            })

    vendor_name = ""
    if doc.vendor and frappe.db and frappe.db.exists("EE Vendor", doc.vendor):
        vendor_name = frappe.db.get_value("EE Vendor", doc.vendor, "vendor_name") or doc.vendor

    company_brand = frappe.db.get_default("company") or "Entertainment Express Partner Network"

    payload = {
        "job_id": doc.name,
        "status": doc.status,
        "vendor_name": vendor_name,
        "company_name": company_brand,
        "event_title": booking_title,
        "event_date": event_date,
        "venue_name": venue_name,
        "venue_address": venue_address,
        "scope_type": doc.scope_type,
        "services": service_items,
        "agreed_cost": flt(doc.agreed_cost),
        "agreed_cost_formatted": _money(doc.agreed_cost),
        "pay_terms": doc.pay_terms,
        "special_instructions": doc.special_instructions,
        "white_label": white_label,
        "offer_sent_at": str(doc.offer_sent_at or ""),
        "response_at": str(doc.response_at or ""),
    }

    # Only include non-masked client contact details if white_label is False
    if not white_label and doc.booking and frappe.db.exists("Event Booking", doc.booking):
        b = frappe.get_doc("Event Booking", doc.booking)
        payload["client_name"] = getattr(b, "customer", "") or getattr(b, "client_name", "")
        payload["client_phone"] = getattr(b, "phone", "") or getattr(b, "contact_phone", "")
        payload["client_email"] = getattr(b, "email", "") or getattr(b, "contact_email", "")
    else:
        payload["client_name"] = "Confidential Client (White-Label)"
        payload["coordinator_name"] = coordinator_name
        payload["coordinator_phone"] = coordinator_phone

    return payload


@frappe.whitelist(allow_guest=True)
def respond_subcontract_offer(token: str, action: str, decline_reason: str | None = None) -> dict:
    """Allows partner companies to accept or decline the offer with owner notifications."""
    if not token:
        frappe.throw("Invalid token.", frappe.PermissionError)
    if action not in ("accept", "decline"):
        frappe.throw("Action must be 'accept' or 'decline'.", frappe.ValidationError)

    job_names = frappe.get_all("EE Subcontract Job", filters={"offer_token": token}, fields=["name"])
    if not job_names:
        frappe.throw("Subcontract offer not found or link has expired.", frappe.DoesNotExistError)

    doc = frappe.get_doc("EE Subcontract Job", job_names[0].name)

    if doc.status not in ("offered", "draft"):
        return {
            "status": doc.status,
            "message": f"This offer has already been marked as {doc.status}.",
            "job_id": doc.name,
        }

    now = now_datetime()
    doc.response_at = now

    if action == "accept":
        doc.status = "accepted"
        doc.decline_reason = None
    else:
        doc.status = "declined"
        doc.decline_reason = decline_reason or "Declined by subcontractor"

    doc.save(ignore_permissions=True)

    # Notify tenant admins / owners
    _notify_owner_of_subcontract_response(doc, action)

    return {
        "status": doc.status,
        "message": f"Offer successfully {doc.status}.",
        "job_id": doc.name,
        "response_at": str(now),
    }


def _notify_owner_of_subcontract_response(doc, action: str) -> None:
    """Send alert to tenant owner / admin regarding subcontractor response."""
    try:
        admins = frappe.get_all(
            "Has Role",
            filters={"role": "EE Tenant Admin", "parenttype": "User"},
            fields=["parent"],
            limit_page_length=5,
        )
        vendor_name = frappe.db.get_value("EE Vendor", doc.vendor, "vendor_name") if doc.vendor else "Subcontractor"
        subject = f"Subcontract Offer {action.capitalize()}ed by {vendor_name} ({doc.name})"
        msg = (
            f"Partner company {vendor_name} has {action}ed the subcontract offer for job {doc.name} "
            f"(Booking: {doc.booking})."
        )
        if action == "decline" and doc.decline_reason:
            msg += f"\nReason: {doc.decline_reason}"

        # Create system notification / Notification Log if doctype exists
        for admin in admins:
            user_id = admin.parent
            if frappe.db.table_exists("Notification Log"):
                frappe.get_doc({
                    "doctype": "Notification Log",
                    "subject": subject,
                    "for_user": user_id,
                    "type": "Alert",
                    "email_content": msg,
                    "document_type": "EE Subcontract Job",
                    "document_name": doc.name,
                }).insert(ignore_permissions=True)
    except Exception:
        pass
