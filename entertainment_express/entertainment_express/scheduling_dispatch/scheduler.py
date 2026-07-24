"""
Scheduling & Dispatch scheduler — called hourly by hooks.py scheduler_events.
"""

import frappe
from frappe.utils import now_datetime, add_to_date


def flag_at_risk_events() -> None:
    """
    Find confirmed bookings within the 48-hour dispatch horizon that have
    no accepted Crew Assignment, and create a Frappe Todo for each dispatcher.
    Idempotent — skips if a Todo for the same booking already exists today.
    """
    from datetime import datetime, timedelta

    now = now_datetime()
    horizon = add_to_date(now, hours=48)
    today = frappe.utils.today()

    # Confirmed bookings starting within 48 hours with no accepted/checked-in crew
    at_risk = frappe.db.sql(
        """
        SELECT eb.name, eb.event_date, eb.start_time, eb.customer
        FROM `tabEvent Booking` eb
        WHERE eb.status = 'confirmed'
          AND TIMESTAMP(eb.event_date, eb.start_time) > %(now)s
          AND TIMESTAMP(eb.event_date, eb.start_time) <= %(horizon)s
          AND NOT EXISTS (
              SELECT 1 FROM `tabCrew Assignment` ca
              WHERE ca.booking = eb.name
                AND ca.status IN ('accepted', 'checked_in')
          )
        """,
        {"now": now, "horizon": horizon},
        as_dict=True,
    )

    if not at_risk:
        return

    # Get dispatcher users
    dispatchers = frappe.get_all(
        "Has Role",
        filters={"role": "EE Dispatcher", "parenttype": "User"},
        fields=["parent"],
    )
    dispatcher_users = [d["parent"] for d in dispatchers]
    if not dispatcher_users:
        dispatcher_users = ["Administrator"]

    for booking in at_risk:
        for user in dispatcher_users:
            # Idempotent: skip if Todo already exists for this booking today
            existing = frappe.db.exists(
                "ToDo",
                {
                    "reference_type": "Event Booking",
                    "reference_name": booking["name"],
                    "owner": user,
                    "date": today,
                },
            )
            if existing:
                continue

            frappe.get_doc({
                "doctype": "ToDo",
                "owner": user,
                "description": (
                    f"⚠️ AT RISK: Booking {booking['name']} on {booking['event_date']} "
                    f"has no accepted crew assignment. Assign crew now."
                ),
                "reference_type": "Event Booking",
                "reference_name": booking["name"],
                "priority": "High",
                "date": today,
            }).insert(ignore_permissions=True)

    if at_risk:
        frappe.db.commit()
