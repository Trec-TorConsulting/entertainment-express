"""
Tenant bootstrap — runs INSIDE the tenant site after app installation.

Creates: EE roles/perms, ERPNext Company, default Service Area, starter catalog,
         tenant admin user, email defaults.

All operations are idempotent (skip if already exists).

Invoked by the provisioner after migrate as a subprocess (so it never tears down
the control-plane job's frappe context):
    bench --site <tenant> execute \
        entertainment_express.control_plane.bootstrap.run_bootstrap --kwargs '{...}'
"""

import frappe
from frappe.utils import now_datetime

from entertainment_express.setup.fiscal_year import ensure_active_fiscal_year


def run(site_name: str, tenant_doc) -> None:
    """
    Standalone entry point: switch into the tenant site and run all bootstrap steps.

    WARNING: This calls frappe.destroy(), so it must NOT be invoked from within a
    background job already bound to another site — it would tear down that job's
    frappe.local. The provisioner runs bootstrap via `bench ... execute
    run_bootstrap` in a subprocess instead (see run_bootstrap below).
    """
    frappe.init(site=site_name)
    frappe.connect()
    try:
        _run_steps(frappe._dict(
            company_name=tenant_doc.company_name,
            primary_email=getattr(tenant_doc, "primary_email", None),
            contact_email=getattr(tenant_doc, "contact_email", None),
            primary_contact=getattr(tenant_doc, "primary_contact", None),
        ))
        frappe.db.commit()
    finally:
        frappe.destroy()


def run_bootstrap(company_name: str, primary_email: str = "", primary_contact: str = "") -> None:
    """
    Entry point for `bench --site <tenant> execute`. Runs in the tenant site
    context already established by bench — never calls frappe.init/connect/destroy,
    so it is safe to invoke as a subprocess from the control-plane provisioning job.
    """
    import traceback

    try:
        _run_steps(frappe._dict(
            company_name=company_name,
            primary_email=primary_email or None,
            contact_email=primary_email or None,
            primary_contact=primary_contact or None,
        ))
        frappe.db.commit()
    except Exception:
        # `bench execute` swallows the real exception and re-raises a misleading
        # NameError from its eval fallback, so print the true traceback here to
        # keep it in the captured subprocess output / Provisioning Job log.
        traceback.print_exc()
        raise


def _run_steps(ctx) -> None:
    """Run every idempotent bootstrap step against the current (tenant) site."""
    _ensure_erpnext_baseline()
    _ensure_setup_complete()
    _ensure_company(ctx)
    _ensure_usd_selling_defaults(ctx)
    _ensure_current_fiscal_year(ctx)
    _ensure_roles_permissions()
    _ensure_focus_desk_mode()
    _ensure_default_service_area()
    _ensure_starter_catalog()
    _ensure_starter_packages()
    _ensure_default_contract_template()
    _ensure_notification_templates()
    _ensure_tenant_admin(ctx)
    _ensure_email_defaults()


def _ensure_erpnext_baseline() -> None:
    """Seed the ERPNext master-data baseline the setup wizard normally creates.

    Automated provisioning installs erpnext but never runs the setup wizard, so a
    fresh tenant has zero Item Groups/UOMs/Warehouse Types. Company creation then
    fails in create_default_warehouses() (links to Warehouse Type "Transit"), and
    the starter catalog needs Item Group "Services". Delegating to ERPNext's own
    installer keeps us aligned with upstream defaults; it is idempotent (skips
    records that already exist), so re-running is safe.
    """
    if frappe.db.exists("Warehouse Type", "Transit") and frappe.db.exists("Item Group", "Services"):
        return
    from erpnext.setup.setup_wizard.operations.install_fixtures import install as install_erpnext_fixtures

    install_erpnext_fixtures(country="United States")


def _ensure_setup_complete() -> None:
    """Mark the setup wizard complete. Provisioning configures the site
    programmatically, so without this System Users are redirected to
    /app/setup-wizard on login and non-admins hit "Not permitted"."""
    if not frappe.db.get_single_value("System Settings", "setup_complete"):
        frappe.db.set_single_value("System Settings", "setup_complete", 1)


# ── Bootstrap steps ──────────────────────────────────────────────────────────

def _ensure_company(tenant_doc) -> None:
    company_name = tenant_doc.company_name
    if frappe.db.exists("Company", company_name):
        return
    company = frappe.get_doc({
        "doctype": "Company",
        "company_name": company_name,
        "abbr": _make_abbr(company_name),
        "default_currency": "USD",
        "country": "United States",
    })
    company.insert(ignore_permissions=True)
    frappe.db.set_single_value("Global Defaults", "default_company", company_name)


def _ensure_usd_selling_defaults(tenant_doc) -> None:
    """ERPNext fixtures can leave selling in INR even when Company is USD.

    Without this, Quotation insert fails: Currency Exchange is not created for INR to USD.
    """
    frappe.db.set_single_value("Global Defaults", "default_currency", "USD")
    frappe.db.set_default("currency", "USD")
    pl_name = frappe.db.get_value("Price List", {"currency": "USD", "selling": 1}, "name")
    if not pl_name:
        if not frappe.db.exists("Price List", "Standard Selling"):
            frappe.get_doc({
                "doctype": "Price List",
                "price_list_name": "Standard Selling",
                "currency": "USD",
                "selling": 1,
                "enabled": 1,
            }).insert(ignore_permissions=True)
            pl_name = "Standard Selling"
        else:
            frappe.db.set_value("Price List", "Standard Selling", "currency", "USD")
            pl_name = "Standard Selling"
    frappe.db.set_single_value("Selling Settings", "selling_price_list", pl_name)
    if not frappe.db.exists("Currency Exchange", {"from_currency": "INR", "to_currency": "USD"}):
        try:
            frappe.get_doc({
                "doctype": "Currency Exchange",
                "from_currency": "INR",
                "to_currency": "USD",
                "exchange_rate": 0.012,
                "date": frappe.utils.today(),
            }).insert(ignore_permissions=True)
        except Exception:
            frappe.log_error(title="EE bootstrap currency exchange")


def _ensure_current_fiscal_year(tenant_doc) -> None:
    ensure_active_fiscal_year(company_name=tenant_doc.company_name)


def _ensure_roles_permissions() -> None:
    """EE roles are loaded via fixtures/role.json on migrate — nothing to add here."""
    pass


def _ensure_focus_desk_mode() -> None:
    """Keep tenant Desk focused on Entertainment Express-only workspaces."""
    frappe.defaults.set_global_default("ee_focus_desk", 1)
    from entertainment_express.patches.v0_0_1.hide_unused_erpnext_workspaces import execute

    execute(force=True)


def _ensure_default_service_area() -> None:
    if frappe.db.exists("Service Area", {"area_name": "Default Service Area"}):
        return
    area = frappe.get_doc({
        "doctype": "Service Area",
        "area_name": "Default Service Area",
        "match_type": "zip_list",
        "zips": "",
        "travel_fee": 0,
        "active": 1,
        "out_of_area_policy": "flag_for_review",
    })
    area.insert(ignore_permissions=True)


def _ensure_starter_catalog() -> None:
    """Create starter Service Items for common mobile entertainment verticals."""
    starter_items = [
        {
            "item_name": "DJ/MC Performance — 5 Hours",
            "item_code": "EE-DJMC-5HR",
            "item_group": "Services",
            "is_service_item": 1,
            "ee_item_type": "service",
            "ee_vertical_tag": "dj",
            "ee_duration_minutes": 300,
            "ee_unit": "event",
            "ee_requires_crew_role": None,
            "standard_rate": 1200.0,
        },
        {
            "item_name": "DJ Add-on: Extra Hour",
            "item_code": "EE-DJ-EXTRA-HR",
            "item_group": "Services",
            "is_service_item": 1,
            "ee_item_type": "addon",
            "ee_vertical_tag": "dj",
            "ee_unit": "hour",
            "standard_rate": 150.0,
        },
        {
            "item_name": "Photo Booth — 4 Hours",
            "item_code": "EE-BOOTH-4HR",
            "item_group": "Services",
            "is_service_item": 1,
            "ee_item_type": "service",
            "ee_vertical_tag": "photo_booth",
            "ee_duration_minutes": 240,
            "ee_unit": "event",
            "ee_requires_crew_role": None,
            "standard_rate": 700.0,
        },
        {
            "item_name": "Audio + Lighting Rental",
            "item_code": "EE-AVL-RENTAL",
            "item_group": "Services",
            "is_service_item": 1,
            "ee_item_type": "service",
            "ee_vertical_tag": "av_lighting",
            "ee_duration_minutes": 240,
            "ee_unit": "event",
            "ee_requires_crew_role": None,
            "standard_rate": 900.0,
        },
        {
            "item_name": "Game Truck Experience — 2 Hours",
            "item_code": "EE-GAME-TRUCK-2HR",
            "item_group": "Services",
            "is_service_item": 1,
            "ee_item_type": "service",
            "ee_vertical_tag": "game_truck",
            "ee_duration_minutes": 120,
            "ee_unit": "event",
            "ee_requires_crew_role": None,
            "standard_rate": 950.0,
        },
        {
            "item_name": "Karaoke Experience — 4 Hours",
            "item_code": "EE-KARAOKE-4HR",
            "item_group": "Services",
            "is_service_item": 1,
            "ee_item_type": "service",
            "ee_vertical_tag": "karaoke",
            "ee_duration_minutes": 240,
            "ee_unit": "event",
            "ee_requires_crew_role": None,
            "standard_rate": 650.0,
        },
        {
            "item_name": "Casino Entertainment — 3 Hours",
            "item_code": "EE-CASINO-3HR",
            "item_group": "Services",
            "is_service_item": 1,
            "ee_item_type": "service",
            "ee_vertical_tag": "casino",
            "ee_duration_minutes": 180,
            "ee_unit": "event",
            "ee_requires_crew_role": None,
            "standard_rate": 1100.0,
        },
        {
            "item_name": "Travel Fee",
            "item_code": "EE-TRAVEL-FEE",
            "item_group": "Services",
            "is_service_item": 1,
            "ee_item_type": "addon",
            "ee_vertical_tag": "travel",
            "ee_unit": "unit",
            "ee_requires_crew_role": None,
            "standard_rate": 75.0,
        },
        {
            "item_name": "Uplighting Add-on",
            "item_code": "EE-UPLIGHTING",
            "item_group": "Services",
            "is_service_item": 1,
            "ee_item_type": "addon",
            "ee_vertical_tag": "lighting",
            "ee_unit": "event",
            "ee_requires_crew_role": None,
            "standard_rate": 250.0,
        },
    ]
    for item_def in starter_items:
        if frappe.db.exists("Item", item_def["item_code"]):
            continue
        # ERPNext requires a real stock_uom even for service items; ee_unit is the
        # separate EE billing unit. "Nos" is seeded by the ERPNext baseline.
        item_def.setdefault("stock_uom", "Nos")
        item = frappe.get_doc({"doctype": "Item", **item_def})
        item.insert(ignore_permissions=True)


def _ensure_starter_packages() -> None:
    """Create SaaS-ready starter bundles and add-ons for new tenants."""
    packages = [
        {
            "package_name": "Silver Entertainment Package",
            "package_price": 1495.0,
            "vertical_tag": "multi_service",
            "event_types": "birthday,private_party,school",
            "description": "DJ/MC core coverage with optional custom payment terms per package.",
            "items": [
                {"item": "EE-DJMC-5HR", "qty": 1, "unit_price": 1200.0},
                {"item": "EE-UPLIGHTING", "qty": 1, "unit_price": 295.0},
            ],
        },
        {
            "package_name": "Gold Celebration Package",
            "package_price": 2195.0,
            "vertical_tag": "wedding",
            "event_types": "wedding,quince,corporate",
            "description": "DJ/MC plus booth coverage; tenants can customize deposit and balance policy per package.",
            "items": [
                {"item": "EE-DJMC-5HR", "qty": 1, "unit_price": 1295.0},
                {"item": "EE-BOOTH-4HR", "qty": 1, "unit_price": 700.0},
                {"item": "EE-UPLIGHTING", "qty": 1, "unit_price": 200.0},
            ],
        },
        {
            "package_name": "Platinum Event Experience",
            "package_price": 3195.0,
            "vertical_tag": "premium",
            "event_types": "wedding,corporate,festival",
            "description": "High-capacity event package with custom terms and expanded production scope.",
            "items": [
                {"item": "EE-DJMC-5HR", "qty": 1, "unit_price": 1495.0},
                {"item": "EE-BOOTH-4HR", "qty": 1, "unit_price": 700.0},
                {"item": "EE-AVL-RENTAL", "qty": 1, "unit_price": 1000.0},
            ],
        },
    ]

    for package_def in packages:
        if frappe.db.exists("Service Package", {"package_name": package_def["package_name"]}):
            continue

        items = package_def.pop("items")
        package = frappe.get_doc(
            {
                "doctype": "Service Package",
                "active": 1,
                "currency": "USD",
                **package_def,
                "items": items,
            }
        )
        package.insert(ignore_permissions=True)


def _ensure_default_contract_template() -> None:
    """Create a default event contract template if none is active."""
    if frappe.db.exists("EE Contract Template", {"active": 1}):
        return

    body = """
<h2>Entertainment Services Agreement</h2>
<p>This agreement is between <strong>{{ company_name }}</strong> and <strong>{{ customer_name }}</strong>.</p>
<p><strong>Event Date:</strong> {{ event_date }}<br>
<strong>Venue:</strong> {{ venue_address }}</p>

<h3>Services Included</h3>
<ul>
  {% for row in service_items %}
  <li>{{ row.item_name }} - Qty {{ row.qty }}</li>
  {% endfor %}
</ul>

<p><strong>Total:</strong> {{ grand_total }}<br>
<strong>Deposit Due:</strong> {{ deposit_amount }}</p>

<h3>Client Planning and Event Operations</h3>
<p>The client portal supports contract signing, payment, and event planning updates. Final timeline and music updates should be submitted before event week.</p>

<p>By signing electronically, {{ signer_name }} agrees to the terms of service and payment policy associated with the selected package.</p>
""".strip()

    frappe.get_doc(
        {
            "doctype": "EE Contract Template",
            "template_name": "Default Mobile Entertainment Contract",
            "active": 1,
            "body": body,
        }
    ).insert(ignore_permissions=True)


def _ensure_notification_templates() -> None:
    """Create baseline notification templates used by booking, contract, and payments flows."""
    defaults = {
        "quote_sent": {
            "subject": "Your event quote from {{ company_name }}",
            "body_html": "<p>Hi {{ customer_name }}, your quote is ready. Please review and confirm your preferred package.</p>",
        },
        "contract_sent": {
            "subject": "Your contract is ready to sign",
            "body_html": "<p>Your agreement is ready. Open your secure portal link to review and sign.</p>",
        },
        "contract_signed": {
            "subject": "Contract signed confirmation",
            "body_html": "<p>Thank you. Your contract has been signed successfully.</p>",
        },
        "booking_confirmed": {
            "subject": "Your event booking is confirmed",
            "body_html": "<p>Your booking is confirmed. Next steps: payment milestones and event planning details in your portal.</p>",
        },
        "deposit_receipt": {
            "subject": "Deposit received",
            "body_html": "<p>We received your payment. Remaining balance and due dates are available in your invoice.</p>",
        },
    }

    for template_key, payload in defaults.items():
        if frappe.db.exists("Notification Template", template_key):
            continue
        frappe.get_doc(
            {
                "doctype": "Notification Template",
                "template_key": template_key,
                "active": 1,
                "subject": payload["subject"],
                "body_html": payload["body_html"],
            }
        ).insert(ignore_permissions=True)


def _ensure_tenant_admin(tenant_doc) -> None:
    email = getattr(tenant_doc, "primary_email", None) or getattr(tenant_doc, "contact_email", None)
    if not email:
        return
    if frappe.db.exists("User", email):
        # Ensure they have EE Tenant Admin role
        user = frappe.get_doc("User", email)
        role_names = [r.role for r in user.roles]
        if "EE Tenant Admin" not in role_names:
            user.append("roles", {"role": "EE Tenant Admin"})
        if not user.default_workspace:
            user.default_workspace = "Entertainment Express"
        user.save(ignore_permissions=True)
        return

    user = frappe.get_doc({
        "doctype": "User",
        "email": email,
        "first_name": tenant_doc.primary_contact or email.split("@")[0],
        "enabled": 1,
        "send_welcome_email": 0,
        # Land staff straight on the EE workspace (not the ERPNext "Home" desk).
        "default_workspace": "Entertainment Express",
        "roles": [{"role": "EE Tenant Admin"}],
    })
    user.insert(ignore_permissions=True)


def _ensure_email_defaults() -> None:
    """Placeholder — SMTP is configured via K8s secret / site config in later steps."""
    pass


# ── Helpers ──────────────────────────────────────────────────────────────────

def _make_abbr(company_name: str) -> str:
    """Generate a short abbreviation from company name (max 5 chars, uppercase)."""
    words = company_name.split()
    abbr = "".join(w[0] for w in words if w).upper()[:5]
    return abbr or "EE"
