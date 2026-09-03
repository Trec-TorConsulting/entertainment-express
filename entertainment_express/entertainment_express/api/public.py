"""
Public API — guest-callable endpoints for the booking portal.
All endpoints are allow_guest=True and do minimal-trust input handling.
"""

import frappe


@frappe.whitelist(allow_guest=True)
def submit_lead(
    company_name: str,
    contact_name: str,
    email: str,
    phone: str = "",
    event_type: str = "",
    event_date: str = "",
    venue_address: str = "",
    service_interest: str = "",
    message: str = "",
) -> dict:
    """
    Create an ERPNext Lead from the public quote-request form.
    Notifies the assigned Sales user.
    Input is validated at the boundary — no raw SQL, no eval, no shell.
    """
    # Basic input validation
    if not email or "@" not in email:
        frappe.throw("A valid email is required.", frappe.ValidationError)
    if not contact_name or len(contact_name) > 140:
        frappe.throw("Contact name is required (max 140 chars).", frappe.ValidationError)

    # ERPNext v15 Lead.notes is a child table, not a text field — store the
    # quote-request details as a Comment so insert does not TypeError.
    details = (
        f"Event Type: {event_type}\n"
        f"Event Date: {event_date}\n"
        f"Venue: {venue_address}\n"
        f"Service Interest: {service_interest}\n"
        f"Message: {message[:2000]}"
    )[:3000]

    lead = frappe.get_doc({
        "doctype": "Lead",
        "lead_name": contact_name[:140],
        "company_name": company_name[:140] if company_name else "",
        "email_id": email[:240],
        "mobile_no": phone[:20] if phone else "",
        "source": "Campaign",  # ERPNext built-in source field
        "status": "Open",
    })
    lead.insert(ignore_permissions=True)
    lead.add_comment("Comment", text=details)
    frappe.db.commit()

    # Notify assigned Sales user (if any) — async
    _notify_lead_assigned(lead.name)

    return {"status": "received", "lead": lead.name}


@frappe.whitelist(allow_guest=True)
def submit_signup(
    company_name: str,
    requested_slug: str,
    contact_email: str,
    plan_code: str = "starter",
) -> dict:
    """
    Submit a new tenant signup application.
    Control-plane endpoint — only valid on admin.{base_domain}.
    """
    if not contact_email or "@" not in contact_email:
        frappe.throw("Valid email required.")

    from entertainment_express.control_plane.provisioner import validate_slug

    validate_slug(requested_slug[:50].lower().strip())

    plan = frappe.db.get_value("Plan", {"plan_code": plan_code, "status": "Active"}, "name")
    if not plan:
        plan = frappe.db.get_value("Plan", {"status": "Active"}, "name")

    app = frappe.get_doc({
        "doctype": "Signup Application",
        "company_name": company_name[:200],
        "requested_slug": requested_slug[:50].lower().strip(),
        "contact_email": contact_email[:240],
        "plan": plan,
        "status": "new",
    })
    app.insert(ignore_permissions=True)
    frappe.db.commit()

    from entertainment_express.api.signup_onboarding import signup_handoff

    handoff = signup_handoff(app.name, app.requested_slug.lower().strip())
    return {
        "status": "submitted",
        "application": app.name,
        **handoff,
    }


@frappe.whitelist()
def approve_signup(application_name: str) -> dict:
    """
    Approve a Signup Application and trigger provisioning.
    Only callable by SaaS Operator or System Manager.
    """
    if not any(r in frappe.get_roles(frappe.session.user)
               for r in ("SaaS Operator", "System Manager")):
        frappe.throw("Insufficient permissions.", frappe.PermissionError)

    app = frappe.get_doc("Signup Application", application_name)
    if app.status != "new":
        frappe.throw(f"Application is already {app.status}.")

    from entertainment_express.api.signup_onboarding import approve_signup_application

    return approve_signup_application(application_name)


def _notify_lead_assigned(lead_name: str) -> None:
    """Async: notify Sales of a new lead."""
    # Find first Sales user to notify (round-robin in later phase)
    sales_users = frappe.get_all(
        "Has Role",
        filters={"role": "EE Sales", "parenttype": "User"},
        fields=["parent"],
        limit=1,
    )
    if not sales_users:
        return
    user_email = frappe.db.get_value("User", sales_users[0]["parent"], "email")
    if not user_email:
        return

    lead = frappe.get_doc("Lead", lead_name)
    from entertainment_express.notifications import send
    send("lead_assigned", user_email, {
        "lead_name": lead.lead_name,
        "company_name": lead.company_name,
        "email": lead.email_id,
        "lead_id": lead_name,
    })
