"""
Cross-app smoke: crew mobile API + customer portal API + dispatch board (task 6.3).

Simulates all three clients against the shared backend: crew check-in pushes
location, customer crew-status reads it, dispatch day-view reflects status.
Also asserts portal/app build artifacts are present for simultaneous use.
"""

from datetime import datetime
from pathlib import Path
from unittest.mock import patch

import frappe

from entertainment_express.api.auth_jwt import issue_token_pair
from entertainment_express.api import mobile_api_v2 as api


_rl = patch("entertainment_express.api.rate_limit.check_rate_limit", return_value=None)

REPO = Path(__file__).resolve().parents[3]


def _tok(sub: str, scopes: list[str]) -> str:
    return issue_token_pair(sub, scopes=scopes)["access_token"]


class TestCrossAppSmoke:
    """Crew + customer + dispatch share one booking in real time."""

    @_rl
    def test_crew_checkin_visible_to_customer_and_dispatch(self):
        customer = frappe.db.get_value(
            "Customer", {"customer_name": "CUS-CROSS-APP-SMOKE"}, "name"
        )
        if not customer:
            customer = frappe.get_doc({
                "doctype": "Customer",
                "customer_name": "CUS-CROSS-APP-SMOKE",
                "customer_type": "Individual",
            }).insert().name

        today = frappe.utils.getdate()
        emp = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Cross App Crew",
            "employee": f"EMP-XAPP-{frappe.utils.random_string(5)}",
            "status": "Active",
        }).insert()

        booking = frappe.get_doc({
            "doctype": "Event Booking",
            "event_name": f"Cross App Smoke {frappe.utils.random_string(4)}",
            "event_date": today,
            "start_time": datetime.combine(today, datetime.strptime("18:00", "%H:%M").time()),
            "end_time": datetime.combine(today, datetime.strptime("22:00", "%H:%M").time()),
            "status": "confirmed",
            "customer": customer,
        }).insert()

        ca = frappe.get_doc({
            "doctype": "Crew Assignment",
            "booking": booking.name,
            "crew_member": emp.name,
            "role": "DJ",
            "status": "offered",
        }).insert()

        crew_tok = _tok(emp.name, ["crew_read", "crew_write"])
        cust_tok = _tok(customer, ["customer_read", "customer_write"])
        dispatch_tok = _tok("Administrator", ["dispatch_read", "dispatch_write"])

        # --- Crew app ---
        assert api.crew_shift_accept(assignment_id=ca.name, token=crew_tok)["status"] == "success"
        cin = api.crew_check_in(
            assignment_id=ca.name,
            latitude=37.7749,
            longitude=-122.4194,
            token=crew_tok,
        )
        assert cin["status"] == "success", cin

        ping = api.crew_location_ping(
            assignment_id=ca.name,
            latitude=37.7750,
            longitude=-122.4195,
            token=crew_tok,
        )
        assert ping["status"] == "success", ping

        # --- Customer portal ---
        status = api.customer_crew_status(booking_id=booking.name, token=cust_tok)
        assert status["status"] == "success", status
        crew_rows = status["data"]["crew"]
        assert any(r["assignment_id"] == ca.name for r in crew_rows)
        tracked = next(r for r in crew_rows if r["assignment_id"] == ca.name)
        assert tracked["status"] == "checked_in"
        assert tracked["latitude"] is not None
        assert abs(tracked["latitude"] - 37.7750) < 0.01

        msg = api.customer_post_message(
            booking_id=booking.name,
            message="Looking forward to the event!",
            token=cust_tok,
        )
        assert msg["status"] == "success", msg

        # --- Dispatch portal ---
        frappe.set_user("Administrator")
        day = api.dispatch_day_view(token=dispatch_tok, event_date=str(today))
        assert day["status"] == "success", day
        bookings = day["data"].get("bookings") or []
        matched = [b for b in bookings if b.get("name") == booking.name]
        assert matched, f"booking {booking.name} missing from day view"
        found = matched[0]
        assignments = found.get("crew_assignments") or []
        ours = [a for a in assignments if a.get("name") == ca.name]
        assert ours, "assignment missing from dispatch crew_assignments"
        assert ours[0]["status"] == "checked_in"
        assert ours[0].get("location") is not None
        assert abs(ours[0]["location"]["latitude"] - 37.7750) < 0.01

        sub = api.dispatch_board_subscribe(token=dispatch_tok, event_date=str(today))
        assert sub["status"] == "success"
        assert sub["data"].get("subscribed") is True or "events" in sub["data"]

    def test_portal_and_crew_app_artifacts_exist(self):
        """All three frontends are present so they can run simultaneously."""
        customer_bundle = REPO / "entertainment_express" / "entertainment_express" / "public" / "client" / "main.js"
        dispatch_bundle = REPO / "entertainment_express" / "entertainment_express" / "public" / "dispatch" / "main.js"
        customer_pkg = REPO / "frontend" / "customer-portal" / "package.json"
        dispatch_pkg = REPO / "frontend" / "dispatch-portal" / "package.json"
        crew_pkg = REPO / "frontend" / "crew-app" / "package.json"

        assert customer_bundle.is_file(), f"missing {customer_bundle}"
        assert dispatch_bundle.is_file(), f"missing {dispatch_bundle}"
        assert customer_pkg.is_file()
        assert dispatch_pkg.is_file()
        assert crew_pkg.is_file()
        assert customer_bundle.stat().st_size > 1000
        assert dispatch_bundle.stat().st_size > 1000
