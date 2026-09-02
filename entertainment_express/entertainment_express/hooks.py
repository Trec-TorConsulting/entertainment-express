app_name = "entertainment_express"
app_title = "Entertainment Express"
app_publisher = "Trec-Tor Consulting"
app_description = "Multi-tenant SaaS ERP/CRM for mobile entertainment companies"
app_email = "tobey@trec-tor.com"
app_license = "Proprietary"
app_version = "0.0.1"

required_apps = ["erpnext"]

# Public site root + post-login landing. The function resolves per-site: EE SaaS
# marketing on the control plane, the tenant's own branded landing on tenant
# sites, and the /client portal for logged-in customers. Staff still go to /app
# on login (Frappe handles that), so this only governs the public root.
get_website_user_home_page = "entertainment_express.security.request_guards.get_website_user_home_page"

update_website_context = [
    "entertainment_express.www.branding.update_website_context",
]

# Runtime boundary: Desk/backend is internal-only and backend URLs are branded EE-only.
before_request = [
    "entertainment_express.security.auth_hardening.check_login_lockout",
    "entertainment_express.security.auth_hardening.enforce_privileged_2fa",
    "entertainment_express.security.request_guards.enforce_tenant_suspension",
    "entertainment_express.security.request_guards.sanitize_backend_urls",
    "entertainment_express.security.request_guards.enforce_backend_boundary",
]

# Whitelisted method overrides
override_whitelisted_methods = {
    "ping": "entertainment_express.api.health.ping",
    "frappe.desk.desktop.get_workspace_sidebar_items": "entertainment_express.security.workspace_ui.get_workspace_sidebar_items",
}

on_login = "entertainment_express.security.auth_hardening.clear_login_failures"

# Fixtures — export/import EE roles via bench migrate
fixtures = [
    {"dt": "Role", "filters": [["name", "like", "EE %"]]},
    {"dt": "Role", "filters": [["name", "=", "SaaS Operator"]]},
    {
        "dt": "Custom Field",
        "filters": [
            [
                "name",
                "in",
                [
                    "Lead-ee_lead_type",
                    "Lead-ee_vertical_interest",
                    "Lead-ee_source_page",
                    "Lead-ee_utm_source",
                    "Lead-ee_utm_medium",
                    "Lead-ee_utm_campaign",
                    "Lead-ee_utm_term",
                    "Lead-ee_utm_content",
                    "Lead-ee_referrer",
                    "Lead-ee_consent_marketing",
                    "Lead-ee_consent_at",
                    "Lead-ee_spam_score",
                    "Lead-ee_lead_score",
                    "Signup Application-ee_utm_source",
                    "Signup Application-ee_utm_medium",
                    "Signup Application-ee_utm_campaign",
                    "Signup Application-ee_source_page",
                    "Signup Application-ee_origin_lead",
                ],
            ]
        ],
    },
    {"dt": "Email Group", "filters": [["name", "=", "EE Newsletter"]]},
    {"dt": "Marketing Settings", "filters": [["name", "=", "Marketing Settings"]]},
    {"dt": "EE Portal Settings", "filters": [["name", "=", "EE Portal Settings"]]},
]

# After install: create custom fields on ERPNext DocTypes
after_install = "entertainment_express.setup.install.after_install"

# After every migrate: hide ERPNext/Frappe desk onboarding so tenants never see
# the "journey with ERPNext" guide (white-label).
after_migrate = [
    "entertainment_express.setup.onboarding.hide_third_party_onboarding",
    "entertainment_express.setup.install.create_all",
]

# Scheduled tasks
scheduler_events = {
    "all": [
        # Expire booking holds every minute
        "entertainment_express.api.booking.expire_holds",
    ],
    "hourly": [
        # Expire overdue contracts
        "entertainment_express.api.contract_scheduler.expire_contracts",
        # Flag at-risk events (no crew within 48h)
        "entertainment_express.scheduling_dispatch.scheduler.flag_at_risk_events",
        "entertainment_express.notifications.retry_failed",
        "entertainment_express.api.saas_billing.apply_dunning",
        "entertainment_express.api.saas_billing.apply_cancellations",
        "entertainment_express.integrations.calendar.pull",
    ],
    "daily": [
        # Check compliance expiry (phase-3)
        "entertainment_express.hr_workforce.scheduler.check_compliance_expiry",
        "entertainment_express.event_planning.scheduler.send_form_reminders",
        "entertainment_express.api.billing.send_balance_reminders",
        "entertainment_express.api.billing.charge_due_installments",
        "entertainment_express.api.workflow.run_daily",
        "entertainment_express.api.appointments.run_daily",
        "entertainment_express.api.compliance.run_daily",
        "entertainment_express.api.engagement.run_lifecycle",
        "entertainment_express.api.portal_reports.run_schedules",
        "entertainment_express.notifications.send_deferred",
        "entertainment_express.equipment_fleet.scheduler.daily_fleet_alerts",
        "entertainment_express.control_plane.metering.collect_all_tenants",
    ],
    "cron": {
        "0 9 * * *": [
            # Flag overdue payouts at 9 AM daily (phase-3)
            "entertainment_express.hr_workforce.scheduler.flag_overdue_payouts",
        ]
    }
}

# Whitelisted methods (in addition to @frappe.whitelist decorators)
# Portal menu items (added in phase-7 customer portal)
# standard_portal_menu_items = []

# Website route rules (added in phase-1 www pages)
website_route_rules = [
    {"from_route": "/book", "to_route": "book"},
    {"from_route": "/schedule", "to_route": "schedule"},
    {"from_route": "/request-quote", "to_route": "request-quote"},
    {"from_route": "/signup", "to_route": "signup"},
    {"from_route": "/owner/<path:app_path>", "to_route": "owner"},
    {"from_route": "/employee/<path:app_path>", "to_route": "employee"},
    {"from_route": "/client/<path:app_path>", "to_route": "client"},
    # Phase-4 React SPAs — deep links stay on the shell page
    {"from_route": "/customer", "to_route": "customer"},
    {"from_route": "/customer/<path:app_path>", "to_route": "customer"},
    {"from_route": "/dispatch", "to_route": "dispatch"},
    {"from_route": "/dispatch/<path:app_path>", "to_route": "dispatch"},
    {"from_route": "/solutions/djs", "to_route": "solutions?vertical=djs"},
    {"from_route": "/solutions/rentals", "to_route": "solutions?vertical=rentals"},
    {"from_route": "/solutions/photo-booths", "to_route": "solutions?vertical=photo-booths"},
    {"from_route": "/solutions/game-trucks", "to_route": "solutions?vertical=game-trucks"},
    {"from_route": "/solutions/casino", "to_route": "solutions?vertical=casino"},
    {"from_route": "/solutions/performers", "to_route": "solutions?vertical=performers"},
    {"from_route": "/start-trial", "to_route": "start_trial"},
    {"from_route": "/resources", "to_route": "resources"},
    {"from_route": "/guest-requests", "to_route": "guest_requests"},
]

doc_events = {
    "Event Booking": {
        "on_update": [
            "entertainment_express.event_planning.attach.on_booking_update",
            "entertainment_express.integrations.calendar.on_booking_update",
            "entertainment_express.security.auth_hardening.on_booking_update",
        ],
    },
    "Lead": {
        "after_insert": "entertainment_express.api.ai.on_lead_insert",
    },
    "Sales Invoice": {
        "on_submit": [
            "entertainment_express.integrations.accounting.on_invoice_submit",
            "entertainment_express.security.auth_hardening.on_invoice_submit",
        ],
        "on_update": "entertainment_express.integrations.accounting.on_invoice_update",
    },
    "EE Contract": {
        "on_update": "entertainment_express.security.auth_hardening.on_contract_update",
    },
}

# Permanent redirects for renamed public routes.
website_redirects = [
    {"source": "/learn", "target": "/resources"},
    {"source": "/request-demo", "target": "/demo"},
    {"source": "/sign", "target": "/client/sign"},
]

