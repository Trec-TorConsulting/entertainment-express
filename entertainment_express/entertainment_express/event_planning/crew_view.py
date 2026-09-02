"""Planning, timeline, and music payloads for assigned crew — this site only."""

from __future__ import annotations


def planning(booking_name: str) -> list[dict]:
    import frappe

    if not frappe.db.exists("DocType", "Planning Form Instance"):
        return []
    from entertainment_express.event_planning.forms import serialize_instance

    out = []
    for row in frappe.get_all(
        "Planning Form Instance",
        filters={"booking": booking_name},
        fields=["name"],
    ):
        instance = frappe.get_doc("Planning Form Instance", row.name)
        template = frappe.get_doc("Planning Form Template", instance.template)
        out.append(serialize_instance(instance, template))
    return out


def timeline(booking_name: str) -> dict:
    import frappe

    if not frappe.db.exists("DocType", "Event Timeline"):
        return {"booking": booking_name, "status": "missing", "items": []}
    name = frappe.db.get_value("Event Timeline", {"booking": booking_name}, "name")
    if not name:
        return {"booking": booking_name, "status": "missing", "items": []}
    doc = frappe.get_doc("Event Timeline", name)
    return {
        "name": doc.name,
        "booking": doc.booking,
        "status": doc.status,
        "items": doc.as_dict().get("items") or [],
    }


def music(booking_name: str) -> dict:
    import frappe

    grouped = {"must_play": [], "do_not_play": [], "special_moment": [], "general_request": []}
    if not frappe.db.exists("DocType", "Music Selection"):
        return {"booking": booking_name, "lists": grouped}
    rows = frappe.get_all(
        "Music Selection",
        filters={"booking": booking_name},
        fields=[
            "name",
            "category",
            "moment",
            "song",
            "free_text",
            "requested_by",
            "requester_name",
            "status",
            "notes",
            "in_library",
        ],
        order_by="category, creation",
    )
    for row in rows:
        grouped.setdefault(row["category"] or "general_request", []).append(row)
    return {"booking": booking_name, "lists": grouped}
