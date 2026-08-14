"""Planning-form reminders and post-event evaluation sweep."""

from __future__ import annotations

import frappe
from frappe.utils import now_datetime, getdate, add_days


def send_form_reminders():
    today = getdate()
    rows = frappe.get_all(
        "Planning Form Instance",
        filters={"status": ["!=", "complete"]},
        fields=["name", "booking", "template", "last_reminder_sent", "status"],
    )
    for row in rows:
        booking = frappe.db.get_value(
            "Event Booking",
            row.booking,
            ["event_date", "customer", "status"],
            as_dict=True,
        )
        if not booking or booking.status == "canceled":
            continue
        if booking.event_date and getdate(booking.event_date) < today:
            continue
        cadence = frappe.db.get_value("Planning Form Template", row.template, "reminder_cadence_days") or 3
        if row.last_reminder_sent:
            next_due = add_days(getdate(row.last_reminder_sent), int(cadence))
            if today < next_due:
                continue
        email = frappe.db.get_value("Customer", booking.customer, "email_id")
        if not email:
            continue
        from entertainment_express.notifications import send

        send(
            "planning_form_reminder",
            email,
            {
                "customer_name": booking.customer,
                "booking_name": row.booking,
                "form_link": f"/client/planning?booking={row.booking}",
            },
        )
        frappe.db.set_value("Planning Form Instance", row.name, "last_reminder_sent", now_datetime())
    frappe.db.commit()
