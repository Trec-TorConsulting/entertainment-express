"""Planning-form completion and conditional visibility."""

from __future__ import annotations

from typing import Any


def answers_map(instance) -> dict[str, str]:
    out: dict[str, str] = {}
    for row in instance.answers or []:
        out[row.field_key] = (row.value or "").strip()
    return out


def is_visible(field, answers: dict[str, str]) -> bool:
    if not getattr(field, "conditional_on_field", None):
        return True
    expected = str(getattr(field, "conditional_on_value", "") or "").strip().lower()
    actual = str(answers.get(field.conditional_on_field, "")).strip().lower()
    return actual == expected


def compute_completion(instance) -> None:
    import frappe

    template_name = instance.template
    if not template_name:
        instance.completion_percent = 0
        return
    template = frappe.get_doc("Planning Form Template", template_name)
    answers = answers_map(instance)
    required = [f for f in template.fields if f.required and f.field_type != "section" and is_visible(f, answers)]
    if not required:
        instance.completion_percent = 100.0 if answers else 0.0
    else:
        filled = sum(1 for f in required if answers.get(f.field_key))
        instance.completion_percent = round(100.0 * filled / len(required), 1)
    if instance.completion_percent >= 100:
        instance.status = "complete"
    elif answers:
        instance.status = "in_progress"
    else:
        instance.status = "not_started"


def serialize_instance(instance, template) -> dict[str, Any]:
    answers = answers_map(instance)
    fields = []
    for f in template.fields:
        visible = is_visible(f, answers)
        fields.append(
            {
                "field_key": f.field_key,
                "label": f.label,
                "field_type": f.field_type,
                "options": [o.strip() for o in (f.options or "").split(",") if o.strip()],
                "required": bool(f.required) and visible,
                "help_text": f.help_text or "",
                "conditional_on_field": f.conditional_on_field or "",
                "conditional_on_value": f.conditional_on_value or "",
                "visible": visible,
                "value": answers.get(f.field_key, ""),
            }
        )
    return {
        "name": instance.name,
        "booking": instance.booking,
        "template": template.name,
        "template_name": template.template_name,
        "purpose": template.purpose,
        "status": instance.status,
        "completion_percent": instance.completion_percent,
        "fields": fields,
    }
