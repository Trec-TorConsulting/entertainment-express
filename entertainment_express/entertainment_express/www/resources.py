import frappe
from entertainment_express.www import blog


def get_context(context):
    # Populate context via modern blog context
    blog.get_context(context)

    # Issue 301 redirect to canonical /blog route if running in Frappe HTTP context
    if getattr(frappe, "local", None) and hasattr(frappe.local, "flags"):
        frappe.local.flags.redirect_location = "/blog"
        if hasattr(frappe, "Redirect"):
            raise frappe.Redirect

