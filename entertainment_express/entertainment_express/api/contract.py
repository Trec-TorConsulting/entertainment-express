"""
Contract API — create, send, sign.
The signing page is www/sign.html?token=<token>.
"""

import hashlib
import secrets
import frappe
from frappe.utils import now_datetime, add_days


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

    site_url = frappe.utils.get_url()
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
def sign_contract(contract_name: str = None, token: str = None,
                  signature_typed: str = None, signer_name: str = None) -> dict:
    """
    Guest-callable signing endpoint.
    Stores signature + audit trail; transitions contract to `signed`.
    Triggers: convert_to_booking, deposit invoice, confirmation email.
    """
    if not contract_name or not token:
        frappe.throw("Invalid request.", frappe.PermissionError)
    if token != _signing_token(contract_name):
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
def view_contract(contract_name: str = None, token: str = None) -> dict:
    """Mark contract as viewed when the signer opens the signing page."""
    if not contract_name or not token:
        frappe.throw("Invalid request.")
    if token != _signing_token(contract_name):
        frappe.throw("Invalid token.")

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
    import hmac, hashlib
    secret = frappe.conf.get("ee_signing_secret") or "CHANGE_ME_IN_SITE_CONFIG"
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
