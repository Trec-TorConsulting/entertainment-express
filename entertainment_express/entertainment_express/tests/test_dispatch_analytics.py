"""
Additional unit tests for dispatch list_available_crew + analytics (phase-4 4.5/4.6).
"""

from datetime import datetime, timedelta

import frappe


class TestDispatchSchedulerAnalytics:
    def test_list_available_crew_excludes_busy(self):
        today = frappe.utils.getdate()
        emp_free = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Free Crew",
            "employee": f"EMP-FREE-{frappe.utils.random_string(4)}",
            "status": "Active",
            "ee_crew_roles": "DJ",
        }).insert()
        emp_busy = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Busy Crew",
            "employee": f"EMP-BUSY-{frappe.utils.random_string(4)}",
            "status": "Active",
            "ee_crew_roles": "DJ",
        }).insert()

        customer = frappe.db.get_value("Customer", {"customer_name": "Dispatcher Test Customer"}, "name")
        if not customer:
            customer = frappe.get_doc({
                "doctype": "Customer",
                "customer_name": "Dispatcher Test Customer",
                "customer_type": "Individual",
            }).insert().name

        booking = frappe.get_doc({
            "doctype": "Event Booking",
            "event_name": "Busy Night",
            "event_date": today,
            "start_time": datetime.combine(today, datetime.strptime("18:00", "%H:%M").time()),
            "end_time": datetime.combine(today, datetime.strptime("22:00", "%H:%M").time()),
            "status": "confirmed",
            "customer": customer,
        }).insert()

        frappe.get_doc({
            "doctype": "Crew Assignment",
            "booking": booking.name,
            "crew_member": emp_busy.name,
            "role": "DJ",
            "status": "accepted",
        }).insert()

        from entertainment_express.api.dispatch import list_available_crew

        frappe.set_user("Administrator")
        available = list_available_crew(event_date=str(today))
        ids = {row["employee"] for row in available}
        assert emp_free.name in ids
        assert emp_busy.name not in ids

    def test_dispatch_analytics_shape(self):
        from entertainment_express.api.dispatch import get_dispatch_analytics

        frappe.set_user("Administrator")
        data = get_dispatch_analytics(days=30)
        assert "utilization_pct" in data
        assert "accept_rate_pct" in data
        assert "reliability_pct" in data
        assert "crew" in data
        assert isinstance(data["crew"], list)
