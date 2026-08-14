"""Planning form APIs — staff templates, customer save-progress, crew read."""

from __future__ import annotations

import frappe

from entertainment_express.event_planning.forms import is_visible, serialize_instance
from entertainment_express.security.access import assert_booking_access, require_roles


STAFF = ["EE Tenant Admin", "EE Sales", "System Manager"]


@frappe.whitelist()
def save_template(template: dict) -> dict:
    require_roles(*STAFF)
    name = template.get("name")
    if name and frappe.db.exists("Planning Form Template", name):
        doc = frappe.get_doc("Planning Form Template", name)
        doc.update({k: v for k, v in template.items() if k != "fields"})
        doc.set("fields", [])
        for field in template.get("fields") or []:
            doc.append("fields", field)
        doc.save()
    else:
        doc = frappe.get_doc({"doctype": "Planning Form Template", **template})
        doc.insert()
    return {"name": doc.name}


@frappe.whitelist()
def get_form(booking_name: str, instance_name: str | None = None) -> dict:
    assert_booking_access(booking_name)
    filters = {"booking": booking_name}
    if instance_name:
        filters["name"] = instance_name
    name = frappe.db.get_value("Planning Form Instance", filters, "name")
    if not name:
        frappe.throw("No planning form for this booking yet. It appears after the booking is confirmed.")
    instance = frappe.get_doc("Planning Form Instance", name)
    template = frappe.get_doc("Planning Form Template", instance.template)
    return serialize_instance(instance, template)


@frappe.whitelist()
def list_forms(booking_name: str) -> list:
    assert_booking_access(booking_name)
    rows = frappe.get_all(
        "Planning Form Instance",
        filters={"booking": booking_name},
        fields=["name", "template", "status", "completion_percent"],
    )
    for row in rows:
        row["template_name"] = frappe.db.get_value("Planning Form Template", row.template, "template_name")
        row["purpose"] = frappe.db.get_value("Planning Form Template", row.template, "purpose")
    return rows


@frappe.whitelist()
def save_answers(instance_name: str, answers: dict) -> dict:
    instance = frappe.get_doc("Planning Form Instance", instance_name)
    assert_booking_access(instance.booking)
    template = frappe.get_doc("Planning Form Template", instance.template)
    current = {row.field_key: row.value for row in instance.answers}
    current.update({k: ("" if v is None else str(v)) for k, v in (answers or {}).items()})
    instance.set("answers", [])
    for key, value in current.items():
        instance.append("answers", {"field_key": key, "value": value})
    # validate required visible
    from entertainment_express.event_planning.forms import answers_map

    amap = answers_map(instance)
    missing = [
        f.label
        for f in template.fields
        if f.required
        and f.field_type != "section"
        and is_visible(f, amap)
        and not amap.get(f.field_key)
    ]
    instance.save(ignore_permissions=True)
    frappe.db.commit()
    payload = serialize_instance(instance, template)
    payload["missing_required"] = missing
    return payload


@frappe.whitelist()
def send_evaluation(booking_name: str) -> dict:
    require_roles(*STAFF, "EE Dispatcher")
    from entertainment_express.event_planning.attach import attach_forms

    created = attach_forms(booking_name, purpose="evaluation")
    return {"created": created}
