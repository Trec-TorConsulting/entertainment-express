"""
Custom fields injected into ERPNext's built-in DocTypes via Frappe fixtures.
Run `bench migrate` to apply. These extend Item, Quotation, Sales Invoice, Customer, Contact.
"""

# This file documents the custom fields — the actual fixture data is in
# fixtures/custom_field.json (exported by bench and version-controlled).
#
# To generate: bench --site <site> export-fixtures
# The JSON below is the authoritative source; it is applied on migrate.

CUSTOM_FIELDS = {
    # ─── Item → Service Item fields ─────────────────────────────────────────
    "Item": [
        {
            "dt": "Item",
            "fieldname": "ee_item_type",
            "fieldtype": "Select",
            "label": "EE Item Type",
            "options": "\nservice\nrental\npackage\naddon",
            "insert_after": "item_name",
            "description": "Classify this item within Entertainment Express",
        },
        {
            "dt": "Item",
            "fieldname": "ee_vertical_tag",
            "fieldtype": "Data",
            "label": "EE Vertical Tag",
            "insert_after": "ee_item_type",
            "description": "e.g. dj, inflatable, booth, game_truck",
        },
        {
            "dt": "Item",
            "fieldname": "ee_duration_minutes",
            "fieldtype": "Int",
            "label": "Default Duration (min)",
            "insert_after": "ee_vertical_tag",
        },
        {
            "dt": "Item",
            "fieldname": "ee_unit",
            "fieldtype": "Select",
            "label": "Billing Unit",
            "options": "\nevent\nhour\nday\nunit",
            "insert_after": "ee_duration_minutes",
        },
        {
            "dt": "Item",
            "fieldname": "ee_requires_asset",
            "fieldtype": "Check",
            "label": "Requires Asset",
            "insert_after": "ee_unit",
        },
        {
            "dt": "Item",
            "fieldname": "ee_requires_crew_role",
            "fieldtype": "Link",
            "label": "Required Crew Role",
            "options": "EE Crew Role",
            "insert_after": "ee_requires_asset",
            "depends_on": "eval:doc.ee_requires_asset",
        },
        {
            "dt": "Item",
            "fieldname": "ee_setup_minutes",
            "fieldtype": "Int",
            "label": "Setup Buffer (min)",
            "insert_after": "ee_requires_crew_role",
        },
        {
            "dt": "Item",
            "fieldname": "ee_teardown_minutes",
            "fieldtype": "Int",
            "label": "Teardown Buffer (min)",
            "insert_after": "ee_setup_minutes",
        },
        {
            "dt": "Item",
            "fieldname": "ee_self_bookable",
            "fieldtype": "Check",
            "label": "Self-Bookable (Portal)",
            "insert_after": "ee_teardown_minutes",
        },
        {
            "dt": "Item",
            "fieldname": "ee_event_types",
            "fieldtype": "Small Text",
            "label": "Target Event Types",
            "insert_after": "ee_self_bookable",
            "description": "Comma-separated, e.g. wedding,corporate — used to filter portal packages",
        },
    ],

    # ─── Quotation → EE Quote fields ────────────────────────────────────────
    "Quotation": [
        {
            "dt": "Quotation",
            "fieldname": "ee_event_date",
            "fieldtype": "Date",
            "label": "Event Date",
            "insert_after": "title",
        },
        {
            "dt": "Quotation",
            "fieldname": "ee_event_start",
            "fieldtype": "Time",
            "label": "Event Start Time",
            "insert_after": "ee_event_date",
        },
        {
            "dt": "Quotation",
            "fieldname": "ee_event_end",
            "fieldtype": "Time",
            "label": "Event End Time",
            "insert_after": "ee_event_start",
        },
        {
            "dt": "Quotation",
            "fieldname": "ee_timezone",
            "fieldtype": "Data",
            "label": "Event Timezone",
            "insert_after": "ee_event_end",
            "default": "America/New_York",
        },
        {
            "dt": "Quotation",
            "fieldname": "ee_venue_address",
            "fieldtype": "Small Text",
            "label": "Venue Address",
            "insert_after": "ee_timezone",
        },
        {
            "dt": "Quotation",
            "fieldname": "ee_venue_geo",
            "fieldtype": "Data",
            "label": "Venue Geo (lat,lon)",
            "insert_after": "ee_venue_address",
        },
        {
            "dt": "Quotation",
            "fieldname": "ee_service_area",
            "fieldtype": "Link",
            "label": "Service Area",
            "options": "Service Area",
            "insert_after": "ee_venue_geo",
        },
        {
            "dt": "Quotation",
            "fieldname": "ee_travel_fee",
            "fieldtype": "Currency",
            "label": "Travel Fee",
            "insert_after": "ee_service_area",
        },
        {
            "dt": "Quotation",
            "fieldname": "ee_deposit_percent",
            "fieldtype": "Float",
            "label": "Deposit %",
            "insert_after": "ee_travel_fee",
            "default": "25",
        },
        {
            "dt": "Quotation",
            "fieldname": "ee_booking",
            "fieldtype": "Link",
            "label": "Event Booking",
            "options": "Event Booking",
            "insert_after": "ee_deposit_percent",
            "read_only": 1,
        },
    ],

    # ─── Sales Invoice → EE deposit fields ──────────────────────────────────
    "Sales Invoice": [
        {
            "dt": "Sales Invoice",
            "fieldname": "ee_booking",
            "fieldtype": "Link",
            "label": "Event Booking",
            "options": "Event Booking",
            "insert_after": "customer",
        },
        {
            "dt": "Sales Invoice",
            "fieldname": "ee_is_deposit",
            "fieldtype": "Check",
            "label": "Is Deposit Invoice",
            "insert_after": "ee_booking",
        },
        {
            "dt": "Sales Invoice",
            "fieldname": "ee_event_date",
            "fieldtype": "Date",
            "label": "Event Date",
            "insert_after": "ee_is_deposit",
        },
        {
            "dt": "Sales Invoice",
            "fieldname": "ee_stripe_session_id",
            "fieldtype": "Data",
            "label": "Stripe Checkout Session",
            "insert_after": "ee_event_date",
            "read_only": 1,
        },
        {
            "dt": "Sales Invoice",
            "fieldname": "ee_is_balance",
            "fieldtype": "Check",
            "label": "Is Balance Invoice",
            "insert_after": "ee_is_deposit",
        },
        {
            "dt": "Sales Invoice",
            "fieldname": "ee_is_damage_hold",
            "fieldtype": "Check",
            "label": "Is Damage Hold",
            "insert_after": "ee_is_balance",
        },
        {
            "dt": "Sales Invoice",
            "fieldname": "ee_tip_amount",
            "fieldtype": "Currency",
            "label": "Tip Amount",
            "insert_after": "ee_is_damage_hold",
        },
        {
            "dt": "Sales Invoice",
            "fieldname": "ee_payment_intent_id",
            "fieldtype": "Data",
            "label": "Stripe PaymentIntent",
            "insert_after": "ee_stripe_session_id",
            "read_only": 1,
        },
    ],

    "Payment Entry": [
        {
            "dt": "Payment Entry",
            "fieldname": "ee_processor",
            "fieldtype": "Select",
            "label": "EE Processor",
            "options": "\nstripe\nsquare\npaypal\nach\nauthorizenet\nmanual",
            "insert_after": "mode_of_payment",
        },
        {
            "dt": "Payment Entry",
            "fieldname": "ee_processor_txn_id",
            "fieldtype": "Data",
            "label": "Processor Transaction ID",
            "insert_after": "ee_processor",
        },
        {
            "dt": "Payment Entry",
            "fieldname": "ee_tip_amount",
            "fieldtype": "Currency",
            "label": "Tip Amount",
            "insert_after": "ee_processor_txn_id",
        },
    ],

    # ─── Customer → EE fields ────────────────────────────────────────────────
    "Customer": [
        {
            "dt": "Customer",
            "fieldname": "ee_source",
            "fieldtype": "Select",
            "label": "EE Source",
            "options": "\nbooking_site\nreferral\nstaff\nimport",
            "insert_after": "customer_name",
        },
        {
            "dt": "Customer",
            "fieldname": "ee_lead",
            "fieldtype": "Link",
            "label": "Source Lead",
            "options": "Lead",
            "insert_after": "ee_source",
        },
    ],
    # ─── Employee → EE Crew fields (phase-2) ────────────────────────────────────
    "Employee": [
        {
            "dt": "Employee",
            "fieldname": "ee_employment_type",
            "fieldtype": "Select",
            "label": "EE Employment Type",
            "options": "\nw2\n1099\nvolunteer",
            "insert_after": "employment_type",
        },
        {
            "dt": "Employee",
            "fieldname": "ee_crew_roles",
            "fieldtype": "Small Text",
            "label": "EE Crew Roles",
            "insert_after": "ee_employment_type",
            "description": "Comma-separated EE Crew Role names this worker holds, e.g. DJ,MC",
        },
        {
            "dt": "Employee",
            "fieldname": "ee_home_base",
            "fieldtype": "Data",
            "label": "Home Base / Warehouse",
            "insert_after": "ee_crew_roles",
        },
        {
            "dt": "Employee",
            "fieldname": "ee_service_areas",
            "fieldtype": "Small Text",
            "label": "EE Service Areas",
            "insert_after": "ee_home_base",
            "description": "Comma-separated Service Area names this worker covers",
        },
        {
            "dt": "Employee",
            "fieldname": "ee_pay_basis",
            "fieldtype": "Select",
            "label": "Default Pay Basis",
            "options": "\nper_event\nhourly\nsalary",
            "insert_after": "ee_service_areas",
        },
        {
            "dt": "Employee",
            "fieldname": "ee_default_pay_rate",
            "fieldtype": "Currency",
            "label": "Default Pay Rate",
            "insert_after": "ee_pay_basis",
            "description": "Per-event flat rate or hourly rate",
        },
    ],

    # ─── Event Booking → dispatch status (phase-2) ──────────────────────────────
    "Event Booking": [
        {
            "dt": "Event Booking",
            "fieldname": "ee_dispatch_status",
            "fieldtype": "Select",
            "label": "Dispatch Status",
            "options": "draft\ndispatched\nin_progress\ncompleted",
            "default": "draft",
            "insert_after": "status",
            "in_list_view": 0,
        },
    ],

    # ─── Timesheet Detail → EE fields (phase-3) ────────────────────────────────
    "Timesheet Detail": [
        {
            "dt": "Timesheet Detail",
            "fieldname": "ee_booking",
            "fieldtype": "Link",
            "label": "Event Booking",
            "options": "Event Booking",
            "insert_after": "task",
        },
        {
            "dt": "Timesheet Detail",
            "fieldname": "ee_crew_role",
            "fieldtype": "Link",
            "label": "Crew Role",
            "options": "EE Crew Role",
            "insert_after": "ee_booking",
        },
        {
            "dt": "Timesheet Detail",
            "fieldname": "ee_bill_rate",
            "fieldtype": "Currency",
            "label": "Bill Rate (override)",
            "insert_after": "ee_crew_role",
            "description": "Hourly rate for this shift; overrides employee default",
        },
        {
            "dt": "Timesheet Detail",
            "fieldname": "ee_approved",
            "fieldtype": "Check",
            "label": "Approved",
            "default": "0",
            "insert_after": "ee_bill_rate",
        },
    ],
}
