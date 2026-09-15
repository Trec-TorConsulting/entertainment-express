"""
Schema-Driven Master Configuration Editor API for /owner portal.
Allows business owners to view, filter, and edit permitted ERPNext and custom master entities
without entering Frappe Desk (/app).
"""

import json
import frappe
from frappe.utils import cint


PERMITTED_MASTER_DOCTYPES = {
    "Terms and Conditions": {"label": "Terms & Conditions", "module": "Selling", "description": "Contract terms, liability waivers, and booking cancellation policies."},
    "Address": {"label": "Addresses", "module": "Contacts", "description": "Company, venue, and warehouse physical locations."},
    "Contact": {"label": "Contacts", "module": "Contacts", "description": "Client representatives, venue managers, and vendor coordinators."},
    "Item Tax Template": {"label": "Item Tax Categories", "module": "Accounts", "description": "Specific tax rate overrides per service or equipment category."},
    "Sales Taxes and Charges Template": {"label": "Sales Tax Rules", "module": "Accounts", "description": "State, county, and city sales tax rules applied to proposals."},
    "Cost Center": {"label": "Cost Centers", "module": "Accounts", "description": "Operational division and event project accounting cost centers."},
    "Vehicle": {"label": "Fleet Vehicles", "module": "Fleet", "description": "Van, truck, and trailer equipment fleet registry."},
    "Salary Component": {"label": "Salary Components", "module": "Payroll", "description": "Earnings, hourly rates, gig stipends, and deduction types."},
    "Holiday List": {"label": "Holiday Calendars", "module": "HR", "description": "Paid holidays, blackout dates, and off-duty calendar schedules."},
    "Notification Template": {"label": "Notification Templates", "module": "Setup", "description": "Automated transactional email, SMS, and WhatsApp notification bodies."},
    "EE Terminal Reader": {"label": "POS Card Readers", "module": "Billing Payments", "description": "Paired Stripe Terminal mobile and cloud card readers."},
    "Safety Certificate": {"label": "Safety Compliance Certificates", "module": "Equipment Fleet", "description": "Annual state inflatable inspections, ASTI tags, and fire marshal permits."}
}


def _assert_owner_access():
    """Verify that calling user has owner or system manager permissions."""
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    roles = set(frappe.get_roles(frappe.session.user))
    if not ({"EE Tenant Admin", "System Manager"} & roles):
        frappe.throw("Only business owners can access the Master Data Explorer.", frappe.PermissionError)


def _assert_permitted_doctype(doctype: str):
    if doctype not in PERMITTED_MASTER_DOCTYPES:
        frappe.throw(
            f"DocType '{doctype}' is restricted or not accessible via Master Data Explorer.",
            frappe.PermissionError
        )


@frappe.whitelist()
def get_permitted_doctypes() -> list:
    """Return all master configuration DocTypes allowed for owner administration."""
    _assert_owner_access()
    return [
        {
            "doctype": dt,
            "label": info["label"],
            "module": info["module"],
            "description": info["description"]
        }
        for dt, info in sorted(PERMITTED_MASTER_DOCTYPES.items())
    ]


@frappe.whitelist()
def get_schema_meta(doctype: str) -> dict:
    """
    Return sanitized field schema definitions for a permitted DocType.
    Renders dynamic forms in portal-kit primitives.
    """
    _assert_owner_access()
    _assert_permitted_doctype(doctype)
    
    meta = frappe.get_meta(doctype)
    ignored_fields = {
        "docstatus", "idx", "modified_by", "creation", "owner",
        "_user_tags", "_comments", "_assign", "_liked_by"
    }
    
    fields = []
    for f in meta.fields:
        if f.fieldname in ignored_fields or f.fieldtype in ("Section Break", "Column Break", "Tab Break", "HTML"):
            continue
            
        fields.append({
            "fieldname": f.fieldname,
            "label": f.label or f.fieldname.replace("_", " ").title(),
            "fieldtype": f.fieldtype,
            "reqd": cint(f.reqd),
            "options": f.options or "",
            "default": f.default or "",
            "read_only": cint(f.read_only),
            "in_list_view": cint(f.in_list_view),
            "description": f.description or ""
        })
        
    return {
        "doctype": doctype,
        "title_field": meta.title_field or "name",
        "search_fields": meta.search_fields or "name",
        "fields": fields
    }


@frappe.whitelist()
def get_doc_list(
    doctype: str,
    filters: str = None,
    search: str = None,
    limit: int = 20,
    start: int = 0,
    order_by: str = "modified desc"
) -> dict:
    """Paginated search & list view for master records."""
    _assert_owner_access()
    _assert_permitted_doctype(doctype)
    
    parsed_filters = json.loads(filters) if filters and isinstance(filters, str) else (filters or {})
    
    meta = frappe.get_meta(doctype)
    list_fields = ["name", "modified"]
    for f in meta.fields:
        if f.in_list_view and f.fieldname not in list_fields:
            list_fields.append(f.fieldname)
            
    if search:
        search_field = meta.title_field or "name"
        parsed_filters[search_field] = ["like", f"%{search}%"]
        
    records = frappe.get_all(
        doctype,
        filters=parsed_filters,
        fields=list_fields,
        limit_start=cint(start),
        limit_page_length=cint(limit),
        order_by=order_by
    )
    
    total = frappe.db.count(doctype, filters=parsed_filters)
    
    return {
        "doctype": doctype,
        "records": records,
        "total": total,
        "limit": cint(limit),
        "start": cint(start)
    }


@frappe.whitelist()
def get_doc_detail(doctype: str, name: str) -> dict:
    """Fetch complete document detail including child tables."""
    _assert_owner_access()
    _assert_permitted_doctype(doctype)
    
    if not frappe.db.exists(doctype, name):
        frappe.throw(f"Record {name} not found in {doctype}.", frappe.DoesNotExistError)
        
    doc = frappe.get_doc(doctype, name)
    return doc.as_dict()


@frappe.whitelist()
def save_doc(doctype: str, doc_data: str) -> dict:
    """Create or update a record in a permitted DocType with server-side validation."""
    _assert_owner_access()
    _assert_permitted_doctype(doctype)
    
    payload = json.loads(doc_data) if isinstance(doc_data, str) else doc_data
    doc_name = payload.get("name")
    
    if doc_name and frappe.db.exists(doctype, doc_name):
        doc = frappe.get_doc(doctype, doc_name)
        doc.update(payload)
    else:
        payload["doctype"] = doctype
        doc = frappe.get_doc(payload)
        
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    
    return {
        "status": "success",
        "name": doc.name,
        "message": f"{doctype} record saved successfully."
    }


@frappe.whitelist()
def delete_doc(doctype: str, name: str) -> dict:
    """Delete a record from a permitted DocType."""
    _assert_owner_access()
    _assert_permitted_doctype(doctype)
    
    if not frappe.db.exists(doctype, name):
        frappe.throw(f"Record {name} not found in {doctype}.", frappe.DoesNotExistError)
        
    frappe.delete_doc(doctype, name, ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success", "message": f"{doctype} {name} deleted."}
