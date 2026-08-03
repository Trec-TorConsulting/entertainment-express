import frappe


MARKETING_PAGE_ROUTE = "company-story"


def run():
    """Seed one CMS-managed Web Page for marketing content editing."""
    if not frappe.db.exists("DocType", "Web Page"):
        return

    if frappe.db.exists("Web Page", {"route": MARKETING_PAGE_ROUTE}):
        return

    meta = frappe.get_meta("Web Page")
    values = {
        "doctype": "Web Page",
    }

    if meta.has_field("title"):
        values["title"] = "Company Story"
    if meta.has_field("route"):
        values["route"] = MARKETING_PAGE_ROUTE
    if meta.has_field("published"):
        values["published"] = 1
    if meta.has_field("content_type"):
        values["content_type"] = "Rich Text"
    if meta.has_field("main_section"):
        values["main_section"] = (
            "<h1>Our Company Story</h1>"
            "<p>This page is CMS-managed in Frappe Desk and can be edited without a deploy.</p>"
        )

    frappe.get_doc(values).insert(ignore_permissions=True)
    frappe.db.commit()
