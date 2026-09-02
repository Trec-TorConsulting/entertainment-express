import frappe


def get_context(context):
    context.no_cache = 1
    try:
        from entertainment_express.api.appointments import list_types

        context.meeting_types = list_types()
    except Exception:
        context.meeting_types = []
    context.logged_in = bool(frappe.session.user and frappe.session.user != "Guest")
