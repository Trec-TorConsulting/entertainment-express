import frappe

no_cache = 1


def get_context(context):
    """Shell page for the React customer portal SPA."""
    context.no_cache = 1
    context.no_breadcrumbs = 1
    context.no_sidebar = 1
    context.no_header = 1
    context.no_footer = 1
    context.csrf_token = frappe.sessions.get_csrf_token()
    context.portal = "customer"
