import frappe

# Tenant desk should stay white-labeled and EE-focused. Under ee_focus_desk,
# hide all standard non-EE workspaces except a tiny allowlist. The generic ERPNext
# "Home" workspace is intentionally excluded so only Entertainment Express shows.
ALLOWED_STANDARD_WORKSPACES = {
    "Entertainment Express",
}

ALLOWED_MODULES = {
    "Entertainment Express Core",
    "Control Plane",
}


def execute(force: bool = False):
    # Deployment-specific and opt-in: only hide workspaces when the site sets
    # ee_focus_desk. Keeps the app neutral for anyone who installs it elsewhere.
    focus_enabled = frappe.conf.get("ee_focus_desk")
    if focus_enabled is None:
        focus_enabled = frappe.db.get_default("ee_focus_desk")
    if not force and str(focus_enabled).lower() not in {"1", "true", "yes", "on"}:
        return

    has_is_standard = frappe.get_meta("Workspace").has_field("is_standard")
    fields = ["name", "module", "public", "is_hidden"]
    if has_is_standard:
        fields.append("is_standard")

    workspaces = frappe.get_all(
        "Workspace",
        fields=fields,
        limit_page_length=2000,
    )

    for ws in workspaces:
        if has_is_standard:
            if not ws.get("is_standard"):
                # Keep custom tenant workspaces visible unless the tenant chooses otherwise.
                continue
        elif not ws.get("public"):
            # Older schemas may not expose is_standard; keep non-public workspaces visible.
            continue

        if ws.get("name") in ALLOWED_STANDARD_WORKSPACES:
            continue

        if ws.get("module") in ALLOWED_MODULES:
            continue

        # update_modified bumps timestamp past source import version to avoid re-import toggling.
        frappe.db.set_value("Workspace", ws.get("name"), "is_hidden", 1, update_modified=True)

    frappe.clear_cache()
