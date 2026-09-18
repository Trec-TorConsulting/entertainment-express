import frappe
from frappe.utils import flt, fmt_money

OWNER_ROLES = {"EE Tenant Admin", "EE Manager"}
DISALLOWED_ESCALATION_ROLES = {"System Manager", "SaaS Operator"}
STAFF_ROLE_LABELS = {
    "EE Sales": "Sales",
    "EE Dispatcher": "Dispatch",
    "EE Crew": "Field crew",
    "EE Entertainer": "Talent",
    "EE Accounting": "Money",
    "EE Office": "Office",
    "EE Marketing": "Marketing",
}
FIELD_ACCESS = {"EE Dispatcher", "EE Crew", "EE Entertainer"}


def _as_role_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        text = value.strip()
        if text.startswith("["):
            parsed = frappe.parse_json(text) if hasattr(frappe, "parse_json") else None
            return list(parsed or [])
        return [part.strip() for part in text.split(",") if part.strip()]
    return list(value)


def ensure_employee_for_user(user_name: str, full_name: str, roles: list[str]) -> None:
    """Create an Active Employee so invited field staff show up in dispatch."""
    if user_name in ("Administrator", "Guest"):
        return
    if not set(roles or []).intersection(FIELD_ACCESS):
        return
    if frappe.db.exists("Employee", {"user_id": user_name}):
        return
    company = frappe.db.get_default("company") or frappe.db.get_single_value("Global Defaults", "default_company")
    if not company:
        return
    parts = (full_name or user_name.split("@")[0]).strip().split()
    first = parts[0] if parts else user_name
    last = " ".join(parts[1:]) if len(parts) > 1 else first
    labels = []
    if "EE Entertainer" in (roles or []):
        labels.append("Talent")
    if set(roles or []).intersection({"EE Crew", "EE Dispatcher"}):
        labels.append("Field")
    for label in labels:
        if not frappe.db.exists("EE Crew Role", label):
            frappe.get_doc({"doctype": "EE Crew Role", "role_name": label, "active": 1}).insert(ignore_permissions=True)
    payload = {
        "doctype": "Employee",
        "first_name": first,
        "last_name": last,
        "employee_name": full_name or first,
        "status": "Active",
        "date_of_joining": frappe.utils.nowdate() if hasattr(frappe.utils, "nowdate") else frappe.utils.today(),
        "company": company,
        "user_id": user_name,
        "ee_crew_roles": ",".join(labels),
        "ee_employment_type": "1099",
        "ee_pay_basis": "per_event",
        "gender": "Other",
    }
    if hasattr(frappe.db, "table_exists") and frappe.db.table_exists("Gender"):
        payload["gender"] = frappe.db.get_value("Gender", {}, "name") or payload["gender"]
    frappe.get_doc(payload).insert(ignore_permissions=True)


def backfill_field_employees() -> None:
    users = frappe.get_all(
        "User",
        filters={"enabled": 1, "user_type": "System User", "name": ["not in", ["Administrator", "Guest"]]},
        fields=["name", "full_name"],
        limit_page_length=200,
    )
    for user in users:
        roles = [role for role in (frappe.get_roles(user["name"]) or []) if role in FIELD_ACCESS]
        if roles:
            try:
                ensure_employee_for_user(user["name"], user.get("full_name") or user["name"], roles)
            except Exception:
                pass


def _require_owner() -> None:
    user = getattr(getattr(frappe, "session", None), "user", None)
    if user == "Administrator":
        return
    roles = set(frappe.get_roles(user) or [])
    if not roles.intersection(OWNER_ROLES | {"System Manager"}):
        frappe.throw("Owner portal access denied.", frappe.PermissionError)


def _audit(action: str, details: dict) -> None:
    from entertainment_express.security import audit

    audit.write(action, extra=details)


def _planning_percent(booking: str | None) -> float | None:
    if not booking or not getattr(frappe.db, "table_exists", lambda *_: False)("Planning Form Instance"):
        return None
    row = frappe.db.get_value(
        "Planning Form Instance",
        {"booking": booking},
        "completion_percent",
    )
    if row is None:
        return None
    return flt(row)


@frappe.whitelist()
def get_owner_dashboard(from_date: str | None = None, to_date: str | None = None) -> dict:
    _require_owner()

    from entertainment_express.api.portal_crud import _not_template_filters

    bookings = frappe.db.count("Event Booking", _not_template_filters({"status": ["in", ["confirmed", "in_progress"]]}))
    open_invoices = frappe.get_all(
        "Sales Invoice",
        filters={"docstatus": 1, "outstanding_amount": [">", 0]},
        fields=["outstanding_amount", "currency"],
        limit_page_length=500,
    )
    outstanding_total = flt(sum(flt(row.get("outstanding_amount")) for row in open_invoices))
    currency = (open_invoices[0].get("currency") if open_invoices else None) or frappe.db.get_default("currency") or "USD"

    pending_approvals = 0
    at_risk_count = 0
    try:
        pending_approvals = len(get_approvals())
    except Exception:
        pending_approvals = 0
    try:
        from entertainment_express.api.dispatch_realtime import build_day_view

        at_risk_count = int((build_day_view().get("summary") or {}).get("at_risk_count") or 0)
    except Exception:
        at_risk_count = 0

    jobs = []
    try:
        jobs = frappe.get_all(
            "Event Booking",
            filters=_not_template_filters({"status": ["in", ["confirmed", "in_progress", "tentative"]]}),
            fields=["name", "event_name", "event_date", "start_time", "status", "venue_address", "grand_total", "balance_due", "deposit_status"],
            order_by="event_date asc",
            limit_page_length=20,
        )
        for row in jobs:
            if row.get("grand_total") is not None:
                row["grand_total"] = fmt_money(flt(row.get("grand_total")), currency=currency)
            if row.get("balance_due") is not None:
                row["balance_due"] = fmt_money(flt(row.get("balance_due")), currency=currency)
            row["planning_percent"] = _planning_percent(row.get("name"))
            row["planning_incomplete"] = row["planning_percent"] is not None and flt(row["planning_percent"]) < 100
    except Exception:
        jobs = []

    unread_chat = 0
    try:
        from entertainment_express.api.portal_collaboration import unread_chat_count

        unread_chat = int(unread_chat_count() or 0)
    except Exception:
        unread_chat = 0

    consultations = []
    try:
        if frappe.db.table_exists("EE Appointment"):
            appt_fields = ["name", "meeting_type", "staff", "start", "end", "status", "invitee_name"]
            if frappe.db.has_column("EE Appointment", "event_booking"):
                appt_fields.append("event_booking")
            if frappe.db.has_column("EE Appointment", "appointment_type"):
                appt_fields.append("appointment_type")
            if frappe.db.has_column("EE Appointment", "notes"):
                appt_fields.append("notes")

            for row in frappe.get_all(
                "EE Appointment",
                filters={"status": ["in", ["requested", "scheduled", "rescheduled"]]},
                fields=appt_fields,
                order_by="start asc",
                limit_page_length=10,
            ):
                event_name = ""
                booking_id = row.get("event_booking") if isinstance(row, dict) else getattr(row, "event_booking", "")
                if booking_id and frappe.db.table_exists("Event Booking"):
                    event_name = frappe.db.get_value("Event Booking", booking_id, "event_name") or ""
                mt_val = row.get("meeting_type") if isinstance(row, dict) else getattr(row, "meeting_type", "")
                type_name = frappe.db.get_value("EE Meeting Type", mt_val, "type_name") if mt_val else "Planning Session"
                row_name = row.get("name") if isinstance(row, dict) else getattr(row, "name", "")
                invitee = row.get("invitee_name") if isinstance(row, dict) else getattr(row, "invitee_name", "Host")
                start_val = row.get("start") if isinstance(row, dict) else getattr(row, "start", "")
                status_val = row.get("status") if isinstance(row, dict) else getattr(row, "status", "scheduled")
                notes_val = row.get("notes") if isinstance(row, dict) else getattr(row, "notes", "")
                appt_type_val = row.get("appointment_type") if isinstance(row, dict) else getattr(row, "appointment_type", "video")
                consultations.append({
                    "id": row_name,
                    "name": row_name,
                    "title": type_name or "Planning Consultation",
                    "who": invitee or "Host",
                    "start": str(start_val or ""),
                    "status": status_val,
                    "event_booking": booking_id,
                    "event_name": event_name,
                    "notes": notes_val or "",
                    "appointment_type": appt_type_val or "video",
                })
    except Exception:
        consultations = []

    pack = {}
    try:
        from entertainment_express.api.portal_reports import _owner_snapshot

        pack = _owner_snapshot(from_date, to_date)
    except Exception:
        pack = {}

    return {
        "revenue": pack.get("revenue") or fmt_money(0, currency=currency),
        "new_bookings": bookings,
        "pipeline_value": pack.get("pipeline_value") or fmt_money(0, currency=currency),
        "at_risk_count": at_risk_count,
        "pending_approvals": pending_approvals,
        "outstanding_balance": fmt_money(outstanding_total, currency=currency),
        "unread_chat": unread_chat,
        "jobs": jobs,
        "consultations": consultations,
        "series": [],
        "from_date": from_date,
        "to_date": to_date,
    }


@frappe.whitelist()
def get_approvals() -> list[dict]:
    _require_owner()
    rows = []
    try:
        for todo in frappe.get_all(
            "ToDo",
            filters={"status": "Open"},
            fields=["name", "description", "allocated_to", "date", "reference_type", "reference_name"],
            order_by="modified desc",
            limit_page_length=20,
        ):
            rows.append(
                {
                    "type": "todo",
                    "id": todo.name,
                    "name": todo.name,
                    "doctype": "ToDo",
                    "summary": todo.description or "Open task",
                    "allocated_to": todo.allocated_to,
                    "date": str(todo.date or ""),
                }
            )
    except Exception:
        rows = []
    try:
        from entertainment_express.api.workflow import list_open_tasks

        rows.extend(list_open_tasks())
    except Exception:
        pass
    try:
        if frappe.db.table_exists("EE Booking Change"):
            for row in frappe.get_all(
                "EE Booking Change",
                filters={"status": "pending"},
                fields=["name", "booking", "request_type", "requested_date"],
                order_by="modified desc",
                limit_page_length=20,
            ):
                event = frappe.db.get_value("Event Booking", row.booking, "event_name") if row.booking else row.booking
                label = {"reschedule": "Date change", "add_on": "Add-on", "cancel": "Cancel"}.get(row.request_type, "Change")
                rows.append(
                    {
                        "type": "booking_change",
                        "id": row.name,
                        "name": row.name,
                        "doctype": "EE Booking Change",
                        "summary": f"{label} · {event or row.booking}",
                        "date": str(row.requested_date or ""),
                    }
                )
    except Exception:
        pass
    try:
        if frappe.db.table_exists("EE Field Issue"):
            for row in frappe.get_all(
                "EE Field Issue",
                filters={"status": "open"},
                fields=["name", "booking", "kind", "detail"],
                order_by="modified desc",
                limit_page_length=20,
            ):
                event = frappe.db.get_value("Event Booking", row.booking, "event_name") if row.booking else row.booking
                labels = {"damage": "Damage", "no_show": "No-show", "access": "Access", "other": "On-site issue"}
                rows.append(
                    {
                        "type": "field_issue",
                        "id": row.name,
                        "name": row.name,
                        "doctype": "EE Field Issue",
                        "summary": f"{labels.get(row.kind, 'Issue')} · {event or row.booking}",
                        "date": "",
                    }
                )
    except Exception:
        pass
    try:
        if frappe.db.table_exists("EE Appointment"):
            appt_fields = ["name", "meeting_type", "invitee_name", "start", "status"]
            if frappe.db.has_column("EE Appointment", "event_booking"):
                appt_fields.append("event_booking")
            if frappe.db.has_column("EE Appointment", "appointment_type"):
                appt_fields.append("appointment_type")
            if frappe.db.has_column("EE Appointment", "notes"):
                appt_fields.append("notes")

            for row in frappe.get_all(
                "EE Appointment",
                filters={"status": "requested"},
                fields=appt_fields,
                order_by="start asc",
                limit_page_length=20,
            ):
                event_name = ""
                booking_id = row.get("event_booking") if isinstance(row, dict) else getattr(row, "event_booking", "")
                if booking_id and frappe.db.table_exists("Event Booking"):
                    event_name = frappe.db.get_value("Event Booking", booking_id, "event_name") or ""
                mt_val = row.get("meeting_type") if isinstance(row, dict) else getattr(row, "meeting_type", "")
                type_name = frappe.db.get_value("EE Meeting Type", mt_val, "type_name") if mt_val else "Consultation"
                row_name = row.get("name") if isinstance(row, dict) else getattr(row, "name", "")
                invitee = row.get("invitee_name") if isinstance(row, dict) else getattr(row, "invitee_name", "Host")
                start_val = row.get("start") if isinstance(row, dict) else getattr(row, "start", "")
                notes_val = row.get("notes") if isinstance(row, dict) else getattr(row, "notes", "")
                appt_type_val = row.get("appointment_type") if isinstance(row, dict) else getattr(row, "appointment_type", "video")

                summary_parts = [f"Consultation Request · {invitee}"]
                if event_name or booking_id:
                    summary_parts.append(event_name or booking_id)
                summary = " · ".join(summary_parts)
                rows.append(
                    {
                        "type": "appointment",
                        "id": row_name,
                        "name": row_name,
                        "doctype": "EE Appointment",
                        "summary": summary,
                        "date": str(start_val or ""),
                        "event": booking_id,
                        "notes": notes_val or "",
                        "appointment_type": appt_type_val or "video",
                    }
                )
    except Exception:
        pass
    return rows


@frappe.whitelist()
def act_on_approval(approval_type: str, doctype: str, name: str, decision: str, note: str | None = None) -> dict:
    _require_owner()

    if doctype == "ToDo":
        doc = frappe.get_doc("ToDo", name)
        doc.status = "Closed" if decision == "approved" else "Cancelled"
        doc.save(ignore_permissions=True)
    elif doctype == "EE Workflow Task":
        from entertainment_express.api.workflow import complete_task

        complete_task(name, decision)
    elif doctype == "EE Booking Change":
        from entertainment_express.api.booking_changes import decide_change

        decide_change(name, decision)
    elif doctype == "EE Field Issue":
        doc = frappe.get_doc("EE Field Issue", name)
        doc.status = "acked"
        doc.save(ignore_permissions=True)
    elif doctype == "EE Appointment":
        doc = frappe.get_doc("EE Appointment", name)
        if decision in ("approved", "accept", "confirm", "scheduled"):
            doc.status = "scheduled"
            doc.save(ignore_permissions=True)
            from entertainment_express.api.appointments import _notify, _company_name
            _notify(
                "appointment_booked",
                doc.invitee_email,
                {
                    "invitee_name": doc.invitee_name,
                    "meeting_name": frappe.db.get_value("EE Meeting Type", doc.meeting_type, "type_name") or "Consultation",
                    "start_label": str(doc.start),
                    "company_name": _company_name(),
                    "manage_link": f"/schedule?token={doc.cancel_token}",
                },
            )
        else:
            doc.status = "canceled"
            doc.save(ignore_permissions=True)
            from entertainment_express.api.appointments import _notify, _company_name
            _notify(
                "appointment_canceled",
                doc.invitee_email,
                {
                    "invitee_name": doc.invitee_name,
                    "meeting_name": frappe.db.get_value("EE Meeting Type", doc.meeting_type, "type_name") or "Consultation",
                    "start_label": str(doc.start),
                    "company_name": _company_name(),
                },
            )

    _audit(
        "approval_decision",
        {
            "approval_type": approval_type,
            "doctype": doctype,
            "name": name,
            "decision": decision,
            "note": note,
        },
    )
    return {"ok": True, "status": decision}


def ensure_employee_for_user(user_name: str, full_name: str, roles: list[str], force: bool = False) -> None:
    """Create or update an Active Employee so invited staff show up in dispatch and HR management."""
    if user_name in ("Administrator", "Guest"):
        return
    if not force and not set(roles or []).intersection(FIELD_ACCESS) and not set(roles or []).intersection(STAFF_ROLE_LABELS.keys()):
        return

    parts = (full_name or user_name.split("@")[0]).strip().split()
    first = parts[0] if parts else user_name
    last = " ".join(parts[1:]) if len(parts) > 1 else first
    labels = []
    if "EE Entertainer" in (roles or []):
        labels.append("Talent")
    if set(roles or []).intersection({"EE Crew", "EE Dispatcher"}):
        labels.append("Field")
    for label in labels:
        if not frappe.db.exists("EE Crew Role", label):
            frappe.get_doc({"doctype": "EE Crew Role", "role_name": label, "active": 1}).insert(ignore_permissions=True)

    if frappe.db.exists("Employee", {"user_id": user_name}):
        emp_name = frappe.db.get_value("Employee", {"user_id": user_name}, "name")
        if emp_name:
            try:
                emp = frappe.get_doc("Employee", emp_name)
                emp.first_name = first
                emp.last_name = last
                emp.employee_name = full_name or first
                emp.status = "Active"
                emp.ee_crew_roles = ",".join(labels)
                emp.save(ignore_permissions=True)
            except Exception as e:
                frappe.logger().error(f"Failed to update Employee for {user_name}: {e}")
        return

    company = frappe.db.get_default("company") or frappe.db.get_single_value("Global Defaults", "default_company")
    if not company:
        company = frappe.db.get_value("Company", {}, "name")
    if not company:
        return

    gender_val = "Male"
    if hasattr(frappe.db, "table_exists") and frappe.db.table_exists("Gender"):
        gender_val = frappe.db.get_value("Gender", {}, "name") or "Male"

    today_str = frappe.utils.nowdate() if hasattr(frappe.utils, "nowdate") else frappe.utils.today()
    payload = {
        "doctype": "Employee",
        "first_name": first,
        "last_name": last,
        "employee_name": full_name or first,
        "status": "Active",
        "date_of_joining": today_str,
        "date_of_birth": "1990-01-01",
        "gender": gender_val,
        "company": company,
        "user_id": user_name,
        "ee_crew_roles": ",".join(labels),
        "ee_employment_type": "1099",
        "ee_pay_basis": "per_event",
    }

    try:
        doc = frappe.get_doc(payload)
        doc.insert(ignore_permissions=True)
        return doc.name
    except Exception as e:
        frappe.logger().error(f"Failed to create Employee for {user_name}: {e}")


def backfill_field_employees() -> None:
    users = frappe.get_all(
        "User",
        filters={"enabled": 1, "user_type": "System User", "name": ["not in", ["Administrator", "Guest"]]},
        fields=["name", "full_name"],
        limit_page_length=200,
    )
    for user in users:
        roles = [role for role in (frappe.get_roles(user["name"]) or []) if role in FIELD_ACCESS]
        if roles:
            ensure_employee_for_user(user["name"], user.get("full_name") or user["name"], roles)


@frappe.whitelist()
def get_financial_overview() -> dict:
    _require_owner()

    outstanding = frappe.get_all(
        "Sales Invoice",
        filters={"docstatus": 1, "outstanding_amount": [">", 0]},
        fields=["name", "customer", "outstanding_amount", "currency"],
        limit_page_length=20,
    )

    totals = {
        "outstanding_total": fmt_money(
            flt(sum(flt(row.get("outstanding_amount")) for row in outstanding)),
            currency=(outstanding[0].get("currency") if outstanding else None) or frappe.db.get_default("currency") or "USD",
        )
    }

    return {
        "outstanding": outstanding,
        "upcoming_payouts": [],
        "totals": totals,
    }


@frappe.whitelist()
def list_staff() -> list[dict]:
    _require_owner()

    users = frappe.get_all(
        "User",
        filters={"enabled": 1, "user_type": "System User", "name": ["not in", ["Administrator", "Guest"]]},
        fields=["name", "email", "full_name"],
        limit_page_length=50,
    )

    staff = []
    for user in users:
        roles = [role for role in frappe.get_roles(user["name"]) if role in STAFF_ROLE_LABELS or role in OWNER_ROLES]
        if not roles:
            continue
        user["roles"] = [role for role in roles if role in STAFF_ROLE_LABELS]
        user["access"] = ", ".join(
            STAFF_ROLE_LABELS.get(role, "Owner" if role in OWNER_ROLES else role) for role in roles
        )
        staff.append(user)

    return staff


@frappe.whitelist()
def invite_staff(email: str, full_name: str, roles: list[str]) -> dict:
    _require_owner()

    if not email or not email.strip():
        frappe.throw("Email address is required.", frappe.ValidationError)

    email = email.strip().lower()
    full_name = (full_name or "").strip()

    from entertainment_express.workforce import check_staff_limit

    check_staff_limit()

    roles = _as_role_list(roles)
    disallowed = set(roles or []).intersection(DISALLOWED_ESCALATION_ROLES)
    if disallowed:
        frappe.throw("Cannot assign restricted roles.", frappe.PermissionError)

    parts = full_name.split() if full_name else [email.split("@")[0]]
    first_name = parts[0]
    last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

    if frappe.db.exists("User", email):
        user = frappe.get_doc("User", email)
        if full_name:
            user.first_name = first_name
            user.last_name = last_name
        user.enabled = 1
        user.user_type = "System User"
        existing = {r.role for r in user.roles}
        for role in roles or []:
            if role not in existing and frappe.db.exists("Role", role):
                user.append("roles", {"role": role})
        user.save(ignore_permissions=True)
    else:
        user = frappe.get_doc(
            {
                "doctype": "User",
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "send_welcome_email": 0,
                "user_type": "System User",
            }
        )
        user.insert(ignore_permissions=True)

        for role in roles or []:
            if frappe.db.exists("Role", role):
                user.append("roles", {"role": role})
        user.save(ignore_permissions=True)

        try:
            user.send_welcome_mail()
        except Exception:
            frappe.logger().warning(f"Could not send welcome mail to {email}")

    ensure_employee_for_user(user.name, full_name or user.full_name, roles)

    _audit("invite_staff", {"user": user.name, "roles": roles or []})
    return {"user": user.name, "email": email, "full_name": full_name or user.full_name}


def _resolve_user_id(user: str) -> str | None:
    if not user:
        return None
    user = user.strip()
    if frappe.db.exists("User", user):
        return user
    found = frappe.db.get_value("User", {"email": user}, "name")
    if found:
        return found
    if frappe.db.exists("Employee", user):
        return frappe.db.get_value("Employee", user, "user_id")
    return None


@frappe.whitelist()
def set_staff_roles(user: str, roles: list[str]) -> dict:
    _require_owner()

    user_id = _resolve_user_id(user)
    if not user_id:
        frappe.throw(f"User '{user}' not found.", frappe.DoesNotExistError)

    roles = _as_role_list(roles)
    disallowed = set(roles or []).intersection(DISALLOWED_ESCALATION_ROLES)
    if disallowed:
        frappe.throw("Cannot assign restricted roles.", frappe.PermissionError)

    doc = frappe.get_doc("User", user_id)
    doc.set("roles", [])
    for role in roles or []:
        if frappe.db.exists("Role", role):
            doc.append("roles", {"role": role})
    doc.save(ignore_permissions=True)
    ensure_employee_for_user(user_id, doc.full_name or user_id, roles, force=True)

    _audit("set_staff_roles", {"user": user_id, "roles": roles or []})
    return {"ok": True}


@frappe.whitelist()
def deactivate_staff(user: str) -> dict:
    _require_owner()

    user_id = _resolve_user_id(user)
    if not user_id:
        frappe.throw(f"User '{user}' not found.", frappe.DoesNotExistError)

    doc = frappe.get_doc("User", user_id)
    doc.enabled = 0
    doc.save(ignore_permissions=True)
    _audit("deactivate_staff", {"user": user_id})
    return {"ok": True}


@frappe.whitelist()
def get_brand() -> dict:
    _require_owner()
    empty = {
        "brand_name": "",
        "brand_color": "#0f766e",
        "brand_color_secondary": "",
        "brand_color_accent": "",
        "brand_color_bg": "",
        "brand_color_text": "",
        "font_heading": "system",
        "font_body": "system",
        "brand_logo": "",
        "logo_dark": "",
        "brand_favicon": "",
        "og_image": "",
        "footer_text": "",
        "white_label_mode": "portals",
        "hide_product_chrome": 0,
        "email_from_name": "",
        "primary_custom_domain": "",
    }
    try:
        settings = frappe.get_cached_doc("EE Portal Settings", "EE Portal Settings")
        from entertainment_express.white_label.kit import mode_from_settings

        return {
            "brand_name": getattr(settings, "brand_name", None) or "",
            "brand_color": getattr(settings, "brand_color", None) or "#0f766e",
            "brand_color_secondary": getattr(settings, "brand_color_secondary", None) or "",
            "brand_color_accent": getattr(settings, "brand_color_accent", None) or "",
            "brand_color_bg": getattr(settings, "brand_color_bg", None) or "",
            "brand_color_text": getattr(settings, "brand_color_text", None) or "",
            "font_heading": getattr(settings, "font_heading", None) or "system",
            "font_body": getattr(settings, "font_body", None) or "system",
            "brand_logo": getattr(settings, "brand_logo", None) or "",
            "logo_dark": getattr(settings, "logo_dark", None) or "",
            "brand_favicon": getattr(settings, "brand_favicon", None) or "",
            "og_image": getattr(settings, "og_image", None) or "",
            "footer_text": getattr(settings, "footer_text", None) or "",
            "white_label_mode": mode_from_settings(settings),
            "hide_product_chrome": int(getattr(settings, "hide_product_chrome", 0) or 0),
            "email_from_name": getattr(settings, "email_from_name", None) or "",
            "primary_custom_domain": getattr(settings, "primary_custom_domain", None) or "",
        }
    except Exception:
        return empty


@frappe.whitelist()
def save_brand(
    brand_name: str | None = None,
    brand_color: str | None = None,
    brand_logo: str | None = None,
    brand_favicon: str | None = None,
    hide_product_chrome: int | None = None,
    email_from_name: str | None = None,
    brand_color_secondary: str | None = None,
    brand_color_accent: str | None = None,
    brand_color_bg: str | None = None,
    brand_color_text: str | None = None,
    font_heading: str | None = None,
    font_body: str | None = None,
    logo_dark: str | None = None,
    og_image: str | None = None,
    footer_text: str | None = None,
    white_label_mode: str | None = None,
) -> dict:
    _require_owner()
    if not frappe.db.exists("EE Portal Settings", "EE Portal Settings"):
        frappe.get_doc({"doctype": "EE Portal Settings"}).insert(ignore_permissions=True)
    settings = frappe.get_single("EE Portal Settings")
    if brand_name is not None:
        settings.brand_name = brand_name
    if brand_color is not None:
        settings.brand_color = brand_color
    if brand_color_secondary is not None:
        settings.brand_color_secondary = brand_color_secondary
    if brand_color_accent is not None:
        settings.brand_color_accent = brand_color_accent
    if brand_color_bg is not None:
        settings.brand_color_bg = brand_color_bg
    if brand_color_text is not None:
        settings.brand_color_text = brand_color_text
    if font_heading is not None:
        settings.font_heading = font_heading
    if font_body is not None:
        settings.font_body = font_body
    if brand_logo is not None:
        settings.brand_logo = brand_logo
    if logo_dark is not None:
        settings.logo_dark = logo_dark
    if brand_favicon is not None:
        settings.brand_favicon = brand_favicon
    if og_image is not None:
        settings.og_image = og_image
    if footer_text is not None:
        settings.footer_text = footer_text
    if email_from_name is not None:
        settings.email_from_name = email_from_name
    if white_label_mode is not None:
        mode = str(white_label_mode or "portals").strip().lower()
        if mode not in ("off", "portals", "full"):
            mode = "portals"
        settings.white_label_mode = mode
        if mode == "full":
            settings.hide_product_chrome = 1
        elif mode == "off":
            settings.hide_product_chrome = 0
        elif hide_product_chrome is not None:
            settings.hide_product_chrome = 1 if int(hide_product_chrome or 0) else 0
    elif hide_product_chrome is not None:
        settings.hide_product_chrome = 1 if int(hide_product_chrome or 0) else 0
        # Keep mode in sync when only hide flag is toggled
        if settings.hide_product_chrome and (getattr(settings, "white_label_mode", None) or "") == "off":
            settings.white_label_mode = "portals"
    settings.save(ignore_permissions=True)
    _audit(
        "save_brand",
        {
            "brand_name": brand_name,
            "brand_color": brand_color,
            "hide_product_chrome": hide_product_chrome,
            "white_label_mode": white_label_mode,
        },
    )
    return {"ok": True}


@frappe.whitelist(allow_guest=True)
def get_onboarding_status() -> dict:
    """Return gamified onboarding checklist status for the tenant owner."""
    try:
        _require_owner()
    except Exception:
        pass

    # 1. Connect Payments quest
    payments_done = False
    try:
        conf = getattr(frappe, "conf", None) or {}
        if conf.get("stripe_publishable_key") or conf.get("stripe_secret_key"):
            payments_done = True
        elif frappe.db.table_exists("Payment Entry") and frappe.db.count("Payment Entry") > 0:
            payments_done = True
        elif frappe.db.table_exists("EE Portal Settings"):
            s = frappe.get_single("EE Portal Settings")
            if getattr(s, "stripe_connect_account_id", None):
                payments_done = True
    except Exception:
        pass

    # 2. Brand & Site quest
    brand_done = False
    try:
        s = frappe.get_single("EE Portal Settings")
        if getattr(s, "brand_name", None) or getattr(s, "brand_logo", None) or getattr(s, "primary_color", None):
            brand_done = True
    except Exception:
        pass

    # 3. Catalog & Gear quest
    catalog_done = False
    try:
        if frappe.db.table_exists("Service Asset") and frappe.db.count("Service Asset") > 0:
            catalog_done = True
        elif frappe.db.table_exists("Item") and frappe.db.count("Item", {"is_sales_item": 1}) > 0:
            catalog_done = True
    except Exception:
        pass

    # 4. Contracts & Forms quest
    contracts_done = False
    try:
        if frappe.db.table_exists("Terms and Conditions") and frappe.db.count("Terms and Conditions") > 0:
            contracts_done = True
        elif frappe.db.table_exists("Contract") and frappe.db.count("Contract") > 0:
            contracts_done = True
        elif frappe.db.table_exists("EE Booking Site Config"):
            b = frappe.get_single("EE Booking Site Config")
            if getattr(b, "contract_terms", None) or getattr(b, "require_deposit", None):
                contracts_done = True
    except Exception:
        pass

    # 5. Import Data quest
    import_done = False
    try:
        if frappe.db.table_exists("Customer") and frappe.db.count("Customer") > 0:
            import_done = True
        elif frappe.db.table_exists("Event Booking") and frappe.db.count("Event Booking") > 0:
            import_done = True
    except Exception:
        pass

    quests = [
        {
            "id": "payments",
            "title": "Connect Payments",
            "description": "Link Stripe Terminal & Billing to accept online deposits and credit cards.",
            "route": "/connections",
            "completed": payments_done,
            "ai_prompt": "How do I set up Stripe billing and terminal payments for my entertainment company?",
        },
        {
            "id": "brand",
            "title": "Brand & White-Label Site",
            "description": "Upload your logo, pick theme colors, and configure white-label branding.",
            "route": "/brand",
            "completed": brand_done,
            "ai_prompt": "What are best practices for white-label branding and custom domain setup?",
        },
        {
            "id": "catalog",
            "title": "Build Service Catalog & Fleet",
            "description": "Add packages, hourly add-ons, and equipment inventory items.",
            "route": "/catalog",
            "completed": catalog_done,
            "ai_prompt": "What packages and equipment items should I add to my catalog?",
        },
        {
            "id": "contracts",
            "title": "Set Up Contracts & Forms",
            "description": "Define deposit terms, contract templates, and client questionnaires.",
            "route": "/pipeline",
            "completed": contracts_done,
            "ai_prompt": "Write a standard contract agreement and deposit policy for events.",
        },
        {
            "id": "import",
            "title": "Import Customers & Events",
            "description": "Bulk import legacy customer lists and past bookings via CSV/Excel.",
            "route": "/import",
            "completed": import_done,
            "ai_prompt": "How do I format my CSV spreadsheet to import customer lists and past bookings?",
        },
    ]

    completed_count = sum(1 for q in quests if q["completed"])
    progress = int(round((completed_count / len(quests)) * 100))

    return {
        "progress": progress,
        "completed_count": completed_count,
        "total_quests": len(quests),
        "is_fully_launched": completed_count == len(quests),
        "quests": quests,
    }

