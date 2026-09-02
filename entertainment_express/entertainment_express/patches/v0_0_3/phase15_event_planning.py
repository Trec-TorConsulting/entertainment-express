"""Seed a wedding questionnaire and reception run-of-show when the site has none."""


def execute():
    import frappe

    if not frappe.db.exists("DocType", "Planning Form Template"):
        return
    if not frappe.db.exists("Planning Form Template", {"event_type": "wedding", "purpose": "planning"}):
        frappe.get_doc(
            {
                "doctype": "Planning Form Template",
                "template_name": "Wedding details",
                "event_type": "wedding",
                "purpose": "planning",
                "active": 1,
                "reminder_cadence_days": 3,
                "fields": [
                    {
                        "field_key": "ceremony",
                        "label": "Does this event include a ceremony?",
                        "field_type": "select",
                        "options": "Yes,No",
                        "required": 1,
                    },
                    {
                        "field_key": "officiant",
                        "label": "Officiant name and pronunciation",
                        "field_type": "text",
                        "required": 1,
                        "conditional_on_field": "ceremony",
                        "conditional_on_value": "Yes",
                    },
                    {
                        "field_key": "pronunciations",
                        "label": "Names to announce and how to say them",
                        "field_type": "long_text",
                        "required": 1,
                    },
                    {
                        "field_key": "guest_count",
                        "label": "Guest count",
                        "field_type": "number",
                    },
                    {
                        "field_key": "special_notes",
                        "label": "Anything else the team should know",
                        "field_type": "long_text",
                    },
                ],
            }
        ).insert(ignore_permissions=True)

    if not frappe.db.exists("DocType", "Timeline Template"):
        return
    if not frappe.db.exists("Timeline Template", {"event_type": "wedding"}):
        frappe.get_doc(
            {
                "doctype": "Timeline Template",
                "template_name": "Wedding reception",
                "event_type": "wedding",
                "active": 1,
                "items": [
                    {"offset_minutes": 0, "duration_minutes": 15, "title": "Grand entrance"},
                    {
                        "offset_minutes": 15,
                        "duration_minutes": 10,
                        "title": "First dance",
                        "moment_key": "first_dance",
                    },
                    {"offset_minutes": 30, "duration_minutes": 15, "title": "Toasts"},
                    {"offset_minutes": 45, "duration_minutes": 45, "title": "Dinner"},
                    {"offset_minutes": 210, "duration_minutes": 10, "title": "Last song"},
                ],
            }
        ).insert(ignore_permissions=True)
