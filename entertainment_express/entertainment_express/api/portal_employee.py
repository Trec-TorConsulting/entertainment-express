import frappe

EMPLOYEE_ROLES = {
    "EE Sales",
    "EE Dispatcher",
    "EE HR",
    "EE Accounting",
    "EE Office",
    "EE Entertainer",
    "EE Crew",
}


def _require_employee() -> set[str]:
    roles = set(frappe.get_roles(frappe.session.user) or [])
    if not roles.intersection(EMPLOYEE_ROLES):
        frappe.throw("Employee portal access denied.", frappe.PermissionError)
    return roles


@frappe.whitelist()
def get_my_day() -> dict:
    roles = _require_employee()

    assignments = []
    tasks = []

    if roles.intersection({"EE Crew", "EE Entertainer", "EE Dispatcher"}):
        assignments = frappe.get_all(
            "Crew Assignment",
            filters={"crew_member": ["in", [frappe.session.user, frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name") or ""]]},
            fields=["name", "booking", "status", "role", "call_time"],
            order_by="modified desc",
            limit_page_length=10,
        )

    if "EE Sales" in roles:
        tasks.extend(
            frappe.get_all(
                "Lead",
                filters={"status": "Open"},
                fields=["name", "lead_name", "status", "modified"],
                order_by="modified desc",
                limit_page_length=10,
            )
        )

    schedule = []
    if roles.intersection({"EE Dispatcher", "EE Crew", "EE Entertainer"}):
        schedule = frappe.get_all(
            "Event Booking",
            filters={"status": ["in", ["confirmed", "in_progress"]]},
            fields=["name", "event_name", "event_date", "start_time", "end_time"],
            order_by="event_date asc, start_time asc",
            limit_page_length=10,
        )

    return {
        "roles": sorted(roles),
        "tasks": tasks,
        "assignments": assignments,
        "schedule": schedule,
    }


@frappe.whitelist()
def search(query: str) -> list[dict]:
    _require_employee()

    text = (query or "").strip()
    if not text:
        return []

    like = f"%{text}%"
    results = []

    bookings = frappe.get_all(
        "Event Booking",
        filters={"name": ["like", like]},
        fields=["name", "event_name", "event_date"],
        limit_page_length=5,
    )
    for row in bookings:
        results.append({
            "type": "booking",
            "id": row.name,
            "label": row.event_name or row.name,
            "meta": str(row.event_date or ""),
            "route": f"/employee/dispatch?booking={row.name}",
        })

    customers = frappe.get_all(
        "Customer",
        filters={"customer_name": ["like", like]},
        fields=["name", "customer_name"],
        limit_page_length=5,
    )
    for row in customers:
        results.append({
            "type": "customer",
            "id": row.name,
            "label": row.customer_name or row.name,
            "meta": "Customer",
            "route": f"/employee/sales?customer={row.name}",
        })

    return results
