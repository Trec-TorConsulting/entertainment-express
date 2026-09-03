"""Owner lists, campaigns, promos, referrals. Site-scoped. Promo money via flt."""

from __future__ import annotations

import secrets

import frappe
from frappe.utils import add_days, cint, flt, fmt_money, getdate, now_datetime, nowdate

from entertainment_express.api.portal_owner import OWNER_ROLES
from entertainment_express.notifications import _allowed, _prefs, send

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
STAFF = OWNER_ROLES | {"EE Marketing", "EE Sales", "System Manager"}
MATCHES = ("all_customers", "completed_jobs", "upcoming_jobs", "leads")
CHANNELS = ("email", "sms", "whatsapp")
CAP = 500


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _deny_guest() -> None:
    roles = _roles()
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)


def _require_staff() -> None:
    _deny_guest()
    if not _roles().intersection(STAFF):
        frappe.throw("Owner portal access denied.", frappe.PermissionError)


def _require_payer() -> None:
    from entertainment_express.api.portal_client import _require_payer as _need_host

    _deny_guest()
    _need_host()


def _money(amount) -> str:
    return fmt_money(flt(amount), currency=frappe.db.get_default("currency") or "USD")


def _audience(segment) -> list[dict]:
    match = getattr(segment, "match", None) or "all_customers"
    days = cint(getattr(segment, "days", None) or 365)
    event_type = (getattr(segment, "event_type", None) or "").strip()
    cutoff = add_days(nowdate(), -days)
    rows: list[dict] = []
    seen: set[str] = set()

    def add(email: str, customer: str = "", party: str = "") -> None:
        email = (email or "").strip().lower()
        if not email or email in seen:
            return
        seen.add(email)
        rows.append({"email": email, "customer": customer, "party": party})

    if match == "leads":
        for row in frappe.get_all("Lead", fields=["name", "email_id"], limit_page_length=CAP):
            add(row.email_id, party=row.name)
        return rows[:CAP]
    if match in ("completed_jobs", "upcoming_jobs"):
        filters: dict = {}
        if match == "completed_jobs":
            filters["status"] = "completed"
            filters["event_date"] = [">=", cutoff]
        else:
            filters["status"] = ["not in", ["canceled", "completed"]]
            filters["event_date"] = [">=", nowdate()]
        if event_type:
            filters["event_type"] = event_type
        for row in frappe.get_all("Event Booking", filters=filters, fields=["customer"], limit_page_length=CAP):
            email = frappe.db.get_value("Customer", row.customer, "email_id") if row.customer else ""
            add(email, customer=row.customer or "")
        return rows[:CAP]
    for row in frappe.get_all("Customer", fields=["name", "email_id"], limit_page_length=CAP):
        add(row.email_id, customer=row.name)
    return rows[:CAP]


def _ensure_templates() -> None:
    specs = [
        (
            "campaign_blast",
            "{{ subject }}",
            "<p>{{ body }}</p><p><img src='{{ open_pixel }}' width='1' height='1' alt=''/></p><p>You can opt out of these notes anytime.</p>",
            "promotional",
        ),
        (
            "review_request",
            "How was {{ event_name }}?",
            "<p>Thanks for having us at {{ event_name }}. If it went well, a review helps other families find us.</p><p><a href='{{ review_url }}'>Leave a review</a></p>",
            "promotional",
        ),
        (
            "thank_you_event",
            "Thank you for {{ event_name }}",
            "<p>Thank you for letting us be part of {{ event_name }}. We would love to see you again.</p>",
            "promotional",
        ),
        (
            "referral_reward",
            "Your thank-you code: {{ code }}",
            "<p>Someone you referred booked with us. Use code <b>{{ code }}</b> on a future quote.</p>",
            "promotional",
        ),
    ]
    if not frappe.db.table_exists("Notification Template"):
        return
    for key, subject, body, priority in specs:
        if frappe.db.exists("Notification Template", {"template_key": key}):
            continue
        frappe.get_doc(
            {
                "doctype": "Notification Template",
                "template_key": key,
                "name": key,
                "subject": subject,
                "body_html": body,
                "active": 1,
                "channels": "email",
                "priority": priority,
            }
        ).insert(ignore_permissions=True)


@frappe.whitelist()
def list_segments() -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Segment"):
        return []
    rows = []
    for row in frappe.get_all("EE Segment", fields=["name", "segment_name", "match", "event_type", "days"], limit_page_length=100):
        rows.append({"id": row.name, "name": row.segment_name, "match": row.match, "event_type": row.event_type or "", "days": cint(row.days)})
    return rows


@frappe.whitelist()
def save_segment(values: dict | str | None = None, name: str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    match = values.get("match") or "all_customers"
    if match not in MATCHES:
        frappe.throw("Pick who this list is for.")
    payload = {
        "segment_name": (values.get("name") or values.get("segment_name") or "").strip(),
        "match": match,
        "event_type": values.get("event_type") or "",
        "days": cint(values.get("days") or 365),
    }
    if not payload["segment_name"]:
        frappe.throw("Name is required.")
    if name:
        doc = frappe.get_doc("EE Segment", name)
        doc.update(payload)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "EE Segment", **payload})
        doc.insert(ignore_permissions=True)
    return {"id": doc.name, "count": len(_audience(doc))}


@frappe.whitelist()
def preview_segment(name: str) -> dict:
    _require_staff()
    doc = frappe.get_doc("EE Segment", name)
    people = _audience(doc)
    return {"count": len(people), "sample": [p["email"] for p in people[:8]]}


@frappe.whitelist()
def list_campaigns() -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Campaign"):
        return []
    rows = []
    for row in frappe.get_all(
        "EE Campaign",
        fields=["name", "campaign_name", "channel", "status", "sent_count", "skipped_count", "opened_count", "clicked_count"],
        order_by="modified desc",
        limit_page_length=50,
    ):
        rows.append(
            {
                "id": row.name,
                "name": row.campaign_name,
                "channel": row.channel,
                "status": row.status,
                "sent": cint(row.sent_count),
                "skipped": cint(row.skipped_count),
                "opened": cint(row.opened_count),
                "clicked": cint(row.clicked_count),
            }
        )
    return rows


@frappe.whitelist()
def save_campaign(values: dict | str | None = None, name: str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    channel = values.get("channel") or "email"
    if channel not in CHANNELS:
        frappe.throw("Pick email, text, or WhatsApp.")
    payload = {
        "campaign_name": (values.get("name") or values.get("campaign_name") or "").strip(),
        "channel": channel,
        "segment": values.get("segment") or "",
        "subject": values.get("subject") or "",
        "body": values.get("body") or "",
        "status": "draft",
    }
    if not payload["campaign_name"]:
        frappe.throw("Name is required.")
    if name:
        doc = frappe.get_doc("EE Campaign", name)
        doc.update(payload)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "EE Campaign", **payload})
        doc.insert(ignore_permissions=True)
    return {"id": doc.name}


@frappe.whitelist()
def send_campaign(name: str) -> dict:
    _require_staff()
    from entertainment_express.control_plane.entitlements import require_entitlement

    require_entitlement("enable_marketing")
    _ensure_templates()
    doc = frappe.get_doc("EE Campaign", name)
    if not doc.segment:
        frappe.throw("Pick a list first.")
    people = _audience(frappe.get_doc("EE Segment", doc.segment))
    doc.set("recipients", [])
    sent = 0
    skipped = 0
    from entertainment_express.white_label.urls import get_public_base_url
    site_url = get_public_base_url().rstrip("/")
    for person in people:
        token = secrets.token_hex(16)
        prefs = _prefs("Customer", person.get("customer"), person["email"])
        if not _allowed(doc.channel, prefs, "promotional"):
            skipped += 1
            doc.append("recipients", {"email": person["email"], "customer": person.get("customer"), "status": "skipped", "skip_reason": "opted out", "track_token": token})
            continue
        pixel = f"{site_url}/api/method/entertainment_express.api.engagement.track?token={token}&kind=open"
        try:
            send(
                "campaign_blast",
                person["email"],
                {
                    "subject": doc.subject or doc.campaign_name,
                    "body": doc.body or "",
                    "open_pixel": pixel,
                },
                channels=[doc.channel],
                party_type="Customer" if person.get("customer") else None,
                party=person.get("customer") or None,
                related_doctype="EE Campaign",
                related_name=doc.name,
            )
            sent += 1
            doc.append("recipients", {"email": person["email"], "customer": person.get("customer"), "status": "sent", "track_token": token})
        except Exception:
            skipped += 1
            doc.append("recipients", {"email": person["email"], "customer": person.get("customer"), "status": "failed", "skip_reason": "send failed", "track_token": token})
    doc.sent_count = sent
    doc.skipped_count = skipped
    doc.status = "sent"
    doc.save(ignore_permissions=True)
    return {"id": doc.name, "sent": sent, "skipped": skipped}


@frappe.whitelist(allow_guest=True)
def track(token: str, kind: str = "open") -> dict:
    token = (token or "").strip()
    if not token or not frappe.db.table_exists("EE Campaign Recipient"):
        return {"ok": 1}
    parent = frappe.db.get_value("EE Campaign Recipient", {"track_token": token}, "parent")
    if not parent:
        return {"ok": 1}
    campaign = frappe.get_doc("EE Campaign", parent)
    for row in campaign.get("recipients") or []:
        if row.track_token != token:
            continue
        if kind == "click" and row.status != "clicked":
            row.status = "clicked"
            campaign.clicked_count = cint(campaign.clicked_count) + 1
        elif kind == "open" and row.status == "sent":
            row.status = "opened"
            campaign.opened_count = cint(campaign.opened_count) + 1
        break
    campaign.save(ignore_permissions=True)
    return {"ok": 1}


@frappe.whitelist()
def list_promos() -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Promo Code"):
        return []
    rows = []
    for row in frappe.get_all("EE Promo Code", fields=["name", "code", "kind", "value", "max_uses", "uses", "expires", "active"], limit_page_length=100):
        rows.append(
            {
                "id": row.name,
                "code": row.code,
                "kind": row.kind,
                "value": _money(row.value) if row.kind == "amount" else f"{flt(row.value)}%",
                "uses": cint(row.uses),
                "max_uses": cint(row.max_uses),
                "expires": str(row.expires or ""),
                "active": bool(cint(row.active)),
            }
        )
    return rows


@frappe.whitelist()
def save_promo(values: dict | str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    code = (values.get("code") or "").strip().upper()
    if not code:
        frappe.throw("Code is required.")
    payload = {
        "code": code,
        "kind": "amount" if values.get("kind") == "amount" else "percent",
        "value": flt(values.get("value") or 0),
        "max_uses": cint(values.get("max_uses") or 100),
        "expires": values.get("expires"),
        "active": 1 if cint(values.get("active", 1)) else 0,
    }
    if frappe.db.exists("EE Promo Code", code):
        doc = frappe.get_doc("EE Promo Code", code)
        doc.update(payload)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "EE Promo Code", **payload})
        doc.insert(ignore_permissions=True)
    return {"id": doc.name, "code": doc.code}


def _apply_promo_doc(promo, quotation: str | None = None, booking: str | None = None, party: str = "") -> dict:
    if not cint(promo.active):
        frappe.throw("That code is off.")
    if promo.expires and getdate(promo.expires) < getdate(nowdate()):
        frappe.throw("That code has expired.")
    if cint(promo.max_uses) and cint(promo.uses) >= cint(promo.max_uses):
        frappe.throw("That code is used up.")
    discount = flt(promo.value)
    if quotation and frappe.db.exists("Quotation", quotation):
        quote = frappe.get_doc("Quotation", quotation)
        if promo.kind == "percent" and quote.meta.has_field("additional_discount_percentage"):
            quote.additional_discount_percentage = discount
        elif quote.meta.has_field("discount_amount"):
            if promo.kind == "percent":
                discount = flt(flt(quote.grand_total) * flt(promo.value) / 100)
            quote.discount_amount = discount
        quote.save(ignore_permissions=True)
    elif booking and frappe.db.exists("Event Booking", booking):
        job = frappe.get_doc("Event Booking", booking)
        total = flt(job.grand_total)
        if promo.kind == "percent":
            discount = flt(total * flt(promo.value) / 100)
        job.grand_total = flt(total) - discount
        job.balance_due = max(flt(0), flt(job.balance_due) - discount)
        job.save(ignore_permissions=True)
    else:
        frappe.throw("Nothing to apply that code to.")
    promo.uses = cint(promo.uses) + 1
    promo.save(ignore_permissions=True)
    frappe.get_doc(
        {
            "doctype": "EE Promo Redemption",
            "promo": promo.name,
            "party": party,
            "amount": discount,
            "quotation": quotation,
            "booking": booking,
        }
    ).insert(ignore_permissions=True)
    return {"code": promo.code, "discount": _money(discount)}


@frappe.whitelist()
def apply_promo(code: str, quotation: str | None = None, booking: str | None = None) -> dict:
    _deny_guest()
    roles = _roles()
    party = frappe.session.user
    if not roles.intersection(STAFF):
        _require_payer()
        from entertainment_express.api.portal_client import _customer_name

        customer = _customer_name()
        party = customer or party
        if not quotation:
            quotation = frappe.db.get_value("Quotation", {"party_name": customer, "docstatus": 0}, "name") if customer else None
        if not booking and customer:
            found = frappe.get_all("Event Booking", filters={"customer": customer}, pluck="name", limit=1, order_by="event_date desc")
            booking = found[0] if found else None
    code = (code or "").strip().upper()
    if not frappe.db.exists("EE Promo Code", code):
        frappe.throw("That code is not valid.")
    return _apply_promo_doc(frappe.get_doc("EE Promo Code", code), quotation=quotation, booking=booking, party=party)


@frappe.whitelist()
def list_referrals() -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Client Referral"):
        return []
    rows = []
    for row in frappe.get_all("EE Client Referral", fields=["name", "referrer", "referred_email", "status", "reward_code"], limit_page_length=100):
        who = frappe.db.get_value("Customer", row.referrer, "customer_name") if row.referrer else ""
        rows.append({"id": row.name, "referrer": who or row.referrer, "email": row.referred_email, "status": row.status, "reward": row.reward_code or ""})
    return rows


@frappe.whitelist()
def save_referral(values: dict | str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    referrer = (values.get("referrer") or "").strip()
    email = (values.get("email") or values.get("referred_email") or "").strip().lower()
    if not referrer or not email:
        frappe.throw("Referrer and email are required.")
    doc = frappe.get_doc({"doctype": "EE Client Referral", "referrer": referrer, "referred_email": email, "status": "invited"})
    doc.insert(ignore_permissions=True)
    return {"id": doc.name}


@frappe.whitelist()
def save_review_url(url: str) -> dict:
    _require_staff()
    if not frappe.db.exists("EE Portal Settings", "EE Portal Settings"):
        frappe.get_doc({"doctype": "EE Portal Settings"}).insert(ignore_permissions=True)
    settings = frappe.get_single("EE Portal Settings")
    if settings.meta.has_field("review_url"):
        settings.review_url = (url or "").strip()
        settings.save(ignore_permissions=True)
    return {"review_url": getattr(settings, "review_url", "") or ""}


@frappe.whitelist()
def get_grow() -> dict:
    _require_staff()
    review_url = ""
    try:
        review_url = frappe.db.get_single_value("EE Portal Settings", "review_url") or ""
    except Exception:
        review_url = ""
    customers = []
    if frappe.db.table_exists("Customer"):
        for row in frappe.get_all("Customer", fields=["name", "customer_name"], limit_page_length=80):
            customers.append({"id": row.name, "name": row.customer_name or row.name})
    return {
        "segments": list_segments(),
        "campaigns": list_campaigns(),
        "promos": list_promos(),
        "referrals": list_referrals(),
        "review_url": review_url,
        "customers": customers,
    }


def run_lifecycle() -> None:
    """Daily: thank-you + review ask on completed jobs; reward first-job referrals."""
    if frappe.db.table_exists("EE Review Request") and frappe.db.table_exists("Event Booking"):
        review_url = ""
        try:
            review_url = frappe.db.get_single_value("EE Portal Settings", "review_url") or ""
        except Exception:
            review_url = ""
        _ensure_templates()
        cutoff = add_days(nowdate(), -14)
        for row in frappe.get_all(
            "Event Booking",
            filters={"status": "completed", "event_date": [">=", cutoff]},
            fields=["name", "customer", "event_name"],
            limit_page_length=200,
        ):
            if frappe.db.exists("EE Review Request", {"booking": row.name}):
                continue
            email = frappe.db.get_value("Customer", row.customer, "email_id") if row.customer else ""
            req = frappe.get_doc(
                {
                    "doctype": "EE Review Request",
                    "booking": row.name,
                    "customer": row.customer,
                    "status": "pending",
                    "review_url": review_url,
                }
            )
            req.insert(ignore_permissions=True)
            if email:
                try:
                    send("thank_you_event", email, {"event_name": row.event_name or row.name}, channels=["email"], party_type="Customer", party=row.customer)
                    if review_url:
                        send(
                            "review_request",
                            email,
                            {"event_name": row.event_name or row.name, "review_url": review_url},
                            channels=["email"],
                            party_type="Customer",
                            party=row.customer,
                        )
                    req.status = "sent"
                    req.sent_at = now_datetime()
                    req.save(ignore_permissions=True)
                except Exception:
                    pass
    if frappe.db.table_exists("EE Client Referral"):
        for row in frappe.get_all("EE Client Referral", filters={"status": ["in", ["invited", "booked"]]}, fields=["name", "referrer", "referred_email"], limit_page_length=200):
            customer = frappe.db.get_value("Customer", {"email_id": row.referred_email}, "name")
            if not customer:
                continue
            done = frappe.db.exists("Event Booking", {"customer": customer, "status": "completed"})
            if not done:
                if frappe.db.exists("Event Booking", {"customer": customer}):
                    frappe.db.set_value("EE Client Referral", row.name, "status", "booked")
                continue
            code = f"THANKS{secrets.token_hex(3).upper()}"
            promo = frappe.get_doc({"doctype": "EE Promo Code", "code": code, "kind": "percent", "value": flt(10), "max_uses": 1, "active": 1})
            promo.insert(ignore_permissions=True)
            ref = frappe.get_doc("EE Client Referral", row.name)
            ref.status = "rewarded"
            ref.reward_code = promo.name
            ref.save(ignore_permissions=True)
            referrer_email = frappe.db.get_value("Customer", row.referrer, "email_id")
            if referrer_email:
                try:
                    send("referral_reward", referrer_email, {"code": code}, channels=["email"], party_type="Customer", party=row.referrer)
                except Exception:
                    pass
