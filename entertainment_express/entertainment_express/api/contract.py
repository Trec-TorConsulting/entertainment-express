"""
Contract API — create, send, sign.
The signing page is www/sign.html?token=<token>.
"""

import hashlib
import hmac
import secrets
import frappe
from frappe.utils import now_datetime, add_days

from entertainment_express.api.rate_limit import rate_limited
from entertainment_express.security.site_secrets import get_site_secret
from entertainment_express.white_label.urls import get_public_base_url


@frappe.whitelist()
def create_contract(quotation_name: str) -> dict:
    """
    Generate an EE Contract from the accepted Quotation using the active template.
    Returns the new contract as dict.
    """
    _check_role(["EE Tenant Admin", "EE Sales", "System Manager"])
    quote = frappe.get_doc("Quotation", quotation_name)

    # Get active template
    template_name = frappe.db.get_value("EE Contract Template", {"active": 1}, "name")
    if not template_name:
        frappe.throw("No active EE Contract Template found. Create one first.")

    template = frappe.get_doc("EE Contract Template", template_name)

    # Render body
    context = _build_contract_context(quote)
    rendered_html = frappe.render_template(template.body, context)

    contract = frappe.get_doc({
        "doctype": "EE Contract",
        "template": template_name,
        "quotation": quotation_name,
        "status": "draft",
        "rendered_html": rendered_html,
        "signer_name": context.get("customer_name"),
        "signer_email": context.get("customer_email"),
        "expires_at": add_days(now_datetime(), 30),
    })
    contract.insert(ignore_permissions=False)
    frappe.db.commit()
    return contract.as_dict()


@frappe.whitelist()
def send_contract(contract_name: str) -> dict:
    """Send the contract for signature — emails a tokenized signing link."""
    _check_role(["EE Tenant Admin", "EE Sales", "System Manager"])
    contract = frappe.get_doc("EE Contract", contract_name)
    if contract.status not in ("draft",):
        frappe.throw(f"Cannot send a contract in status '{contract.status}'.")

    site_url = get_public_base_url()
    token = _signing_token(contract_name)
    sign_link = f"{site_url}/sign?contract={contract_name}&token={token}"

    from entertainment_express.notifications import send
    send("contract_sent", contract.signer_email, {
        "signer_name": contract.signer_name,
        "company_name": frappe.db.get_single_value("Global Defaults", "default_company"),
        "contract_name": contract_name,
        "sign_link": sign_link,
        "expires_at": str(contract.expires_at),
    })

    contract.db_set("status", "sent")
    try:
        from entertainment_express.integrations.docusign import maybe_send

        maybe_send(contract_name)
    except Exception:
        frappe.log_error(frappe.get_traceback(), "EE DocuSign send")
    return {"status": "sent", "contract": contract_name, "sign_link": sign_link}


@frappe.whitelist(allow_guest=True)
@rate_limited(limit=30)
def sign_contract(contract_name: str = None, token: str = None,
                  signature_typed: str = None, signer_name: str = None) -> dict:
    """
    Guest-callable signing endpoint.
    Stores signature + audit trail; transitions contract to `signed`.
    Triggers: convert_to_booking, deposit invoice, confirmation email.
    """
    if not contract_name or not token:
        frappe.throw("Invalid request.", frappe.PermissionError)
    if not hmac.compare_digest(str(token), _signing_token(contract_name)):
        frappe.throw("Invalid or expired signing token.", frappe.PermissionError)

    contract = frappe.get_doc("EE Contract", contract_name)
    if contract.status == "signed":
        return {"status": "already_signed"}
    if contract.status not in ("sent", "viewed"):
        frappe.throw(f"Contract cannot be signed in status '{contract.status}'.")
    if contract.expires_at and frappe.utils.now_datetime() > contract.expires_at:
        contract.db_set("status", "expired")
        frappe.throw("This contract has expired.")

    signed_at = now_datetime()
    signer_ip = frappe.local.request.environ.get("HTTP_X_FORWARDED_FOR",
                 frappe.local.request.environ.get("REMOTE_ADDR", "unknown"))

    # Content hash: SHA-256 of rendered_html + signer + ISO timestamp
    content = (contract.rendered_html or "") + (signer_name or "") + str(signed_at)
    content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

    contract.db_set({
        "status": "signed",
        "signature_typed": signature_typed or signer_name,
        "signer_name": signer_name or contract.signer_name,
        "signed_at": signed_at,
        "signed_ip": signer_ip,
        "content_hash": content_hash,
    })
    frappe.db.commit()

    # Convert to booking (enqueued to avoid blocking the signing response)
    frappe.enqueue(
        "entertainment_express.api.booking.convert_to_booking",
        contract_name=contract_name,
        queue="short",
    )

    # Notify both parties
    company_name = frappe.db.get_single_value("Global Defaults", "default_company")
    owner_email = frappe.db.get_value(
        "User", {"name": ["!=", "Guest"]}, "email", order_by="creation asc"
    )
    from entertainment_express.notifications import send
    send("contract_signed", contract.signer_email, {
        "signer_name": signer_name or contract.signer_name,
        "company_name": company_name,
        "signed_at": str(signed_at),
    })
    if owner_email:
        send("contract_signed_internal", owner_email, {
            "signer_name": signer_name or contract.signer_name,
            "contract_name": contract_name,
            "signed_at": str(signed_at),
        })

    return {"status": "signed", "content_hash": content_hash}


def _require_my_contract(contract_name: str):
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    roles = set(frappe.get_roles() or [])
    if "EE Event Guest" in roles and "EE Customer" not in roles:
        frappe.throw("Insufficient permissions.", frappe.PermissionError)
    if "EE Customer" not in roles and "EE Tenant Admin" not in roles:
        frappe.throw("Insufficient permissions.", frappe.PermissionError)
    contract = frappe.get_doc("EE Contract", contract_name)
    if "EE Tenant Admin" in roles:
        return contract
    if contract.signer_email == frappe.session.user:
        return contract
    customer = frappe.db.get_value("Customer", {"email_id": frappe.session.user}, "name")
    if customer and contract.booking:
        booking_customer = frappe.db.get_value("Event Booking", contract.booking, "customer")
        if booking_customer == customer:
            return contract
    frappe.throw("Insufficient permissions.", frappe.PermissionError)


@frappe.whitelist()
def view_my_contract(contract_name: str) -> dict:
    contract = _require_my_contract(contract_name)
    if contract.status == "sent":
        contract.db_set("status", "viewed")
    return {
        "contract_name": contract.name,
        "signer_name": contract.signer_name,
        "rendered_html": contract.rendered_html,
        "status": contract.status,
    }


@frappe.whitelist()
def sign_my_contract(contract_name: str, signer_name: str | None = None, signature_typed: str | None = None) -> dict:
    contract = _require_my_contract(contract_name)
    return sign_contract(
        contract_name=contract.name,
        token=_signing_token(contract.name),
        signature_typed=signature_typed,
        signer_name=signer_name,
    )


@frappe.whitelist(allow_guest=True)
@rate_limited(limit=60)
def view_contract(contract_name: str = None, token: str = None) -> dict:
    """Mark contract as viewed when the signer opens the signing page."""
    if not contract_name or not token:
        frappe.throw("Invalid request.")
    if not hmac.compare_digest(str(token), _signing_token(contract_name)):
        frappe.throw("Invalid token.", frappe.PermissionError)

    contract = frappe.get_doc("EE Contract", contract_name)
    if contract.status == "sent":
        contract.db_set("status", "viewed")
    return {
        "contract_name": contract_name,
        "signer_name": contract.signer_name,
        "rendered_html": contract.rendered_html,
        "status": contract.status,
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

def _signing_token(contract_name: str) -> str:
    secret = get_site_secret("ee_signing_secret", purpose="contract")
    return hmac.new(
        secret.encode(), f"sign:{contract_name}".encode(), hashlib.sha256
    ).hexdigest()[:48]


def _build_contract_context(quote) -> dict:
    customer_email = frappe.db.get_value("Customer", quote.party_name, "email_id") or ""
    company_name = frappe.db.get_single_value("Global Defaults", "default_company")
    return {
        "customer_name": quote.party_name,
        "customer_email": customer_email,
        "company_name": company_name,
        "event_date": str(quote.ee_event_date or ""),
        "venue_address": quote.ee_venue_address or "",
        "grand_total": float(quote.grand_total or 0),
        "deposit_amount": float((quote.grand_total or 0) * (quote.ee_deposit_percent or 25) / 100),
        "quote_number": quote.name,
    }


def _check_role(allowed_roles: list[str]) -> None:
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    if not any(r in frappe.get_roles(frappe.session.user) for r in allowed_roles):
        frappe.throw("Insufficient permissions.", frappe.PermissionError)


def _values(values) -> dict:
    values = values or frappe.form_dict.get("values") or {}
    if isinstance(values, str):
        values = frappe.parse_json(values) if hasattr(frappe, "parse_json") else {}
    return values or {}


@frappe.whitelist()
def list_contracts(status: str | None = None, search: str | None = None) -> list[dict]:
    """List contracts and agreements for owner portal."""
    _check_role(["EE Tenant Admin", "EE Sales", "System Manager"])
    filters = {}
    if status and status != "all":
        filters["status"] = status

    rows = frappe.get_all(
        "EE Contract",
        filters=filters,
        fields=[
            "name", "status", "signer_name", "signer_email", "quotation",
            "booking", "template", "signed_at", "signed_ip", "content_hash",
            "signature_typed", "expires_at", "creation", "rendered_html"
        ],
        order_by="creation desc",
        limit_page_length=200
    )

    site_url = get_public_base_url()
    out = []
    for r in rows:
        if search:
            q = search.lower()
            combined = f"{r.name} {r.signer_name} {r.signer_email} {r.quotation} {r.booking}".lower()
            if q not in combined:
                continue
        token = _signing_token(r.name)
        r_dict = dict(r)
        r_dict["sign_link"] = f"{site_url}/sign?contract={r.name}&token={token}"
        out.append(r_dict)
    return out


@frappe.whitelist()
def save_contract(name: str | None = None, values: dict | None = None) -> dict:
    """Create or update a contract / binding agreement for owner portal."""
    _check_role(["EE Tenant Admin", "EE Sales", "System Manager"])
    values = _values(values)
    target_name = name or values.get("id") or values.get("name")

    signer_name = values.get("signer_name") or "Valued Client"
    signer_email = values.get("signer_email") or ""
    rendered_html = values.get("rendered_html") or values.get("body") or "<p>Agreement terms...</p>"
    status = values.get("status") or "draft"
    expires_at = values.get("expires_at") or add_days(now_datetime(), 30)

    if target_name and frappe.db.exists("EE Contract", target_name):
        doc = frappe.get_doc("EE Contract", target_name)
        doc.signer_name = signer_name
        if signer_email:
            doc.signer_email = signer_email
        doc.rendered_html = rendered_html
        if values.get("status"):
            doc.status = status
        if values.get("template"):
            doc.template = values.get("template")
        if values.get("quotation"):
            doc.quotation = values.get("quotation")
        if values.get("booking"):
            doc.booking = values.get("booking")
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({
            "doctype": "EE Contract",
            "naming_series": "EE-CON-.YYYY.-.####",
            "template": values.get("template"),
            "quotation": values.get("quotation"),
            "booking": values.get("booking"),
            "status": status,
            "rendered_html": rendered_html,
            "signer_name": signer_name,
            "signer_email": signer_email,
            "expires_at": expires_at,
        })
        doc.insert(ignore_permissions=True)

    frappe.db.commit()

    if values.get("send_signature_request") and doc.signer_email and doc.status == "draft":
        try:
            send_contract(doc.name)
        except Exception:
            pass

    return doc.as_dict()


@frappe.whitelist()
def delete_contract(name: str | None = None) -> dict:
    """Delete a contract / agreement."""
    _check_role(["EE Tenant Admin", "EE Sales", "System Manager"])
    target = name or frappe.form_dict.get("name")
    if not target:
        frappe.throw("Please specify a contract to delete.")
    if frappe.db.exists("EE Contract", target):
        frappe.delete_doc("EE Contract", target, ignore_permissions=True)
        frappe.db.commit()
    return {"ok": True}


@frappe.whitelist()
def list_templates() -> list[dict]:
    """List reusable contract and agreement templates."""
    _check_role(["EE Tenant Admin", "EE Sales", "System Manager"])
    rows = frappe.get_all(
        "EE Contract Template",
        fields=["name", "template_name", "active", "body", "creation"],
        order_by="creation desc",
        limit_page_length=100
    )
    return rows


@frappe.whitelist()
def save_template(name: str | None = None, values: dict | None = None) -> dict:
    """Create or update a contract template."""
    _check_role(["EE Tenant Admin", "EE Sales", "System Manager"])
    values = _values(values)
    target_name = name or values.get("id") or values.get("name") or frappe.form_dict.get("name")
    template_name = (
        values.get("template_name")
        or values.get("title")
        or frappe.form_dict.get("template_name")
        or frappe.form_dict.get("title")
        or "Standard Contract Template"
    )
    body = (
        values.get("body")
        or values.get("rendered_html")
        or frappe.form_dict.get("body")
        or "<p>Enter contract terms jinja template HTML...</p>"
    )
    active = 1 if values.get("active", frappe.form_dict.get("active", 1)) else 0

    if target_name and frappe.db.exists("EE Contract Template", target_name):
        doc = frappe.get_doc("EE Contract Template", target_name)
        doc.template_name = template_name
        doc.body = body
        doc.active = active
        doc.save(ignore_permissions=True)
    elif frappe.db.exists("EE Contract Template", {"template_name": template_name}):
        doc_name = frappe.db.get_value("EE Contract Template", {"template_name": template_name}, "name")
        doc = frappe.get_doc("EE Contract Template", doc_name)
        doc.body = body
        doc.active = active
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({
            "doctype": "EE Contract Template",
            "naming_series": "EE-CT-.####",
            "template_name": template_name,
            "active": active,
            "body": body,
        })
        doc.insert(ignore_permissions=True)

    frappe.db.commit()
    return doc.as_dict()


@frappe.whitelist()
def delete_template(name: str | None = None) -> dict:
    """Delete a contract template."""
    _check_role(["EE Tenant Admin", "EE Sales", "System Manager"])
    target = name or frappe.form_dict.get("name")
    if not target:
        frappe.throw("Please specify a contract template to delete.")
    if frappe.db.exists("EE Contract Template", target):
        frappe.delete_doc("EE Contract Template", target, ignore_permissions=True)
        frappe.db.commit()
    return {"ok": True}


@frappe.whitelist()
def ai_generate_clause(prompt: str | None = None, clause_type: str | None = None, existing_text: str | None = None) -> dict:
    """
    AI Legal & Clause Drafting endpoint for owner contract studio.
    Supports preset clause categories (cancellation, deposit, safety, weather, media, overtime)
    and custom AI prompt instructions.
    """
    _check_role(["EE Tenant Admin", "EE Sales", "System Manager"])
    prompt = (prompt or frappe.form_dict.get("prompt") or "").strip()
    clause_type = (clause_type or frappe.form_dict.get("clause_type") or "").strip().lower()
    existing_text = (existing_text or frappe.form_dict.get("existing_text") or "").strip()

    company_name = frappe.db.get_single_value("Global Defaults", "default_company") or "Provider"

    PRESET_CLAUSES = {
        "cancellation": f"""<h3>Cancellation & Refund Terms</h3>
<p>1. <strong>Client Cancellation:</strong> Cancellations made more than 30 days prior to event date receive a full refund minus a $100 processing fee. Cancellations within 14–30 days forfeit the deposit amount of <strong>{{{{ doc.deposit_amount }}}}</strong>. Cancellations within 14 days of the event require payment of the full <strong>{{{{ doc.grand_total }}}}</strong> contract total.</p>
<p>2. <strong>Provider Postponement:</strong> In the unlikely event <strong>{company_name}</strong> cannot perform due to severe weather, illness, or emergency, all payments including deposit will be promptly refunded or transferred to a rescheduled date without penalty.</p>""",
        "deposit": f"""<h3>Deposit & Payment Schedule</h3>
<p>1. <strong>Retainer Deposit:</strong> A non-refundable initial retainer of <strong>{{{{ doc.deposit_amount }}}}</strong> is required upon execution of this agreement to secure the event date on <strong>{{{{ doc.event_date }}}}</strong>.</p>
<p>2. <strong>Final Balance:</strong> The remaining contract balance must be paid in full no later than 7 business days prior to the event date.</p>""",
        "safety_weather": f"""<h3>Equipment & Weather Safety Policy</h3>
<p>1. <strong>Weather Safety:</strong> For outdoor inflatable, game truck, or stage setups, <strong>{company_name}</strong> reserves the right to pause or collapse equipment during high winds exceeding 15 mph, severe thunder, or heavy rain to protect guest safety.</p>
<p>2. <strong>Power & Space Requirements:</strong> Client must ensure a clean, level setup space at <strong>{{{{ doc.venue_address }}}}</strong> with standard 120V grounded power outlets within 50 feet of setup location.</p>""",
        "overtime": f"""<h3>Overtime & Extended Performance Rates</h3>
<p>1. <strong>Extended Hours:</strong> Any extension of performance time beyond the contracted period must be requested by the Client and approved by <strong>{company_name}</strong> on site.</p>
<p>2. <strong>Overtime Rate:</strong> Overtime is billed at a rate of <strong>$150 per additional hour</strong> (or portion thereof), due at the conclusion of the event.</p>""",
        "media_release": f"""<h3>Photo, Video & Marketing Release</h3>
<p>1. <strong>Media Consent:</strong> Client grants <strong>{company_name}</strong> permission to capture promotional photographs and video clips of the setup and event atmosphere solely for marketing, social media, and portfolio purposes.</p>
<p>2. <strong>Privacy Option:</strong> Client may opt out of media release by providing written notice prior to the event date.</p>"""
    }

    if clause_type in PRESET_CLAUSES:
        return {"ok": True, "clause_type": clause_type, "html": PRESET_CLAUSES[clause_type]}

    system_instructions = (
        "You are an expert event contract attorney and legal writer for mobile entertainment businesses "
        "(DJs, inflatables, photo booths, game trucks, performers). "
        "Generate clear, professional, well-formatted HTML clause snippets. Use <h3>, <p>, <strong>, <ul> tags. "
        "Include Jinja tags like {{ doc.signer_name }}, {{ owner.company_name }}, {{ doc.event_date }}, {{ doc.grand_total }}, {{ doc.deposit_amount }} where appropriate. "
        "Do NOT return raw markdown backticks or <html><body> wrappers."
    )

    full_prompt = prompt or f"Draft a professional event contract clause regarding: {existing_text or 'general performance terms'}."

    html = ""
    try:
        from entertainment_express.api.ai import ask_ai
        response = ask_ai(prompt=full_prompt, system=system_instructions)
        if response and isinstance(response, str):
            html = response.replace("```html", "").replace("```", "").strip()
    except Exception:
        html = ""

    if not html:
        title_text = prompt.title() if prompt else "Terms & Conditions"
        html = f"""<h3>{title_text}</h3>
<p>1. <strong>Scope of Agreement:</strong> <strong>{company_name}</strong> and <strong>{{{{ doc.signer_name }}}}</strong> agree that for the event scheduled on <strong>{{{{ doc.event_date }}}}</strong> at <strong>{{{{ doc.venue_address }}}}</strong>, all performance guidelines and safety protocols shall be strictly maintained.</p>
<p>2. <strong>Mutual Agreement:</strong> Both parties acknowledge that total compensation of <strong>{{{{ doc.grand_total }}}}</strong> covers all contracted services.</p>"""

    return {"ok": True, "prompt": prompt, "html": html}


