"""Fleet expiry, maintenance due, and reorder alerts."""

from __future__ import annotations

import frappe
from frappe.utils import add_days, getdate


def daily_fleet_alerts():
    horizon = add_days(getdate(), 30)
    today = getdate()
    from entertainment_express.notifications import send
    from entertainment_express.api.fleet_ops import _admin_emails

    emails = _admin_emails()
    if not emails:
        return

    def alert(title, detail):
        for email in emails:
            send("fleet_alert", email, {"title": title, "detail": detail})

    for veh in frappe.get_all(
        "Vehicle",
        filters={"status": ["!=", "out_of_service"]},
        fields=["name", "vehicle_name", "registration_expiry", "insurance_expiry"],
    ):
        if veh.registration_expiry and getdate(veh.registration_expiry) <= horizon:
            alert("Registration expiry", f"{veh.vehicle_name} registration expires {veh.registration_expiry}.")
        if veh.insurance_expiry and getdate(veh.insurance_expiry) <= horizon:
            alert("Insurance expiry", f"{veh.vehicle_name} insurance expires {veh.insurance_expiry}.")

    for m in frappe.get_all(
        "Maintenance Record",
        filters={"status": ["in", ["open", "scheduled"]], "due_on": ["<=", horizon]},
        fields=["name", "due_on", "asset", "vehicle"],
    ):
        alert("Maintenance due", f"{m.name} due {m.due_on} ({m.asset or m.vehicle}).")

    for bal in frappe.get_all(
        "Stock Balance",
        fields=["item_code", "location", "qty", "reorder_level"],
    ):
        if bal.reorder_level and bal.qty <= bal.reorder_level:
            alert("Low stock", f"{bal.item_code} at {bal.location} is {bal.qty}.")
