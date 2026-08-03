app_name = "entertainment_express"
app_title = "Entertainment Express"
app_publisher = "Trec-Tor Consulting"
app_description = "Multi-tenant SaaS ERP/CRM for mobile entertainment companies"
app_email = "tobey@trec-tor.com"
app_license = "Proprietary"
app_version = "0.0.1"

required_apps = ["erpnext"]

# Runtime boundary: Desk/backend is internal-only and backend URLs are branded EE-only.
before_request = [
    "entertainment_express.security.request_guards.sanitize_backend_urls",
    "entertainment_express.security.request_guards.enforce_backend_boundary",
]

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
    {"from_route": "/book", "to_route": "book"},
    {"from_route": "/request-quote", "to_route": "request-quote"},
    {"from_route": "/signup", "to_route": "signup"},
    {"from_route": "/solutions/djs", "to_route": "solutions?vertical=djs"},
    {"from_route": "/solutions/rentals", "to_route": "solutions?vertical=rentals"},
    {"from_route": "/solutions/photo-booths", "to_route": "solutions?vertical=photo-booths"},
    {"from_route": "/solutions/game-trucks", "to_route": "solutions?vertical=game-trucks"},
    {"from_route": "/solutions/casino", "to_route": "solutions?vertical=casino"},
    {"from_route": "/solutions/performers", "to_route": "solutions?vertical=performers"},
    {"from_route": "/start-trial", "to_route": "start_trial"},
    {"from_route": "/resources", "to_route": "resources"},
]

# Permanent redirects for renamed public routes.
website_redirects = [
    {"source": "/learn", "target": "/resources"},
    {"source": "/request-demo", "target": "/demo"},
    {"source": "/sign", "target": "/client/sign"},
]

