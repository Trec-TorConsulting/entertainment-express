app_name = "entertainment_express"
app_title = "Entertainment Express"
app_publisher = "Trec-Tor Consulting"
app_description = "Multi-tenant SaaS ERP/CRM for mobile entertainment companies"
app_email = "tobey@trec-tor.com"
app_license = "Proprietary"
app_version = "0.0.1"

required_apps = ["erpnext"]

# Fixtures — export/import EE roles via bench migrate
fixtures = [
    {"dt": "Role", "filters": [["name", "like", "EE %"]]},
    {"dt": "Role", "filters": [["name", "=", "SaaS Operator"]]},
]

# After install: create custom fields on ERPNext DocTypes
after_install = "entertainment_express.setup.install.after_install"

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
    ],
    "daily": [
        # Check compliance expiry (phase-3)
        "entertainment_express.hr_workforce.scheduler.check_compliance_expiry",
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
    {"from_route": "/sign", "to_route": "sign"},
    {"from_route": "/book", "to_route": "book"},
    {"from_route": "/request-quote", "to_route": "request-quote"},
    {"from_route": "/signup", "to_route": "signup"},
]

