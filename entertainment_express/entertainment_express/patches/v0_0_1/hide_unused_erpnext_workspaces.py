import frappe

# ERPNext ships a broad set of public Desk workspaces (supply-chain, manufacturing,
# CRM, etc.). A mobile-entertainment SaaS does not use these, so we hide them from the
# Desk sidebar to keep it focused on Entertainment Express. Hidden workspaces are still
# reachable directly by URL — this only removes the sidebar clutter.
HIDDEN_WORKSPACES = [
    "Buying",
    "Selling",
    "Stock",
    "Manufacturing",
    "Assets",
    "Quality",
    "Projects",
    "Support",
    "CRM",
]


def execute():
    for name in HIDDEN_WORKSPACES:
        if frappe.db.exists("Workspace", name):
            # update_modified bumps the record's timestamp past the ERPNext source file
            # so later migrates skip re-importing (which would otherwise un-hide it).
            frappe.db.set_value("Workspace", name, "is_hidden", 1, update_modified=True)
    frappe.clear_cache()
