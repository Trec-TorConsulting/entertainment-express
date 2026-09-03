import json

import frappe
from frappe import _
from frappe.utils import get_url
from frappe.utils import flt, now_datetime


ALLOWED_LEAD_TYPES = {"demo", "contact", "newsletter", "trial"}
NEWSLETTER_GROUP_NAME = "EE Newsletter"


def _get_marketing_settings():
    if not frappe.db.exists("DocType", "Marketing Settings"):
        return None
    return frappe.get_single("Marketing Settings")


def _to_dict(payload):
    if payload is None:
        return {}
    if isinstance(payload, dict):
        return payload
    if isinstance(payload, str):
        try:
            return json.loads(payload)
        except Exception:
            return {}
    return {}


def _get_client_ip():
    return (
        getattr(frappe.local, "request_ip", "")
        or (frappe.request and frappe.request.headers.get("X-Forwarded-For", "").split(",")[0].strip())
        or "unknown"
    )


def _check_rate_limit(bucket, limit_count=20, window_seconds=3600):
    cache = frappe.cache()
    count = cache.get_value(bucket) or 0
    count = int(count)
    if count >= limit_count:
        frappe.throw(_("Too many requests. Please try again later."), frappe.ValidationError)
    cache.set_value(bucket, count + 1, expires_in_sec=window_seconds)


def _require_captcha_if_enabled(data):
    settings = _get_marketing_settings()
    if not settings:
        return

    provider = (getattr(settings, "captcha_provider", "none") or "none").strip().lower()
    if provider == "none":
        return

    token = (data.get("captcha_token") or "").strip()
    if not token:
        frappe.throw(_("Captcha validation is required."), frappe.ValidationError)


def _notify_sales_lead(lead_name):
    settings = frappe.get_single("Marketing Settings") if frappe.db.exists("DocType", "Marketing Settings") else None
    recipient = getattr(settings, "sales_notify_email", "") if settings else ""
    if not recipient:
        recipient = frappe.db.get_value("User", {"enabled": 1, "name": ("!=", "Administrator")}, "email")
    if not recipient:
        return

    lead = frappe.get_doc("Lead", lead_name)
    from entertainment_express.notifications import send

    send(
        "lead_assigned",
        recipient,
        {
            "lead_name": lead.lead_name,
            "company_name": lead.company_name,
            "email": lead.email_id,
            "lead_id": lead.name,
        },
    )


def _set_if_field(doc_values, doctype, fieldname, value):
    if frappe.get_meta(doctype).has_field(fieldname):
        doc_values[fieldname] = value


def _set_doc_if_field(doc, doctype, fieldname, value):
    if frappe.get_meta(doctype).has_field(fieldname):
        setattr(doc, fieldname, value)


def _resolve_lead_source():
    """Pick a valid Lead Source present on the site to avoid link validation errors."""
    for candidate in ("Campaign", "Website", "Referral"):
        if frappe.db.exists("Lead Source", candidate):
            return candidate
    return frappe.db.get_value("Lead Source", {}, "name")


def _ensure_newsletter_group():
    if frappe.db.exists("Email Group", NEWSLETTER_GROUP_NAME):
        return
    frappe.get_doc(
        {
            "doctype": "Email Group",
            "title": NEWSLETTER_GROUP_NAME,
            "enable_double_opt_in": 1,
        }
    ).insert(ignore_permissions=True)


def _find_newsletter_member(email):
    doctype = "Email Group Member"
    if not frappe.db.exists("DocType", doctype):
        return None

    meta = frappe.get_meta(doctype)
    email_field = "email" if meta.has_field("email") else "email_id" if meta.has_field("email_id") else None
    if not email_field:
        return None

    filters = {email_field: email}
    if meta.has_field("email_group"):
        filters["email_group"] = NEWSLETTER_GROUP_NAME

    return frappe.db.get_value(doctype, filters, "name")


def _upsert_newsletter_member(email, confirmed=False):
    doctype = "Email Group Member"
    if not frappe.db.exists("DocType", doctype):
        return None

    meta = frappe.get_meta(doctype)
    email_field = "email" if meta.has_field("email") else "email_id" if meta.has_field("email_id") else None
    if not email_field:
        return None

    member_name = _find_newsletter_member(email)
    if member_name:
        member = frappe.get_doc(doctype, member_name)
    else:
        values = {"doctype": doctype}
        values[email_field] = email
        _set_if_field(values, doctype, "email_group", NEWSLETTER_GROUP_NAME)
        member = frappe.get_doc(values)

    _set_doc_if_field(member, doctype, "unsubscribed", 0 if confirmed else 1)
    _set_doc_if_field(member, doctype, "status", "Subscribed" if confirmed else "Pending")
    _set_doc_if_field(member, doctype, "confirmation_email_sent", 1)

    if member.get("name") and frappe.db.exists(doctype, member.name):
        member.save(ignore_permissions=True)
    else:
        member.insert(ignore_permissions=True)

    return member.name


def _upsert_newsletter_lead(email, source_page, utm, referrer, confirmed):
    lead_name = frappe.db.get_value("Lead", {"email_id": email}, "name")
    if lead_name:
        lead = frappe.get_doc("Lead", lead_name)
        if frappe.get_meta("Lead").has_field("ee_lead_type"):
            lead.ee_lead_type = "newsletter"
        if frappe.get_meta("Lead").has_field("ee_source_page"):
            lead.ee_source_page = source_page[:140]
        if frappe.get_meta("Lead").has_field("ee_utm_source"):
            lead.ee_utm_source = (utm.get("utm_source") or "")[:140]
        if frappe.get_meta("Lead").has_field("ee_utm_medium"):
            lead.ee_utm_medium = (utm.get("utm_medium") or "")[:140]
        if frappe.get_meta("Lead").has_field("ee_utm_campaign"):
            lead.ee_utm_campaign = (utm.get("utm_campaign") or "")[:140]
        if frappe.get_meta("Lead").has_field("ee_referrer"):
            lead.ee_referrer = referrer[:240]
        if confirmed and frappe.get_meta("Lead").has_field("ee_consent_marketing"):
            lead.ee_consent_marketing = 1
        if confirmed and frappe.get_meta("Lead").has_field("ee_consent_at"):
            lead.ee_consent_at = now_datetime()
        lead.save(ignore_permissions=True)
        return lead.name

    result = submit_lead(
        {
            "lead_type": "newsletter",
            "email": email,
            "source_page": source_page,
            "utm_source": utm.get("utm_source") or "",
            "utm_medium": utm.get("utm_medium") or "",
            "utm_campaign": utm.get("utm_campaign") or "",
            "utm_term": utm.get("utm_term") or "",
            "utm_content": utm.get("utm_content") or "",
            "referrer": referrer,
            "consent_marketing": "1" if confirmed else "0",
        }
    )
    return result.get("lead")


def _newsletter_token_cache_key(token):
    return f"ee:newsletter:token:{token}"


def _send_newsletter_confirmation_email(email, token):
    confirm_url = get_url(f"/api/method/entertainment_express.api.marketing.confirm_subscription?token={token}")
    frappe.sendmail(
        recipients=[email],
        subject="Confirm your EE newsletter subscription",
        message=(
            "<p>Please confirm your subscription to the Entertainment Express newsletter.</p>"
            f"<p><a href='{confirm_url}'>Confirm subscription</a></p>"
            "<p>If you did not request this, you can ignore this email.</p>"
        ),
    )


def _is_active_plan_status(status):
    value = (status or "").strip().lower()
    return value in {"active", "public"}


def _serialize_plan(plan):
    meta = frappe.get_meta("Plan")
    has_price_annual = meta.has_field("price_annual")

    monthly = flt(getattr(plan, "price_monthly", 0.0), 2)
    annual = flt(getattr(plan, "price_annual", 0.0), 2) if has_price_annual else flt(monthly * 12, 2)

    entitlements = []
    for row in (getattr(plan, "entitlements", None) or []):
        if not row.feature_key:
            continue
        entitlements.append(
            {
                "feature_key": row.feature_key,
                "limit_value": row.limit_value,
                "description": row.description,
            }
        )

    return {
        "code": plan.plan_code,
        "name": plan.plan_name,
        "currency": plan.currency or "USD",
        "price_monthly": monthly,
        "price_annual": annual,
        "trial_days": int(getattr(plan, "trial_days", 0) or 0),
        "features": entitlements,
        "cta_target": f"/start-trial?plan={plan.plan_code}",
    }


@frappe.whitelist(allow_guest=True)
def get_pricing(billing="monthly"):
    """Return public pricing cards from active Plan records."""
    client_ip = _get_client_ip()
    _check_rate_limit(f"ee:marketing:pricing:{client_ip}", limit_count=180, window_seconds=3600)

    billing_mode = (billing or "monthly").strip().lower()
    if billing_mode not in {"monthly", "annual"}:
        frappe.throw(_("Billing mode must be monthly or annual"), frappe.ValidationError)

    cache_key = f"ee:marketing:pricing:payload:{billing_mode}"
    cached = frappe.cache().get_value(cache_key)
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass

    plans = frappe.get_all(
        "Plan",
        fields=["name", "plan_name", "plan_code", "price_monthly", "currency", "trial_days", "status"],
        order_by="price_monthly asc",
    )

    output = []
    for row in plans:
        if not _is_active_plan_status(row.status):
            continue
        plan_doc = frappe.get_doc("Plan", row.name)
        output.append(_serialize_plan(plan_doc))

    payload = {
        "billing": billing_mode,
        "plans": output,
    }
    frappe.cache().set_value(cache_key, json.dumps(payload), expires_in_sec=300)
    return payload


@frappe.whitelist(allow_guest=True)
def submit_lead(payload=None):
    """Create a control-plane Lead from demo/contact/newsletter forms."""
    data = _to_dict(payload)

    # Honeypot trap for bots.
    if (data.get("website") or "").strip():
        return {"ok": True}

    client_ip = _get_client_ip()
    _check_rate_limit(f"ee:marketing:lead:{client_ip}", limit_count=30, window_seconds=3600)
    _require_captcha_if_enabled(data)

    email = (data.get("email") or "").strip()
    if not email or "@" not in email:
        frappe.throw(_("A valid email is required."), frappe.ValidationError)

    lead_type = (data.get("lead_type") or "contact").strip().lower()
    if lead_type not in ALLOWED_LEAD_TYPES:
        lead_type = "contact"

    full_name = (data.get("full_name") or "").strip()
    company = (data.get("company") or "").strip()
    lead_name = (full_name or company or email.split("@")[0])[:140]

    utm_source = (data.get("utm_source") or "").strip()
    utm_medium = (data.get("utm_medium") or "").strip()
    utm_campaign = (data.get("utm_campaign") or "").strip()
    utm_term = (data.get("utm_term") or "").strip()
    utm_content = (data.get("utm_content") or "").strip()
    source_page = (data.get("source_page") or "").strip()
    referrer = (data.get("referrer") or "").strip()
    message = (data.get("message") or "").strip()

    note_lines = [
        f"Source Page: {source_page}",
        f"Vertical Interest: {(data.get('vertical') or '').strip()}",
        f"Message: {message[:2000]}",
    ]

    consent = 1 if str(data.get("consent_marketing") or "") in {"1", "true", "True", "on"} else 0
    lead_values = {
        "doctype": "Lead",
        "lead_name": lead_name,
        "company_name": company[:140],
        "email_id": email[:240],
        "mobile_no": (data.get("phone") or "")[:30],
        "status": "Open",
    }
    lead_source = _resolve_lead_source()
    if lead_source:
        lead_values["source"] = lead_source
    _set_if_field(lead_values, "Lead", "ee_lead_type", lead_type)
    _set_if_field(lead_values, "Lead", "ee_vertical_interest", (data.get("vertical") or "")[:300])
    _set_if_field(lead_values, "Lead", "ee_source_page", source_page[:140])
    _set_if_field(lead_values, "Lead", "ee_utm_source", utm_source[:140])
    _set_if_field(lead_values, "Lead", "ee_utm_medium", utm_medium[:140])
    _set_if_field(lead_values, "Lead", "ee_utm_campaign", utm_campaign[:140])
    _set_if_field(lead_values, "Lead", "ee_utm_term", utm_term[:140])
    _set_if_field(lead_values, "Lead", "ee_utm_content", utm_content[:140])
    _set_if_field(lead_values, "Lead", "ee_referrer", referrer[:240])
    _set_if_field(lead_values, "Lead", "ee_consent_marketing", consent)
    _set_if_field(lead_values, "Lead", "ee_consent_at", now_datetime() if consent else None)
    _set_if_field(lead_values, "Lead", "ee_spam_score", 0.0)

    lead = frappe.get_doc(lead_values)
    lead.insert(ignore_permissions=True)
    # Lead.notes is a child table in modern ERPNext; append a plain comment instead.
    lead.add_comment("Comment", "\n".join(note_lines)[:3000])

    frappe.enqueue("entertainment_express.api.marketing._notify_sales_lead", lead_name=lead.name)

    return {"ok": True, "lead": lead.name}


@frappe.whitelist(allow_guest=True)
def start_trial(payload=None):
    """Create a Signup Application with attribution and return signup handoff route."""
    data = _to_dict(payload)
    if (data.get("website") or "").strip():
        return {"ok": True, "redirect": "/signup"}

    client_ip = _get_client_ip()
    _check_rate_limit(f"ee:marketing:trial:{client_ip}", limit_count=15, window_seconds=3600)
    _require_captcha_if_enabled(data)

    company_name = (data.get("company_name") or "").strip()
    contact_email = (data.get("contact_email") or "").strip()
    requested_slug = (data.get("requested_slug") or "").strip().lower()
    plan_code = (data.get("plan_code") or "starter").strip().lower()

    if not company_name:
        frappe.throw(_("Company name is required."), frappe.ValidationError)
    if not contact_email or "@" not in contact_email:
        frappe.throw(_("A valid email is required."), frappe.ValidationError)
    if not requested_slug:
        frappe.throw(_("Requested slug is required."), frappe.ValidationError)

    from entertainment_express.control_plane.provisioner import validate_slug

    validate_slug(requested_slug)

    plan_name = frappe.db.get_value("Plan", {"plan_code": plan_code}, "name")
    if not plan_name:
        plan_name = frappe.db.get_value("Plan", {"status": ("in", ["Active", "active"])}, "name")
    if not plan_name:
        frappe.throw(_("No active plan is available for signup."), frappe.ValidationError)

    trial_lead = submit_lead(
        {
            "lead_type": "trial",
            "full_name": company_name,
            "company": company_name,
            "email": contact_email,
            "phone": (data.get("phone") or ""),
            "vertical": (data.get("vertical") or ""),
            "source_page": (data.get("source_page") or "/start-trial"),
            "utm_source": (data.get("utm_source") or ""),
            "utm_medium": (data.get("utm_medium") or ""),
            "utm_campaign": (data.get("utm_campaign") or ""),
            "utm_term": (data.get("utm_term") or ""),
            "utm_content": (data.get("utm_content") or ""),
            "referrer": (data.get("referrer") or ""),
            "consent_marketing": (data.get("consent_marketing") or ""),
        }
    )

    signup_values = {
        "doctype": "Signup Application",
        "company_name": company_name[:200],
        "requested_slug": requested_slug[:50],
        "contact_email": contact_email[:240],
        "plan": plan_name,
        "status": "new",
    }
    _set_if_field(signup_values, "Signup Application", "ee_utm_source", (data.get("utm_source") or "")[:140])
    _set_if_field(signup_values, "Signup Application", "ee_utm_medium", (data.get("utm_medium") or "")[:140])
    _set_if_field(signup_values, "Signup Application", "ee_utm_campaign", (data.get("utm_campaign") or "")[:140])
    _set_if_field(signup_values, "Signup Application", "ee_source_page", (data.get("source_page") or "/start-trial")[:140])
    _set_if_field(signup_values, "Signup Application", "ee_origin_lead", trial_lead.get("lead"))

    signup = frappe.get_doc(signup_values)
    signup.insert(ignore_permissions=True)
    frappe.db.commit()

    from entertainment_express.api.signup_onboarding import signup_handoff

    interval = (data.get("billing_interval") or "month").strip().lower()
    handoff = signup_handoff(signup.name, requested_slug, interval=interval)
    return handoff


@frappe.whitelist(allow_guest=True)
def subscribe_newsletter(payload=None):
    """Create or update a pending newsletter subscription and send confirm email."""
    data = _to_dict(payload)
    if (data.get("website") or "").strip():
        return {"ok": True}

    client_ip = _get_client_ip()
    _check_rate_limit(f"ee:marketing:newsletter:{client_ip}", limit_count=20, window_seconds=3600)
    _require_captcha_if_enabled(data)

    email = (data.get("email") or "").strip().lower()
    if not email or "@" not in email:
        return {"ok": True}

    source_page = (data.get("source_page") or "/resources").strip()
    utm = {
        "utm_source": (data.get("utm_source") or "").strip(),
        "utm_medium": (data.get("utm_medium") or "").strip(),
        "utm_campaign": (data.get("utm_campaign") or "").strip(),
        "utm_term": (data.get("utm_term") or "").strip(),
        "utm_content": (data.get("utm_content") or "").strip(),
    }
    referrer = (data.get("referrer") or "").strip()

    _ensure_newsletter_group()
    _upsert_newsletter_member(email, confirmed=False)
    _upsert_newsletter_lead(email, source_page, utm, referrer, confirmed=False)

    token = frappe.generate_hash(length=48)
    frappe.cache().set_value(
        _newsletter_token_cache_key(token),
        json.dumps({"email": email, "source_page": source_page, "utm": utm, "referrer": referrer}),
        expires_in_sec=7 * 24 * 60 * 60,
    )
    frappe.enqueue(
        "entertainment_express.api.marketing._send_newsletter_confirmation_email",
        email=email,
        token=token,
    )
    return {"ok": True}


@frappe.whitelist(allow_guest=True)
def confirm_subscription(token=None):
    """Confirm newsletter subscription from a tokenized email link (idempotent)."""
    client_ip = _get_client_ip()
    _check_rate_limit(f"ee:marketing:newsletter-confirm:{client_ip}", limit_count=60, window_seconds=3600)

    if not token:
        return {"ok": True}

    payload = frappe.cache().get_value(_newsletter_token_cache_key(token))
    if not payload:
        return {"ok": True}

    try:
        data = json.loads(payload)
    except Exception:
        return {"ok": True}

    email = (data.get("email") or "").strip().lower()
    if not email:
        return {"ok": True}

    _ensure_newsletter_group()
    _upsert_newsletter_member(email, confirmed=True)
    _upsert_newsletter_lead(
        email,
        (data.get("source_page") or "/resources").strip(),
        data.get("utm") or {},
        (data.get("referrer") or "").strip(),
        confirmed=True,
    )
    return {"ok": True, "confirmed": True}
