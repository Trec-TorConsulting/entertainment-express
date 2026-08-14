"""Booking-scoped invites, planning votes, and chat. Membership checked on every call."""

from __future__ import annotations

import frappe

from entertainment_express.notifications import send

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
STAFF_ROLES = {"EE Tenant Admin", "EE Sales", "EE Dispatcher", "System Manager"}
TALENT_ROLES = {"EE Crew", "EE Entertainer"}


def _roles(user: str | None = None) -> set[str]:
    return set(frappe.get_roles(user or frappe.session.user) or [])


def _deny(message: str = "Not allowed for this event.") -> None:
    frappe.throw(message, frappe.PermissionError)


def _customer_emails(customer: str) -> set[str]:
    emails = set()
    if not customer:
        return emails
    row = frappe.db.get_value("Customer", customer, ["email_id", "customer_primary_contact"], as_dict=True) or {}
    if row.get("email_id"):
        emails.add(str(row.email_id).strip().lower())
    contact = row.get("customer_primary_contact")
    if contact:
        cemail = frappe.db.get_value("Contact", contact, "email_id")
        if cemail:
            emails.add(str(cemail).strip().lower())
    return emails


def _is_payer(booking: str, user: str) -> bool:
    customer = frappe.db.get_value("Event Booking", booking, "customer")
    if not customer or user == "Guest":
        return False
    emails = _customer_emails(customer)
    user_email = (frappe.db.get_value("User", user, "email") or user or "").strip().lower()
    return user_email in emails


def _is_assigned_talent(booking: str, user: str) -> bool:
    employee = frappe.db.get_value("Employee", {"user_id": user}, "name")
    if not employee:
        return False
    return bool(
        frappe.db.exists("Crew Assignment", {"booking": booking, "crew_member": employee})
    )


def _is_accepted_guest(booking: str, user: str) -> bool:
    return bool(
        frappe.db.exists(
            "EE Event Invite",
            {"booking": booking, "user": user, "status": "accepted"},
        )
    ) or bool(
        frappe.db.exists(
            "EE Event Invite",
            {"booking": booking, "email": user, "status": ["in", ["invited", "accepted"]]},
        )
    )


def is_booking_member(booking: str, user: str | None = None) -> bool:
    user = user or frappe.session.user
    if not user or user == "Guest" or not booking:
        return False
    roles = _roles(user)
    if roles.intersection(STAFF_ROLES):
        return True
    if _is_payer(booking, user):
        return True
    if roles.intersection(TALENT_ROLES) and _is_assigned_talent(booking, user):
        return True
    if GUEST_ROLE in roles and _is_accepted_guest(booking, user):
        return True
    return False


def _require_member(booking: str) -> None:
    if not is_booking_member(booking):
        _deny()


def _require_payer_or_staff(booking: str) -> None:
    user = frappe.session.user
    roles = _roles()
    if roles.intersection(STAFF_ROLES) or _is_payer(booking, user):
        return
    _deny("Only the customer or staff can do that.")


def _ensure_guest_user(email: str, full_name: str) -> str:
    email = (email or "").strip().lower()
    if frappe.db.exists("User", email):
        user = frappe.get_doc("User", email)
        roles = set(frappe.get_roles(email) or [])
        if PAYER_ROLE in roles or roles.intersection(STAFF_ROLES | {"EE Tenant Admin"}):
            return email
        if GUEST_ROLE not in roles:
            user.append("roles", {"role": GUEST_ROLE})
            user.save(ignore_permissions=True)
        return email

    user = frappe.get_doc(
        {
            "doctype": "User",
            "email": email,
            "first_name": full_name or email.split("@")[0],
            "send_welcome_email": 0,
            "user_type": "Website User",
        }
    )
    user.insert(ignore_permissions=True)
    user.append("roles", {"role": GUEST_ROLE})
    user.save(ignore_permissions=True)
    return user.name


@frappe.whitelist()
def list_my_events() -> list[dict]:
    """Bookings the current user may plan/chat on (payer, accepted guest, or assigned talent)."""
    user = frappe.session.user
    if not user or user == "Guest":
        return []
    names: list[str] = []
    seen: set[str] = set()

    def _add(name: str | None) -> None:
        if name and name not in seen:
            seen.add(name)
            names.append(name)

    email = (frappe.db.get_value("User", user, "email") or user or "").strip().lower()
    for row in frappe.get_all(
        "EE Event Invite",
        filters={"status": ["in", ["invited", "accepted"]], "user": user},
        fields=["booking"],
        ignore_permissions=True,
    ):
        _add(row.booking)
    if email:
        for row in frappe.get_all(
            "EE Event Invite",
            filters={"status": ["in", ["invited", "accepted"]], "email": email},
            fields=["booking"],
            ignore_permissions=True,
        ):
            _add(row.booking)

    roles = _roles(user)
    if PAYER_ROLE in roles and email:
        customers = frappe.get_all("Customer", filters={"email_id": email}, pluck="name", ignore_permissions=True)
        if customers:
            for row in frappe.get_all(
                "Event Booking",
                filters={"customer": ["in", customers]},
                fields=["name"],
                ignore_permissions=True,
            ):
                _add(row.name)

    if roles.intersection(TALENT_ROLES):
        employee = frappe.db.get_value("Employee", {"user_id": user}, "name")
        if employee:
            for row in frappe.get_all(
                "Crew Assignment",
                filters={"crew_member": employee},
                fields=["booking"],
                ignore_permissions=True,
            ):
                _add(row.booking)

    if not names:
        return []
    return frappe.get_all(
        "Event Booking",
        filters={"name": ["in", names]},
        fields=["name", "event_name", "event_date", "status"],
        order_by="event_date desc",
        ignore_permissions=True,
    )


@frappe.whitelist()
def list_invites(booking: str) -> list[dict]:
    _require_member(booking)
    return frappe.get_all(
        "EE Event Invite",
        filters={"booking": booking, "status": ["!=", "revoked"]},
        fields=["name", "email", "full_name", "status", "user"],
    )


@frappe.whitelist()
def invite_guest(booking: str, email: str, full_name: str | None = None) -> dict:
    _require_payer_or_staff(booking)
    email = (email or "").strip().lower()
    if not email:
        _deny("Email is required.")
    existing = frappe.db.get_value("EE Event Invite", {"booking": booking, "email": email}, ["name", "status"], as_dict=True)
    if existing and existing.status != "revoked":
        return {"invite": existing.name, "status": existing.status}

    guest_user = _ensure_guest_user(email, full_name or "")
    if PAYER_ROLE in _roles(guest_user) and guest_user != frappe.session.user:
        # Existing customer account: still invite as guest membership on this booking only.
        pass

    doc = frappe.get_doc(
        {
            "doctype": "EE Event Invite",
            "booking": booking,
            "email": email,
            "full_name": full_name or email,
            "user": guest_user,
            "status": "accepted",
            "invited_by": frappe.session.user,
        }
    )
    doc.insert(ignore_permissions=True)

    try:
        send(
            "event_invite",
            email,
            {
                "full_name": full_name or email,
                "booking": booking,
                "event_name": frappe.db.get_value("Event Booking", booking, "event_name") or booking,
                "link": f"/client/events/{booking}",
            },
            channels=["email"],
            related_doctype="Event Booking",
            related_name=booking,
        )
    except Exception:
        frappe.logger().error("event_invite notification failed")

    return {"invite": doc.name, "user": guest_user, "status": doc.status}


@frappe.whitelist()
def revoke_invite(booking: str, invite: str) -> dict:
    _require_payer_or_staff(booking)
    doc = frappe.get_doc("EE Event Invite", invite)
    if doc.booking != booking:
        _deny()
    doc.status = "revoked"
    doc.save(ignore_permissions=True)
    return {"ok": True}


@frappe.whitelist()
def list_plan_items(booking: str) -> list[dict]:
    _require_member(booking)
    items = frappe.get_all(
        "EE Event Plan Item",
        filters={"booking": booking},
        fields=["name", "title", "item", "source", "status", "notes"],
        order_by="creation desc",
    )
    for row in items:
        row["votes"] = frappe.db.count("EE Event Vote", {"plan_item": row.name})
    return items


@frappe.whitelist()
def suggest_plan_item(booking: str, title: str, item: str | None = None, notes: str | None = None) -> dict:
    _require_member(booking)
    roles = _roles()
    source = "staff"
    if PAYER_ROLE in roles or _is_payer(booking, frappe.session.user):
        source = "client"
    elif GUEST_ROLE in roles:
        source = "guest"
    doc = frappe.get_doc(
        {
            "doctype": "EE Event Plan Item",
            "booking": booking,
            "title": title,
            "item": item,
            "notes": notes,
            "source": source,
            "status": "suggested",
        }
    )
    doc.insert(ignore_permissions=True)
    return {"name": doc.name}


@frappe.whitelist()
def vote_plan_item(booking: str, plan_item: str) -> dict:
    _require_member(booking)
    item = frappe.get_doc("EE Event Plan Item", plan_item)
    if item.booking != booking:
        _deny()
    existing = frappe.db.get_value("EE Event Vote", {"plan_item": plan_item, "user": frappe.session.user})
    if existing:
        return {"name": existing, "votes": frappe.db.count("EE Event Vote", {"plan_item": plan_item})}
    vote = frappe.get_doc({"doctype": "EE Event Vote", "plan_item": plan_item, "user": frappe.session.user, "value": 1})
    vote.insert(ignore_permissions=True)
    return {"name": vote.name, "votes": frappe.db.count("EE Event Vote", {"plan_item": plan_item})}


@frappe.whitelist()
def set_plan_item_status(booking: str, plan_item: str, status: str) -> dict:
    _require_payer_or_staff(booking)
    if status not in {"suggested", "shortlisted", "approved", "rejected"}:
        _deny("Invalid status.")
    doc = frappe.get_doc("EE Event Plan Item", plan_item)
    if doc.booking != booking:
        _deny()
    doc.status = status
    doc.save(ignore_permissions=True)
    return {"ok": True, "status": status}


def _mark_chat_read(booking: str) -> None:
    user = frappe.session.user
    if not user or user == "Guest" or not booking:
        return
    now = frappe.utils.now()
    name = frappe.db.get_value("EE Chat Read State", {"booking": booking, "user": user}, "name")
    if name:
        frappe.db.set_value("EE Chat Read State", name, "last_read", now)
        return
    frappe.get_doc(
        {
            "doctype": "EE Chat Read State",
            "booking": booking,
            "user": user,
            "last_read": now,
        }
    ).insert(ignore_permissions=True)


@frappe.whitelist()
def list_messages(booking: str) -> list[dict]:
    _require_member(booking)
    rows = frappe.get_all(
        "EE Booking Message",
        filters={"booking": booking},
        fields=["name", "author", "message_body", "creation"],
        order_by="creation asc",
        limit_page_length=200,
    )
    try:
        _mark_chat_read(booking)
    except Exception:
        frappe.logger().error("mark_chat_read failed")
    return rows


@frappe.whitelist()
def post_message(booking: str, message_body: str) -> dict:
    _require_member(booking)
    text = (message_body or "").strip()
    if not text:
        _deny("Message is required.")
    doc = frappe.get_doc(
        {
            "doctype": "EE Booking Message",
            "booking": booking,
            "author": frappe.session.user,
            "message_body": text,
        }
    )
    doc.insert(ignore_permissions=True)
    _notify_chat(booking, text)
    return {"name": doc.name}


def _unread_bookings(user: str) -> list[str]:
    names = [row["name"] for row in list_my_events() if row.get("name")]
    roles = _roles(user)
    if roles.intersection(STAFF_ROLES):
        cutoff = frappe.utils.add_to_date(frappe.utils.now(), hours=-48)
        for row in frappe.get_all(
            "EE Booking Message",
            filters={"creation": [">", cutoff], "author": ["!=", user]},
            fields=["booking"],
            limit_page_length=200,
            ignore_permissions=True,
        ):
            if row.booking and row.booking not in names:
                names.append(row.booking)
    return names


@frappe.whitelist()
def unread_chat_count() -> int:
    user = frappe.session.user
    if not user or user == "Guest":
        return 0
    try:
        total = 0
        for booking in _unread_bookings(user):
            last_read = frappe.db.get_value(
                "EE Chat Read State",
                {"booking": booking, "user": user},
                "last_read",
            )
            filters: dict = {"booking": booking, "author": ["!=", user]}
            if last_read:
                filters["creation"] = [">", last_read]
            else:
                filters["creation"] = [">", frappe.utils.add_to_date(frappe.utils.now(), hours=-48)]
            total += int(frappe.db.count("EE Booking Message", filters) or 0)
        return total
    except Exception:
        return 0


def _notify_chat(booking: str, preview: str) -> None:
    try:
        event_name = frappe.db.get_value("Event Booking", booking, "event_name") or booking
        recipients = set()
        customer = frappe.db.get_value("Event Booking", booking, "customer")
        recipients |= _customer_emails(customer or "")
        for row in frappe.get_all("EE Event Invite", filters={"booking": booking, "status": "accepted"}, fields=["email"]):
            if row.email:
                recipients.add(row.email)
        for asg in frappe.get_all("Crew Assignment", filters={"booking": booking}, fields=["crew_member"]):
            user_id = frappe.db.get_value("Employee", asg.crew_member, "user_id")
            if user_id:
                recipients.add(user_id)
        recipients.discard((frappe.session.user or "").lower())
        for rec in recipients:
            send(
                "booking_chat",
                rec,
                {"event_name": event_name, "preview": preview[:140], "booking": booking},
                channels=["email"],
                related_doctype="Event Booking",
                related_name=booking,
            )
    except Exception:
        frappe.logger().error("booking_chat notification failed")
