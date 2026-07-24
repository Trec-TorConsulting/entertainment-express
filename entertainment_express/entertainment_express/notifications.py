"""
Notification sender for Entertainment Express.

All sends are enqueued (never block web requests).
Templates stored in `Notification Template` DocType.

Usage:
    from entertainment_express.notifications import send
    send("quote_sent", "customer@example.com", {
        "customer_name": "Jane Smith",
        "company_name": "Awesome DJs LLC",
        "quote_link": "https://...",
    })
"""

import frappe


def send(template_key: str, recipient: str, context: dict) -> None:
    """
    Render a Notification Template and enqueue email delivery.

    Args:
        template_key: The template_key field of a Notification Template record.
        recipient:    Destination email address.
        context:      Jinja2 template variables.

    The send is always asynchronous (frappe.enqueue) — this function returns
    immediately and never blocks the calling web request.
    """
    frappe.enqueue(
        "entertainment_express.notifications._send_now",
        template_key=template_key,
        recipient=recipient,
        context=context,
        queue="short",
        is_async=True,
    )


def _send_now(template_key: str, recipient: str, context: dict) -> None:
    """Background worker: render template and send via Frappe email queue."""
    template_name = frappe.db.get_value(
        "Notification Template", {"template_key": template_key, "active": 1}, "name"
    )
    if not template_name:
        frappe.logger().warning(
            f"[EE notifications] No active template for key '{template_key}'"
        )
        return

    tmpl = frappe.get_doc("Notification Template", template_name)

    subject = frappe.render_template(tmpl.subject, context)
    body = frappe.render_template(tmpl.body_html, context)

    frappe.sendmail(
        recipients=[recipient],
        subject=subject,
        message=body,
        reference_doctype="Notification Template",
        reference_name=template_name,
        now=True,  # already in background worker
    )
